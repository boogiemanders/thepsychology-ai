-- Allow standalone lab signups (for example Dental Figure Extractor)
-- to provision a plain free account with no EPPP trial attached.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_at timestamptz := COALESCE(NEW.created_at, NOW());
  v_referral_source text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'referral_source', '')), '');
  v_full_name text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  v_utm_source text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'utm_source', '')), '');
  v_utm_medium text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'utm_medium', '')), '');
  v_utm_campaign text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'utm_campaign', '')), '');
  v_utm_content text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'utm_content', '')), '');
  v_utm_term text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'utm_term', '')), '');
  v_signup_source text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'signup_source', '')), '');
  v_skip_trial boolean := LOWER(COALESCE(NEW.raw_user_meta_data->>'skip_trial', '')) IN ('1', 'true', 't', 'yes', 'y', 'on');
  v_is_standalone_free boolean := v_skip_trial OR v_signup_source = 'lab_dental';
  v_subscription_tier text := CASE WHEN v_is_standalone_free THEN 'free' ELSE 'pro' END;
  v_subscription_started_at timestamptz := CASE WHEN v_is_standalone_free THEN NULL ELSE v_created_at END;
  v_trial_ends_at timestamptz := CASE WHEN v_is_standalone_free THEN NULL ELSE v_created_at + INTERVAL '7 days' END;
BEGIN
  IF v_is_standalone_free AND v_referral_source IS NULL THEN
    v_referral_source := 'lab_dental';
  END IF;

  INSERT INTO public.users (
    id,
    email,
    full_name,
    created_at,
    subscription_tier,
    subscription_started_at,
    trial_ends_at,
    referral_source,
    referral_code,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_created_at,
    v_subscription_tier,
    v_subscription_started_at,
    v_trial_ends_at,
    v_referral_source,
    UPPER(SUBSTRING(MD5(RANDOM()::text || NEW.id::text) FROM 1 FOR 8)),
    v_utm_source,
    v_utm_medium,
    v_utm_campaign,
    v_utm_content,
    v_utm_term
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
    referral_source = COALESCE(public.users.referral_source, EXCLUDED.referral_source),
    referral_code = COALESCE(public.users.referral_code, EXCLUDED.referral_code),
    subscription_tier = CASE
      WHEN public.users.stripe_customer_id IS NOT NULL THEN public.users.subscription_tier
      WHEN v_is_standalone_free THEN 'free'
      WHEN public.users.subscription_tier = 'free' AND public.users.trial_ends_at IS NULL THEN 'pro'
      ELSE public.users.subscription_tier
    END,
    subscription_started_at = CASE
      WHEN v_is_standalone_free THEN NULL
      ELSE COALESCE(public.users.subscription_started_at, EXCLUDED.subscription_started_at)
    END,
    trial_ends_at = CASE
      WHEN v_is_standalone_free THEN NULL
      ELSE COALESCE(public.users.trial_ends_at, EXCLUDED.trial_ends_at)
    END,
    utm_source = COALESCE(public.users.utm_source, EXCLUDED.utm_source),
    utm_medium = COALESCE(public.users.utm_medium, EXCLUDED.utm_medium),
    utm_campaign = COALESCE(public.users.utm_campaign, EXCLUDED.utm_campaign),
    utm_content = COALESCE(public.users.utm_content, EXCLUDED.utm_content),
    utm_term = COALESCE(public.users.utm_term, EXCLUDED.utm_term);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
