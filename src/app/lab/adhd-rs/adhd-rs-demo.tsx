'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  ADHD_RS_HOME_PERCENTILE_CITATION,
  ADHD_RS_HOME_PERCENTILE_NOTE,
  formatAdhdRsPercentileFloor,
  getAdhdRsAgeBand,
  getAdhdRsNormGroupLabel,
  getAdhdRsPercentileDescriptor,
  type AdhdRsNormGroup,
  lookupAdhdRsHomeImpairmentPercentileFloor,
  lookupAdhdRsHomePercentileFloor,
} from './adhd-rs-config'
import type {
  AssessmentField,
  AssessmentOption,
  AssessmentQuestion,
  AssessmentScoringGroup,
  InstrumentDefinition,
} from '../_lib/assessment-types'

type QuestionValue = string

interface ComputedGroupScore {
  group: AssessmentScoringGroup
  value: number | null
  answered: number
  total: number
  percentileFloor: string | null
  interpretationLabel: string | null
}

interface ComputedImpairmentResult {
  question: AssessmentQuestion
  value: number | null
  responseLabel: string | null
  percentileFloor: string | null
  interpretationLabel: string | null
}

export interface AdhdRsAdhdCriteriaMeta {
  childThreshold: number
  adultThreshold: number
  disorderName: string
  durationRequirement: string | null
}

const SHORT_RESPONSE_LABELS: Record<string, string> = {
  '0': 'Never',
  '1': 'Sometimes',
  '2': 'Often',
  '3': 'V. Often',
}

const IMPAIRMENT_LABELS: Record<string, string> = {
  '0': 'No problem',
  '1': 'Minor problem',
  '2': 'Moderate problem',
  '3': 'Severe problem',
}


function getTodayDateValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function buildInitialHeaderValues(fields: AssessmentField[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((values, field) => {
    if (field.type === 'date') values[field.id] = getTodayDateValue()
    return values
  }, {})
}

function getQuestionOptions(instrument: InstrumentDefinition, question: AssessmentQuestion): AssessmentOption[] {
  if (question.type === 'likert') return instrument.responseScale ?? []
  return question.options ?? []
}

function getHeaderFieldById(instrument: InstrumentDefinition, fieldId: string): AssessmentField | null {
  return instrument.headerFields.find(field => field.id === fieldId) ?? null
}

function getHeaderOptionLabel(
  instrument: InstrumentDefinition,
  fieldId: string,
  value: string | undefined,
): string | null {
  if (!value) return null

  const field = getHeaderFieldById(instrument, fieldId)
  const label = field?.options?.find(option => option.value === value)?.label
  return label ?? value
}

function getScoreById(scores: ComputedGroupScore[], scoreId: string): ComputedGroupScore | null {
  return scores.find(score => score.group.id === scoreId) ?? null
}

function getSymptomThreshold(age: number | null, adhdCriteria: AdhdRsAdhdCriteriaMeta): number | null {
  if (age === null) return null
  return age >= 17 ? adhdCriteria.adultThreshold : adhdCriteria.childThreshold
}

function getAdhdPresentationLabel(
  inattentionCount: number,
  hyperImpCount: number,
  threshold: number,
): string | null {
  const meetsInattention = inattentionCount >= threshold
  const meetsHyperImp = hyperImpCount >= threshold

  if (meetsInattention && meetsHyperImp) return 'combined presentation'
  if (meetsInattention) return 'predominantly inattentive presentation'
  if (meetsHyperImp) return 'predominantly hyperactive-impulsive presentation'
  return null
}

function formatReportList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function getCompletedByDescription(
  instrument: InstrumentDefinition,
  headerValues: Record<string, string>,
): string {
  const completedBy = getHeaderOptionLabel(instrument, 'completed_by', headerValues.completed_by)
  const raterName = (headerValues.rater_name ?? '').trim()

  if (completedBy && raterName) return `${completedBy} (${raterName})`
  if (completedBy) return completedBy
  if (raterName) return raterName
  return 'the parent/caregiver'
}

function buildImpairmentResults(
  instrument: InstrumentDefinition,
  answers: Record<string, QuestionValue>,
  age: number | null,
  normGroup: AdhdRsNormGroup | null,
): ComputedImpairmentResult[] {
  const impairmentSection = instrument.sections.find(section => section.id === 'impairment')
  const impairmentQuestions = impairmentSection?.questions ?? []

  return impairmentQuestions.map(question => {
    const value = answers[question.id]
    if (typeof value !== 'string' || value === '') {
      return {
        question,
        value: null,
        responseLabel: null,
        percentileFloor: null,
        interpretationLabel: null,
      }
    }

    const numericValue = Number(value)
    const percentileFloor = age !== null && normGroup
      ? lookupAdhdRsHomeImpairmentPercentileFloor(question.id, numericValue, age, normGroup)
      : null

    return {
      question,
      value: Number.isFinite(numericValue) ? numericValue : null,
      responseLabel: IMPAIRMENT_LABELS[value] ?? value,
      percentileFloor,
      interpretationLabel: getAdhdRsPercentileDescriptor(percentileFloor),
    }
  })
}

function buildImpairmentSummary(results: ComputedImpairmentResult[]): {
  answered: number
  flagged: string[]
} {
  const answered = results.filter(result => result.value !== null).length
  const flagged = results.flatMap(result => {
    if (result.value === null || result.value < 1) return []

    const details = [result.responseLabel ?? String(result.value)]
    if (result.percentileFloor) details.push(formatAdhdRsPercentileFloor(result.percentileFloor))
    if (result.interpretationLabel) details.push(result.interpretationLabel.toLowerCase())

    return [`${result.question.prompt} (${details.join(', ')})`]
  })

  return {
    answered,
    flagged,
  }
}

function buildNarrative(
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  impairmentResults: ComputedImpairmentResult[],
  headerValues: Record<string, string>,
  adhdCriteria: AdhdRsAdhdCriteriaMeta,
): string | null {
  const iaRaw = getScoreById(scores, 'ia_raw')
  const hiRaw = getScoreById(scores, 'hi_raw')
  const totalRaw = getScoreById(scores, 'total_raw')
  const iaCount = getScoreById(scores, 'ia_symptom_count')
  const hiCount = getScoreById(scores, 'hi_symptom_count')
  const totalCount = getScoreById(scores, 'total_symptom_count')

  if (
    !iaRaw || iaRaw.value === null ||
    !hiRaw || hiRaw.value === null ||
    !totalRaw || totalRaw.value === null ||
    !iaCount || iaCount.value === null ||
    !hiCount || hiCount.value === null ||
    !totalCount || totalCount.value === null
  ) {
    return null
  }

  const childName = (headerValues.child_name ?? '').trim() || 'The child'
  const ageValue = Number(headerValues.age)
  const age = Number.isFinite(ageValue) ? ageValue : null
  const ageBand = age !== null ? getAdhdRsAgeBand(age) : null
  const normGroup = headerValues.norm_group === 'boys' || headerValues.norm_group === 'girls'
    ? headerValues.norm_group
    : null
  const completedBy = getCompletedByDescription(instrument, headerValues)
  const threshold = getSymptomThreshold(age, adhdCriteria)
  const presentation = threshold !== null
    ? getAdhdPresentationLabel(iaCount.value, hiCount.value, threshold)
    : null
  const impairment = buildImpairmentSummary(impairmentResults)

  const formatScore = (score: ComputedGroupScore) => {
    const parts = [String(score.value)]
    if (score.percentileFloor) parts.push(formatAdhdRsPercentileFloor(score.percentileFloor))
    if (score.interpretationLabel) parts.push(score.interpretationLabel.toLowerCase())
    return parts.join(', ')
  }

  const intro = `${childName} was rated on the ADHD-RS-5 Home Version on ${headerValues.date || 'today'} by ${completedBy}.`
  const normSentence = normGroup && ageBand
    ? `Raw scores were compared against the ${getAdhdRsNormGroupLabel(normGroup).toLowerCase()} home norms for ages ${ageBand}.`
    : age !== null && !ageBand
      ? 'Published home norms are available for ages 5-17 only, so percentile lookup is not shown for this age.'
      : 'Enter both age and norm reference group to attach the published boys/girls home norms.'
  const rawSentence = `Raw scores: Inattention ${formatScore(iaRaw)}; Hyperactivity-Impulsivity ${formatScore(hiRaw)}; Total ${formatScore(totalRaw)}.`
  const countSentence = `At the Often/Very Often symptom threshold, ${childName} endorsed ${iaCount.value}/9 inattention symptoms and ${hiCount.value}/9 hyperactivity-impulsivity symptoms (${totalCount.value}/18 total).`

  let thresholdSentence = 'The DSM symptom-count threshold cannot be evaluated until age is entered.'
  if (threshold !== null) {
    thresholdSentence = presentation
      ? `This count pattern meets the DSM-5-TR symptom threshold for ${adhdCriteria.disorderName}, ${presentation} (${threshold}+ symptoms in a domain for age ${age}).`
      : `This count pattern does not meet the DSM-5-TR symptom threshold for ${adhdCriteria.disorderName} (${threshold}+ symptoms in a domain for age ${age}).`
  }

  let impairmentSentence = 'Impairment items were not completed.'
  if (impairment.answered > 0 && impairment.flagged.length === 0) {
    impairmentSentence = 'No impairment domains were rated above "No Problem" on the completed items.'
  } else if (impairment.flagged.length > 0) {
    impairmentSentence = `Impairment domains flagged at Minor Problem or higher: ${formatReportList(impairment.flagged)}.`
  }

  const footer = 'Interpret alongside interview, collateral information, and the published scoring manual. Symptom and impairment percentiles use the home-version norm tables; impairment ratings of 0 remain No Problem without percentile labeling.'

  return [intro, normSentence, rawSentence, countSentence, thresholdSentence, impairmentSentence, footer].join('\n\n')
}

function renderFieldInput(
  field: AssessmentField,
  value: string,
  onChange: (fieldId: string, nextValue: string) => void,
) {
  if (field.type === 'single_select' && field.options) {
    return (
      <div className="space-y-2">
        <Label className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
          {field.label}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {field.options.map(option => {
            const selected = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(field.id, option.value)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-[12px] transition-colors duration-150 cursor-pointer',
                  selected
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {field.helpText ? (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{field.helpText}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
        {field.label}
      </Label>
      <Input
        id={field.id}
        type={field.type === 'number' ? 'number' : field.type}
        value={value}
        onChange={event => onChange(field.id, event.target.value)}
        className="h-9"
      />
      {field.id === 'age' ? (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {value && Number.isFinite(Number(value))
            ? getAdhdRsAgeBand(Number(value))
              ? `Using the ${getAdhdRsAgeBand(Number(value))} norm band`
              : 'Norm tables are available for ages 5-17'
            : 'Enter age to attach the correct 5-7, 8-10, 11-13, or 14-17 norm band'}
        </p>
      ) : field.helpText ? (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{field.helpText}</p>
      ) : null}
    </div>
  )
}

function QuestionCard({
  instrument,
  question,
  value,
  onSelect,
}: {
  instrument: InstrumentDefinition
  question: AssessmentQuestion
  value: string
  onSelect: (questionId: string, nextValue: string) => void
}) {
  const options = getQuestionOptions(instrument, question)

  return (
    <div className="group relative border-b border-dashed border-zinc-100 last:border-b-0 dark:border-zinc-900 py-4 transition-colors duration-150 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30">
      <div className="flex items-start gap-3">
        <span className="pt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-300 dark:text-zinc-600">
          {question.number}.
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] leading-[1.55] text-zinc-600 dark:text-zinc-300">{question.prompt}</p>
          <div className={cn('mt-3 flex gap-1', options.length === 4 ? 'sm:gap-1.5' : 'sm:gap-2')}>
            {options.map(option => {
              const selected = value === option.value
              const shortLabel = question.type === 'likert'
                ? SHORT_RESPONSE_LABELS[option.value] ?? option.label
                : option.label

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(question.id, option.value)}
                  className={cn(
                    'flex-1 rounded-md border min-h-[44px] sm:min-h-0 px-3 py-2 text-center transition-all duration-100 cursor-pointer active:scale-[0.97]',
                    selected
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
                  )}
                >
                  <div className="text-[11px] font-mono uppercase tracking-[0.12em] opacity-70">
                    {option.value}
                  </div>
                  <div className="mt-0.5 text-[12px]">{shortLabel}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const severityColor: Record<string, string> = {
  'Within expected range': 'text-zinc-500',
  'Subclinical': 'text-zinc-500',
  'Mild': 'text-amber-600 dark:text-amber-400',
  'Moderate': 'text-orange-600 dark:text-orange-400',
  'High': 'text-red-600 dark:text-red-400',
}

export function AdhdRsDemo({
  instrument,
  adhdCriteria,
}: {
  instrument: InstrumentDefinition
  adhdCriteria: AdhdRsAdhdCriteriaMeta
}) {
  const prefersReducedMotion = useReducedMotion()
  const initialHeaderValues = useMemo(
    () => buildInitialHeaderValues(instrument.headerFields),
    [instrument.headerFields],
  )
  const [headerValues, setHeaderValues] = useState<Record<string, string>>(initialHeaderValues)
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({})
  const [copied, setCopied] = useState(false)

  const ageValue = Number(headerValues.age)
  const age = Number.isFinite(ageValue) ? ageValue : null
  const ageBand = age !== null ? getAdhdRsAgeBand(age) : null
  const normGroup = headerValues.norm_group === 'boys' || headerValues.norm_group === 'girls'
    ? headerValues.norm_group as AdhdRsNormGroup
    : null

  const symptomSections = instrument.sections.filter(section => section.id !== 'impairment')
  const symptomQuestionIds = symptomSections.flatMap(section => section.questions.map(question => question.id))
  const symptomAnswered = symptomQuestionIds.filter(questionId => typeof answers[questionId] === 'string' && answers[questionId] !== '').length
  const symptomsReady = symptomAnswered === symptomQuestionIds.length

  const computedScores: ComputedGroupScore[] = instrument.scoringGroups.map(group => {
    const numericAnswers = group.questionIds
      .map(questionId => answers[questionId])
      .filter((value): value is string => typeof value === 'string' && value !== '')
      .map(Number)
      .filter(Number.isFinite)

    if (numericAnswers.length !== group.questionIds.length) {
      return {
        group,
        value: null,
        answered: numericAnswers.length,
        total: group.questionIds.length,
        percentileFloor: null,
        interpretationLabel: null,
      }
    }

    const value = group.scoringType === 'raw_sum'
      ? numericAnswers.reduce((sum, current) => sum + current, 0)
      : numericAnswers.filter(current => current >= (group.positiveThresholdValue ?? Infinity)).length

    const percentileFloor = group.scoringType === 'raw_sum' && age !== null && normGroup
      ? group.id === 'ia_raw' || group.id === 'hi_raw' || group.id === 'total_raw'
        ? lookupAdhdRsHomePercentileFloor(group.id, value, age, normGroup)
        : null
      : null

    return {
      group,
      value,
      answered: numericAnswers.length,
      total: group.questionIds.length,
      percentileFloor,
      interpretationLabel: getAdhdRsPercentileDescriptor(percentileFloor),
    }
  })

  const impairmentResults = useMemo(
    () => buildImpairmentResults(instrument, answers, age, normGroup),
    [age, answers, instrument, normGroup],
  )
  const impairmentSummary = useMemo(
    () => buildImpairmentSummary(impairmentResults),
    [impairmentResults],
  )

  const threshold = getSymptomThreshold(age, adhdCriteria)
  const iaCount = getScoreById(computedScores, 'ia_symptom_count')
  const hiCount = getScoreById(computedScores, 'hi_symptom_count')
  const totalCount = getScoreById(computedScores, 'total_symptom_count')
  const dsmPresentation = threshold !== null && iaCount?.value !== null && hiCount?.value !== null
    ? getAdhdPresentationLabel(iaCount?.value ?? 0, hiCount?.value ?? 0, threshold)
    : null
  const narrative = buildNarrative(instrument, computedScores, impairmentResults, headerValues, adhdCriteria)

  const motionSection = (index: number) => prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] as const },
      }

  const updateHeader = (fieldId: string, nextValue: string) => {
    setHeaderValues(current => ({ ...current, [fieldId]: nextValue }))
  }

  const updateAnswer = (questionId: string, nextValue: string) => {
    setAnswers(current => ({ ...current, [questionId]: nextValue }))
  }

  const resetDemo = () => {
    setHeaderValues(initialHeaderValues)
    setAnswers({})
    setCopied(false)
  }

  const checklist = [
    { label: 'Age entered', satisfied: age !== null },
    { label: 'Norm reference selected', satisfied: normGroup !== null },
    { label: `Symptom items ${symptomAnswered}/${symptomQuestionIds.length}`, satisfied: symptomsReady },
  ]

  return (
    <div>
      <motion.section {...motionSection(0)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
            Respondent
          </h2>
          <button
            type="button"
            onClick={resetDemo}
            className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 cursor-pointer"
          >
            Reset
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {instrument.headerFields.map(field => (
            <div key={field.id}>
              {renderFieldInput(field, headerValues[field.id] ?? '', updateHeader)}
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-zinc-100 bg-zinc-50/60 p-4 text-sm text-zinc-500 dark:border-zinc-800/70 dark:bg-zinc-900/30 dark:text-zinc-400">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">Norm reference group</p>
          <p className="mt-1 leading-relaxed">
            The published ADHD-RS-5 home norms are split into boys and girls tables. The scorer keeps that
            input explicit so the report is transparent about which reference table was used.
          </p>
        </div>
      </motion.section>

      {/* --- Progress bar --- */}
      <div className="mt-12 border-t border-zinc-100 dark:border-zinc-800/50 pt-12">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
            {symptomAnswered} / {symptomQuestionIds.length} items
          </p>
          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
            {symptomQuestionIds.length > 0 ? Math.round((symptomAnswered / symptomQuestionIds.length) * 100) : 0}%
          </p>
        </div>
        <div className="h-0.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300"
            style={{ width: `${symptomQuestionIds.length > 0 ? (symptomAnswered / symptomQuestionIds.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {instrument.sections.map((section, sectionIndex) => (
        <motion.section
          key={section.id}
          {...motionSection(sectionIndex + 1)}
          className="mt-24 border-t border-zinc-100 dark:border-zinc-800/50 pt-12"
        >
          <div className="mb-6">
            <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
              {section.title}
            </h2>
            {section.description ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {section.description}
              </p>
            ) : null}
          </div>
          <div className="border-y border-zinc-200 dark:border-zinc-800/70">
            {section.questions.map(question => (
              <QuestionCard
                key={question.id}
                instrument={instrument}
                question={question}
                value={answers[question.id] ?? ''}
                onSelect={updateAnswer}
              />
            ))}
          </div>
        </motion.section>
      ))}

      {/* --- Scores --- */}
      <motion.section
        {...motionSection(instrument.sections.length + 1)}
        className="mt-24 border-t border-zinc-100 dark:border-zinc-800/50 pt-12"
      >
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-1">
          Scores
        </h2>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-6">
          {ageBand && normGroup
            ? `Percentiles using ${getAdhdRsNormGroupLabel(normGroup).toLowerCase()} home norms, ages ${ageBand}.`
            : 'Enter age and norm group for percentile lookup.'}
        </p>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  Domain
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  Raw
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  Percentile
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  Often+
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Inattention', raw: getScoreById(computedScores, 'ia_raw'), count: iaCount },
                { label: 'Hyperactivity-Impulsivity', raw: getScoreById(computedScores, 'hi_raw'), count: hiCount },
                { label: 'Total', raw: getScoreById(computedScores, 'total_raw'), count: totalCount },
              ].map(row => (
                <tr key={row.label} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/70">
                  <td className="px-4 py-3 align-top text-sm text-zinc-700 dark:text-zinc-300">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.raw?.value !== null && row.raw?.value !== undefined ? (
                      <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {row.raw.value}
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-sm tabular-nums text-zinc-300 dark:text-zinc-600">&mdash;</p>
                        {row.raw ? (
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {row.raw.answered}/{row.raw.total}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.raw?.interpretationLabel ? (
                      <span className={`text-[10px] uppercase tracking-[0.12em] font-medium ${severityColor[row.raw.interpretationLabel] ?? 'text-zinc-500'}`}>
                        {row.raw.interpretationLabel}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-300 dark:text-zinc-600">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.raw?.percentileFloor ? (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {formatAdhdRsPercentileFloor(row.raw.percentileFloor)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-300 dark:text-zinc-600">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.count?.value !== null && row.count?.value !== undefined ? (
                      <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {row.count.value}/{row.count.total}
                      </span>
                    ) : (
                      <span className="text-sm tabular-nums text-zinc-300 dark:text-zinc-600">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DSM Threshold + Impairment */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mb-3">
              DSM Threshold
            </p>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {threshold === null
                ? 'Enter age to determine whether the current count pattern meets the age-adjusted ADHD symptom threshold.'
                : dsmPresentation
                  ? `Current count pattern meets the ${adhdCriteria.disorderName} symptom threshold for ${dsmPresentation} (${threshold}+ symptoms in a domain for age ${age}).`
                  : `Current count pattern does not meet the ${adhdCriteria.disorderName} symptom threshold (${threshold}+ symptoms in a domain for age ${age}).`}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mb-3">
              Impairment Domains
            </p>
            {impairmentResults.some(result => result.value !== null) ? (
              <div className="space-y-2">
                {impairmentResults.filter(result => result.value !== null).map(result => (
                  <div
                    key={result.question.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2 dark:border-zinc-800/70 dark:bg-zinc-900/30"
                  >
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {result.question.prompt}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {[
                        result.responseLabel,
                        result.percentileFloor ? formatAdhdRsPercentileFloor(result.percentileFloor) : null,
                        result.interpretationLabel,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {impairmentSummary.answered > 0
                  ? 'No impairment items were rated above No Problem on the completed responses.'
                  : 'Complete the impairment items to attach domain-level home impairment norms for ratings of 1-3.'}
              </p>
            )}
          </div>
        </div>
      </motion.section>

      {/* --- Clinical Summary --- */}
      <motion.section
        {...motionSection(instrument.sections.length + 2)}
        className="mt-24 hidden md:block border-t border-zinc-100 dark:border-zinc-800/50 pt-12"
      >
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Clinical Summary
        </h2>
        {narrative ? (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
              <Lock className="h-3 w-3" strokeWidth={1.75} />
              <span>Runs entirely in your browser. No PHI transmitted.</span>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={narrative}
                rows={14}
                className="w-full resize-y rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 pr-24 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(narrative)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1800)
                }}
                className={cn(
                  'absolute top-3 right-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-transform duration-150 active:scale-95',
                  copied && 'scale-105',
                )}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
              Required to generate
            </p>
            <ul className="space-y-1.5">
              {checklist.map(item => (
                <li key={item.label} className="flex items-center gap-2 text-[13px]">
                  <span className={cn('font-mono text-base leading-none', item.satisfied ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600')}>
                    {item.satisfied ? '\u2713' : '\u25CB'}
                  </span>
                  <span className={cn(item.satisfied ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500')}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-zinc-100 bg-zinc-50/60 p-5 text-sm text-zinc-500 dark:border-zinc-800/70 dark:bg-zinc-900/30 dark:text-zinc-400">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">Norm note</p>
          <p className="mt-2 leading-relaxed">{ADHD_RS_HOME_PERCENTILE_NOTE}</p>
          <p className="mt-2 leading-relaxed">{ADHD_RS_HOME_PERCENTILE_CITATION}</p>
        </div>
      </motion.section>

      {/* --- Mobile sticky View Summary --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur px-4 py-3">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              disabled={!narrative}
              className="w-full rounded-md border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 text-[12px] font-medium uppercase tracking-[0.12em] disabled:opacity-40 transition-transform active:scale-[0.98]"
            >
              {narrative ? 'View Summary' : `Complete (${symptomAnswered}/${symptomQuestionIds.length})`}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold tracking-tight">Clinical Summary</SheetTitle>
            </SheetHeader>
            {narrative && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                  <Lock className="h-3 w-3" strokeWidth={1.75} />
                  <span>Runs entirely in your browser. No PHI transmitted.</span>
                </div>
                <textarea
                  readOnly
                  value={narrative}
                  rows={16}
                  className="w-full resize-y rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(narrative)
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1800)
                  }}
                  className="w-full rounded-md border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 text-[12px] font-medium uppercase tracking-[0.12em] transition-transform active:scale-[0.98]"
                >
                  {copied ? 'Copied' : 'Copy Summary'}
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
