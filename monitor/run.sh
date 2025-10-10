#!/bin/bash
set -e

/usr/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus &

/run.sh &

wait -n
