-- Mobile app tables: lesson progress, devices, sync queue, streaks, content bundles

-- =============================================================================
-- 1. lesson_progress — per-lesson completion tracking (web + mobile)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL,               -- matches the markdown filename
  domain_number INTEGER,
  completion_pct INTEGER DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),
  sections_completed JSONB DEFAULT '[]'::jsonb,
  audio_listened BOOLEAN DEFAULT FALSE,
  last_position_sec INTEGER DEFAULT 0,     -- audio resume point
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'widget')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_slug)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own lesson progress"
  ON public.lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson progress"
  ON public.lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress"
  ON public.lesson_progress FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 2. mobile_devices — registered mobile devices for push/sync
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

CREATE POLICY "Users can read their own devices"
  ON public.mobile_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON public.mobile_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON public.mobile_devices FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. mobile_sync_queue — outbound sync operations from mobile
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mobile_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.mobile_devices(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL,            -- e.g. 'exam_result_submitted', 'lesson_progress_upsert'
  operation_id UUID NOT NULL,             -- client-generated UUID for idempotency
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(operation_id)                    -- idempotency key
);

CREATE INDEX IF NOT EXISTS idx_mobile_sync_queue_user_id ON public.mobile_sync_queue(user_id);

ALTER TABLE public.mobile_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own sync queue"
  ON public.mobile_sync_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync queue"
  ON public.mobile_sync_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync queue"
  ON public.mobile_sync_queue FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. study_streaks — daily study activity tracking
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

CREATE POLICY "Users can read their own streaks"
  ON public.study_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON public.study_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.study_streaks FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5. content_bundle_versions — tracks downloaded content versions per user
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

CREATE POLICY "Users can read their own bundle versions"
  ON public.content_bundle_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bundle versions"
  ON public.content_bundle_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bundle versions"
  ON public.content_bundle_versions FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Triggers: keep updated_at current on tables that have it
-- =============================================================================
-- Reuse update_updated_at_column() from 20250201_add_progress_tracking_tables.sql

CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
