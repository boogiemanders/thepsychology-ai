-- Harden auth signup fallback profile creation.
-- Ensures users created by auth trigger still get 7-day Pro trial and referral attribution
-- even if /api/auth/create-profile is delayed or fails.

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
BEGIN
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
    'pro',
    v_created_at,
    v_created_at + INTERVAL '7 days',
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
      WHEN public.users.subscription_tier = 'free' AND public.users.trial_ends_at IS NULL THEN 'pro'
      ELSE public.users.subscription_tier
    END,
    subscription_started_at = COALESCE(public.users.subscription_started_at, EXCLUDED.subscription_started_at),
    trial_ends_at = COALESCE(public.users.trial_ends_at, EXCLUDED.trial_ends_at),
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
