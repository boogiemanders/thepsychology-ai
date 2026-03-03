'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useStripeCheckout } from '@/hooks/use-stripe-checkout'
import { getPricingInfo } from '@/lib/pricing-tiers'

const DISMISS_KEY = 'upgrade-banner-dismissed-at'
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export function UpgradeBanner() {
  const { userProfile } = useAuth()
  const { startCheckout, checkoutLoading } = useStripeCheckout()
  const [dismissed, setDismissed] = useState(true) // Default to hidden to prevent flash

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt)
      setDismissed(elapsed < DISMISS_DURATION_MS)
    } else {
      setDismissed(false)
    }
  }, [])

  // Only show for free users who had a trial (trial_ends_at is set)
  if (!userProfile) return null
  if (userProfile.subscription_tier !== 'free') return null
  if (!userProfile.trial_ends_at) return null
  if (dismissed) return null

  const pricingInfo = getPricingInfo()

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  return (
    <div className="relative rounded-lg border border-brand-coral/30 bg-brand-coral/5 dark:border-brand-coral/20 dark:bg-brand-coral/10 p-4 mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-brand-coral hover:opacity-70"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pr-8">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Your progress is waiting.
          </p>
          <p className="text-sm text-brand-dusty-rose dark:text-brand-lavender-gray mt-0.5">
            {pricingInfo.isFoundingPrice
              ? `Pro is $${pricingInfo.currentPrice}/mo exclusively for early members. This price won't be available for those who join in April.`
              : `Get everything back for $${pricingInfo.currentPrice}/mo.`}
          </p>
        </div>
        <button
          onClick={() => startCheckout({ source: 'upgrade-banner' })}
          disabled={checkoutLoading}
          className="shrink-0 rounded-full brand-coral-bg px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {checkoutLoading ? 'Loading...' : 'Continue with Pro'}
        </button>
      </div>
    </div>
  )
}
