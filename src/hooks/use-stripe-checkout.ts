import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { trackFunnelEvent } from '@/lib/funnel-events'

interface CheckoutOptions {
  redirectPath?: string
  source?: string
}

export function useStripeCheckout() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = useCallback(
    async (options?: CheckoutOptions) => {
      if (!user) {
        const redirectSuffix = options?.redirectPath ? `?redirect=${encodeURIComponent(options.redirectPath)}` : ''
        router.push(`/login${redirectSuffix}`)
        return
      }

      if (!user.email) {
        setError('Missing email on account. Please contact support.')
        return
      }

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

        trackFunnelEvent(user.id, 'checkout_started', {
          planTier: 'pro',
          source: options?.source || 'unknown',
        })

        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planTier: 'pro',
            userId: user.id,
            userEmail: user.email,
          }),
        })

        const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null
        const url = data?.url
        if (!response.ok || !url) {
          throw new Error(data?.error || 'Checkout failed. Please try again.')
        }

        window.location.href = url
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
    checkoutLoading: loading,
    checkoutError: error,
    resetCheckoutError,
  }
}
