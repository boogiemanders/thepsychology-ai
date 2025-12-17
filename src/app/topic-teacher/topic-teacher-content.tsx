'use client'

import { Children, cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from 'react'
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
import { deriveTopicMetaFromQuestionSource } from '@/lib/topic-source-utils'
import { PulseSpinner } from '@/components/PulseSpinner'
import Lottie from 'lottie-react'
import textLoadingAnimation from '../../../public/animations/text-loading.json'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { MagicCard } from '@/components/ui/magic-card'
import { PulsatingButton } from '@/components/ui/pulsating-button'
import { InlineSvg } from '@/components/ui/inline-svg'
import { VariableStar } from '@/components/ui/variable-star'

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

interface PracticeExamQuestion {
  id?: number | string
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
  source_file?: string
  source_folder?: string
  topicName?: string
  domainId?: string
  relatedSections?: string[]
  [key: string]: any
}

interface WrongPracticeExamQuestion {
  questionIndex: number
  question: PracticeExamQuestion
  selectedAnswer: string
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
  const [practiceExamWrongQuestions, setPracticeExamWrongQuestions] = useState<
    WrongPracticeExamQuestion[]
  >([])
  const [isLoadingPracticeExamWrongQuestions, setIsLoadingPracticeExamWrongQuestions] =
    useState(false)
  const [practiceExamWrongQuestionsError, setPracticeExamWrongQuestionsError] =
    useState<string | null>(null)
  const [matchedExamTerms, setMatchedExamTerms] = useState<string[]>([])
  // Map from question index to best matched term (keeps only one term per question)
  const matchedExamTermsRef = useRef<Map<number, string>>(new Map())
  const [missedQuestionDialogOpen, setMissedQuestionDialogOpen] = useState(false)
  const [activeMissedQuestion, setActiveMissedQuestion] =
    useState<WrongPracticeExamQuestion | null>(null)
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
          quizWrongSections: [],
          examWrongSections: ['__ALL__'],
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

  // Load latest practice-exam wrong questions for table-row 🍏 mapping
  // Always fetch when user is logged in - API returns 404 if no results (handled gracefully)
  useEffect(() => {
    if (!user?.id || !decodedTopic) return

    // Reset matched terms when topic changes
    matchedExamTermsRef.current.clear()
    setMatchedExamTerms([])

    let cancelled = false
    const controller = new AbortController()

    const loadPracticeExamWrongQuestions = async () => {
      try {
        setIsLoadingPracticeExamWrongQuestions(true)
        setPracticeExamWrongQuestionsError(null)

        const response = await fetch(
          `/api/get-exam-results/latest?userId=${encodeURIComponent(user.id)}`,
          { signal: controller.signal },
        )

        if (response.status === 404) {
          if (!cancelled) {
            setPracticeExamWrongQuestions([])
          }
          return
        }

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to load practice exam results')
        }

        const data = await response.json()
        if (!data?.success || !data.results) {
          throw new Error(data?.error || 'Failed to load practice exam results')
        }

        const questions: PracticeExamQuestion[] = Array.isArray(data.results.questions)
          ? data.results.questions
          : []
        const selectedAnswers: Record<string, string> = data.results.selectedAnswers || {}

        const wrong: WrongPracticeExamQuestion[] = []

        // Normalize topic names for comparison (remove punctuation, extra spaces)
        const normalizeTopic = (s: string) =>
          s.toLowerCase()
            .replace(/[,.:;'"!?()]/g, '')
            .replace(/\s+/g, ' ')
            .trim()

        const normalizedUrlTopic = normalizeTopic(decodedTopic || '')

        questions.forEach((question, index) => {
          const selectedAnswer =
            selectedAnswers[index as any] ?? selectedAnswers[String(index)] ?? null

          if (!selectedAnswer) return
          if (selectedAnswer === question.correct_answer) return

          const meta = deriveTopicMetaFromQuestionSource(question)
          const questionTopic = (question.topicName || meta?.topicName || '').trim()
          if (!questionTopic) return

          const normalizedQuestionTopic = normalizeTopic(questionTopic)
          const topicMatches = normalizedQuestionTopic === normalizedUrlTopic
          if (!topicMatches) return

          wrong.push({
            questionIndex: index,
            question,
            selectedAnswer,
          })
        })

        if (!cancelled) {
          setPracticeExamWrongQuestions(wrong)
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error('[Topic Teacher] Failed to load practice exam wrong questions:', error)
        if (!cancelled) {
          setPracticeExamWrongQuestionsError(
            error instanceof Error ? error.message : 'Failed to load practice exam results',
          )
          setPracticeExamWrongQuestions([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPracticeExamWrongQuestions(false)
        }
      }
    }

    loadPracticeExamWrongQuestions()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [user?.id, decodedTopic])

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

  const preparedPracticeExamWrongQuestions = useMemo(() => {
    const normalize = (value: string): string => {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    const prepared = practiceExamWrongQuestions.map((entry) => {
      const { question } = entry
      return {
        entry,
        stem: ` ${normalize(question.question || '')} `,
        correctAnswer: ` ${normalize(question.correct_answer || '')} `,
        explanation: ` ${normalize(question.explanation || '')} `,
        options: ` ${normalize(
          Array.isArray(question.options) ? question.options.join(' ') : ''
        )} `,
      }
    })

    return prepared
  }, [practiceExamWrongQuestions])

  const isAcronymLikeTerm = (term: string): boolean => {
    const trimmed = term.trim()
    if (trimmed.length > 5) return false
    return /^[A-Z0-9]+$/.test(trimmed)
  }

  const findBestWrongPracticeExamQuestionForTableTerm = (
    tableTerm: string
  ): WrongPracticeExamQuestion | null => {
    const raw = tableTerm.trim()
    if (!raw) return null

    // Avoid accidental matches for super-short non-acronyms (e.g., "to", "in")
    if (raw.length <= 3 && !isAcronymLikeTerm(raw)) return null

    const term = normalizeLabel(raw)
    if (!term) return null

    const needle = ` ${term} `

    // Also extract significant words (4+ chars) for partial matching
    const significantWords = term.split(/\s+/).filter(w => w.length >= 4)

    let best: WrongPracticeExamQuestion | null = null
    let bestScore = 0

    for (const prepared of preparedPracticeExamWrongQuestions) {
      let score = 0

      // Exact phrase matching (original logic)
      if (prepared.stem.includes(needle)) score += 4
      if (prepared.correctAnswer.includes(needle)) score += 3
      if (prepared.explanation.includes(needle)) score += 2
      if (prepared.options.includes(needle)) score += 1

      // Partial word matching: if most significant words from table term appear in question
      if (score === 0 && significantWords.length >= 2) {
        const matchedWords = significantWords.filter(word =>
          prepared.stem.includes(` ${word} `) ||
          prepared.stem.includes(` ${word}s `) ||  // plural
          prepared.explanation.includes(` ${word} `)
        )
        // If at least 2/3 of significant words match, give partial score
        if (matchedWords.length >= Math.ceil(significantWords.length * 0.6)) {
          score = 2 // explanation-level hit
        }
      }

      if (score > bestScore) {
        bestScore = score
        best = prepared.entry
      }
    }

    // Track matched terms for the header display (one best term per question)
    if (bestScore >= 2 && best) {
      const genericTerms = ['workers', 'theory', 'management', 'supervisor', 'employee', 'work', 'motivation', 'behavior']
      const normalizedRaw = raw.toLowerCase().trim()
      const words = normalizedRaw.split(/\s+/)

      // Only track if NOT a generic single word
      const isGeneric = genericTerms.includes(normalizedRaw) ||
                        (words.length === 1 && normalizedRaw.length < 8 && !normalizedRaw.includes('/'))

      if (!isGeneric) {
        const questionIndex = best.questionIndex
        const existingTerm = matchedExamTermsRef.current.get(questionIndex)

        // Keep the longer/more specific term for each question
        if (!existingTerm || raw.length > existingTerm.length) {
          matchedExamTermsRef.current.set(questionIndex, raw)
          // Batch state updates to avoid too many re-renders
          setTimeout(() => {
            setMatchedExamTerms(Array.from(matchedExamTermsRef.current.values()))
          }, 0)
        }
      }
    }

    // Require at least an explanation-level hit.
    return bestScore >= 2 ? best : null
  }

  const extractTextFromMarkdownNode = (node: any): string => {
    if (!node) return ''
    if (node.type === 'text' && typeof node.value === 'string') {
      return node.value
    }
    if (Array.isArray(node.children)) {
      return node.children.map(extractTextFromMarkdownNode).join('')
    }
    return ''
  }

  // Extract potential terms from paragraph text for matching against wrong questions
  // Only extract specific terms (proper nouns, Theory X/Y patterns) - NOT generic words
  const extractPotentialTerms = (text: string): string[] => {
    if (!text) return []

    const terms = new Set<string>()

    // Match possessive proper nouns followed by theory/concept (e.g., "McGregor's Theory X/Y")
    const possessivePatterns = text.match(/[A-Z][a-z]+'s\s+(?:Theory|Concept|Model|Approach|Hierarchy|Effect)(?:\s+[A-Z](?:\/[A-Z])?)?/g)
    if (possessivePatterns) {
      possessivePatterns.forEach(pattern => terms.add(pattern))
    }

    // Match "Theory X", "Theory Y", "Theory X/Y" patterns (specific letter designations)
    const theoryLetterPatterns = text.match(/Theory\s+[A-Z](?:\s*\/\s*[A-Z])?/gi)
    if (theoryLetterPatterns) {
      theoryLetterPatterns.forEach(pattern => terms.add(pattern))
    }

    // Match known psychologist/researcher names (specific proper nouns)
    const properNouns = text.match(/\b(McGregor|Maslow|Herzberg|Vroom|Locke|Adams|Bandura|Skinner|Freud|Jung|Piaget|Erikson|Kohlberg|Ainsworth|Bowlby)\b/g)
    if (properNouns) {
      properNouns.forEach(name => terms.add(name))
    }

    return Array.from(terms)
  }

  // Check if a term is too generic to trigger a paragraph match
  const isGenericTerm = (term: string): boolean => {
    const generic = ['workers', 'theory', 'management', 'supervisor', 'employee', 'work', 'motivation', 'behavior', 'mayo', 'hawthorne']
    const normalized = term.toLowerCase().trim()
    // "Mayo" and "Hawthorne" are generic here because they refer to different studies, not the wrong question's topic
    return generic.includes(normalized)
  }

  // Check if a paragraph matches any wrong practice exam question
  const findBestWrongPracticeExamQuestionForParagraph = (
    paragraphText: string
  ): WrongPracticeExamQuestion | null => {
    if (!paragraphText || preparedPracticeExamWrongQuestions.length === 0) return null

    const potentialTerms = extractPotentialTerms(paragraphText)

    for (const term of potentialTerms) {
      // Skip generic terms that would cause false positives
      if (isGenericTerm(term)) continue

      // Use the existing matching function
      const matched = findBestWrongPracticeExamQuestionForTableTerm(term)
      if (matched) return matched
    }

    return null
  }

  const getAnswerLabel = (
    question: PracticeExamQuestion,
    answerText?: string | null
  ): string | null => {
    if (!answerText) return null
    const options = Array.isArray(question.options) ? question.options : []
    const index = options.findIndex((option) => option === answerText)
    if (index < 0) return answerText
    const letter = String.fromCharCode(65 + index)
    return `${letter}. ${answerText}`
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

        {(highlightData.examWrongSections.length > 0 || matchedExamTerms.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <p className="text-sm text-foreground/80">
              <VariableStar className="inline-block mr-1" /> Most recent practice exam
              {matchedExamTerms.length > 0
                ? `: ${matchedExamTerms.join(', ')}`
                : highlightData.examWrongSections.length > 0
                  ? `: ${formatSectionList(highlightData.examWrongSections)}`
                  : ''}
              {isLoadingPracticeExamWrongQuestions ? (
                <span className="ml-2 text-muted-foreground">
                  Loading missed questions…
                </span>
              ) : practiceExamWrongQuestionsError ? (
                <span className="ml-2 text-destructive">
                  Couldn&apos;t load missed questions
                </span>
              ) : null}
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
                  className={`${message.role === 'user' ? 'px-4' : 'pl-12 pr-4'} py-3 rounded-lg ${
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
                      [&_ul]:my-5 [&_ul]:ml-0 [&_ul]:pl-5 [&_ul>li]:my-2.5 [&_ul>li]:text-base [&_ul>li]:leading-relaxed
                      [&_ol]:my-5 [&_ol]:ml-0 [&_ol]:pl-5 [&_ol>li]:my-2.5 [&_ol>li]:text-base [&_ol>li]:leading-relaxed
                      [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary/80 [&_a:hover]:no-underline
                      [&_hr]:my-8 [&_hr]:border-border/30
                      [&_img]:my-6
                      [&_code]:bg-secondary/50 [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                      [&_pre]:bg-secondary/30 [&_pre]:border [&_pre]:border-border/50 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-5 [&_pre_code]:bg-transparent [&_pre_code]:text-foreground
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-5 [&_blockquote]:text-foreground/80
                      [&_table]:w-full [&_table]:border-collapse [&_table]:my-5 [&_table]:text-sm [&_table]:overflow-visible
                      [&_th]:border [&_th]:border-border [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground
                      [&_td]:border [&_td]:border-border [&_td]:p-3 [&_td]:text-foreground/90 [&_td]:overflow-visible">
	                      <ReactMarkdown
	                        remarkPlugins={[remarkGfm]}
	                        components={{
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

                            // Check if header matches a wrong practice exam question
                            // Use paragraph matching which extracts terms like "Theory Y" from the header
                            const matched = preparedPracticeExamWrongQuestions.length > 0
                              ? findBestWrongPracticeExamQuestionForParagraph(text)
                              : null

                            if (matched) {
                              return (
                                <TypographyH2>
                                  <span className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="apple-pulsate inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                                      onClick={() => {
                                        setActiveMissedQuestion(matched)
                                        setMissedQuestionDialogOpen(true)
                                      }}
                                      aria-label="Review missed practice exam question"
                                      title="Review missed practice exam question"
                                    >
                                      <VariableStar />
                                    </button>
                                    <span>{children}</span>
                                  </span>
                                </TypographyH2>
                              )
                            }

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

                            // Check if header matches a wrong practice exam question
                            // Use paragraph matching which extracts terms like "Theory Y" from the header
                            const matched = preparedPracticeExamWrongQuestions.length > 0
                              ? findBestWrongPracticeExamQuestionForParagraph(text)
                              : null

                            if (matched) {
                              return (
                                <TypographyH3>
                                  <span className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="apple-pulsate inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                                      onClick={() => {
                                        setActiveMissedQuestion(matched)
                                        setMissedQuestionDialogOpen(true)
                                      }}
                                      aria-label="Review missed practice exam question"
                                      title="Review missed practice exam question"
                                    >
                                      <VariableStar />
                                    </button>
                                    <span>{children}</span>
                                  </span>
                                </TypographyH3>
                              )
                            }

                            return (
                              <TypographyH3>
                                {children}
                              </TypographyH3>
                            )
                          },
                          p: ({ children }) => {
                            const rawText = Children.toArray(children).join('')
                            if (rawText.includes('[LOADING_METAPHORS]')) {
                              return (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                  <div className="w-24 h-24">
                                    <Lottie animationData={textLoadingAnimation} loop={true} />
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Personalizing metaphors for your interests...
                                  </p>
                                </div>
                              )
                            }

                            // Check for term-based match (clickable apple for wrong practice exam questions)
                            const termMatch = findBestWrongPracticeExamQuestionForParagraph(rawText)

                            if (termMatch) {
                              return (
                                <div className="relative">
                                  <button
                                    type="button"
                                    className="apple-pulsate absolute -left-10 top-1 flex h-6 w-6 items-center justify-center rounded-full"
                                    onClick={() => {
                                      setActiveMissedQuestion(termMatch)
                                      setMissedQuestionDialogOpen(true)
                                    }}
                                    aria-label="Review missed practice exam question"
                                    title="Review missed practice exam question"
                                  >
                                    <VariableStar />
                                  </button>
                                  <p className="m-0">{children}</p>
                                </div>
                              )
                            }

                            // Fall back to section-based highlighting
                            const { quizWrong, examWrong, recentlyCorrect, recovered } =
                              getHighlightFlags(currentSectionRef.current)

                            const showIcon = quizWrong || examWrong || recentlyCorrect || recovered

                            return (
                              <div className={`transition-colors ${showIcon ? 'relative' : ''}`}>
                                {showIcon && (
                                  <span className="absolute -left-10 top-1 w-8 flex items-center justify-center text-base leading-none">
                                    {quizWrong && <span>🍎</span>}
                                    {examWrong && <VariableStar className="ml-0.5" />}
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
                            return (
                              <div className={`transition-colors ${showIcon ? 'relative' : ''}`}>
                                {showIcon && (
                                  <span className="absolute -left-10 top-1 w-8 flex items-center justify-center text-base leading-none">
                                    {quizWrong && <span>🍎</span>}
                                    {examWrong && <VariableStar className="ml-0.5" />}
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
                            return (
                              <div className={`transition-colors ${showIcon ? 'relative' : ''}`}>
                                {showIcon && (
                                  <span className="absolute -left-10 top-1 w-8 flex items-center justify-center text-base leading-none">
                                    {quizWrong && <span>🍎</span>}
                                    {examWrong && <VariableStar className="ml-0.5" />}
                                  </span>
                                )}
                                <ol>{children}</ol>
	                              </div>
	                            )
	                          },
	                          li: ({ children }) => {
	                            // Extract text content from children to check for highlighting
	                            const getTextContent = (node: any): string => {
	                              if (typeof node === 'string') return node
	                              if (Array.isArray(node)) return node.map(getTextContent).join(' ')
	                              if (node?.props?.children) return getTextContent(node.props.children)
	                              return ''
	                            }

	                            const textContent = getTextContent(children)
	                            const { quizWrong, examWrong } = getHighlightFlags(textContent)
	                            const showIcon = quizWrong || examWrong

	                            return (
	                              <li className={showIcon ? 'relative' : ''}>
	                                {showIcon && (
	                                  <span className="absolute -left-10 top-1 w-8 flex items-center justify-center text-base leading-none">
	                                    {quizWrong && <span>🍎</span>}
	                                    {examWrong && <VariableStar />}
	                                  </span>
	                                )}
	                                {children}
	                              </li>
	                            )
	                          },
	                          td: ({ node, children }) => {
	                            // Extract text content from the cell
	                            const cellText = extractTextFromMarkdownNode(node as any).trim()
	                            const matched = findBestWrongPracticeExamQuestionForTableTerm(cellText)

	                            if (!matched) {
	                              return <td>{children}</td>
	                            }

	                            // Only add star to first cell (check if this is the first td in the row)
	                            const parent = (node as any)?.parent
	                            const isFirstCell = parent?.children?.findIndex((child: any) => child.tagName === 'td' && child === node) === 0

	                            if (!isFirstCell) {
	                              return <td>{children}</td>
	                            }

	                            return (
	                              <td>
	                                <div className="relative">
	                                  <span className="absolute -left-10 top-0 w-8 flex items-center justify-center text-base leading-none">
	                                    <button
	                                      type="button"
	                                      className="apple-pulsate inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
	                                      onClick={() => {
	                                        setActiveMissedQuestion(matched)
	                                        setMissedQuestionDialogOpen(true)
	                                      }}
	                                      aria-label="Review missed practice exam question"
	                                      title="Review missed practice exam question"
	                                    >
	                                      <VariableStar />
	                                    </button>
	                                  </span>
	                                  {children}
	                                </div>
	                              </td>
	                            )
	                          },
	                          tr: ({ node, children }) => {
	                            const rowChildren = Array.isArray((node as any)?.children)
	                              ? ((node as any).children as any[])
	                              : []
	
	                            // Header rows (thead) shouldn't have apples.
	                            if (rowChildren.some((child) => child?.tagName === 'th')) {
	                              return <tr>{children}</tr>
	                            }
	
	                            // For tables, don't add stars - they interfere with table structure
	                            return <tr>{children}</tr>
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
                            // Add theory-diagram class for images from organizational-theories path
                            const isTheoryDiagram = src && src.includes('organizational-theories')
                            // Regular images
                            return (
                              <img
                                src={src}
                                alt={alt || ''}
                                className={`my-6 max-w-full ${isTheoryDiagram ? 'theory-diagram' : ''}`}
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

        <Dialog
          open={missedQuestionDialogOpen}
          onOpenChange={(open) => {
            setMissedQuestionDialogOpen(open)
            if (!open) {
              setActiveMissedQuestion(null)
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Review missed question</DialogTitle>
              <DialogDescription>From your most recent practice exam.</DialogDescription>
            </DialogHeader>

            {activeMissedQuestion && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Question</h4>
                  <p className="text-sm text-foreground">
                    {activeMissedQuestion.question.question}
                  </p>
                </div>

                {Array.isArray(activeMissedQuestion.question.options) &&
                  activeMissedQuestion.question.options.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Options</h4>
                      <div className="space-y-1">
                        {activeMissedQuestion.question.options.map((option, optIdx) => {
                          const isCorrect = option === activeMissedQuestion.question.correct_answer
                          const isSelected = option === activeMissedQuestion.selectedAnswer
                          const optionLetter = String.fromCharCode(65 + optIdx)

                          return (
                            <div
                              key={optIdx}
                              className={`text-sm p-2 rounded flex items-start gap-2 ${
                                isCorrect ? 'bg-green-100/50 text-green-900' : ''
                              } ${
                                isSelected && !isCorrect
                                  ? 'bg-red-100/50 text-red-900'
                                  : ''
                              }`}
                            >
                              <span className="font-semibold flex-shrink-0">
                                {optionLetter}.
                              </span>
                              <span className="break-words">
                                {option}
                                {isCorrect && (
                                  <span className="font-semibold ml-2">✓ Correct</span>
                                )}
                                {isSelected && !isCorrect && (
                                  <span className="font-semibold ml-2">✗ Your answer</span>
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                {activeMissedQuestion.question.explanation ? (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded">
                      {activeMissedQuestion.question.explanation}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setMissedQuestionDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
