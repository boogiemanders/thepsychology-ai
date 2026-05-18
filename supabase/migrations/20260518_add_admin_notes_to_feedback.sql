ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS admin_notes text;
