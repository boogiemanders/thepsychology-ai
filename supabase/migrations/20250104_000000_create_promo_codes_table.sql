-- Create promo_codes table for managing promotional codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  tier_granted VARCHAR(20) NOT NULL CHECK (tier_granted IN ('free', 'basic', 'pro', 'pro_coaching')),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON public.promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_expires_at ON public.promo_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only service role can manage
CREATE POLICY "Service role can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (TRUE);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promo_codes_updated_at_trigger
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_promo_codes_updated_at();

-- Add documentation
COMMENT ON TABLE public.promo_codes IS 'Stores promotional codes for subscription discounts and upgrades';
COMMENT ON COLUMN public.promo_codes.code IS 'Unique promo code (case-insensitive, stored as uppercase)';
COMMENT ON COLUMN public.promo_codes.tier_granted IS 'Subscription tier granted when code is applied';
COMMENT ON COLUMN public.promo_codes.usage_limit IS 'Maximum number of times this code can be used (null = unlimited)';
