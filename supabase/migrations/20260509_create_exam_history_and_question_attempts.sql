-- Create exam_history + exam_question_attempts tables.
-- These were referenced in code (and earlier migration files) but never landed
-- in production, so every after()-block insert in /api/save-exam-results was
-- silently failing. Reads from exam_history (admin analytics, recover-chat,
-- mobile sync, daily-stats cron, dashboards) returned empty, which made it
-- look like users had "lost progress" after a real submit.

CREATE TABLE IF NOT EXISTS public.exam_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('diagnostic', 'practice')),
  exam_mode TEXT NOT NULL CHECK (exam_mode IN ('study', 'test')),
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_history_user_id ON public.exam_history(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_history_user_exam_type ON public.exam_history(user_id, exam_type);
CREATE INDEX IF NOT EXISTS idx_exam_history_created_at ON public.exam_history(created_at DESC);

ALTER TABLE public.exam_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own exam history"
  ON public.exam_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exam history"
  ON public.exam_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.exam_question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_result_id UUID REFERENCES public.exam_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT,
  exam_mode TEXT,
  question_index INTEGER,
  question_id TEXT,
  topic TEXT,
  domain TEXT,
  kn_id TEXT,
  difficulty TEXT,
  question TEXT,
  options JSONB,
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  is_scored BOOLEAN DEFAULT TRUE,
  related_sections JSONB,
  time_spent_ms INTEGER,
  visit_count INTEGER,
  answer_changes INTEGER,
  changed_correct_to_wrong BOOLEAN DEFAULT FALSE,
  changed_wrong_to_correct BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE,
  highlight_count INTEGER,
  strikethrough_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_question_attempts_user_id ON public.exam_question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_question_attempts_exam_result_id ON public.exam_question_attempts(exam_result_id);
CREATE INDEX IF NOT EXISTS idx_exam_question_attempts_created_at ON public.exam_question_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_question_attempts_topic ON public.exam_question_attempts(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_exam_question_attempts_question_id ON public.exam_question_attempts(question_id);

ALTER TABLE public.exam_question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own exam question attempts"
  ON public.exam_question_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exam question attempts"
  ON public.exam_question_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
