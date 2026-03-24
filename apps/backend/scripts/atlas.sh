#!/usr/bin/env sh
set -eu

ATLAS_IMAGE="${ATLAS_IMAGE:-arigaio/atlas:latest}"

if [ -n "${ATLAS_VAR_db_url:-}" ]; then
  exec docker run --rm \
    --add-host=host.docker.internal:host-gateway \
    -e "ATLAS_VAR_db_url=$ATLAS_VAR_db_url" \
    -v "$(pwd)":/workspace \
    -w /workspace \
    "$ATLAS_IMAGE" \
    "$@"
fi

exec docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$(pwd)":/workspace \
  -w /workspace \
  "$ATLAS_IMAGE" \
  "$@"
