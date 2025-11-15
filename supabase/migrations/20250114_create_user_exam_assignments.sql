-- Create table to track which exam files users have been assigned
CREATE TABLE user_exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('diagnostic', 'practice')),
  exam_file TEXT NOT NULL,  -- e.g., "diagnostic-2025-01-14.md"
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  UNIQUE(user_id, exam_file)
);

-- Create index for querying user's completed exams
CREATE INDEX idx_user_exam_completed
  ON user_exam_assignments(user_id, completed, completed_at DESC);

-- Create index for finding unused exams for a user
CREATE INDEX idx_user_exam_unused
  ON user_exam_assignments(user_id, exam_type, completed)
  WHERE completed = FALSE;

-- Enable RLS
ALTER TABLE user_exam_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own assignments
CREATE POLICY "Users can read their own exam assignments"
  ON user_exam_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own assignments (for testing)
CREATE POLICY "Users can insert their own exam assignments"
  ON user_exam_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own assignments
CREATE POLICY "Users can update their own exam assignments"
  ON user_exam_assignments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role can insert for background generation
CREATE POLICY "Service role can manage exam assignments"
  ON user_exam_assignments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
