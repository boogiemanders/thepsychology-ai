-- Homepage Personalization: A/B Section Ordering
-- 5 tables + 1 RPC function for dynamic homepage section ordering experiments

-- 1. hp_visitors: Anonymous visitor tracking
CREATE TABLE IF NOT EXISTS hp_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cookie_id TEXT NOT NULL UNIQUE,
  referrer TEXT,
  country TEXT,
  device_type TEXT, -- 'mobile' | 'desktop' | 'tablet'
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  converted_user_id UUID REFERENCES auth.users(id),
  excluded BOOLEAN NOT NULL DEFAULT FALSE, -- true for owner/admin visitors to exclude from reporting
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hp_visitors_cookie_id ON hp_visitors(cookie_id);
CREATE INDEX idx_hp_visitors_converted ON hp_visitors(converted) WHERE converted = TRUE;

-- 2. hp_experiments: Experiment definitions
CREATE TABLE IF NOT EXISTS hp_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  target_referrer TEXT, -- optional filter: only assign if referrer matches
  target_country TEXT, -- optional filter: only assign if country matches
  target_device TEXT,  -- optional filter: only assign if device matches
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hp_experiments_status ON hp_experiments(status);

-- 3. hp_variants: Variants per experiment
CREATE TABLE IF NOT EXISTS hp_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES hp_experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1, -- relative weight for random assignment
  section_order TEXT[] NOT NULL,     -- e.g. '{orbiting,bento,testimonials,pricing,faq,company}'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(experiment_id, name)
);

CREATE INDEX idx_hp_variants_experiment_id ON hp_variants(experiment_id);

-- 4. hp_assignments: Visitor → variant assignment
CREATE TABLE IF NOT EXISTS hp_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES hp_visitors(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES hp_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES hp_variants(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(visitor_id, experiment_id)
);

CREATE INDEX idx_hp_assignments_visitor_id ON hp_assignments(visitor_id);
CREATE INDEX idx_hp_assignments_variant_id ON hp_assignments(variant_id);

-- 5. hp_events: Lightweight event log
CREATE TABLE IF NOT EXISTS hp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES hp_visitors(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES hp_variants(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'section_visible' | 'signup_start' | 'signup_complete'
  section_key TEXT,         -- which section triggered the event (for section_visible)
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hp_events_visitor_id ON hp_events(visitor_id);
CREATE INDEX idx_hp_events_event_type ON hp_events(event_type);
CREATE INDEX idx_hp_events_created_at ON hp_events(created_at);

-- RPC: hp_assign_variant
-- Handles visitor upsert + variant assignment in a single DB round-trip.
-- Returns: variant_id, section_order, variant_name
CREATE OR REPLACE FUNCTION hp_assign_variant(
  p_cookie_id TEXT,
  p_referrer TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_utm_content TEXT DEFAULT NULL,
  p_utm_term TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visitor_id UUID;
  v_experiment_id UUID;
  v_variant_id UUID;
  v_variant_name TEXT;
  v_section_order TEXT[];
  v_total_weight INTEGER;
BEGIN
  -- Upsert visitor
  INSERT INTO hp_visitors (cookie_id, referrer, country, device_type, user_agent,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term)
  VALUES (p_cookie_id, p_referrer, p_country, p_device_type, p_user_agent,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term)
  ON CONFLICT (cookie_id) DO UPDATE SET
    last_seen_at = now(),
    referrer = COALESCE(NULLIF(p_referrer, ''), hp_visitors.referrer),
    country = COALESCE(NULLIF(p_country, ''), hp_visitors.country),
    device_type = COALESCE(NULLIF(p_device_type, ''), hp_visitors.device_type)
  RETURNING id INTO v_visitor_id;

  -- Find an active experiment (pick the first active one; could add targeting later)
  SELECT e.id INTO v_experiment_id
  FROM hp_experiments e
  WHERE e.status = 'active'
    AND (e.target_referrer IS NULL OR p_referrer ILIKE '%' || e.target_referrer || '%')
    AND (e.target_country IS NULL OR e.target_country = p_country)
    AND (e.target_device IS NULL OR e.target_device = p_device_type)
  ORDER BY e.created_at ASC
  LIMIT 1;

  IF v_experiment_id IS NULL THEN
    -- No active experiment → return null (caller uses default order)
    RETURN json_build_object('variant_id', NULL, 'section_order', NULL, 'variant_name', NULL);
  END IF;

  -- Check if visitor already has an assignment for this experiment
  SELECT a.variant_id INTO v_variant_id
  FROM hp_assignments a
  WHERE a.visitor_id = v_visitor_id AND a.experiment_id = v_experiment_id;

  IF v_variant_id IS NOT NULL THEN
    -- Return existing assignment
    SELECT v.name, v.section_order INTO v_variant_name, v_section_order
    FROM hp_variants v WHERE v.id = v_variant_id;

    RETURN json_build_object(
      'variant_id', v_variant_id,
      'section_order', v_section_order,
      'variant_name', v_variant_name
    );
  END IF;

  -- Thompson Sampling assignment (with cold-start fallback)
  -- Count total non-excluded assignments across all variants for this experiment
  SELECT COALESCE(COUNT(*), 0) INTO v_total_weight
  FROM hp_assignments a
    JOIN hp_visitors vis ON vis.id = a.visitor_id AND vis.excluded = FALSE
  WHERE a.experiment_id = v_experiment_id;

  IF v_total_weight < 30 THEN
    -- Cold start: equal-weight random assignment
    SELECT id, name, section_order
    INTO v_variant_id, v_variant_name, v_section_order
    FROM hp_variants
    WHERE experiment_id = v_experiment_id
    ORDER BY random()
    LIMIT 1;
  ELSE
    -- Thompson Sampling: for each variant, sample from Beta(successes+1, failures+1)
    -- using the approximation: Beta sample ≈ use the inverse-CDF via random() quantile
    -- PostgreSQL doesn't have beta_inv, so we use a normal approximation:
    --   mean = a/(a+b), var = a*b/((a+b)^2*(a+b+1))
    --   sample ≈ mean + sqrt(var) * (sum of 12 uniform randoms - 6)  [Box-Muller-like]
    -- This is a well-known approximation for Thompson Sampling at scale.
    SELECT v.id, v.name, v.section_order
    INTO v_variant_id, v_variant_name, v_section_order
    FROM hp_variants v
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS total_assigned,
        COUNT(*) FILTER (WHERE vis.converted = TRUE) AS total_converted
      FROM hp_assignments a
        JOIN hp_visitors vis ON vis.id = a.visitor_id AND vis.excluded = FALSE
      WHERE a.variant_id = v.id
    ) stats ON TRUE
    WHERE v.experiment_id = v_experiment_id
    ORDER BY (
      -- Beta(alpha, beta) approximation using normal distribution
      -- alpha = conversions + 1, beta = non-conversions + 1
      (COALESCE(stats.total_converted, 0) + 1.0) /
        (COALESCE(stats.total_assigned, 0) + 2.0)
      + sqrt(
          ((COALESCE(stats.total_converted, 0) + 1.0) * (COALESCE(stats.total_assigned, 0) - COALESCE(stats.total_converted, 0) + 1.0))
          / (power(COALESCE(stats.total_assigned, 0) + 2.0, 2) * (COALESCE(stats.total_assigned, 0) + 3.0))
        )
        * (random() + random() + random() + random() + random() + random()
         + random() + random() + random() + random() + random() + random() - 6.0)
    ) DESC
    LIMIT 1;
  END IF;

  IF v_variant_id IS NULL THEN
    RETURN json_build_object('variant_id', NULL, 'section_order', NULL, 'variant_name', NULL);
  END IF;

  -- Record the assignment
  INSERT INTO hp_assignments (visitor_id, experiment_id, variant_id)
  VALUES (v_visitor_id, v_experiment_id, v_variant_id);

  RETURN json_build_object(
    'variant_id', v_variant_id,
    'section_order', v_section_order,
    'variant_name', v_variant_name
  );
END;
$$;

-- RLS: service role only (no client-side access)
ALTER TABLE hp_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hp_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hp_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hp_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hp_events ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service role can access
