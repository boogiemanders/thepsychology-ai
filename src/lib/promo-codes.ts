import { supabase } from './supabase'

export interface PromoCodeValidation {
  isValid: boolean
  error?: string
  tier?: string
  message?: string
}

/**
 * Validate a promo code and return the tier it grants
 */
export async function validatePromoCode(
  code: string
): Promise<PromoCodeValidation> {
  if (!code || code.trim().length === 0) {
    return {
      isValid: false,
      error: 'Promo code is required',
    }
  }

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !data) {
      return {
        isValid: false,
        error: 'Invalid promo code',
      }
    }

    // Check if code is active
    if (!data.is_active) {
      return {
        isValid: false,
        error: 'This promo code is no longer active',
      }
    }

    // Check if code has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return {
        isValid: false,
        error: 'This promo code has expired',
      }
    }

    // Check usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      return {
        isValid: false,
        error: 'This promo code has reached its usage limit',
      }
    }

    return {
      isValid: true,
      tier: data.tier_granted,
      message: `You've unlocked ${data.tier_granted.toUpperCase()} access!`,
    }
  } catch (error) {
    console.error('Promo code validation error:', error)
    return {
      isValid: false,
      error: 'Error validating promo code',
    }
  }
}

/**
 * Apply a promo code to a user's account
 */
export async function applyPromoCode(userId: string, code: string) {
  const validation = await validatePromoCode(code)

  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
    }
  }

  try {
    // Check if user already used a promo code
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('promo_code_used')
      .eq('id', userId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (userData?.promo_code_used) {
      return {
        success: false,
        error: 'You have already applied a promo code',
      }
    }

    // Update user with promo code
    const { error: updateError } = await supabase
      .from('users')
      .update({
        promo_code_used: code.toUpperCase(),
        subscription_tier: validation.tier,
        subscription_started_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    // Increment usage count
    const { error: incrementError } = await supabase.rpc('increment_promo_usage', {
      promo_code: code.toUpperCase(),
    })

    if (incrementError && incrementError.code !== 'PGRST204') {
      // PGRST204 means function doesn't exist yet - that's ok, we can update manually
      await supabase
        .from('promo_codes')
        .update({ usage_count: (await supabase
          .from('promo_codes')
          .select('usage_count')
          .eq('code', code.toUpperCase())
          .single()).data?.usage_count || 0 + 1 })
        .eq('code', code.toUpperCase())
    }

    return {
      success: true,
      tier: validation.tier,
      message: validation.message,
    }
  } catch (error) {
    console.error('Error applying promo code:', error)
    return {
      success: false,
      error: 'Failed to apply promo code',
    }
  }
}

/**
 * Create a new promo code (admin only)
 */
export async function createPromoCode(
  code: string,
  tier: string,
  expiresAt?: string,
  usageLimit?: number
) {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .insert([
        {
          code: code.toUpperCase(),
          tier_granted: tier,
          created_by: user.user?.id,
          expires_at: expiresAt,
          usage_limit: usageLimit,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data[0],
    }
  } catch (error) {
    console.error('Error creating promo code:', error)
    return {
      success: false,
      error: 'Failed to create promo code',
    }
  }
}
