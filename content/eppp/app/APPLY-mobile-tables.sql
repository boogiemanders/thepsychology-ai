-- =============================================================================
-- Mobile App Tables — Paste-in bundle for Supabase Studio SQL Editor
-- Source: supabase/migrations/20260326_create_mobile_app_tables.sql
-- Safe to re-run: all CREATEs use IF NOT EXISTS and CREATE OR REPLACE.
-- =============================================================================

-- Ensure the shared updated_at trigger function exists (defined originally in
-- 20250201_add_progress_tracking_tables.sql). CREATE OR REPLACE is idempotent.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. lesson_progress
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL,
  domain_number INTEGER,
  completion_pct INTEGER DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),
  sections_completed JSONB DEFAULT '[]'::jsonb,
  audio_listened BOOLEAN DEFAULT FALSE,
  last_position_sec INTEGER DEFAULT 0,
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'widget')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_slug)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can read their own lesson progress"
  ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can insert their own lesson progress"
  ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can update their own lesson progress"
  ON public.lesson_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. mobile_devices
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mobile_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  platform TEXT DEFAULT 'ios',
  push_token TEXT,
  app_version TEXT,
  os_version TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

CREATE INDEX IF NOT EXISTS idx_mobile_devices_user_id ON public.mobile_devices(user_id);

ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own devices" ON public.mobile_devices;
CREATE POLICY "Users can read their own devices"
  ON public.mobile_devices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own devices" ON public.mobile_devices;
CREATE POLICY "Users can insert their own devices"
  ON public.mobile_devices FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own devices" ON public.mobile_devices;
CREATE POLICY "Users can update their own devices"
  ON public.mobile_devices FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. mobile_sync_queue
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mobile_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.mobile_devices(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL,
  operation_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(operation_id)
);

CREATE INDEX IF NOT EXISTS idx_mobile_sync_queue_user_id ON public.mobile_sync_queue(user_id);

ALTER TABLE public.mobile_sync_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own sync queue" ON public.mobile_sync_queue;
CREATE POLICY "Users can read their own sync queue"
  ON public.mobile_sync_queue FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sync queue" ON public.mobile_sync_queue;
CREATE POLICY "Users can insert their own sync queue"
  ON public.mobile_sync_queue FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sync queue" ON public.mobile_sync_queue;
CREATE POLICY "Users can update their own sync queue"
  ON public.mobile_sync_queue FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. study_streaks
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.study_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_date DATE NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  lessons_progressed INTEGER DEFAULT 0,
  study_minutes INTEGER DEFAULT 0,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_date)
);

CREATE INDEX IF NOT EXISTS idx_study_streaks_user_id ON public.study_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_study_streaks_user_date ON public.study_streaks(user_id, streak_date);

ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own streaks" ON public.study_streaks;
CREATE POLICY "Users can read their own streaks"
  ON public.study_streaks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own streaks" ON public.study_streaks;
CREATE POLICY "Users can insert their own streaks"
  ON public.study_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own streaks" ON public.study_streaks;
CREATE POLICY "Users can update their own streaks"
  ON public.study_streaks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5. content_bundle_versions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.content_bundle_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bundle_id TEXT NOT NULL,
  bundle_type TEXT NOT NULL CHECK (bundle_type IN ('lesson', 'exam', 'playlist', 'smart_study')),
  version TEXT NOT NULL,
  checksum TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bundle_id)
);

CREATE INDEX IF NOT EXISTS idx_content_bundle_versions_user_id ON public.content_bundle_versions(user_id);

ALTER TABLE public.content_bundle_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own bundle versions" ON public.content_bundle_versions;
CREATE POLICY "Users can read their own bundle versions"
  ON public.content_bundle_versions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bundle versions" ON public.content_bundle_versions;
CREATE POLICY "Users can insert their own bundle versions"
  ON public.content_bundle_versions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bundle versions" ON public.content_bundle_versions;
CREATE POLICY "Users can update their own bundle versions"
  ON public.content_bundle_versions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Smoke test: verify tables exist
-- =============================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'lesson_progress','mobile_devices','mobile_sync_queue',
    'study_streaks','content_bundle_versions'
  )
ORDER BY table_name;
