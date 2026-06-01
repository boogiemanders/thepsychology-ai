-- LinkedIn drip queue: approving a LinkedIn draft in Slack no longer publishes it
-- immediately. It is marked 'queued', and scripts/marketing/drip-linkedin.ts drains
-- the queue ~2x/day so the feed never looks spammy and a backlog cushion builds up.

-- 1) Allow the new 'queued' status (drop + re-add the inline CHECK constraint).
alter table marketing_drafts drop constraint if exists marketing_drafts_status_check;
alter table marketing_drafts add constraint marketing_drafts_status_check
  check (status in ('pending', 'approved', 'rejected', 'published', 'queued'));

-- 2) Track when a post actually went live. decided_at is when the human approved it,
--    which can be days before the drip job publishes — so the per-day publish cap
--    needs its own timestamp.
alter table marketing_drafts add column if not exists published_at timestamptz;

create index if not exists marketing_drafts_published_at_idx
  on marketing_drafts (published_at);
