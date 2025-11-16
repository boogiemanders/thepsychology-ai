-- Create exam_results table for storing detailed exam completion data
-- This replaces passing large data through URL query params (which causes URI_TOO_LONG errors)
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('diagnostic', 'practice')),
  exam_mode TEXT NOT NULL CHECK (exam_mode IN ('study', 'test')),

  -- Exam data stored as JSONB for flexibility
  questions JSONB NOT NULL,           -- Array of question objects
  selected_answers JSONB NOT NULL,    -- Object mapping question index to selected answer
  flagged_questions JSONB,            -- Object mapping question index to boolean

  -- Scoring summary
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,

  -- Priority data (only for diagnostic exams)
  top_priorities JSONB,
  all_results JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Optional: link to exam_history entry
  exam_history_id UUID REFERENCES exam_history(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_created_at ON exam_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_results_user_exam_type ON exam_results(user_id, exam_type);

-- Enable RLS for security
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Users can only read their own exam results
CREATE POLICY "Users can read their own exam results"
  ON exam_results FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own exam results
CREATE POLICY "Users can insert exam results"
  ON exam_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
