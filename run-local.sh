#!/bin/bash

AWS_PROFILE="default"

export AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id --profile $AWS_PROFILE)
export AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key --profile $AWS_PROFILE)
export AWS_REGION=$(aws configure get region --profile $AWS_PROFILE)

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "Error: No AWS credentials"
    exit 1
fi

docker-compose up --build

unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_REGION
