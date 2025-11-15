-- Create pre_generated_exams table for storing pre-generated exams
CREATE TABLE IF NOT EXISTS public.pre_generated_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('diagnostic', 'practice')),
  questions JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_pre_gen_exams_user_type_unused ON public.pre_generated_exams(user_id, exam_type, used) WHERE used = FALSE;
CREATE INDEX idx_pre_gen_exams_user_type ON public.pre_generated_exams(user_id, exam_type);
CREATE INDEX idx_pre_gen_exams_expires ON public.pre_generated_exams(expires_at);
CREATE INDEX idx_pre_gen_exams_used_created ON public.pre_generated_exams(used, created_at);

-- Enable Row Level Security
ALTER TABLE public.pre_generated_exams ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own pre-generated exams
CREATE POLICY "Users can read own pre-generated exams"
  ON public.pre_generated_exams FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Allow service role (for background generation) to insert
-- This policy allows the authenticated user to insert their own exams
CREATE POLICY "Users can insert own pre-generated exams"
  ON public.pre_generated_exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own exams (mark as used)
CREATE POLICY "Users can update own pre-generated exams"
  ON public.pre_generated_exams FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow deletion of expired or used exams
CREATE POLICY "Allow deletion of expired exams"
  ON public.pre_generated_exams FOR DELETE
  USING (expires_at < NOW() OR (used = TRUE AND created_at < NOW() - INTERVAL '1 day'));

-- Add a comment to document the table purpose
COMMENT ON TABLE public.pre_generated_exams IS 'Stores pre-generated exams for faster user experience. Exams expire after 7 days or when used.';
COMMENT ON COLUMN public.pre_generated_exams.exam_type IS 'Type of exam: diagnostic (71 questions) or practice (225 questions)';
COMMENT ON COLUMN public.pre_generated_exams.questions IS 'JSON object containing array of question objects';
COMMENT ON COLUMN public.pre_generated_exams.used IS 'Whether this exam has been used by the user';
COMMENT ON COLUMN public.pre_generated_exams.expires_at IS 'When this exam becomes stale and should be regenerated';
