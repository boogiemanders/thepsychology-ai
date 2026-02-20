-- Live theme tracking for active users
-- Stores the currently rendered theme so admins can analyze active user mode usage.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS current_theme TEXT,
  ADD COLUMN IF NOT EXISTS theme_preference TEXT,
  ADD COLUMN IF NOT EXISTS theme_last_seen_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_current_theme_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_current_theme_check
      CHECK (current_theme IS NULL OR current_theme IN ('light', 'dark'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_theme_preference_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_theme_preference_check
      CHECK (theme_preference IS NULL OR theme_preference IN ('light', 'dark', 'system'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_theme_last_seen_at
  ON public.users(theme_last_seen_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_users_current_theme
  ON public.users(current_theme);

-- Backfill best-effort values from explicit theme choices.
UPDATE public.users AS u
SET
  current_theme = p.theme,
  theme_preference = p.theme,
  theme_last_seen_at = COALESCE(p.updated_at, p.created_at)
FROM public.user_theme_preference AS p
WHERE p.user_id = u.id
  AND (
    u.theme_last_seen_at IS NULL
    OR u.theme_last_seen_at < COALESCE(p.updated_at, p.created_at)
  );
