import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { STRIPE_PAYMENT_LINKS, type StripeTier } from '@/lib/stripe-links'

interface CheckoutOptions {
  redirectPath?: string
}

export function useStripeCheckout() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTier, setActiveTier] = useState<StripeTier | null>(null)
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

      const paymentLink = STRIPE_PAYMENT_LINKS[tier]
      if (!paymentLink) {
        setError('Upgrade link is not configured. Please contact support.')
        return
      }

      setActiveTier(tier)
      setError(null)

      // Redirect straight to Stripe Payment Link
      window.location.href = paymentLink
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
