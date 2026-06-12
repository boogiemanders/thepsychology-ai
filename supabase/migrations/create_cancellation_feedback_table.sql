-- Create cancellation_feedback table
-- Stores the reason a user picked when cancelling their subscription.
-- Written only by the server (service role) from the cancel-subscription API route.
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  reason TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_user_id ON cancellation_feedback(user_id);

-- No policies: only the service role (which bypasses RLS) reads or writes this table.
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;
