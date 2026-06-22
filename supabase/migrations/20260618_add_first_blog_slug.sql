-- First-touch blog post attribution: the first /blog/<slug> a visitor landed on,
-- captured client-side (localStorage, 30-day window) and persisted at signup.
-- This is the durable per-post signal: it survives the visitor navigating off the
-- blog to the pricing/signup page before converting, which is why landing_page
-- (usually "/" or "/dashboard" at signup time) almost never shows the blog post.
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_blog_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_users_first_blog_slug ON users (first_blog_slug);
