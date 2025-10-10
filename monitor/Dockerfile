FROM grafana/grafana:10.4.5

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends prometheus supervisor \
    && rm -rf /var/lib/apt/lists/*

COPY prometheus/prometheus.yml /etc/prometheus/prometheus.yml

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN mkdir -p /etc/grafana/provisioning/datasources /etc/grafana/provisioning/dashboards

EXPOSE 8082 8081

VOLUME ["/var/lib/grafana", "/var/lib/prometheus"]

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
