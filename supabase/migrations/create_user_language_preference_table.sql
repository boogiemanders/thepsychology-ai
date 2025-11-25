-- Create user_language_preference table
CREATE TABLE IF NOT EXISTS user_language_preference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_language_preference_user_id ON user_language_preference(user_id);

ALTER TABLE user_language_preference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own language preference"
  ON user_language_preference FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own language preference"
  ON user_language_preference FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own language preference"
  ON user_language_preference FOR UPDATE
  USING (auth.uid() = user_id);

