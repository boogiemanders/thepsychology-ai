-- =============================================================================
-- PHASE 2A: PROVIDER DEMOGRAPHICS
-- Clients are already asked for gender + age preferences during intake, but
-- provider_profiles never stored either — those dimensions scored as dead.
-- Adds gender, pronouns (display only), and age_bracket so the score engine
-- can match against them. All optional; providers may decline to answer.
-- =============================================================================

ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS gender TEXT
    CHECK (gender IN ('female', 'male', 'nonbinary', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS pronouns TEXT,
  ADD COLUMN IF NOT EXISTS age_bracket TEXT
    CHECK (age_bracket IN ('25-35', '35-50', '50+', 'prefer_not_to_say'));
