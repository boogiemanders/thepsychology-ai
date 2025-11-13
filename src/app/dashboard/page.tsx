'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'
import { getAllQuizResults } from '@/lib/quiz-results-storage'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { LogOut, ChevronDown, Check, Edit2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [progressData, setProgressData] = useState({
    totalCompletion: 0,
    completedTopics: 0,
    totalTopics: 56,
    completedDomains: 0,
    totalDomains: 8,
    domainProgress: Array(8).fill(0),
  })
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [examDate, setExamDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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

  // Calculate days remaining to exam
  useEffect(() => {
    if (examDate) {
      const exam = new Date(examDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      exam.setHours(0, 0, 0, 0)
      const diffTime = exam.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays)
      setSelectedDate(new Date(examDate))
    }
  }, [examDate])

  const handleSaveExamDate = async (date: Date | undefined) => {
    if (date && user) {
      const dateString = date.toISOString().split('T')[0]
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

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* Quick Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/tools/topic-selector" className="block">
                <Button className="w-full" variant="default">
                  Start Studying
                </Button>
              </Link>
              <Link href="/tools/exam-generator" className="block">
                <Button className="w-full" variant="outline">
                  Take Practice Exam
                </Button>
              </Link>
              <Link href="/tools/study-optimizer" className="block">
                <Button className="w-full" variant="outline">
                  View Analysis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Exam Countdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Exam Countdown</CardTitle>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Edit2 size={16} />
                  Edit Date
                </Button>
              </DialogTrigger>
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
                    captionLayout="dropdown"
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 5}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return date < today
                    }}
                    className="rounded-md border"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-6">
            {examDate && daysRemaining !== null ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center">
                  <Calendar
                    mode="single"
                    selected={new Date(examDate)}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return date < today
                    }}
                    className="rounded-md border"
                  />
                </div>
                <div className="flex flex-col justify-center items-center space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Your Exam Date</p>
                    <p className="text-2xl font-semibold">
                      {new Date(examDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-center bg-primary/10 rounded-lg p-4 w-full">
                    <p className="text-5xl font-bold text-primary">{daysRemaining}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {daysRemaining === 1 ? 'Day' : 'Days'} Remaining
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No exam date set yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Click "Edit Date" above to set your exam date and start your countdown.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Domain Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Domain Progress</CardTitle>
            <CardDescription>Your completion status for each domain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Biological Bases of Behavior' },
              { name: 'Cognitive-Affective Bases' },
              { name: 'Social & Cultural Foundations' },
              { name: 'Growth & Lifespan Development' },
              { name: 'Assessment & Diagnosis' },
              { name: 'Treatment, Intervention, and Prevention' },
              { name: 'Research Methods & Statistics' },
              { name: 'Ethical, Legal & Professional Issues' },
            ].map((domain, idx) => (
              <div key={domain.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{domain.name}</span>
                  <span className="text-xs text-muted-foreground">{Math.round(progressData.domainProgress[idx])}%</span>
                </div>
                <Progress value={progressData.domainProgress[idx]} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Account Information</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut size={16} />
                Sign Out
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-medium">{userProfile?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subscription Tier</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-40 justify-between">
                      <span className="capitalize">{userProfile?.subscription_tier || 'free'}</span>
                      <ChevronDown size={16} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Select a plan</p>
                        <p className="text-xs text-muted-foreground">Upgrade to unlock more features</p>
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <button
                          onClick={() => {
                            // Handle free tier selection
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                            (userProfile?.subscription_tier || 'free') === 'free'
                              ? 'bg-accent text-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          <div>
                            <p className="font-medium">Free</p>
                            <p className="text-xs text-muted-foreground">$0/month</p>
                          </div>
                          {(userProfile?.subscription_tier || 'free') === 'free' && (
                            <Check size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            // Handle pro tier selection - redirect to upgrade
                            window.location.href = '/#get-started'
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                            userProfile?.subscription_tier === 'pro'
                              ? 'bg-accent text-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          <div>
                            <p className="font-medium">Pro</p>
                            <p className="text-xs text-muted-foreground">$20/month</p>
                          </div>
                          {userProfile?.subscription_tier === 'pro' && (
                            <Check size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            // Handle pro+ coaching tier selection - redirect to upgrade
                            window.location.href = '/#get-started'
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                            userProfile?.subscription_tier === 'coaching'
                              ? 'bg-accent text-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          <div>
                            <p className="font-medium">Pro + Coaching</p>
                            <p className="text-xs text-muted-foreground">$200/month</p>
                          </div>
                          {userProfile?.subscription_tier === 'coaching' && (
                            <Check size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                <p className="text-sm font-medium">
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Recently'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
