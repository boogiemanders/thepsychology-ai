-- Add referral_source column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Add index for analytics queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_referral_source ON users(referral_source);
