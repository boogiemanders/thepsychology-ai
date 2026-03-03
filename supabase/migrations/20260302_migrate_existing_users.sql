-- Phase 7: Existing User Migration
-- RUN THIS AFTER deploying the code changes
-- Preview affected users first, then run the updates

-- 7.1 Preview affected users (run this first to see who will be downgraded)
-- SELECT id, email, subscription_tier, subscription_started_at
-- FROM users
-- WHERE subscription_tier IN ('pro', 'pro_coaching')
--   AND stripe_customer_id IS NULL
--   AND subscription_started_at < NOW() - INTERVAL '7 days';

-- 7.2 Downgrade users who have been on pro for >7 days (non-paying)
UPDATE users
SET subscription_tier = 'free', trial_ends_at = NOW()
WHERE subscription_tier IN ('pro', 'pro_coaching')
  AND stripe_customer_id IS NULL
  AND subscription_started_at < NOW() - INTERVAL '7 days';

-- 7.3 Set trial_ends_at for recent pro users (<7 days)
UPDATE users
SET trial_ends_at = subscription_started_at + INTERVAL '7 days'
WHERE subscription_tier = 'pro'
  AND stripe_customer_id IS NULL
  AND trial_ends_at IS NULL
  AND subscription_started_at >= NOW() - INTERVAL '7 days';
