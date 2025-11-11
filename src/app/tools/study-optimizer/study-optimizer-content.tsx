'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb, TrendingDown, BookOpen, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import * as animations from '@/lib/animations'

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
          <Link
            href="/tools"
            className="flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft size={18} />
            Back to Tools
          </Link>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">No exam results found</h1>
            <p className="text-muted-foreground mb-6">
              Please take a practice exam first
            </p>
            <Link href="/tools/exam-generator">
              <Button>Go to Exam Generator</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const sections = parseAnalysis()

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/tools"
          className="flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ArrowLeft size={18} />
          Back to Tools
        </Link>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={animations.containerVariants}
        >
          <motion.div variants={animations.itemVariants} className="mb-12">
            <div className="flex items-center gap-6">
              <motion.div
                className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Lightbulb size={32} className="text-amber-500" />
              </motion.div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Prioritize</h1>
                <p className="text-lg text-muted-foreground">
                  Your personalized study plan based on exam performance
                </p>
              </div>
            </div>
          </motion.div>

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
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="border border-border/50 rounded-xl p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm hover:border-blue-500/40 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Overall Performance</h3>
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                      <TrendingDown size={20} className="text-blue-500" />
                    </motion.div>
                  </div>
                  <motion.p
                    className="text-4xl font-bold text-blue-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {analysis.match(/(\d+)%/)?.[1] || '—'}%
                  </motion.p>
                </motion.div>

                <motion.div
                  variants={animations.itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="border border-border/50 rounded-xl p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm hover:border-purple-500/40 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Areas to Focus</h3>
                    <motion.div whileHover={{ rotate: -360 }} transition={{ duration: 0.5 }}>
                      <Target size={20} className="text-purple-500" />
                    </motion.div>
                  </div>
                  <motion.p
                    className="text-4xl font-bold text-purple-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {analysis.match(/\d+/)?.[0] || '—'}
                  </motion.p>
                </motion.div>

                <motion.div
                  variants={animations.itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="border border-border/50 rounded-xl p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm hover:border-green-500/40 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Study Plan</h3>
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <BookOpen size={20} className="text-green-500" />
                    </motion.div>
                  </div>
                  <motion.p
                    className="text-2xl font-bold text-green-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Ready
                  </motion.p>
                </motion.div>
              </div>

              {/* Detailed Analysis */}
              <motion.div
                variants={animations.itemVariants}
                className="rounded-xl p-8 border border-border/50 bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-sm"
              >
                <motion.h2
                  className="text-2xl font-bold mb-6 flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Zap size={24} className="text-amber-500" />
                  Detailed Analysis
                </motion.h2>
                <motion.div
                  className="prose prose-invert max-w-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="space-y-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {analysis}
                  </div>
                </motion.div>
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
                <Link href="/tools/topic-selector">
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
