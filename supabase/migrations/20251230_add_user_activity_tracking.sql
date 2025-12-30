-- Add activity tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_page TEXT;

-- Create page views table for detailed time tracking
CREATE TABLE IF NOT EXISTS user_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_page_views_user ON user_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_entered ON user_page_views(entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_user_date ON user_page_views(user_id, created_at);

-- Enable RLS
ALTER TABLE user_page_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own page views" ON user_page_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own page views" ON user_page_views
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own page views" ON user_page_views
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for admin API)
CREATE POLICY "Service role full access" ON user_page_views
  FOR ALL USING (auth.role() = 'service_role');

-- Index on users for activity queries
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity_at DESC NULLS LAST);
