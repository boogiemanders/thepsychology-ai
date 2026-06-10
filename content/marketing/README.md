# Marketing Content Engine

Daily research → drafts (TikTok / LinkedIn / blog) → you approve in Slack → blog auto-publishes
with Google Analytics tracking → the system learns which posts convert and biases the next batch.

Nothing goes live without your approval. Blog posts publish automatically once you tap **Approve**;
LinkedIn and TikTok are saved ready to copy-paste (you post those yourself).

## How it flows

1. A scheduled Claude agent runs `content/marketing/routines/daily-marketing.md` each morning:
   researches with `last30days`, writes drafts, fact-checks, then calls `submit-draft.ts`.
2. Each draft is saved to the `marketing_drafts` table + an Obsidian note (tagged `#mktg`) in
   `content/marketing/<date>/`, and posted to **#social-approvals** in Slack with buttons.
3. You tap **Approve** / **Reject** / **Feedback**. Approve a blog → it commits to
   `EPPP/content/blog-content/` and Vercel deploys it live. Approve a social post → its final
   text appears in the Slack thread. **Feedback** opens a modal: type what to change. The
   submission is queued (no LLM on the server), and the **feedback-rewrite routine** (running
   on the founder's Claude subscription, so it can use oe_ask + search for grounding) rewrites
   the draft, keeps the APA cites, and posts a fresh card shortly after.
4. Every Feedback note and every Approve is logged to `marketing_feedback`. `distill-learnings.ts`
   turns that into `voice-learnings.md` (the writer reads it next time), so the engine learns
   what you like and what earns approval.
5. Weekly, `pull-performance.ts` reads GA4 and `whats-working.ts` writes a summary the daily
   routine reads next time.

## One-time setup (do these once — the engine can't run until they're done)

### 1. Slack
Reuses your EXISTING Slack app (the one already sending feedback/metrics/payments/signups and
running the triage approval buttons). No new app. Slack allows only one interactivity URL per
app, so marketing approvals are handled by your existing `/api/slack/triage-approval` endpoint
(its buttons use distinct action ids). All you add:
- Create a channel **#social-approvals**.
- In your Slack app, add an **Incoming Webhook** pointed at that channel, copy the URL into
  `SLACK_WEBHOOK_SOCIAL` (same pattern as your other `SLACK_WEBHOOK_*` channels).
- For the **Feedback** button (opens a modal to request a rewrite): add the **`chat:write`**
  bot scope under OAuth & Permissions, reinstall the app, and copy the `xoxb-` token into
  `SLACK_BOT_TOKEN`. The modal popup (Slack `views.open`) is the one thing that needs a bot
  token; Approve/Reject and posting cards still use the webhook. Without the token, Approve/
  Reject work fine and Feedback just does nothing.
- The signing secret and interactivity URL are already set from the triage flow.

### 2. Google Analytics (GA4) API
Already set up. The existing admin analytics route and `scripts/ga_query.mjs` use it, and
`.env.local` already has `GA4_PROPERTY_ID` + `GOOGLE_SERVICE_ACCOUNT_KEY`. `pull-performance.ts`
reuses that same auth. Nothing to do here.

### 3. GitHub (so the Approve button can publish blog posts)
- Create a fine-grained personal access token with **Contents: Read and write** on
  `boogiemanders/thepsychology-ai` → `GITHUB_TOKEN`.

### 4. Database + env + deploy
- Apply the migrations `supabase/migrations/create_marketing_tables.sql` and
  `supabase/migrations/20260607_add_marketing_feedback.sql` (Supabase SQL editor or CLI).
- Add the new secrets, `SLACK_WEBHOOK_SOCIAL`, `GITHUB_TOKEN`, and `SLACK_BOT_TOKEN` (for the
  Feedback modal popup), to `.env.local` and Vercel (`SLACK_WEBHOOK_SOCIAL` is already done).
  Supabase, GA4 (`GA4_PROPERTY_ID` + `GOOGLE_SERVICE_ACCOUNT_KEY`), `SLACK_SIGNING_SECRET`, and
  the other webhooks already exist. No LLM API key is needed on the server — the rewrite runs
  on the founder's Claude subscription via the feedback-rewrite routine.
- Deploy. The Slack endpoint already exists, so no Request URL change is needed.

## Video generation (talking-head videos from approved TikTok scripts)

`scripts/marketing/generate-videos.ts` turns every approved TikTok script (status `approved`,
`video_status` null) into a vertical talking-head video of Anders via the HeyGen API (avatar
trained on his real footage + voice clone), saves the mp4 to Google Drive →
`thepsychology.ai marketing/videos/`, and marks the row `video_status='generated'`.
Nothing posts automatically — Drive is a review queue. Failures mark `video_status='failed'`
with the error and ping #social-approvals; reset `video_status` to null to retry.

One-time setup:
- Apply `supabase/migrations/20260609_add_video_generation.sql`.
- Create a HeyGen account, train an avatar on ~2 min of Anders's TikTok footage (HeyGen
  requires a recorded consent clip), clone the voice, buy pay-as-you-go API credits.
- Add `HEYGEN_API_KEY`, `HEYGEN_AVATAR_ID`, `HEYGEN_VOICE_ID` to `.env.local` (and the
  `~/thepsychology-ai-marketing` checkout's copy). Optional: `VIDEO_DAILY_CAP` (default 12,
  the cost guard) and `VIDEO_OUTPUT_DIR`.
- launchd: `~/Library/LaunchAgents/ai.thepsychology.video-generate.plist` runs
  `~/.thepsychology-automation/run-video-generate.sh` at 10am/1pm/4pm/7pm local
  (`launchctl load` it once the env vars exist and this code is on origin/main).

The spoken text is extracted from `body_md` by `src/lib/marketing/video-script.ts`
(strips section headers, `[Visual: ...]` directions, hashtag rows — never rewrites the
approved sentences). HeyGen is isolated behind one function in `generate-videos.ts` so a
different provider (Seedance, OmniHuman) can swap in later.

## Manual runs (for testing before scheduling)

```
# submit a single hand-written draft (JSON matches DraftInput in src/lib/marketing/types.ts)
npx tsx scripts/marketing/submit-draft.ts /path/to/draft.json

# pull GA4 performance for the last 28 days
npx tsx scripts/marketing/pull-performance.ts 28

# rebuild the what's-working summary
npx tsx scripts/marketing/whats-working.ts

# see the Feedback rewrite queue (pending feedback + the draft it targets)
node --env-file=.env.local --import tsx scripts/marketing/list-pending-feedback.ts

# post one rewritten draft + mark its feedback row done (rewrite JSON authored by the routine)
node --env-file=.env.local --import tsx scripts/marketing/submit-rewrite.ts /path/to/rewrite.json

# fold recent feedback into the voice notebook
node --env-file=.env.local --import tsx scripts/marketing/distill-learnings.ts
```

## Schedule it (last step)

Use Claude Code `/schedule` to register these routines:
- **daily-marketing** (~6am) → runs `content/marketing/routines/daily-marketing.md`
- **weekly-performance** (Mon) → runs `content/marketing/routines/weekly-performance.md`
- **feedback-rewrite** (frequent, e.g. every few minutes or hourly) → runs
  `content/marketing/routines/feedback-rewrite.md`. This drains the Feedback rewrite queue on
  your subscription, so it must run somewhere logged into your Claude account (a local `/loop`
  or launchd is most reliable given past cloud-routine 401s).

> Runtime note: the scheduled agent runs in the cloud and **cannot see your local Obsidian vault**.
> It writes drafts into this repo (`content/marketing/`, tagged `#mktg`); they appear in Obsidian
> once the repo is synced/pulled there. The agent's environment needs the secrets above and repo
> access. `SCRAPECREATORS_API_KEY` improves TikTok/Instagram research but is optional.
>
> Local runs only: set `MARKETING_NOTES_DIR` to your Obsidian vault to write notes straight in,
> e.g. `/Users/anderschan/Library/Mobile Documents/iCloud~md~obsidian/Documents/Claude Code/inbox`.
> The cloud agent cannot reach iCloud, so it always falls back to the repo `content/marketing/`.

## Files

- `scripts/marketing/submit-draft.ts` — persist a draft + write note + post to Slack
- `scripts/marketing/pull-performance.ts` — GA4 → `blog_performance`
- `scripts/marketing/whats-working.ts` — `blog_performance` → `whats-working.md`
- `scripts/marketing/distill-learnings.ts` — `marketing_feedback` → `voice-learnings.md`
- `scripts/marketing/list-pending-feedback.ts` — the rewrite queue (pending feedback + original draft)
- `scripts/marketing/submit-rewrite.ts` — insert rewritten draft + post card + mark feedback done
- `content/marketing/routines/feedback-rewrite.md` — routine that drains the rewrite queue on the subscription
- `src/lib/marketing/{types,format,slack,publish-blog,handle-interaction}.ts` — shared logic
- `src/lib/marketing/slack-modal.ts` — opens the Feedback modal via `views.open` (needs `SLACK_BOT_TOKEN`)
- `content/marketing/voice-learnings.md` — learned founder voice; the daily writer reads it
- `src/lib/notify-slack.ts` — existing webhook sender (added `social` channel + blocks support)
- `src/app/api/slack/triage-approval/route.ts` — existing endpoint; dispatches marketing
  Approve/Reject + the Feedback button + the modal `view_submission` to `handle-interaction.ts`
- `supabase/migrations/create_marketing_tables.sql` — `marketing_drafts` + `blog_performance`
- `supabase/migrations/20260607_add_marketing_feedback.sql` — `marketing_feedback` (learning log)
