-- Google Ads click id (gclid): rewrite-proof 1:1 link to a paid Google Ads click,
-- captured client-side (localStorage, 30-day first-touch) and persisted at signup.
-- Unlike UTMs, gclid can't be rewritten by later in-app navigation and is the input
-- Google Ads needs for offline-conversion upload. Applied manually by the founder.
ALTER TABLE users ADD COLUMN IF NOT EXISTS gclid TEXT;

-- Index for analytics queries (which paid clicks converted)
CREATE INDEX IF NOT EXISTS idx_users_gclid ON users (gclid);
