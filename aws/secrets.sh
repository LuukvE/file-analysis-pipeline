#!/bin/bash

awslocal secretsmanager create-secret \
  --name server-secrets \
  --secret-string "$(cat "$(dirname "$0")/secrets.server.json")" \
  --region eu-west-1 \
  >/dev/null

awslocal secretsmanager create-secret \
  --name processor-secrets \
  --secret-string "$(cat "$(dirname "$0")/secrets.processor.json")" \
  --region eu-west-1 \
  >/dev/null
