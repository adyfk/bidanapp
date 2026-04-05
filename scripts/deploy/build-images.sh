#!/usr/bin/env sh
set -eu

ENV_FILE="${1:-}"

if [ -z "$ENV_FILE" ]; then
  echo "usage: sh ./scripts/deploy/build-images.sh <env-file>" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "env file not found: $ENV_FILE" >&2
  exit 1
fi

node ./scripts/deploy/check-env.mjs "$ENV_FILE"

set -a
. "$ENV_FILE"
set +a

: "${APP_VERSION:=dev}"
: "${BACKEND_IMAGE:=bidanapp-backend:local}"
: "${FRONTEND_IMAGE:=bidanapp-frontend:local}"
: "${PUBLIC_SITE_URL:=http://localhost:${FRONTEND_PORT:-3000}}"
: "${PUBLIC_API_BASE_URL:=http://localhost:${BACKEND_PORT:-8080}/api/v1}"
: "${NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED:=false}"
: "${NEXT_PUBLIC_ADMIN_STUDIO_ENABLED:=false}"
: "${NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY:=}"

OCI_CREATED="${OCI_CREATED:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"
OCI_REVISION="${OCI_REVISION:-$(git rev-parse --verify HEAD 2>/dev/null || printf '%s' local)}"
OCI_SOURCE="${OCI_SOURCE:-local}"
OCI_VERSION="${OCI_VERSION:-$APP_VERSION}"

docker build -f apps/backend/Dockerfile \
  --build-arg OCI_CREATED="$OCI_CREATED" \
  --build-arg OCI_REVISION="$OCI_REVISION" \
  --build-arg OCI_SOURCE="$OCI_SOURCE" \
  --build-arg OCI_VERSION="$OCI_VERSION" \
  -t "$BACKEND_IMAGE" .

docker build -f apps/frontend/Dockerfile \
  --build-arg NEXT_PUBLIC_SITE_URL="$PUBLIC_SITE_URL" \
  --build-arg NEXT_PUBLIC_API_BASE_URL="$PUBLIC_API_BASE_URL" \
  --build-arg NEXT_PUBLIC_APP_VERSION="$APP_VERSION" \
  --build-arg NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED="$NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED" \
  --build-arg NEXT_PUBLIC_ADMIN_STUDIO_ENABLED="$NEXT_PUBLIC_ADMIN_STUDIO_ENABLED" \
  --build-arg NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY="$NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY" \
  --build-arg OCI_CREATED="$OCI_CREATED" \
  --build-arg OCI_REVISION="$OCI_REVISION" \
  --build-arg OCI_SOURCE="$OCI_SOURCE" \
  --build-arg OCI_VERSION="$OCI_VERSION" \
  -t "$FRONTEND_IMAGE" .
