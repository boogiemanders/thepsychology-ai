CREATE TABLE IF NOT EXISTS public.provider_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  note text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS provider_waitlist_created_at_idx
  ON public.provider_waitlist (created_at DESC);

ALTER TABLE public.provider_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can join provider waitlist" ON public.provider_waitlist;
CREATE POLICY "Anyone can join provider waitlist"
  ON public.provider_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
