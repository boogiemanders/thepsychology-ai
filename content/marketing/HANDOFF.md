# Handoff: finish the marketing content engine

Branch: `worktree-marketing-content-engine`. Slack (`SLACK_WEBHOOK_SOCIAL`) and GA4
(`GOOGLE_SERVICE_ACCOUNT_KEY` + `GA4_PROPERTY_ID`) are already set. Two tasks remain.

## 1. GITHUB_TOKEN (lets the Approve button publish blog posts)

The Slack Approve button on a blog draft commits markdown to `EPPP/content/blog-content/`
via the GitHub API, which triggers a Vercel deploy. It needs a token.

- github.com/settings/personal-access-tokens → Fine-grained token.
- Repository access: only `boogiemanders/thepsychology-ai`.
- Permissions: **Contents: Read and write**.
- Copy the token, then:
  ```
  # add to local + Vercel
  echo "GITHUB_TOKEN=<token>" >> .env.local
  printf '%s' "<token>" | vercel env add GITHUB_TOKEN production
  printf '%s' "<token>" | vercel env add GITHUB_TOKEN development
  ```
  (Used in `src/lib/marketing/publish-blog.ts`, owner/repo/branch hardcoded there.)

## 2. Apply the DB migration

Creates `marketing_drafts` (approval queue) + `blog_performance` (GA feedback).

- File: `supabase/migrations/create_marketing_tables.sql`.
- Easiest: paste its contents into Supabase Studio → SQL Editor → Run.
- Verify: `select * from marketing_drafts limit 1;` returns 0 rows (table exists).

## Then: deploy + smoke test

1. Merge `worktree-marketing-content-engine` to main (or `vercel deploy --prod`).
2. Make a test draft JSON and run:
   `npx tsx scripts/marketing/submit-draft.ts /tmp/test.json`
   (shape = `DraftInput` in `src/lib/marketing/types.ts`; needs `type, topic, title, body_md, sources[]`).
3. Confirm it lands in #social-approvals with Approve/Reject buttons.
4. Click Approve on a test blog draft → confirm a commit appears in `EPPP/content/blog-content/`
   and the message updates to "Published".
5. Click Reject on another → confirm it marks rejected, no publish.
6. Run `npx tsx scripts/marketing/pull-performance.ts 28` then
   `npx tsx scripts/marketing/whats-working.ts` → confirm `content/marketing/whats-working.md`.

## Last step: schedule it

Use `/schedule` for two routines (see `content/marketing/routines/`):
- daily-marketing (~6am) → `daily-marketing.md`
- weekly-performance (Mon) → `weekly-performance.md`

Full context in `content/marketing/README.md`.
