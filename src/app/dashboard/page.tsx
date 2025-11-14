'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'
import { getAllQuizResults } from '@/lib/quiz-results-storage'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { NumberTicker } from '@/components/ui/number-ticker'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { Marquee } from '@/components/ui/marquee'
import { Ripple } from '@/components/ui/ripple'
import { BreathingAnimation } from '@/components/ui/breathing-animation'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { CalendarIcon, FileTextIcon, PersonIcon } from '@radix-ui/react-icons'
import { LogOut, GraduationCap, Droplets, Target, Flame, AlertCircle } from 'lucide-react'
import { calculateStudyStats, calculateStudyPace, getDailyGoal, getTodayQuizCount, setDailyGoal } from '@/lib/dashboard-utils'
import { EPPP_DOMAINS } from '@/lib/eppp-data'
import { getTopPriorities } from '@/lib/priority-storage'

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading, signOut } = useAuth()
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [studyStats, setStudyStats] = useState(calculateStudyStats())
  const [dailyGoal, setDailyGoalState] = useState(getDailyGoal())
  const [todayQuizCount, setTodayQuizCount] = useState(0)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [priorityDomains, setPriorityDomains] = useState<any[]>([])

  const handleDailyGoalChange = (newGoal: number) => {
    setDailyGoalState(newGoal)
    setDailyGoal(newGoal)
    setIsPopoverOpen(false)
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

    // Load priority recommendations from diagnostic exam
    if (typeof window !== 'undefined') {
      const priorities = getTopPriorities('diagnostic')
      if (priorities && priorities.length > 0) {
        setPriorityDomains(priorities)
      }
    }
  }, [userProfile])

  // Calculate progress based on quiz results
  useEffect(() => {
    if (!mounted) return

    const updateProgress = () => {
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
    }

    // Initial update
    updateProgress()

    // Listen for storage changes (quiz results updates from other tabs)
    const handleStorageChange = () => {
      updateProgress()
    }

    // Listen for custom quiz results update event
    const handleQuizResultsUpdate = () => {
      updateProgress()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('quiz-results-updated', handleQuizResultsUpdate)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('quiz-results-updated', handleQuizResultsUpdate)
    }
  }, [mounted])

  // Update study stats and today's quiz count
  useEffect(() => {
    if (!mounted) return

    const updateStats = () => {
      setStudyStats(calculateStudyStats())
      setTodayQuizCount(getTodayQuizCount())
    }

    const updatePriorities = () => {
      const priorities = getTopPriorities('diagnostic')
      setPriorityDomains(priorities || [])
    }

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
  }, [mounted])

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
      // Subtract 1 day so selected date displays correctly
      // (when user picks Nov 14, it should be saved as Nov 14, not Nov 15)
      const adjustedDate = new Date(date)
      adjustedDate.setDate(adjustedDate.getDate() - 1)

      // Use UTC methods to extract date components
      const year = adjustedDate.getUTCFullYear()
      const month = adjustedDate.getUTCMonth()
      const day = adjustedDate.getUTCDate()

      // Create date string from the adjusted date
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      setExamDate(dateString)

      // Try to save to Supabase (may fail if column doesn't exist yet)
      try {
        const { error } = await supabase
          .from('users')
          .update({ exam_date: dateString })
          .eq('id', user.id)

        if (error) {
          console.warn('Supabase update failed (column may not exist yet):', error.message || error)
          // Continue anyway - localStorage will work as fallback
        }
      } catch (error) {
        console.warn('Supabase update failed:', error)
        // Continue anyway - localStorage will work as fallback
      }

      // Always update localStorage as fallback
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

      setIsEditDialogOpen(false)
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
      description: "Take practice exams to test your knowledge",
      href: "/exam-generator",
      cta: "Start Exam",
      className: "lg:col-start-1 lg:col-end-3 lg:row-start-1 lg:row-end-3",
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
      name: "Prioritizer",
      description: studyStats.weakTopics.length > 0 && studyStats.totalQuizzes > 0
        ? `Focus on: ${studyStats.weakTopics[0].topic.substring(0, 30)}...`
        : "AI-powered study recommendations",
      href: "/study-optimizer",
      cta: "View Insights",
      className: "lg:col-start-1 lg:col-end-3 lg:row-start-3 lg:row-end-5",
      background: studyStats.weakTopics.length > 0 && studyStats.totalQuizzes > 0 ? (
        <Marquee className="absolute inset-0 opacity-20" repeat={2}>
          <div className="flex gap-6 whitespace-nowrap px-4">
            {studyStats.weakTopics.slice(0, 3).map((topic, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-sm">{topic.topic}</span>
                {idx < 2 && <span>•</span>}
              </div>
            ))}
          </div>
        </Marquee>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="text-center text-xs text-foreground/60 px-4">
            <p>Recommendations will appear</p>
            <p>after first practice exam</p>
          </div>
        </div>
      ),
    },
    {
      Icon: Droplets,
      name: "Recover",
      description: "Improve focus and reduce burnout while studying",
      href: "#",
      cta: "Coming Soon",
      className: "lg:col-start-1 lg:col-end-3 lg:row-start-5 lg:row-end-7 group cursor-not-allowed opacity-75",
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
                <AlertCircle className="w-3 h-3" />
                Priority Focus
              </div>
              <div className="flex flex-wrap gap-1">
                {priorityDomains.slice(0, 3).map((domain, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                    #{idx + 1}: {domain.domainName.split(':')[0]}
                  </Badge>
                ))}
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
                        {isPriority && <AlertCircle className="w-3 h-3 text-orange-500 flex-shrink-0" />}
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
      name: "Exam Date",
      description: examDate && daysRemaining !== null
        ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`
        : "Set your exam date",
      href: "#",
      cta: "Edit Date",
      className: "lg:col-start-5 lg:col-end-6 lg:row-start-1 lg:row-end-3",
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

        {/* Bento Grid - Practice/Prioritize/Recover left, Study wide in middle, Info boxes narrow on right */}
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
              onClick={feature.name === "Exam Date" ? () => setIsEditDialogOpen(true) : undefined}
              classNameHeader={feature.name === "Daily Goal" && isPopoverOpen ? "opacity-0 transition-opacity duration-300" : "transition-opacity duration-300"}
              showHeader={!(feature.name === "Daily Goal" && isPopoverOpen)}
            />
          ))}
        </BentoGrid>

        {/* Account Status Box */}
        <div className="border border-border/50 rounded-lg p-6 bg-secondary/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <PersonIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{userProfile?.email?.split('@')[0]}</h3>
                <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Detailed Exam Countdown Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Exam Date</DialogTitle>
              <DialogDescription>
                Select your exam date from the calendar below.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSaveExamDate}
                captionLayout="dropdowns"
                fromYear={new Date().getFullYear()}
                toYear={new Date().getFullYear() + 5}
                className="rounded-lg border"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
