-- Recover insights + exam telemetry

-- Exam question attempts (per-question telemetry for exams)
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
  options TEXT[],
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  is_scored BOOLEAN DEFAULT TRUE,
  related_sections TEXT[],
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

-- Extend quiz question attempts with telemetry
ALTER TABLE public.quiz_question_attempts
  ADD COLUMN IF NOT EXISTS time_spent_ms INTEGER,
  ADD COLUMN IF NOT EXISTS visit_count INTEGER,
  ADD COLUMN IF NOT EXISTS answer_changes INTEGER,
  ADD COLUMN IF NOT EXISTS changed_correct_to_wrong BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS changed_wrong_to_correct BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS highlight_count INTEGER,
  ADD COLUMN IF NOT EXISTS strikethrough_count INTEGER;

-- Recover insights storage
CREATE TABLE IF NOT EXISTS public.recover_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('quiz', 'exam')),
  source_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sent')),
  insight_data JSONB,
  draft_message TEXT,
  approved_message TEXT,
  admin_notes TEXT,
  model TEXT,
  prompt_version TEXT,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recover_insights_user_id ON public.recover_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_recover_insights_status ON public.recover_insights(status);
CREATE INDEX IF NOT EXISTS idx_recover_insights_created_at ON public.recover_insights(created_at DESC);

ALTER TABLE public.recover_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own recover insights"
  ON public.recover_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage recover insights"
  ON public.recover_insights FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Global preferences for insight style prompt
CREATE TABLE IF NOT EXISTS public.recover_insight_preferences (
  id TEXT PRIMARY KEY,
  style_prompt TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recover_insight_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage recover insight preferences"
  ON public.recover_insight_preferences FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Daily digest log (one email per user per day)
CREATE TABLE IF NOT EXISTS public.recover_daily_digest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  insight_ids UUID[],
  insights_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, digest_date)
);

CREATE INDEX IF NOT EXISTS idx_recover_daily_digest_log_user_id ON public.recover_daily_digest_log(user_id);
CREATE INDEX IF NOT EXISTS idx_recover_daily_digest_log_date ON public.recover_daily_digest_log(digest_date);

ALTER TABLE public.recover_daily_digest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage recover daily digest log"
  ON public.recover_daily_digest_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_recover_insights_updated_at ON public.recover_insights;
CREATE TRIGGER update_recover_insights_updated_at
  BEFORE UPDATE ON public.recover_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
