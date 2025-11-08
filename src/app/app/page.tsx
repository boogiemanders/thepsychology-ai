'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, isTrialExpired } from '@/lib/user-management'

export default function AppPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()

    if (!user) {
      // Not logged in, redirect to signup
      router.push('/signup')
      return
    }

    // Check if free trial has expired
    if (user.tier === '7-Day Free Trial' && isTrialExpired(user)) {
      // Trial expired, redirect to expired page
      router.push('/trial-expired')
      return
    }

    // User is logged in and trial is valid, redirect to tools
    router.push('/tools')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading your dashboard...</h1>
        <p className="text-muted-foreground">
          Please wait while we set up your account.
        </p>
      </div>
    </div>
  )
}
