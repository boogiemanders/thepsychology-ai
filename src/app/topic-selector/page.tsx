'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, Clock, Play, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Kbd } from '@/components/ui/kbd'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { motion, AnimatePresence } from 'motion/react'
import { getAllQuizResults } from '@/lib/quiz-results-storage'
import { calculateStudyStats } from '@/lib/dashboard-utils'
import { EPPP_DOMAINS } from '@/lib/eppp-data'
import { useAuth } from '@/context/auth-context'
import { saveUserInterest, subscribeToUserInterestChanges, unsubscribeFromInterestChanges } from '@/lib/interests'
import { getTopPriorities } from '@/lib/priority-storage'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface RecentActivity {
  topic: string
  timestamp: number
  score: number
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  return 'Just now'
}

export default function TopicSelectorPage() {
  const { user } = useAuth()
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState<string>('')
  const [savedInterests, setSavedInterests] = useState<string[]>([])
  const [domains, setDomains] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [priorityTopicIds, setPriorityTopicIds] = useState<string[]>([])
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const studyStats = calculateStudyStats()

  // Calculate progress based on quiz results
  useEffect(() => {
    const allResults = getAllQuizResults()

    // Get recent activities (last 5 topics)
    const sortedResults = [...allResults].sort((a, b) => b.timestamp - a.timestamp)
    const recentTopics = sortedResults.slice(0, 5).map(result => ({
      topic: result.topic,
      timestamp: result.timestamp,
      score: Math.round((result.score / result.totalQuestions) * 100)
    }))
    setRecentActivities(recentTopics)

    // Create a map of topic scores
    const topicScores: Record<string, number> = {}
    allResults.forEach((result) => {
      const percentage = (result.score / result.totalQuestions) * 100
      topicScores[result.topic] = percentage
    })

    // Load priority recommendations from Supabase
    const loadPriorities = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('study_priorities')
          .select('top_domains')
          .eq('user_id', user.id)
          .single()

        if (data && !error) {
          const allPriorityTopics = data.top_domains.flatMap((domain: any) => domain.recommendedTopicIds)
          setPriorityTopicIds(allPriorityTopics)
        } else {
          // Fallback to localStorage
          const priorities = getTopPriorities('diagnostic')
          if (priorities && priorities.length > 0) {
            const allPriorityTopics = priorities.flatMap(domain => domain.recommendedTopicIds)
            setPriorityTopicIds(allPriorityTopics)
          }
        }
      } catch (err) {
        console.error('Failed to load priorities from Supabase:', err)
        // Fallback to localStorage
        const priorities = getTopPriorities('diagnostic')
        if (priorities && priorities.length > 0) {
          const allPriorityTopics = priorities.flatMap(domain => domain.recommendedTopicIds)
          setPriorityTopicIds(allPriorityTopics)
        }
      }
    }

    loadPriorities()

    // Build domains with dynamic progress
    const domainsWithProgress = EPPP_DOMAINS.map((domain) => {
      const topicsWithProgress = domain.topics.map((topic) => {
        // If quiz exists, show actual score; otherwise show 0%
        const score = topicScores[topic.name] ?? 0
        return {
          id: topic.id,
          name: topic.name,
          progress: Math.round(score),
        }
      })

      // Calculate domain progress as average of all topics
      const avgProgress = topicsWithProgress.length > 0
        ? Math.round(topicsWithProgress.reduce((sum, t) => sum + t.progress, 0) / topicsWithProgress.length)
        : 0

      return {
        id: domain.id,
        name: domain.name,
        progress: avgProgress,
        topics: topicsWithProgress,
      }
    })

    setDomains(domainsWithProgress)
  }, [])

  // Subscribe to interest changes from topic-teacher
  useEffect(() => {
    if (user?.id) {
      const channel = subscribeToUserInterestChanges(user.id, (newInterest) => {
        if (newInterest) {
          // Parse comma-separated interests
          const interestsList = newInterest
            .split(',')
            .map((i) => i.trim())
            .filter((i) => i.length > 0)
          setSavedInterests(interestsList)
          setCurrentInput('')
        }
      })
      subscriptionRef.current = channel
    }

    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromInterestChanges(subscriptionRef.current)
      }
    }
  }, [user?.id])

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((id) => id !== domainId)
        : [...prev, domainId]
    )
  }

  const handleAddInterest = async () => {
    if (currentInput.trim() && user?.id) {
      try {
        const newInterest = currentInput.trim()
        // Add to local list
        const updatedInterests = [...savedInterests, newInterest]
        setSavedInterests(updatedInterests)
        setCurrentInput('')

        const interestsString = updatedInterests.join(', ')

        // Save to localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem(`interests_${user.id}`, interestsString)
        }

        // Save all interests as comma-separated string to Supabase
        await saveUserInterest(user.id, interestsString)
      } catch (error) {
        console.debug('Failed to save interest:', error)
      }
    }
  }

  const removeInterest = (index: number) => {
    const newInterests = savedInterests.filter((_, i) => i !== index)
    setSavedInterests(newInterests)

    // Update localStorage as backup
    if (user?.id && typeof window !== 'undefined') {
      if (newInterests.length > 0) {
        localStorage.setItem(`interests_${user.id}`, newInterests.join(', '))
      } else {
        localStorage.removeItem(`interests_${user.id}`)
      }
    }

    // Update Supabase with remaining interests
    if (user?.id) {
      if (newInterests.length > 0) {
        saveUserInterest(user.id, newInterests.join(', '))
      }
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="p-6 border-b">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Topics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Topics</h1>
              <p className="text-sm text-muted-foreground">
                Select a topic to start studying
              </p>
            </div>

            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 p-2 pl-3 border border-input rounded-md bg-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  {/* Display saved interests as tags */}
                  {savedInterests.map((interest, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                    >
                      <span>{interest}</span>
                      <button
                        onClick={() => removeInterest(index)}
                        className="hover:opacity-70 transition-opacity"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}

                  {/* Input field */}
                  <input
                    type="text"
                    placeholder={savedInterests.length === 0 ? "Add your interests/hobbies/fandoms for study personalization..." : "Add another interest..."}
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddInterest()
                      }
                    }}
                    className="flex-1 min-w-[200px] bg-transparent outline-none text-sm"
                  />

                  {/* Enter key indicator */}
                  {currentInput.trim().length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1 text-xs text-muted-foreground ml-auto"
                    >
                      <Kbd className="text-xs px-1.5 py-0.5">Enter</Kbd>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        {recentActivities.length > 0 && (
          <div className="p-6 border-b">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock size={20} />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Continue where you left off
                    </CardDescription>
                  </div>
                  {studyStats.lastStudiedTopic && (
                    <Link href={`/quizzer?topic=${encodeURIComponent(studyStats.lastStudiedTopic)}`}>
                      <Button size="sm" className="gap-2">
                        <Play size={16} />
                        Continue
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentActivities.map((activity, idx) => {
                    const timeAgo = getTimeAgo(activity.timestamp)
                    const scoreColor = activity.score >= 80 ? 'text-green-500' :
                                      activity.score >= 60 ? 'text-yellow-500' :
                                      'text-orange-500'

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Link href={`/quizzer?topic=${encodeURIComponent(activity.topic)}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors cursor-pointer group">
                            <div className="flex-1">
                              <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                {activity.topic}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {timeAgo}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-semibold ${scoreColor}`}>
                                {activity.score}%
                              </span>
                              <ChevronDown size={16} className="transform -rotate-90 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="p-6 space-y-3">
          {domains.map((domain, index) => (
            <Card key={domain.id} className="border">
              <button
                onClick={() => toggleDomain(domain.id)}
                className="w-full"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-accent transition-colors text-left w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">{domain.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{domain.progress}%</span>
                      <motion.div
                        animate={{
                          rotate: expandedDomains.includes(domain.id) ? 180 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} />
                      </motion.div>
                    </div>
                  </div>
                  <Progress value={domain.progress} className="h-1" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {expandedDomains.includes(domain.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: 'easeInOut',
                      opacity: { duration: 0.2 },
                    }}
                    style={{ overflow: 'hidden' }}
                  >
                    <Separator />
                    <CardContent className="pt-4 pb-4 space-y-3">
                      {domain.topics.map((topic) => {
                        const isPriority = priorityTopicIds.includes(topic.id)
                        return (
                          <Link
                            key={topic.name}
                            href={`/topic-teacher?domain=${domain.id}&topic=${encodeURIComponent(topic.name)}`}
                            className="block hover:opacity-75 transition-opacity"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm">{topic.name}</span>
                                {isPriority && (
                                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Focus
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0">{topic.progress}%</span>
                            </div>
                            <Progress value={topic.progress} className="h-1.5" />
                          </Link>
                        )
                      })}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
