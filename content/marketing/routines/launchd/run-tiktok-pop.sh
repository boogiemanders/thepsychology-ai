#!/bin/bash
set -u
export PATH="/Users/anderschan/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
DIR="/Users/anderschan/thepsychology-ai-marketing"
LOG="/Users/anderschan/.thepsychology-automation/tiktok-pop.log"
cd "$DIR" || exit 1
echo "=== tiktok-pop $(date) ===" >> "$LOG"
git fetch origin --quiet 2>>"$LOG" && git reset --hard origin/main >> "$LOG" 2>&1
timeout 1200 claude --dangerously-skip-permissions -p "Execute the routine in content/marketing/routines/tiktok-pop.md now. Produce 2-3 pop-culture talking-head scripts for approval: take a fresh past-24-48h moment from pop culture, AI, or music/Ableton, explain the psychology, and ALWAYS tie it to a specific topic-content-v4 lesson. ALWAYS submit with topic 'pop-culture' so it routes to the TikTok-Pop lane. Reframe/credential hook, comment-trigger DM CTA, tracked /go link in the caption. Submit each via submit-draft.ts. Be concise." >> "$LOG" 2>&1
echo "=== done $(date) (exit $?) ===" >> "$LOG"
