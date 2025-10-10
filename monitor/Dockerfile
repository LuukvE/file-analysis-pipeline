FROM grafana/grafana:10.4.5-ubuntu

ENV DEBIAN_FRONTEND=noninteractive

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends prometheus && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY monitor/run.sh /usr/local/bin/run-monitor.sh
RUN chmod +x /usr/local/bin/run-monitor.sh

COPY monitor/grafana.yml /etc/grafana/provisioning/datasources/prometheus.yml
COPY monitor/prometheus.yml /etc/prometheus/prometheus.yml
COPY monitor/dashboards.yml /etc/grafana/provisioning/dashboards/dashboards.yml
COPY monitor/dashboard.json /etc/grafana/provisioning/dashboards/dashboard.json
COPY monitor/grafana.ini /etc/grafana/grafana.ini

EXPOSE 3000 9090

ENTRYPOINT ["/usr/local/bin/run-monitor.sh"]
