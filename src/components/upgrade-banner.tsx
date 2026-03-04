'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useStripeCheckout } from '@/hooks/use-stripe-checkout'
import { getPricingInfo } from '@/lib/pricing-tiers'
import { supabase } from '@/lib/supabase'

const DISMISS_KEY = 'upgrade-banner-dismissed-at'
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

interface BannerProfileState {
  resolved: boolean
  tier: 'free' | 'basic' | 'pro' | null
  trialEndsAt: string | null
}

export function UpgradeBanner() {
  const { userProfile } = useAuth()
  const { startCheckout, checkoutLoading } = useStripeCheckout()
  const [dismissed, setDismissed] = useState(true) // Default to hidden to prevent flash
  const [bannerProfile, setBannerProfile] = useState<BannerProfileState>({
    resolved: false,
    tier: null,
    trialEndsAt: null,
  })

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt)
      setDismissed(elapsed < DISMISS_DURATION_MS)
    } else {
      setDismissed(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    const resolveBannerProfile = async () => {
      if (!userProfile?.id) {
        if (isActive) {
          setBannerProfile({
            resolved: true,
            tier: null,
            trialEndsAt: null,
          })
        }
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('subscription_tier, trial_ends_at')
          .eq('id', userProfile.id)
          .single()

        if (!isActive) return
        if (error) throw error

        setBannerProfile({
          resolved: true,
          tier: (data?.subscription_tier as 'free' | 'basic' | 'pro' | null) ?? null,
          trialEndsAt: data?.trial_ends_at ?? null,
        })
      } catch {
        if (!isActive) return

        setBannerProfile({
          resolved: true,
          tier: userProfile.subscription_tier ?? null,
          trialEndsAt: userProfile.trial_ends_at ?? null,
        })
      }
    }

    setBannerProfile((prev) => ({ ...prev, resolved: false }))
    void resolveBannerProfile()

    return () => {
      isActive = false
    }
  }, [userProfile?.id, userProfile?.subscription_tier, userProfile?.trial_ends_at])

  const effectiveTier = bannerProfile.resolved
    ? bannerProfile.tier
    : (userProfile?.subscription_tier ?? null)
  const effectiveTrialEndsAt = bannerProfile.resolved
    ? bannerProfile.trialEndsAt
    : (userProfile?.trial_ends_at ?? null)

  // Only show for free users who had a trial (trial_ends_at is set)
  if (!userProfile) return null
  if (!bannerProfile.resolved && userProfile.id) return null
  if (effectiveTier !== 'free') return null
  if (!effectiveTrialEndsAt) return null
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
