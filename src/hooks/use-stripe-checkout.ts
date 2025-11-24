import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

type Tier = 'pro' | 'pro_coaching'

interface CheckoutOptions {
  redirectPath?: string
}

export function useStripeCheckout() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTier, setActiveTier] = useState<Tier | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = useCallback(
    async (tier: Tier, options?: CheckoutOptions) => {
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

      try {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            planTier: tier,
            userId: user.id,
            userEmail: user.email,
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.error || 'Unable to start checkout')
        }

        const data = await response.json()
        if (data?.url) {
          window.location.href = data.url
        } else {
          throw new Error('Missing checkout URL from Stripe')
        }
      } catch (err) {
        console.error('[Stripe] Checkout error:', err)
        setError('Unable to start checkout. Please try again.')
      } finally {
        setActiveTier(null)
      }
    },
    [router, user]
  )

  const resetCheckoutError = useCallback(() => setError(null), [])

  return {
    startCheckout,
    checkoutTier: activeTier,
    checkoutError: error,
    resetCheckoutError,
  }
}
