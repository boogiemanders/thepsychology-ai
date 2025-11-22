'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CheckCircle2, XCircle, Circle } from 'lucide-react'
import type { DomainPerformance } from '@/lib/priority-calculator'

interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
  domain: string
  is_org_psych?: boolean
  source_file?: string
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
  title?: string | null
  description?: string | null
  showOnlyWrong?: boolean
  showSourceFile?: boolean
  // Optional scored-status map per question index to avoid recomputing
  scoredStatusByIndex?: Record<number, 'correct' | 'wrong' | 'skipped'>
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
  title,
  description,
  showOnlyWrong = false,
  showSourceFile = false,
  scoredStatusByIndex,
}: ExpandableDomainAnalysisProps) {
  const resolvedTitle = title === undefined ? 'Domain Analysis' : title
  const resolvedDescription =
    description === undefined
      ? 'Click on a domain to see all practice exam questions and your performance'
      : description

  const hasTitle = typeof resolvedTitle === 'string' && resolvedTitle.trim().length > 0
  const hasDescription =
    typeof resolvedDescription === 'string' && resolvedDescription.trim().length > 0
  const shouldRenderHeader = hasTitle || hasDescription

  const [expandedDomains, setExpandedDomains] = useState<string[]>([])

  const questionIndexLookup = useMemo(() => {
    const map = new Map<Question, number>()
    examQuestions.forEach((question, index) => {
      map.set(question, index)
    })
    return map
  }, [examQuestions])

  const toggleDomain = (domainName: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainName)
        ? prev.filter((d) => d !== domainName)
        : [...prev, domainName]
    )
  }

  const getDomainQuestions = (domainName: string, domainNumber?: number): Question[] => {
    return examQuestions.filter((q) => {
      if (domainName === 'Organizational Psychology') {
        return q.is_org_psych === true
      }

      if (!q.domain) return false

      if (domainNumber) {
        const match = q.domain.match(/Domain\s*(\d+)/i)
        if (match && parseInt(match[1], 10) === domainNumber) {
          return true
        }
      }

      const normalizedName = domainName.split(': ')[1] || domainName
      return q.domain.includes(normalizedName)
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

  const getSelectedAnswerForQuestion = (question: Question) => {
    if (!question) return undefined

    const index = questionIndexLookup.get(question)
    if (typeof index !== 'undefined') {
      return selectedAnswers[index]
    }

    if (typeof question.id !== 'undefined') {
      const answerById = selectedAnswers[question.id]
      if (typeof answerById !== 'undefined') {
        return answerById
      }

      if (typeof question.id === 'number' && question.id > 0) {
        const zeroBasedAnswer = selectedAnswers[question.id - 1]
        if (typeof zeroBasedAnswer !== 'undefined') {
          return zeroBasedAnswer
        }
      }
    }

    return undefined
  }

  const getQuestionStatus = (question: Question) => {
    const index = questionIndexLookup.get(question)
    if (typeof index === 'number' && scoredStatusByIndex && scoredStatusByIndex[index]) {
      return scoredStatusByIndex[index]
    }

    const selectedAnswer = getSelectedAnswerForQuestion(question)
    const isScored =
      typeof question.isScored === 'boolean'
        ? question.isScored
        : typeof (question as any).scored === 'boolean'
        ? (question as any).scored
        : true

    if (!isScored) return 'unscored'

    if (!selectedAnswer || selectedAnswer === 'skipped') {
      return 'skipped'
    }

    if (selectedAnswer === question.correct_answer) {
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
      case 'unscored':
        return <Circle size={16} className="text-slate-500 flex-shrink-0" />
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
      case 'unscored':
        return 'rgba(148, 163, 184, 0.08)'
      default:
        return 'transparent'
    }
  }

  const getAnswerLabel = (question: Question, answer?: string) => {
    if (!answer) return null
    const optionIndex = question.options.findIndex((opt) => opt === answer)
    if (optionIndex === -1) return answer
    const optionLetter = String.fromCharCode(65 + optionIndex)
    return `${optionLetter}. ${answer}`
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'correct':
        return { label: 'Correct', color: 'text-green-600' }
      case 'wrong':
        return { label: 'Incorrect', color: 'text-red-600' }
      case 'skipped':
        return { label: 'Skipped', color: 'text-amber-600' }
      case 'unscored':
        return { label: 'Unscored', color: 'text-muted-foreground' }
      default:
        return { label: 'Unknown', color: 'text-muted-foreground' }
    }
  }

  return (
    <Card>
      {shouldRenderHeader && (
        <>
          <CardHeader>
            {hasTitle && <CardTitle className="text-2xl">{resolvedTitle}</CardTitle>}
            {hasDescription && <CardDescription>{resolvedDescription}</CardDescription>}
          </CardHeader>
          <Separator />
        </>
      )}
      <CardContent className="pt-6">
        <Accordion type="single" collapsible className="w-full">
          {/* Regular Domains */}
          {allResults
            .filter((domain) => domain.domainNumber !== undefined)
            .map((domain) => {
              const domainQuestions = getDomainQuestions(domain.domainName, domain.domainNumber)
              const calculatedTotal = domain.totalQuestionsInDomain ?? 0
              const calculatedWrong = domain.totalWrongInDomain ?? 0

              // Fallback to question-based counts only if calculator data is missing
              const totalInDomain =
                calculatedTotal > 0 ? calculatedTotal : domainQuestions.length
              const wrongInDomain =
                calculatedTotal > 0
                  ? calculatedWrong
                  : domainQuestions.filter(
                (q) => getQuestionStatus(q) !== 'correct'
              ).length
              const correctInDomain = totalInDomain - wrongInDomain
              const correctPct = totalInDomain > 0 ? Math.round((correctInDomain / totalInDomain) * 100) : 0
              const wrongPct = totalInDomain > 0 ? 100 - correctPct : 0
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
                          <div className="text-2xl font-bold">{wrongPct}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Priority Score</div>
                          <div className="text-2xl font-bold">{domain.priorityScore.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Questions List - Nested Accordion */}
                      <Accordion type="single" collapsible className="w-full space-y-2">
                        {domainQuestions.length === 0 && (
                          <p className="text-sm text-muted-foreground px-3 py-2 rounded border border-dashed border-border">
                            No questions from this exam were tagged to this domain.
                          </p>
                        )}
                        {domainQuestions
                          .filter((question) => {
                            if (!showOnlyWrong) return true
                            const status = getQuestionStatus(question)
                            return status === 'wrong' || status === 'skipped'
                          })
                          .map((question, idx) => {
                          const status = getQuestionStatus(question)
                          const selectedAnswer = getSelectedAnswerForQuestion(question)
                          const selectedAnswerLabel = getAnswerLabel(question, selectedAnswer)
                          const correctAnswerLabel = getAnswerLabel(question, question.correct_answer)
                          const statusDisplay = getStatusDisplay(status)

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

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                                      <div>
                                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Your Answer</div>
                                        <div
                                          className={`font-semibold mt-1 ${
                                            status === 'correct'
                                              ? 'text-green-600'
                                              : status === 'skipped'
                                                ? 'text-muted-foreground'
                                                : 'text-red-600'
                                          }`}
                                        >
                                          {selectedAnswerLabel || 'Skipped'}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Correct Answer</div>
                                        <div className="font-semibold mt-1 text-green-700">
                                          {correctAnswerLabel || question.correct_answer}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Result</div>
                                        <div className={`font-semibold mt-1 ${statusDisplay.color}`}>
                                          {statusDisplay.label}
                                        </div>
                                      </div>
                                    </div>

                                    {/* All Options */}
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Options</h4>
                                      <div className="space-y-1">
                                        {question.options.map((option, optIdx) => {
                                          const isCorrect = option === question.correct_answer
                                          const isSelected = selectedAnswer === option
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

                                    {/* Explanation or Source File */}
                                    {showSourceFile && question.source_file ? (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Source File</h4>
                                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded">
                                          {question.source_file}
                                        </p>
                                      </div>
                                    ) : question.explanation ? (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded">
                                          {question.explanation}
                                        </p>
                                      </div>
                                    ) : null}
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
          {orgPsychPerformance && (() => {
            const orgQuestions = getDomainQuestions('Organizational Psychology')
            const wrongCount = orgQuestions.filter(
              (q) => getQuestionStatus(q) !== 'correct'
            ).length
            const correctCount = orgQuestions.length - wrongCount

            return (
              <AccordionItem value="Organizational Psychology">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-left">
                        <div className="font-semibold">Organizational Psychology</div>
                        <div className="text-sm text-muted-foreground">
                          {`${correctCount}/${orgQuestions.length} correct (${
                            orgQuestions.length > 0
                              ? Math.round((correctCount / orgQuestions.length) * 100)
                              : 0
                          }%)`}
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
                      {orgQuestions.length === 0 && (
                        <p className="text-sm text-muted-foreground px-3 py-2 rounded border border-dashed border-border">
                          No org psych questions were included in this exam.
                        </p>
                      )}
                      {orgQuestions
                        .filter((question) => {
                          if (!showOnlyWrong) return true
                          const status = getQuestionStatus(question)
                          return status === 'wrong' || status === 'skipped'
                        })
                        .map((question, idx) => {
                        const status = getQuestionStatus(question)
                        const selectedAnswer = getSelectedAnswerForQuestion(question)
                        const selectedAnswerLabel = getAnswerLabel(question, selectedAnswer)
                        const correctAnswerLabel = getAnswerLabel(question, question.correct_answer)
                        const statusDisplay = getStatusDisplay(status)

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

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                                    <div>
                                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Your Answer</div>
                                      <div
                                        className={`font-semibold mt-1 ${
                                          status === 'correct'
                                            ? 'text-green-600'
                                            : status === 'skipped'
                                              ? 'text-muted-foreground'
                                              : 'text-red-600'
                                        }`}
                                      >
                                        {selectedAnswerLabel || 'Skipped'}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Correct Answer</div>
                                      <div className="font-semibold mt-1 text-green-700">
                                        {correctAnswerLabel || question.correct_answer}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Result</div>
                                      <div className={`font-semibold mt-1 ${statusDisplay.color}`}>
                                        {statusDisplay.label}
                                      </div>
                                    </div>
                                  </div>

                                  {/* All Options */}
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">Options</h4>
                                    <div className="space-y-1">
                                      {question.options.map((option, optIdx) => {
                                        const isCorrect = option === question.correct_answer
                                        const isSelected = selectedAnswer === option
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

                                  {/* Explanation or Source File */}
                                  {showSourceFile && question.source_file ? (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Source File</h4>
                                      <p className="text-sm text-foreground bg-muted/50 p-3 rounded">
                                        {question.source_file}
                                      </p>
                                    </div>
                                  ) : question.explanation ? (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                                      <p className="text-sm text-foreground bg-muted/50 p-3 rounded">
                                        {question.explanation}
                                      </p>
                                    </div>
                                  ) : null}
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
          })()}
        </Accordion>
      </CardContent>
    </Card>
  )
}
