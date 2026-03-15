#!/usr/bin/env sh
set -eu

exec docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$(pwd)":/workspace \
  -w /workspace \
  arigaio/atlas:v1.1.0 \
  "$@"
