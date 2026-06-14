#!/bin/bash
set -u
export PATH="/Users/anderschan/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
DIR="/Users/anderschan/thepsychology-ai-marketing"
LOG="/Users/anderschan/.thepsychology-automation/tiktok-eppp.log"
cd "$DIR" || exit 1
echo "=== tiktok-eppp $(date) ===" >> "$LOG"
git fetch origin --quiet 2>>"$LOG" && git reset --hard origin/main >> "$LOG" 2>&1
timeout 1800 claude --dangerously-skip-permissions -p "Execute the routine in content/marketing/routines/tiktok-eppp.md now. Produce the day's EPPP talking-head scripts for approval: 5 practice-question scripts balanced across the 12 domains (pull real questions from EPPP/content/questionsGPT, check recent-drafts.ts for domain balance), plus an EPPP-news script only if fresh in 24-48h (WebSearch asppb.org), plus one test-taking-strategy script (use oe_ask for NEW research, deduped against recent draft sources and shared-research.md). UCLA-credential or reframe hook, comment-trigger DM CTA, tracked /go link in the caption. Submit each via submit-draft.ts. Be concise." >> "$LOG" 2>&1
echo "=== done $(date) (exit $?) ===" >> "$LOG"
