-- Create pre_generated_exams table for caching generated exams
CREATE TABLE IF NOT EXISTS pre_generated_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('diagnostic', 'practice')),
  questions JSONB NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT unique_unused_exam UNIQUE (user_id, exam_type, used)
);

-- Create index for faster lookups
CREATE INDEX idx_pre_generated_exams_user_type ON pre_generated_exams(user_id, exam_type, used, expires_at);

-- Enable RLS
ALTER TABLE pre_generated_exams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own pre-generated exams"
  ON pre_generated_exams
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pre-generated exams"
  ON pre_generated_exams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pre-generated exams"
  ON pre_generated_exams
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pre-generated exams"
  ON pre_generated_exams
  FOR DELETE
  USING (auth.uid() = user_id);
