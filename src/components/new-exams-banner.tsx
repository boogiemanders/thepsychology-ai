'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const DISMISS_KEY = 'warmup-launch-april-2026-dismissed'

export function NewExamsBanner() {
  const { userProfile } = useAuth()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(!!localStorage.getItem(DISMISS_KEY))
  }, [])

  // Show to any signed-in user — Warm Up is free for everyone
  if (!userProfile) return null
  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="relative rounded-lg border border-emerald-500/30 bg-emerald-500/5 dark:border-emerald-400/20 dark:bg-emerald-400/10 p-4 mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-emerald-600 dark:text-emerald-400 hover:opacity-70"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="pr-8">
        <p className="text-sm font-medium text-foreground">
          Shorter quizzes. You asked, we shipped.
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Warm Up gives you 8 or 12 questions, one from each domain. Try it in Practice.
        </p>
      </div>
    </div>
  )
}
