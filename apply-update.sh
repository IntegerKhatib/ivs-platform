#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-$HOME/ivs-platform}"
SOURCE="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -d "$TARGET/frontend" || ! -d "$TARGET/backend" ]]; then
  echo "Project not found at: $TARGET" >&2
  exit 1
fi
cp -R "$SOURCE/frontend/." "$TARGET/frontend/"
cp -R "$SOURCE/backend/." "$TARGET/backend/"
echo "Fixed EMP recording update applied to $TARGET"
echo "Next: cd $TARGET && sudo docker compose down && sudo docker compose build --no-cache && sudo docker compose up -d"
