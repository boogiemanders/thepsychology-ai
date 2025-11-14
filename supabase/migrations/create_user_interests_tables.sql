-- Create user_current_interest table
CREATE TABLE IF NOT EXISTS user_current_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user_all_interests table for history
CREATE TABLE IF NOT EXISTS user_all_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_current_interest_user_id ON user_current_interest(user_id);
CREATE INDEX IF NOT EXISTS idx_user_all_interests_user_id ON user_all_interests(user_id);

-- Add RLS policies for security
ALTER TABLE user_current_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_all_interests ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own current interest
CREATE POLICY "Users can read their own current interest"
  ON user_current_interest FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own current interest"
  ON user_current_interest FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own current interest"
  ON user_current_interest FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only read/write their own interests history
CREATE POLICY "Users can read their own interests history"
  ON user_all_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests"
  ON user_all_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
