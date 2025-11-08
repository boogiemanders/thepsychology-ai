'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'

const domains = [
  {
    id: '1',
    name: 'Domain 1: Biological Bases of Behavior',
    description: 'Physiological Psychology and Psychopharmacology',
    completion: 65,
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
    description: 'Learning and Memory',
    completion: 45,
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
    description: 'Social Psychology, Cultural, and Organizational',
    completion: 80,
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
    description: 'Human Development Across the Lifespan',
    completion: 30,
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
    description: 'Assessment, Diagnosis/Psychopathology, and Test Construction',
    completion: 55,
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
    description: 'Clinical Psychology',
    completion: 90,
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
    description: 'Research Design and Data Analysis',
    completion: 20,
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
    description: 'Professional Conduct and Regulation',
    completion: 75,
    topics: [
      'Ethical Principles & Guidelines',
      'Confidentiality & Privacy',
      'Informed Consent',
      'Competence & Boundaries',
      'Legal Liability & Licensing',
    ],
  },
  {
    id: '2356',
    name: 'Domains 2, 3, 5, 6: Organizational Psychology',
    description: 'Integrated Organizational & Workplace Topics',
    completion: 50,
    topics: [
      'Motivation & Organizational Behavior',
      'Organizational Psychology & Culture',
      'Group Dynamics & Teams',
      'Assessment in Organizations',
      'Organizational Interventions',
      'Leadership & Management',
      'Workplace Well-being',
    ],
  },
]

export default function TopicSelectorPage() {
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((id) => id !== domainId)
        : [...prev, domainId]
    )
  }

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
          className="w-full"
        >
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mb-4">Topics</h1>
            <p className="text-lg text-muted-foreground">
              Click to expand domains and select your topic.
            </p>
          </div>

          <div className="space-y-3">
            {domains.map((domain, index) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-border/50 rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 group"
              >
                <button
                  onClick={() => toggleDomain(domain.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors text-left"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{domain.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {domain.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 56 56">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-border/50"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-primary transition-all duration-300"
                          strokeDasharray={`${(domain.completion / 100) * (24 * 2 * Math.PI)} ${24 * 2 * Math.PI}`}
                        />
                      </svg>
                      <span className="absolute text-xs font-semibold">{domain.completion}%</span>
                    </div>
                    <motion.div
                      animate={{
                        rotate: expandedDomains.includes(domain.id) ? 180 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={20} className="text-muted-foreground" />
                    </motion.div>
                  </div>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: expandedDomains.includes(domain.id)
                      ? 'auto'
                      : 0,
                    opacity: expandedDomains.includes(domain.id) ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-border bg-secondary/10"
                >
                  <div className="p-6 space-y-3 border-t border-border/30 bg-background/50">
                    {domain.topics.map((topic) => (
                      <Link
                        key={topic}
                        href={`/tools/topic-teacher?domain=${domain.id}&topic=${encodeURIComponent(topic)}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/30 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/40 transition-all duration-300 group"
                      >
                        <CheckCircle
                          size={18}
                          className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"
                        />
                        <span className="text-sm group-hover:text-primary transition-colors flex-1 font-medium">
                          {topic}
                        </span>
                        <motion.span
                          className="ml-auto text-muted-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={{ x: -4 }}
                          whileHover={{ x: 0 }}
                        >
                          →
                        </motion.span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
