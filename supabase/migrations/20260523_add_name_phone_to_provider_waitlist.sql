ALTER TABLE public.provider_waitlist
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text;
