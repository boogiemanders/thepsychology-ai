'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { motion } from 'motion/react'
import { getTopicById, getDomainById } from '@/lib/eppp-data'
import { getKNsForTopic } from '@/lib/kn-topic-mapping'
import { getTopPriorities } from '@/lib/priority-storage'
import type { PriorityDomainRecommendation } from '@/lib/priority-storage'

export default function PrioritizerPage() {
  const [recommendations, setRecommendations] = useState<PriorityDomainRecommendation[] | null>(null)
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get recommendations from URL params or localStorage
    const params = new URLSearchParams(window.location.search)
    const resultsParam = params.get('results')

    if (resultsParam) {
      try {
        const data = JSON.parse(decodeURIComponent(resultsParam))
        setRecommendations(data.topPriorities || [])

        // Save to localStorage for persistence
        const { savePriorityRecommendationToSupabase } = require('@/lib/priority-storage')
        if (data.topPriorities) {
          savePriorityRecommendationToSupabase({
            examType: data.examType,
            examMode: data.examMode,
            topPriorities: data.topPriorities,
            allResults: data.allResults || [],
          }, '')
        }
      } catch (error) {
        console.error('Error parsing recommendations:', error)
      }
    } else {
      // Try to load from localStorage (latest recommendations)
      const priorities = getTopPriorities('diagnostic')
      if (priorities && priorities.length > 0) {
        setRecommendations(priorities)
      }
    }

    setLoading(false)
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading recommendations...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!recommendations || recommendations.length === 0) {
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
            className="text-center py-20"
          >
            <h1 className="text-3xl font-bold mb-4">No Recommendations Yet</h1>
            <p className="text-muted-foreground mb-6">
              Complete a diagnostic or practice exam to get personalized recommendations.
            </p>
            <Link href="/exam-generator">
              <Button size="lg">Start an Exam</Button>
            </Link>
          </motion.div>
        </div>
      </main>
    )
  }

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
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <h1 className="text-4xl font-bold">Your Priority Recommendations</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Based on your exam results, here are the top 3 domains you should focus on. We've identified the specific knowledge gaps and recommended topics to study.
            </p>
          </div>

          {/* Priority Domains */}
          <div className="space-y-4">
            {recommendations.map((domain, index) => (
              <motion.div
                key={domain.domainNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer transition-all hover:shadow-lg overflow-hidden"
                  onClick={() => setExpandedDomain(expandedDomain === domain.domainNumber ? null : domain.domainNumber)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                            #{index + 1} Priority
                          </Badge>
                          <CardTitle className="text-xl">
                            {domain.domainName}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-base mt-2">
                          {domain.percentageWrong}% of questions answered incorrectly
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {domain.priorityScore.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Priority Score</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Knowledge Gap</span>
                        <span className="font-semibold">{domain.percentageWrong}%</span>
                      </div>
                      <Progress value={domain.percentageWrong} className="h-2" />
                    </div>

                    {/* Expandable Content */}
                    {expandedDomain === domain.domainNumber && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4"
                      >
                        <Separator />

                        {/* Wrong Knowledge Statements */}
                        {domain.wrongKNs && domain.wrongKNs.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Knowledge Gaps Identified</h4>
                            <div className="space-y-2">
                              {domain.wrongKNs.map((kn) => (
                                <div key={kn.knId} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                                    ✕
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm">{kn.knId}: {kn.knName}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Topics */}
                        {domain.recommendedTopicIds && domain.recommendedTopicIds.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Recommended Topics to Study</h4>
                            <div className="space-y-2">
                              {domain.recommendedTopicIds.map((topicId) => {
                                const topic = getTopicById(topicId)
                                return (
                                  <Link
                                    key={topicId}
                                    href={`/topic-teacher?topicId=${topicId}&fromPrioritizer=true`}
                                  >
                                    <motion.div
                                      whileHover={{ scale: 1.02 }}
                                      className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 cursor-pointer hover:shadow-md transition-shadow"
                                    >
                                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 truncate">
                                          {topic?.name || topicId}
                                        </p>
                                      </div>
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        Study
                                      </Badge>
                                    </motion.div>
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Study Strategy */}
                        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                          <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                            Recommended Study Strategy
                          </p>
                          <ul className="text-sm space-y-1 text-green-800 dark:text-green-200">
                            {domain.percentageWrong > 50 ? (
                              <>
                                <li>• This is a major knowledge gap - prioritize immediate study</li>
                                <li>• Spend 2-3 sessions studying the recommended topics</li>
                                <li>• Retake the diagnostic exam after studying to measure improvement</li>
                              </>
                            ) : domain.percentageWrong > 30 ? (
                              <>
                                <li>• This domain needs focused review</li>
                                <li>• Study the recommended topics over 1-2 sessions</li>
                                <li>• Review weak knowledge statements multiple times</li>
                              </>
                            ) : (
                              <>
                                <li>• Minor gaps detected - light review recommended</li>
                                <li>• Focus on the specific wrong knowledge statements</li>
                                <li>• One study session should be sufficient</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-3 justify-center pt-8">
            <Link href="/topic-selector">
              <Button size="lg" variant="outline">
                Browse All Topics
              </Button>
            </Link>
            <Link href="/exam-generator">
              <Button size="lg">
                Start Another Exam
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
