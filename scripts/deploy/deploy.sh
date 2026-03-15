#!/usr/bin/env sh
set -eu

TARGET="${1:-}"
ENV_FILE="${2:-}"

if [ -z "$TARGET" ] || [ -z "$ENV_FILE" ]; then
  echo "usage: sh ./scripts/deploy/deploy.sh <staging|production> <env-file>" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "env file not found: $ENV_FILE" >&2
  exit 1
fi

case "$TARGET" in
  staging|production)
    ;;
  *)
    echo "unsupported deploy target: $TARGET" >&2
    exit 1
    ;;
esac

docker compose \
  -f ops/deploy/docker-compose.yml \
  --env-file "$ENV_FILE" \
  pull

docker compose \
  -f ops/deploy/docker-compose.yml \
  --env-file "$ENV_FILE" \
  up -d --remove-orphans
