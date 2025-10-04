#!/bin/bash
set -e

ENV_FILE="/monorepo/.env"

if [ -f "$ENV_FILE" ]; then
    exit 0
fi

echo "AWS_REGION=eu-west-1" >> $ENV_FILE
echo "AWS_ENDPOINT_URL=http://localhost:4566" >> $ENV_FILE

awslocal iam create-policy --policy-name server-policy --policy-document file:///etc/localstack/init/ready.d/policies/server-policy.json
awslocal iam create-user --user-name server
awslocal iam attach-user-policy --user-name server --policy-arn arn:aws:iam::000000000000:policy/server-policy

SERVER_KEYS=$(awslocal iam create-access-key --user-name server --output text)
ACCESS_KEY_ID=$(echo $SERVER_KEYS | awk '{print $2}')
SECRET_ACCESS_KEY=$(echo $SERVER_KEYS | awk '{print $4}')

echo "SERVER_AWS_ACCESS_KEY_ID=${ACCESS_KEY_ID}" >> $ENV_FILE
echo "SERVER_AWS_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}" >> $ENV_FILE

awslocal iam create-policy --policy-name processor-policy --policy-document file:///etc/localstack/init/ready.d/policies/processor-policy.json
awslocal iam create-user --user-name processor
awslocal iam attach-user-policy --user-name processor --policy-arn arn:aws:iam::000000000000:policy/processor-policy

PROCESSOR_KEYS=$(awslocal iam create-access-key --user-name processor --output text)
ACCESS_KEY_ID=$(echo $PROCESSOR_KEYS | awk '{print $2}')
SECRET_ACCESS_KEY=$(echo $PROCESSOR_KEYS | awk '{print $4}')

echo "PROCESSOR_AWS_ACCESS_KEY_ID=${ACCESS_KEY_ID}" >> $ENV_FILE
echo "PROCESSOR_AWS_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}" >> $ENV_FILE