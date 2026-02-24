-- Backfill: create public.users rows for any auth.users without one.
INSERT INTO public.users (id, email, subscription_tier, created_at)
SELECT
  au.id,
  au.email,
  'pro',
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
