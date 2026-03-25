-- Custom audio generations for personalized topic-teacher lessons
CREATE TABLE IF NOT EXISTS custom_audio_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  interest TEXT,
  language TEXT,
  content_hash TEXT NOT NULL,
  r2_prefix TEXT NOT NULL,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds REAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  stripe_checkout_session_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id, content_hash)
);

CREATE INDEX idx_custom_audio_user_lesson ON custom_audio_generations(user_id, lesson_id);

CREATE TABLE IF NOT EXISTS custom_audio_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES custom_audio_generations(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  audio_r2_key TEXT NOT NULL,
  timings_r2_key TEXT NOT NULL,
  duration_seconds REAL,
  UNIQUE(generation_id, chunk_index)
);

-- RLS: users can SELECT their own rows
ALTER TABLE custom_audio_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_audio_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generations"
  ON custom_audio_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view chunks of their own generations"
  ON custom_audio_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_audio_generations g
      WHERE g.id = custom_audio_chunks.generation_id
      AND g.user_id = auth.uid()
    )
  );
