#!/usr/bin/env bash

set -euo pipefail

# Change to repository root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

echo "Running in $(pwd)"

IMAGE_NAME="mcr.microsoft.com/playwright"
IMAGE_TAG="v1.49.0-jammy" # This version have to be synchronized with playwright version from package.json

PNPM_STORE_CACHE_DIR="$HOME/.cache/markdown-editor-playwright-docker-pnpm-store"
NODE_MODULES_CACHE_DIR="$HOME/.cache/markdown-editor-playwright-docker-node-modules"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

run_command() {
  $CONTAINER_TOOL run --rm --network host -it -w /work \
    -v $(pwd):/work \
    -v "$NODE_MODULES_CACHE_DIR:/work/node_modules" \
    -e IS_DOCKER=1 \
    -e NODE_OPTIONS="--max-old-space-size=8192" \
    "$IMAGE_NAME:$IMAGE_TAG" \
    /bin/bash -c "$*"
}

if command_exists podman; then
  CONTAINER_TOOL="podman"
elif command_exists docker; then
  CONTAINER_TOOL="docker"
else
  echo "Neither Podman nor Docker is installed on the system."
  exit 1
fi

if [[ "$1" = "clear" ]]; then
  rm -rf "$NODE_MODULES_CACHE_DIR"
  rm -rf "./demo/tests/playwright/.cache-docker"
  exit 0
fi

init_pnpm() {
  run_command 'COREPACK_INTEGRITY_KEYS=0 corepack pnpm -v'
  run_command "COREPACK_INTEGRITY_KEYS=0 corepack pnpm config set store-dir $PNPM_STORE_CACHE_DIR"
}

if [[ ! -d "$NODE_MODULES_CACHE_DIR" ]]; then
  mkdir -p "$NODE_MODULES_CACHE_DIR"
  init_pnpm
  run_command "COREPACK_INTEGRITY_KEYS=0 corepack pnpm i --frozen-lockfile"
else
  init_pnpm
fi

if [[ "$1" = "test" ]]; then
  echo "Running playwright tests"
  run_command 'COREPACK_INTEGRITY_KEYS=0 corepack pnpm --filter '@gravity-ui/*' build'
  run_command 'COREPACK_INTEGRITY_KEYS=0 corepack pnpm --filter '@markdown-editor/demo' run playwright'
  exit 0
fi

if [[ "$1" = "update" ]]; then
  echo "Running playwright tests (update)"
  run_command 'COREPACK_INTEGRITY_KEYS=0 corepack pnpm --filter '@gravity-ui/*' build'
  run_command 'COREPACK_INTEGRITY_KEYS=0 corepack pnpm --filter '@markdown-editor/demo' run playwright:update'
  exit 0
fi

echo "Unknown command: $1"
exit 1
