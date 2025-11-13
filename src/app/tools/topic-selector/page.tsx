'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'motion/react'
import { getAllQuizResults } from '@/lib/quiz-results-storage'

const domainConfig = [
  {
    id: '1',
    name: 'Domain 1: Biological Bases of Behavior',
    topics: [
      'Neurotransmitters & Receptors',
      'Brain Anatomy & Function',
      'Nervous System Organization',
      'Psychopharmacology',
      'Sleep & Circadian Rhythms',
    ],
  },
  {
    id: '2',
    name: 'Domain 2: Cognitive-Affective Bases',
    topics: [
      'Classical & Operant Conditioning',
      'Observational Learning',
      'Memory Systems & Encoding',
      'Attention & Consciousness',
      'Motivation & Emotion',
    ],
  },
  {
    id: '3',
    name: 'Domain 3: Social & Cultural Foundations',
    topics: [
      'Social Cognition & Attitudes',
      'Group Dynamics & Conformity',
      'Cultural Psychology',
      'Organizational Psychology',
      'Diversity & Multicultural Issues',
    ],
  },
  {
    id: '4',
    name: 'Domain 4: Growth & Lifespan Development',
    topics: [
      'Physical Development',
      'Cognitive Development',
      'Psychosocial Development',
      'Moral Development',
      'Aging & Late Adulthood',
    ],
  },
  {
    id: '5',
    name: 'Domain 5: Assessment & Diagnosis',
    topics: [
      'Psychological Testing Principles',
      'Intelligence Assessment',
      'Personality Assessment',
      'Clinical Diagnosis & Psychopathology',
      'Substance Use Disorders',
    ],
  },
  {
    id: '6',
    name: 'Domain 6: Treatment, Intervention, and Prevention',
    topics: [
      'Cognitive-Behavioral Therapies',
      'Psychodynamic Therapies',
      'Humanistic & Experiential Therapies',
      'Group & Family Therapy',
      'Evidence-Based Interventions',
    ],
  },
  {
    id: '7',
    name: 'Domain 7: Research Methods & Statistics',
    topics: [
      'Research Design & Methodology',
      'Experimental vs Non-Experimental',
      'Descriptive Statistics',
      'Inferential Statistics',
      'Effect Size & Power',
    ],
  },
  {
    id: '8',
    name: 'Domain 8: Ethical, Legal & Professional Issues',
    topics: [
      'Ethical Principles & Guidelines',
      'Confidentiality & Privacy',
      'Informed Consent',
      'Competence & Boundaries',
      'Legal Liability & Licensing',
    ],
  },
]

export default function TopicSelectorPage() {
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])
  const [interests, setInterests] = useState<string>('')
  const [domains, setDomains] = useState<any[]>([])

  // Calculate progress based on quiz results
  useEffect(() => {
    const allResults = getAllQuizResults()

    // Create a map of topic scores
    const topicScores: Record<string, number> = {}
    allResults.forEach((result) => {
      const percentage = (result.score / result.totalQuestions) * 100
      topicScores[result.topic] = percentage
    })

    // Build domains with dynamic progress
    const domainsWithProgress = domainConfig.map((domain) => {
      const topicsWithProgress = domain.topics.map((topicName) => {
        // If quiz exists, show actual score; otherwise show 0%
        const score = topicScores[topicName] ?? 0
        return {
          name: topicName,
          progress: Math.round(score),
        }
      })

      // Calculate domain progress as average of all topics
      const avgProgress = topicsWithProgress.length > 0
        ? Math.round(topicsWithProgress.reduce((sum, t) => sum + t.progress, 0) / topicsWithProgress.length)
        : 0

      return {
        id: domain.id,
        name: domain.name,
        progress: avgProgress,
        topics: topicsWithProgress,
      }
    })

    setDomains(domainsWithProgress)
  }, [])

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((id) => id !== domainId)
        : [...prev, domainId]
    )
  }

  const handleAddInterest = () => {
    if (interests.trim()) {
      // Interests can be used to customize the study material
      setInterests('')
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="p-6 border-b">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm hover:underline mb-6"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Topics</h1>
              <p className="text-sm text-muted-foreground">
                Select a topic to start studying
              </p>
            </div>

            <div className="flex-1 max-w-xs">
              <Input
                placeholder="Add your study interests for personalization..."
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
              />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {domains.map((domain, index) => (
            <Card key={domain.id} className="border">
              <button
                onClick={() => toggleDomain(domain.id)}
                className="w-full"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-accent transition-colors text-left w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">{domain.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{domain.progress}%</span>
                      <motion.div
                        animate={{
                          rotate: expandedDomains.includes(domain.id) ? 180 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} />
                      </motion.div>
                    </div>
                  </div>
                  <Progress value={domain.progress} className="h-1" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {expandedDomains.includes(domain.id) && (
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
                    <Separator />
                    <CardContent className="pt-4 pb-4 space-y-3">
                      {domain.topics.map((topic) => (
                        <Link
                          key={topic.name}
                          href={`/tools/topic-teacher?domain=${domain.id}&topic=${encodeURIComponent(topic.name)}`}
                          className="block hover:opacity-75 transition-opacity"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{topic.name}</span>
                            <span className="text-xs text-muted-foreground">{topic.progress}%</span>
                          </div>
                          <Progress value={topic.progress} className="h-1.5" />
                        </Link>
                      ))}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
