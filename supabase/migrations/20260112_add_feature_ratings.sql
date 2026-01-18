-- Feature ratings table for collecting user satisfaction data
-- Used for APA research metrics: Topic Teacher (stars), Quizzer (thumbs)

CREATE TABLE IF NOT EXISTS public.feature_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feature identification
  feature TEXT NOT NULL CHECK (feature IN ('topic_teacher', 'quizzer', 'recover', 'practice_exam', 'diagnostic_exam')),
  session_id TEXT,  -- Optional session/lesson identifier

  -- Rating data
  rating_type TEXT NOT NULL CHECK (rating_type IN ('stars', 'thumbs')),
  rating_value INTEGER NOT NULL,  -- 1-5 for stars, 0/1 for thumbs (down/up)
  comment TEXT,

  -- Context metadata
  topic TEXT,
  domain TEXT,
  duration_seconds INTEGER,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feature_ratings_user_id ON public.feature_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_ratings_feature ON public.feature_ratings(feature);
CREATE INDEX IF NOT EXISTS idx_feature_ratings_created_at ON public.feature_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_ratings_feature_type ON public.feature_ratings(feature, rating_type);

-- Enable Row Level Security
ALTER TABLE public.feature_ratings ENABLE ROW LEVEL SECURITY;

-- Users can insert their own ratings
CREATE POLICY "Users can insert own ratings"
  ON public.feature_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own ratings
CREATE POLICY "Users can read own ratings"
  ON public.feature_ratings FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can read all ratings (for admin analytics)
CREATE POLICY "Service role can read all ratings"
  ON public.feature_ratings FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');
