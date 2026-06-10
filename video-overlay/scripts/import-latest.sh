#!/bin/bash
# Pull the newest generated talking-head video + its SRT from the Google Drive
# review folder into public/ under fixed names, so the PracticeQuestion
# composition always points at the latest video. Usage: npm run import
set -euo pipefail
SRC="${VIDEO_OUTPUT_DIR:-/Users/anderschan/Library/CloudStorage/GoogleDrive-dranders@drinzinna.com/My Drive/thepsychology.ai marketing/videos}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public"
LATEST_MP4=$(ls -t "$SRC"/*.mp4 2>/dev/null | head -1)
if [ -z "$LATEST_MP4" ]; then
  echo "No mp4 found in $SRC" >&2
  exit 1
fi
BASE="${LATEST_MP4%.mp4}"
cp "$LATEST_MP4" "$DEST/input.mp4"
if [ -f "$BASE.srt" ]; then
  cp "$BASE.srt" "$DEST/input.srt"
else
  echo "Warning: no SRT next to $(basename "$LATEST_MP4")" >&2
fi
echo "Imported: $(basename "$LATEST_MP4")"
