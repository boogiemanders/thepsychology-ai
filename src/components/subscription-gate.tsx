'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getFreeTrialStatus, isProPromoActive } from '@/lib/subscription-utils'

const ALLOWED_PATHS = ['/trial-expired', '/signup', '/login']

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const { userProfile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!userProfile) return

    if (isProPromoActive()) return

    const { isFreeTier, expired } = getFreeTrialStatus(userProfile)
    if (!isFreeTier || !expired) return

    if (pathname && ALLOWED_PATHS.some((path) => pathname.startsWith(path))) {
      return
    }

    router.replace('/trial-expired')
  }, [loading, pathname, router, userProfile])

  return <>{children}</>
}
