FROM localstack/localstack:latest
RUN apt-get install -y jq
COPY ./ /etc/localstack/init/ready.d/
RUN chmod +x /etc/localstack/init/ready.d/*.sh
