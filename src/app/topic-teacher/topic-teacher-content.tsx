'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimplePromptInput } from '@/components/ui/simple-prompt-input'
import { TypographyH1, TypographyH2, TypographyH3, TypographyMuted } from '@/components/ui/typography'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Kbd } from '@/components/ui/kbd'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getUserCurrentInterest, updateUserCurrentInterest, subscribeToUserInterestChanges, unsubscribeFromInterestChanges } from '@/lib/interests'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '@/context/auth-context'
import { getQuizResults } from '@/lib/quiz-results-storage'
import { PulseSpinner } from '@/components/PulseSpinner'
import Lottie from 'lottie-react'
import textLoadingAnimation from '@/../../public/animations/text-loading.json'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface HighlightData {
  recentlyWrongSections: string[]
  recentlyCorrectSections: string[]
  previouslyWrongNowCorrectSections: string[]
}

const GENERIC_SECTION_NAMES = new Set([
  'main content',
  'main concept',
  'sub-concept',
  'general overview',
  'overview',
  'topic overview',
  'topic summary',
  'full topic',
  'entire topic',
  'core content',
  'whole topic',
  'entire section',
  'lesson overview',
])

export function TopicTeacherContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const domain = searchParams.get('domain')
  const topic = searchParams.get('topic')
  const hasExamResults = searchParams.get('hasExamResults') === 'true'
  const decodeParam = (value: string | null): string => {
    if (!value) return ''
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }
  const decodedTopic = decodeParam(topic)
  const normalizedTopicName = decodedTopic ? decodedTopic.trim().toLowerCase() : ''

  const normalizeSectionName = (section?: string | null): string | null => {
    if (!section) return null
    const trimmed = section.trim()
    if (!trimmed) return null
    const normalized = trimmed.toLowerCase()

    // Treat only truly generic labels as "whole topic"
    if (GENERIC_SECTION_NAMES.has(normalized)) {
      return '__ALL__'
    }

    return trimmed
  }

  const normalizeSections = (
    sections?: string[],
    options: { allowAll?: boolean } = {}
  ): string[] => {
    const { allowAll = true } = options
    if (!sections || sections.length === 0) return []

    const normalized = sections
      .map((section) => normalizeSectionName(section))
      .filter((section): section is string => Boolean(section))

    if (!allowAll) {
      return normalized.filter((section) => section !== '__ALL__')
    }

    if (normalized.includes('__ALL__')) {
      return ['__ALL__']
    }

    return normalized
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshingMetaphors, setIsRefreshingMetaphors] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [showInterestsModal, setShowInterestsModal] = useState(false)
  const [interestsInput, setInterestsInput] = useState('')
  const [currentInterestInput, setCurrentInterestInput] = useState('')
  const [savedInterests, setSavedInterests] = useState<string[]>([])
  const [userInterests, setUserInterests] = useState<string | null>(null)
  const [previousUserInterests, setPreviousUserInterests] = useState<string | null>(null)
  const [interestsLoaded, setInterestsLoaded] = useState(false)
  const [baseContent, setBaseContent] = useState<string>('')
  const [personalizedCache, setPersonalizedCache] = useState<Record<string, string>>({})
  const [highlightData, setHighlightData] = useState<HighlightData>({
    recentlyWrongSections: [],
    recentlyCorrectSections: [],
    previouslyWrongNowCorrectSections: [],
  })
  const [recentQuizWrongSections, setRecentQuizWrongSections] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentSectionRef = useRef<string>('')
  const subscriptionRef = useRef<RealtimeChannel | null>(null)

  // Disabled auto-scroll - keep at top of page
  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }

  // useEffect(() => {
  //   scrollToBottom()
  // }, [messages])

  // Check for user interests on mount and subscribe to changes
  useEffect(() => {
    const loadUserInterest = async () => {
      if (!user?.id) {
        setShowInterestsModal(true)
        setInterestsLoaded(true)
        return
      }

      try {
        let currentInterest = await getUserCurrentInterest(user.id)

        // Fallback to localStorage if Supabase returns nothing
        if (!currentInterest && typeof window !== 'undefined') {
          currentInterest = localStorage.getItem(`interests_${user.id}`)
        }

        setUserInterests(currentInterest)

        // If user already has an interest, pre-populate the inputs
        if (currentInterest) {
          setInterestsInput(currentInterest)
          // Parse and display as saved interests
          const interestsList = currentInterest
            .split(',')
            .map((i) => i.trim())
            .filter((i) => i.length > 0)
          setSavedInterests(interestsList)
          setCurrentInterestInput('')
        } else {
          // Only show modal if user hasn't filled out interests yet
          setShowInterestsModal(true)
        }

        // Subscribe to real-time interest changes
        const channel = subscribeToUserInterestChanges(user.id, (newInterest) => {
          setUserInterests(newInterest)
          if (newInterest) {
            setInterestsInput(newInterest)
            // Also update localStorage and saved interests display
            if (typeof window !== 'undefined') {
              localStorage.setItem(`interests_${user.id}`, newInterest)
            }
            const interestsList = newInterest
              .split(',')
              .map((i) => i.trim())
              .filter((i) => i.length > 0)
            setSavedInterests(interestsList)
            setCurrentInterestInput('')
          }
        })
        subscriptionRef.current = channel
      } catch (error) {
        console.debug('Error loading user interest:', error)
        setShowInterestsModal(true)
      } finally {
        // Mark interests as loaded regardless of outcome
        setInterestsLoaded(true)
      }
    }

    loadUserInterest()

    // Clean up subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromInterestChanges(subscriptionRef.current)
      }
    }
  }, [user?.id])

  useEffect(() => {
    const param = searchParams.get('recentQuizWrongSections')
    if (!param) {
      setRecentQuizWrongSections([])
      return
    }

    try {
      const decoded = JSON.parse(decodeURIComponent(param))
      if (Array.isArray(decoded)) {
        setRecentQuizWrongSections(decoded)
      } else if (typeof decoded === 'string') {
        setRecentQuizWrongSections([decoded])
      } else {
        setRecentQuizWrongSections([])
      }
    } catch (error) {
      console.warn('[Topic Teacher] Failed to parse recent quiz sections', error)
      setRecentQuizWrongSections([])
    }
  }, [searchParams])

  // Load quiz/exam results and compute highlight data
  useEffect(() => {
    if (decodedTopic) {
      let allWrongSections: string[] = []
      let allCorrectSections: string[] = []
      let allPreviouslyWrongNowCorrect: string[] = []
      let hasAnyResults = false

      // Always check for quiz results
      const quizResults = getQuizResults(decodedTopic)
      if (quizResults && quizResults.wrongAnswers && quizResults.wrongAnswers.length > 0) {
        const quizWrongSections = normalizeSections(
          quizResults.wrongAnswers.flatMap((wa) => wa.relatedSections || []),
          { allowAll: true }
        )
        const quizCorrectSections = normalizeSections(
          quizResults.correctAnswers
            .filter((ca) => !(ca as any).wasPreviouslyWrong)
            .flatMap((ca) => ca.relatedSections || []),
          { allowAll: false }
        )
        const quizPreviouslyWrongNowCorrect = normalizeSections(
          quizResults.correctAnswers
            .filter((ca) => (ca as any).wasPreviouslyWrong)
            .flatMap((ca) => ca.relatedSections || []),
          { allowAll: false }
        )

        if (quizWrongSections.length > 0) {
          allWrongSections = [...allWrongSections, ...quizWrongSections]
          hasAnyResults = true
        }

        if (quizCorrectSections.length > 0) {
          allCorrectSections = [...allCorrectSections, ...quizCorrectSections]
        }

        if (quizPreviouslyWrongNowCorrect.length > 0) {
          allPreviouslyWrongNowCorrect = [
            ...allPreviouslyWrongNowCorrect,
            ...quizPreviouslyWrongNowCorrect,
          ]
        }
      }

      // Always check for exam results (from diagnostic/practice exams)
      const { getExamWrongSections } = require('@/lib/unified-question-results')
      const examWrongSections = normalizeSections(
        getExamWrongSections(decodedTopic),
        { allowAll: true }
      )
      if (examWrongSections.length > 0) {
        allWrongSections = [...allWrongSections, ...examWrongSections]
        hasAnyResults = true
      }

      // If this topic was reached from exam-based recommendations but
      // we don't have granular section data, treat the whole topic as
      // needing review so the content is highlighted.
      if (hasExamResults && !hasAnyResults) {
        setHighlightData({
          recentlyWrongSections: ['__ALL__'],
          recentlyCorrectSections: [],
          previouslyWrongNowCorrectSections: [],
        })
        return
      }

      // Set highlight data with combined results
      if (hasAnyResults && allWrongSections.length > 0) {
        let dedupedWrong = [...new Set(allWrongSections)]
        if (dedupedWrong.includes('__ALL__')) {
          dedupedWrong = ['__ALL__']
        }

        setHighlightData({
          recentlyWrongSections: dedupedWrong,
          recentlyCorrectSections: [...new Set(allCorrectSections)],
          previouslyWrongNowCorrectSections: [
            ...new Set(allPreviouslyWrongNowCorrect),
          ],
        })
      }
    }
  }, [decodedTopic, hasExamResults])

  // Initialize with lesson
  useEffect(() => {
    if (!initialized && topic && interestsLoaded) {
      initializeLesson()
    }
  }, [topic, initialized, interestsLoaded])

  // Watch for interest changes and refresh metaphors
  useEffect(() => {
    if (!initialized || !interestsLoaded) return

    // Check if interests actually changed
    const currentInterestsStr = savedInterests.length > 0 ? savedInterests.join(', ') : null

    if (currentInterestsStr !== previousUserInterests) {
      // Interests changed - refresh metaphors
      if (currentInterestsStr) {
        console.log('Interests changed, refreshing metaphors:', currentInterestsStr)
        refreshMetaphors(currentInterestsStr)
      } else {
        // User removed all interests - show base content
        if (baseContent && messages.length > 0) {
          setMessages([
            {
              role: 'assistant',
              content: baseContent,
            },
          ])
          setPreviousUserInterests(null)
        }
      }
    }
  }, [savedInterests, initialized, interestsLoaded])

  const initializeLesson = async () => {
    if (!topic) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/topic-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          domain,
          messageHistory: [],
          isInitial: true,
          userInterests,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        throw new Error(`API Error (${response.status}): ${errorText || 'Unknown error'}`)
      }

      // Extract base content from response headers
      const baseContentHeader = response.headers.get('X-Base-Content')
      if (baseContentHeader) {
        try {
          // Decode from base64
          const decodedBaseContent = atob(baseContentHeader)
          setBaseContent(decodedBaseContent)
          console.log('[Topic Teacher] ✅ Stored base content from API headers')
        } catch (error) {
          console.warn('[Topic Teacher] Failed to decode base content from headers:', error)
        }
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      let lessonContent = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const text = decoder.decode(value)
        lessonContent += text
      }

      if (!lessonContent) {
        throw new Error('No lesson content received from API')
      }

      setMessages([
        {
          role: 'assistant',
          content: lessonContent,
        },
      ])
      setInitialized(true)
      setPreviousUserInterests(userInterests)
    } catch (err) {
      console.error('Error loading lesson:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load lesson'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh metaphors when interests change (after initial load)
  const refreshMetaphors = async (newInterests: string) => {
    if (!topic || !initialized) return

    // Create cache key from topic + interests
    const cacheKey = `${topic}__${newInterests}`

    // Check cache first
    if (personalizedCache[cacheKey]) {
      console.log('[Topic Teacher] ⚡ Using cached personalized content for:', newInterests)
      setMessages([
        {
          role: 'assistant',
          content: personalizedCache[cacheKey],
        },
      ])
      setPreviousUserInterests(newInterests)
      return
    }

    try {
      setIsRefreshingMetaphors(true)
      setError(null)

      // First, show base content with loading placeholder immediately
      const contentWithPlaceholder = baseContent + '\n\n[LOADING_METAPHORS]'
      setMessages([
        {
          role: 'assistant',
          content: contentWithPlaceholder,
        },
      ])

      console.log('[Topic Teacher] 🔄 Generating personalized metaphors for:', newInterests)
      const startTime = Date.now()

      const response = await fetch('/api/topic-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          domain,
          messageHistory: [],
          isInitial: true,
          userInterests: newInterests,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh metaphors')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      let lessonContent = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value} = await reader.read()

        if (done) break

        const text = decoder.decode(value)
        lessonContent += text
      }

      const duration = Date.now() - startTime
      console.log(`[Topic Teacher] ✅ Personalization complete in ${duration}ms`)

      // Cache the personalized content
      setPersonalizedCache(prev => ({
        ...prev,
        [cacheKey]: lessonContent
      }))

      // Update the lesson content with new metaphors
      setMessages([
        {
          role: 'assistant',
          content: lessonContent,
        },
      ])
      setPreviousUserInterests(newInterests)
    } catch (err) {
      console.error('Error refreshing metaphors:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to refresh metaphors'
      )
    } finally {
      setIsRefreshingMetaphors(false)
    }
  }

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading || !topic) return

    // Add user message immediately
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/topic-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          domain,
          messageHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userMessage,
          isInitial: false,
          userInterests,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      let assistantMessage = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const text = decoder.decode(value)
        assistantMessage += text
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMessage },
      ])
    } catch (err) {
      console.error('Error sending message:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to send message'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const normalizeLabel = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const labelsMatch = (headerText: string, sectionName: string): boolean => {
    const h = normalizeLabel(headerText)
    const s = normalizeLabel(sectionName)
    if (!h || !s) return false

    if (h === s) return true
    if (h.startsWith(s) || s.startsWith(h)) return true

    return false
  }

  const getHighlightType = (text: string): 'recently-wrong' | 'previously-wrong-now-correct' | 'recently-correct' | null => {
    if (
      highlightData.recentlyWrongSections.length === 0 &&
      highlightData.previouslyWrongNowCorrectSections.length === 0 &&
      highlightData.recentlyCorrectSections.length === 0
    ) {
      return null
    }

    if (!text || text.trim().length === 0) {
      return null
    }

    // Special case: mark all sections as recently wrong for exam-derived topics
    if (highlightData.recentlyWrongSections.includes('__ALL__')) {
      return 'recently-wrong'
    }

    // Check if this header matches recently wrong sections
    for (const section of highlightData.recentlyWrongSections) {
      if (labelsMatch(text, section)) {
        return 'recently-wrong'
      }
    }

    // Check if this header matches previously wrong, now correct
    for (const section of highlightData.previouslyWrongNowCorrectSections) {
      if (labelsMatch(text, section)) {
        return 'previously-wrong-now-correct'
      }
    }

    // Check if this header matches recently correct
    for (const section of highlightData.recentlyCorrectSections) {
      if (labelsMatch(text, section)) {
        return 'recently-correct'
      }
    }

    return null
  }

  if (!topic) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/topic-selector">Topics</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Topic Teacher</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">No topic selected</h1>
            <p className="text-muted-foreground mb-6">
              Please select a topic from Topics
            </p>
            <Link href="/topic-selector">
              <Button>Go to Topics</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full mx-auto p-6 max-w-4xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/topic-selector">Topics</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{decodeURIComponent(topic)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6">
          <TypographyH1>{decodeURIComponent(topic)}</TypographyH1>
        </div>

        {/* Interest Tags Input */}
        <div className="mb-6 max-w-2xl">
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
                    onClick={() => {
                      const newInterests = savedInterests.filter((_, i) => i !== index)
                      setSavedInterests(newInterests)
                      if (user?.id) {
                        if (newInterests.length > 0) {
                          updateUserCurrentInterest(user.id, newInterests.join(', '))
                        }
                      }
                    }}
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
                placeholder={savedInterests.length === 0 ? "Add your interests/hobbies/fandoms..." : "Add another interest..."}
                value={currentInterestInput}
                onChange={(e) => setCurrentInterestInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentInterestInput.trim() && user?.id) {
                    e.preventDefault()
                    const newInterest = currentInterestInput.trim()
                    const updatedInterests = [...savedInterests, newInterest]
                    setSavedInterests(updatedInterests)
                    setCurrentInterestInput('')
                    updateUserCurrentInterest(user.id, updatedInterests.join(', '))
                  }
                }}
                className="flex-1 min-w-[200px] bg-transparent outline-none text-sm"
              />

              {/* Enter key indicator */}
              {currentInterestInput.trim().length > 0 && (
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

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  onClick={initializeLesson}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {highlightData.recentlyWrongSections.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <p className="text-sm text-foreground/80">
              🍏 Most recent practice exam
              {!highlightData.recentlyWrongSections.includes('__ALL__') && highlightData.recentlyWrongSections.length > 0
                ? `: ${highlightData.recentlyWrongSections.join(', ')}`
                : ''}
            </p>
          </motion.div>
        )}
        {recentQuizWrongSections.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <p className="text-sm text-foreground/80">
              🍎 Most recent quiz
            </p>
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6 rounded-lg p-4">
          {messages.length === 0 && !initialized && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground animate-pulse">
                  Loading your lesson...
                </p>
              </div>
            </div>
          )}

          {messages.map((message, idx) => {
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  message.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground max-w-2xl'
                      : 'text-foreground w-full'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="text-base leading-relaxed max-w-none prose prose-invert
                      [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1:not(:first-child)]:mt-12 [&_h1:not(:first-child)]:mb-6
                      [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-snug [&_h2:not(:first-child)]:mb-4 [&_h2:not(:first-child)]:border-t [&_h2:not(:first-child)]:border-border/20 [&_h2:not(:first-child)]:pt-8 [&_h2:not(:first-child)]:mt-0
                      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-snug [&_h3:not(:first-child)]:mt-7 [&_h3:not(:first-child)]:mb-3
                      [&_p]:my-4 [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-foreground/90
                      [&_ul]:my-5 [&_ul]:ml-5 [&_ul>li]:my-2.5 [&_ul>li]:text-base [&_ul>li]:leading-relaxed
                      [&_ol]:my-5 [&_ol]:ml-5 [&_ol>li]:my-2.5 [&_ol>li]:text-base [&_ol>li]:leading-relaxed
                      [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary/80 [&_a:hover]:no-underline
                      [&_hr]:my-8 [&_hr]:border-border/30
                      [&_img]:rounded-lg [&_img]:my-6 [&_img]:shadow-md
                      [&_code]:bg-secondary/50 [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                      [&_pre]:bg-secondary/30 [&_pre]:border [&_pre]:border-border/50 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-5 [&_pre_code]:bg-transparent [&_pre_code]:text-foreground
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-5 [&_blockquote]:text-foreground/80
                      [&_table]:w-full [&_table]:border-collapse [&_table]:my-5 [&_table]:text-sm
                      [&_th]:border [&_th]:border-border [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground
                      [&_td]:border [&_td]:border-border [&_td]:p-3 [&_td]:text-foreground/90">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => {
                            // Check if this paragraph contains the loading placeholder
                            const text = typeof children === 'string' ? children :
                              Array.isArray(children) ? children.join('') : String(children)

                            if (text.includes('[LOADING_METAPHORS]')) {
                              return (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                  <div className="w-24 h-24">
                                    <Lottie animationData={textLoadingAnimation} loop={true} />
                                  </div>
                                  <p className="text-sm text-muted-foreground">Personalizing metaphors for your interests...</p>
                                </div>
                              )
                            }
                            return <p>{children}</p>
                          },
                          h1: ({ children }) => {
                            let text = ''
                            if (typeof children === 'string') {
                              text = children
                            } else if (Array.isArray(children)) {
                              text = children
                                .map((c) => {
                                  if (typeof c === 'string') return c
                                  if (c?.props?.children) {
                                    if (typeof c.props.children === 'string') return c.props.children
                                    if (Array.isArray(c.props.children)) {
                                      return c.props.children.filter(x => typeof x === 'string').join('')
                                    }
                                  }
                                  return ''
                                })
                                .join('')
                            }

                            // Skip if this h1 matches the topic name (avoid duplicate)
                            const decodedTopic = topic ? decodeURIComponent(topic) : ''
                            const normalizedText = text.trim().toLowerCase()
                            const normalizedTopic = decodedTopic.trim().toLowerCase()
                            if (normalizedText === normalizedTopic) {
                              return null
                            }

                            return (
                              <TypographyH1>
                                {children}
                              </TypographyH1>
                            )
                          },
                          h2: ({ children }) => {
                            let text = ''
                            if (typeof children === 'string') {
                              text = children
                            } else if (Array.isArray(children)) {
                              text = children
                                .map((c) => {
                                  if (typeof c === 'string') return c
                                  if (c?.props?.children) {
                                    if (typeof c.props.children === 'string') return c.props.children
                                    if (Array.isArray(c.props.children)) {
                                      return c.props.children.filter(x => typeof x === 'string').join('')
                                    }
                                  }
                                  return ''
                                })
                                .join('')
                            }

                            currentSectionRef.current = text
                            return (
                              <TypographyH2>
                                {children}
                              </TypographyH2>
                            )
                          },
                          h3: ({ children }) => {
                            let text = ''
                            if (typeof children === 'string') {
                              text = children
                            } else if (Array.isArray(children)) {
                              text = children
                                .map((c) => {
                                  if (typeof c === 'string') return c
                                  if (c?.props?.children) {
                                    if (typeof c.props.children === 'string') return c.props.children
                                    if (Array.isArray(c.props.children)) {
                                      return c.props.children.filter(x => typeof x === 'string').join('')
                                    }
                                  }
                                  return ''
                                })
                                .join('')
                            }

                            currentSectionRef.current = text
                            return (
                              <TypographyH3>
                                {children}
                              </TypographyH3>
                            )
                          },
                          p: ({ children }) => {
                            const highlightType = getHighlightType(currentSectionRef.current)
                            const isRecentlyWrong = highlightType === 'recently-wrong'
                            const isRecentlyCorrect = highlightType === 'recently-correct'
                            const isRecovered = highlightType === 'previously-wrong-now-correct'

                            const showIcon = isRecentlyWrong || isRecentlyCorrect || isRecovered
                            const icon = isRecentlyWrong ? '🍎' : '🍏'

                            return (
                              <div className={`transition-colors ${showIcon ? 'relative pl-6' : ''}`}>
                                {showIcon && (
                                  <span className="absolute left-0 top-0 text-base leading-none">
                                    {icon}
                                  </span>
                                )}
                                <p className="m-0">{children}</p>
                              </div>
                            )
                          },
                          ul: ({ children }) => {
                            const highlightType = getHighlightType(currentSectionRef.current)
                            const isRecentlyWrong = highlightType === 'recently-wrong'
                            const isRecentlyCorrect = highlightType === 'recently-correct'
                            const isRecovered = highlightType === 'previously-wrong-now-correct'

                            const showIcon = isRecentlyWrong || isRecentlyCorrect || isRecovered
                            const icon = isRecentlyWrong ? '🍎' : '🍏'
                            return (
                              <div className={`transition-colors ${showIcon ? 'relative pl-6' : ''}`}>
                                {showIcon && (
                                  <span className="absolute left-0 top-0 text-base leading-none">
                                    {icon}
                                  </span>
                                )}
                                <ul>{children}</ul>
                              </div>
                            )
                          },
                          ol: ({ children }) => {
                            const highlightType = getHighlightType(currentSectionRef.current)
                            const isRecentlyWrong = highlightType === 'recently-wrong'
                            const isRecentlyCorrect = highlightType === 'recently-correct'
                            const isRecovered = highlightType === 'previously-wrong-now-correct'

                            const showIcon = isRecentlyWrong || isRecentlyCorrect || isRecovered
                            const icon = isRecentlyWrong ? '🍎' : '🍏'
                            return (
                              <div className={`transition-colors ${showIcon ? 'relative pl-6' : ''}`}>
                                {showIcon && (
                                  <span className="absolute left-0 top-0 text-base leading-none">
                                    {icon}
                                  </span>
                                )}
                                <ol>{children}</ol>
                              </div>
                            )
                          },
                          thead: ({ children }) => {
                            return (
                              <thead>
                                {children}
                              </thead>
                            )
                          },
                          th: ({ children }) => {
                            return (
                              <th className="border-b-2 border-border">
                                {children}
                              </th>
                            )
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}

          {isLoading && <PulseSpinner message="Loading your lesson..." fullScreen={false} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="-mx-6 px-6 pl-12 pr-32">
          <SimplePromptInput
            onSubmit={handleSendMessage}
            placeholder="Ask a follow-up question..."
            isLoading={isLoading || !initialized}
          />
        </div>

        {initialized && messages.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border -mx-6 px-6 pl-12 pr-32">
            <Link
              href={`/quizzer?topic=${encodeURIComponent(decodedTopic)}${domain ? `&domain=${encodeURIComponent(domain)}` : ''}`}
            >
              <Button variant="minimal" className="w-full">
                Take Quiz on This Topic →
              </Button>
            </Link>
          </div>
        )}

        {/* Interests Modal - Only show if no interests saved */}
        {savedInterests.length === 0 && (
          <Dialog open={showInterestsModal} onOpenChange={setShowInterestsModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tell us about your interests</DialogTitle>
                <DialogDescription>
                  Share your hobbies, fandoms, or interests so we can personalize your lessons with relevant examples.
                </DialogDescription>
              </DialogHeader>

              {/* Interest Tags Input - Same as topic selector */}
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
                        onClick={() => {
                          const newInterests = savedInterests.filter((_, i) => i !== index)
                          setSavedInterests(newInterests)
                          if (user?.id && newInterests.length > 0) {
                            updateUserCurrentInterest(user.id, newInterests.join(', '))
                          }
                        }}
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
                    placeholder={savedInterests.length === 0 ? "Add your interests/hobbies/fandoms..." : "Add another interest..."}
                    value={currentInterestInput}
                    onChange={(e) => setCurrentInterestInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentInterestInput.trim() && user?.id) {
                        e.preventDefault()
                        const newInterest = currentInterestInput.trim()
                        const updatedInterests = [...savedInterests, newInterest]
                        setSavedInterests(updatedInterests)
                        setCurrentInterestInput('')
                        updateUserCurrentInterest(user.id, updatedInterests.join(', '))
                      }
                    }}
                    className="flex-1 min-w-[200px] bg-transparent outline-none text-sm"
                  />

                  {/* Enter key indicator */}
                  {currentInterestInput.trim().length > 0 && (
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

              <DialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInterestsModal(false)
                  }}
                >
                  Skip for now
                </Button>
                <Button
                  onClick={() => {
                    setShowInterestsModal(false)
                  }}
                  disabled={savedInterests.length === 0}
                >
                  Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
  )
}
