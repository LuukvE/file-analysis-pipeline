#!/bin/bash
set -e

SERVER_ENV="/config/.env.server"

> $SERVER_ENV

echo "AWS_REGION=eu-west-1" >> $SERVER_ENV

echo "AWS_ENDPOINT_URL=http://aws:4566" >> $SERVER_ENV


awslocal iam create-policy \
    --policy-name server-policy \
    --policy-document file:///etc/localstack/init/ready.d/policies/server-policy.json \
     >/dev/null

awslocal iam create-user \
    --user-name server \
    >/dev/null

awslocal iam attach-user-policy \
    --user-name server \
    --policy-arn arn:aws:iam::000000000000:policy/server-policy \
     >/dev/null

SERVER_KEYS=$(awslocal iam create-access-key --user-name server --output json)

echo "AWS_ACCESS_KEY_ID=$(echo "$SERVER_KEYS" | jq -r '.AccessKey.AccessKeyId')" >> $SERVER_ENV

echo "AWS_SECRET_ACCESS_KEY=$(echo "$SERVER_KEYS" | jq -r '.AccessKey.SecretAccessKey')" >> $SERVER_ENV

PROCESSOR_ENV="/config/.env.processor"

> $PROCESSOR_ENV

echo "AWS_REGION=eu-west-1" >> $PROCESSOR_ENV

echo "AWS_ENDPOINT_URL=http://aws:4566" >> $PROCESSOR_ENV

awslocal iam create-policy \
    --policy-name processor-policy \
    --policy-document file:///etc/localstack/init/ready.d/policies/processor-policy.json \
     >/dev/null

awslocal iam create-user \
    --user-name processor \
    >/dev/null

awslocal iam attach-user-policy \
    --user-name processor \
    --policy-arn arn:aws:iam::000000000000:policy/processor-policy \
     >/dev/null

PROCESSOR_KEYS=$(awslocal iam create-access-key --user-name processor --output json)

echo "AWS_ACCESS_KEY_ID=$(echo "$SERVER_KEYS" | jq -r '.AccessKey.AccessKeyId')" >> $PROCESSOR_ENV

echo "AWS_SECRET_ACCESS_KEY=$(echo "$SERVER_KEYS" | jq -r '.AccessKey.SecretAccessKey')" >> $PROCESSOR_ENV
