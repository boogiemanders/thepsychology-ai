-- Create study_priorities table for storing prioritized study recommendations
CREATE TABLE IF NOT EXISTS public.study_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  top_domains JSONB NOT NULL,
  exam_score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_study_priorities_user_id ON public.study_priorities(user_id);

-- Enable Row Level Security
ALTER TABLE public.study_priorities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their own study priorities"
  ON public.study_priorities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study priorities"
  ON public.study_priorities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study priorities"
  ON public.study_priorities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_study_priorities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER study_priorities_updated_at_trigger
  BEFORE UPDATE ON public.study_priorities
  FOR EACH ROW
  EXECUTE FUNCTION update_study_priorities_updated_at();

-- Add documentation
COMMENT ON TABLE public.study_priorities IS 'Stores prioritized study recommendations based on exam performance';
COMMENT ON COLUMN public.study_priorities.top_domains IS 'JSONB array of PriorityDomainRecommendation objects - top 3 domains to focus on';
