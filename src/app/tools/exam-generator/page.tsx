'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
          const score = Object.entries(selectedAnswers).filter(([qIdx, answer]) => {
            const q = questions[parseInt(qIdx)]
            return q && answer === q.correct_answer
          }).length

          window.location.href = `/tools/study-optimizer?results=${encodeURIComponent(JSON.stringify({ questions, selectedAnswers, score, totalQuestions: questions.length }))}`
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
            href="/tools"
            className="flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft size={18} />
            Back to Tools
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!isGenerating && !mode && (
              <div className="text-center py-20">
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                    <Zap size={32} className="text-yellow-500" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold mb-4">EPPP Exam Generator</h1>
                <p className="text-muted-foreground mb-12 text-lg max-w-2xl mx-auto">
                  Choose an exam mode to get started.
                </p>

                <div className="flex gap-6 justify-center max-w-2xl mx-auto mb-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex-1"
                  >
                    <button
                      onClick={() => {
                        setMode('study')
                        handleGenerateExam()
                      }}
                      className="w-full p-8 rounded-lg border-2 border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all"
                    >
                      <h3 className="text-xl font-bold mb-2">📚 Study Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        Learn at your own pace. Correct answers turn green, learn from mistakes immediately.
                      </p>
                    </button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex-1"
                  >
                    <button
                      onClick={() => {
                        setMode('test')
                        handleGenerateExam()
                      }}
                      className="w-full p-8 rounded-lg border-2 border-border hover:border-primary bg-secondary/10 hover:bg-secondary/20 transition-all"
                    >
                      <h3 className="text-xl font-bold mb-2">📋 Test Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        Simulate real exam conditions. See all answers at the end, no instant feedback.
                      </p>
                    </button>
                  </motion.div>
                </div>
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
                className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 mb-8"
              >
                <h3 className="font-semibold text-destructive mb-2">Error</h3>
                <p className="text-sm text-destructive/80">{error}</p>
                <Button
                  onClick={handleGenerateExam}
                  variant="outline"
                  className="mt-4"
                >
                  Try Again
                </Button>
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
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">
                  Question {currentQuestion + 1} of {questions.length}
                </h2>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  mode === 'study'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {mode === 'study' ? '📚 Study Mode' : '📋 Test Mode'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {question.domain} • {question.difficulty}
                </span>
                {mode === 'test' && timeRemaining > 0 && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-semibold transition-colors ${
                    isTimeWarning
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-secondary text-foreground'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-current animate-breath" />
                    {formatTime(timeRemaining)}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-secondary/30 rounded-lg p-8 border border-border">
            <h3 className="text-xl font-semibold mb-8">{question.question}</h3>

            {/* Answer Options */}
            <div className="space-y-3">
              {question.options.map((option, idx) => {
                const isSelected = selectedAnswer === option
                const isAnswered = selectedAnswer !== undefined
                const optionLetter = String.fromCharCode(65 + idx)
                const optionIsCorrect = option === question.correct_answer

                return (
                  <motion.button
                    key={idx}
                    whileHover={!isAnswered ? { scale: 1.02 } : {}}
                    onClick={() => !isAnswered && handleSelectAnswer(option)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? mode === 'study'
                          ? optionIsCorrect
                            ? 'border-green-500/50 bg-green-500/10'
                            : 'border-border hover:border-primary/50'
                          : isAnswered
                            ? optionIsCorrect
                              ? 'border-green-500/50 bg-green-500/10'
                              : 'border-red-500/50 bg-red-500/10'
                            : 'border-primary bg-primary/10'
                        : mode === 'study'
                          ? optionIsCorrect && isAnswered
                            ? 'border-green-500/50 bg-green-500/10'
                            : 'border-border hover:border-primary/50'
                          : isAnswered && optionIsCorrect
                            ? 'border-green-500/50 bg-green-500/10'
                            : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-base mt-0.5">
                        {optionLetter}.
                      </span>
                      <span>{option}</span>
                    </div>
                  </motion.button>
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
                <p className="text-sm text-muted-foreground">
                  {question.explanation}
                </p>
              </motion.div>
            )}
          </div>

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
                  href={`/tools/study-optimizer?results=${encodeURIComponent(JSON.stringify({ questions, selectedAnswers }))}`}
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
