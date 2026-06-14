#!/bin/bash
# One-time installer for the 3-lane daily approval routines (run AFTER this PR is merged
# to origin/main, because the run scripts hard-reset the marketing checkout to origin/main
# and will look for the routine .md files there).
#
# What it does: copies the 3 run scripts into ~/.thepsychology-automation, copies the 3
# plists into ~/Library/LaunchAgents, then launchctl-loads them. Re-running is safe
# (it unloads first). Run from the repo root: bash content/marketing/routines/launchd/install.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
AUTO="$HOME/.thepsychology-automation"
AGENTS="$HOME/Library/LaunchAgents"
mkdir -p "$AUTO" "$AGENTS"

for name in linkedin-daily tiktok-eppp tiktok-pop; do
  install -m 0755 "$HERE/run-$name.sh" "$AUTO/run-$name.sh"
  cp "$HERE/ai.thepsychology.$name.plist" "$AGENTS/ai.thepsychology.$name.plist"
  launchctl unload "$AGENTS/ai.thepsychology.$name.plist" 2>/dev/null || true
  launchctl load "$AGENTS/ai.thepsychology.$name.plist"
  echo "installed + loaded: ai.thepsychology.$name (run-$name.sh)"
done

echo
echo "Loaded. Schedules: linkedin-daily 7:00, tiktok-eppp 7:15, tiktok-pop 7:30 (local time)."
echo "Manual run now (one lane):  bash $AUTO/run-linkedin-daily.sh"
echo "Tail a log:                 tail -f $AUTO/tiktok-eppp.log"
echo "Disable a lane:             launchctl unload $AGENTS/ai.thepsychology.tiktok-pop.plist"
