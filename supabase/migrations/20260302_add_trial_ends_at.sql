-- Add trial_ends_at column for 7-day Pro trial system
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Index for efficient cron job queries (find expired trials)
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at
  ON users (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL AND subscription_tier = 'pro';

-- Clean up coaching tier (merge into pro)
UPDATE users SET subscription_tier = 'pro' WHERE subscription_tier = 'pro_coaching';
