#!/bin/bash

REGION="eu-west-1"
ENDPOINT_URL="http://localhost.localstack.cloud:4566"
ACCOUNT_ID=$(aws --endpoint-url=$ENDPOINT_URL sts get-caller-identity --query "Account" --output text)

CLUSTER="nestjs-cluster"
SERVICE="nestjs-service"
TASK_DEF="nestjs-task"
CONTAINER="nestjs-container"
IMAGE="nestjs-server:latest"

CPU=256
MEMORY=512
PORT=3000

EXEC_ROLE="ecsTaskExecutionRole"

awslocal() {
    aws --endpoint-url=$ENDPOINT_URL --region=$REGION "$@"
}

if ! awslocal iam get-role --role-name $EXEC_ROLE > /dev/null 2>&1; then
    awslocal iam create-role \
      --role-name $EXEC_ROLE \
      --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Sid": "",
          "Effect": "Allow",
          "Principal": {
            "Service": "ecs-tasks.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }]
      }'

    awslocal iam attach-role-policy \
      --role-name $EXEC_ROLE \
      --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
fi

EXEC_ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$EXEC_ROLE"

awslocal ecs create-cluster --cluster-name $CLUSTER

TASK_DEF_JSON=$(cat <<EOF
{
    "family": "$TASK_DEF",
    "executionRoleArn": "$EXEC_ROLE_ARN",
    "networkMode": "awsvpc",
    "containerDefinitions": [
        {
            "name": "$CONTAINER",
            "image": "$IMAGE",
            "cpu": $CPU,
            "memory": $MEMORY,
            "portMappings": [
                {
                    "containerPort": $PORT,
                    "hostPort": $PORT,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/$TASK_DEF",
                    "awslogs-region": "$REGION",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ],
    "requiresCompatibilities": [
        "FARGATE"
    ],
    "cpu": "$CPU",
    "memory": "$MEMORY"
}
EOF
)
awslocal ecs register-task-definition --cli-input-json "$TASK_DEF_JSON"

awslocal logs create-log-group --log-group-name "/ecs/$TASK_DEF"

VPC_ID=$(awslocal ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
if [ -z "$VPC_ID" ]; then
    echo "Error: Could not find a default VPC."
    exit 1
fi

SUBNETS=$(awslocal ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID --query 'Subnets[0:2].SubnetId' --output json)
if [ -z "$SUBNETS" ] || [ "$SUBNETS" == "[]" ]; then
    echo "Error: Could not find any subnets in the default VPC."
    exit 1
fi

SG_ID=$(awslocal ec2 describe-security-groups --filters Name=vpc-id,Values=$VPC_ID Name=group-name,Values=default --query 'SecurityGroups[0].GroupId' --output text)
if [ -z "$SG_ID" ]; then
    echo "Error: Could not find the default security group in the VPC."
    exit 1
fi

NET_CONFIG=$(cat <<EOF
{
    "awsvpcConfiguration": {
        "subnets": $SUBNETS,
        "securityGroups": ["$SG_ID"],
        "assignPublicIp": "ENABLED"
    }
}
EOF
)

awslocal ecs create-service \
  --cluster $CLUSTER \
  --service-name "$SERVICE" \
  --task-definition "$TASK_DEF" \
  --desired-count 1 \
  --launch-type "FARGATE" \
  --network-configuration "$NET_CONFIG"
