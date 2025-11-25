'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lightbulb, TrendingDown, BookOpen, Target, Zap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import * as animations from '@/lib/animations'
import { calculateStudyStats } from '@/lib/dashboard-utils'
import { Switch } from '@/components/ui/switch'

interface AnalysisData {
  overallScore?: number
  domainBreakdown?: Record<string, { score: number; weight: number }>
  recommendations?: string[]
  topics?: string[]
}

export function StudyOptimizerContent() {
  const searchParams = useSearchParams()
  const resultsParam = searchParams.get('results')

  const [analysis, setAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studyStats, setStudyStats] = useState(calculateStudyStats())
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')

  useEffect(() => {
    if (resultsParam) {
      analyzeResults()
    }
  }, [resultsParam])

  const analyzeResults = async () => {
    if (!resultsParam) return

    try {
      setIsAnalyzing(true)
      setError(null)
      setAnalysis('')

      const response = await fetch('/api/study-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ examResults: resultsParam }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze exam results')
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
        setAnalysis((prev) => prev + text)
      }
    } catch (err) {
      console.error('Error analyzing results:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze results')
    } finally {
      setIsAnalyzing(false)
    }
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

  if (!resultsParam) {
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
                              <CardTitle className="text-xl">Lessons Needing Focus</CardTitle>
                              <CardDescription>
                                These lessons scored below 60% - prioritize them in your study plan
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
                                All your lessons are scoring above 60%. Keep up the excellent work!
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
                        <Button size="lg" variant="outline">Study Lessons</Button>
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
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  variants={animations.itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="transition-transform"
                >
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Overall Performance</CardTitle>
                        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                          <TrendingDown size={20} className="text-muted-foreground" />
                        </motion.div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <motion.p
                        className="text-4xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {analysis.match(/(\d+)%/)?.[1] || '—'}%
                      </motion.p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  variants={animations.itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="transition-transform"
                >
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Areas to Focus</CardTitle>
                        <motion.div whileHover={{ rotate: -360 }} transition={{ duration: 0.5 }}>
                          <Target size={20} className="text-muted-foreground" />
                        </motion.div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <motion.p
                        className="text-4xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {analysis.match(/\d+/)?.[0] || '—'}
                      </motion.p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  variants={animations.itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="transition-transform"
                >
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Study Plan</CardTitle>
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                          <BookOpen size={20} className="text-muted-foreground" />
                        </motion.div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <motion.p
                        className="text-2xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        Ready
                      </motion.p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Detailed Analysis */}
              <motion.div
                variants={animations.itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Zap size={24} className="text-muted-foreground" />
                      Detailed Analysis
                    </CardTitle>
                    <CardDescription>
                      Review your performance and personalized recommendations
                    </CardDescription>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="prose prose-invert max-w-none">
                      <div className="space-y-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {analysis}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

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
