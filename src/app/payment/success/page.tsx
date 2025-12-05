'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MAX_POLL_ATTEMPTS = 15 // 15 attempts
const POLL_INTERVAL = 2000 // 2 seconds

export default function PaymentSuccessPage() {
  const router = useRouter()
  const { user, userProfile, loading, refreshProfile } = useAuth()
  const [status, setStatus] = useState<'checking' | 'success' | 'timeout'>('checking')
  const [pollCount, setPollCount] = useState(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const hasRedirected = useRef(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    // If not logged in and not loading, redirect to login
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Check if subscription is already active
    if (userProfile?.subscription_tier && userProfile.subscription_tier !== 'free') {
      if (!hasRedirected.current) {
        hasRedirected.current = true
        setStatus('success')
        setTimeout(() => {
          router.push('/dashboard?upgrade=success')
        }, 1500)
      }
      return
    }

    // Start polling for subscription update
    const pollSubscription = async () => {
      if (hasRedirected.current) return

      setPollCount((prev) => {
        const newCount = prev + 1

        if (newCount >= MAX_POLL_ATTEMPTS) {
          setStatus('timeout')
          return newCount
        }

        return newCount
      })

      try {
        await refreshProfile()
      } catch (err) {
        console.error('Error refreshing profile:', err)
      }
    }

    // Initial check after a short delay to allow webhook to process
    const initialDelay = setTimeout(() => {
      pollSubscription()
      pollRef.current = setInterval(pollSubscription, POLL_INTERVAL)
    }, 1000)

    return () => {
      clearTimeout(initialDelay)
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [user, loading, router, refreshProfile])

  // Watch for subscription changes
  useEffect(() => {
    if (
      userProfile?.subscription_tier &&
      userProfile.subscription_tier !== 'free' &&
      !hasRedirected.current
    ) {
      hasRedirected.current = true
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
      setStatus('success')
      setTimeout(() => {
        router.push('/dashboard?upgrade=success')
      }, 1500)
    }
  }, [userProfile, router])

  const handleManualRedirect = () => {
    router.push('/dashboard')
  }

  const handleManualSync = async () => {
    if (!user?.id || syncLoading) return

    setSyncLoading(true)
    setSyncError(null)

    try {
      const response = await fetch('/api/stripe/request-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh profile and check if subscription is now active
        await refreshProfile()
        // Give a moment for the profile to update
        setTimeout(() => {
          if (data.subscription_tier && data.subscription_tier !== 'free') {
            setStatus('success')
            setTimeout(() => router.push('/dashboard?upgrade=success'), 1500)
          }
        }, 500)
      } else {
        setSyncError(data.error || data.message || 'Sync failed. Please try again.')
      }
    } catch (err) {
      console.error('Sync error:', err)
      setSyncError('Unable to sync. Please try again or contact support.')
    } finally {
      setSyncLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === 'checking' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Setting up your subscription...</h1>
              <p className="text-muted-foreground">
                Please wait while we activate your account.
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Payment successful!</h1>
              <p className="text-muted-foreground">
                Redirecting you to your dashboard...
              </p>
            </div>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Payment received!</h1>
              <p className="text-muted-foreground mb-4">
                Your subscription is being processed. It may take a moment to activate.
              </p>
              {syncError && (
                <p className="text-sm text-red-500 dark:text-red-400 mb-3">{syncError}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={handleManualSync}
                  variant="outline"
                  disabled={syncLoading}
                >
                  {syncLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Sync
                    </>
                  )}
                </Button>
                <Button onClick={handleManualRedirect}>
                  Go to Dashboard
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                If your subscription doesn&apos;t activate within a few minutes,{' '}
                <a
                  href="mailto:support@thepsychology.ai"
                  className="text-primary underline hover:no-underline"
                >
                  contact support
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
