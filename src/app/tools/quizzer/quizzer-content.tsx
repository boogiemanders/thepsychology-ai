'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import { saveQuizResults, getQuizResults, WrongAnswer } from '@/lib/quiz-results-storage'
import { PulseSpinner } from '@/components/PulseSpinner'

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
          handleNext()
          return prev
        }

        return {
          ...prev,
          timeRemaining: newTime,
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizStarted, quizState.showResults, questions.length])

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
            href="/tools/topic-selector"
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
            <Link href="/tools/topic-selector">
              <Button>Go to Topics</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 bg-background">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/tools/topic-selector"
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
            <div className="text-center py-10">
              <div className="mb-6">
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

              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setQuestions([])
                    setQuizState({
                      question: 0,
                      score: 0,
                      selectedAnswers: {},
                      showResults: false,
                    })
                    setQuizStarted(false)
                  }}
                  variant="minimal"
                  className="w-full"
                >
                  Retake Quiz
                </Button>
                <Link
                  href={`/tools/topic-teacher?topic=${encodeURIComponent(topic || '')}&hasQuizResults=true`}
                  className="block"
                >
                  <Button variant="minimal" className="w-full">
                    Relearn the Materials
                  </Button>
                </Link>
                <Link href="/tools/topic-selector" className="block">
                  <Button variant="minimal" className="w-full">
                    Select Another Topic
                  </Button>
                </Link>
                <Link href="/tools" className="block">
                  <Button className="w-full">Back to Tools</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Question {quizState.question + 1} of {questions.length}
                </h2>
                <div className="flex items-center gap-6">
                  <div className="text-sm text-muted-foreground">
                    Score: {quizState.score}
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-semibold transition-colors ${
                    isTimeWarning
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-secondary text-foreground'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {formatTime(quizState.timeRemaining)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold mb-6">
                  {questions[quizState.question]?.question}
                </h3>

                <div className="space-y-3">
                  {questions[quizState.question]?.options.map(
                    (option, idx) => {
                      const isSelected =
                        quizState.selectedAnswers[quizState.question] ===
                        option
                      const letter = String.fromCharCode(65 + idx)

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(option)}
                          disabled={quizState.showResults}
                          className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/20 transition-colors disabled:opacity-50"
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-border'
                          }`}>
                            {isSelected && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-foreground">
                              {letter}.
                            </span>
                            <span className="ml-2 text-foreground">
                              {option}
                            </span>
                          </div>
                        </button>
                      )
                    }
                  )}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleNext}
                  disabled={
                    !quizState.selectedAnswers[quizState.question]
                  }
                  className="flex-1"
                >
                  {quizState.question === questions.length - 1
                    ? 'Finish Quiz'
                    : 'Next Question'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
