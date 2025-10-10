FROM grafana/grafana:10.4.5-ubuntu

ENV DEBIAN_FRONTEND=noninteractive

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends prometheus && \
    chown -R prometheus:prometheus /var/lib/prometheus && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 9090

USER prometheus

ENTRYPOINT [""]

CMD [ "/usr/bin/prometheus", \
    "--config.file=/etc/prometheus/prometheus.yml", \
    "--storage.tsdb.path=/var/lib/prometheus" ]