#!/bin/bash

if [ "$1" = "clean" ]; then
  docker ps -a -q | xargs -r docker rm -f
  rm -rf ./aws/data/*/
  rm -f ./.env
  exit 0
fi

if [ "$1" = "down" ]; then
  docker compose --profile dev down
  exit 0
fi

set -e

if [ ! -f "./.env" ]; then
  docker compose up -d setup --force-recreate
  while ! docker compose logs --no-log-prefix setup | grep -q "Ready."; do
    sleep 1
  done
  docker compose stop setup
  docker compose rm -f setup
fi

trap "docker compose --profile dev down" SIGINT SIGTERM

docker compose --profile dev up --build --force-recreate
