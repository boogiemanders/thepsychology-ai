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
import { useRouter, useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getUserCurrentInterest, updateUserCurrentInterest, subscribeToUserInterestChanges, unsubscribeFromInterestChanges } from '@/lib/interests'
import {
  getUserLanguagePreference,
  subscribeToUserLanguagePreferenceChanges,
  unsubscribeFromLanguagePreferenceChanges,
  updateUserLanguagePreference,
} from '@/lib/language-preference'
import { getLessonDisplayName } from '@/lib/topic-display-names'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '@/context/auth-context'
import { getQuizResults } from '@/lib/quiz-results-storage'
import { PulseSpinner } from '@/components/PulseSpinner'
import Lottie from 'lottie-react'
import textLoadingAnimation from '../../../public/animations/text-loading.json'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { MagicCard } from '@/components/ui/magic-card'
import { PulsatingButton } from '@/components/ui/pulsating-button'
import { InlineSvg } from '@/components/ui/inline-svg'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface HighlightData {
  recentlyWrongSections: string[]
  recentlyCorrectSections: string[]
  previouslyWrongNowCorrectSections: string[]
  quizWrongSections: string[]
  examWrongSections: string[]
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
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
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
  const displayLessonName = getLessonDisplayName(decodedTopic)
  const normalizedTopicName = decodedTopic ? decodedTopic.trim().toLowerCase() : ''

  const normalizeSectionName = (section?: string | null): string | null => {
    if (!section) return null
    const trimmed = section.trim()
    if (!trimmed) return null
    const normalized = trimmed.toLowerCase()

    // Drop truly generic labels from exam history; they aren't useful
    if (GENERIC_SECTION_NAMES.has(normalized)) {
      return null
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
    quizWrongSections: [],
    examWrongSections: [],
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentSectionRef = useRef<string>('')
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const languageSubscriptionRef = useRef<RealtimeChannel | null>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [languagePreference, setLanguagePreference] = useState<string | null>(null)
  const [languageInput, setLanguageInput] = useState('')
  const [lastTranslationCacheKey, setLastTranslationCacheKey] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const assistantEnglishContentRef = useRef<Record<number, string>>({})
  const translationControllerRef = useRef<AbortController | null>(null)
  const translationPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const translationSessionRef = useRef(0)
  const interestSnapshotRef = useRef<string>('')
  const [isMetaphorUpdating, setIsMetaphorUpdating] = useState(false)

  const buildTranslationCacheKey = (
    topicName?: string | null,
    domainName?: string | null,
    language?: string | null,
    interests?: string | null
  ): string | null => {
    if (!topicName || !language) return null
    const normalizedTopic = topicName.trim().toLowerCase()
    const normalizedLanguage = language.trim().toLowerCase()
    if (!normalizedTopic || !normalizedLanguage) return null
    const normalizedDomain = domainName?.trim().toLowerCase() || 'none'
    const normalizedInterests = interests?.trim().toLowerCase() || 'none'
    return `tt_translation__${normalizedTopic}__${normalizedDomain}__${normalizedLanguage}__${normalizedInterests}`
  }

  const normalizeLanguageInput = (raw: string): string | null => {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const lower = trimmed.toLowerCase()
    if (lower === 'english' || lower === 'en' || lower === 'eng') return null
    return trimmed
  }

  const getCachedTranslation = (cacheKey: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(cacheKey)
    } catch (error) {
      console.debug('Unable to read translation cache:', error)
      return null
    }
  }

  const storeCachedTranslation = (cacheKey: string, content: string) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(cacheKey, content)
    } catch (error) {
      console.debug('Unable to cache translation:', error)
    }
  }

  const restoreAssistantEnglishContent = () => {
    setMessages((prev) => {
      let changed = false
      const next = prev.map((message, idx) => {
        if (message.role !== 'assistant') return message
        const english = assistantEnglishContentRef.current[idx]
        if (!english || message.content === english) return message
        changed = true
        return { ...message, content: english }
      })
      return changed ? next : prev
    })
  }

  const queueTranslationTask = (
    task: (sessionId: number) => Promise<void>
  ) => {
    const sessionId = translationSessionRef.current
    translationPromiseRef.current = translationPromiseRef.current
      .then(() => task(sessionId))
      .catch((error) => {
        if ((error as Error).name !== 'AbortError') {
          console.error('Translation queue error:', error)
        }
      })
    return translationPromiseRef.current
  }

  const startMessageTranslation = async (
    messageIndex: number,
    englishContent: string,
    targetLanguage: string,
    cacheKey: string | null,
    sessionId: number,
    options: { streamImmediately?: boolean } = {}
  ) => {
    if (!englishContent.trim()) return
    if (translationSessionRef.current !== sessionId) return

    if (cacheKey) {
      const cached = getCachedTranslation(cacheKey)
      if (cached) {
        if (translationSessionRef.current !== sessionId) return
        setMessages((prev) => {
          const next = [...prev]
          if (!next[messageIndex] || next[messageIndex].role !== 'assistant') {
            return prev
          }
          next[messageIndex] = { ...next[messageIndex], content: cached }
          return next
        })
        setLastTranslationCacheKey(cacheKey)
        return
      }
    }

    const controller = new AbortController()
    translationControllerRef.current = controller
    const streamImmediately = options.streamImmediately !== false
    let bufferedTranslation = ''

    try {
      setIsTranslating(true)
      const response = await fetch('/api/topic-teacher/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: englishContent,
          languagePreference: targetLanguage,
        }),
        signal: controller.signal,
      })

      if (translationSessionRef.current !== sessionId) {
        controller.abort()
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to translate content')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let translated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        translated += decoder.decode(value, { stream: true })

        if (translationSessionRef.current !== sessionId) {
          controller.abort()
          return
        }

        const currentContent = translated
        if (streamImmediately) {
          setMessages((prev) => {
            const next = [...prev]
            if (!next[messageIndex] || next[messageIndex].role !== 'assistant') {
              return prev
            }
            next[messageIndex] = { ...next[messageIndex], content: currentContent }
            return next
          })
        } else {
          bufferedTranslation = currentContent
        }
      }

      if (translationSessionRef.current !== sessionId) {
        return
      }

      const finalContent = streamImmediately ? translated : bufferedTranslation || translated
      if (!streamImmediately) {
        setMessages((prev) => {
          const next = [...prev]
          if (!next[messageIndex] || next[messageIndex].role !== 'assistant') {
            return prev
          }
          next[messageIndex] = { ...next[messageIndex], content: finalContent }
          return next
        })
      }

      if (cacheKey) {
        storeCachedTranslation(cacheKey, finalContent)
        setLastTranslationCacheKey(cacheKey)
      }
      return finalContent
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }
      console.error('Translation stream error:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to translate content'
      )
    } finally {
      if (translationControllerRef.current === controller) {
        translationControllerRef.current = null
      }
      setIsTranslating(false)
    }
    return null
  }

  const captureAssistantEnglishContent = (index: number, content: string) => {
    assistantEnglishContentRef.current[index] = content

    const targetLanguageRaw = languagePreference?.trim()
    if (
      !targetLanguageRaw ||
      ['english', 'en', 'eng'].includes(targetLanguageRaw.toLowerCase())
    ) {
      return
    }

    const interestsSnapshot =
      savedInterests.length > 0 ? savedInterests.join(', ') : userInterests || null
    const cacheKey =
      index === 0
        ? buildTranslationCacheKey(
            decodedTopic,
            domain,
            targetLanguageRaw,
            interestsSnapshot
          )
        : null

    setTimeout(() => {
      queueTranslationTask((sessionId) =>
        startMessageTranslation(
          index,
          content,
          targetLanguageRaw,
          cacheKey,
          sessionId
        )
      )
    }, 0)
  }

  // Disabled auto-scroll - keep at top of page
  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }

  // useEffect(() => {
  //   scrollToBottom()
  // }, [messages])

  // Check for user interests and language preference on mount, and subscribe to interest changes
  useEffect(() => {
    const loadUserInterest = async () => {
      if (!user?.id) {
        setShowInterestsModal(true)
        setInterestsLoaded(true)
        return
      }

      try {
        let currentInterest = await getUserCurrentInterest(user.id)
        let currentLanguage = await getUserLanguagePreference(user.id)

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

        // Load language preference with localStorage fallback
        if (currentLanguage == null && typeof window !== 'undefined') {
          currentLanguage = localStorage.getItem(`language_pref_${user.id}`)
        }
        if (currentLanguage && currentLanguage.trim().length > 0) {
          setLanguagePreference(currentLanguage)
          setLanguageInput('')
        } else {
          setLanguagePreference(null)
          setLanguageInput('')
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
        console.debug('Error loading user interest or language preference:', error)
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
    if (!user?.id) return

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

    return () => {
      if (languageSubscriptionRef.current) {
        unsubscribeFromLanguagePreferenceChanges(languageSubscriptionRef.current)
      }
    }
  }, [user?.id])

  useEffect(() => {
    if (!messagesEndRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsNearBottom(entry?.isIntersecting ?? false)
      },
      {
        root: null,
        threshold: 0.9,
      }
    )

    const node = messagesEndRef.current
    if (node) {
      observer.observe(node)
    }

    return () => {
      if (node) observer.unobserve(node)
      observer.disconnect()
    }
  }, [messages.length])

  const formatSectionList = (sections: string[]) => {
    if (!sections || sections.length === 0) return ''
    return sections.includes('__ALL__') ? 'All sections' : sections.join('; ')
  }

  // Load quiz/exam results and compute highlight data
  useEffect(() => {
    if (decodedTopic) {
      let allWrongSections: string[] = []
      let allCorrectSections: string[] = []
      let allPreviouslyWrongNowCorrect: string[] = []
      let hasAnyResults = false
      let quizWrongSections: string[] = []

	      // Always check for quiz results
      const quizResults = getQuizResults(decodedTopic)
      if (quizResults && quizResults.wrongAnswers && quizResults.wrongAnswers.length > 0) {
        quizWrongSections = normalizeSections(
          quizResults.wrongAnswers.flatMap((wa) => wa.relatedSections || []),
          { allowAll: true }
        )

        // Guard for correctAnswers - may be undefined in malformed/old data
        if (quizResults.correctAnswers && Array.isArray(quizResults.correctAnswers)) {
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

        if (quizWrongSections.length > 0) {
          allWrongSections = [...allWrongSections, ...quizWrongSections]
          hasAnyResults = true
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
        const dedupedWrong = [...new Set(allWrongSections)]
        const dedupedQuizWrong = [...new Set(quizWrongSections)]
        const dedupedExamWrong = [...new Set(examWrongSections)]

        setHighlightData({
          recentlyWrongSections: dedupedWrong,
          recentlyCorrectSections: [...new Set(allCorrectSections)],
          previouslyWrongNowCorrectSections: [
            ...new Set(allPreviouslyWrongNowCorrect),
          ],
          quizWrongSections: dedupedQuizWrong,
          examWrongSections: dedupedExamWrong,
        })
      }
    }
  }, [decodedTopic, hasExamResults])

  // Initialize with lesson
  useEffect(() => {
    if (!initialized && topic && interestsLoaded && !authLoading) {
      initializeLesson()
    }
  }, [topic, initialized, interestsLoaded, authLoading])

  // Watch for interest changes and refresh metaphors
  useEffect(() => {
    if (!initialized || !interestsLoaded) return
    if (isRefreshingMetaphors) return

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
          setLastTranslationCacheKey(null)
          captureAssistantEnglishContent(0, baseContent)
        }
      }
    }
  }, [savedInterests, initialized, interestsLoaded])

  // Watch for language preference changes and refresh translated content (with caching)
  useEffect(() => {
    const rawPreference = languagePreference?.trim()
    const normalized = rawPreference?.toLowerCase()

    const resetToEnglish = () => {
      translationSessionRef.current += 1
      translationPromiseRef.current = Promise.resolve()
      translationControllerRef.current?.abort()
      setIsTranslating(false)
      restoreAssistantEnglishContent()
      setLastTranslationCacheKey(null)
      setIsMetaphorUpdating(false)
    }

    if (
      !rawPreference ||
      !normalized ||
      normalized === 'english' ||
      normalized === 'en' ||
      normalized === 'eng'
    ) {
      resetToEnglish()
      return
    }

    translationSessionRef.current += 1
    translationPromiseRef.current = Promise.resolve()
    translationControllerRef.current?.abort()
    restoreAssistantEnglishContent()

    const interestsForCache =
      interestSnapshotRef.current && interestSnapshotRef.current.length > 0
        ? interestSnapshotRef.current
        : null
    const englishMap = assistantEnglishContentRef.current
    const indices = Object.keys(englishMap)
      .map(Number)
      .sort((a, b) => a - b)

    indices.forEach((idx) => {
      const english = englishMap[idx]
      if (!english) return
      const cacheKey =
        idx === 0
          ? buildTranslationCacheKey(
              decodedTopic,
              domain,
              rawPreference,
              interestsForCache
            )
          : null
      queueTranslationTask((sessionId) =>
        startMessageTranslation(
          idx,
          english,
          rawPreference,
          cacheKey,
          sessionId
        )
      )
    })
  }, [languagePreference, decodedTopic, domain])

  const initializeLesson = async () => {
    if (!topic || authLoading) return
    const subscriptionTier = userProfile?.subscription_tier ?? 'free'
    assistantEnglishContentRef.current = {}
    translationSessionRef.current += 1
    translationPromiseRef.current = Promise.resolve()
    translationControllerRef.current?.abort()

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
          languagePreference: null,
          subscriptionTier,
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
      captureAssistantEnglishContent(0, lessonContent)
      setInitialized(true)
      setPreviousUserInterests(userInterests)
      setLastTranslationCacheKey(null)
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
    const subscriptionTier = userProfile?.subscription_tier ?? 'free'

    // Create cache key from topic + interests
    const cacheKey = `${topic}__${newInterests || 'none'}`

    // Check cache first
    if (personalizedCache[cacheKey]) {
      console.log('[Topic Teacher] ⚡ Using cached personalized content for:', newInterests)
      const cachedLesson = personalizedCache[cacheKey]
      assistantEnglishContentRef.current[0] = cachedLesson
      const normalizedLang = languagePreference?.trim()
      const normalizedLower = normalizedLang?.toLowerCase()

      if (!normalizedLang || normalizedLower === 'english' || normalizedLower === 'en' || normalizedLower === 'eng') {
        setMessages([
          {
            role: 'assistant',
            content: cachedLesson,
          },
        ])
        setPreviousUserInterests(newInterests)
        setLastTranslationCacheKey(null)
        return
      }

      setIsMetaphorUpdating(true)
      const interestsForCache =
        interestSnapshotRef.current && interestSnapshotRef.current.length > 0
          ? interestSnapshotRef.current
          : null

      const translationCacheKey = buildTranslationCacheKey(
        decodedTopic,
        domain,
        normalizedLang,
        interestsForCache
      )

      queueTranslationTask((sessionId) =>
        startMessageTranslation(
          0,
          cachedLesson,
          normalizedLang,
          translationCacheKey,
          sessionId,
          { streamImmediately: false }
        )
      )
        .then(() => {
          if (languagePreference !== normalizedLang) return
          setPreviousUserInterests(newInterests)
        })
        .finally(() => {
          setIsMetaphorUpdating(false)
        })
      return
    }

    try {
      setIsRefreshingMetaphors(true)
      setIsMetaphorUpdating(true)
      setError(null)

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
          languagePreference: null,
          subscriptionTier,
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

      const normalizedLang = languagePreference?.trim()
      const normalizedLower = normalizedLang?.toLowerCase()
      assistantEnglishContentRef.current[0] = lessonContent

      if (!normalizedLang || normalizedLower === 'english' || normalizedLower === 'en' || normalizedLower === 'eng') {
        setMessages([
          {
            role: 'assistant',
            content: lessonContent,
          },
        ])
        setPreviousUserInterests(newInterests)
        setLastTranslationCacheKey(null)
        setIsMetaphorUpdating(false)
        return
      }

      const interestsForCache =
        interestSnapshotRef.current && interestSnapshotRef.current.length > 0
          ? interestSnapshotRef.current
          : null
      const translationCacheKey = buildTranslationCacheKey(
        decodedTopic,
        domain,
        normalizedLang,
        interestsForCache
      )

      queueTranslationTask((sessionId) =>
        startMessageTranslation(
          0,
          lessonContent,
          normalizedLang,
          translationCacheKey,
          sessionId,
          { streamImmediately: false }
        )
      )
        .then(() => {
          if (languagePreference !== normalizedLang) return
          setPreviousUserInterests(newInterests)
        })
        .finally(() => {
          setIsMetaphorUpdating(false)
        })
    } catch (err) {
      console.error('Error refreshing metaphors:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to refresh metaphors'
      )
      setIsMetaphorUpdating(false)
    } finally {
      setIsRefreshingMetaphors(false)
    }
  }

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading || !topic) return
    const subscriptionTier = userProfile?.subscription_tier ?? 'free'

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
          languagePreference,
          subscriptionTier,
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

      setMessages((prev) => {
        const next = [...prev, { role: 'assistant', content: assistantMessage }]
        const newIndex = next.length - 1
        captureAssistantEnglishContent(newIndex, assistantMessage)
        return next
      })
    } catch (err) {
      console.error('Error sending message:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to send message'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const snapshot =
      savedInterests.length > 0 ? savedInterests.join(', ') : userInterests || ''
    interestSnapshotRef.current = snapshot
  }, [savedInterests, userInterests])

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

  const getHighlightFlags = (text: string) => {
    if (!text || text.trim().length === 0) {
      return {
        quizWrong: false,
        examWrong: false,
        recovered: false,
        recentlyCorrect: false,
      }
    }

    const quizWrong = highlightData.quizWrongSections.some((section) =>
      labelsMatch(text, section)
    )
    const examWrong = highlightData.examWrongSections.some((section) =>
      labelsMatch(text, section)
    )
    const recovered = highlightData.previouslyWrongNowCorrectSections.some((section) =>
      labelsMatch(text, section)
    )
    const recentlyCorrect = highlightData.recentlyCorrectSections.some((section) =>
      labelsMatch(text, section)
    )

    return {
      quizWrong,
      examWrong,
      recovered,
      recentlyCorrect,
    }
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
                <BreadcrumbLink href="/topic-selector">Lessons</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Topic Teacher</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">No lesson selected</h1>
            <p className="text-muted-foreground mb-6">
              Please select a lesson from Lessons
            </p>
            <Link href="/topic-selector">
              <Button>Go to Lessons</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full mx-auto p-6 pb-40 max-w-4xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/topic-selector">Lessons</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{displayLessonName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6">
          <TypographyH1>{displayLessonName}</TypographyH1>
        </div>

        {isMetaphorUpdating && (
          <div className="mb-4 rounded-md border border-dashed border-primary/50 bg-primary/5 px-4 py-2 text-sm text-primary">
            Personalizing metaphors for your interests...
          </div>
        )}

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
                        const joined = newInterests.join(', ')
                        // Persist to Supabase (best-effort) and localStorage
                        updateUserCurrentInterest(user.id, joined)
                        if (typeof window !== 'undefined') {
                          if (joined) {
                            localStorage.setItem(`interests_${user.id}`, joined)
                          } else {
                            localStorage.removeItem(`interests_${user.id}`)
                          }
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
                    const joined = updatedInterests.join(', ')
                    // Persist to Supabase (best-effort) and localStorage
                    updateUserCurrentInterest(user.id, joined)
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(`interests_${user.id}`, joined)
                    }
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
            {languagePreference && isTranslating && (
              <div className="mt-2 text-xs text-muted-foreground px-1">
                Translating to {languagePreference}...
              </div>
            )}
          </div>
        </div>

        {/* Language Preference Input */}
        <div className="mb-6 max-w-2xl">
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 p-2 pl-3 border border-input rounded-md bg-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              {/* Display language preference as a single tag */}
              {languagePreference && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                >
                  <span>{languagePreference}</span>
                  <button
                    onClick={async () => {
                      setLanguagePreference(null)
                      setLanguageInput('')
                      setIsTranslating(false)
                      setLastTranslationCacheKey(null)
                      if (user?.id) {
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
                      const cacheKeyToRemove = buildTranslationCacheKey(
                        decodedTopic,
                        domain,
                        languagePreference,
                        savedInterests.length > 0 ? savedInterests.join(', ') : userInterests || null
                      )
                      if (cacheKeyToRemove && typeof window !== 'undefined') {
                        localStorage.removeItem(cacheKeyToRemove)
                      }
                    }}
                    className="hover:opacity-70 transition-opacity"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}

              {/* Input field */}
              {!languagePreference && (
                <input
                  type="text"
                  placeholder="Preferred language (e.g., Spanish)..."
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter' && languageInput.trim() && user?.id) {
                      e.preventDefault()
                      const newLanguage = normalizeLanguageInput(languageInput)
                      setLanguagePreference(newLanguage)
                      setLastTranslationCacheKey(null)
                      setIsTranslating(false)
                      setLanguageInput('')
                      try {
                        await updateUserLanguagePreference(user.id, newLanguage ?? '')
                        if (typeof window !== 'undefined') {
                          if (newLanguage) {
                            localStorage.setItem(`language_pref_${user.id}`, newLanguage)
                          } else {
                            localStorage.removeItem(`language_pref_${user.id}`)
                          }
                        }
                      } catch (error) {
                        console.debug('Failed to save language preference:', error)
                      }
                    }
                  }}
                  className="flex-1 min-w-[200px] bg-transparent outline-none text-sm"
                />
              )}

              {/* Enter key indicator */}
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

        {highlightData.examWrongSections.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <p className="text-sm text-foreground/80">
              🍏 Most recent practice exam
              {highlightData.examWrongSections.length > 0
                ? `: ${formatSectionList(highlightData.examWrongSections)}`
                : ''}
            </p>
          </motion.div>
        )}
        {highlightData.quizWrongSections.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <p className="text-sm text-foreground/80">
              🍎 Most recent quiz
              {highlightData.quizWrongSections.length > 0
                ? `: ${formatSectionList(highlightData.quizWrongSections)}`
                : ''}
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
                            const { quizWrong, examWrong, recentlyCorrect, recovered } =
                              getHighlightFlags(currentSectionRef.current)

                            const showIcon = quizWrong || examWrong || recentlyCorrect || recovered
                            const icons =
                              (quizWrong ? '🍎' : '') + (examWrong ? '🍏' : '')

                            return (
                              <div className={`transition-colors ${showIcon ? 'relative pl-10' : ''}`}>
                                {showIcon && (
                                  <span className="absolute left-0 top-1 w-8 flex items-center justify-center text-base leading-none">
                                    {icons}
                                  </span>
                                )}
                                <p className="m-0">{children}</p>
                              </div>
                            )
                          },
                          ul: ({ children }) => {
                            const { quizWrong, examWrong, recentlyCorrect, recovered } =
                              getHighlightFlags(currentSectionRef.current)

                            const showIcon = quizWrong || examWrong || recentlyCorrect || recovered
                            const icons =
                              (quizWrong ? '🍎' : '') + (examWrong ? '🍏' : '')
                            return (
                              <div className={`transition-colors ${showIcon ? 'relative pl-10' : ''}`}>
                                {showIcon && (
                                  <span className="absolute left-0 top-1 w-8 flex items-center justify-center text-base leading-none">
                                    {icons}
                                  </span>
                                )}
                                <ul>{children}</ul>
                              </div>
                            )
                          },
                          ol: ({ children }) => {
                            const { quizWrong, examWrong, recentlyCorrect, recovered } =
                              getHighlightFlags(currentSectionRef.current)

                            const showIcon = quizWrong || examWrong || recentlyCorrect || recovered
                            const icons =
                              (quizWrong ? '🍎' : '') + (examWrong ? '🍏' : '')
                            return (
                              <div className={`transition-colors ${showIcon ? 'relative pl-10' : ''}`}>
                                {showIcon && (
                                  <span className="absolute left-0 top-1 w-8 flex items-center justify-center text-base leading-none">
                                    {icons}
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
                          img: ({ src, alt }) => {
                            // Use InlineSvg for SVG files to enable theme-aware styling
                            if (src && src.endsWith('.svg')) {
                              return (
                                <InlineSvg
                                  src={src}
                                  alt={alt || ''}
                                  className="my-6 max-w-full"
                                />
                              )
                            }
                            // Regular images
                            return (
                              <img
                                src={src}
                                alt={alt || ''}
                                className="rounded-lg my-6 shadow-md max-w-full"
                              />
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

          {isMetaphorUpdating && (
            <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Personalizing metaphors...
            </div>
          )}

          {isLoading && <PulseSpinner message="Loading your lesson..." fullScreen={false} />}

          <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 z-30 w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-[0_-12px_35px_rgba(0,0,0,0.12)]">
        <div
          className={`mx-auto w-full max-w-4xl px-6 overflow-hidden transition-all duration-300 ease-out ${
            isNearBottom ? 'py-4' : 'py-1.5'
          }`}
          style={{ maxHeight: isNearBottom ? 240 : 140 }}
        >
          <div className="flex items-end gap-3">
            <MagicCard
              gradientColor="rgba(255,255,255,0.15)"
              gradientOpacity={0.35}
              gradientFrom="#91A3FF"
              gradientTo="#B4FFE6"
              className="flex-1 min-w-0 rounded-2xl border border-brand-soft-blue/40"
            >
              <SimplePromptInput
                className="flex-1 min-w-0 border-none bg-transparent shadow-none"
                onSubmit={handleSendMessage}
                placeholder="Ask a follow-up question..."
                isLoading={isLoading || !initialized}
                compact={!isNearBottom}
                framed={false}
              />
            </MagicCard>

            {initialized && messages.length > 0 && (
              <PulsatingButton
                className="flex-shrink-0 [--pulse-color:rgba(0,0,0,0.45)] dark:[--pulse-color:rgba(255,255,255,0.85)]"
                duration="1.8s"
                active={isNearBottom}
              >
                <InteractiveHoverButton
                  type="button"
                  size="sm"
                  className="px-5 py-2 text-base font-medium text-foreground bg-transparent border border-border shadow-md"
                  dotClassName="bg-foreground dark:bg-white"
                  hoverTextClassName="text-primary-foreground"
                  onClick={() => {
                    const quizPath = `/quizzer?topic=${encodeURIComponent(decodedTopic)}${domain ? `&domain=${encodeURIComponent(domain)}` : ''}`
                    router.push(quizPath)
                  }}
                  hoverText="Start"
                >
                  Quiz
                </InteractiveHoverButton>
              </PulsatingButton>
            )}
          </div>
        </div>
      </div>

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
