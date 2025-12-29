-- Add onboarding tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.onboarding_completed IS 'Whether the user completed the onboarding tour';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN users.onboarding_skipped IS 'Whether the user skipped the onboarding tour';
