#!/bin/bash

SERVER_SECRETS=$(cat <<EOF
{
  "foo": "bar"
}
EOF
)

awslocal secretsmanager create-secret \
  --name server-secrets \
  --secret-string "$SERVER_SECRETS" \
  --region eu-west-1 \
  >/dev/null

PROCESSOR_SECRETS=$(cat <<EOF
{
  "foo": "bar"
}
EOF
)

awslocal secretsmanager create-secret \
  --name processor-secrets \
  --secret-string "$PROCESSOR_SECRETS" \
  --region eu-west-1 \
  >/dev/null
