'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { motion } from 'motion/react'

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
}

export default function ExamGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'study' | 'test' | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isExamStarted, setIsExamStarted] = useState(false)

  // Auto-show explanation in Study Mode
  useEffect(() => {
    if (selectedAnswers[currentQuestion] && mode === 'study' && !showExplanation) {
      setShowExplanation(true)
    }
  }, [selectedAnswers, currentQuestion, mode, showExplanation])

  // Timer effect: 68 seconds per question
  useEffect(() => {
    if (!isExamStarted || questions.length === 0 || mode === 'study') return

    const totalSeconds = questions.length * 68

    // Initialize time remaining on exam start
    if (timeRemaining === 0) {
      setTimeRemaining(totalSeconds)
      return
    }

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

          window.location.href = `/tools/study-optimizer?results=${encodeURIComponent(JSON.stringify({ questions, selectedAnswers, score, totalQuestions: scoredQuestions.length }))}`
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isExamStarted, questions.length, mode])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isTimeWarning = timeRemaining > 0 && timeRemaining <= 300

  const handleGenerateExam = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setQuestions([])
      setCurrentQuestion(0)
      setSelectedAnswers({})
      setShowExplanation(false)
      setTimeRemaining(0)

      let jsonContent = ''
      const response = await fetch('/api/exam-generator', {
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

      const data = JSON.parse(jsonMatch[0])
      setQuestions(data.questions || [])
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
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!isGenerating && !mode && (
              <div className="text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 flex justify-center"
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 flex items-center justify-center">
                    <Zap size={32} className="text-yellow-500" />
                  </div>
                </motion.div>
                <h1 className="text-4xl font-bold mb-4">EPPP Practice Exam</h1>
                <p className="text-muted-foreground mb-12 text-lg max-w-2xl mx-auto">
                  Choose an exam mode to generate 225 questions.
                </p>

                <Tabs defaultValue="study" className="max-w-2xl mx-auto">
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="study" className="text-base">
                      📚 Study Mode
                    </TabsTrigger>
                    <TabsTrigger value="test" className="text-base">
                      📋 Test Mode
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="study">
                    <Card>
                      <CardHeader>
                        <CardTitle>Study Mode</CardTitle>
                        <CardDescription>
                          Learn at your own pace with immediate feedback
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm">
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
                          onClick={() => {
                            setMode('study')
                            handleGenerateExam()
                          }}
                          className="w-full"
                          size="lg"
                        >
                          Start Study Mode
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>

                  <TabsContent value="test">
                    <Card>
                      <CardHeader>
                        <CardTitle>Test Mode</CardTitle>
                        <CardDescription>
                          Simulate real exam conditions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                            See all answers only at the end
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                            Timed exam with countdown (4 hours 15 minutes)
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                            Realistic EPPP exam experience
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={() => {
                            setMode('test')
                            handleGenerateExam()
                          }}
                          className="w-full"
                          size="lg"
                          variant="outline"
                        >
                          Start Test Mode
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin" />
                <p className="text-muted-foreground">Generating your EPPP exam...</p>
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
                      onClick={handleGenerateExam}
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
        <Link
          href="/tools"
          className="flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ArrowLeft size={18} />
          Back to Tools
        </Link>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Mode and Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl">
                    Question {currentQuestion + 1} of {questions.length}
                  </CardTitle>
                  <Badge
                    variant={mode === 'study' ? 'default' : 'secondary'}
                    className={mode === 'study' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'}
                  >
                    {mode === 'study' ? '📚 Study Mode' : '📋 Test Mode'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="font-normal">
                    {question.domain}
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    {question.difficulty}
                  </Badge>
                  {mode === 'test' && timeRemaining > 0 && (
                    <Badge
                      variant={isTimeWarning ? "destructive" : "secondary"}
                      className="flex items-center gap-2 px-4 py-2 font-mono text-base"
                    >
                      <Clock className="w-4 h-4" />
                      {formatTime(timeRemaining)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
            </CardContent>
          </Card>

          {/* Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-normal leading-relaxed">
                {question.question}
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {/* Answer Options */}
              <div className="space-y-3">
              {question.options.map((option, idx) => {
                const isSelected = selectedAnswer === option
                const isAnswered = selectedAnswer !== undefined
                const optionLetter = String.fromCharCode(65 + idx)
                const optionIsCorrect = option === question.correct_answer

                return (
                  <motion.div
                    key={idx}
                    whileHover={!isAnswered ? { scale: 1.01 } : {}}
                  >
                    <Button
                      onClick={() => !isAnswered && handleSelectAnswer(option)}
                      disabled={isAnswered}
                      variant="outline"
                      className={`w-full text-left p-4 h-auto justify-start transition-colors ${
                        isSelected
                          ? optionIsCorrect
                            ? 'border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-950 text-foreground'
                            : 'border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950 text-foreground'
                          : optionIsCorrect && isAnswered
                            ? 'border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-950 text-foreground'
                            : ''
                      }`}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <span className="font-bold text-base flex-shrink-0">
                          {optionLetter}.
                        </span>
                        <span>{option}</span>
                      </div>
                    </Button>
                  </motion.div>
                )
              })}
              </div>

              {/* Show Answer Button (Test Mode Only) */}
              {selectedAnswer && !showExplanation && mode === 'test' && (
                <Button
                  onClick={handleShowExplanation}
                  variant="outline"
                  className="w-full mt-6"
                >
                  Show Explanation
                </Button>
              )}

              {/* Explanation */}
              {showExplanation && (
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

          {/* Navigation */}
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 justify-between"
            >
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
              >
                Previous
              </Button>

              {currentQuestion === questions.length - 1 ? (
                <Link
                  href={`/tools/study-optimizer?results=${encodeURIComponent(JSON.stringify({
                    questions,
                    selectedAnswers,
                    score: Object.entries(selectedAnswers).filter(([qIdx, answer]) => {
                      const q = questions[parseInt(qIdx)]
                      return q && q.isScored !== false && answer === q.correct_answer
                    }).length,
                    totalQuestions: questions.filter(q => q.isScored !== false).length
                  }))}`}
                  className="flex-1"
                >
                  <Button className="w-full">
                    Finish & Analyze Results
                  </Button>
                </Link>
              ) : (
                <Button onClick={handleNext} className="flex-1">
                  Next Question
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
