-- =============================================================================
-- quiz_results — cross-device quiz progress (web + iOS)
-- Append-only: each quiz completion = new row. Progress = MAX(percentage).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  domain_id TEXT,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  percentage INTEGER GENERATED ALWAYS AS (
    ROUND(score::numeric * 100 / total_questions)
  ) STORED,
  wrong_answers JSONB,
  correct_answers JSONB,
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'ios')),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_topic
  ON public.quiz_results(user_id, topic_name);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_completed
  ON public.quiz_results(user_id, completed_at DESC);

-- RLS: users can only touch their own rows
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own quiz results"
  ON public.quiz_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results"
  ON public.quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for cross-device sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_results;
