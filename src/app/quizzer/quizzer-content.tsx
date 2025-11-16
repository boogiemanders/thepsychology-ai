'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import { saveQuizResults, getQuizResults, WrongAnswer, getAllQuizResults } from '@/lib/quiz-results-storage'
import { PulseSpinner } from '@/components/PulseSpinner'
import { Confetti, type ConfettiRef } from '@/components/ui/confetti'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  relatedSections?: string[]
}

interface QuizState {
  question: number
  score: number
  selectedAnswers: Record<number, string>
  showResults: boolean
  timeRemaining: number
}

export function QuizzerContent() {
  const searchParams = useSearchParams()
  const topic = searchParams.get('topic')
  const confettiRef = useRef<ConfettiRef>(null)

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
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

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isTimeWarning = quizState.timeRemaining > 0 && quizState.timeRemaining <= 120

  const generateQuiz = async () => {
    if (!topic) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/quizzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const data = await response.json()
      let questionsData = data.questions || []

      // Get previous wrong answers to include on retake
      const previousResults = getQuizResults(topic)
      let questionsToUse = [...questionsData]

      if (previousResults && previousResults.wrongAnswers.length > 0) {
        // Include previous wrong answers - take up to 3 of them or all if less than 3
        const wrongAnswersToInclude = previousResults.wrongAnswers.slice(0, 3)

        // Convert wrong answers to QuizQuestion format
        const wrongAnswerQuestions: QuizQuestion[] = wrongAnswersToInclude.map(
          (wa) => ({
            id: wa.questionId,
            question: wa.question,
            options: shuffleArray([
              wa.correctAnswer,
              wa.selectedAnswer,
              'Placeholder option 1',
              'Placeholder option 2',
            ]),
            correctAnswer: wa.correctAnswer,
            explanation: `Remember: The correct answer is "${wa.correctAnswer}". You previously selected "${wa.selectedAnswer}".`,
            relatedSections: wa.relatedSections,
          })
        )

        // Combine new questions with previous wrong answers, take 10 total
        questionsToUse = shuffleArray([
          ...questionsData.slice(0, 10 - wrongAnswerQuestions.length),
          ...wrongAnswerQuestions,
        ]).slice(0, 10)
      }

      // Shuffle answer options for each question
      questionsToUse = questionsToUse.map((q: QuizQuestion) => ({
        ...q,
        options: shuffleArray(q.options),
      }))

      // Assign sequential IDs
      questionsToUse = questionsToUse.map((q: QuizQuestion, idx: number) => ({
        ...q,
        id: idx,
      }))

      setQuestions(questionsToUse)
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
      const passed = quizState.score >= 8
      // Fire confetti if: first quiz (regardless of pass/fail) OR passed (subsequent quizzes)
      if (isFirstQuiz || passed) {
        setTimeout(() => {
          confettiRef.current?.fire({})
        }, 500)
      }
    }
  }, [quizState.showResults, isFirstQuiz, quizState.score])

  // Auto-generate quiz when page loads with a topic
  useEffect(() => {
    if (topic && questions.length === 0 && !isLoading) {
      generateQuiz()
    } else if (!topic && questions.length === 0 && !isLoading) {
      setError('No topic provided')
    }
  }, [topic])

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

  const handleNext = () => {
    const currentQuestion = questions[quizState.question]
    const selectedAnswer = quizState.selectedAnswers[quizState.question]

    if (!selectedAnswer) {
      setError('Please select an answer')
      return
    }

    const isCorrect =
      selectedAnswer === currentQuestion.correctAnswer

    if (quizState.question < questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        question: prev.question + 1,
        score: prev.score + (isCorrect ? 1 : 0),
      }))
      setError(null)
    } else {
      // Quiz is finishing, save results
      const finalScore = quizState.score + (isCorrect ? 1 : 0)

      // Collect wrong and correct answers
      const wrongAnswers: WrongAnswer[] = []
      const correctAnswers = []

      questions.forEach((q) => {
        const selected = quizState.selectedAnswers[q.id] || selectedAnswer
        const questionWasCorrect = selected === q.correctAnswer

        if (!questionWasCorrect) {
          wrongAnswers.push({
            questionId: q.id,
            question: q.question,
            selectedAnswer: selected,
            correctAnswer: q.correctAnswer,
            relatedSections: q.relatedSections || [],
            timestamp: Date.now(),
          })
        } else {
          correctAnswers.push({
            questionId: q.id,
            question: q.question,
            relatedSections: q.relatedSections || [],
            timestamp: Date.now(),
          })
        }
      })

      // Get previous quiz results to check if wrong answers were correct before
      const previousResults = getQuizResults(topic || '')
      if (previousResults) {
        wrongAnswers.forEach((wa) => {
          const wasPreviouslyCorrect = previousResults.correctAnswers.some(
            (ca) => ca.questionId === wa.questionId
          )
          if (wasPreviouslyCorrect) {
            wa.previouslyWrong = false
          }
        })

        correctAnswers.forEach((ca) => {
          const wasPreviouslyWrong = previousResults.wrongAnswers.some(
            (wa) => wa.questionId === ca.questionId
          )
          if (wasPreviouslyWrong) {
            ;(ca as any).wasPreviouslyWrong = true
          }
        })
      }

      const quizResults = {
        topic: decodeURIComponent(topic || ''),
        timestamp: Date.now(),
        score: finalScore,
        totalQuestions: questions.length,
        wrongAnswers,
        correctAnswers,
      }

      saveQuizResults(quizResults)

      // Pass results via URL for topic-teacher
      const resultsParam = encodeURIComponent(JSON.stringify(quizResults))
      window.history.replaceState(
        null,
        '',
        `?topic=${encodeURIComponent(topic || '')}&quizResults=${resultsParam}`
      )

      setQuizState((prev) => ({
        ...prev,
        showResults: true,
        score: finalScore,
      }))
    }
  }

  if (!topic) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/topic-selector"
            className="flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft size={18} />
            Back to Topics
          </Link>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">No topic selected</h1>
            <p className="text-muted-foreground mb-6">
              Please select a topic first
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
    <main className="min-h-screen p-6 bg-background relative">
      {/* Confetti Canvas */}
      <Confetti
        ref={confettiRef}
        className="fixed top-0 left-0 z-50 size-full pointer-events-none"
      />

      <div className="max-w-2xl mx-auto">
        <Link
          href="/topic-selector"
          className="flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ArrowLeft size={18} />
          Back to Topic Selector
        </Link>

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
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold mb-4">Quiz - {decodeURIComponent(topic)}</h1>
              <p className="text-muted-foreground mb-8 text-lg">
                10 questions
              </p>
              <Button
                onClick={() => setQuizStarted(true)}
                size="lg"
                variant="minimal"
                className="gap-2"
              >
                <Zap size={20} />
                Start
              </Button>
            </div>
          ) : quizState.showResults ? (
            <div className="py-10">
              {/* Score Summary */}
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-primary mb-2">
                  {quizState.score}/{questions.length}
                </div>
                <p className="text-muted-foreground">
                  {Math.round(
                    (quizState.score / questions.length) * 100
                  )}% Correct
                </p>
              </div>

              {quizState.score >= 8 ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
                  <CheckCircle2 className="text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-500 mb-2">
                    Excellent! Topic Mastered
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You've demonstrated mastery of this topic. Great work!
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
                  <XCircle className="text-yellow-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-yellow-500 mb-2">
                    Keep Practicing
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Review the material and try again to improve your score.
                  </p>
                </div>
              )}

              {/* Detailed Question Breakdown */}
              <div className="space-y-4 mb-6">
                <h3 className="text-xl font-semibold text-center mb-4">Review Your Answers</h3>
                {questions.map((q, idx) => {
                  const selectedAnswer = quizState.selectedAnswers[q.id]
                  const isCorrect = selectedAnswer === q.correctAnswer
                  const selectedLetter = q.options.findIndex(opt => opt === selectedAnswer)
                  const correctLetter = q.options.findIndex(opt => opt === q.correctAnswer)

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`border rounded-lg p-6 ${
                        isCorrect
                          ? 'bg-green-500/5 border-green-500/30'
                          : 'bg-red-500/5 border-red-500/30'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-3 mb-4">
                        {isCorrect ? (
                          <CheckCircle2 className="text-green-500 flex-shrink-0 mt-1" size={20} />
                        ) : (
                          <XCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-muted-foreground">
                              Question {idx + 1}
                            </span>
                            {isCorrect ? (
                              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 rounded">
                                Correct
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-700 dark:text-red-400 rounded">
                                Incorrect
                              </span>
                            )}
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
                                  className={`p-3 rounded-lg border ${
                                    isThisCorrect
                                      ? 'bg-green-500/10 border-green-500/30'
                                      : isThisSelected
                                      ? 'bg-red-500/10 border-red-500/30'
                                      : 'bg-muted/30 border-border'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="font-semibold">{optionLetter}.</span>
                                    <span className="flex-1">{option}</span>
                                    {isThisCorrect && (
                                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 rounded flex-shrink-0">
                                        Correct Answer
                                      </span>
                                    )}
                                    {isThisSelected && !isThisCorrect && (
                                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-700 dark:text-red-400 rounded flex-shrink-0">
                                        Your Answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Explanation */}
                          {!isCorrect && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-3">
                              <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                                Why you might have chosen this:
                              </p>
                              <p className="text-sm text-muted-foreground">
                                This is a common misconception. Your selected answer may have seemed related, but it doesn't fully capture the core concept being tested.
                              </p>
                            </div>
                          )}

                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                              Explanation:
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setQuestions([])
                    setQuizState({
                      question: 0,
                      score: 0,
                      selectedAnswers: {},
                      showResults: false,
                      timeRemaining: 0,
                    })
                    setQuizStarted(false)
                  }}
                  variant="minimal"
                  className="w-full"
                >
                  Retake Quiz
                </Button>
                <Link href="/topic-selector" className="block">
                  <Button variant="minimal" className="w-full">
                    Select Another Topic
                  </Button>
                </Link>
                <Link
                  href={`/topic-teacher?topic=${encodeURIComponent(topic || '')}&hasQuizResults=true`}
                  className="block"
                >
                  <Button className="w-full">Relearn the Topic</Button>
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

              {/* Question Card */}
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle className="text-base font-normal leading-relaxed text-foreground select-text" style={{ fontFamily: 'Tahoma' }}>
                    {questions[quizState.question]?.question}
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  {/* Answer Options - Radio Style */}
                  <div className="space-y-3">
                    {questions[quizState.question]?.options.map((option, idx) => {
                      const isSelected = quizState.selectedAnswers[quizState.question] === option
                      const optionLetter = String.fromCharCode(65 + idx)

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
                              <span>{optionLetter}.</span> {option}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

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
                <div className="flex items-center justify-end gap-4">
                  <Button
                    onClick={handleNext}
                    disabled={!quizState.selectedAnswers[quizState.question]}
                    className="min-w-[120px] rounded-none"
                    style={{ fontFamily: 'Tahoma' }}
                  >
                    {quizState.question === questions.length - 1 ? 'Finish Quiz' : 'Next'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
