#!/usr/bin/env bash
set -euo pipefail

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun is required. Install from https://bun.sh" >&2
  exit 1
fi

echo "Installing workspace dependencies..."
bun install

echo "Setup complete. Use 'bun run dev' to start the PWA prototype."
