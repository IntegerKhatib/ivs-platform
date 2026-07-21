#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-$HOME/ivs-platform}"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backend"

if [[ ! -d "$TARGET/backend" ]]; then
  echo "Backend folder not found: $TARGET/backend" >&2
  exit 1
fi

BACKUP="$TARGET/backend-backup-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup: $BACKUP"
cp -a "$TARGET/backend" "$BACKUP"

echo "Copying backend update into $TARGET/backend"
cp -a "$SOURCE_DIR/." "$TARGET/backend/"

# Remove long-term AWS credentials from the runtime environment file.
if [[ -f "$TARGET/backend/.env" ]]; then
  sed -i '/^AWS_ACCESS_KEY_ID=/d;/^AWS_SECRET_ACCESS_KEY=/d;/^AWS_SESSION_TOKEN=/d' "$TARGET/backend/.env"

  grep -q '^IVS_DEFAULT_REGION=' "$TARGET/backend/.env" \
    && sed -i 's/^IVS_DEFAULT_REGION=.*/IVS_DEFAULT_REGION=eu-west-1/' "$TARGET/backend/.env" \
    || printf '\nIVS_DEFAULT_REGION=eu-west-1\n' >> "$TARGET/backend/.env"

  grep -q '^AWS_REGION=' "$TARGET/backend/.env" \
    && sed -i 's/^AWS_REGION=.*/AWS_REGION=eu-west-1/' "$TARGET/backend/.env" \
    || printf 'AWS_REGION=eu-west-1\n' >> "$TARGET/backend/.env"
fi

echo "Backend update applied. Existing auth, database, and middleware files were preserved."
echo "Next: cd $TARGET && sudo docker compose build --no-cache backend && sudo docker compose up -d backend"
