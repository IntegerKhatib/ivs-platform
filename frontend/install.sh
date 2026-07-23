#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-/home/ec2-user/ivs-platform}"
FRONTEND="$REPO_ROOT/frontend"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -d "$FRONTEND/src/components" ]]; then
  echo "Frontend components folder not found: $FRONTEND/src/components"
  exit 1
fi

TARGET="$FRONTEND/src/components/CreateChannel.jsx"
if [[ -f "$TARGET" ]]; then
  cp "$TARGET" "$TARGET.event-backup"
  echo "Backup created: $TARGET.event-backup"
fi

cp "$SCRIPT_DIR/src/components/CreateChannel.jsx" "$TARGET"
echo "Installed updated CreateChannel.jsx"
echo "Run:"
echo "  cd $REPO_ROOT"
echo "  docker compose build --no-cache frontend"
echo "  docker compose up -d frontend"
