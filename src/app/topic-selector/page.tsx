'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, Clock, Play, X, AlertCircle, BadgeCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Kbd } from '@/components/ui/kbd'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { motion, AnimatePresence } from 'motion/react'
import { getAllQuizResults } from '@/lib/quiz-results-storage'
import { calculateStudyStats } from '@/lib/dashboard-utils'
import { EPPP_DOMAINS } from '@/lib/eppp-data'
import { QUIZ_PASS_PERCENT } from '@/lib/quiz-passing'
import { useAuth } from '@/context/auth-context'
import {
  getUserCurrentInterest,
  subscribeToUserInterestChanges,
  unsubscribeFromInterestChanges,
  updateUserCurrentInterest,
} from '@/lib/interests'
import {
  getUserLanguagePreference,
  subscribeToUserLanguagePreferenceChanges,
  unsubscribeFromLanguagePreferenceChanges,
  updateUserLanguagePreference,
} from '@/lib/language-preference'
import { getTopPriorities, getAllLatestRecommendations } from '@/lib/priority-storage'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { getLessonDisplayName } from '@/lib/topic-display-names'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Free-tier topics: one curated topic per domain, backed by free-contentGPT
const FREE_TOPICS_BY_DOMAIN: Record<string, string[]> = {
  '1': ['Brain Regions/Functions – Cerebral Cortex'],
  '2': ['Classical Conditioning'],
  '3-social': ['Affiliation, Attraction, and Intimacy'],
  '3-cultural': ['Cross-Cultural Issues – Identity Development Models'],
  '4': ['Cognitive Development'],
  '5-assessment': ['Clinical Tests'],
  '5-diagnosis': ['Anxiety Disorders and Obsessive-Compulsive Disorder'],
  '5-test': ['Item Analysis and Test Reliability'],
  '6': ['Cognitive-Behavioral Therapies'],
  '7': ['Correlation and Regression'],
  '8': ['APA Ethics Code Over and Standards 1 & 2'],
  '3-5-6': ['Satisfaction, Commitment, and Stress'],
}

// Display order only (does NOT change stable topic IDs like "2-0", "2-1", etc.)
const TOPIC_DISPLAY_ORDER_OVERRIDES: Record<string, string[]> = {
  '1': [
    'Nervous System, Neurons, and Neurotransmitters',
    'Brain Regions/Functions – Hindbrain, Midbrain, and Subcortical Forebrain…',
    'Brain Regions/Functions – Cerebral Cortex',
    'Sensation and Perception',
    'Memory and Sleep',
    'Emotions and Stress',
    'Neurological and Endocrine Disorders',
    'Psychopharmacology – Antipsychotics and Antidepressants',
    'Psychopharmacology – Other Psychoactive Drugs',
  ],
  '2': [
    'Classical Conditioning',
    'Interventions Based on Classical Conditioning',
    'Operant Conditioning',
    'Interventions Based on Operant Conditioning',
    'Memory and Forgetting',
  ],
  '3-social': [
    'Social Cognition – Errors, Biases, and Heuristics',
    'Social Cognition – Causal Attributions',
    'Attitudes and Attitude Change',
    'Persuasion',
    'Social Influence – Types of Influence',
    'Social Influence – Group Influences',
    'Prosocial Behavior and Prejudice/Discrimination',
    'Affiliation, Attraction, and Intimacy',
  ],
  '3-cultural': [
    'Cross-Cultural Issues – Terms and Concepts',
    'Cross-Cultural Issues – Identity Development Models',
  ],
  '4': [
    'Early Influences on Development – Prenatal Development',
    'Early Influences on Development – Nature vs. Nurture',
    'Physical Development',
    'Cognitive Development',
    'Language Development',
    'Socioemotional Development – Attachment, Emotions, and Social Relationships',
    'Socioemotional Development – Temperament and Personality',
    'Socioemotional Development – Moral Development',
    'School and Family Influences',
  ],
  '5-assessment': [
    'Clinical Tests',
    'Stanford-Binet and Wechsler Tests',
    'Other Measures of Cognitive Ability',
    'MMPI-2',
    'Other Measures of Personality',
    'Interest Inventories',
  ],
  '5-test': [
    'Item Analysis and Test Reliability',
    'Test Validity – Content and Construct Validity',
    'Test Validity – Criterion-Related Validity',
    'Test Score Interpretation',
  ],
  '6': [
    'Brief Therapies',
    'Cognitive-Behavioral Therapies',
    'Psychodynamic and Humanistic Therapies',
    'Family Therapies and Group Therapies',
    'Prevention, Consultation, and Psychotherapy Research',
  ],
  '7': [
    'Types of Variables and Data',
    'Research – Single-Subject and Group Designs',
    'Research – Internal/External Validity',
    'Overview of Inferential Statistics',
    'Inferential Statistical Tests',
    'Correlation and Regression',
  ],
  '3-5-6': [
    'Organizational Theories',
    'Theories of Motivation',
    'Satisfaction, Commitment, and Stress',
    'Organizational Leadership',
    'Organizational Decision-Making',
    'Organizational Change and Development',
    'Job Analysis and Performance Assessment',
    'Employee Selection – Techniques',
    'Employee Selection – Evaluation of Techniques',
    'Training Methods and Evaluation',
    'Career Choice and Development',
  ],
}

function sortTopicsForDisplay<T extends { name: string; sortIndex: number }>(
  domainId: string,
  topics: T[]
): T[] {
  const override = TOPIC_DISPLAY_ORDER_OVERRIDES[domainId]
  if (!override) return topics

  const rankByName = new Map<string, number>(override.map((name, index) => [name, index]))
  const ranked = [...topics]
  ranked.sort((a, b) => {
    const aRank = rankByName.get(a.name)
    const bRank = rankByName.get(b.name)

    if (aRank === undefined && bRank === undefined) return a.sortIndex - b.sortIndex
    if (aRank === undefined) return 1
    if (bRank === undefined) return -1
    return aRank - bRank
  })

  return ranked
}

interface RecentActivity {
  topic: string
  timestamp: number
  score: number
}

const parseInterestList = (interest: string | null) =>
  interest
    ? interest
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : []

const INTEREST_TAG_PALETTE = [
  { backgroundColor: '#bdd1ca', borderColor: '#bdd1ca', textColor: '#1a2b24' },
  { backgroundColor: '#788c5d', borderColor: '#788c5d', textColor: '#ffffff' },
  { backgroundColor: '#d87758', borderColor: '#d87758', textColor: '#ffffff' },
  { backgroundColor: '#c46685', borderColor: '#c46685', textColor: '#ffffff' },
  { backgroundColor: '#6a9bcc', borderColor: '#6a9bcc', textColor: '#ffffff' },
  { backgroundColor: '#cbc9db', borderColor: '#cbc9db', textColor: '#1b1a1f' },
]

const getInterestTagStyle = (index: number) =>
  INTEREST_TAG_PALETTE[index % INTEREST_TAG_PALETTE.length]

const getRecentScoreColor = (score: number) => {
  if (score >= QUIZ_PASS_PERCENT) return 'text-[#788c5d]' // Olive - strong/ready
  if (score >= 40) return 'text-[#bdd1ca]' // Soft Sage - okay but needs refinement
  return 'text-[#d87758]' // Coral - needs attention
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
  const { user, userProfile } = useAuth()
  const subscriptionTier = userProfile?.subscription_tier
  const isFreeTier = subscriptionTier === 'free' || !subscriptionTier
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState<string>('')
  const [savedInterests, setSavedInterests] = useState<string[]>([])
  const [languagePreference, setLanguagePreference] = useState<string | null>(null)
  const [languageInput, setLanguageInput] = useState<string>('')
  const [domains, setDomains] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [priorityTopicIds, setPriorityTopicIds] = useState<string[]>([])
  const [recommendedDomainIds, setRecommendedDomainIds] = useState<string[]>([])
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const languageSubscriptionRef = useRef<RealtimeChannel | null>(null)
  const studyStats = calculateStudyStats()

  const normalizeLanguageInput = (raw: string): string | null => {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const lower = trimmed.toLowerCase()
    if (lower === 'english' || lower === 'en' || lower === 'eng') return null
    return trimmed
  }

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
      const current = topicScores[result.topic] ?? 0
      topicScores[result.topic] = Math.max(current, percentage)
    })

    const mapDomainNumberToIds = (domainNumber?: number | null) => {
      if (!domainNumber) return []
      return EPPP_DOMAINS.filter((domain) => {
        if (domain.id === '3-5-6') return false
        const [prefix] = domain.id.split('-')
        return parseInt(prefix, 10) === domainNumber
      }).map((domain) => domain.id)
    }

    const derivePriorityState = (topDomains: any[] | null | undefined) => {
      const topicSet = new Set<string>()
      const domainSet = new Set<string>()

      const addDomainFromTopicId = (topicId: string) => {
        if (!topicId) return
        const parts = topicId.split('-')
        if (parts.length > 1) {
          const domainId = parts.slice(0, parts.length - 1).join('-')
          if (domainId) {
            domainSet.add(domainId)
          }
        }
      }

      ;(topDomains || []).forEach((domain) => {
        const recommendedTopicIds: string[] = Array.isArray(domain?.recommendedTopicIds)
          ? domain.recommendedTopicIds
          : []

        recommendedTopicIds.forEach((id) => {
          topicSet.add(id)
          addDomainFromTopicId(id)
        })

        if (domain?.type === 'org_psych') {
          domainSet.add('3-5-6')
          return
        }

        if (recommendedTopicIds.length === 0) {
          const fallbackDomainIds = mapDomainNumberToIds(domain?.domainNumber)
          if (fallbackDomainIds.length > 0) {
            domainSet.add(fallbackDomainIds[0])
          }
        }
      })

      return {
        topicIds: Array.from(topicSet),
        domainIds: Array.from(domainSet),
      }
    }

    const applyLocalPriorityFallback = () => {
      const { diagnostic, practice } = getAllLatestRecommendations()
      const available = [diagnostic, practice].filter(Boolean) as Array<{
        timestamp: number
        topPriorities: any[]
      }>

      if (available.length === 0) {
        const localDiagnostic = getTopPriorities('diagnostic')
        if (localDiagnostic && localDiagnostic.length > 0) {
          const state = derivePriorityState(localDiagnostic)
          setPriorityTopicIds(state.topicIds)
          setRecommendedDomainIds(state.domainIds)
        } else {
          setPriorityTopicIds([])
          setRecommendedDomainIds([])
        }
        return
      }

      available.sort((a, b) => b.timestamp - a.timestamp)
      const latest = available[0]
      const state = derivePriorityState(latest.topPriorities || [])
      setPriorityTopicIds(state.topicIds)
      setRecommendedDomainIds(state.domainIds)
    }

    // Load priority recommendations from Supabase
    const loadPriorities = async () => {
      if (!user) {
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
          const state = derivePriorityState(data.top_domains || [])
          setPriorityTopicIds(state.topicIds)
          setRecommendedDomainIds(state.domainIds)
        } else {
          applyLocalPriorityFallback()
        }
      } catch (err) {
        console.error('Failed to load priorities from Supabase:', err)
        applyLocalPriorityFallback()
      }
    }

    loadPriorities()

    // Build domains with dynamic progress
    const domainsWithProgress = EPPP_DOMAINS.map((domain) => {
      const topicsWithProgress = domain.topics.map((topic, topicIndex) => {
        // If quiz exists, show actual score; otherwise show 0%
        const score = topicScores[topic.name] ?? 0
        return {
          id: `${domain.id}-${topicIndex}`,
          name: topic.name,
          progress: Math.round(score),
          isCompleted: score >= QUIZ_PASS_PERCENT,
          sortIndex: topicIndex,
        }
      })

      const sortedTopics = sortTopicsForDisplay(domain.id, topicsWithProgress)

      // Calculate domain progress as average of all topics
      const avgProgress = sortedTopics.length > 0
        ? Math.round(sortedTopics.reduce((sum, t) => sum + t.progress, 0) / sortedTopics.length)
        : 0

      return {
        id: domain.id,
        name: domain.name,
        progress: avgProgress,
        topics: sortedTopics,
      }
    })

    setDomains(domainsWithProgress)
  }, [])

  // Load previously saved interests so topic-selector mirrors topic-teacher
  useEffect(() => {
    let isMounted = true

    const loadInterests = async () => {
      if (!user?.id) {
        if (isMounted) {
          setSavedInterests([])
          setCurrentInput('')
        }
        return
      }

      try {
        let currentInterest = await getUserCurrentInterest(user.id)

        if (!currentInterest && typeof window !== 'undefined') {
          currentInterest = localStorage.getItem(`interests_${user.id}`)
        }

        if (!isMounted) return

        if (currentInterest) {
          setSavedInterests(parseInterestList(currentInterest))
          if (typeof window !== 'undefined') {
            localStorage.setItem(`interests_${user.id}`, currentInterest)
          }
        } else {
          setSavedInterests([])
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`interests_${user.id}`)
          }
        }

        setCurrentInput('')
      } catch (error) {
        console.debug('Failed to load interests for topic selector:', error)
      }
    }

    loadInterests()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Load preferred language so topic-selector stays in sync with topic-teacher
  useEffect(() => {
    let isMounted = true

    const loadLanguagePreference = async () => {
      if (!user?.id) {
        if (isMounted) {
          setLanguagePreference(null)
          setLanguageInput('')
        }
        return
      }

      try {
        let currentLanguage = await getUserLanguagePreference(user.id)

        if (currentLanguage == null && typeof window !== 'undefined') {
          currentLanguage = localStorage.getItem(`language_pref_${user.id}`)
        }

        if (!isMounted) return

        if (currentLanguage && currentLanguage.trim().length > 0) {
          setLanguagePreference(currentLanguage)
          if (typeof window !== 'undefined') {
            localStorage.setItem(`language_pref_${user.id}`, currentLanguage)
          }
        } else {
          setLanguagePreference(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`language_pref_${user.id}`)
          }
        }

        setLanguageInput('')
      } catch (error) {
        console.debug('Failed to load language preference for topic selector:', error)
      }
    }

    loadLanguagePreference()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Subscribe to interest changes from topic-teacher
  useEffect(() => {
    if (user?.id) {
      const channel = subscribeToUserInterestChanges(user.id, (newInterest) => {
        const interestsList = parseInterestList(newInterest)
        setSavedInterests(interestsList)
        setCurrentInput('')

        if (typeof window !== 'undefined') {
          if (newInterest && newInterest.trim().length > 0) {
            localStorage.setItem(`interests_${user.id}`, newInterest)
          } else {
            localStorage.removeItem(`interests_${user.id}`)
          }
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

  // Subscribe to language preference changes from topic-teacher (and other sessions)
  useEffect(() => {
    if (user?.id) {
      const channel = subscribeToUserLanguagePreferenceChanges(user.id, (newLanguage) => {
        setLanguagePreference(newLanguage)
        setLanguageInput('')

        if (typeof window !== 'undefined') {
          if (newLanguage && newLanguage.trim().length > 0) {
            localStorage.setItem(`language_pref_${user.id}`, newLanguage)
          } else {
            localStorage.removeItem(`language_pref_${user.id}`)
          }
        }
      })

      languageSubscriptionRef.current = channel
    }

    return () => {
      if (languageSubscriptionRef.current) {
        unsubscribeFromLanguagePreferenceChanges(languageSubscriptionRef.current)
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
        const updatedInterests = [...savedInterests, newInterest]
        setSavedInterests(updatedInterests)
        setCurrentInput('')

        const interestsString = updatedInterests.join(', ')

        if (typeof window !== 'undefined') {
          localStorage.setItem(`interests_${user.id}`, interestsString)
        }

        await updateUserCurrentInterest(user.id, interestsString)
      } catch (error) {
        console.debug('Failed to save interest:', error)
      }
    }
  }

  const removeInterest = async (index: number) => {
    const newInterests = savedInterests.filter((_, i) => i !== index)
    setSavedInterests(newInterests)

    if (user?.id && typeof window !== 'undefined') {
      if (newInterests.length > 0) {
        localStorage.setItem(`interests_${user.id}`, newInterests.join(', '))
      } else {
        localStorage.removeItem(`interests_${user.id}`)
      }
    }

    if (user?.id) {
      await updateUserCurrentInterest(user.id, newInterests.join(', '))
    }
  }

  const saveLanguagePreference = async () => {
    if (!user?.id) return
    const normalizedLanguage = normalizeLanguageInput(languageInput)

    setLanguagePreference(normalizedLanguage)
    setLanguageInput('')

    try {
      await updateUserLanguagePreference(user.id, normalizedLanguage ?? '')

      if (typeof window !== 'undefined') {
        if (normalizedLanguage) {
          localStorage.setItem(`language_pref_${user.id}`, normalizedLanguage)
        } else {
          localStorage.removeItem(`language_pref_${user.id}`)
        }
      }
    } catch (error) {
      console.debug('Failed to save language preference:', error)
    }
  }

  const clearLanguagePreference = async () => {
    if (!user?.id) return

    setLanguagePreference(null)
    setLanguageInput('')

    try {
      await updateUserLanguagePreference(user.id, '')
    } catch (error) {
      console.debug('Failed to clear language preference:', error)
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`language_pref_${user.id}`)
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
                <BreadcrumbPage>Lessons</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Lessons</h1>
              <p className="text-sm text-muted-foreground">
                Select a lesson to start studying
              </p>
            </div>

            {isFreeTier && (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-1">You’re on the free plan.</p>
                <p className="text-muted-foreground">
                  You have access to one curated lesson in each domain. Upgrade to Pro to unlock all lessons and advanced tools.
                </p>
              </div>
            )}

            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 p-2 pl-3 border border-input rounded-md bg-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  {/* Display saved interests as tags */}
                  {savedInterests.map((interest, index) => {
                    const tagStyle = getInterestTagStyle(index)
                    return (
                      <motion.div
                        key={interest + index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 px-3 py-1 text-sm font-semibold transition-colors"
                          style={{
                            backgroundColor: tagStyle.backgroundColor,
                            borderColor: tagStyle.borderColor,
                            color: tagStyle.textColor,
                          }}
                        >
                          <span className="whitespace-nowrap">{interest}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeInterest(index)
                            }}
                            aria-label={`Remove interest ${interest}`}
                            className="ml-2 flex h-4 w-4 items-center justify-center rounded-full border border-transparent bg-white/20 text-current transition-colors hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      </motion.div>
                    )
                  })}

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

            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 p-2 pl-3 border border-input rounded-md bg-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  {languagePreference && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 px-3 py-1 text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: '#cbc9db',
                        borderColor: '#cbc9db',
                        color: '#1b1a1f',
                      }}
                    >
                      <span className="whitespace-nowrap">{languagePreference}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          clearLanguagePreference()
                        }}
                        aria-label={`Remove preferred language ${languagePreference}`}
                        className="ml-2 flex h-4 w-4 items-center justify-center rounded-full border border-transparent bg-black/10 text-current transition-colors hover:bg-black/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  )}

                  {!languagePreference && (
                    <input
                      type="text"
                      placeholder="Preferred language (e.g., Spanish)..."
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          saveLanguagePreference()
                        }
                      }}
                      className="flex-1 min-w-[200px] bg-transparent outline-none text-sm"
                    />
                  )}

                  {!languagePreference && languageInput.trim().length > 0 && (
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
                    const scoreColor = getRecentScoreColor(activity.score)
                    const lessonName = getLessonDisplayName(activity.topic)

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
                                {lessonName}
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
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{domain.name}</h3>
                        {recommendedDomainIds.includes(domain.id) && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                            style={{
                              backgroundColor: '#d87758',
                              borderColor: '#d87758',
                              color: '#ffffff',
                            }}
                          >
                            <BadgeCheck className="h-3 w-3" />
                            Recommended
                          </Badge>
                        )}
                      </div>
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
                        const isFreeTopic =
                          !isFreeTier ||
                          (FREE_TOPICS_BY_DOMAIN[domain.id]?.includes(topic.name) ?? false)
                        const lessonName = getLessonDisplayName(topic.name)

                        if (isFreeTopic) {
                          return (
                            <Link
                              key={topic.name}
                              href={`/topic-teacher?domain=${domain.id}&topic=${encodeURIComponent(topic.name)}`}
                              className="block hover:opacity-75 transition-opacity"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-sm">{lessonName}</span>
                                  {topic.isCompleted && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs flex items-center gap-1"
                                      style={{ backgroundColor: '#bdd1ca20', color: '#788c5d', borderColor: '#bdd1ca' }}
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Completed
                                    </Badge>
                                  )}
                                  {isPriority && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs flex items-center gap-1"
                                      style={{ backgroundColor: '#cbc9db20', color: '#cbc9db', borderColor: '#cbc9db' }}
                                    >
                                      <AlertCircle className="w-3 h-3" />
                                      Focus
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {topic.progress}%
                                </span>
                              </div>
                              <Progress value={topic.progress} className="h-1.5" />
                            </Link>
                          )
                        }

                        // Locked (Pro-only) topic for free tier
                        return (
                          <div
                            key={topic.name}
                            className="block opacity-70 cursor-not-allowed"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm">{lessonName}</span>
                                {topic.isCompleted && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs flex items-center gap-1"
                                    style={{ backgroundColor: '#bdd1ca20', color: '#788c5d', borderColor: '#bdd1ca' }}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Completed
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase tracking-wide"
                                >
                                  Pro
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {topic.progress}%
                              </span>
                            </div>
                            <Progress value={topic.progress} className="h-1.5" />
                          </div>
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
