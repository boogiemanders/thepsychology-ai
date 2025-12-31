-- Add UTM tracking columns to users table for marketing attribution
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_utm_source ON users(utm_source);
CREATE INDEX IF NOT EXISTS idx_users_utm_campaign ON users(utm_campaign);

-- Create a composite index for common UTM queries
CREATE INDEX IF NOT EXISTS idx_users_utm_source_medium ON users(utm_source, utm_medium);
