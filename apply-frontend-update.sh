#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-.}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
[ -d "$TARGET/frontend" ] || { echo "Repository frontend directory not found: $TARGET/frontend"; exit 1; }
cp "$ROOT/frontend/src/components/Dashboard.jsx" "$TARGET/frontend/src/components/Dashboard.jsx"
cp "$ROOT/frontend/src/components/Login.jsx" "$TARGET/frontend/src/components/Login.jsx"
cp "$ROOT/frontend/src/components/CreateChannel.jsx" "$TARGET/frontend/src/components/CreateChannel.jsx"
cp "$ROOT/frontend/index.html" "$TARGET/frontend/index.html"
mkdir -p "$TARGET/frontend/public"
cp "$ROOT/frontend/public/favicon.svg" "$TARGET/frontend/public/favicon.svg"
echo "EMP StreamBridge SaaS frontend update applied to $TARGET"
