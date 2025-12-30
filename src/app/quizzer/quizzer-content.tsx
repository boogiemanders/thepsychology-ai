'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Zap, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'motion/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { saveQuizResults, getQuizResults, WrongAnswer, getAllQuizResults } from '@/lib/quiz-results-storage'
import { PulseSpinner } from '@/components/PulseSpinner'
import { Confetti, type ConfettiRef } from '@/components/ui/confetti'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { recordStudySession } from '@/lib/study-sessions'
import { QuestionFeedbackButton } from '@/components/question-feedback-button'
import { computeQuestionKeyClient } from '@/lib/question-key-client'
import { isQuizPass } from '@/lib/quiz-passing'
import { RECOVER_RECOMMENDATION_HOUR_KEY } from '@/lib/recover'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  TypographyH1,
  TypographyH2,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from '@/components/ui/typography'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { LockInDrillButton } from '@/components/lock-in-drill-button'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  relatedSections?: string[]
  isScored?: boolean
}

interface QuizState {
  question: number
  score: number
  selectedAnswers: Record<number, string>
  showResults: boolean
  timeRemaining: number
}

const BRAND_COLORS = {
  softSage: '#bdd1ca',
  coral: '#d87758',
  olive: '#788c5d',
  lavenderGray: '#cbc9db',
  softBlue: '#6a9bcc',
  dustRose: '#c46685',
}

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const normalizeQuestionText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function QuizzerContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { user } = useAuth()
  const topic = searchParams.get('topic')
  const domain = searchParams.get('domain')
  const review = searchParams.get('review')
  const decodeParam = (value: string | null): string => {
    if (!value) return ''
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }
  const decodedTopic = decodeParam(topic)
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
  const modifierLabel = isMac ? 'Option' : 'Alt'
  const confettiRef = useRef<ConfettiRef>(null)
  const questionContentRef = useRef<HTMLDivElement | null>(null)
  const [textFormats, setTextFormats] = useState<Record<number, { question: string; options: string[] }>>({})
  const lastSelectionRef = useRef<{ text: string; questionIndex: number } | null>(null)
  const initialReturnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const [returnTo, setReturnTo] = useState(initialReturnTo)
  const recoverHref = `/recover?entry=quick-reset&returnTo=${encodeURIComponent(returnTo || pathname)}`

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [effectiveDomain, setEffectiveDomain] = useState<string | null>(null)
  const [quizState, setQuizState] = useState<QuizState>({
    question: 0,
    score: 0,
    selectedAnswers: {},
    showResults: false,
    timeRemaining: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [isFirstQuiz, setIsFirstQuiz] = useState(false)
  const [recentQuizSectionsParam, setRecentQuizSectionsParam] = useState('')
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({})
  const quizStartedAtRef = useRef<number | null>(null)
  const wrongStreakRef = useRef(0)
  const [showRecoverNudge, setShowRecoverNudge] = useState(false)
  const [recoverRecommendationFromHour, setRecoverRecommendationFromHour] = useState(false)

  const quizStateRef = useRef<QuizState>(quizState)
  useEffect(() => {
    quizStateRef.current = quizState
  }, [quizState])

  useEffect(() => {
    if (!quizStarted || quizStartedAtRef.current) return
    quizStartedAtRef.current = Date.now()
  }, [quizStarted])

  useEffect(() => {
    if (!user?.id) return
    const start = Date.now()

    return () => {
      const end = Date.now()
      const durationSeconds = Math.round((end - start) / 1000)
      if (durationSeconds < 5) return
      recordStudySession({
        userId: user.id,
        feature: 'quizzer',
        startedAt: new Date(start),
        endedAt: new Date(end),
        durationSeconds,
        metadata: {
          topic: decodedTopic,
          domain,
        },
      })
    }
  }, [user?.id, decodedTopic, domain])

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const resolveSelectionText = useCallback(() => {
    if (typeof window === 'undefined') return null

    const selection = window.getSelection()
    const container = questionContentRef.current
    if (!selection || !container) return null
    if (selection.rangeCount === 0) return null

    const selectedText = selection.toString()
    if (!selectedText.trim()) return lastSelectionRef.current?.questionIndex === quizState.question ? lastSelectionRef.current.text : null

    const anchorInside = selection.anchorNode ? container.contains(selection.anchorNode) : false
    const focusInside = selection.focusNode ? container.contains(selection.focusNode) : false

    if (anchorInside || focusInside) {
      lastSelectionRef.current = {
        text: selectedText,
        questionIndex: quizState.question,
      }
      return selectedText
    }

    if (lastSelectionRef.current?.questionIndex === quizState.question) {
      return lastSelectionRef.current.text
    }

    return null
  }, [quizState.question])

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      const container = questionContentRef.current
      if (!selection || !container || selection.rangeCount === 0) return
      const selectedText = selection.toString()
      if (!selectedText.trim()) return
      const anchorInside = selection.anchorNode ? container.contains(selection.anchorNode) : false
      const focusInside = selection.focusNode ? container.contains(selection.focusNode) : false

      if (anchorInside || focusInside) {
        lastSelectionRef.current = {
          text: selectedText,
          questionIndex: quizState.question,
        }
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [quizState.question])

  useEffect(() => {
    lastSelectionRef.current = null
  }, [quizState.question])

  const applyTextFormat = useCallback(
    (selectedText: string, tagName: 'mark' | 'del') => {
      const question = questions[quizState.question]
      if (!question) return

      const currentFormat = textFormats[quizState.question]
      const baseQuestion = currentFormat?.question ?? escapeHtml(question.question)
      const baseOptions = currentFormat?.options ?? question.options.map(escapeHtml)

      const wrapTag = () => {
        const el = document.createElement(tagName)
        el.style.fontFamily = 'inherit'
        el.style.fontSize = 'inherit'
        el.style.fontWeight = 'inherit'
        el.style.lineHeight = 'inherit'
        if (tagName === 'mark') {
          el.style.backgroundColor = BRAND_COLORS.softSage
          el.style.color = '#0b1f13'
        } else {
          el.style.textDecoration = 'line-through'
        }
        el.textContent = selectedText
        return el
      }

      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
          const text = node.textContent
          if (text.includes(selectedText)) {
            const parts = text.split(selectedText)
            const fragment = document.createDocumentFragment()

            parts.forEach((part, index) => {
              if (part) fragment.appendChild(document.createTextNode(part))
              if (index < parts.length - 1) {
                fragment.appendChild(wrapTag())
              }
            })

            node.parentNode?.replaceChild(fragment, node)
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          Array.from(node.childNodes).forEach(processNode)
        }
      }

      const tempQuestion = document.createElement('div')
      tempQuestion.innerHTML = baseQuestion
      processNode(tempQuestion)

      const updatedOptions = baseOptions.map((option) => {
        const optDiv = document.createElement('div')
        optDiv.innerHTML = option
        processNode(optDiv)
        return optDiv.innerHTML
      })

      setTextFormats((prev) => ({
        ...prev,
        [quizState.question]: {
          question: tempQuestion.innerHTML,
          options: updatedOptions,
        },
      }))
      lastSelectionRef.current = null
    },
    [questions, quizState.question, textFormats]
  )

  const handleHighlightText = useCallback(() => {
    const selectedText = resolveSelectionText()
    if (!selectedText) return
    applyTextFormat(selectedText, 'mark')
  }, [applyTextFormat, resolveSelectionText])

  const handleStrikethroughText = useCallback(() => {
    const selectedText = resolveSelectionText()
    if (!selectedText) return
    applyTextFormat(selectedText, 'del')
  }, [applyTextFormat, resolveSelectionText])

  const handlePrevious = useCallback(() => {
    setQuizState((prev) => ({
      ...prev,
      question: Math.max(0, prev.question - 1),
    }))
    setError(null)
  }, [])

  const persistQuizResults = useCallback(
    async (
      attempt: {
        topic: string
        domain?: string | null
        score: number
        totalQuestions: number
        correctQuestions: number
        durationSeconds?: number | null
        questionAttempts: Array<{
          questionId: string
          question: string
          options?: string[]
          selectedAnswer: string
          correctAnswer: string
          isCorrect: boolean
          isScored?: boolean
          relatedSections?: string[]
        }>
      }
    ) => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        const token = data.session?.access_token
        if (!token) return

        await fetch('/api/save-quiz-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            ...attempt,
          }),
        })
      } catch (err) {
        console.error('[Quizzer] Failed to save quiz results:', err)
      }
    },
    [user?.id]
  )

  const handleNext = useCallback(() => {
    const state = quizStateRef.current
    const currentIndex = state.question
    if (currentIndex >= questions.length) return

    const selectedAnswer = state.selectedAnswers[currentIndex]
    if (!selectedAnswer) {
      setError('Please select an answer')
      return
    }

    const currentQuestion = questions[currentIndex]
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    if (currentQuestion.isScored !== false) {
      wrongStreakRef.current = isCorrect ? 0 : wrongStreakRef.current + 1
      if (wrongStreakRef.current >= 3) {
        setShowRecoverNudge(true)
      }
    }

    if (currentIndex < questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        question: prev.question + 1,
        score: prev.score + (isCorrect && currentQuestion.isScored !== false ? 1 : 0),
      }))
      setError(null)
      return
    }

    const finalScore = state.score + (isCorrect && currentQuestion.isScored !== false ? 1 : 0)
    const scoredQuestionCount = questions.filter(q => q.isScored !== false).length
    const wrongAnswers: WrongAnswer[] = []
    const correctAnswers = []

    questions.forEach((q, idx) => {
      const selected = state.selectedAnswers[idx] ?? ''
      const questionWasCorrect = selected === q.correctAnswer
      const questionKey = computeQuestionKeyClient({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })

      if (!questionWasCorrect) {
        wrongAnswers.push({
          questionId: q.id,
          questionKey,
          question: q.question,
          selectedAnswer: selected,
          correctAnswer: q.correctAnswer,
          relatedSections: q.relatedSections || [],
          timestamp: Date.now(),
          options: q.options,           // Save options for dialog
          explanation: q.explanation,   // Save explanation for dialog
          isScored: q.isScored !== false,
          isResolved: false,            // Mark as unresolved initially
        })
      } else {
        correctAnswers.push({
          questionId: q.id,
          questionKey,
          question: q.question,
          correctAnswer: q.correctAnswer,
          options: q.options,
          explanation: q.explanation,
          isScored: q.isScored !== false,
          relatedSections: q.relatedSections || [],
          timestamp: Date.now(),
        })
      }
    })

    const previousResults = decodedTopic ? getQuizResults(decodedTopic) : null
    const keyFor = (entry: { questionKey?: string; questionId?: number }) =>
      entry.questionKey || `id:${entry.questionId ?? -1}`

    const mergedWrongByKey = new Map<string, WrongAnswer>()
    previousResults?.wrongAnswers?.forEach((wa) => {
      if (!wa) return
      mergedWrongByKey.set(keyFor(wa), wa)
    })

    correctAnswers.forEach((ca) => {
      const key = keyFor(ca as any)
      const existing = mergedWrongByKey.get(key)
      if (existing && existing.isResolved !== true) {
        ;(ca as any).wasPreviouslyWrong = true
      }
      if (existing) {
        existing.isResolved = true
        existing.timestamp = Date.now()
      }
    })

    wrongAnswers.forEach((wa) => {
      const key = keyFor(wa)
      const existing = mergedWrongByKey.get(key)
      mergedWrongByKey.set(key, {
        ...(existing ?? {}),
        ...wa,
        isResolved: false,
        timestamp: Date.now(),
      })
    })

    const mergedWrongAnswers = Array.from(mergedWrongByKey.values()).sort(
      (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)
    )

    const recentSections = Array.from(
      new Set(wrongAnswers.flatMap((wa) => wa.relatedSections || []))
    )

    const quizResults = {
      topic: decodedTopic,
      timestamp: Date.now(),
      score: finalScore,
      totalQuestions: scoredQuestionCount,
      wrongAnswers: mergedWrongAnswers,
      correctAnswers,
      lastAttemptWrongAnswers: wrongAnswers,
      lastAttemptCorrectAnswers: correctAnswers,
    }

    saveQuizResults(quizResults)

    const questionAttempts = questions
      .map((q, idx) => {
        const selected = state.selectedAnswers[idx]
        if (!selected) return null
        return {
          questionId: String(q.id),
          question: q.question,
          options: q.options,
          selectedAnswer: selected,
          correctAnswer: q.correctAnswer,
          isCorrect: selected === q.correctAnswer,
          isScored: q.isScored !== false,
          relatedSections: q.relatedSections || [],
        }
      })
      .filter(Boolean) as Array<{
      questionId: string
      question: string
      options?: string[]
      selectedAnswer: string
      correctAnswer: string
      isCorrect: boolean
      isScored?: boolean
      relatedSections?: string[]
    }>

    const durationSeconds = quizStartedAtRef.current
      ? Math.max(Math.round((Date.now() - quizStartedAtRef.current) / 1000), 0)
      : Math.max(questions.length * 68 - (state.timeRemaining || 0), 0)

    void persistQuizResults({
      topic: decodedTopic || 'unknown',
      domain,
      score: finalScore,
      totalQuestions: scoredQuestionCount,
      correctQuestions: finalScore,
      durationSeconds,
      questionAttempts,
    })

    const resultsParam = encodeURIComponent(JSON.stringify(quizResults))
    const sectionsParam = encodeURIComponent(JSON.stringify(recentSections))
    window.history.replaceState(
      null,
      '',
      `?topic=${encodeURIComponent(topic || '')}&quizResults=${resultsParam}&recentQuizWrongSections=${sectionsParam}`
    )
    setRecentQuizSectionsParam(sectionsParam)

    setQuizState((prev) => ({
      ...prev,
      showResults: true,
      score: finalScore,
    }))
    wrongStreakRef.current = 0
  }, [questions, topic, decodedTopic])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isTimeWarning = quizState.timeRemaining > 0 && quizState.timeRemaining <= 120
  const scoredQuestionCount = questions.filter(q => q.isScored !== false).length
  const passedQuiz = isQuizPass(quizState.score, scoredQuestionCount)
  const recoverIsRecommended = showRecoverNudge || recoverRecommendationFromHour

  const handleRecoverClick = () => {
    wrongStreakRef.current = 0
    setShowRecoverNudge(false)
    setRecoverRecommendationFromHour(false)
    try {
      localStorage.removeItem(RECOVER_RECOMMENDATION_HOUR_KEY)
    } catch (error) {
      console.debug('Failed to clear recover recommendation flag:', error)
    }
  }

  const generateQuiz = async () => {
    if (!topic) return

    try {
      setIsLoading(true)
      setError(null)

      const fetchFreshQuiz = async (): Promise<{ questions: QuizQuestion[]; domainId: string | null }> => {
        const response = await fetch('/api/quizzer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic, domain, userId: user?.id ?? null }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate quiz')
        }

        const data = await response.json()
        const questionsData: QuizQuestion[] = Array.isArray(data.questions) ? data.questions : []
        const domainId: string | null = data.domainId ?? null

        const questions = shuffleArray(questionsData).map((q, idx) => ({
          ...q,
          options: shuffleArray(q.options),
          id: idx,
        }))

        return { questions, domainId }
      }

      if (review === 'wrong' && decodedTopic) {
        const previous = getQuizResults(decodedTopic)
        const lastAttemptWrong =
          previous?.lastAttemptWrongAnswers ??
          previous?.wrongAnswers
            ?.filter((wa) => wa && wa.isResolved !== true)
            .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
            .slice(0, 10) ??
          []
        const lastAttemptCorrect =
          previous?.lastAttemptCorrectAnswers ?? previous?.correctAnswers ?? []

        const eligibleWrong = lastAttemptWrong.filter(
          (wa) => Array.isArray(wa.options) && wa.options.length >= 2 && typeof wa.correctAnswer === 'string' && wa.correctAnswer.length > 0
        )

        if (eligibleWrong.length > 0) {
          type GeneratedQuestion = QuizQuestion & { __source: 'wrong' | 'new' }

          const TOTAL_QUESTIONS = 10
          const TARGET_UNSCORED = 2

          const exclude = new Set<string>()
          const addExclude = (text: string | null | undefined) => {
            if (!text) return
            const normalized = normalizeQuestionText(text)
            if (normalized) exclude.add(normalized)
          }

          eligibleWrong.forEach((wa) => addExclude(wa.question))
          lastAttemptCorrect.forEach((ca) => addExclude((ca as any)?.question))
          previous?.wrongAnswers?.forEach((wa) => {
            if (wa?.isResolved) addExclude(wa.question)
          })

          const retryQuestions: GeneratedQuestion[] = shuffleArray(eligibleWrong)
            .slice(0, TOTAL_QUESTIONS)
            .map((wa) => ({
              id: 0,
              question: wa.question,
              options: shuffleArray([...(wa.options ?? [])]),
              correctAnswer: wa.correctAnswer,
              explanation: wa.explanation ?? '',
              relatedSections: wa.relatedSections || [],
              isScored: wa.isScored !== false,
              __source: 'wrong',
            }))

          const assembled: GeneratedQuestion[] = [...retryQuestions]
          const candidatesScored: GeneratedQuestion[] = []
          const candidatesUnscored: GeneratedQuestion[] = []

          const pushCandidate = (q: QuizQuestion) => {
            const normalized = normalizeQuestionText(q.question)
            if (!normalized || exclude.has(normalized)) return
            exclude.add(normalized)
            const wrapped: GeneratedQuestion = { ...q, __source: 'new' }
            if (q.isScored === false) candidatesUnscored.push(wrapped)
            else candidatesScored.push(wrapped)
          }

          const maxFetchAttempts = 3
          let fetchedDomainId: string | null = null
          for (let attempt = 0; attempt < maxFetchAttempts && assembled.length < TOTAL_QUESTIONS; attempt++) {
            const freshResult = await fetchFreshQuiz().catch(() => null)
            if (!freshResult) break
            if (!fetchedDomainId && freshResult.domainId) fetchedDomainId = freshResult.domainId
            freshResult.questions.forEach((q) => pushCandidate(q))
          }

          const countUnscored = (qs: Array<{ isScored?: boolean }>) =>
            qs.filter((q) => q.isScored === false).length

          while (assembled.length < TOTAL_QUESTIONS) {
            const currentUnscored = countUnscored(assembled)
            const needsUnscored = currentUnscored < TARGET_UNSCORED

            let next: GeneratedQuestion | undefined
            if (needsUnscored && candidatesUnscored.length > 0) {
              next = candidatesUnscored.shift()
              if (next) next.isScored = false
            } else if (candidatesScored.length > 0) {
              next = candidatesScored.shift()
              if (next) next.isScored = true
            } else if (candidatesUnscored.length > 0) {
              next = candidatesUnscored.shift()
              if (next) next.isScored = true
            } else {
              break
            }

            if (next) assembled.push(next)
          }

          if (assembled.length < TOTAL_QUESTIONS) {
            const fallbackResult = await fetchFreshQuiz().catch(() => ({ questions: [], domainId: null }))
            if (!fetchedDomainId && fallbackResult.domainId) fetchedDomainId = fallbackResult.domainId
            for (const q of fallbackResult.questions) {
              if (assembled.length >= TOTAL_QUESTIONS) break
              const normalized = normalizeQuestionText(q.question)
              if (!normalized) continue
              if (assembled.some((existing) => normalizeQuestionText(existing.question) === normalized)) continue
              assembled.push({ ...q, __source: 'new', isScored: true })
            }
          }

          // Enforce exactly 2 unscored questions, preferring "new" questions for unscored slots.
          let currentUnscored = countUnscored(assembled)
          if (currentUnscored > TARGET_UNSCORED) {
            for (let i = assembled.length - 1; i >= 0 && currentUnscored > TARGET_UNSCORED; i--) {
              if (assembled[i].isScored === false && assembled[i].__source === 'new') {
                assembled[i].isScored = true
                currentUnscored--
              }
            }
            for (let i = assembled.length - 1; i >= 0 && currentUnscored > TARGET_UNSCORED; i--) {
              if (assembled[i].isScored === false) {
                assembled[i].isScored = true
                currentUnscored--
              }
            }
          } else if (currentUnscored < TARGET_UNSCORED) {
            for (let i = assembled.length - 1; i >= 0 && currentUnscored < TARGET_UNSCORED; i--) {
              if (assembled[i].isScored !== false && assembled[i].__source === 'new') {
                assembled[i].isScored = false
                currentUnscored++
              }
            }
            for (let i = assembled.length - 1; i >= 0 && currentUnscored < TARGET_UNSCORED; i--) {
              if (assembled[i].isScored !== false) {
                assembled[i].isScored = false
                currentUnscored++
              }
            }
          }

          const finalQuestions = shuffleArray(assembled)
            .slice(0, TOTAL_QUESTIONS)
            .map((q, idx) => ({
              id: idx,
              question: q.question,
              options: shuffleArray(q.options),
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              relatedSections: q.relatedSections || [],
              isScored: q.isScored !== false,
            })) as QuizQuestion[]

          setQuestions(finalQuestions)
          setEffectiveDomain(fetchedDomainId ?? domain ?? null)
          const initialFormats: Record<number, { question: string; options: string[] }> = {}
          finalQuestions.forEach((q, idx) => {
            initialFormats[idx] = {
              question: escapeHtml(q.question),
              options: q.options.map(escapeHtml),
            }
          })
          setTextFormats(initialFormats)
          lastSelectionRef.current = null
          return
        }
      }

      const quizResult = await fetchFreshQuiz()

      const finalQuestions = quizResult.questions.slice(0, 10)
      setQuestions(finalQuestions)
      setEffectiveDomain(quizResult.domainId ?? domain ?? null)
      const initialFormats: Record<number, { question: string; options: string[] }> = {}
      finalQuestions.forEach((q, idx) => {
        initialFormats[idx] = {
          question: escapeHtml(q.question),
          options: q.options.map(escapeHtml),
        }
      })
      setTextFormats(initialFormats)
      lastSelectionRef.current = null
    } catch (err) {
      console.error('Error generating quiz:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to generate quiz'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Check if this is the user's first quiz ever
  useEffect(() => {
    const allResults = getAllQuizResults()
    setIsFirstQuiz(allResults.length === 0)
  }, [])

  // Fire confetti on quiz completion
  useEffect(() => {
    if (quizState.showResults) {
      const scoredQuestionCount = questions.filter(q => q.isScored !== false).length
      const passed = isQuizPass(quizState.score, scoredQuestionCount)
      // Fire confetti if: first quiz (regardless of pass/fail) OR passed (subsequent quizzes)
      if (isFirstQuiz || passed) {
        setTimeout(() => {
          confettiRef.current?.fire({})
        }, 500)
      }
    }
  }, [quizState.showResults, isFirstQuiz, quizState.score, questions])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(RECOVER_RECOMMENDATION_HOUR_KEY)
    setRecoverRecommendationFromHour(stored === '1')
  }, [quizState.showResults])

  useEffect(() => {
    if (!quizState.showResults || typeof window === 'undefined') return
    setReturnTo(`${window.location.pathname}${window.location.search}`)
  }, [quizState.showResults])

  // Auto-generate quiz when page loads with a topic
  useEffect(() => {
    if (topic && questions.length === 0 && !isLoading) {
      generateQuiz()
    } else if (!topic && questions.length === 0 && !isLoading) {
      setError('No topic provided')
    }
  }, [topic, review])

  // Timer effect: 68 seconds per question
  useEffect(() => {
    if (!quizStarted || quizState.showResults || questions.length === 0) return

    const totalSeconds = questions.length * 68

    // Initialize time remaining on quiz start
    if (quizState.timeRemaining === 0) {
      setQuizState((prev) => ({
        ...prev,
        timeRemaining: totalSeconds,
      }))
      return
    }

    const timer = setInterval(() => {
      setQuizState((prev) => {
        const newTime = prev.timeRemaining - 1

        // Auto-submit if time runs out
        if (newTime <= 0) {
          // Mark quiz as finished without calling handleNext (which has issues)
          setTimeout(() => {
            handleNext()
          }, 0)
          return prev
        }

        return {
          ...prev,
          timeRemaining: newTime,
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizStarted, quizState.showResults, questions.length, quizState.timeRemaining])

  useEffect(() => {
    if (!quizStarted || questions.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const modifier = e.altKey
      if (!modifier) return

      const key = (e.code || e.key || '').toLowerCase()
      if (key === 'keyp' || key === 'p') {
        e.preventDefault()
        handlePrevious()
        return
      }

      if ((key === 'keyn' || key === 'n') && quizStateRef.current.selectedAnswers[quizStateRef.current.question]) {
        e.preventDefault()
        handleNext()
        return
      }

      if (
        (key === 'keye' || key === 'e') &&
        quizStateRef.current.question === questions.length - 1 &&
        quizStateRef.current.selectedAnswers[quizStateRef.current.question]
      ) {
        e.preventDefault()
        handleNext()
        return
      }

      if (key === 'keyh' || key === 'h') {
        e.preventDefault()
        handleHighlightText()
        return
      }

      if (key === 'keys' || key === 's') {
        e.preventDefault()
        handleStrikethroughText()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [quizStarted, questions.length, handleNext, handlePrevious, handleHighlightText, handleStrikethroughText])

  const handleSelectAnswer = (option: string) => {
    if (quizState.showResults) return

    setQuizState((prev) => ({
      ...prev,
      selectedAnswers: {
        ...prev.selectedAnswers,
        [quizState.question]: option,
      },
    }))
  }

  if (!topic) {
    return (
      <main className="min-h-screen p-6 bg-background exam-ui">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/topic-selector">Topic Selector</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Quiz</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="text-center py-20 space-y-3">
            <TypographyH1 className="text-center">No lesson selected</TypographyH1>
            <TypographyMuted className="text-base text-center">
              Please select a lesson first
            </TypographyMuted>
            <Link href="/topic-selector">
              <Button>Go to Lessons</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 bg-background relative exam-ui">
      {/* Confetti Canvas */}
      <Confetti
        ref={confettiRef}
        className="fixed top-0 left-0 z-50 size-full pointer-events-none"
      />

      <div className="max-w-2xl mx-auto">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/topic-selector">Topic Selector</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{decodedTopic || 'Quiz'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isLoading ? (
            <PulseSpinner message="Generating your quiz..." />
          ) : questions.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-muted-foreground">
                <p>No quiz available. Please go back and select a topic.</p>
              </div>
            </div>
          ) : !quizStarted ? (
            <div className="text-center py-20 space-y-3">
              <TypographyH1 className="text-center">
                Quiz - {decodedTopic || 'Selected Topic'}
              </TypographyH1>
              <TypographyMuted className="text-lg text-center">
                10 questions · Total time: {formatTime(questions.length * 68)}
              </TypographyMuted>
              <Button
                onClick={() => {
                  wrongStreakRef.current = 0
                  setShowRecoverNudge(false)
                  setQuizStarted(true)
                }}
                size="lg"
                variant="minimal"
                className="gap-2"
              >
                Start
              </Button>
            </div>
          ) : quizState.showResults ? (
            <div className="py-10">
              {/* Score Summary */}
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-primary mb-2">
                  {quizState.score}/{scoredQuestionCount}
                </div>
                <p className="text-muted-foreground">
                  {Math.round(
                    scoredQuestionCount > 0
                      ? (quizState.score / scoredQuestionCount) * 100
                      : 0
                  )}% Correct
                </p>
              </div>

              {passedQuiz ? (
                <div className="rounded-lg p-6 mb-6">
                  <CheckCircle2
                    className="mx-auto mb-3"
                    style={{ color: BRAND_COLORS.softBlue }}
                  />
                  <h3 className="font-semibold mb-2" style={{ color: BRAND_COLORS.softBlue }}>
                    Excellent! Topic Mastered
                  </h3>
                  <TypographyMuted>
                    You've demonstrated mastery of this topic. Great work!
                  </TypographyMuted>
                </div>
              ) : (
                <div className="rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-2" style={{ color: BRAND_COLORS.coral }}>
                    Keep Practicing
                  </h3>
                  <TypographyMuted>
                    Review the material and try again to improve your score.
                  </TypographyMuted>
                </div>
              )}

              {/* Detailed Question Breakdown */}
              <div className="space-y-4 mb-6">
                <TypographyH2 className="text-center border-none">Review Your Answers</TypographyH2>
                {questions.map((q, idx) => {
                  const selectedAnswer = quizState.selectedAnswers[idx]
                  const isCorrect = selectedAnswer === q.correctAnswer

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative rounded-lg p-6 border border-border"
                    >
                      <div className="absolute right-3 top-3">
                        <QuestionFeedbackButton
                          examType="quiz"
                          questionId={q.id}
                          question={q.question}
                          options={q.options}
                          selectedAnswer={selectedAnswer ?? null}
                          correctAnswer={q.correctAnswer ?? null}
                          wasCorrect={typeof selectedAnswer === 'string' ? isCorrect : null}
                          metadata={{
                            topic: decodedTopic || null,
                            domain: domain || null,
                            relatedSections: q.relatedSections || [],
                            isScored: q.isScored !== false,
                            source: 'quiz-review',
                          }}
                          className="h-8 w-8"
                        />
                      </div>
                      {/* Question Header */}
                      <div className="flex items-start gap-3 mb-4">
                        {isCorrect ? (
                          <CheckCircle2
                            className="flex-shrink-0 mt-1"
                            size={20}
                            style={{ color: BRAND_COLORS.softSage }}
                          />
                        ) : (
                          <XCircle
                            className="flex-shrink-0 mt-1"
                            size={20}
                            style={{ color: BRAND_COLORS.coral }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-semibold text-muted-foreground">
                              Question {idx + 1}
                            </span>
                            {!q.isScored && (
                              <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5 rounded border"
                                style={{
                                  borderColor: BRAND_COLORS.lavenderGray,
                                  color: BRAND_COLORS.lavenderGray,
                                }}
                              >
                                Unscored
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-0.5 rounded border"
                              style={{
                                borderColor: isCorrect ? BRAND_COLORS.softSage : BRAND_COLORS.coral,
                                color: isCorrect ? BRAND_COLORS.softSage : BRAND_COLORS.coral,
                              }}
                            >
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                          </div>
                          <p className="text-base font-medium mb-4">{q.question}</p>

                          {/* Answer Options */}
                          <div className="space-y-2 mb-4">
                            {q.options.map((option, optIdx) => {
                              const optionLetter = String.fromCharCode(65 + optIdx)
                              const isThisCorrect = option === q.correctAnswer
                              const isThisSelected = option === selectedAnswer

                              return (
                                <div
                                  key={optIdx}
                                  className="p-3 rounded-lg border"
                                  style={{
                                    borderColor: isThisCorrect
                                      ? BRAND_COLORS.softSage
                                      : isThisSelected
                                      ? BRAND_COLORS.coral
                                      : 'var(--border)',
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="font-semibold">{optionLetter}.</span>
                                    <span className="flex-1">{option}</span>
                                    {isThisCorrect && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-2 py-0.5 rounded border flex-shrink-0"
                                        style={{
                                          borderColor: BRAND_COLORS.softSage,
                                          color: BRAND_COLORS.softSage,
                                        }}
                                      >
                                        Correct Answer
                                      </Badge>
                                    )}
                                    {isThisSelected && !isThisCorrect && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-2 py-0.5 rounded border flex-shrink-0"
                                        style={{
                                          borderColor: BRAND_COLORS.coral,
                                          color: BRAND_COLORS.coral,
                                        }}
                                      >
                                        Your Answer
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Explanation - expanded by default */}
                          <div className="rounded-lg border border-border p-4">
                            <h4 className="text-sm font-semibold mb-2">Explanation</h4>
                            <p className="text-sm text-muted-foreground">
                              {q.explanation}
                            </p>
                          </div>

                          {/* Action buttons for wrong answers */}
                          {!isCorrect && selectedAnswer && (
                            <div className="mt-3 flex flex-wrap gap-2 items-center">
                              <LockInDrillButton
                                topicName={decodedTopic || ''}
                                domainId={domain || null}
                                question={q.question}
                                options={q.options}
                                correctAnswer={q.correctAnswer}
                                explanation={q.explanation}
                                selectedAnswer={selectedAnswer}
                                relatedSections={q.relatedSections || null}
                                userId={user?.id ?? null}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link href="/topic-selector" className="block">
                  <Button variant="minimal" className="w-full">
                    Select Another Topic
                  </Button>
                </Link>
                {!passedQuiz && (
                  <Link
                    href={`/topic-teacher?topic=${encodeURIComponent(decodedTopic || '')}&hasQuizResults=true${
                      recentQuizSectionsParam
                        ? `&recentQuizWrongSections=${recentQuizSectionsParam}`
                        : ''
                    }`}
                    className="block"
                  >
                    <Button className="w-full">Relearn the Topic</Button>
                  </Link>
                )}
                <Link href={recoverHref} className="block" onClick={handleRecoverClick}>
                  <Button variant="minimal" className="w-full">
                    <span className="flex items-center justify-center gap-2">
                      Take a 5-minute reset in Recover
                      {recoverIsRecommended && (
                        <span className="rounded-full border border-amber-400/60 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:border-amber-300/50 dark:bg-amber-300/10 dark:text-amber-200">
                          Recommended
                        </span>
                      )}
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header with Question Number, Progress, and Timer */}
              <div className="sticky top-0 z-40 bg-background border-b border-border pb-4 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Badge variant="outline" style={{ fontFamily: 'Tahoma' }}>Quiz</Badge>
                    </div>
                    <p className="text-base font-normal text-foreground" style={{ fontFamily: 'Tahoma' }}>
                      Question {quizState.question + 1} of {questions.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-base font-normal text-foreground" style={{ fontFamily: 'Tahoma' }}>
                    <Clock className="w-4 h-4" />
                    <span className={isTimeWarning ? 'text-red-500' : ''}>
                      {formatTime(quizState.timeRemaining)}
                    </span>
                  </div>
                </div>
                <Progress value={((quizState.question + 1) / questions.length) * 100} className="h-1" />
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex flex-col gap-1 items-start">
                  <Button
                    onClick={handleHighlightText}
                    variant="outline"
                    size="sm"
                    className="rounded-none hover:bg-accent transition-colors"
                    style={{ fontFamily: 'Tahoma' }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    Highlight
                  </Button>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Tahoma' }}>
                    {modifierLabel} + H
                  </span>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <Button
                    onClick={handleStrikethroughText}
                    variant="outline"
                    size="sm"
                    className="rounded-none hover:bg-accent transition-colors"
                    style={{ fontFamily: 'Tahoma' }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    Strikeout
                  </Button>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Tahoma' }}>
                    {modifierLabel} + S
                  </span>
                </div>
              </div>

              {/* Question Card */}
              {(() => {
                const currentQuestion = questions[quizState.question]
                const currentFormat = textFormats[quizState.question]
                const questionHtml = currentFormat?.question ?? escapeHtml(currentQuestion?.question ?? '')
                const optionHtml = currentFormat?.options ?? currentQuestion?.options.map(escapeHtml) ?? []

                return (
                  <div ref={questionContentRef}>
                    <Card className="rounded-none">
                      <CardHeader>
                        <CardTitle
                          className="text-base font-normal leading-relaxed text-foreground select-text"
                          style={{ fontFamily: 'Tahoma' }}
                          dangerouslySetInnerHTML={{ __html: questionHtml }}
                        />
                      </CardHeader>
                      <Separator />
                      <CardContent className="pt-6">
                        {/* Answer Options - Radio Style */}
                        <div className="space-y-3">
                          {questions[quizState.question]?.options.map((option, idx) => {
                            const isSelected = quizState.selectedAnswers[quizState.question] === option
                            const optionLetter = String.fromCharCode(65 + idx)
                            const optionContent = optionHtml[idx] ?? escapeHtml(option)

                            return (
                              <div key={idx} className="flex items-start gap-3 p-2">
                                {/* Radio Button - Only This is Clickable */}
                                <motion.button
                                  whileHover={!quizState.showResults ? { scale: 1.15 } : {}}
                                  onClick={() => !quizState.showResults && handleSelectAnswer(option)}
                                  disabled={quizState.showResults}
                                  className={`flex-shrink-0 mt-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
                                    isSelected ? 'scale-110' : ''
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? 'border-foreground bg-foreground'
                                      : 'border-muted-foreground bg-transparent hover:border-foreground'
                                  }`}>
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                  </div>
                                </motion.button>

                                {/* Option Text - Not Clickable */}
                                <div className="flex-1 min-w-0 pt-1">
                                  <div className="text-base text-foreground" style={{ fontFamily: 'Tahoma' }}>
                                    <span>{optionLetter}.</span>{' '}
                                    <span style={{ fontFamily: 'Tahoma' }} dangerouslySetInnerHTML={{ __html: optionContent }} />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })()}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              {/* Navigation - Sticky Bottom */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="sticky bottom-0 bg-card border-t border-border shadow-lg p-6 mt-8"
              >
                <div className="flex items-center justify-between gap-6">
                  {/* Flag + Feedback on Left */}
                  <div className="flex items-center gap-3">
                    <label className="inline-flex h-10 items-center gap-3 cursor-pointer group hover:bg-accent px-3 rounded transition-colors">
                      <Checkbox
                        checked={flaggedQuestions[quizState.question] || false}
                        onCheckedChange={(checked) => {
                          setFlaggedQuestions(prev => ({
                            ...prev,
                            [quizState.question]: checked === true
                          }))
                        }}
                        id={`flag-q${quizState.question}`}
                      />
                      <span className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ fontFamily: 'Tahoma' }}>
                        Flag for review
                      </span>
                    </label>
                    {questions[quizState.question] && (
                      <QuestionFeedbackButton
                        examType="quiz"
                        questionId={questions[quizState.question].id}
                        question={questions[quizState.question].question}
                        options={questions[quizState.question].options}
                        selectedAnswer={quizState.selectedAnswers[quizState.question] ?? null}
                        correctAnswer={questions[quizState.question].correctAnswer ?? null}
                        wasCorrect={
                          typeof quizState.selectedAnswers[quizState.question] === 'string'
                            ? quizState.selectedAnswers[quizState.question] === questions[quizState.question].correctAnswer
                            : null
                        }
                        metadata={{
                          topic: decodedTopic || null,
                          domain: domain || null,
                          relatedSections: questions[quizState.question].relatedSections || [],
                          isScored: questions[quizState.question].isScored !== false,
                          source: 'quiz-navigation',
                        }}
                        className="h-10 w-10"
                      />
                    )}
                  </div>

                  {/* Navigation Buttons on Right */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handlePrevious}
                      disabled={quizState.question === 0}
                      className="min-w-[120px] rounded-none"
                      variant="outline"
                      style={{ fontFamily: 'Tahoma' }}
                      title={`${modifierLabel} + P`}
                    >
                      Previous
                    </Button>

                    <Button
                      onClick={handleNext}
                      disabled={!quizState.selectedAnswers[quizState.question]}
                      className="min-w-[120px] rounded-none"
                      style={{ fontFamily: 'Tahoma' }}
                      title={`${modifierLabel} + ${quizState.question === questions.length - 1 ? 'E' : 'N'}`}
                    >
                      {quizState.question === questions.length - 1 ? 'Finish Quiz' : 'Next'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
