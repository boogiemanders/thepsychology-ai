# 3-lane daily approval routines: launchd setup

These install the three daily marketing lanes as local scheduled agents (same launchd pattern
as `feedback-rewrite` and `blog-drip`). They run on the founder's machine, on the founder's
Claude subscription, from the dedicated `~/thepsychology-ai-marketing` checkout.

## The three lanes

| Lane | Routine | Channel webhook | Schedule |
|------|---------|-----------------|----------|
| LinkedIn | `linkedin-daily.md` | `SLACK_WEBHOOK_LINKEDIN` | 7:00 |
| TikTok EPPP | `tiktok-eppp.md` | `SLACK_WEBHOOK_TIKTOK_EPPP` | 7:15 |
| TikTok Pop | `tiktok-pop.md` | `SLACK_WEBHOOK_TIKTOK_POP` | 7:30 |

Each lane webhook falls back to `SLACK_WEBHOOK_SOCIAL` (the current `#social-approvals`) until
the founder creates the dedicated channels, so everything works on day one in one channel.

## Install (AFTER this PR is merged to origin/main)

The run scripts `git reset --hard origin/main` each run, so the routine `.md` files must be on
origin/main first. Then, from the repo root of the marketing checkout:

```
bash content/marketing/routines/launchd/install.sh
```

That copies the run scripts to `~/.thepsychology-automation/`, the plists to
`~/Library/LaunchAgents/`, and `launchctl load`s all three.

## Manual first run (gives you approvals immediately)

```
bash ~/.thepsychology-automation/run-linkedin-daily.sh
bash ~/.thepsychology-automation/run-tiktok-eppp.sh
bash ~/.thepsychology-automation/run-tiktok-pop.sh
```

Watch a log: `tail -f ~/.thepsychology-automation/tiktok-eppp.log`

## Optional founder setup (not required for launch)

- **Real Slack channels:** make `#linkedin-approvals`, `#tiktok-eppp-approvals`,
  `#tiktok-pop-approvals`, add an Incoming Webhook to each, and set `SLACK_WEBHOOK_LINKEDIN`,
  `SLACK_WEBHOOK_TIKTOK_EPPP`, `SLACK_WEBHOOK_TIKTOK_POP` in Vercel + `.env.local`. Until then,
  all three lanes post to `#social-approvals`.
- **Comment-trigger auto-DM (ManyChat):** wire the trigger word (the routines default to "PASS"
  for EPPP; the 5/31 TikTok scorecard used "EPPP") to auto-DM the free-practice-questions asset.
  Keep the routine's trigger word and the ManyChat keyword identical.
