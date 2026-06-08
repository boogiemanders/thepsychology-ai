-- Marketing feedback learning loop + rewrite queue. Captures every Feedback submission and
-- every Approve. Feedback rows double as a work queue: the Slack route enqueues them
-- (processed_at = null), and the feedback-rewrite Claude routine drains the queue on the
-- founder's subscription (rewrites the draft, posts a new card, sets processed_at).
-- This is also the raw log behind the "coach's notebook" (content/marketing/voice-learnings.md):
-- scripts/marketing/distill-learnings.ts reads it to update the rules the daily writer follows.
-- Service-role only (no public access), matching marketing_drafts.

create table if not exists marketing_feedback (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null,                 -- the draft the founder acted on
  new_draft_id uuid,                       -- the rewritten draft (set when processed)
  kind text not null check (kind in ('feedback', 'approved')),
  feedback_text text,                      -- what the founder typed (kind='feedback')
  original_body text,                      -- the draft body at feedback time
  rewritten_body text,                     -- the regenerated body (set when processed)
  created_by text,                         -- Slack username who acted
  processed_at timestamptz,                -- null = pending rewrite; set when the routine finishes
  created_at timestamptz not null default now()
);

create index if not exists marketing_feedback_kind_idx on marketing_feedback (kind);
create index if not exists marketing_feedback_created_idx on marketing_feedback (created_at desc);
create index if not exists marketing_feedback_draft_idx on marketing_feedback (draft_id);
-- Fast lookup of the rewrite queue (pending feedback rows).
create index if not exists marketing_feedback_pending_idx
  on marketing_feedback (created_at) where kind = 'feedback' and processed_at is null;

alter table marketing_feedback enable row level security;
-- No policies = no anon/auth access. Service role bypasses RLS.
