-- Create users table to extend Supabase auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'pro_coaching')),
  exam_date DATE,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  promo_code_used TEXT,
  referral_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_exam_date ON public.users(exam_date);
CREATE INDEX IF NOT EXISTS idx_users_subscription_started_at ON public.users(subscription_started_at);
CREATE INDEX IF NOT EXISTS idx_users_referral_source ON public.users(referral_source);
CREATE INDEX IF NOT EXISTS idx_users_promo_code_used ON public.users(promo_code_used) WHERE promo_code_used IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON public.users FOR INSERT
  WITH CHECK (TRUE);

-- Add documentation
COMMENT ON TABLE public.users IS 'Extended user profile information linked to Supabase auth.users';
COMMENT ON COLUMN public.users.subscription_tier IS 'Subscription level: free, basic, pro, or pro_coaching';
COMMENT ON COLUMN public.users.promo_code_used IS 'Stores the promo code applied (one per user)';
COMMENT ON COLUMN public.users.referral_source IS 'Tracks where user came from during signup';

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();
