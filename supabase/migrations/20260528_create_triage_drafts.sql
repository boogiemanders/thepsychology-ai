-- Triage drafts: HITL approval queue for daily feedback triage
-- Workflow A drafts a fix plan + email and inserts a row with status pending_approval.
-- A Slack message is posted with Approve / Reject buttons. The webhook flips status.
-- Workflow B reads status=approved rows, executes the change, sends the email, marks executed.

CREATE TABLE IF NOT EXISTS public.triage_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NULL,
  question_feedback_id UUID NULL,
  kind TEXT NOT NULL CHECK (kind IN ('feedback', 'low_rated')),
  draft_fix TEXT,
  draft_email_subject TEXT,
  draft_email_body TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval', 'approved', 'rejected', 'executed')),
  slack_message_ts TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  executed_pr_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_triage_drafts_status ON public.triage_drafts(status);
CREATE INDEX IF NOT EXISTS idx_triage_drafts_created_at ON public.triage_drafts(created_at DESC);

-- RLS off, service-role only access
ALTER TABLE public.triage_drafts DISABLE ROW LEVEL SECURITY;
