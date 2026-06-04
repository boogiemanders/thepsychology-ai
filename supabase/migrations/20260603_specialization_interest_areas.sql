-- =============================================================================
-- PHASE 2B: SPECIAL INTEREST AREAS
-- Secondary specialization tier below conditions (e.g. "Anorexia" under
-- "Eating Disorders", "Psychedelic Integration", "Sports Psychology").
-- Providers tag up to 5, clients optionally pick up to 3 during intake.
-- The score engine blends this into the specialization dimension.
-- =============================================================================

ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS interest_areas TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.client_intake_profiles
  ADD COLUMN IF NOT EXISTS interest_areas TEXT[] NOT NULL DEFAULT '{}';
