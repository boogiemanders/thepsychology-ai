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
3. You tap **Approve** / **Reject**. Approve a blog → it commits to `EPPP/content/blog-content/`
   and Vercel deploys it live. Approve a social post → its final text appears in the Slack thread.
4. Weekly, `pull-performance.ts` reads GA4 and `whats-working.ts` writes a summary the daily
   routine reads next time.

## One-time setup (do these once — the engine can't run until they're done)

### 1. Slack
Reuses your EXISTING Slack app (the one already sending feedback/metrics/payments/signups and
running the triage approval buttons). No new app, no bot token. Slack allows only one
interactivity URL per app, so marketing approvals are handled by your existing
`/api/slack/triage-approval` endpoint (its buttons use distinct action ids). All you add:
- Create a channel **#social-approvals**.
- In your Slack app, add an **Incoming Webhook** pointed at that channel, copy the URL into
  `SLACK_WEBHOOK_SOCIAL` (same pattern as your other `SLACK_WEBHOOK_*` channels).
- That is it. The signing secret and interactivity URL are already set from the triage flow.

### 2. Google Analytics (GA4) API
Already set up. The existing admin analytics route and `scripts/ga_query.mjs` use it, and
`.env.local` already has `GA4_PROPERTY_ID` + `GOOGLE_SERVICE_ACCOUNT_KEY`. `pull-performance.ts`
reuses that same auth. Nothing to do here.

### 3. GitHub (so the Approve button can publish blog posts)
- Create a fine-grained personal access token with **Contents: Read and write** on
  `boogiemanders/thepsychology-ai` → `GITHUB_TOKEN`.

### 4. Database + env + deploy
- Apply the migration `supabase/migrations/create_marketing_tables.sql` (Supabase SQL editor or CLI).
- Add the only new secrets needed, `SLACK_WEBHOOK_SOCIAL` and `GITHUB_TOKEN`, to `.env.local`
  and Vercel (`SLACK_WEBHOOK_SOCIAL` is already done). Supabase, GA4 (`GA4_PROPERTY_ID` +
  `GOOGLE_SERVICE_ACCOUNT_KEY`), `SLACK_SIGNING_SECRET`, and the other webhooks already exist.
- Deploy. The Slack endpoint already exists, so no Request URL change is needed.

## Manual runs (for testing before scheduling)

```
# submit a single hand-written draft (JSON matches DraftInput in src/lib/marketing/types.ts)
npx tsx scripts/marketing/submit-draft.ts /path/to/draft.json

# pull GA4 performance for the last 28 days
npx tsx scripts/marketing/pull-performance.ts 28

# rebuild the what's-working summary
npx tsx scripts/marketing/whats-working.ts
```

## Schedule it (last step)

Use Claude Code `/schedule` to register two routines:
- **daily-marketing** (~6am) → runs `content/marketing/routines/daily-marketing.md`
- **weekly-performance** (Mon) → runs `content/marketing/routines/weekly-performance.md`

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
- `src/lib/marketing/{types,format,slack,publish-blog,handle-interaction}.ts` — shared logic
- `src/lib/notify-slack.ts` — existing webhook sender (added `social` channel + blocks support)
- `src/app/api/slack/triage-approval/route.ts` — existing endpoint; now also dispatches marketing
  Approve/Reject clicks to `handle-interaction.ts`
- `supabase/migrations/create_marketing_tables.sql` — `marketing_drafts` + `blog_performance`
