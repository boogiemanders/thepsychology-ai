-- Research Data Collection & Consent System
-- HIPAA/FERPA/IRB/APA compliant consent management and de-identified research data collection

-- =============================================================================
-- 1. USER CONSENT PREFERENCES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_consent_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Granular consent toggles
  consent_personal_tracking BOOLEAN NOT NULL DEFAULT TRUE,
  consent_ai_insights BOOLEAN NOT NULL DEFAULT TRUE,
  consent_research_contribution BOOLEAN NOT NULL DEFAULT FALSE,
  consent_marketing_communications BOOLEAN NOT NULL DEFAULT FALSE,

  -- Version tracking for legal compliance
  consent_version TEXT NOT NULL DEFAULT '1.0',
  privacy_policy_version TEXT,
  terms_version TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_consent_preferences_user_id ON public.user_consent_preferences(user_id);

ALTER TABLE public.user_consent_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own consent preferences"
  ON public.user_consent_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent preferences"
  ON public.user_consent_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent preferences"
  ON public.user_consent_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all consent preferences"
  ON public.user_consent_preferences FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- 2. CONSENT AUDIT LOG (Immutable for compliance)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What changed
  consent_type TEXT NOT NULL CHECK (consent_type IN ('personal_tracking', 'ai_insights', 'research_contribution', 'marketing_communications', 'all')),
  old_value BOOLEAN,
  new_value BOOLEAN NOT NULL,

  -- Context for audit trail
  ip_address INET,
  user_agent TEXT,
  consent_method TEXT NOT NULL CHECK (consent_method IN ('settings_page', 'signup', 'modal', 'api', 'admin')),
  consent_version TEXT NOT NULL,

  -- Immutable timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_log_user_id ON public.consent_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_log_created_at ON public.consent_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_audit_log_consent_type ON public.consent_audit_log(consent_type);

ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only read their own audit log
CREATE POLICY "Users can read their own consent audit log"
  ON public.consent_audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (via API, not direct user insert)
CREATE POLICY "Service role can insert consent audit log"
  ON public.consent_audit_log FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- No updates or deletes allowed (immutable)
-- No UPDATE or DELETE policies = immutable

-- =============================================================================
-- 3. GRADUATE PROGRAMS REFERENCE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.graduate_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  program_type TEXT CHECK (program_type IN ('PhD', 'PsyD', 'EdD', 'Other')),
  accreditation TEXT CHECK (accreditation IN ('APA', 'PCSAS', 'Both', 'Neither', 'Unknown')),
  state TEXT,
  country TEXT DEFAULT 'USA',

  -- Official identifier if available
  apa_program_id TEXT,

  -- Metadata
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(name, institution)
);

CREATE INDEX IF NOT EXISTS idx_graduate_programs_name ON public.graduate_programs(name);
CREATE INDEX IF NOT EXISTS idx_graduate_programs_institution ON public.graduate_programs(institution);
CREATE INDEX IF NOT EXISTS idx_graduate_programs_state ON public.graduate_programs(state);

ALTER TABLE public.graduate_programs ENABLE ROW LEVEL SECURITY;

-- Anyone can read programs (public reference data)
CREATE POLICY "Anyone can read graduate programs"
  ON public.graduate_programs FOR SELECT
  USING (true);

-- Only service role can manage
CREATE POLICY "Service role can manage graduate programs"
  ON public.graduate_programs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- 4. USER RESEARCH PROFILE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_research_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Graduate Program Info
  graduate_program_id UUID REFERENCES public.graduate_programs(id),
  graduate_program_name TEXT,  -- Free text if not in reference table
  graduate_program_type TEXT CHECK (graduate_program_type IN ('PhD', 'PsyD', 'EdD', 'Other')),
  graduation_year INTEGER,
  program_accreditation TEXT CHECK (program_accreditation IN ('APA', 'PCSAS', 'Both', 'Neither', 'Unknown')),

  -- Pre-Training Background
  undergraduate_major TEXT,
  years_clinical_experience INTEGER,
  practicum_settings TEXT[],  -- 'hospital', 'community_mental_health', 'private_practice', 'university_clinic', 'va', 'forensic', 'other'

  -- Self-Assessment
  self_assessed_readiness INTEGER CHECK (self_assessed_readiness BETWEEN 1 AND 10),
  previous_exam_attempts INTEGER DEFAULT 0,
  study_hours_per_week INTEGER,

  -- Learning Patterns
  preferred_study_time TEXT CHECK (preferred_study_time IN ('morning', 'afternoon', 'evening', 'night', 'varies')),
  preferred_study_duration INTEGER,  -- minutes per session

  -- Demographics (optional, for disparities research)
  age_range TEXT CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55+')),
  gender TEXT,
  ethnicity TEXT[],
  first_generation_graduate BOOLEAN,

  -- Metadata
  profile_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_research_profile_user_id ON public.user_research_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_research_profile_program_id ON public.user_research_profile(graduate_program_id);
CREATE INDEX IF NOT EXISTS idx_user_research_profile_graduation_year ON public.user_research_profile(graduation_year);

ALTER TABLE public.user_research_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own research profile"
  ON public.user_research_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own research profile"
  ON public.user_research_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research profile"
  ON public.user_research_profile FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all research profiles"
  ON public.user_research_profile FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- 5. RESEARCH DATA EXPORTS AUDIT TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.research_data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Export metadata
  export_type TEXT NOT NULL CHECK (export_type IN ('full_aggregate', 'program_specific', 'domain_analysis', 'custom')),
  requested_by TEXT NOT NULL,  -- Admin user ID
  purpose TEXT NOT NULL,
  irb_protocol_number TEXT,

  -- What was exported (no actual PII stored)
  user_count INTEGER NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  filters_applied JSONB,

  -- File verification
  export_file_hash TEXT,  -- SHA-256 of exported file

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_data_exports_created_at ON public.research_data_exports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_data_exports_irb ON public.research_data_exports(irb_protocol_number);

ALTER TABLE public.research_data_exports ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role can manage research data exports"
  ON public.research_data_exports FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- 6. ADD COLUMNS TO USERS TABLE
-- =============================================================================

-- Anonymized research identifier (never exported alongside PII)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS research_id UUID DEFAULT gen_random_uuid();

-- Link to graduate program
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS graduate_program_id UUID REFERENCES public.graduate_programs(id);

-- Consent tracking timestamps
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS research_consent_given_at TIMESTAMPTZ;

-- Data deletion request tracking
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS data_deletion_requested_at TIMESTAMPTZ;

-- Indexes for research queries
CREATE INDEX IF NOT EXISTS idx_users_research_id ON public.users(research_id);
CREATE INDEX IF NOT EXISTS idx_users_graduate_program_id ON public.users(graduate_program_id);

-- Comment for documentation
COMMENT ON COLUMN public.users.research_id IS 'Anonymized identifier for research exports - never linked to user_id in exports';

-- =============================================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Trigger for user_consent_preferences
DROP TRIGGER IF EXISTS update_user_consent_preferences_updated_at ON public.user_consent_preferences;
CREATE TRIGGER update_user_consent_preferences_updated_at
  BEFORE UPDATE ON public.user_consent_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_research_profile
DROP TRIGGER IF EXISTS update_user_research_profile_updated_at ON public.user_research_profile;
CREATE TRIGGER update_user_research_profile_updated_at
  BEFORE UPDATE ON public.user_research_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. SEED SOME INITIAL GRADUATE PROGRAMS (APA-Accredited Clinical Psychology)
-- =============================================================================

INSERT INTO public.graduate_programs (name, institution, program_type, accreditation, state) VALUES
  ('Clinical Psychology', 'University of California, Los Angeles', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'University of California, Berkeley', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'Stanford University', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'University of Michigan', 'PhD', 'APA', 'MI'),
  ('Clinical Psychology', 'University of Wisconsin-Madison', 'PhD', 'APA', 'WI'),
  ('Clinical Psychology', 'University of Illinois at Urbana-Champaign', 'PhD', 'APA', 'IL'),
  ('Clinical Psychology', 'University of Minnesota', 'PhD', 'APA', 'MN'),
  ('Clinical Psychology', 'University of Pennsylvania', 'PhD', 'APA', 'PA'),
  ('Clinical Psychology', 'Yale University', 'PhD', 'APA', 'CT'),
  ('Clinical Psychology', 'Harvard University', 'PhD', 'APA', 'MA'),
  ('Clinical Psychology', 'Duke University', 'PhD', 'APA', 'NC'),
  ('Clinical Psychology', 'Emory University', 'PhD', 'APA', 'GA'),
  ('Clinical Psychology', 'University of Texas at Austin', 'PhD', 'APA', 'TX'),
  ('Clinical Psychology', 'University of Washington', 'PhD', 'APA', 'WA'),
  ('Clinical Psychology', 'University of Virginia', 'PhD', 'APA', 'VA'),
  ('Clinical Psychology', 'Northwestern University', 'PhD', 'APA', 'IL'),
  ('Clinical Psychology', 'Rutgers University', 'PsyD', 'APA', 'NJ'),
  ('Clinical Psychology', 'Alliant International University', 'PsyD', 'APA', 'CA'),
  ('Clinical Psychology', 'Pepperdine University', 'PsyD', 'APA', 'CA'),
  ('Clinical Psychology', 'Nova Southeastern University', 'PsyD', 'APA', 'FL')
ON CONFLICT (name, institution) DO NOTHING;
