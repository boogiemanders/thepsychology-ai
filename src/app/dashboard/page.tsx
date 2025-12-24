'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState, useCallback } from 'react'
import { getAllQuizResults } from '@/lib/quiz-results-storage'
import { QUIZ_PASS_PERCENT } from '@/lib/quiz-passing'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberTicker } from '@/components/ui/number-ticker'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { Marquee } from '@/components/ui/marquee'
import { Ripple } from '@/components/ui/ripple'
import { BreathingAnimation } from '@/components/ui/breathing-animation'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { CalendarIcon, FileTextIcon, PersonIcon } from '@radix-ui/react-icons'
import { LogOut, GraduationCap, Droplets, Target, Flame, AlertCircle, History, X, MessageSquare } from 'lucide-react'
import { calculateStudyStats, calculateStudyPace, getDailyGoal, getTodayQuizCount, setDailyGoal } from '@/lib/dashboard-utils'
import { EPPP_DOMAINS } from '@/lib/eppp-data'
import { getTopPriorities, getAllLatestRecommendations } from '@/lib/priority-storage'
import { triggerBackgroundPreGeneration } from '@/lib/pre-generated-exams'
import { siteConfig } from '@/lib/config'
import { Switch } from '@/components/ui/switch'
import { FeedbackInputBox } from '@/components/ui/feedback-input-box'
import { useStripeCheckout } from '@/hooks/use-stripe-checkout'

const subscriptionTierVisuals = {
  pro_coaching: {
    label: 'Pro + Coaching',
    style: {
      borderColor: '#c46685',
      backgroundColor: 'rgba(196, 102, 133, 0.1)',
      color: '#c46685',
    },
  },
  pro: {
    label: 'Pro',
    style: {
      borderColor: '#6a9bcc',
      backgroundColor: 'rgba(106, 155, 204, 0.1)',
      color: '#6a9bcc',
    },
  },
  basic: {
    label: 'Basic',
    style: {
      borderColor: '#bdd1ca',
      backgroundColor: 'rgba(189, 209, 202, 0.1)',
      color: '#bdd1ca',
    },
  },
  default: {
    label: 'Free Trial',
    style: {
      borderColor: '#cbc9db',
      backgroundColor: 'rgba(203, 201, 219, 0.1)',
      color: '#cbc9db',
    },
  },
} as const

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading, signOut, refreshProfile } = useAuth()
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return (process.env.NEXT_PUBLIC_APP_URL || siteConfig.url || '').replace(/\/$/, '')
  }
  const prioritizeHref = `${getBaseUrl()}/prioritize`
  const [mounted, setMounted] = useState(false)
  const [progressData, setProgressData] = useState({
    totalCompletion: 0,
    completedTopics: 0,
    totalTopics: 81,
    completedDomains: 0,
    totalDomains: 12,
    domainProgress: Array(12).fill(0),
  })
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [examDate, setExamDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isExamDatePopoverOpen, setIsExamDatePopoverOpen] = useState(false)
  const [studyStats, setStudyStats] = useState(calculateStudyStats())
  const [dailyGoal, setDailyGoalState] = useState(getDailyGoal())
  const [todayQuizCount, setTodayQuizCount] = useState(0)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [priorityDomains, setPriorityDomains] = useState<any[]>([])
  const [hasCompletedExam, setHasCompletedExam] = useState(false)
  const [hasPausedExam, setHasPausedExam] = useState(false)
  const [isPricingCarouselOpen, setIsPricingCarouselOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<'success' | 'error' | null>(null)
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)
  const [isAnonymousFeedback, setIsAnonymousFeedback] = useState(false)
  const [isBillingPortalLoading, setIsBillingPortalLoading] = useState(false)
  const [billingPortalError, setBillingPortalError] = useState<string | null>(null)
  const { startCheckout, checkoutTier, checkoutError, resetCheckoutError } = useStripeCheckout()
  const subscriptionTierKey = (userProfile?.subscription_tier as keyof typeof subscriptionTierVisuals) ?? 'default'
  const { label: subscriptionTierLabel, style: subscriptionTierStyle } =
    subscriptionTierVisuals[subscriptionTierKey] ?? subscriptionTierVisuals.default

  const handleDailyGoalChange = (newGoal: number) => {
    setDailyGoalState(newGoal)
    setDailyGoal(newGoal)
    setIsPopoverOpen(false)
  }

  const handleTierSelection = useCallback(
    (tierName: string) => {
      if (tierName === 'Pro') {
        startCheckout('pro', { redirectPath: '/dashboard' })
      } else if (tierName === 'Pro + Coaching') {
        startCheckout('pro_coaching', { redirectPath: '/dashboard' })
      } else {
        setIsPricingCarouselOpen(false)
      }
    },
    [setIsPricingCarouselOpen, startCheckout]
  )

  const handleManageBilling = useCallback(async () => {
    if (isBillingPortalLoading) return
    setIsBillingPortalLoading(true)
    setBillingPortalError(null)

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      const token = data.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null
      const url = payload?.url
      if (!response.ok || !url) {
        throw new Error(payload?.error || 'Failed to open billing portal')
      }

      window.location.href = url
    } catch (err) {
      console.error('[Billing Portal] Failed to open:', err)
      const message = err instanceof Error ? err.message : 'Failed to open billing portal'
      if (message === 'Stripe is not configured') {
        setBillingPortalError('Billing portal is not configured. Set STRIPE_SECRET_KEY and restart the dev server.')
      } else if (message === 'Database not configured') {
        setBillingPortalError('Billing portal needs Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      } else if (message === 'No Stripe customer found for this user') {
        setBillingPortalError('No Stripe customer found. Complete a checkout first, then try again.')
      } else if (message === 'Not authenticated') {
        setBillingPortalError('Please sign in again to open billing.')
      } else {
        setBillingPortalError('Unable to open billing. Please try again in a moment.')
      }
    } finally {
      setIsBillingPortalLoading(false)
    }
  }, [isBillingPortalLoading])

  useEffect(() => {
    if (!isFeedbackOpen) {
      setFeedbackMessage('')
      setFeedbackStatus(null)
      setIsAnonymousFeedback(false)
    }
  }, [isFeedbackOpen])

  useEffect(() => {
    if (!isPricingCarouselOpen) {
      resetCheckoutError()
    }
  }, [isPricingCarouselOpen, resetCheckoutError])

  // Handle successful payment redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgradeSuccess = params.get('upgrade') === 'success'

    if (upgradeSuccess) {
      // Refresh profile to get updated subscription tier
      refreshProfile()

      // Show success notification
      const successMessage = 'Subscription upgraded successfully!'
      setFeedbackMessage(successMessage)
      setFeedbackStatus('success')

      // Clear query parameter
      window.history.replaceState({}, '', '/dashboard')

      // Clear notification after 3 seconds
      const timeout = setTimeout(() => {
        setFeedbackMessage('')
        setFeedbackStatus(null)
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [refreshProfile])

  const handleSendFeedback = async (message: string, screenshotFile?: File | null) => {
    const trimmedMessage = message.trim()
    if ((!trimmedMessage && !screenshotFile) || !user) return
    const payloadMessage = trimmedMessage || (screenshotFile ? '[Screenshot attached]' : '')

    setIsFeedbackSubmitting(true)
    setFeedbackStatus(null)
    setFeedbackMessage('')

    try {
      let screenshotPath: string | null = null

      if (screenshotFile) {
        const extensionFromType = screenshotFile.type?.split('/').pop()
        const extensionFromName = screenshotFile.name.split('.').pop()
        const extension = extensionFromType || extensionFromName || 'png'
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const storagePath = `${user.id}/${uniqueSuffix}.${extension}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feedback-screenshot')
          .upload(storagePath, screenshotFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: screenshotFile.type || undefined,
          })

        if (uploadError) {
          throw uploadError
        }

        screenshotPath = uploadData?.path || storagePath
      }

      const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard'
      const { error } = await supabase.from('feedback').insert({
        user_id: isAnonymousFeedback ? null : user.id,
        user_email: isAnonymousFeedback ? null : user.email || null,
        message: payloadMessage,
        page_path: pagePath,
        screenshot_path: screenshotPath,
        is_anonymous: isAnonymousFeedback,
        status: 'new',
      })

      if (error) {
        throw error
      }

      console.log('Feedback successfully saved for user:', user.id)
      setFeedbackMessage('Thank you for your feedback!')
      setFeedbackStatus('success')

      setTimeout(() => {
        setFeedbackMessage('')
        setFeedbackStatus(null)
        setIsFeedbackOpen(false)
      }, 2000)
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setFeedbackMessage('Failed to send feedback. Please try again.')
      setFeedbackStatus('error')
      throw err
    } finally {
      setIsFeedbackSubmitting(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const storeExamDateLocally = useCallback((dateString: string) => {
    if (typeof window === 'undefined') return

    try {
      if (user?.id) {
        localStorage.setItem(`examDate_${user.id}`, dateString)
      }

      // Legacy fallback structure for older users
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const userData = JSON.parse(currentUser)
        const usersData = localStorage.getItem('users')
        if (usersData) {
          const users = JSON.parse(usersData)
          const userIndex = users.findIndex((u: any) => u.id === userData.id)
          if (userIndex !== -1) {
            if (!users[userIndex].goals) {
              users[userIndex].goals = {}
            }
            users[userIndex].goals.examDate = dateString
            localStorage.setItem('users', JSON.stringify(users))
          }
        }
      }
    } catch (e) {
      console.error('Error updating exam date in localStorage:', e)
    }
  }, [user?.id])

  const loadExamDateFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return null

    try {
      if (user?.id) {
        const storedValue = localStorage.getItem(`examDate_${user.id}`)
        if (storedValue) {
          return storedValue
        }
      }

      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const userData = JSON.parse(currentUser)
        const usersData = localStorage.getItem('users')
        if (usersData) {
          const users = JSON.parse(usersData)
          const userRecord = users.find((u: any) => u.id === userData.id)
          if (userRecord?.goals?.examDate) {
            return userRecord.goals.examDate
          }
        }
      }
    } catch (e) {
      console.error('Error retrieving exam date from localStorage:', e)
    }

    return null
  }, [user?.id])

  // Load exam date when userProfile changes
  useEffect(() => {
    if (userProfile?.exam_date) {
      console.log('[Dashboard] Loading exam date from userProfile:', userProfile.exam_date)
      setExamDate(userProfile.exam_date)
      if (user?.id) {
        storeExamDateLocally(userProfile.exam_date)
      }
      return
    }

    const localExamDate = loadExamDateFromLocalStorage()
    if (localExamDate) {
      setExamDate(localExamDate)
    }
  }, [userProfile, loadExamDateFromLocalStorage, storeExamDateLocally, user?.id])

  // Load priority recommendations from Supabase
  useEffect(() => {
    const loadPriorities = async () => {
      const applyLocalPriorityFallback = () => {
        const { diagnostic, practice } = getAllLatestRecommendations()
        const available = [diagnostic, practice].filter(Boolean) as Array<{
          timestamp: number
          topPriorities: any[]
        }>
        setHasCompletedExam(available.length > 0)

        if (available.length === 0) {
          const localDiagnostic = getTopPriorities('diagnostic')
          if (localDiagnostic && localDiagnostic.length > 0) {
            setPriorityDomains(localDiagnostic)
          } else {
            setPriorityDomains([])
          }
          return
        }

        available.sort((a, b) => b.timestamp - a.timestamp)
        const latest = available[0]
        setPriorityDomains(latest.topPriorities || [])
      }

      if (!user?.id) {
        applyLocalPriorityFallback()
        return
      }

      try {
        const { data, error } = await supabase
          .from('study_priorities')
          .select('top_domains')
          .eq('user_id', user.id)
          .single()

        if (data && !error) {
          setPriorityDomains(data.top_domains || [])
          setHasCompletedExam(Array.isArray(data.top_domains) && data.top_domains.length > 0)
        } else {
          applyLocalPriorityFallback()
        }
      } catch (err) {
        console.error('Failed to load priorities from Supabase:', err)
        applyLocalPriorityFallback()
      }
    }

    loadPriorities()
  }, [user?.id])

  // Pre-generate exams in background for faster exam loading
  useEffect(() => {
    if (user?.id) {
      triggerBackgroundPreGeneration(user.id, 'diagnostic')
      triggerBackgroundPreGeneration(user.id, 'practice')
    }
  }, [user?.id])

  // Check for paused exam on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pausedState = localStorage.getItem('pausedExamState')
      setHasPausedExam(!!pausedState)
    }
  }, [])

  // Memoized update progress function
  const updateProgress = useCallback(() => {
    const allResults = getAllQuizResults()

    // Build topic-to-domain mapping dynamically from EPPP_DOMAINS
    const topicsByDomain: Record<number, string[]> = {}
    EPPP_DOMAINS.forEach((domain, idx) => {
      topicsByDomain[idx] = domain.topics.map(t => t.name)
    })

    // Calculate domain progress based on quiz results
    const domainProgress: number[] = new Array(EPPP_DOMAINS.length).fill(0)
    const topicScores: Record<number, Record<string, number>> = {}

    // Initialize topic scores for each domain
    EPPP_DOMAINS.forEach((_, domainIdx) => {
      topicScores[domainIdx] = {}
      topicsByDomain[domainIdx]?.forEach(topic => {
        topicScores[domainIdx][topic] = 0
      })
    })

    // Process all quiz results
    let totalScore = 0
    let totalQuizzes = 0
    const topicBestScores = new Map<string, number>()

    allResults.forEach((result) => {
      const percentage = (result.score / result.totalQuestions) * 100
      totalScore += percentage
      totalQuizzes++
      const currentBest = topicBestScores.get(result.topic) ?? 0
      if (percentage > currentBest) {
        topicBestScores.set(result.topic, percentage)
      }

      // Find which domain this topic belongs to
      for (let domainIdx = 0; domainIdx < EPPP_DOMAINS.length; domainIdx++) {
        const topics = topicsByDomain[domainIdx] || []
        const matchedTopic = topics.find(t => t.toLowerCase() === result.topic.toLowerCase())
        if (matchedTopic) {
          topicScores[domainIdx][matchedTopic] = percentage
          break
        }
      }
    })

    const completedTopics = new Set(
      Array.from(topicBestScores.entries())
        .filter(([, score]) => score >= QUIZ_PASS_PERCENT)
        .map(([topic]) => topic)
    )

    // Calculate domain progress as average of all topics in domain
    EPPP_DOMAINS.forEach((_, domainIdx) => {
      const topicsInDomain = topicsByDomain[domainIdx] || []
      if (topicsInDomain.length === 0) {
        domainProgress[domainIdx] = 0
        return
      }

      const completedCount = topicsInDomain.filter((topic) => {
        const score = topicScores[domainIdx][topic] || 0
        return score >= QUIZ_PASS_PERCENT
      }).length
      domainProgress[domainIdx] = Math.round((completedCount / topicsInDomain.length) * 100)
    })

    // Calculate overall completion
    const totalTopics = Object.values(topicsByDomain).reduce((sum, topics) => sum + topics.length, 0)
    const totalCompletion = totalTopics > 0
      ? Math.round((completedTopics.size / totalTopics) * 100)
      : 0
    const completedDomainsCount = domainProgress.filter(p => p >= 80).length

    setProgressData({
      totalCompletion,
      completedTopics: completedTopics.size,
      totalTopics,
      completedDomains: completedDomainsCount,
      totalDomains: EPPP_DOMAINS.length,
      domainProgress,
    })
  }, [])

  // Calculate progress based on quiz results
  useEffect(() => {
    if (!mounted) return

    // Initial update
    updateProgress()

    // Listen for storage changes and quiz results updates
    window.addEventListener('storage', updateProgress)
    window.addEventListener('quiz-results-updated', updateProgress)
    return () => {
      window.removeEventListener('storage', updateProgress)
      window.removeEventListener('quiz-results-updated', updateProgress)
    }
  }, [mounted, updateProgress])

  // Memoized update stats function
  const updateStats = useCallback(() => {
    setStudyStats(calculateStudyStats())
    setTodayQuizCount(getTodayQuizCount())
  }, [])

  // Memoized update priorities function
  const updatePriorities = useCallback(() => {
    const priorities = getTopPriorities('diagnostic')
    setPriorityDomains(priorities || [])
  }, [])

  // Update study stats and today's quiz count
  useEffect(() => {
    if (!mounted) return

    updateStats()
    updatePriorities()

    // Listen for storage changes and quiz/priority results updates
    window.addEventListener('storage', updateStats)
    window.addEventListener('quiz-results-updated', updateStats)
    window.addEventListener('quiz-results-updated', updatePriorities)
    window.addEventListener('priority-recommendations-updated', updatePriorities)
    return () => {
      window.removeEventListener('storage', updateStats)
      window.removeEventListener('quiz-results-updated', updateStats)
      window.removeEventListener('quiz-results-updated', updatePriorities)
      window.removeEventListener('priority-recommendations-updated', updatePriorities)
    }
  }, [mounted, updateStats, updatePriorities])

  // Calculate days remaining to exam
  useEffect(() => {
    if (examDate) {
      // Parse date components and create at midnight UTC to match react-day-picker
      const [year, month, day] = examDate.split('-').map(Number)
      const exam = new Date(Date.UTC(year, month - 1, day))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diffTime = exam.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays)
      setSelectedDate(exam)
    }
  }, [examDate])

  const handleSaveExamDate = async (date: Date | undefined) => {
    if (date && user) {
      // Use local date methods to extract the date the user clicked
      // Calendar component passes Date in local timezone, so use local methods
      const year = date.getFullYear()
      const month = date.getMonth()
      const day = date.getDate()

      // Create date string (YYYY-MM-DD)
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      console.log('[Dashboard] Saving exam date:', dateString, 'for user:', user.id)
      setExamDate(dateString)
      storeExamDateLocally(dateString)

      // Save to Supabase
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ exam_date: dateString })
          .eq('id', user.id)
          .select()

        if (error) {
          const supabaseMessage = error?.message || error || 'Unknown error'
          console.warn('[Dashboard] Supabase exam date update skipped (using local cache):', supabaseMessage)
        } else {
          console.log('[Dashboard] Exam date saved to Supabase successfully:', dateString, 'Response:', data)
          // Refresh the user profile to get the updated exam date
          await refreshProfile()
        }
      } catch (error) {
        console.error('[Dashboard] Supabase save failed:', error)
      }

      setIsExamDatePopoverOpen(false)
    }
  }

  // Helper function to format date as "MMM DD"
  const formatDateShort = (dateString: string): string => {
    try {
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[date.getMonth()]} ${date.getDate()}`
    } catch (e) {
      return dateString
    }
  }

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login')
    }
  }, [user, loading, mounted, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calculate study pace
  const studyPace = calculateStudyPace(examDate, progressData.completedTopics)

  // ACTION BUTTONS - Bigger, more prominent
  const actionCards = [
    // Put the two primary actions first so they appear at the top on mobile
    {
      Icon: GraduationCap,
      name: "Practice",
      description: hasPausedExam ? "Resume your paused practice exam" : "Take practice exams to test your knowledge",
      href: "/exam-generator",
      cta: hasPausedExam ? "Resume?" : "Start Exam",
      className:
        "col-span-2 col-start-1 row-span-2 row-start-1 md:col-span-3 md:col-start-auto md:row-span-1 md:row-start-auto lg:col-start-1 lg:col-end-3 lg:row-start-1 lg:row-end-5",
      background: (
        <Marquee className="absolute inset-0 opacity-20" repeat={2}>
          <div className="flex gap-6 whitespace-nowrap px-4">
            <span>Build confidence</span>
            <span>•</span>
            <span>225 questions</span>
            <span>•</span>
            <span>Master content</span>
            <span>•</span>
            <span>4h 15min timer</span>
            <span>•</span>
            <span>Study smarter</span>
            <span>•</span>
            <span>Realistic exam experience</span>
            <span>•</span>
            <span>Track progress</span>
            <span>•</span>
            <span>Study & Test modes</span>
          </div>
        </Marquee>
      ),
    },
    {
      Icon: FileTextIcon,
      name: "Study",
      description: `${studyStats.totalQuizzes} quizzes • ${progressData.completedTopics}/${progressData.totalTopics} lessons`,
      href: "/topic-selector",
      cta: "Start Studying",
      className:
        "col-span-4 row-span-2 row-start-3 md:col-span-3 md:row-span-1 md:row-start-auto lg:col-start-3 lg:col-end-5 lg:row-start-1 lg:row-end-7",
      background: (
        <div className="absolute inset-0 flex flex-col items-start justify-start pt-4 p-4 h-full">
          {/* Priority Badges Section */}
          {priorityDomains.length > 0 && (
            <div className="w-full mb-3 pb-3 border-b border-border/40">
              <div className="text-xs md:text-sm font-semibold text-foreground/70 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" style={{ color: '#c46685' }} />
                Priority Focus
              </div>
              <div className="flex flex-wrap gap-1">
                {priorityDomains.slice(0, 3).map((domain, idx) => {
                  const colors = ['#bdd1ca', '#788c5d', '#d87758']
                  const color = colors[idx]
                  return (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs md:text-sm"
                      style={{
                        borderColor: color,
                        backgroundColor: `${color}20`,
                        color: color,
                      }}
                    >
                      #{idx + 1}: {domain.domainName.split(':')[0]}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          <div className="w-full h-full">
            <div className="text-sm text-foreground/80 mb-2">
              Overall completion: {progressData.totalCompletion}%.
              {!hasCompletedExam && studyStats.totalQuizzes === 0 ? ' Tap Practice to see where to focus.' : ''}
            </div>
            <ScrollArea className="w-full h-full pr-4">
              <div className="w-full space-y-2 opacity-60">
                {EPPP_DOMAINS.map((domain, idx) => {
                  const [prefix] = domain.id.split('-')
                  const domainNumber = parseInt(prefix, 10)
                  const hasOrgPsychPriority = priorityDomains.some((p: any) => p.type === 'org_psych')
                  const isOrgPsychDomain = domain.id === '3-5-6'
                  const isPriority = isOrgPsychDomain
                    ? hasOrgPsychPriority
                    : priorityDomains.some(
                        (p: any) => typeof p.domainNumber === 'number' && p.domainNumber === domainNumber
                      )
                  return (
                    <div key={idx} className={`space-y-1 pr-2 ${isPriority ? 'opacity-100' : ''}`}>
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <div className="flex items-center gap-1 truncate">
                          {isPriority && (
                            <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: '#c46685' }} />
                          )}
                          <span className="text-foreground/80 truncate">{domain.name}</span>
                        </div>
                        <span className="text-foreground/60 ml-1 flex-shrink-0">
                          {Math.round(progressData.domainProgress[idx] || 0)}%
                        </span>
                      </div>
                      <Progress value={progressData.domainProgress[idx] || 0} className="h-1" />
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      ),
    },
    {
      Icon: History,
      name: "Prioritize",
      description: "Review exam results and focus areas",
      href: prioritizeHref,
      cta: "View Results",
      className:
        "col-span-2 col-start-3 row-span-1 row-start-1 md:col-span-3 md:col-start-auto md:row-span-1 md:row-start-auto lg:col-start-1 lg:col-end-2 lg:row-start-5 lg:row-end-7",
    },
    {
      Icon: Droplets,
      name: "Recover",
      description: (
        <>
          <span className="md:hidden">Coming soon</span>
          <span className="hidden md:inline">Improve focus and reduce burnout</span>
        </>
      ),
      href: "#",
      cta: "Coming Soon",
      className:
        "col-span-2 col-start-3 row-span-1 row-start-2 md:col-span-3 md:col-start-auto md:row-span-1 md:row-start-auto lg:col-start-2 lg:col-end-3 lg:row-start-5 lg:row-end-7 group cursor-not-allowed opacity-75",
      background: (
        <div className="absolute inset-0 overflow-hidden">
          <BreathingAnimation speed={0.596} />
        </div>
      ),
    },
  ]

  // INFO CARDS - Smaller, secondary information (narrow, on right side)
  const infoCards = [
    {
      Icon: CalendarIcon,
      name: examDate ? formatDateShort(examDate) : "Exam Date",
      description: examDate && daysRemaining !== null
        ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`
        : "Set your exam date",
      href: "#",
      cta: isExamDatePopoverOpen ? "" : "Edit Date", // Hide CTA when calendar is open
      className:
        "col-span-2 col-start-1 row-span-2 row-start-5 md:col-span-3 md:col-start-auto md:row-span-1 md:row-start-auto lg:col-start-5 lg:col-end-6 lg:row-start-1 lg:row-end-3",
      background: (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto cursor-pointer"
          onClick={() => !isExamDatePopoverOpen && setIsExamDatePopoverOpen(true)}
        >
          {isExamDatePopoverOpen ? (
            <div className="relative w-full h-full pointer-events-auto overflow-hidden rounded-lg" onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button
                onClick={() => setIsExamDatePopoverOpen(false)}
                className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border text-foreground/60 hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center p-1 h-full overflow-auto">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    handleSaveExamDate(date)
                    setIsExamDatePopoverOpen(false)
                  }}
                  captionLayout="dropdown"
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 5}
                  className="rounded-lg border scale-[0.65] origin-center"
                  fixedWeeks
                />
              </div>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      Icon: Flame,
      name: "Study Streak",
      description: "",
      href: "/topic-selector",
      cta: "Keep it going",
      className:
        "col-span-2 col-start-3 row-span-1 row-start-5 md:col-span-3 md:col-start-auto md:row-span-1 md:row-start-auto lg:col-start-5 lg:col-end-6 lg:row-start-3 lg:row-end-5",
      background: (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <NumberTicker
            value={studyStats.studyStreak}
            duration={1.5}
            className="text-4xl font-bold text-primary"
          />
          <span className="text-xs md:text-sm text-muted-foreground">
            {studyStats.studyStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
      ),
    },
    {
      Icon: Target,
      name: "Daily Goal",
      description: `${dailyGoal} lesson${dailyGoal > 1 ? 's' : ''}/day`,
      href: "#",
      cta: "Edit",
      className:
        "col-span-2 col-start-3 row-span-1 row-start-6 md:col-span-3 md:col-start-auto md:row-span-1 md:row-start-auto lg:col-start-5 lg:col-end-6 lg:row-start-5 lg:row-end-7",
      background: (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-auto cursor-pointer"
          onClick={() => !isPopoverOpen && setIsPopoverOpen(true)}
        >
          {!isPopoverOpen ? (
            <div className="absolute inset-0 flex flex-col items-center justify-start pt-8 gap-2">
              <div className="relative w-24 h-24 opacity-30">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-border/50"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-primary transition-all duration-500"
                    strokeDasharray={`${(Math.min(todayQuizCount / dailyGoal, 1)) * (56 * 2 * Math.PI)} ${56 * 2 * Math.PI}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                  {Math.round((todayQuizCount / dailyGoal) * 100)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full pointer-events-auto overflow-hidden rounded-lg" onClick={(e) => e.stopPropagation()}>
              <ScrollArea className="relative w-full h-full">
                <div className="flex flex-col gap-2 p-4 min-h-full">
                  {[1, 2, 3, 4, 5, 6, 7].map((goal) => (
                    <Button
                      key={goal}
                      variant={dailyGoal === goal ? "default" : "outline"}
                      className="w-full justify-center text-lg"
                      onClick={() => {
                        handleDailyGoalChange(goal)
                        setIsPopoverOpen(false)
                      }}
                    >
                      {goal}
                    </Button>
                  ))}
                </div>
                <ProgressiveBlur position="bottom" height="30%" />
              </ScrollArea>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userProfile?.email?.split('@')[0]}</p>
        </div>

        {/* Bento Grid - Practice above, Review Exams and Prioritize side-by-side, Recover below, Study on right, Info cards on far right */}
        <BentoGrid className="lg:grid-rows-6 lg:grid-cols-5">
          {/* Action Cards */}
          {actionCards.map((feature, idx) => (
            <BentoCard
              key={`action-${idx}`}
              {...feature}
              onClick={feature.name === "Study" ? undefined : undefined}
            />
          ))}

          {/* Info Cards */}
          {infoCards.map((feature, idx) => (
            <BentoCard
              key={`info-${idx}`}
              {...feature}
              onClick={
                (examDate ? formatDateShort(examDate) : "Exam Date") === feature.name
                  ? () => setIsExamDatePopoverOpen(true)
                  : undefined
              }
              classNameHeader={
                (feature.name === "Daily Goal" && isPopoverOpen) ||
                ((examDate ? formatDateShort(examDate) : "Exam Date") === feature.name && isExamDatePopoverOpen)
                  ? "opacity-0 transition-opacity duration-300"
                  : "transition-opacity duration-300"
              }
              showHeader={
                !(feature.name === "Daily Goal" && isPopoverOpen) &&
                !((examDate ? formatDateShort(examDate) : "Exam Date") === feature.name && isExamDatePopoverOpen)
              }
            />
          ))}
        </BentoGrid>

        {/* Account Status Box */}
        <div className="border border-border/50 rounded-lg p-4 md:p-6 bg-white dark:bg-black backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="hidden md:flex w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <PersonIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3
                  className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => {
                    const newName = prompt('Enter your name:', userProfile?.email?.split('@')[0] || '')
                    if (newName && newName.trim()) {
                      // TODO: Save name to user profile
                      console.log('Saving name:', newName)
                    }
                  }}
                >
                  {userProfile?.email?.split('@')[0]}
                </h3>
                <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              </div>
            </div>
            <div className="w-full md:flex-1">
              <div className="flex flex-col gap-2 md:flex-row md:flex-nowrap md:items-center md:gap-3">
                <div
                  className="inline-flex h-10 w-full items-center justify-center rounded-full border px-5 text-sm font-medium md:w-auto"
                  style={subscriptionTierStyle}
                >
                  Plan: {subscriptionTierLabel}
                </div>
                <Button
                  className="rounded-full h-10 px-5 text-sm font-medium w-full md:w-auto"
                  onClick={() => setIsPricingCarouselOpen(true)}
                >
                  Change Tier
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-5 text-sm font-medium w-full md:w-auto"
                  onClick={handleManageBilling}
                  disabled={isBillingPortalLoading}
                >
                  {isBillingPortalLoading ? 'Opening Billing…' : 'Manage Billing'}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-5 text-sm font-medium w-full md:w-auto"
                  onClick={() => setIsFeedbackOpen(true)}
                >
                  Feedback
                </Button>
              </div>
              {billingPortalError && (
                <div className="mt-2 flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{billingPortalError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Tier Carousel Modal */}
        {isPricingCarouselOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsPricingCarouselOpen(false)}
          >
            <div className="relative w-full max-w-md px-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsPricingCarouselOpen(false)}
                className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border text-foreground/60 hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <Carousel className="w-full px-12">
                <CarouselContent>
                  {siteConfig.pricing.pricingItems.map((tier, index) => {
                    const [displayAmount, displayPeriod] = tier.displayPrice
                      ? tier.displayPrice.split("/").map((part) => part.trim())
                      : [tier.price, tier.period]

                    const planTier =
                      tier.name === 'Pro' ? 'pro' : tier.name === 'Pro + Coaching' ? 'pro_coaching' : null
                    const isPaidTier = Boolean(planTier)
                    const isLoading = Boolean(planTier && checkoutTier === planTier)

                    return (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <Card className="border-2">
                            <CardContent className="flex flex-col p-6 h-[500px]">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-2xl font-bold">{tier.name}</h3>
                                  {tier.isPopular && (
                                    <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                                  )}
                                </div>
                                <div className="mb-6">
                                  <div className="text-4xl font-bold mb-2">
                                    {displayAmount}
                                    {displayPeriod && (
                                      <span className="text-lg font-medium text-muted-foreground ml-2">
                                        /{displayPeriod}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                                </div>
                                <div className="space-y-3 mb-6">
                                  <p className="text-sm font-semibold text-muted-foreground">
                                    {tier.featuresLabel}
                                  </p>
                                  {tier.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg
                                          className="w-3 h-3 text-primary"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      </div>
                                      <span className="text-sm">{feature}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <Button
                                className={tier.buttonColor}
                                disabled={isPaidTier && !!checkoutTier}
                                onClick={() => handleTierSelection(tier.name)}
                              >
                                {isPaidTier && isLoading ? 'Redirecting…' : tier.buttonText}
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    )
                  })}
                </CarouselContent>
                <CarouselPrevious className="-left-12" />
                <CarouselNext className="-right-12" />
              </Carousel>
              {checkoutError && (
                <p className="text-sm text-red-500 mt-4 text-center">
                  {checkoutError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Feedback Chat Modal */}
        {isFeedbackOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsFeedbackOpen(false)}
          >
            <div className="relative w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border text-foreground/60 hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Send Feedback
                  </CardTitle>
                  <CardDescription>
                    Share quick thoughts, ideas, or issues.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/10 p-3">
                      <Switch
                        id="anonymous-feedback"
                        checked={isAnonymousFeedback}
                        onCheckedChange={setIsAnonymousFeedback}
                      />
                      <div>
                        <label htmlFor="anonymous-feedback" className="text-sm font-semibold">
                          Submit anonymously
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Feedback is stored without your name or email.
                        </p>
                      </div>
                    </div>
                    <FeedbackInputBox
                      onSend={handleSendFeedback}
                      isLoading={isFeedbackSubmitting}
                      placeholder="Share a quick note or screenshot..."
                    />
                    {feedbackMessage && (
                      <p
                        className={`text-sm font-medium ${
                          feedbackStatus === 'success' ? 'text-green-500' : 'text-red-400'
                        }`}
                      >
                        {feedbackMessage}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
