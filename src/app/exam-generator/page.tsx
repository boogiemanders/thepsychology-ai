'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'motion/react'
import { LoadingAnimation } from '@/components/ui/loading-animation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getRecommendedDefaults, getExamHistory } from '@/lib/exam-history'
import { triggerBackgroundPreGeneration } from '@/lib/pre-generated-exams'
import { createClient } from '@supabase/supabase-js'

interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  domain: string
  difficulty: string
  type: string
  isScored?: boolean
  knId?: string
}

export default function ExamGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [examType, setExamType] = useState<'diagnostic' | 'practice' | null>(null)
  const [mode, setMode] = useState<'study' | 'test' | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'study' | 'test'>('study')
  const [recommendedExamType, setRecommendedExamType] = useState<'diagnostic' | 'practice'>('diagnostic')
  const [recommendedMode, setRecommendedMode] = useState<'study' | 'test'>('study')
  const [isLoadingPreGen, setIsLoadingPreGen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({})
  const [textFormats, setTextFormats] = useState<Record<number, { question: string; options: string[] }>>({})
  const [assignmentId, setAssignmentId] = useState<string | null>(null)
  const [isSavingResults, setIsSavingResults] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [hasPausedExam, setHasPausedExam] = useState(false)

  // Apply highlight to selected text (question and answer choices)
  const handleHighlightText = useCallback(() => {
    const selectedText = window.getSelection()?.toString()
    if (selectedText && currentQuestion !== undefined) {
      const question = questions[currentQuestion]
      if (question) {
        // Get current formatted text or original
        const oldQuestion = textFormats[currentQuestion]?.question || question.question

        // Create a temporary div to work with HTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = oldQuestion

        // Function to wrap matching text nodes with <mark>
        const highlightTextNode = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const text = node.textContent
            if (text.includes(selectedText)) {
              const parts = text.split(selectedText)
              const fragment = document.createDocumentFragment()

              parts.forEach((part, index) => {
                if (part) fragment.appendChild(document.createTextNode(part))
                if (index < parts.length - 1) {
                  const mark = document.createElement('mark')
                  mark.style.backgroundColor = 'yellow'
                  mark.style.color = 'black'
                  mark.textContent = selectedText
                  fragment.appendChild(mark)
                }
              })

              node.parentNode?.replaceChild(fragment, node)
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Recursively process child nodes
            Array.from(node.childNodes).forEach(highlightTextNode)
          }
        }

        highlightTextNode(tempDiv)
        const newQuestion = tempDiv.innerHTML

        // Do the same for options
        const formattedOptions = textFormats[currentQuestion]?.options
        const currentOptions = Array.isArray(formattedOptions) ? formattedOptions : question.options
        const newOptions = currentOptions.map((option: string) => {
          const optDiv = document.createElement('div')
          optDiv.innerHTML = option
          highlightTextNode(optDiv)
          return optDiv.innerHTML
        })

        setTextFormats(prev => ({
          ...prev,
          [currentQuestion]: {
            question: newQuestion,
            options: newOptions
          }
        }))
      }
    }
  }, [currentQuestion, questions, textFormats])

  // Apply strikethrough to selected text (question and answer choices)
  const handleStrikethroughText = useCallback(() => {
    const selectedText = window.getSelection()?.toString()
    if (selectedText && currentQuestion !== undefined) {
      const question = questions[currentQuestion]
      if (question) {
        // Get current formatted text or original
        const oldQuestion = textFormats[currentQuestion]?.question || question.question

        // Create a temporary div to work with HTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = oldQuestion

        // Function to wrap matching text nodes with <del>
        const strikeTextNode = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const text = node.textContent
            if (text.includes(selectedText)) {
              const parts = text.split(selectedText)
              const fragment = document.createDocumentFragment()

              parts.forEach((part, index) => {
                if (part) fragment.appendChild(document.createTextNode(part))
                if (index < parts.length - 1) {
                  const del = document.createElement('del')
                  del.style.textDecoration = 'line-through'
                  del.textContent = selectedText
                  fragment.appendChild(del)
                }
              })

              node.parentNode?.replaceChild(fragment, node)
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Recursively process child nodes
            Array.from(node.childNodes).forEach(strikeTextNode)
          }
        }

        strikeTextNode(tempDiv)
        const newQuestion = tempDiv.innerHTML

        // Do the same for options
        const formattedOptions = textFormats[currentQuestion]?.options
        const currentOptions = Array.isArray(formattedOptions) ? formattedOptions : question.options
        const newOptions = currentOptions.map((option: string) => {
          const optDiv = document.createElement('div')
          optDiv.innerHTML = option
          strikeTextNode(optDiv)
          return optDiv.innerHTML
        })

        setTextFormats(prev => ({
          ...prev,
          [currentQuestion]: {
            question: newQuestion,
            options: newOptions
          }
        }))
      }
    }
    window.getSelection()?.removeAllRanges()
  }, [currentQuestion, questions, textFormats])

  // Save paused exam state to localStorage
  const savePausedExamState = () => {
    if (!examType || !mode || questions.length === 0) return

    const pausedState = {
      examType,
      mode,
      currentQuestion,
      selectedAnswers,
      flaggedQuestions,
      textFormats,
      questions,
      timeRemaining,
      assignmentId,
      pausedAt: new Date().toISOString(),
    }

    localStorage.setItem('pausedExamState', JSON.stringify(pausedState))
  }

  // Handle pause button click
  const handlePause = () => {
    savePausedExamState()
    setIsPaused(true)
  }

  // Resume paused exam
  const handleResume = () => {
    setIsPaused(false)
  }

  // Save and return to dashboard
  const handleSaveAndReturn = () => {
    savePausedExamState()
    window.location.href = '/dashboard'
  }

  // Handle end exam - save results to Supabase and navigate
  const handleEndExam = async () => {
    if (!userId || !examType || !mode) {
      console.error('Missing required data for exam completion')
      return
    }

    setIsSavingResults(true)

    try {
      const scoredQuestions = questions.filter(q => q.isScored !== false)
      const score = Object.entries(selectedAnswers).filter(([qIdx, answer]) => {
        const q = questions[parseInt(qIdx)]
        return q && q.isScored !== false && answer === q.correct_answer
      }).length

      // Save exam completion to local storage
      const { saveExamCompletion } = require('@/lib/exam-history')
      saveExamCompletion({
        examType: examType || 'practice',
        examMode: mode || 'study',
        score: (score / scoredQuestions.length) * 100,
        totalQuestions: scoredQuestions.length,
        correctAnswers: score,
      })

      // Generate priority recommendations if diagnostic exam
      let priorityData = null
      if (examType === 'diagnostic') {
        const { buildPriorityRecommendations, getAllDomainResults } = require('@/lib/priority-calculator')
        const { savePriorityRecommendation } = require('@/lib/priority-storage')

        // Build wrong answers from selected answers
        const wrongAnswers = Object.entries(selectedAnswers)
          .map(([qIdx, answer]) => {
            const q = questions[parseInt(qIdx)]
            if (q && q.isScored !== false && answer !== q.correct_answer) {
              return {
                questionId: parseInt(qIdx) + 1,
                question: q.question,
                selectedAnswer: answer,
                correctAnswer: q.correct_answer,
                relatedSections: [q.domain],
                timestamp: Date.now(),
              }
            }
            return null
          })
          .filter(Boolean)

        const topPriorities = buildPriorityRecommendations(wrongAnswers, scoredQuestions.length)
        const allResults = getAllDomainResults(wrongAnswers)

        priorityData = {
          topPriorities,
          allResults,
        }

        // Save to local storage
        savePriorityRecommendation({
          examType: 'diagnostic',
          examMode: mode || 'study',
          topPriorities,
          allResults,
        })
      }

      // Save to Supabase
      const response = await fetch('/api/save-exam-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          examType,
          examMode: mode,
          questions,
          selectedAnswers,
          flaggedQuestions,
          score,
          totalQuestions: scoredQuestions.length,
          topPriorities: priorityData?.topPriorities || null,
          allResults: priorityData?.allResults || null,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error('Failed to save exam results')
      }

      // Clear paused exam state since exam is now completed
      localStorage.removeItem('pausedExamState')
      setHasPausedExam(false)

      // Navigate with just the result ID (no more URI_TOO_LONG!)
      window.location.href = `/prioritize?id=${data.resultId}`
    } catch (error) {
      console.error('Error saving exam results:', error)
      setError('Failed to save exam results. Please try again.')
      setIsSavingResults(false)
    }
  }

  // Resume last paused exam (manual resume via button)
  const handleResumeLastExam = () => {
    const pausedState = localStorage.getItem('pausedExamState')
    if (!pausedState) {
      setHasPausedExam(false)
      return
    }

    try {
      const state = JSON.parse(pausedState)
      // Restore all exam state
      setExamType(state.examType)
      setMode(state.mode)
      setQuestions(state.questions)
      setCurrentQuestion(state.currentQuestion)
      setSelectedAnswers(state.selectedAnswers)
      setFlaggedQuestions(state.flaggedQuestions || {})
      setTextFormats(state.textFormats || {})
      setTimeRemaining(state.timeRemaining)
      setAssignmentId(state.assignmentId)
      setIsExamStarted(true)
      setHasPausedExam(false)
      // Don't show pause modal on manual resume - user explicitly clicked to resume
    } catch (error) {
      console.error('Failed to restore paused exam:', error)
      localStorage.removeItem('pausedExamState')
      setHasPausedExam(false)
    }
  }

  // Check for paused exam on mount (detect only, don't auto-restore)
  useEffect(() => {
    const pausedState = localStorage.getItem('pausedExamState')
    if (pausedState && !isExamStarted) {
      try {
        const state = JSON.parse(pausedState)
        // Just detect the paused exam, don't auto-restore
        setHasPausedExam(true)
      } catch (error) {
        console.error('Failed to parse paused exam:', error)
        localStorage.removeItem('pausedExamState')
        setHasPausedExam(false)
      }
    } else if (!pausedState) {
      setHasPausedExam(false)
    }
  }, [isExamStarted])

  // Detect if user is on Mac
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  // Keyboard shortcuts for exam navigation
  useEffect(() => {
    if (!isExamStarted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const modifier = e.altKey // Use Option/Alt for both Mac and Windows

      if (!modifier) return

      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault()
          if (currentQuestion > 0) handlePrevious()
          break
        case 'n':
          e.preventDefault()
          if (currentQuestion < questions.length - 1) handleNext()
          break
        case 'h':
          e.preventDefault()
          handleHighlightText()
          break
        case 's':
          e.preventDefault()
          handleStrikethroughText()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExamStarted, currentQuestion, questions.length, handleNext, handlePrevious, handleHighlightText, handleStrikethroughText])

  // Initialize recommended defaults from exam history
  useEffect(() => {
    const defaults = getRecommendedDefaults()
    setRecommendedExamType(defaults.examType)
    setRecommendedMode(defaults.examMode)
    setSelectedMode(defaults.examMode)
  }, [])

  // Get current user ID for pre-generation
  useEffect(() => {
    const initializeUser = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
      }
    }
    initializeUser()
  }, [])

  // Pre-generate exams on page load for faster loading
  useEffect(() => {
    if (userId && !examType) {
      triggerBackgroundPreGeneration(userId, 'diagnostic')
      triggerBackgroundPreGeneration(userId, 'practice')
    }
  }, [userId, examType])

  // Auto-show explanation in Study Mode
  useEffect(() => {
    if (selectedAnswers[currentQuestion] && mode === 'study' && !showExplanation) {
      setShowExplanation(true)
    }
  }, [selectedAnswers, currentQuestion, mode, showExplanation])

  // Timer effect: time per question based on exam type
  useEffect(() => {
    if (!isExamStarted || questions.length === 0 || mode !== 'test') return

    // 68 seconds per question for practice (225q = 4h 15m), 50 seconds per question for diagnostic (71q = ~1h)
    const secondsPerQuestion = examType === 'diagnostic' ? 50 : 68
    const totalSeconds = questions.length * secondsPerQuestion

    // Only initialize on first run
    if (timeRemaining > 0) return

    setTimeRemaining(totalSeconds)
  }, [isExamStarted])

  // Separate effect for timer countdown
  useEffect(() => {
    if (!isExamStarted || questions.length === 0 || mode !== 'test' || timeRemaining === 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1

        // Auto-submit if time runs out
        if (newTime <= 0) {
          handleEndExam()
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isExamStarted, timeRemaining, questions, selectedAnswers, examType, mode])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isTimeWarning = timeRemaining > 0 && timeRemaining <= 300

  const handleGenerateExam = async (chosenExamType: 'diagnostic' | 'practice', chosenMode: 'study' | 'test') => {
    try {
      const startTime = performance.now()
      console.log(`[Exam Gen] Starting exam generation for ${chosenExamType}...`)

      setIsGenerating(true)
      setError(null)
      setQuestions([])
      setCurrentQuestion(0)
      setSelectedAnswers({})
      setShowExplanation(false)
      setTimeRemaining(0)
      setExamType(chosenExamType)
      setMode(chosenMode)
      setAssignmentId(null)

      let examData = null

      // Try to fetch Git-backed exam if user is authenticated
      if (userId) {
        setIsLoadingPreGen(true)
        try {
          console.time('[Exam Gen] Assignment API call')
          const assignResponse = await fetch('/api/assign-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, examType: chosenExamType }),
          })
          console.timeEnd('[Exam Gen] Assignment API call')

          const assignData = await assignResponse.json()

          if (assignData.success && assignData.questions) {
            console.log('[Exam Gen] Using Git-backed exam:', assignData.examFile)
            console.log(`[Exam Gen] Loaded ${assignData.questions.length} questions from cached file`)
            examData = { questions: assignData.questions }
            setAssignmentId(assignData.assignmentId)
            setIsLoadingPreGen(false)
          } else if (assignData.fallbackRequired) {
            console.log('[Exam Gen] No Git-backed exams available, falling back to on-demand generation')
          }
        } catch (gitExamError) {
          console.log('[Exam Gen] Git-backed exam fetch failed, falling back to on-demand:', gitExamError)
        }
        setIsLoadingPreGen(false)
      }

      // Fall back to on-demand generation if no Git-backed exam available
      if (!examData) {
        console.log('[Exam Gen] Generating exam on-demand (this may take 30-60 seconds)')
        console.time('[Exam Gen] On-demand generation')
        let jsonContent = ''
        const response = await fetch(`/api/exam-generator?type=${chosenExamType}`, {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error('Failed to generate exam')
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const text = decoder.decode(value)
          jsonContent += text
        }
        console.timeEnd('[Exam Gen] On-demand generation')

        // Parse JSON from the content
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('Could not parse exam data')
        }

        examData = JSON.parse(jsonMatch[0])
        console.log(`[Exam Gen] On-demand generation produced ${examData.questions?.length || 0} questions`)
      }

      // Fisher-Yates shuffle to ensure question randomization
      console.time('[Exam Gen] Question shuffle')
      const questionsToUse = examData.questions || []
      for (let i = questionsToUse.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsToUse[i], questionsToUse[j]] = [questionsToUse[j], questionsToUse[i]]
      }
      console.timeEnd('[Exam Gen] Question shuffle')

      setQuestions(questionsToUse)
      setIsExamStarted(true)

      const endTime = performance.now()
      const totalTime = ((endTime - startTime) / 1000).toFixed(2)
      console.log(`[Exam Gen] ✓ Total exam load time: ${totalTime}s`)
    } catch (err) {
      console.error('Error generating exam:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate exam')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectAnswer = (option: string) => {
    setSelectedAnswers((prev) => {
      // Allow unclicking - if clicking the same option, remove it
      if (prev[currentQuestion] === option) {
        const newAnswers = { ...prev }
        delete newAnswers[currentQuestion]
        return newAnswers
      }
      return {
        ...prev,
        [currentQuestion]: option,
      }
    })
    setShowExplanation(false)
  }

  const handleShowExplanation = () => {
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setShowExplanation(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
      setShowExplanation(false)
    }
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen p-6 bg-background">
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
                <BreadcrumbPage>Exam Generator</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center py-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                EPPP Exam
              </h1>
              {!isGenerating && (
                <p className="text-muted-foreground mb-12 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  Choose an exam type to get started.
                </p>
              )}

              {/* Resume Last Exam Button */}
              {hasPausedExam && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-2xl mx-auto mb-8"
                >
                  <Button
                    onClick={handleResumeLastExam}
                    variant="outline"
                    size="sm"
                    className="w-full rounded-none"
                  >
                    Resume Last Exam
                  </Button>
                </motion.div>
              )}

              {!isGenerating && (
                <div>
                  {/* Step 1: Exam Type Selection (Diagnostic vs Practice) */}
                  <div className="max-w-2xl mx-auto mb-8">
                    <p className="text-sm font-semibold text-muted-foreground mb-4">Step 1: Select Exam Type</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Diagnostic Card */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all border-2 ${
                          examType === 'diagnostic'
                            ? 'bg-[#bdd1ca]/20 dark:bg-[#bdd1ca]/10'
                            : 'border-border'
                        }`}
                        style={examType === 'diagnostic' ? { borderColor: '#bdd1ca' } : {}}
                        onClick={() => setExamType('diagnostic')}
                      >
                        <CardHeader className="text-center">
                          <div className="flex items-center justify-center flex-col">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl font-semibold">Diagnostic Exam</CardTitle>
                              {recommendedExamType === 'diagnostic' && (
                                <Badge style={{ backgroundColor: '#bdd1ca' }}>Recommended</Badge>
                              )}
                            </div>
                            <CardDescription>71 questions</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <ul className="space-y-2 text-sm text-left">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                              Identify knowledge gaps
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                              Quick assessment (30-45 minutes)
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                              Get priority recommendations
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Practice Card */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all border-2 ${
                          examType === 'practice'
                            ? 'bg-[#788c5d]/20 dark:bg-[#788c5d]/10'
                            : 'border-border'
                        }`}
                        style={examType === 'practice' ? { borderColor: '#788c5d' } : {}}
                        onClick={() => setExamType('practice')}
                      >
                        <CardHeader className="text-center">
                          <div className="flex items-center justify-center flex-col">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl font-semibold">Practice Exam</CardTitle>
                              {recommendedExamType === 'practice' && (
                                <Badge style={{ backgroundColor: '#788c5d' }}>Recommended</Badge>
                              )}
                            </div>
                            <CardDescription>225 questions</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <ul className="space-y-2 text-sm text-left">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                              Comprehensive knowledge check
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                              Full exam preparation (4-5 hours)
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                              Includes experimental questions
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                    </div>
                  </div>

                  {/* Step 2: Mode Selection (Study vs Test) */}
                  {examType && (
                    <motion.div
                    initial={{ opacity: 0, y: -20, scaleY: 0 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ originY: 0 }}
                    className="max-w-4xl mx-auto"
                  >
                    <p className="text-sm font-semibold text-muted-foreground mb-4">Step 2: Select Mode</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Study Mode Card */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all border-2 h-full ${
                            selectedMode === 'study'
                              ? 'bg-[#d87758]/20 dark:bg-[#d87758]/10'
                              : 'border-border'
                          }`}
                          style={selectedMode === 'study' ? { borderColor: '#d87758' } : {}}
                          onClick={() => setSelectedMode('study')}
                        >
                          <CardHeader className="text-center">
                            <CardTitle className="text-xl font-semibold">Study Mode</CardTitle>
                            <CardDescription>
                              Learn at your own pace with immediate feedback
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <ul className="space-y-2 text-sm text-left">
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                                Correct answers turn green immediately
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                                Learn from mistakes with explanations
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                                No time pressure
                              </li>
                            </ul>
                          </CardContent>
                          {selectedMode === 'study' && (
                            <CardFooter>
                              <Button
                                onClick={() => handleGenerateExam(examType, 'study')}
                                className="w-full px-8 py-6"
                                size="lg"
                              >
                                Start {examType === 'diagnostic' ? 'Diagnostic' : 'Practice'} - Study Mode
                              </Button>
                            </CardFooter>
                          )}
                        </Card>
                      </motion.div>

                      {/* Test Mode Card */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all border-2 h-full ${
                            selectedMode === 'test'
                              ? 'bg-[#c46685]/20 dark:bg-[#c46685]/10'
                              : 'border-border'
                          }`}
                          style={selectedMode === 'test' ? { borderColor: '#c46685' } : {}}
                          onClick={() => setSelectedMode('test')}
                        >
                          <CardHeader className="text-center">
                            <CardTitle className="text-xl font-semibold">Test Mode</CardTitle>
                            <CardDescription>
                              Simulate real exam conditions
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <ul className="space-y-2 text-sm text-left">
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                                See all answers only at the end
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                                Timed exam with countdown
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e2dacd' }} />
                                Realistic EPPP exam experience
                              </li>
                            </ul>
                          </CardContent>
                          {selectedMode === 'test' && (
                            <CardFooter>
                              <Button
                                onClick={() => handleGenerateExam(examType, 'test')}
                                className="w-full px-8 py-6"
                                size="lg"
                              >
                                Start {examType === 'diagnostic' ? 'Diagnostic' : 'Practice'} - Test Mode
                              </Button>
                            </CardFooter>
                          )}
                        </Card>
                      </motion.div>
                    </div>
                  </motion.div>
                  )}
                </div>
              )}
            </div>

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <LoadingAnimation size="lg" />
                <p className="text-muted-foreground">
                  Generating your {examType === 'diagnostic' ? 'Diagnostic' : 'Practice'} exam...
                </p>
                <p className="text-sm text-muted-foreground/60">This may take a moment</p>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
              >
                <Alert variant="destructive">
                  <AlertDescription className="space-y-3">
                    <div>
                      <h3 className="font-semibold mb-1">Error</h3>
                      <p className="text-sm">{error}</p>
                    </div>
                    <Button
                      onClick={() => handleGenerateExam(examType || 'practice', selectedMode)}
                      variant="outline"
                      size="sm"
                    >
                      Try Again
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    )
  }

  const question = questions[currentQuestion]
  const selectedAnswer = selectedAnswers[currentQuestion]

  // Find which option is correct by matching the letter or text
  const correctOptionIndex = (() => {
    // Check if correct_answer is a letter (A, B, C, D)
    if (/^[A-D]$/.test(question.correct_answer)) {
      return question.correct_answer.charCodeAt(0) - 65 // Convert A->0, B->1, etc
    }
    // Otherwise find by matching the text
    return question.options.findIndex(opt => opt === question.correct_answer)
  })()

  const correctOption = question.options[correctOptionIndex]
  const correctLetter = String.fromCharCode(65 + correctOptionIndex)
  const isCorrect = selectedAnswer === correctOption

  return (
    <main className="min-h-screen p-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Exam Generator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`space-y-6 ${isPaused ? 'blur-sm pointer-events-none' : ''}`}
        >
          {/* Header with Question Number, Progress, and Timer */}
          <div className="sticky top-0 z-40 bg-background border-b border-border pb-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {examType === 'diagnostic' ? 'Diagnostic' : 'Practice'}
                  </Badge>
                  <Badge variant="outline">
                    {mode === 'study' ? 'Study' : 'Test'}
                  </Badge>
                </div>
                <p className="text-base font-normal text-foreground" style={{ fontFamily: 'Tahoma' }}>
                  Question {currentQuestion + 1} of {questions.length}
                </p>
              </div>
              {mode === 'test' && timeRemaining > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-base font-normal text-foreground" style={{ fontFamily: 'Tahoma' }}>
                    <Clock className="w-4 h-4" />
                    {formatTime(timeRemaining)}
                  </div>
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    size="sm"
                    className="rounded-none hover:bg-accent transition-colors"
                  >
                    Pause
                  </Button>
                </div>
              )}
            </div>
            <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-1" />
          </div>

          {/* Highlight and Strikeout Buttons - Above Question */}
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <Button
                onClick={handleHighlightText}
                variant="outline"
                size="sm"
                className="rounded-none hover:bg-accent transition-colors"
                style={{ fontFamily: 'Tahoma' }}
              >
                Highlight
              </Button>
              <span className="text-xs text-muted-foreground pl-2" style={{ fontFamily: 'Tahoma' }}>{isMac ? 'Option' : 'Alt'} + H</span>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                onClick={handleStrikethroughText}
                variant="outline"
                size="sm"
                className="rounded-none hover:bg-accent transition-colors"
                style={{ fontFamily: 'Tahoma' }}
              >
                Strikeout
              </Button>
              <span className="text-xs text-muted-foreground pl-2" style={{ fontFamily: 'Tahoma' }}>{isMac ? 'Option' : 'Alt'} + S</span>
            </div>
          </div>

          {/* Question */}
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-base font-normal leading-relaxed text-foreground select-text" style={{ fontFamily: 'Tahoma' }}>
                {textFormats[currentQuestion]?.question ? (
                  <div dangerouslySetInnerHTML={{ __html: textFormats[currentQuestion].question }} />
                ) : (
                  question.question
                )}
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {/* Answer Options - Radio Style */}
              <div className="space-y-3">
              {question.options.map((option, idx) => {
                const isSelected = selectedAnswer === option
                const isAnswered = selectedAnswer !== undefined
                const optionLetter = String.fromCharCode(65 + idx)
                const optionIsCorrect = option === question.correct_answer
                const isShowingCorrect = (mode === 'study' && isAnswered) || (mode === 'test' && currentQuestion === questions.length - 1)

                return (
                  <div key={idx} className="flex items-start gap-3 p-2">
                    {/* Radio Button - Only This is Clickable */}
                    <motion.button
                      whileHover={!isAnswered ? { scale: 1.15 } : {}}
                      onClick={() => (mode === 'test' || !isAnswered) && handleSelectAnswer(option)}
                      disabled={mode === 'study' && isAnswered}
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
                        <span>{optionLetter}.</span> {textFormats[currentQuestion]?.options?.[idx] ? (
                          <span dangerouslySetInnerHTML={{ __html: textFormats[currentQuestion].options[idx] }} />
                        ) : (
                          option
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              </div>

              {/* Explanation - Only shown in Study Mode or after test is complete */}
              {showExplanation && (mode === 'study' || (mode === 'test' && currentQuestion === questions.length - 1)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-none border bg-muted/50 border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-semibold">
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </p>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Correct Answer</p>
                      <p className="text-2xl font-bold">
                        {correctLetter}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground">
                    {question.explanation}
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Navigation - Sticky Bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="sticky bottom-0 bg-card border-t border-border shadow-lg p-6 mt-8"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Flag Checkbox on Left */}
              <label className="flex items-center gap-3 cursor-pointer group hover:bg-accent p-2 rounded transition-colors">
                <Checkbox
                  checked={flaggedQuestions[currentQuestion] || false}
                  onCheckedChange={(checked) => {
                    setFlaggedQuestions(prev => ({
                      ...prev,
                      [currentQuestion]: checked === true
                    }))
                  }}
                  id={`flag-q${currentQuestion}`}
                />
                <span className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ fontFamily: 'Tahoma' }}>
                  Flag for review {flaggedQuestions[currentQuestion] && '✓'}
                </span>
              </label>

              {/* Navigation Buttons on Right */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1 items-center">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    variant="outline"
                    className="min-w-[100px] rounded-none"
                    style={{ fontFamily: 'Tahoma' }}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Tahoma' }}>{isMac ? 'Option' : 'Alt'} + P</span>
                </div>

                {currentQuestion === questions.length - 1 ? (
                  <Button
                    onClick={handleEndExam}
                    disabled={isSavingResults}
                    className="min-w-[100px] rounded-none"
                    style={{ fontFamily: 'Tahoma' }}
                  >
                    {isSavingResults ? 'Saving...' : 'End Exam'}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-1 items-center">
                    <Button onClick={handleNext} className="min-w-[100px] rounded-none" style={{ fontFamily: 'Tahoma' }}>
                      Next
                    </Button>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Tahoma' }}>{isMac ? 'Option' : 'Alt'} + N</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </motion.div>

        {/* Pause Modal Overlay - Outside the blurred container */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-lg shadow-lg p-8 max-w-md w-full mx-4"
            >
              <h2 className="text-xl font-semibold mb-4 text-foreground">Exam Paused</h2>
              <p className="text-sm text-muted-foreground mb-6">
                You can resume where you left off at Question {currentQuestion + 1} of {questions.length}.
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleResume}
                  className="rounded-none w-full"
                >
                  Resume Exam
                </Button>
                <Button
                  onClick={handleSaveAndReturn}
                  variant="outline"
                  className="rounded-none w-full"
                >
                  Save Place & Return to Dashboard
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
