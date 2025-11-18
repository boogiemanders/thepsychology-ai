'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CheckCircle2, XCircle, Circle } from 'lucide-react'

interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
  domain: string
  is_org_psych?: boolean
}

interface DomainResult {
  domainNumber?: number
  domainName: string
  type?: string
  percentageWrong: number
  domainWeight: number
  priorityScore: number
  totalQuestionsInDomain?: number
  totalWrongInDomain?: number
}

interface ExpandableDomainAnalysisProps {
  allResults: DomainResult[]
  examQuestions: Question[]
  selectedAnswers: Record<number, string>
  orgPsychPerformance?: {
    percentageWrong: number
    priorityScore: number
  }
}

const BRAND_COLORS = {
  softSage: '#bdd1ca',
  olive: '#788c5d',
  coral: '#d87758',
  dustyRose: '#c46685',
  lavenderGray: '#cbc9db',
  softBlue: '#6a9bcc',
}

export function ExpandableDomainAnalysis({
  allResults,
  examQuestions,
  selectedAnswers,
  orgPsychPerformance,
}: ExpandableDomainAnalysisProps) {
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])

  const toggleDomain = (domainName: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainName)
        ? prev.filter((d) => d !== domainName)
        : [...prev, domainName]
    )
  }

  const getDomainQuestions = (domainName: string): Question[] => {
    return examQuestions.filter((q) => {
      if (domainName === 'Organizational Psychology') {
        return q.is_org_psych === true
      }
      return q.domain && q.domain.includes(domainName.split(': ')[1] || domainName)
    })
  }

  const getPriorityColor = (correctPct: number): string => {
    if (correctPct >= 70) return BRAND_COLORS.softSage
    if (correctPct >= 40) return BRAND_COLORS.olive
    return BRAND_COLORS.coral
  }

  const getPriorityLabel = (correctPct: number): string => {
    if (correctPct >= 70) return 'Low'
    if (correctPct >= 40) return 'Medium'
    return 'High'
  }

  const getQuestionStatus = (questionId: number) => {
    const question = examQuestions.find((q) => q.id === questionId)
    const selectedAnswer = selectedAnswers[questionId]

    if (!selectedAnswer || selectedAnswer === 'skipped') {
      return 'skipped'
    }

    if (question && selectedAnswer === question.correct_answer) {
      return 'correct'
    }

    return 'wrong'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct':
        return <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
      case 'wrong':
        return <XCircle size={16} className="text-red-600 flex-shrink-0" />
      case 'skipped':
        return <Circle size={16} className="text-amber-600 flex-shrink-0" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct':
        return 'rgba(34, 197, 94, 0.05)'
      case 'wrong':
        return 'rgba(239, 68, 68, 0.05)'
      case 'skipped':
        return 'rgba(217, 119, 16, 0.05)'
      default:
        return 'transparent'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Domain Analysis</CardTitle>
        <CardDescription>
          Click on a domain to see all practice exam questions and your performance
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <Accordion type="single" collapsible className="w-full">
          {/* Regular Domains */}
          {allResults
            .filter((domain) => domain.domainNumber !== undefined)
            .map((domain) => {
              const domainQuestions = getDomainQuestions(domain.domainName)
              const totalInDomain = domainQuestions.length
              const wrongInDomain = domainQuestions.filter(
                (q) => getQuestionStatus(q.id) !== 'correct'
              ).length
              const correctInDomain = totalInDomain - wrongInDomain
              const correctPct = totalInDomain > 0 ? Math.round((correctInDomain / totalInDomain) * 100) : 0
              const priorityColor = getPriorityColor(correctPct)
              const priorityLabel = getPriorityLabel(correctPct)

              return (
                <AccordionItem key={domain.domainName} value={domain.domainName}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-left">
                          <div className="font-semibold">
                            {domain.domainName.split(': ')[1] || domain.domainName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {correctInDomain}/{totalInDomain} correct ({correctPct}%)
                          </div>
                        </div>
                      </div>
                      <Badge style={{ backgroundColor: priorityColor, color: '#ffffff', borderColor: priorityColor }}>
                        {priorityLabel}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-sm text-muted-foreground">Performance</div>
                          <div className="text-2xl font-bold">{correctPct}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Weight</div>
                          <div className="text-2xl font-bold">{Math.round(domain.domainWeight * 100)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">% Wrong</div>
                          <div className="text-2xl font-bold">{domain.percentageWrong.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Priority Score</div>
                          <div className="text-2xl font-bold">{domain.priorityScore.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Questions List - Nested Accordion */}
                      <Accordion type="single" collapsible className="w-full space-y-2">
                        {domainQuestions.map((question, idx) => {
                          const status = getQuestionStatus(question.id)

                          return (
                            <motion.div
                              key={question.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <AccordionItem
                                value={`q-${question.id}`}
                                className="border border-border rounded-lg"
                                style={{ backgroundColor: getStatusColor(status) }}
                              >
                                <AccordionTrigger className="hover:no-underline px-3 py-2">
                                  <div className="flex items-start gap-3 flex-1">
                                    {getStatusIcon(status)}
                                    <div className="flex-1 min-w-0 text-left">
                                      <div className="font-medium text-sm">
                                        Q{question.id}: {question.question.substring(0, 60)}
                                        {question.question.length > 60 ? '...' : ''}
                                      </div>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                  <div className="space-y-4">
                                    {/* Full Question */}
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Question</h4>
                                      <p className="text-sm text-foreground">{question.question}</p>
                                    </div>

                                    {/* All Options */}
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Options</h4>
                                      <div className="space-y-1">
                                        {question.options.map((option, optIdx) => {
                                          const isCorrect = option === question.correct_answer
                                          const isSelected =
                                            selectedAnswers[question.id] === option
                                          const optionLetter = String.fromCharCode(65 + optIdx)

                                          return (
                                            <div
                                              key={optIdx}
                                              className={`text-sm p-2 rounded flex items-start gap-2 ${
                                                isCorrect ? 'bg-green-100/50 text-green-900' : ''
                                              } ${
                                                isSelected && !isCorrect
                                                  ? 'bg-red-100/50 text-red-900'
                                                  : ''
                                              }`}
                                            >
                                              <span className="font-semibold flex-shrink-0">{optionLetter}.</span>
                                              <span className="break-words">
                                                {option}
                                                {isCorrect && <span className="font-semibold ml-2">✓ Correct</span>}
                                                {isSelected && !isCorrect && (
                                                  <span className="font-semibold ml-2">✗ Your answer</span>
                                                )}
                                              </span>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>

                                    {/* Explanation */}
                                    {question.explanation && (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded">
                                          {question.explanation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </motion.div>
                          )
                        })}
                      </Accordion>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}

          {/* Organizational Psychology */}
          {orgPsychPerformance && (
            <AccordionItem value="Organizational Psychology">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-left">
                      <div className="font-semibold">Organizational Psychology</div>
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          const orgQuestions = getDomainQuestions('Organizational Psychology')
                          const wrongCount = orgQuestions.filter(
                            (q) => getQuestionStatus(q.id) !== 'correct'
                          ).length
                          const correctCount = orgQuestions.length - wrongCount
                          return `${correctCount}/${orgQuestions.length} correct (${
                            orgQuestions.length > 0
                              ? Math.round((correctCount / orgQuestions.length) * 100)
                              : 0
                          }%)`
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      style={{
                        backgroundColor: getPriorityColor(
                          Math.round(
                            (1 - (orgPsychPerformance.percentageWrong || 0) / 100) * 100
                          )
                        ),
                        color: '#ffffff',
                        borderColor: getPriorityColor(
                          Math.round(
                            (1 - (orgPsychPerformance.percentageWrong || 0) / 100) * 100
                          )
                        ),
                      }}
                    >
                      {getPriorityLabel(
                        Math.round(
                          (1 - (orgPsychPerformance.percentageWrong || 0) / 100) * 100
                        )
                      )}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Performance</div>
                      <div className="text-2xl font-bold">
                        {Math.round(
                          (1 - (orgPsychPerformance.percentageWrong || 0) / 100) * 100
                        )}
                        %
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Weight</div>
                      <div className="text-2xl font-bold">21%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">% Wrong</div>
                      <div className="text-2xl font-bold">
                        {(orgPsychPerformance.percentageWrong || 0).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Priority Score</div>
                      <div className="text-2xl font-bold">
                        {(orgPsychPerformance.priorityScore || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Organizational Psychology Questions List - Nested Accordion */}
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {getDomainQuestions('Organizational Psychology').map((question, idx) => {
                      const status = getQuestionStatus(question.id)

                      return (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <AccordionItem
                            value={`org-q-${question.id}`}
                            className="border border-border rounded-lg"
                            style={{ backgroundColor: getStatusColor(status) }}
                          >
                            <AccordionTrigger className="hover:no-underline px-3 py-2">
                              <div className="flex items-start gap-3 flex-1">
                                {getStatusIcon(status)}
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="font-medium text-sm">
                                    Q{question.id}: {question.question.substring(0, 60)}
                                    {question.question.length > 60 ? '...' : ''}
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                              <div className="space-y-4">
                                {/* Full Question */}
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Question</h4>
                                  <p className="text-sm text-foreground">{question.question}</p>
                                </div>

                                {/* All Options */}
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Options</h4>
                                  <div className="space-y-1">
                                    {question.options.map((option, optIdx) => {
                                      const isCorrect = option === question.correct_answer
                                      const isSelected =
                                        selectedAnswers[question.id] === option
                                      const optionLetter = String.fromCharCode(65 + optIdx)

                                      return (
                                        <div
                                          key={optIdx}
                                          className={`text-sm p-2 rounded flex items-start gap-2 ${
                                            isCorrect ? 'bg-green-100/50 text-green-900' : ''
                                          } ${
                                            isSelected && !isCorrect
                                              ? 'bg-red-100/50 text-red-900'
                                              : ''
                                          }`}
                                        >
                                          <span className="font-semibold flex-shrink-0">
                                            {optionLetter}.
                                          </span>
                                          <span className="break-words">
                                            {option}
                                            {isCorrect && (
                                              <span className="font-semibold ml-2">✓ Correct</span>
                                            )}
                                            {isSelected && !isCorrect && (
                                              <span className="font-semibold ml-2">
                                                ✗ Your answer
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Explanation */}
                                {question.explanation && (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded">
                                      {question.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </motion.div>
                      )
                    })}
                  </Accordion>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  )
}
