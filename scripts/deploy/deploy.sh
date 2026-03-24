#!/usr/bin/env sh
set -eu

TARGET="${1:-}"
ENV_FILE="${2:-}"

if [ -z "$TARGET" ] || [ -z "$ENV_FILE" ]; then
  echo "usage: sh ./scripts/deploy/deploy.sh <local|staging|production> <env-file>" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "env file not found: $ENV_FILE" >&2
  exit 1
fi

case "$TARGET" in
  local|development)
    ;;
  staging|production)
    ;;
  *)
    echo "unsupported deploy target: $TARGET" >&2
    exit 1
    ;;
esac

node ./scripts/deploy/check-env.mjs "$ENV_FILE"

compose() {
  docker compose -f ops/deploy/docker-compose.yml --env-file "$ENV_FILE" "$@"
}

compose config >/dev/null

if [ "$TARGET" != "local" ] && [ "$TARGET" != "development" ] && [ "${SKIP_DEPLOY_PULL:-0}" != "1" ]; then
  compose pull
fi

compose up -d postgres redis

if [ "${SKIP_DEPLOY_MIGRATIONS:-0}" != "1" ]; then
  POSTGRES_CONTAINER_ID="$(compose ps -q postgres)"
  if [ -z "$POSTGRES_CONTAINER_ID" ]; then
    echo "postgres container id not found" >&2
    exit 1
  fi

  WAIT_SECONDS=60
  ELAPSED=0
  while [ "$ELAPSED" -lt "$WAIT_SECONDS" ]; do
    HEALTH_STATUS="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$POSTGRES_CONTAINER_ID" 2>/dev/null || true)"
    if [ "$HEALTH_STATUS" = "healthy" ]; then
      break
    fi

    sleep 2
    ELAPSED=$((ELAPSED + 2))
  done

  if [ "$HEALTH_STATUS" != "healthy" ]; then
    echo "postgres did not become healthy in ${WAIT_SECONDS}s" >&2
    exit 1
  fi

  node ./scripts/deploy/apply-migrations.mjs "$ENV_FILE"
fi

compose up -d --remove-orphans

if [ "${SKIP_DEPLOY_SMOKE:-0}" != "1" ]; then
  node ./scripts/deploy/post-deploy-smoke.mjs "$ENV_FILE"
fi
