-- Store signup device info for admin notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_device TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_user_agent TEXT;

COMMENT ON COLUMN users.signup_device IS 'Signup device category inferred from request headers (phone/desktop/unknown)';
COMMENT ON COLUMN users.signup_user_agent IS 'User-Agent header captured at signup';
