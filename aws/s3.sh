#!/bin/bash

awslocal s3 mb s3://bucket-file-analysis-pipeline \
    --region eu-west-1 \
    >/dev/null
