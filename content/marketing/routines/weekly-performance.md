# Weekly Performance Routine (scheduled Claude Code agent — Mondays)

Update the feedback loop so next week's drafts learn from what actually converted.

## Steps

1. Pull GA4 blog performance into Supabase:

   ```
   npx tsx scripts/marketing/pull-performance.ts 28
   ```

2. Regenerate the "what's working" summary the daily routine reads:

   ```
   npx tsx scripts/marketing/whats-working.ts
   ```

3. Read `content/marketing/whats-working.md` and report a 3-bullet summary: best topic,
   best post, and one concrete adjustment for next week's content.

If `pull-performance` reports no traffic or errors on GA4 auth, report that — do not fabricate
numbers. The summary must reflect real data only.
