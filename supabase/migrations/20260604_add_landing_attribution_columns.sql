-- Add first-touch landing page attribution so we know which page (e.g. blog post)
-- brought a user in, even when there are no UTM params (organic search traffic)
ALTER TABLE users ADD COLUMN IF NOT EXISTS landing_page TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS landing_referrer TEXT;

-- Index for analytics queries (which pages convert)
CREATE INDEX IF NOT EXISTS idx_users_landing_page ON users(landing_page);
