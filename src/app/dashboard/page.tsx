'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'
import { getAllQuizResults } from '@/lib/quiz-results-storage'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { NumberTicker } from '@/components/ui/number-ticker'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { CalendarIcon, FileTextIcon, PersonIcon } from '@radix-ui/react-icons'
import { LogOut, GraduationCap, Flame, Target } from 'lucide-react'
import { calculateStudyStats, calculateStudyPace, getDailyGoal, getTodayQuizCount, setDailyGoal } from '@/lib/dashboard-utils'
import { EPPP_DOMAINS } from '@/lib/eppp-data'

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
  }, [userProfile])

  // Calculate progress based on quiz results
  useEffect(() => {
    if (!mounted) return

    const allResults = getAllQuizResults()

    // Topic data with domain mapping
    const topicsByDomain = {
      0: ['Neurotransmitters & Receptors', 'Brain Anatomy & Function', 'Nervous System Organization', 'Psychopharmacology', 'Sleep & Circadian Rhythms'],
      1: ['Classical & Operant Conditioning', 'Observational Learning', 'Memory Systems & Encoding', 'Attention & Consciousness', 'Motivation & Emotion'],
      2: ['Social Cognition & Attitudes', 'Group Dynamics & Conformity', 'Cultural Psychology', 'Organizational Psychology', 'Diversity & Multicultural Issues'],
      3: ['Physical Development', 'Cognitive Development', 'Psychosocial Development', 'Moral Development', 'Aging & Late Adulthood'],
      4: ['Psychological Testing Principles', 'Intelligence Assessment', 'Personality Assessment', 'Clinical Diagnosis & Psychopathology', 'Substance Use Disorders'],
      5: ['Cognitive-Behavioral Therapies', 'Psychodynamic Therapies', 'Humanistic & Experiential Therapies', 'Group & Family Therapy', 'Evidence-Based Interventions'],
      6: ['Research Design & Methodology', 'Experimental vs Non-Experimental', 'Descriptive Statistics', 'Inferential Statistics', 'Effect Size & Power'],
      7: ['Ethical Principles & Guidelines', 'Confidentiality & Privacy', 'Informed Consent', 'Competence & Boundaries', 'Legal Liability & Licensing'],
    }

    // Calculate completed topics (80%+ score)
    const completedTopics = new Set<string>()
    const domainCompletion = Array(8).fill(0)

    allResults.forEach((result) => {
      const percentage = (result.score / result.totalQuestions) * 100
      if (percentage >= 80) {
        completedTopics.add(result.topic)

        // Find which domain this topic belongs to
        for (let domainIdx = 0; domainIdx < 8; domainIdx++) {
          const topics = topicsByDomain[domainIdx as keyof typeof topicsByDomain] || []
          if (topics.some(t => t.toLowerCase() === result.topic.toLowerCase())) {
            domainCompletion[domainIdx]++
            break
          }
        }
      }
    })

    // Calculate domain progress percentages
    const domainProgressPercent = domainCompletion.map((completed, idx) => {
      const totalTopicsInDomain = 5 // Each domain has 5 topics
      return (completed / totalTopicsInDomain) * 100
    })

    // Calculate overall completion
    const totalCompletion = Math.round((completedTopics.size / 56) * 100)
    const completedDomainsCount = domainCompletion.filter(c => c >= 5).length

    setProgressData({
      totalCompletion,
      completedTopics: completedTopics.size,
      totalTopics: 56,
      completedDomains: completedDomainsCount,
      totalDomains: 8,
      domainProgress: domainProgressPercent,
    })
  }, [mounted])

  // Update study stats and today's quiz count
  useEffect(() => {
    if (!mounted) return
    setStudyStats(calculateStudyStats())
    setTodayQuizCount(getTodayQuizCount())
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
      // Use UTC methods to extract date components as they appear in the calendar
      // react-day-picker passes dates at midnight UTC, so we need UTC methods
      const year = date.getUTCFullYear()
      const month = date.getUTCMonth()
      const day = date.getUTCDate()

      // Create date string from the actual selected day
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
      href: "/tools/exam-generator",
      cta: "Start Exam",
      className: "lg:col-start-1 lg:col-end-3 lg:row-start-1 lg:row-end-3",
      background: (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="grid grid-cols-3 gap-4 p-6">
            <div className="h-16 w-16 rounded-lg bg-primary/20 animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="h-16 w-16 rounded-lg bg-primary/20 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="h-16 w-16 rounded-lg bg-primary/20 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      ),
    },
    {
      Icon: FileTextIcon,
      name: "Prioritizer",
      description: studyStats.weakTopics.length > 0 && studyStats.totalQuizzes > 0
        ? `Focus on: ${studyStats.weakTopics[0].topic.substring(0, 30)}...`
        : "AI-powered study recommendations",
      href: "/tools/study-optimizer",
      cta: "View Insights",
      className: "lg:col-start-1 lg:col-end-3 lg:row-start-3 lg:row-end-5",
      background: (
        <div className="absolute inset-0 flex items-center justify-center opacity-20 p-6">
          {studyStats.weakTopics.length > 0 ? (
            <div className="w-full space-y-1">
              {studyStats.weakTopics.slice(0, 3).map((topic, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500/60" />
                  <div className="text-xs text-foreground/60 truncate">{topic.topic}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/20 animate-pulse" style={{ animationDelay: '0s' }} />
              <div className="h-12 w-12 rounded-lg bg-primary/20 animate-pulse" style={{ animationDelay: '0.15s' }} />
              <div className="h-12 w-12 rounded-lg bg-primary/20 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="h-12 w-12 rounded-lg bg-primary/20 animate-pulse" style={{ animationDelay: '0.45s' }} />
            </div>
          )}
        </div>
      ),
    },
    {
      Icon: Flame,
      name: "Recover",
      description: "Improve focus and reduce burnout while studying",
      href: "#",
      cta: "Coming Soon",
      className: "lg:col-start-1 lg:col-end-3 lg:row-start-5 lg:row-end-7 group cursor-not-allowed opacity-75",
      background: (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="text-center group-hover:block hidden">
            <p className="text-sm font-medium">Coming Soon for Pro</p>
          </div>
        </div>
      ),
    },
    {
      Icon: FileTextIcon,
      name: "Study",
      description: `${studyStats.totalQuizzes} quizzes • ${studyStats.averageScore}% avg • ${progressData.completedTopics}/${progressData.totalTopics} topics`,
      href: "/tools/topic-selector",
      cta: "Start Studying",
      className: "lg:col-start-3 lg:col-end-5 lg:row-start-1 lg:row-end-7",
      background: (
        <div className="absolute inset-0 flex flex-col items-start justify-start pt-4 p-4 h-full">
          <ScrollArea className="w-full h-full pr-4">
            <div className="w-full space-y-2 opacity-60">
              {EPPP_DOMAINS.map((domain, idx) => (
                <div key={idx} className="space-y-1 pr-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/80 truncate">{domain.name}</span>
                    <span className="text-foreground/60 ml-1 flex-shrink-0">{Math.round(progressData.domainProgress[idx] || 0)}%</span>
                  </div>
                  <Progress value={progressData.domainProgress[idx] || 0} className="h-1" />
                </div>
              ))}
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
        ? studyPace.pace !== 'Unknown'
          ? `${daysRemaining} days • ${studyPace.pace} • ${studyPace.topicsPerWeek}/wk`
          : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`
        : "Set your exam date",
      href: "#",
      cta: "Edit Date",
      className: "lg:col-start-5 lg:col-end-6 lg:row-start-1 lg:row-end-3",
      background: (
        <div className="absolute inset-0 flex items-center justify-center opacity-20 p-4">
          <div className="w-full space-y-2 text-sm">
            {studyPace.pace !== 'Unknown' && (
              <>
                <div className="flex justify-between text-xs text-foreground/60">
                  <span>Study Pace</span>
                  <span className={`font-semibold ${
                    studyPace.pace === 'On track' ? 'text-green-500' :
                    studyPace.pace === 'Ahead' ? 'text-blue-500' :
                    'text-orange-500'
                  }`}>{studyPace.pace}</span>
                </div>
                <div className="flex justify-between text-xs text-foreground/60">
                  <span>Topics/Week</span>
                  <span className="font-semibold">{studyPace.topicsPerWeek}</span>
                </div>
              </>
            )}
            {studyPace.pace === 'Unknown' && <CalendarIcon className="h-12 w-12 mx-auto opacity-50" />}
          </div>
        </div>
      ),
    },
    {
      Icon: Flame,
      name: "Study Streak",
      description: "",
      href: "/tools/topic-selector",
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
      description: `${todayQuizCount}/${dailyGoal} quizzes today`,
      href: "#",
      cta: "Change Goal",
      className: "lg:col-start-5 lg:col-end-6 lg:row-start-5 lg:row-end-7",
      background: (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-auto">
          <div className="relative w-24 h-24 opacity-30 pointer-events-none">
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
            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
              {Math.round((todayQuizCount / dailyGoal) * 100)}%
            </div>
          </div>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="pointer-events-auto text-xs">
                {dailyGoal} topics/day
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Daily Study Goal</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    How many topics do you want to study per day? (1-7)
                  </p>
                </div>
                <Carousel className="w-full">
                  <CarouselContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((goal) => (
                      <CarouselItem key={goal} className="basis-1/3">
                        <Button
                          variant={dailyGoal === goal ? "default" : "outline"}
                          className="w-full text-xs"
                          onClick={() => handleDailyGoalChange(goal)}
                        >
                          {goal}
                        </Button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0" />
                  <CarouselNext className="right-0" />
                </Carousel>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ),
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {userProfile?.email?.split('@')[0]}</p>
          </div>
          {/* Exam date in top right */}
          {examDate && (
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-semibold text-foreground">Exam Date</p>
              <p className="text-sm text-muted-foreground">
                {new Date(examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              {daysRemaining !== null && (
                <p className="text-xs text-primary font-medium">{daysRemaining} days remaining</p>
              )}
            </div>
          )}
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
