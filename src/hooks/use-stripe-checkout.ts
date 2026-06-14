import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { trackFunnelEvent } from '@/lib/funnel-events'

interface CheckoutOptions {
  redirectPath?: string
  source?: string
}

// The GA4 `_ga` cookie looks like "GA1.1.<clientId1>.<clientId2>". The GA
// client_id is the last two dotted segments. Returns null if not present
// (e.g. cookies blocked or GA not loaded yet).
function readGaClientId(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/_ga=GA\d+\.\d+\.(\d+\.\d+)/)
  return match ? match[1] : null
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

        // GA4 begin_checkout (client-side). The matching `purchase` fires
        // server-side from the Stripe webhook via Measurement Protocol.
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'begin_checkout', {
            currency: 'USD',
            items: [{ item_id: 'pro', item_name: 'thePsychology.ai Pro', quantity: 1 }],
          })
        }

        // Pass the GA client_id (from the _ga cookie) so the server-side
        // purchase event joins back to this browser session in GA4.
        const gaClientId = readGaClientId()

        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planTier: 'pro',
            userId: user.id,
            userEmail: user.email,
            gaClientId,
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
