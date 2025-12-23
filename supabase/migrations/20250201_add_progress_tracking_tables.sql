-- Progress tracking tables for quizzes, sessions, usage, funnel events, and topic mastery

-- Quiz attempts (summary per quiz)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  domain TEXT,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_questions INTEGER NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON public.quiz_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_topic ON public.quiz_attempts(user_id, topic);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Per-question quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  domain TEXT,
  question_id TEXT NOT NULL,
  question TEXT,
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  is_scored BOOLEAN DEFAULT TRUE,
  related_sections TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_attempts_user_id ON public.quiz_question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_question_attempts_topic ON public.quiz_question_attempts(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_quiz_question_attempts_question_id ON public.quiz_question_attempts(question_id);

ALTER TABLE public.quiz_question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own quiz question attempts"
  ON public.quiz_question_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz question attempts"
  ON public.quiz_question_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Study sessions for time on task + retention
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON public.study_sessions(created_at DESC);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own study sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usage events (LLM calls, endpoints, token counts, cost tracking)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  endpoint TEXT,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON public.usage_events(created_at DESC);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own usage events"
  ON public.usage_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage events"
  ON public.usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Funnel events (paywall viewed -> checkout -> cancel)
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_user_id ON public.funnel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON public.funnel_events(created_at DESC);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own funnel events"
  ON public.funnel_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own funnel events"
  ON public.funnel_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Topic mastery rollups (per topic/section accuracy)
CREATE TABLE IF NOT EXISTS public.topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  domain TEXT,
  section TEXT NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  wrong_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempted TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic, section)
);

CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_id ON public.topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_topic ON public.topic_mastery(user_id, topic);

ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own topic mastery"
  ON public.topic_mastery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topic mastery"
  ON public.topic_mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topic mastery"
  ON public.topic_mastery FOR UPDATE
  USING (auth.uid() = user_id);

-- Ensure updated_at stays current
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_topic_mastery_updated_at
  BEFORE UPDATE ON public.topic_mastery
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
