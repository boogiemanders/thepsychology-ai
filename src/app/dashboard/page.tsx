'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState, useCallback } from 'react'
import { getAllQuizResults } from '@/lib/quiz-results-storage'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'
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
import { getTopPriorities } from '@/lib/priority-storage'
import { triggerBackgroundPreGeneration } from '@/lib/pre-generated-exams'
import { siteConfig } from '@/lib/config'
import { SimplePromptInput } from '@/components/ui/simple-prompt-input'

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading, signOut, refreshProfile } = useAuth()
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
  const [hasPausedExam, setHasPausedExam] = useState(false)
  const [isPricingCarouselOpen, setIsPricingCarouselOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const handleDailyGoalChange = (newGoal: number) => {
    setDailyGoalState(newGoal)
    setDailyGoal(newGoal)
    setIsPopoverOpen(false)
  }

  const handleSendFeedback = async (message: string) => {
    if (!message.trim() || !user) return

    // TODO: Implement feedback submission to Supabase or email service
    console.log('Feedback from user:', user.id, 'Message:', message)
    setFeedbackMessage('Thank you for your feedback!')
    setTimeout(() => {
      setFeedbackMessage('')
      setIsFeedbackOpen(false)
    }, 2000)
  }

  useEffect(() => {
    setMounted(true)

    // Load exam date from userProfile (Supabase) if available
    if (userProfile?.exam_date) {
      setExamDate(userProfile.exam_date)
    } else if (typeof window !== 'undefined') {
      // Fallback to localStorage for backwards compatibility
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser)
          const usersData = localStorage.getItem('users')
          if (usersData) {
            const users = JSON.parse(usersData)
            const user = users.find((u: any) => u.id === userData.id)
            if (user?.goals?.examDate) {
              setExamDate(user.goals.examDate)
            }
          }
        } catch (e) {
          console.error('Error retrieving exam date:', e)
        }
      }
    }

    // Load priority recommendations from Supabase
    const loadPriorities = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('study_priorities')
          .select('top_domains')
          .eq('user_id', user.id)
          .single()

        if (data && !error) {
          setPriorityDomains(data.top_domains)
        } else {
          // Fallback to localStorage
          const priorities = getTopPriorities('diagnostic')
          if (priorities && priorities.length > 0) {
            setPriorityDomains(priorities)
          }
        }
      } catch (err) {
        console.error('Failed to load priorities from Supabase:', err)
        // Fallback to localStorage
        const priorities = getTopPriorities('diagnostic')
        if (priorities && priorities.length > 0) {
          setPriorityDomains(priorities)
        }
      }
    }

    loadPriorities()
  }, [userProfile, user?.id])

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
    const completedTopics = new Set<string>()

    allResults.forEach((result) => {
      const percentage = (result.score / result.totalQuestions) * 100
      completedTopics.add(result.topic)
      totalScore += percentage
      totalQuizzes++

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

    // Calculate domain progress as average of all topics in domain
    EPPP_DOMAINS.forEach((_, domainIdx) => {
      const topicsInDomain = topicsByDomain[domainIdx] || []
      if (topicsInDomain.length === 0) {
        domainProgress[domainIdx] = 0
        return
      }

      const scores = topicsInDomain.map(t => topicScores[domainIdx][t] || 0)
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      domainProgress[domainIdx] = avgScore
    })

    // Calculate overall completion
    const totalCompletion = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0
    const completedDomainsCount = domainProgress.filter(p => p >= 80).length
    const totalTopics = Object.values(topicsByDomain).reduce((sum, topics) => sum + topics.length, 0)

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

      // Save to Supabase
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ exam_date: dateString })
          .eq('id', user.id)
          .select()

        if (error) {
          console.error('[Dashboard] Supabase update error:', error)
        } else {
          console.log('[Dashboard] Exam date saved to Supabase successfully:', dateString, 'Response:', data)
          // Refresh the user profile to get the updated exam date
          await refreshProfile()
        }
      } catch (error) {
        console.error('[Dashboard] Supabase save failed:', error)
      }

      // Also update localStorage as fallback
      if (typeof window !== 'undefined') {
        const currentUser = localStorage.getItem('currentUser')
        if (currentUser) {
          try {
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
          } catch (e) {
            console.error('Error updating localStorage:', e)
          }
        }
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
    {
      Icon: GraduationCap,
      name: "Practice",
      description: hasPausedExam ? "Resume your paused practice exam" : "Take practice exams to test your knowledge",
      href: "/exam-generator",
      cta: hasPausedExam ? "Resume?" : "Start Exam",
      className: "lg:col-start-1 lg:col-end-3 lg:row-start-1 lg:row-end-5",
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
      Icon: History,
      name: "Review Exams",
      description: "View your completed practice exams",
      href: "/review-exams",
      cta: "View Results",
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-5 lg:row-end-7",
    },
    {
      Icon: Droplets,
      name: "Recover",
      description: "Improve focus and reduce burnout",
      href: "#",
      cta: "Coming Soon",
      className: "lg:col-start-2 lg:col-end-3 lg:row-start-5 lg:row-end-7 group cursor-not-allowed opacity-75",
      background: (
        <div className="absolute inset-0 overflow-hidden">
          <BreathingAnimation speed={0.596} />
        </div>
      ),
    },
    {
      Icon: FileTextIcon,
      name: "Study",
      description: `${studyStats.totalQuizzes} quizzes • ${progressData.completedTopics}/${progressData.totalTopics} topics`,
      href: "/topic-selector",
      cta: "Start Studying",
      className: "lg:col-start-3 lg:col-end-5 lg:row-start-1 lg:row-end-7",
      background: (
        <div className="absolute inset-0 flex flex-col items-start justify-start pt-4 p-4 h-full">
          {/* Priority Badges Section */}
          {priorityDomains.length > 0 && (
            <div className="w-full mb-3 pb-3 border-b border-border/40">
              <div className="text-xs font-semibold text-foreground/70 mb-2 flex items-center gap-1">
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
                      className="text-xs"
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

          <ScrollArea className="w-full h-full pr-4">
            <div className="w-full space-y-2 opacity-60">
              {EPPP_DOMAINS.map((domain, idx) => {
                const isPriority = priorityDomains.some(p => p.domainNumber === idx + 1)
                return (
                  <div key={idx} className={`space-y-1 pr-2 ${isPriority ? 'opacity-100' : ''}`}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 truncate">
                        {isPriority && <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: '#c46685' }} />}
                        <span className="text-foreground/80 truncate">{domain.name}</span>
                      </div>
                      <span className="text-foreground/60 ml-1 flex-shrink-0">{Math.round(progressData.domainProgress[idx] || 0)}%</span>
                    </div>
                    <Progress value={progressData.domainProgress[idx] || 0} className="h-1" />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
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
      className: "lg:col-start-5 lg:col-end-6 lg:row-start-1 lg:row-end-3",
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
      className: "lg:col-start-5 lg:col-end-6 lg:row-start-3 lg:row-end-5",
      background: (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <NumberTicker
            value={studyStats.studyStreak}
            duration={1.5}
            className="text-4xl font-bold text-primary"
          />
          <span className="text-xs text-muted-foreground">{studyStats.studyStreak === 1 ? 'day' : 'days'}</span>
        </div>
      ),
    },
    {
      Icon: Target,
      name: "Daily Goal",
      description: `${dailyGoal} topic${dailyGoal > 1 ? 's' : ''}/day`,
      href: "#",
      cta: "Edit",
      className: "lg:col-start-5 lg:col-end-6 lg:row-start-5 lg:row-end-7",
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
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
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
        <div className="border border-border/50 rounded-lg p-6 bg-secondary/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <PersonIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
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
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {userProfile?.subscription_tier === 'pro_coaching' ? 'Pro + Coaching' :
                   userProfile?.subscription_tier === 'pro' ? 'Pro' :
                   userProfile?.subscription_tier === 'basic' ? 'Basic' : 'Free Trial'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setIsPricingCarouselOpen(true)}
                >
                  Change Tier
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsFeedbackOpen(true)}
            >
              <MessageSquare className="w-4 h-4" />
              Feedback
            </Button>
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
                  {siteConfig.pricing.pricingItems.map((tier, index) => (
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
                                <div className="text-4xl font-bold mb-2">{tier.displayPrice}</div>
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
                              onClick={() => {
                                // TODO: Save tier to user profile
                                console.log('Selected tier:', tier.name)
                                setIsPricingCarouselOpen(false)
                              }}
                            >
                              {tier.buttonText}
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-12" />
                <CarouselNext className="-right-12" />
              </Carousel>
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
                    We'd love to hear your thoughts, suggestions, or report any issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feedbackMessage ? (
                    <div className="text-center py-8">
                      <p className="text-green-600 dark:text-green-400 font-medium">{feedbackMessage}</p>
                    </div>
                  ) : (
                    <SimplePromptInput
                      onSubmit={handleSendFeedback}
                      placeholder="Type your feedback here..."
                      disabled={false}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
