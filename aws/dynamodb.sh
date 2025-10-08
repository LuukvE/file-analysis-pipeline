#!/bin/bash

awslocal dynamodb create-table \
    --table-name jobs \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region eu-west-1 \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_IMAGE \
    >/dev/null

awslocal dynamodb create-table \
    --table-name results \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region eu-west-1 \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_IMAGE \
    >/dev/null
