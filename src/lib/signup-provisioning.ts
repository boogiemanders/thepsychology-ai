export const DENTAL_SIGNUP_SOURCE = 'lab_dental'
export const DENTAL_REFERRAL_SOURCE = 'lab_dental'

export type ProvisionedSubscriptionTier = 'free' | 'pro'

interface SignupProvisioningInput {
  signupSource?: unknown
  skipTrial?: unknown
  subscriptionTier?: unknown
}

interface SignupProvisioningResult {
  signupSource: string | null
  subscriptionTier: ProvisionedSubscriptionTier
  skipTrial: boolean
  defaultReferralSource: string | null
}

const TRUTHY_FLAGS = new Set(['1', 'true', 't', 'yes', 'y', 'on'])

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeTier(value: unknown): ProvisionedSubscriptionTier | null {
  const normalized = normalizeString(value)?.toLowerCase()
  if (normalized === 'free' || normalized === 'pro') {
    return normalized
  }
  return null
}

function isTruthyFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  const normalized = normalizeString(value)?.toLowerCase()
  return normalized ? TRUTHY_FLAGS.has(normalized) : false
}

export function getSignupProvisioning(
  input: SignupProvisioningInput = {},
): SignupProvisioningResult {
  const signupSource = normalizeString(input.signupSource)
  const requestedTier = normalizeTier(input.subscriptionTier)
  const isDentalSignup = signupSource === DENTAL_SIGNUP_SOURCE
  const skipTrial = isDentalSignup || isTruthyFlag(input.skipTrial) || requestedTier === 'free'

  return {
    signupSource,
    subscriptionTier: skipTrial ? 'free' : 'pro',
    skipTrial,
    defaultReferralSource: isDentalSignup ? DENTAL_REFERRAL_SOURCE : null,
  }
}
