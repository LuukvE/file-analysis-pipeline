FROM localstack/localstack:latest
RUN apt-get install -y jq
COPY aws/ /etc/localstack/init/ready.d/
COPY secrets.server.json /etc/localstack/init/ready.d/secrets.server.json
COPY secrets.processor.json /etc/localstack/init/ready.d/secrets.processor.json
ENV DEBUG=0
ENV ENFORCE_IAM=1
ENV LS_LOG=error
ENV DISABLE_EDGE_LOGS=1
ENV SERVICES=iam,s3,dynamodb,secretsmanager
RUN chmod +x /etc/localstack/init/ready.d/*.sh
