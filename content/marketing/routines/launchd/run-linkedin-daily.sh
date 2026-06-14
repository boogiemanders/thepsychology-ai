#!/bin/bash
set -u
export PATH="/Users/anderschan/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
DIR="/Users/anderschan/thepsychology-ai-marketing"
LOG="/Users/anderschan/.thepsychology-automation/linkedin-daily.log"
cd "$DIR" || exit 1
echo "=== linkedin-daily $(date) ===" >> "$LOG"
git fetch origin --quiet 2>>"$LOG" && git reset --hard origin/main >> "$LOG" 2>&1
timeout 900 claude --dangerously-skip-permissions -p "Execute the routine in content/marketing/routines/linkedin-daily.md now. Generate ONE clinician-first LinkedIn post for approval using the self LinkedIn scorecard as the primary signal (senior licensed clinicians, not EPPP candidates), the winning hook formula, a peer-question CTA, and the tracked /go link kept in a FIRST COMMENT block (not the post body). Submit it via submit-draft.ts. Be concise." >> "$LOG" 2>&1
echo "=== done $(date) (exit $?) ===" >> "$LOG"
