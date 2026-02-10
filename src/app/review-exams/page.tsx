'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { supabase } from '@/lib/supabase'

interface CompletedExam {
  assignmentId: string
  examFile: string
  examType: 'diagnostic' | 'practice'
  assignedAt: string
  completedAt: string
  score?: number
  metadata?: {
    exam_id: string
    question_count: number
  }
  questions?: Array<{
    id: number
    question: string
    options: string[]
    correct_answer: string
    explanation: string
    domain: string
  }>
  error?: string
}

export default function ReviewExamsPage() {
  const [completedExams, setCompletedExams] = useState<CompletedExam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [expandedExam, setExpandedExam] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    const initializeUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
      } else {
        setError('Please log in to view your completed exams')
        setIsLoading(false)
      }
    }
    initializeUser()
  }, [])

  // Fetch completed exams
  useEffect(() => {
    if (!userId) return

    const fetchCompletedExams = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/user-completed-exams?userId=${userId}`)
        const data = await response.json()

        if (data.success) {
          setCompletedExams(data.completedExams || [])
        } else {
          setError('Failed to load completed exams')
        }
      } catch (err) {
        console.error('Error fetching completed exams:', err)
        setError('Failed to load completed exams')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompletedExams()
  }, [userId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const diagnosticExams = completedExams.filter(e => e.examType === 'diagnostic')
  const practiceExams = completedExams.filter(e => e.examType === 'practice')

  if (isLoading) {
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
                <BreadcrumbPage>Review Exams</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-center py-20">
            <LoadingAnimation size="lg" />
          </div>
        </div>
      </main>
    )
  }

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
              <BreadcrumbPage>Review Exams</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">Review Your Exams</h1>
            </div>
            <p className="text-muted-foreground">
              Review your completed exams with explanations for all questions.
            </p>
          </div>

          {error && (
            <Card className="border-red-500/50 bg-red-500/10">
              <CardContent className="pt-6">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {completedExams.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't completed any exams yet.
                </p>
                <Button asChild>
                  <Link href="/exam-generator">Take an Exam</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Diagnostic Exams */}
              {diagnosticExams.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Diagnostic Exams</h2>
                  <div className="grid gap-4">
                    {diagnosticExams.map((exam) => (
                      <Card
                        key={exam.assignmentId}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        style={{
                          borderColor: '#bdd1ca',
                          backgroundColor: 'rgba(189, 209, 202, 0.03)',
                        }}
                        onClick={() =>
                          setExpandedExam(
                            expandedExam === exam.assignmentId ? null : exam.assignmentId
                          )
                        }
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{exam.examFile}</CardTitle>
                              <CardDescription>
                                Completed on {formatDate(exam.completedAt || exam.assignedAt)}
                              </CardDescription>
                            </div>
                            {exam.score !== undefined && (
                              <div className="text-right">
                                <div className="text-3xl font-bold" style={{ color: '#bdd1ca' }}>
                                  {Math.round(exam.score)}%
                                </div>
                                <p className="text-xs text-muted-foreground">Score</p>
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        {expandedExam === exam.assignmentId && exam.questions && (
                          <>
                            <Separator />
                            <CardContent className="pt-6">
                              <div className="space-y-6">
                                {exam.questions.map((question, idx) => (
                                  <div key={question.id} className="space-y-3 pb-6 border-b last:border-b-0">
                                    <div className="flex items-start gap-3">
                                      <span className="font-semibold text-muted-foreground min-w-[2rem]">
                                        {idx + 1}.
                                      </span>
                                      <div className="flex-1">
                                        <p className="font-serif text-base leading-relaxed">
                                          {question.question}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="ml-8 space-y-2">
                                      {question.options.map((option, optIdx) => {
                                        const optionLetter = String.fromCharCode(65 + optIdx)
                                        const isCorrect = option === question.correct_answer

                                        return (
                                          <div
                                            key={optIdx}
                                            className={`p-3 rounded border-2 ${
                                              isCorrect
                                                ? 'border-green-500 bg-green-500/10'
                                                : 'border-border bg-background'
                                            }`}
                                          >
                                            <span className="font-semibold">{optionLetter}.</span> {option}
                                            {isCorrect && (
                                              <Badge className="ml-2 bg-green-600">Correct Answer</Badge>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>

                                    <div className="ml-8 mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                                      <p className="font-semibold text-sm mb-2">Explanation:</p>
                                      <p className="text-sm text-muted-foreground">
                                        {question.explanation}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice Exams */}
              {practiceExams.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Practice Exams</h2>
                  <div className="grid gap-4">
                    {practiceExams.map((exam) => (
                      <Card
                        key={exam.assignmentId}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        style={{
                          borderColor: '#788c5d',
                          backgroundColor: 'rgba(120, 140, 93, 0.03)',
                        }}
                        onClick={() =>
                          setExpandedExam(
                            expandedExam === exam.assignmentId ? null : exam.assignmentId
                          )
                        }
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{exam.examFile}</CardTitle>
                              <CardDescription>
                                Completed on {formatDate(exam.completedAt || exam.assignedAt)}
                              </CardDescription>
                            </div>
                            {exam.score !== undefined && (
                              <div className="text-right">
                                <div className="text-3xl font-bold" style={{ color: '#788c5d' }}>
                                  {Math.round(exam.score)}%
                                </div>
                                <p className="text-xs text-muted-foreground">Score</p>
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        {expandedExam === exam.assignmentId && exam.questions && (
                          <>
                            <Separator />
                            <CardContent className="pt-6">
                              <div className="space-y-6">
                                {exam.questions.map((question, idx) => (
                                  <div key={question.id} className="space-y-3 pb-6 border-b last:border-b-0">
                                    <div className="flex items-start gap-3">
                                      <span className="font-semibold text-muted-foreground min-w-[2rem]">
                                        {idx + 1}.
                                      </span>
                                      <div className="flex-1">
                                        <p className="font-serif text-base leading-relaxed">
                                          {question.question}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="ml-8 space-y-2">
                                      {question.options.map((option, optIdx) => {
                                        const optionLetter = String.fromCharCode(65 + optIdx)
                                        const isCorrect = option === question.correct_answer

                                        return (
                                          <div
                                            key={optIdx}
                                            className={`p-3 rounded border-2 ${
                                              isCorrect
                                                ? 'border-green-500 bg-green-500/10'
                                                : 'border-border bg-background'
                                            }`}
                                          >
                                            <span className="font-semibold">{optionLetter}.</span> {option}
                                            {isCorrect && (
                                              <Badge className="ml-2 bg-green-600">Correct Answer</Badge>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>

                                    <div className="ml-8 mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                                      <p className="font-semibold text-sm mb-2">Explanation:</p>
                                      <p className="text-sm text-muted-foreground">
                                        {question.explanation}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/exam-generator">
                <RefreshCw className="w-4 h-4 mr-2" />
                Take Another Exam
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
