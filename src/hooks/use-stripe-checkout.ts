import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'

export type StripeTier = 'pro' | 'pro_coaching'

// Payment Links with your custom branding
const PAYMENT_LINKS: Record<StripeTier, string> = {
  pro: 'https://buy.stripe.com/4gM5kC6YjgvT7Bp39g8Vi00',
  pro_coaching: 'https://buy.stripe.com/dRm7sK82nfrP8Ft7pw8Vi01',
}

interface CheckoutOptions {
  redirectPath?: string
}

export function useStripeCheckout() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTier, setActiveTier] = useState<StripeTier | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = useCallback(
    async (tier: StripeTier, options?: CheckoutOptions) => {
      if (!user) {
        const redirectSuffix = options?.redirectPath ? `?redirect=${encodeURIComponent(options.redirectPath)}` : ''
        router.push(`/login${redirectSuffix}`)
        return
      }

      if (!user.email) {
        setError('Missing email on account. Please contact support.')
        return
      }

      setActiveTier(tier)
      setError(null)
      setLoading(true)

      try {
        // Safety check: Verify user profile exists before checkout
        const { data: existingProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (profileError || !existingProfile) {
          throw new Error('User profile not found. Please refresh and try again.')
        }

        // Build Payment Link URL with client_reference_id and prefilled_email
        const paymentLink = PAYMENT_LINKS[tier]
        const url = new URL(paymentLink)
        url.searchParams.set('client_reference_id', user.id)
        url.searchParams.set('prefilled_email', user.email)

        // Redirect to Stripe Payment Link
        window.location.href = url.toString()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.'
        setError(message)
        setLoading(false)
      }
    },
    [router, user]
  )

  const resetCheckoutError = useCallback(() => setError(null), [])

  return {
    startCheckout,
    checkoutTier: activeTier,
    checkoutLoading: loading,
    checkoutError: error,
    resetCheckoutError,
  }
}
