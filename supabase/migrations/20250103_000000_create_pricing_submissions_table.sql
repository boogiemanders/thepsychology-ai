-- Create pricing_submissions table for tracking signup form submissions
CREATE TABLE IF NOT EXISTS public.pricing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  test_date TEXT,
  thoughts_goals_questions TEXT,
  tier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_pricing_submissions_email ON public.pricing_submissions(email);
CREATE INDEX IF NOT EXISTS idx_pricing_submissions_tier ON public.pricing_submissions(tier);
CREATE INDEX IF NOT EXISTS idx_pricing_submissions_created_at ON public.pricing_submissions(created_at DESC);

-- Add documentation
COMMENT ON TABLE public.pricing_submissions IS 'Stores data from pricing section signup form submissions';
COMMENT ON COLUMN public.pricing_submissions.tier IS 'Subscription tier from form: 7-Day Free Trial, Pro, or Pro + Coaching';
