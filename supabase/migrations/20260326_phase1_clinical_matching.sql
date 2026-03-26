-- =============================================================================
-- PHASE 1: CLINICAL MATCHING PLATFORM
-- User roles, provider profiles, client intake, PHI audit logging
-- =============================================================================

-- --------------------------------------------------------------------------
-- 1A. ALTER public.users — add role columns
-- --------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('student', 'client', 'provider', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS user_role public.user_role NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS secondary_roles TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_users_user_role ON public.users(user_role);

-- --------------------------------------------------------------------------
-- 1B. provider_profiles
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status lifecycle
  status                    TEXT NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'pending_review', 'active', 'suspended', 'inactive')),

  -- Credentials
  license_type              TEXT,
  license_number            TEXT,
  license_state             TEXT,
  npi_number                TEXT,
  multi_state_licensed      BOOLEAN NOT NULL DEFAULT FALSE,
  licensed_states           TEXT[] NOT NULL DEFAULT '{}',
  credential_verified_at    TIMESTAMPTZ,
  credential_verified_by    UUID REFERENCES auth.users(id),

  -- Specializations
  modalities                TEXT[] NOT NULL DEFAULT '{}',
  conditions_treated        TEXT[] NOT NULL DEFAULT '{}',
  populations_served        TEXT[] NOT NULL DEFAULT '{}',

  -- Therapeutic style (1-10 scales)
  style_directive           SMALLINT CHECK (style_directive BETWEEN 1 AND 10),
  style_present_focused     SMALLINT CHECK (style_present_focused BETWEEN 1 AND 10),
  style_insight_behavioral  SMALLINT CHECK (style_insight_behavioral BETWEEN 1 AND 10),
  style_warmth_professional SMALLINT CHECK (style_warmth_professional BETWEEN 1 AND 10),

  -- Cultural competencies
  languages_spoken          TEXT[] NOT NULL DEFAULT '{English}',
  lgbtq_affirming           BOOLEAN NOT NULL DEFAULT FALSE,
  faith_integrated          BOOLEAN NOT NULL DEFAULT FALSE,
  faith_traditions          TEXT[] NOT NULL DEFAULT '{}',
  racial_cultural_focus     TEXT[] NOT NULL DEFAULT '{}',

  -- Practical / logistics
  insurance_networks        TEXT[] NOT NULL DEFAULT '{}',
  accepts_self_pay          BOOLEAN NOT NULL DEFAULT TRUE,
  self_pay_rate_cents       INTEGER,
  sliding_scale_available   BOOLEAN NOT NULL DEFAULT FALSE,
  sliding_scale_min_cents   INTEGER,
  telehealth_only           BOOLEAN NOT NULL DEFAULT TRUE,
  telehealth_states         TEXT[] NOT NULL DEFAULT '{}',

  -- Free text
  bio_text                  TEXT,
  approach_text             TEXT,

  -- pgvector embeddings (text-embedding-3-small = 1536 dims)
  bio_embedding             VECTOR(1536),
  approach_embedding        VECTOR(1536),

  -- Timestamps
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id ON public.provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_status ON public.provider_profiles(status);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_license_state ON public.provider_profiles(license_state);

CREATE INDEX IF NOT EXISTS idx_provider_bio_embedding
  ON public.provider_profiles
  USING ivfflat (bio_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_provider_approach_embedding
  ON public.provider_profiles
  USING ivfflat (approach_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE TRIGGER set_provider_profiles_updated_at
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can select their own profile"
  ON public.provider_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert their own profile"
  ON public.provider_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can update their own profile"
  ON public.provider_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Active profiles are publicly readable"
  ON public.provider_profiles FOR SELECT
  USING (status = 'active');

CREATE POLICY "Service role can manage all provider profiles"
  ON public.provider_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- --------------------------------------------------------------------------
-- 1C. client_intake_profiles
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_intake_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Presenting concerns
  conditions_seeking_help     TEXT[] NOT NULL DEFAULT '{}',
  concern_severity            SMALLINT CHECK (concern_severity BETWEEN 1 AND 10),
  presenting_concerns_text    TEXT,

  -- Previous therapy
  has_previous_therapy        BOOLEAN,
  previous_therapy_count      TEXT,
  what_worked_text            TEXT,
  what_didnt_work_text        TEXT,

  -- Therapist preferences
  preferred_modalities        TEXT[] NOT NULL DEFAULT '{}',
  preferred_therapist_gender  TEXT CHECK (preferred_therapist_gender IN ('no_preference', 'female', 'male', 'nonbinary')),
  preferred_therapist_age     TEXT CHECK (preferred_therapist_age IN ('no_preference', '25-35', '35-50', '50+')),

  -- Style match preferences (mirror provider scales)
  pref_style_directive        SMALLINT CHECK (pref_style_directive BETWEEN 1 AND 10),
  pref_style_present_focused  SMALLINT CHECK (pref_style_present_focused BETWEEN 1 AND 10),
  pref_style_insight_behavioral SMALLINT CHECK (pref_style_insight_behavioral BETWEEN 1 AND 10),
  pref_style_warmth_professional SMALLINT CHECK (pref_style_warmth_professional BETWEEN 1 AND 10),

  -- Cultural preferences
  preferred_languages         TEXT[] NOT NULL DEFAULT '{English}',
  lgbtq_affirming_required    BOOLEAN NOT NULL DEFAULT FALSE,
  faith_integrated_preferred  BOOLEAN NOT NULL DEFAULT FALSE,
  cultural_background         TEXT,

  -- Insurance
  has_insurance               BOOLEAN,
  insurance_payer_name        TEXT,
  insurance_payer_id          TEXT,
  insurance_member_id         TEXT,
  insurance_group_number      TEXT,
  insurance_plan_name         TEXT,
  interested_in_self_pay      BOOLEAN NOT NULL DEFAULT FALSE,
  max_self_pay_rate_cents     INTEGER,

  -- Practical
  state_of_residence          TEXT,
  telehealth_preference       TEXT NOT NULL DEFAULT 'telehealth_only'
                                CHECK (telehealth_preference IN ('telehealth_only', 'in_person_only', 'no_preference')),
  availability_notes          TEXT,

  -- Embeddings
  concern_embedding           VECTOR(1536),
  preferences_embedding       VECTOR(1536),

  -- Consent gates (NULL = not yet given)
  hipaa_consent_given_at      TIMESTAMPTZ,
  matching_consent_given_at   TIMESTAMPTZ,

  -- Timestamps
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_client_intake_user_id ON public.client_intake_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_intake_state ON public.client_intake_profiles(state_of_residence);

CREATE INDEX IF NOT EXISTS idx_client_concern_embedding
  ON public.client_intake_profiles
  USING ivfflat (concern_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_client_preferences_embedding
  ON public.client_intake_profiles
  USING ivfflat (preferences_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE TRIGGER set_client_intake_updated_at
  BEFORE UPDATE ON public.client_intake_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.client_intake_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can select their own intake"
  ON public.client_intake_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can insert their own intake"
  ON public.client_intake_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clients can update their own intake"
  ON public.client_intake_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all client intakes"
  ON public.client_intake_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- --------------------------------------------------------------------------
-- 1D. phi_access_log (immutable audit — INSERT only, no UPDATE/DELETE)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.phi_access_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessor_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessor_role   TEXT NOT NULL,
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_type     TEXT NOT NULL CHECK (access_type IN (
                    'intake_view',
                    'insurance_view',
                    'profile_match_view',
                    'admin_view',
                    'export'
                  )),
  resource_table  TEXT,
  resource_id     UUID,
  ip_address      INET,
  user_agent      TEXT,
  request_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phi_access_log_accessor_id ON public.phi_access_log(accessor_id);
CREATE INDEX IF NOT EXISTS idx_phi_access_log_client_id ON public.phi_access_log(client_id);
CREATE INDEX IF NOT EXISTS idx_phi_access_log_created_at ON public.phi_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phi_access_log_access_type ON public.phi_access_log(access_type);

ALTER TABLE public.phi_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert phi access log"
  ON public.phi_access_log FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can read phi access log"
  ON public.phi_access_log FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Clients can read their own phi access log"
  ON public.phi_access_log FOR SELECT
  USING (auth.uid() = client_id);
