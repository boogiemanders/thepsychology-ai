'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/context/auth-context'
import { hasProAccess } from '@/lib/subscription-utils'
import { useStripeCheckout } from '@/hooks/use-stripe-checkout'

interface SubscriptionGateProps {
  children: ReactNode
  fallback?: ReactNode
}

function DefaultUpgradePrompt() {
  const { startCheckout, checkoutLoading } = useStripeCheckout()

  return (
    <div className="relative rounded-xl border border-border bg-accent/50 p-6 text-center">
      <div className="absolute inset-0 rounded-xl backdrop-blur-[2px]" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <p className="text-lg font-semibold">Upgrade to Pro</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Unlock 80+ lessons, unlimited quizzes, exam simulation, and more.
        </p>
        <button
          onClick={() => startCheckout({ source: 'subscription-gate' })}
          disabled={checkoutLoading}
          className="mt-2 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {checkoutLoading ? 'Loading...' : 'Get Pro'}
        </button>
      </div>
    </div>
  )
}

export function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const { userProfile, loading } = useAuth()

  // While loading, show children to avoid flash
  if (loading) return <>{children}</>

  if (hasProAccess(userProfile)) {
    return <>{children}</>
  }

  return <>{fallback ?? <DefaultUpgradePrompt />}</>
}
