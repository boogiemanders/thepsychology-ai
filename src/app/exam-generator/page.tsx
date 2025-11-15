'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [textFormats, setTextFormats] = useState<Record<number, Record<string, string>>>({})

  // Apply highlight to selected text (question and answer choices)
  const handleHighlightText = () => {
    const selectedText = window.getSelection()?.toString()
    if (selectedText && currentQuestion !== undefined) {
      const question = questions[currentQuestion]
      if (question) {
        // Highlight in question text
        const oldQuestion = question.question
        const newQuestion = oldQuestion.replace(
          new RegExp(`(?<!<mark[^>]*>)${selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!</mark>)`, 'g'),
          `<mark style="background-color: yellow; color: black;">$&</mark>`
        )

        // Also highlight in all answer choices
        const newOptions = question.options.map(option =>
          option.replace(
            new RegExp(`(?<!<mark[^>]*>)${selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!</mark>)`, 'g'),
            `<mark style="background-color: yellow; color: black;">$&</mark>`
          )
        )

        setTextFormats(prev => ({
          ...prev,
          [currentQuestion]: {
            ...prev[currentQuestion],
            question: newQuestion,
            options: newOptions
          }
        }))
      }
    }
  }

  // Apply strikethrough to selected text (question and answer choices)
  const handleStrikethroughText = () => {
    const selectedText = window.getSelection()?.toString()
    if (selectedText && currentQuestion !== undefined) {
      const question = questions[currentQuestion]
      if (question) {
        // Strikethrough in question text
        const oldQuestion = question.question
        const newQuestion = oldQuestion.replace(
          new RegExp(`(?<!<del[^>]*>)${selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!</del>)`, 'g'),
          `<del style="text-decoration: line-through;">$&</del>`
        )

        // Also strikethrough in all answer choices
        const newOptions = question.options.map(option =>
          option.replace(
            new RegExp(`(?<!<del[^>]*>)${selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!</del>)`, 'g'),
            `<del style="text-decoration: line-through;">$&</del>`
          )
        )

        setTextFormats(prev => ({
          ...prev,
          [currentQuestion]: {
            ...prev[currentQuestion],
            question: newQuestion,
            options: newOptions
          }
        }))
      }
    }
    window.getSelection()?.removeAllRanges()
  }

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
          // Navigate to results
          const scoredQuestions = questions.filter(q => q.isScored !== false)
          const score = Object.entries(selectedAnswers).filter(([qIdx, answer]) => {
            const q = questions[parseInt(qIdx)]
            return q && q.isScored !== false && answer === q.correct_answer
          }).length

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

            savePriorityRecommendation({
              examType: 'diagnostic',
              examMode: mode,
              topPriorities,
              allResults,
            })
          }

          const resultData = {
            questions,
            selectedAnswers,
            score,
            totalQuestions: scoredQuestions.length,
            examType,
            examMode: mode,
            ...priorityData,
          }

          const targetPage = examType === 'diagnostic' ? '/prioritize' : '/prioritize'
          window.location.href = `${targetPage}?results=${encodeURIComponent(JSON.stringify(resultData))}`
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
      setIsGenerating(true)
      setError(null)
      setQuestions([])
      setCurrentQuestion(0)
      setSelectedAnswers({})
      setShowExplanation(false)
      setTimeRemaining(0)
      setExamType(chosenExamType)
      setMode(chosenMode)

      let examData = null

      // Try to fetch pre-generated exam if user is authenticated
      if (userId) {
        setIsLoadingPreGen(true)
        try {
          const preGenResponse = await fetch(`/api/get-pre-generated-exam?userId=${userId}&examType=${chosenExamType}`)
          const preGenData = await preGenResponse.json()

          if (preGenData.preGenerated && preGenData.questions) {
            console.log('[Exam Gen] Using pre-generated exam')
            examData = preGenData.questions
            setIsLoadingPreGen(false)

            // Trigger background pre-generation of next exam type
            const nextExamType = chosenExamType === 'diagnostic' ? 'practice' : 'diagnostic'
            triggerBackgroundPreGeneration(userId, nextExamType).catch((err) => {
              console.log('[Exam Gen] Background pre-gen failed (non-critical):', err)
            })
          }
        } catch (preGenError) {
          console.log('[Exam Gen] Pre-gen fetch failed, falling back to on-demand:', preGenError)
        }
        setIsLoadingPreGen(false)
      }

      // Fall back to on-demand generation if no pre-gen available
      if (!examData) {
        console.log('[Exam Gen] Generating exam on-demand')
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

        // Parse JSON from the content
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('Could not parse exam data')
        }

        examData = JSON.parse(jsonMatch[0])
      }

      setQuestions(examData.questions || [])
      setIsExamStarted(true)
    } catch (err) {
      console.error('Error generating exam:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate exam')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectAnswer = (option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: option,
    }))
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
              <p className="text-muted-foreground mb-12 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Choose an exam type to get started.
              </p>

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
                            ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                            : 'border-border'
                        }`}
                        onClick={() => setExamType('diagnostic')}
                      >
                        <CardHeader className="text-center">
                          <div className="flex items-center justify-center flex-col">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl font-semibold">Diagnostic Exam</CardTitle>
                              {recommendedExamType === 'diagnostic' && (
                                <Badge className="bg-blue-500">Recommended</Badge>
                              )}
                            </div>
                            <CardDescription>71 questions</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <ul className="space-y-2 text-sm text-left">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Identify knowledge gaps
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Quick assessment (30-45 minutes)
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
                            ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                            : 'border-border'
                        }`}
                        onClick={() => setExamType('practice')}
                      >
                        <CardHeader className="text-center">
                          <div className="flex items-center justify-center flex-col">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl font-semibold">Practice Exam</CardTitle>
                              {recommendedExamType === 'practice' && (
                                <Badge className="bg-blue-500">Recommended</Badge>
                              )}
                            </div>
                            <CardDescription>225 questions</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <ul className="space-y-2 text-sm text-left">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              Comprehensive knowledge check
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              Full exam preparation (4-5 hours)
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
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
                    className="max-w-2xl mx-auto"
                  >
                    <p className="text-sm font-semibold text-muted-foreground mb-4">Step 2: Select Mode</p>
                    <Tabs value={selectedMode} onValueChange={(value) => setSelectedMode(value as 'study' | 'test')} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="study" className="text-base font-semibold">Study Mode</TabsTrigger>
                        <TabsTrigger value="test" className="text-base font-semibold">Test Mode</TabsTrigger>
                      </TabsList>

                      <TabsContent value="study" asChild>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card>
                            <CardHeader>
                              <CardDescription>
                                Learn at your own pace with immediate feedback
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <ul className="space-y-2 text-sm text-left">
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                                  Correct answers turn green immediately
                                </li>
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                                  Learn from mistakes with detailed explanations
                                </li>
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                                  No time pressure - take as long as you need
                                </li>
                              </ul>
                            </CardContent>
                            <CardFooter>
                              <Button
                                onClick={() => handleGenerateExam(examType, 'study')}
                                className="w-full px-8 py-6"
                                size="lg"
                              >
                                Start {examType === 'diagnostic' ? 'Diagnostic' : 'Practice'} - Study Mode
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="test" asChild>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card>
                            <CardHeader>
                              <CardDescription>
                                Simulate real exam conditions
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <ul className="space-y-2 text-sm text-left">
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                                  See all answers only at the end
                                </li>
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                                  Timed exam with countdown
                                </li>
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                                  Realistic EPPP exam experience
                                </li>
                              </ul>
                            </CardContent>
                            <CardFooter>
                              <Button
                                onClick={() => handleGenerateExam(examType, 'test')}
                                className="w-full px-8 py-6"
                                size="lg"
                                variant="outline"
                              >
                                Start {examType === 'diagnostic' ? 'Diagnostic' : 'Practice'} - Test Mode
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      </TabsContent>
                    </Tabs>
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
    <main className={`min-h-screen p-6 ${isExamStarted ? 'windows-2000-theme' : 'bg-background'}`}>
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
          className="space-y-6"
        >
          {/* Header with Question Number, Progress, and Timer */}
          <div className="sticky top-0 z-40 bg-background border-b border-border pb-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle className="text-lg">
                    Question <span className="font-bold">{currentQuestion + 1}</span> of <span className="font-bold">{questions.length}</span>
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  >
                    {examType === 'diagnostic' ? '🎯 Diagnostic' : '📚 Practice'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-slate-500/10 text-slate-600 dark:text-slate-400"
                  >
                    {mode === 'study' ? '📚 Study' : '📋 Test'}
                  </Badge>
                </div>
              </div>
              {mode === 'test' && timeRemaining > 0 && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm border ${
                  isTimeWarning
                    ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                    : 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400'
                }`}>
                  <Clock className="w-4 h-4" />
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
            <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-1" />
          </div>

          {/* Question */}
          <Card className={isExamStarted ? 'win2k-panel' : ''}>
            <CardHeader>
              {/* Highlight and Strikeout Buttons */}
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={handleHighlightText}
                  variant="outline"
                  size="sm"
                  className={`${isExamStarted ? 'win2k-button !border-2 !border-b-2 !border-r-2 !border-gray-400 bg-yellow-100 hover:bg-yellow-200 text-yellow-900' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-300'}`}
                >
                  🖍️ Highlight
                </Button>
                <Button
                  onClick={handleStrikethroughText}
                  variant="outline"
                  size="sm"
                  className={`${isExamStarted ? 'win2k-button !border-2 !border-b-2 !border-r-2 !border-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300'}`}
                >
                  ✏️ Strikeout
                </Button>
              </div>
              <CardTitle className="text-2xl font-normal leading-relaxed font-serif text-foreground select-text">
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
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? mode === 'test'
                            ? 'border-blue-500 bg-blue-500'
                            : isShowingCorrect
                              ? isCorrect
                                ? 'border-green-500 bg-green-500'
                                : 'border-red-500 bg-red-500'
                              : 'border-blue-500 bg-blue-500'
                          : isShowingCorrect && isCorrect
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 dark:border-gray-600 bg-transparent hover:border-blue-400 dark:hover:border-blue-500'
                      }`}>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        )}
                      </div>
                    </motion.button>

                    {/* Option Text - Not Clickable */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className={`text-base ${
                        isShowingCorrect && isCorrect
                          ? 'text-green-600 dark:text-green-400'
                          : isShowingCorrect && isSelected && !isCorrect
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-foreground'
                      }`}>
                        <span className="font-semibold">{optionLetter}.</span> {textFormats[currentQuestion]?.options?.[idx] ? (
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
                  className={`mt-6 p-4 rounded-lg border ${
                    isCorrect
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-semibold">
                      {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
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
            className={`sticky bottom-0 ${isExamStarted ? 'win2k-panel-inset' : 'bg-card border-t border-border'} shadow-lg p-6 -mx-6 mt-8`}
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
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
                <span className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Flag for review {flaggedQuestions[currentQuestion] && '✓'}
                </span>
              </label>

              {/* Navigation Buttons on Right */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  variant="outline"
                  className={`min-w-[120px] ${isExamStarted ? 'win2k-button !border-2 !border-b-2 !border-r-2 !border-gray-400' : ''}`}
                >
                  Previous
                </Button>

                {currentQuestion === questions.length - 1 ? (
                  <Button
                    onClick={() => {
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

                      // Route to prioritizer if diagnostic, prioritize if practice
                      const resultData = {
                        questions,
                        selectedAnswers,
                        score,
                        totalQuestions: scoredQuestions.length,
                        examType,
                        examMode: mode,
                        ...priorityData,
                      }

                      const targetPage = examType === 'diagnostic' ? '/prioritize' : '/prioritize'
                      window.location.href = `${targetPage}?results=${encodeURIComponent(JSON.stringify(resultData))}`
                    }}
                    className={`min-w-[120px] ${isExamStarted ? 'win2k-button !border-2 !border-b-2 !border-r-2 !border-gray-400' : ''}`}
                  >
                    End Exam
                  </Button>
                ) : (
                  <Button onClick={handleNext} className={`min-w-[120px] ${isExamStarted ? 'win2k-button !border-2 !border-b-2 !border-r-2 !border-gray-400' : ''}`}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
