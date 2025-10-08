FROM localstack/localstack:latest
RUN apt-get install -y jq
COPY ./ /etc/localstack/init/ready.d/
ENV DEBUG=0
ENV ENFORCE_IAM=1
ENV LS_LOG=error
ENV DISABLE_EDGE_LOGS=1
ENV SERVICES=iam,s3,dynamodb,secretsmanager
RUN chmod +x /etc/localstack/init/ready.d/*.sh
