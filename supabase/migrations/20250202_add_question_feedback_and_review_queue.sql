-- Per-question feedback + spaced repetition review queue

-- Feedback on individual questions (clarity, usefulness, confidence)
CREATE TABLE IF NOT EXISTS public.question_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('quiz', 'diagnostic', 'practice')),
  question_id TEXT,
  question TEXT,
  options TEXT[],
  selected_answer TEXT,
  correct_answer TEXT,
  was_correct BOOLEAN,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5),
  comment TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_feedback_user_id ON public.question_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_question_feedback_question_key ON public.question_feedback(question_key);
CREATE INDEX IF NOT EXISTS idx_question_feedback_created_at ON public.question_feedback(created_at DESC);

ALTER TABLE public.question_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own question feedback"
  ON public.question_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question feedback"
  ON public.question_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Spaced repetition queue (SM-2 style scheduling)
CREATE TABLE IF NOT EXISTS public.review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  exam_type TEXT CHECK (exam_type IN ('quiz', 'diagnostic', 'practice')),
  topic TEXT,
  domain TEXT,
  section TEXT,
  question TEXT,
  options TEXT[],
  correct_answer TEXT,
  last_answer TEXT,
  last_was_correct BOOLEAN,
  last_attempted TIMESTAMP WITH TIME ZONE,
  repetitions INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 0,
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  next_review_at TIMESTAMP WITH TIME ZONE NOT NULL,
  suspended BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_review_queue_user_next_review ON public.review_queue(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_review_queue_next_review ON public.review_queue(next_review_at);

ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own review queue"
  ON public.review_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review queue items"
  ON public.review_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review queue items"
  ON public.review_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- Keep updated_at current (function is also created in other migrations; safe to re-define)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_review_queue_updated_at ON public.review_queue;
CREATE TRIGGER update_review_queue_updated_at
  BEFORE UPDATE ON public.review_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
