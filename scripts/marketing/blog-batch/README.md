# blog-batch: SEO blog drafts for Slack approval

Five EPPP SEO posts (4 new + the eppp-vs-eppp-2 refresh) as `DraftInput` JSON,
ready to push through the normal blog approval flow instead of a direct PR.

## One-time setup
Set the blog-lane webhook in BOTH places (the new dedicated `#blog` channel):
- Local `.env.local`: `SLACK_WEBHOOK_BLOG=<incoming webhook url>`
- Vercel prod env: `SLACK_WEBHOOK_BLOG=<same url>` (so the deployed
  `/api/slack/triage-approval` handler posts feedback acks + rewritten cards there)

The lane falls back to `SLACK_WEBHOOK_SOCIAL` if `SLACK_WEBHOOK_BLOG` is unset.

## Submit them for approval
From the repo root (needs Supabase + the webhook in `.env.local`):

```sh
for f in scripts/marketing/blog-batch/*.json; do
  npx tsx scripts/marketing/submit-draft.ts "$f"
done
```

Each insert posts a card to the blog channel with Approve / Reject / Feedback.
- Approve: queues it; `drip-blog.ts` publishes 1/day (FIFO), so the 5 space out.
- Reject: drops it.
- Feedback: opens a box; the feedback-rewrite routine posts a revised card.

`published_at` is set to the publish date by the pipeline (not these files), so
the drip controls spacing.
