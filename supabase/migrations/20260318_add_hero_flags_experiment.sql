-- Add flags JSONB column to hp_variants for per-variant feature flags
-- Used for hero badge/tagline visibility A/B testing
ALTER TABLE hp_variants ADD COLUMN IF NOT EXISTS flags JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Update RPC to return flags alongside section_order
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
  v_flags JSONB;
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

  -- Find an active experiment (pick the first active one)
  SELECT e.id INTO v_experiment_id
  FROM hp_experiments e
  WHERE e.status = 'active'
    AND (e.target_referrer IS NULL OR p_referrer ILIKE '%' || e.target_referrer || '%')
    AND (e.target_country IS NULL OR e.target_country = p_country)
    AND (e.target_device IS NULL OR e.target_device = p_device_type)
  ORDER BY e.created_at ASC
  LIMIT 1;

  IF v_experiment_id IS NULL THEN
    RETURN json_build_object('variant_id', NULL, 'section_order', NULL, 'variant_name', NULL, 'flags', '{}'::jsonb);
  END IF;

  -- Check if visitor already has an assignment for this experiment
  SELECT a.variant_id INTO v_variant_id
  FROM hp_assignments a
  WHERE a.visitor_id = v_visitor_id AND a.experiment_id = v_experiment_id;

  IF v_variant_id IS NOT NULL THEN
    SELECT v.name, v.section_order, v.flags INTO v_variant_name, v_section_order, v_flags
    FROM hp_variants v WHERE v.id = v_variant_id;

    RETURN json_build_object(
      'variant_id', v_variant_id,
      'section_order', v_section_order,
      'variant_name', v_variant_name,
      'flags', COALESCE(v_flags, '{}'::jsonb)
    );
  END IF;

  -- Thompson Sampling assignment (with cold-start fallback)
  SELECT COALESCE(COUNT(*), 0) INTO v_total_weight
  FROM hp_assignments a
    JOIN hp_visitors vis ON vis.id = a.visitor_id AND vis.excluded = FALSE
  WHERE a.experiment_id = v_experiment_id;

  IF v_total_weight < 30 THEN
    SELECT id, name, section_order, flags
    INTO v_variant_id, v_variant_name, v_section_order, v_flags
    FROM hp_variants
    WHERE experiment_id = v_experiment_id
    ORDER BY random()
    LIMIT 1;
  ELSE
    -- Thompson Sampling: Beta(successes+1, failures+1) normal approximation
    -- Composite score: 70% conversion weight + 30% scroll depth weight
    SELECT v.id, v.name, v.section_order, v.flags
    INTO v_variant_id, v_variant_name, v_section_order, v_flags
    FROM hp_variants v
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS total_assigned,
        COUNT(*) FILTER (WHERE vis.converted = TRUE) AS total_converted,
        -- Scroll depth: avg fraction of sections seen per visitor
        COALESCE(AVG(section_depth.depth), 0) AS avg_scroll_depth
      FROM hp_assignments a
        JOIN hp_visitors vis ON vis.id = a.visitor_id AND vis.excluded = FALSE
        LEFT JOIN LATERAL (
          SELECT COUNT(DISTINCT e.section_key)::FLOAT /
            GREATEST(array_length(v.section_order, 1), 1) AS depth
          FROM hp_events e
          WHERE e.visitor_id = a.visitor_id
            AND e.variant_id = a.variant_id
            AND e.event_type = 'section_visible'
        ) section_depth ON TRUE
      WHERE a.variant_id = v.id
    ) stats ON TRUE
    WHERE v.experiment_id = v_experiment_id
    ORDER BY (
      -- Composite Thompson sample: 70% conversion + 30% scroll depth
      0.7 * (
        (COALESCE(stats.total_converted, 0) + 1.0) /
          (COALESCE(stats.total_assigned, 0) + 2.0)
        + sqrt(
            ((COALESCE(stats.total_converted, 0) + 1.0) * (COALESCE(stats.total_assigned, 0) - COALESCE(stats.total_converted, 0) + 1.0))
            / (power(COALESCE(stats.total_assigned, 0) + 2.0, 2) * (COALESCE(stats.total_assigned, 0) + 3.0))
          )
          * (random() + random() + random() + random() + random() + random()
           + random() + random() + random() + random() + random() + random() - 6.0)
      )
      + 0.3 * COALESCE(stats.avg_scroll_depth, 0.5)
    ) DESC
    LIMIT 1;
  END IF;

  IF v_variant_id IS NULL THEN
    RETURN json_build_object('variant_id', NULL, 'section_order', NULL, 'variant_name', NULL, 'flags', '{}'::jsonb);
  END IF;

  -- Record the assignment
  INSERT INTO hp_assignments (visitor_id, experiment_id, variant_id)
  VALUES (v_visitor_id, v_experiment_id, v_variant_id);

  RETURN json_build_object(
    'variant_id', v_variant_id,
    'section_order', v_section_order,
    'variant_name', v_variant_name,
    'flags', COALESCE(v_flags, '{}'::jsonb)
  );
END;
$$;

-- Update existing variants with default flags (both shown = current behavior)
UPDATE hp_variants
SET flags = '{"showHeroBadge": true, "showHeroTagline": true}'::jsonb
WHERE flags = '{}'::jsonb;

-- Seed hero badge/tagline experiment
-- This runs alongside the section-order experiment via the flags system.
-- Since the RPC picks the first active experiment, we add hero flags
-- directly to the existing section-order variants. Each existing variant
-- gets randomly assigned one of the 4 hero combos to decouple the tests.
-- Alternatively, we can add this as flag variations on the control variant.

-- For now, add 3 new variants to the existing experiment that test
-- different hero flag combos with the control section order.
-- The bandit will naturally find the best combo.

INSERT INTO hp_variants (experiment_id, name, weight, section_order, flags)
VALUES
  -- Control order, no badge
  ('a0000000-0000-0000-0000-000000000001', 'no-badge', 1,
   '{problem,orbiting,bento,vision,testimonials,pricing,faq,company}',
   '{"showHeroBadge": false, "showHeroTagline": true}'),
  -- Control order, no tagline
  ('a0000000-0000-0000-0000-000000000001', 'no-tagline', 1,
   '{problem,orbiting,bento,vision,testimonials,pricing,faq,company}',
   '{"showHeroBadge": true, "showHeroTagline": false}'),
  -- Control order, neither badge nor tagline
  ('a0000000-0000-0000-0000-000000000001', 'no-badge-no-tagline', 1,
   '{problem,orbiting,bento,vision,testimonials,pricing,faq,company}',
   '{"showHeroBadge": false, "showHeroTagline": false}');
