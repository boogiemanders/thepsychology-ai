-- Create study_priorities table to store personalized study recommendations
CREATE TABLE IF NOT EXISTS public.study_priorities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  top_domains JSONB NOT NULL,
  exam_score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.study_priorities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own priorities
CREATE POLICY "Users can view own priorities"
  ON public.study_priorities
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own priorities
CREATE POLICY "Users can insert own priorities"
  ON public.study_priorities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own priorities
CREATE POLICY "Users can update own priorities"
  ON public.study_priorities
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_study_priorities_user_id ON public.study_priorities(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_study_priorities_updated_at
  BEFORE UPDATE ON public.study_priorities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
