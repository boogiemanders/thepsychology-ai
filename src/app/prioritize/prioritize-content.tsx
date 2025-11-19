'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lightbulb, TrendingDown, BookOpen, Target, Zap, AlertTriangle, FileText, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { useSearchParams } from 'next/navigation'
import * as animations from '@/lib/animations'
import { calculateStudyStats } from '@/lib/dashboard-utils'
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

interface AnalysisData {
  overallScore?: number
  domainBreakdown?: Record<string, { score: number; weight: number }>
  recommendations?: string[]
  topics?: string[]
}

export function PrioritizeContent() {
  const searchParams = useSearchParams()
  const resultId = searchParams.get('id')
  const resultsParam = searchParams.get('results')
  const { user } = useAuth()

  const [analysis, setAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studyStats, setStudyStats] = useState(calculateStudyStats())
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')
  const [examResults, setExamResults] = useState<string | null>(null)
  const [priorityData, setPriorityData] = useState<any>(null)
  const [expandedRecommendations, setExpandedRecommendations] = useState<number[]>([])

  // Fetch results from Supabase if ID is provided
  useEffect(() => {
    const fetchResults = async () => {
      if (!resultId) {
        // Use results from URL param if available (backward compatibility)
        if (resultsParam) {
          setExamResults(resultsParam)
        }
        return
      }

      try {
        setIsLoadingResults(true)
        setError(null)

        const response = await fetch(`/api/get-exam-results?id=${resultId}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to load exam results')
        }

        // Convert to same format as URL param for backward compatibility
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
  }, [resultId, resultsParam])

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

  if (!examResults && !resultId && !resultsParam) {
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
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mb-8"
                    >
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
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (idx + 2) * 0.1 }}
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
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : studyStats.totalQuizzes > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mb-8"
                    >
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
                    </motion.div>
                  ) : null}
                </div>
              ) : null}

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
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
              </motion.div>
            </div>
          </motion.div>
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

              {/* Top 3 Priority Domains */}
              {priorityData && priorityData.topPriorities && priorityData.topPriorities.length > 0 && (
                <motion.div
                  variants={animations.itemVariants}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {(() => {
                    // Get top 3 domain results
                    const top3Results = priorityData.topPriorities
                      .filter((item: any) => item.type === 'domain')
                      .map((item: any) => ({
                        domainNumber: item.domainNumber,
                        domainName: item.domainName,
                        percentageWrong: item.percentageWrong,
                        domainWeight: item.domainWeight,
                        priorityScore: item.priorityScore,
                        totalQuestionsInDomain: priorityData.allResults?.find(
                          (r: any) => r.domainNumber === item.domainNumber
                        )?.totalQuestionsInDomain,
                        totalWrongInDomain: priorityData.allResults?.find(
                          (r: any) => r.domainNumber === item.domainNumber
                        )?.totalWrongInDomain,
                      }))

                    // Check if org psych is in top 3
                    const isOrgPsychInTop3 = priorityData.topPriorities.some(
                      (item: any) => item.type === 'org_psych'
                    )

                    return (
                      <ExpandableDomainAnalysis
                        allResults={top3Results}
                        examQuestions={priorityData.examQuestions || []}
                        selectedAnswers={priorityData.selectedAnswers || {}}
                        orgPsychPerformance={isOrgPsychInTop3 ? priorityData.orgPsychPerformance : undefined}
                        title="Top 3 Priority Domains"
                        description="Focus your study time on these highest-priority areas"
                        showOnlyWrong={true}
                        showSourceFile={true}
                      />
                    )
                  })()}
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
                          const topicCount = (item.recommendedTopics?.length || 0)
                          const topicLabel = 'topic'

                          return (
                            <Card key={idx} className="overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors">
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
                                          {topicCount} {topicLabel}{topicCount !== 1 ? 's' : ''} to review
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
                                      {isOrgPsych ? (
                                        item.recommendedTopics && item.recommendedTopics.length > 0 ? (
                                          <ul className="text-sm space-y-2">
                                            {item.recommendedTopics.map((topic: any, topicIdx: number) => {
                                              // Use sourceFile if available (actual filename), otherwise use topicName
                                              const displayName = topic.sourceFile || topic.topicName
                                              return (
                                                <li key={topicIdx}>
                                                  <Link
                                                    href={`/topic-teacher?domain=${encodeURIComponent(topic.domainId)}&topic=${encodeURIComponent(topic.topicName)}&hasQuizResults=true`}
                                                    className="hover:underline"
                                                    style={{ color: '#6a9bcc' }}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                  >
                                                    {displayName}
                                                  </Link>
                                                </li>
                                              )
                                            })}
                                          </ul>
                                        ) : (
                                          <p className="text-sm text-muted-foreground">
                                            Review all Organizational Psychology topics
                                          </p>
                                        )
                                      ) : item.recommendedTopics && item.recommendedTopics.length > 0 ? (
                                        <ul className="text-sm space-y-2">
                                          {item.recommendedTopics.map((topic: any, topicIdx: number) => {
                                            // Use sourceFile if available (actual filename), otherwise use topicName
                                            const displayName = topic.sourceFile || topic.topicName
                                            return (
                                              <li key={topicIdx}>
                                                <Link
                                                  href={`/topic-teacher?domain=${encodeURIComponent(topic.domainId)}&topic=${encodeURIComponent(topic.topicName)}&hasQuizResults=true`}
                                                  className="hover:underline"
                                                  style={{ color: '#6a9bcc' }}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  {displayName}
                                                </Link>
                                              </li>
                                            )
                                          })}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          Review all topics in this domain
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
