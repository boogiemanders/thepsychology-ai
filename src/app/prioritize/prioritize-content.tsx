'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Lightbulb, TrendingDown, BookOpen, Target, Zap, AlertTriangle, FileText, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { useRouter, useSearchParams } from 'next/navigation'
import * as animations from '@/lib/animations'
import { calculateStudyStats, type StudyStats } from '@/lib/dashboard-utils'
import { Switch } from '@/components/ui/switch'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '@/context/auth-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ExpandableDomainAnalysis } from '@/components/expandable-domain-analysis'
import { getAllQuizResults } from '@/lib/quiz-results-storage'
import { Progress } from '@/components/ui/progress'

interface AnalysisData {
  overallScore?: number
  domainBreakdown?: Record<string, { score: number; weight: number }>
  recommendations?: string[]
  topics?: string[]
}

interface ResultHistoryItem {
  id: string
  examType: string
  examMode: string
  score: number | null
  totalQuestions: number | null
  createdAt: string
}

const HISTORY_PAGE_SIZE = 4

const fallbackStudyStats: StudyStats = {
  totalQuizzes: 0,
  averageScore: 0,
  studyStreak: 0,
  lastStudyDate: null,
  bestPerformingDomain: '',
  recentScores: [],
  weakTopics: [],
  lastStudiedTopic: null,
  studyDays: [],
}

export function PrioritizeContent() {
  const searchParams = useSearchParams()
  const resultId = searchParams.get('id')
  const resultsParam = searchParams.get('results')
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [analysis, setAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studyStats, setStudyStats] = useState<StudyStats>(fallbackStudyStats)
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')
  const [examResults, setExamResults] = useState<string | null>(null)
  const [priorityData, setPriorityData] = useState<any>(null)
  const [expandedRecommendations, setExpandedRecommendations] = useState<number[]>([])
  const [resultHistory, setResultHistory] = useState<ResultHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [selectedResultId, setSelectedResultId] = useState<string | null>(resultId)
  const [topicScores, setTopicScores] = useState<Record<string, number>>({})
  const skipNextResultFetch = useRef(false)
  const historyPages = useMemo(() => {
    if (resultHistory.length === 0) return []

    const pages: ResultHistoryItem[][] = []
    for (let i = 0; i < resultHistory.length; i += HISTORY_PAGE_SIZE) {
      pages.push(resultHistory.slice(i, i + HISTORY_PAGE_SIZE))
    }
    return pages
  }, [resultHistory])

  const handleHistorySelect = (historyId: string, options?: { updateUrl?: boolean }) => {
    if (!historyId || historyId === selectedResultId) return

    setError(null)
    setExamResults(null)
    setSelectedResultId(historyId)

    if (options?.updateUrl === false) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set('id', historyId)
    const queryString = params.toString()
    router.replace(queryString ? `/prioritize?${queryString}` : '/prioritize', { scroll: false })
  }

  const formatHistoryLabel = (item: ResultHistoryItem) => {
    const type = item.examType === 'diagnostic' ? 'Diagnostic' : 'Practice'
    const mode = item.examMode === 'test' ? 'Test Mode' : 'Study Mode'
    return `${type} • ${mode}`
  }

  const formatHistoryScore = (item: ResultHistoryItem) => {
    if (
      typeof item.score !== 'number' ||
      typeof item.totalQuestions !== 'number' ||
      item.totalQuestions === 0
    ) {
      return 'Score pending'
    }

    const percent = Math.round((item.score / item.totalQuestions) * 100)
    return `${percent}%`
  }

  const formatHistoryDate = (item: ResultHistoryItem) => {
    const date = new Date(item.createdAt)
    if (Number.isNaN(date.getTime())) return ''
    const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${day} • ${time}`
  }

  useEffect(() => {
    if (resultId) {
      setSelectedResultId(resultId)
    }
  }, [resultId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setStudyStats(calculateStudyStats())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const results = getAllQuizResults()
    const scores: Record<string, number> = {}

    results.forEach((result) => {
      if (!result?.topic) return
      const normalized = result.topic.replace(/^[\d\s]+/, '').toLowerCase()
      if (!normalized) return

      const percentage =
        result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0
      scores[normalized] = percentage
    })

    setTopicScores(scores)
  }, [])

  // Fetch exam history for quick navigation
  useEffect(() => {
    if (!userId) {
      setResultHistory([])
      return
    }

    let isMounted = true

    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true)
        setHistoryError(null)

        const response = await fetch(`/api/exam-history?userId=${userId}&limit=10`)
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to load exam history')
        }

        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'Failed to load exam history')
        }

        if (!isMounted) return

        setResultHistory(data.history || [])

        if (!resultsParam && !selectedResultId && data.history && data.history.length > 0) {
          setError(null)
          setExamResults(null)
          setSelectedResultId(data.history[0].id)
        }
      } catch (err) {
        console.error('Error fetching exam history:', err)
        if (isMounted) {
          setHistoryError(err instanceof Error ? err.message : 'Failed to load exam history')
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false)
        }
      }
    }

    fetchHistory()

    return () => {
      isMounted = false
    }
  }, [userId, resultsParam])

  // Fetch results (specific ID, legacy param, or latest exam)
  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedResultId && resultsParam) {
        setExamResults(resultsParam)
        return
      }

      if (!selectedResultId) {
        if (!userId) {
          return
        }

        try {
          setIsLoadingResults(true)
          setError(null)

          const response = await fetch(`/api/get-exam-results/latest?userId=${userId}`)

          if (response.status === 404) {
            setExamResults(null)
            return
          }

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(errorText || 'Failed to load latest exam results')
          }

          const data = await response.json()

          if (!data.success) {
            throw new Error(data.error || 'Failed to load latest exam results')
          }

          const resultData = {
            questions: data.results.questions,
            selectedAnswers: data.results.selectedAnswers,
            score: data.results.score,
            totalQuestions: data.results.totalQuestions,
            examType: data.results.examType,
            examMode: data.results.examMode,
            topPriorities: data.results.topPriorities,
            allResults: data.results.allResults,
          }

          setExamResults(JSON.stringify(resultData))

          if (!selectedResultId && data.resultId) {
            skipNextResultFetch.current = true
            setSelectedResultId(data.resultId)
          }
        } catch (err) {
          console.error('Error loading latest exam results:', err)
          setError(err instanceof Error ? err.message : 'Failed to load results')
        } finally {
          setIsLoadingResults(false)
        }
        return
      }

      if (skipNextResultFetch.current) {
        skipNextResultFetch.current = false
        return
      }

      try {
        setIsLoadingResults(true)
        setError(null)

        const response = await fetch(`/api/get-exam-results?id=${selectedResultId}`)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to load exam results')
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to load exam results')
        }

        const resultData = {
          questions: data.results.questions,
          selectedAnswers: data.results.selectedAnswers,
          score: data.results.score,
          totalQuestions: data.results.totalQuestions,
          examType: data.results.examType,
          examMode: data.results.examMode,
          topPriorities: data.results.topPriorities,
          allResults: data.results.allResults,
        }

        setExamResults(JSON.stringify(resultData))
      } catch (err) {
        console.error('Error loading results:', err)
        setError(err instanceof Error ? err.message : 'Failed to load results')
      } finally {
        setIsLoadingResults(false)
      }
    }

    fetchResults()
  }, [selectedResultId, resultsParam, userId])

  // Analyze results once they're loaded
  useEffect(() => {
    if (examResults && !isLoadingResults) {
      analyzeResults()
    }
  }, [examResults, isLoadingResults])

  const analyzeResults = async () => {
    if (!examResults) return

    try {
      setIsAnalyzing(true)
      setError(null)
      setAnalysis('')

      const response = await fetch('/api/prioritize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ examResults, userId: user?.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze exam results')
      }

      const data = await response.json()

      setAnalysis(data.markdown || '')
      setPriorityData(data.structured || null)
    } catch (err) {
      console.error('Error analyzing results:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze results')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleRecommendation = (index: number) => {
    setExpandedRecommendations((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )
  }

  const getTopicScore = (topicName?: string | null) => {
    if (!topicName) return null
    const normalized = topicName.replace(/^[\d\s]+/, '').toLowerCase()
    return typeof topicScores[normalized] === 'number' ? topicScores[normalized] : null
  }

  const parseAnalysis = () => {
    const lines = analysis.split('\n')
    const sections: Record<string, string[]> = {}
    let currentSection = 'overview'

    for (const line of lines) {
      if (line.startsWith('#')) {
        currentSection = line.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().split(' ')[0]
        sections[currentSection] = []
      } else if (line.trim()) {
        if (!sections[currentSection]) sections[currentSection] = []
        sections[currentSection].push(line)
      }
    }

    return sections
  }

  // Show loading state while fetching results from Supabase
  if (isLoadingResults) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Loading exam results...
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (!examResults && !selectedResultId && !resultsParam) {
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
                <BreadcrumbPage>Prioritizer</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div>
            <div className="text-center py-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Prioritize
              </h1>
              <p className="text-muted-foreground mb-12 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                AI-powered study recommendations based on your exam performance
              </p>

              {/* Current Progress Section */}
              {studyStats.weakTopics.length > 0 || studyStats.totalQuizzes > 0 ? (
                <div className="max-w-3xl mx-auto mb-12">
                  {/* Weak Areas Alert */}
                  {studyStats.weakTopics.length > 0 ? (
                    <div className="mb-8">
                      <Card className="border-orange-500/30 bg-orange-500/5">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <AlertTriangle size={24} className="text-orange-500 flex-shrink-0" />
                            <div className="text-left">
                              <CardTitle className="text-xl">Topics Needing Focus</CardTitle>
                              <CardDescription>
                                These topics scored below 60% - prioritize them in your study plan
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            {studyStats.weakTopics.slice(0, 3).map((topic, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-orange-500/50 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                  <div className="text-left">
                                    <p className="font-medium text-sm">{topic.topic}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Average: {topic.score}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : studyStats.totalQuizzes > 0 ? (
                    <div className="mb-8">
                      <Card className="border-green-500/30 bg-green-500/5">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <BookOpen size={24} className="text-green-500 flex-shrink-0" />
                            <div className="text-left">
                              <CardTitle className="text-xl">Great Progress!</CardTitle>
                              <CardDescription>
                                All your topics are scoring above 60%. Keep up the excellent work!
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* CTA Section */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Ready for a Practice Exam?</CardTitle>
                    <CardDescription>
                      Take a practice exam to get detailed AI-powered analysis and personalized recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 justify-center">
                      <Link href="/exam-generator">
                        <Button size="lg">Take Practice Exam</Button>
                      </Link>
                      <Link href="/topic-selector">
                        <Button size="lg" variant="outline">Study Topics</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const sections = parseAnalysis()

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
              <BreadcrumbPage>Prioritizer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Prioritize
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Your personalized study plan based on exam performance
            </p>
          </div>

          {isAnalyzing && !analysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <div className="bg-background border border-border rounded-lg p-8 text-center">
                <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Analyzing your performance...
                </p>
              </div>
            </motion.div>
          )}

          {userId && (isLoadingHistory || historyError || resultHistory.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Recent Exam Attempts</CardTitle>
                  <CardDescription>Jump between your last results.</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyError ? (
                    <p className="text-sm text-destructive">{historyError}</p>
                  ) : isLoadingHistory ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
                      Loading recent attempts...
                    </div>
                  ) : historyPages.length > 0 ? (
                    <div className="relative">
                      <Carousel className="w-full">
                        <CarouselContent className="flex gap-3 pl-2 pr-6">
                          {historyPages.map((page, pageIndex) => (
                            <CarouselItem key={`history-page-${pageIndex}`} className="w-full">
                              <div className="flex gap-3 overflow-hidden">
                                {page.map((item) => {
                                  const isActive = selectedResultId === item.id
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => handleHistorySelect(item.id)}
                                      className={`flex-1 min-w-[180px] p-4 rounded-lg border text-left transition-colors ${
                                        isActive
                                          ? 'border-primary bg-primary/10'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                                        {formatHistoryLabel(item)}
                                      </div>
                                      <div className="text-xl font-semibold">{formatHistoryScore(item)}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {formatHistoryDate(item)}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious
                          className="absolute top-1/2 -translate-y-1/2 rounded-full border border-border/40 h-10 w-10"
                          aria-label="Previous exam"
                          style={{ left: '-1.5rem' }}
                        />
                        <CarouselNext
                          className="absolute top-1/2 -translate-y-1/2 rounded-full border border-border/40 h-10 w-10"
                          aria-label="Next exam"
                          style={{ right: '-1.5rem' }}
                        />
                      </Carousel>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No completed exams yet. Take a diagnostic or practice exam to see your progress here.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
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
                onClick={analyzeResults}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {analysis && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={animations.containerVariants}
              className="space-y-8"
            >
              {/* Score Display */}
              {priorityData && (
                <motion.div
                  variants={animations.itemVariants}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <Card style={{ borderColor: '#bdd1ca', backgroundColor: 'rgba(189, 209, 202, 0.08)' }}>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">
                        {Math.round((priorityData.score / priorityData.totalQuestions) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {priorityData.score}/{priorityData.totalQuestions}
                      </div>
                    </CardContent>
                  </Card>

                  <Card style={{ borderColor: '#788c5d', backgroundColor: 'rgba(120, 140, 93, 0.08)' }}>
                    <CardHeader>
                      <CardTitle className="text-lg">Domains to Focus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {priorityData.topPriorities && priorityData.topPriorities.slice(0, 3).map((item: any, idx: number) => {
                        const isOrgPsych = item.type === 'org_psych'
                        const displayName = isOrgPsych ? item.domainName : (item.domainName.split(': ')[1] || item.domainName)
                        return (
                          <div key={idx} className="text-sm mb-2">
                            <div className="font-medium">{idx + 1}. {displayName}</div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Domain Performance Accordion */}
              {priorityData && priorityData.examQuestions && (
                <motion.div
                  variants={animations.itemVariants}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <ExpandableDomainAnalysis
                    allResults={priorityData.allResults || []}
                    examQuestions={priorityData.examQuestions || []}
                    selectedAnswers={priorityData.selectedAnswers || {}}
                    orgPsychPerformance={priorityData.orgPsychPerformance}
                  />
                </motion.div>
              )}

              {/* Recommended Study Files */}
              {priorityData && priorityData.topPriorities && priorityData.topPriorities.length > 0 && (
                <motion.div
                  variants={animations.itemVariants}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <FileText size={24} className="text-muted-foreground" />
                        Recommended Topics to Study
                      </CardTitle>
                      <CardDescription>
                        Focus on these areas based on your performance
                      </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {priorityData.topPriorities.slice(0, 3).map((item: any, idx: number) => {
                          const isExpanded = expandedRecommendations.includes(idx)
                          const isOrgPsych = item.type === 'org_psych'
                          const displayName = isOrgPsych ? item.domainName : (item.domainName.split(': ')[1] || item.domainName)
                          const recommendedTopics = item.recommendedTopics || []
                          const reviewTopics = recommendedTopics.filter((topic: any) => {
                            const topicName = topic.topicName || topic.sourceFile
                            const score = getTopicScore(topicName)
                            return !(score !== null && score >= 70)
                          })
                          const topicCount = reviewTopics.length
                          const topicLabel = topicCount === 1 ? 'topic' : 'topics'
                          const descriptionText =
                            topicCount > 0
                              ? `${topicCount} ${topicLabel} to review`
                              : 'All recommended topics completed'

                          return (
                            <Card key={idx} className="overflow-hidden hover:bg-accent/50 transition-colors">
                              <button
                                onClick={() => toggleRecommendation(idx)}
                                className="w-full text-left"
                              >
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg font-semibold">{idx + 1}.</span>
                                      <div>
                                        <CardTitle className="text-base">{displayName}</CardTitle>
                                        <CardDescription>
                                          {descriptionText}
                                        </CardDescription>
                                      </div>
                                    </div>
                                    <motion.div
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <ChevronDown size={20} className="text-muted-foreground flex-shrink-0" />
                                    </motion.div>
                                  </div>
                                </CardHeader>
                              </button>

                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{
                                      duration: 0.3,
                                      ease: 'easeInOut',
                                      opacity: { duration: 0.2 },
                                    }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <CardContent className="pt-0">
                                      {recommendedTopics.length > 0 ? (
                                        <ul className="text-sm space-y-3">
                                          {recommendedTopics.map((topic: any, topicIdx: number) => {
                                            const topicName = topic.topicName || topic.sourceFile
                                            const topicParam = topic.topicName || topic.sourceFile || ''
                                            const topicScore = getTopicScore(topicName)
                                            const isCompleted = topicScore !== null && topicScore >= 70
                                            const progressValue =
                                              topicScore !== null
                                                ? Math.max(0, Math.min(100, Math.round(topicScore)))
                                                : null

                                            return (
                                              <li key={topicIdx} className="space-y-1">
                                                <div className="flex items-center justify-between gap-3">
                                                  <Link
                                                    href={`/topic-teacher?domain=${encodeURIComponent(topic.domainId)}&topic=${encodeURIComponent(topicParam)}&hasQuizResults=true&hasExamResults=true`}
                                                    className={`hover:underline ${
                                                      isCompleted ? 'text-muted-foreground' : 'text-foreground'
                                                    }`}
                                                    style={{ color: isCompleted ? undefined : '#6a9bcc' }}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                  >
                                                    {topicName}
                                                  </Link>
                                                  {topicScore !== null && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                      <span
                                                        className={`font-semibold ${
                                                          isCompleted ? 'text-emerald-500' : 'text-amber-500'
                                                        }`}
                                                      >
                                                        {isCompleted
                                                          ? `Completed (${Math.round(topicScore)}%)`
                                                          : `${Math.round(topicScore)}%`}
                                                      </span>
                                                      {progressValue !== null && (
                                                        <div className="w-20">
                                                          <Progress value={progressValue} className="h-1" />
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </li>
                                            )
                                          })}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          {isOrgPsych ? 'Review all Organizational Psychology topics' : 'Review all topics in this domain'}
                                        </p>
                                      )}
                                    </CardContent>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Card>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                variants={animations.itemVariants}
                className="flex gap-4 justify-center pt-4"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalysis('')
                    setError(null)
                    setPriorityData(null)
                  }}
                >
                  Take Another Exam
                </Button>
                <Link href="/topic-selector">
                  <Button>
                    Start Studying
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
