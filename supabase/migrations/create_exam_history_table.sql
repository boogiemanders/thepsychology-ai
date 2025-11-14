-- Create exam_history table for tracking exam completions
CREATE TABLE IF NOT EXISTS exam_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('diagnostic', 'practice')),
  exam_mode TEXT NOT NULL CHECK (exam_mode IN ('study', 'test')),
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_history_user_id ON exam_history(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_history_user_exam_type ON exam_history(user_id, exam_type);
CREATE INDEX IF NOT EXISTS idx_exam_history_created_at ON exam_history(created_at DESC);

-- Enable RLS for security
ALTER TABLE exam_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own exam history
CREATE POLICY "Users can read their own exam history"
  ON exam_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own exam completions
CREATE POLICY "Users can insert exam completions"
  ON exam_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
