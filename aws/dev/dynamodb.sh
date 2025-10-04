#!/bin/bash

if [ -d "/var/lib/localstack/state/dynamodb" ]; then
  rm -rf "/var/lib/localstack/state/dynamodb"
fi

if [ -d "/var/lib/localstack/state/kinesis" ]; then
  rm -rf "/var/lib/localstack/state/kinesis"
fi

awslocal dynamodb create-table \
    --table-name jobs \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region eu-west-1 \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_IMAGE

awslocal dynamodb create-table \
    --table-name results \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region eu-west-1 \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_IMAGE