#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$HOME/ivs-platform}"
TARGET="$PROJECT_DIR/backend/src/services/ivsService.js"

if [[ ! -f "$TARGET" ]]; then
  echo "ERROR: File not found: $TARGET"
  echo "Usage: $0 /path/to/ivs-platform"
  exit 1
fi

BACKUP="${TARGET}.backup.$(date +%Y%m%d%H%M%S)"
cp "$TARGET" "$BACKUP"
echo "Backup created: $BACKUP"

python3 - "$TARGET" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()

old = '''      if (autoRecord) {
        const configuration = await ensureRecordingConfiguration();
        recordingConfigurationArn = configuration.arn;
        recordingBucket = configuration.destinationConfiguration?.s3?.bucketName || "awsivs-emp-platform-950363885603";
      }

      const response = await client.send(new CreateChannelCommand({
'''

new = '''      if (autoRecord) {
        recordingConfigurationArn =
          await ensureRecordingConfiguration();

        recordingBucket =
          "awsivs-emp-platform-950363885603";
      }

      console.log("Creating IVS channel:", {
        name,
        region,
        autoRecord,
        recordingConfigurationArn:
          recordingConfigurationArn || null,
      });

      const response = await client.send(new CreateChannelCommand({
'''

if old not in text:
    print("ERROR: The expected old code block was not found.")
    print("No changes were applied.")
    sys.exit(2)

path.write_text(text.replace(old, new, 1))
print("Updated:", path)
PY

echo
echo "Verification:"
grep -n -A28 -B5 "if (autoRecord)" "$TARGET" | head -40

echo
echo "Patch applied successfully."
echo "Next commands:"
echo "  cd $PROJECT_DIR"
echo "  sudo docker compose build --no-cache backend"
echo "  sudo docker compose up -d backend"
echo "  sudo docker compose logs -f backend"
