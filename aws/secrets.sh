SERVER_SECRETS=$(cat <<EOF
{
  "foo": "bar"
}
EOF
)

awslocal secretsmanager create-secret --name server-secrets --secret-string "$SERVER_SECRETS"

PROCESSOR_SECRETS=$(cat <<EOF
{
  "foo": "bar"
}
EOF
)

awslocal secretsmanager create-secret --name processor-secrets --secret-string "$PROCESSOR_SECRETS"
