'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import {
  getBaarsAgeBand,
  lookupBaarsChildhoodPercentile,
  lookupBaarsCurrentPercentile,
} from './baars-config'
import type {
  AssessmentField,
  AssessmentScoringGroup,
  AssessmentSeverityBand,
  InstrumentDefinition,
} from '../_lib/assessment-types'

type QuestionValue = string | string[]

interface ComputedGroupScore {
  group: AssessmentScoringGroup
  value: number | null
  answered: number
  total: number
  severityLabel: string | null
  percentileBand: string | null
}

interface ScoreTableRow {
  label: string
  rawScore: ComputedGroupScore | null
  symptomCount: ComputedGroupScore | null
}

export interface BaarsAdhdCriteriaMeta {
  disorderId: string
  disorderName: string
  durationRequirement: string | null
  childhoodThreshold: number
  adultThreshold: number
  exclusions: string[]
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

function deriveFollowUpPositive(
  symptomIds: string[],
  answers: Record<string, QuestionValue>,
): 'yes' | 'no' | null {
  const answered = symptomIds
    .map(id => answers[id])
    .filter((v): v is string => typeof v === 'string' && v !== '')
  if (answered.length === 0) return null
  return answered.some(v => Number(v) >= 3) ? 'yes' : 'no'
}

function getSeverityLabel(value: number, bands?: AssessmentSeverityBand[]): string | null {
  if (!bands) return null
  for (const band of bands) {
    const max = band.max ?? Number.POSITIVE_INFINITY
    if (value >= band.min && value <= max) return band.label
  }
  return null
}

function formatPercentileBand(percentileBand: string): string {
  if (/^\d+$/.test(percentileBand)) {
    const value = Number(percentileBand)
    const teen = value % 100
    const suffix = teen >= 11 && teen <= 13
      ? 'th'
      : value % 10 === 1
        ? 'st'
        : value % 10 === 2
          ? 'nd'
          : value % 10 === 3
            ? 'rd'
            : 'th'

    return `${value}${suffix} percentile`
  }

  return `${percentileBand} percentile band`
}

function getQuestionById(instrument: InstrumentDefinition, questionId: string) {
  return instrument.sections.flatMap(section => section.questions).find(question => question.id === questionId)
}

function formatSelectedOptionLabels(
  instrument: InstrumentDefinition,
  questionId: string,
  value: QuestionValue | undefined,
): string | null {
  if (!Array.isArray(value) || value.length === 0) return null

  const question = getQuestionById(instrument, questionId)
  if (!question?.options) return value.join(', ')

  return value
    .map(optionValue => question.options?.find(option => option.value === optionValue)?.label ?? optionValue)
    .join(', ')
}

function getScoreById(scores: ComputedGroupScore[], scoreId: string): ComputedGroupScore | null {
  return scores.find(score => score.group.id === scoreId) ?? null
}

function getAdhdPresentationLabel(inattentionCount: number, hyperImpCount: number, threshold: number): string | null {
  const meetsInattention = inattentionCount >= threshold
  const meetsHyperImp = hyperImpCount >= threshold

  if (meetsInattention && meetsHyperImp) return 'combined'
  if (meetsInattention) return 'predominantly inattentive'
  if (meetsHyperImp) return 'predominantly hyperactive-impulsive'
  return null
}

function buildCurrentCriteriaSuggestion(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  age: number | null,
): string | null {
  const inattentionCount = getScoreById(scores, 'inattention_symptom_count')
  const hyperImpCount = getScoreById(scores, 'hyperactivity_impulsivity_symptom_count')

  if (!inattentionCount || inattentionCount.value === null || !hyperImpCount || hyperImpCount.value === null) {
    return null
  }

  const threshold = age !== null && age <= 16 ? adhdCriteria.childhoodThreshold : adhdCriteria.adultThreshold
  const presentation = getAdhdPresentationLabel(inattentionCount.value, hyperImpCount.value, threshold)
  const onsetValue = typeof answers.q29 === 'string' && answers.q29.trim() !== '' ? Number(answers.q29) : null
  const onsetBeforeTwelve = onsetValue !== null && Number.isFinite(onsetValue) ? onsetValue <= 12 : null
  const settings = Array.isArray(answers.q30) ? answers.q30 : []
  const settingsMet = settings.length > 0 ? settings.length >= 2 : null
  const settingsText = formatSelectedOptionLabels(instrument, 'q30', answers.q30)
  const durationText = adhdCriteria.durationRequirement ? `${adhdCriteria.durationRequirement.toLowerCase()}` : 'at least 6 months'

  if (!presentation) {
    return `DSM-5 screening suggestion: current self-report does not reach the ${adhdCriteria.disorderName} symptom threshold on this administration (${threshold}+ symptoms in either the inattention or hyperactivity-impulsivity domain for this age band).`
  }

  const missingParts: string[] = []
  if (onsetBeforeTwelve !== true) {
    missingParts.push(
      onsetBeforeTwelve === false
        ? `reported onset before age 12 was not met (onset entered as age ${onsetValue})`
        : 'reported onset before age 12'
    )
  }
  if (settingsMet !== true) {
    missingParts.push(
      settingsMet === false
        ? 'impairment in at least two settings'
        : 'cross-setting impairment data'
    )
  }

  if (missingParts.length === 0) {
    return `DSM-5 screening suggestion: current self-report is consistent with ${adhdCriteria.disorderName}, ${presentation} presentation, because the symptom threshold is met (${threshold}+ symptoms for this age band), the rating window reflects ${durationText}, onset was reported by age 12, and impairment was endorsed in ${settings.length} settings${settingsText ? ` (${settingsText})` : ''}. Exclusion review is still required, so this remains a screening inference rather than a standalone diagnosis.`
  }

  return `DSM-5 screening suggestion: current self-report reaches the ${adhdCriteria.disorderName} symptom threshold for ${presentation} presentation, but this form does not fully establish ${missingParts.join(' and ')}. The DSM duration window is ${durationText}, and final diagnosis still requires exclusion review and clinical rule-outs.`
}

function buildChildhoodCriteriaSuggestion(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
): string | null {
  const inattentionCount = getScoreById(scores, 'inattention_symptom_count')
  const hyperImpCount = getScoreById(scores, 'hyperactivity_impulsivity_symptom_count')

  if (!inattentionCount || inattentionCount.value === null || !hyperImpCount || hyperImpCount.value === null) {
    return null
  }

  const threshold = adhdCriteria.childhoodThreshold
  const presentation = getAdhdPresentationLabel(inattentionCount.value, hyperImpCount.value, threshold)
  const settings = Array.isArray(answers.q20) ? answers.q20 : []
  const settingsMet = settings.length > 0 ? settings.length >= 2 : null
  const settingsText = formatSelectedOptionLabels(instrument, 'q20', answers.q20)

  if (!presentation) {
    return `DSM-5 screening suggestion: retrospective childhood ratings do not reach the ${adhdCriteria.disorderName} childhood symptom threshold on this administration (${threshold}+ symptoms in either domain).`
  }

  if (settingsMet === true) {
    return `DSM-5 screening suggestion: retrospective childhood ratings suggest the childhood symptom threshold is met for ${adhdCriteria.disorderName}, ${presentation} presentation, with impairment endorsed in ${settings.length} settings${settingsText ? ` (${settingsText})` : ''}. This form still does not independently confirm ${adhdCriteria.durationRequirement?.toLowerCase() ?? 'the full DSM duration requirement'} or current adult persistence.`
  }

  return `DSM-5 screening suggestion: retrospective childhood ratings reach the childhood symptom threshold for ${adhdCriteria.disorderName}, ${presentation} presentation, but cross-setting impairment is not fully documented on this form. This form also does not independently confirm ${adhdCriteria.durationRequirement?.toLowerCase() ?? 'the full DSM duration requirement'} or current adult persistence.`
}

function buildScoreTableRows(
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
): ScoreTableRow[] {
  if (instrument.id === 'baars_iv_self_report_childhood_symptoms') {
    return [
      {
        label: 'Inattention',
        rawScore: getScoreById(scores, 'inattention_raw'),
        symptomCount: getScoreById(scores, 'inattention_symptom_count'),
      },
      {
        label: 'Hyperactivity-Impulsivity',
        rawScore: getScoreById(scores, 'hyperactivity_impulsivity_raw'),
        symptomCount: getScoreById(scores, 'hyperactivity_impulsivity_symptom_count'),
      },
      {
        label: 'Total ADHD',
        rawScore: getScoreById(scores, 'total_adhd_raw'),
        symptomCount: getScoreById(scores, 'total_adhd_symptom_count'),
      },
    ]
  }

  return [
    {
      label: 'Inattention',
      rawScore: getScoreById(scores, 'inattention_raw'),
      symptomCount: getScoreById(scores, 'inattention_symptom_count'),
    },
    {
      label: 'Hyperactivity',
      rawScore: getScoreById(scores, 'hyperactivity_raw'),
      symptomCount: getScoreById(scores, 'hyperactivity_symptom_count'),
    },
    {
      label: 'Impulsivity',
      rawScore: getScoreById(scores, 'impulsivity_raw'),
      symptomCount: getScoreById(scores, 'impulsivity_symptom_count'),
    },
    {
      label: 'Hyperactivity + Impulsivity',
      rawScore: null,
      symptomCount: getScoreById(scores, 'hyperactivity_impulsivity_symptom_count'),
    },
    {
      label: 'Total ADHD',
      rawScore: getScoreById(scores, 'total_adhd_raw'),
      symptomCount: getScoreById(scores, 'total_adhd_symptom_count'),
    },
    {
      label: 'Sluggish Cognitive Tempo',
      rawScore: getScoreById(scores, 'sct_raw'),
      symptomCount: getScoreById(scores, 'sct_symptom_count'),
    },
  ]
}

function buildCurrentNarrative(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  ageBand: string | null,
  header: Record<string, string>,
  pronounChoice: 'she' | 'he' | 'they',
  followUpPositive: 'yes' | 'no' | null,
  age: number | null,
): string | null {
  const totalAdhd = scores.find(s => s.group.id === 'total_adhd_raw')
  const inattention = scores.find(s => s.group.id === 'inattention_raw')
  const hyperactivity = scores.find(s => s.group.id === 'hyperactivity_raw')
  const impulsivity = scores.find(s => s.group.id === 'impulsivity_raw')
  const sct = scores.find(s => s.group.id === 'sct_raw')
  const totalSymptomCount = scores.find(s => s.group.id === 'total_adhd_symptom_count')
  const hyperImpCount = scores.find(s => s.group.id === 'hyperactivity_impulsivity_symptom_count')
  const inattCount = scores.find(s => s.group.id === 'inattention_symptom_count')
  const onset = answers.q29
  const settingsText = formatSelectedOptionLabels(instrument, 'q30', answers.q30)

  if (
    !totalAdhd || totalAdhd.value === null ||
    !inattention || inattention.value === null ||
    !hyperactivity || hyperactivity.value === null ||
    !impulsivity || impulsivity.value === null ||
    !sct || sct.value === null ||
    !totalSymptomCount || totalSymptomCount.value === null ||
    !hyperImpCount || hyperImpCount.value === null
  ) {
    return null
  }

  const name = (header.name || '').trim() || 'The respondent'
  const pronoun = pronounChoice === 'she' ? 'She' : pronounChoice === 'he' ? 'He' : 'They'
  const pronounLower = pronoun.toLowerCase()
  const possessive = pronoun === 'She' ? 'Her' : pronoun === 'He' ? 'His' : 'Their'
  const ageText = header.age ? `${header.age}-year-old` : ''
  const demographic = ageText

  const fmt = (s: ComputedGroupScore) => {
    const base = `${s.value}${s.severityLabel ? `, ${s.severityLabel}` : ''}`
    return s.percentileBand ? `${base}, ${formatPercentileBand(s.percentileBand)}` : base
  }

  const intro = `${name}${demographic ? `, a ${demographic},` : ''} completed the BAARS-IV Self-Report (Current Symptoms) on ${header.date || 'today'}.${ageBand ? ` Raw scores were compared against the ${ageBand} age band.` : ''}`
  const subscales = `On the symptom items, ${pronounLower} obtained the following subscale raw scores: Inattention (${fmt(inattention)}); Hyperactivity (${fmt(hyperactivity)}); Impulsivity (${fmt(impulsivity)}); and Sluggish Cognitive Tempo (${fmt(sct)}). ${possessive} Total ADHD raw score was ${fmt(totalAdhd)}.`
  const counts = `At the DSM symptom-count threshold (items rated "Often" or "Very Often"), ${pronounLower} endorsed ${inattCount?.value ?? 0}/9 inattention symptoms and ${hyperImpCount.value}/9 hyperactivity-impulsivity symptoms (${totalSymptomCount.value}/18 total).`
  const criteriaSuggestion = buildCurrentCriteriaSuggestion(adhdCriteria, instrument, scores, answers, age)

  const followUpParts: string[] = []
  if (followUpPositive === 'yes') {
    followUpParts.push(`${pronoun} endorsed experiencing at least one symptom at an "Often" frequency or higher.`)
    if (typeof onset === 'string' && onset.trim()) {
      followUpParts.push(`Reported age of symptom onset: ${onset.trim()}.`)
    }
    if (settingsText) {
      followUpParts.push(`Impairment was reported in the following settings: ${settingsText}.`)
    }
  } else if (followUpPositive === 'no') {
    followUpParts.push(`${pronoun} did not endorse any symptoms at an "Often" frequency or higher.`)
  }

  const footer = 'Results should be interpreted in the context of clinical interview, developmental history, and collateral information.'

  return [intro, subscales, counts, criteriaSuggestion, followUpParts.join(' '), footer].filter(Boolean).join('\n\n')
}

function buildChildhoodNarrative(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  ageBand: string | null,
  header: Record<string, string>,
  pronounChoice: 'she' | 'he' | 'they',
  followUpPositive: 'yes' | 'no' | null,
): string | null {
  const totalAdhd = scores.find(s => s.group.id === 'total_adhd_raw')
  const inattention = scores.find(s => s.group.id === 'inattention_raw')
  const hyperImp = scores.find(s => s.group.id === 'hyperactivity_impulsivity_raw')
  const totalSymptomCount = scores.find(s => s.group.id === 'total_adhd_symptom_count')
  const hyperImpCount = scores.find(s => s.group.id === 'hyperactivity_impulsivity_symptom_count')
  const inattCount = scores.find(s => s.group.id === 'inattention_symptom_count')
  const settingsText = formatSelectedOptionLabels(instrument, 'q20', answers.q20)

  if (
    !totalAdhd || totalAdhd.value === null ||
    !inattention || inattention.value === null ||
    !hyperImp || hyperImp.value === null ||
    !totalSymptomCount || totalSymptomCount.value === null ||
    !hyperImpCount || hyperImpCount.value === null ||
    !inattCount || inattCount.value === null
  ) {
    return null
  }

  const name = (header.name || '').trim() || 'The respondent'
  const pronoun = pronounChoice === 'she' ? 'She' : pronounChoice === 'he' ? 'He' : 'They'
  const pronounLower = pronoun.toLowerCase()
  const possessive = pronoun === 'She' ? 'Her' : pronoun === 'He' ? 'His' : 'Their'
  const ageText = header.age ? `${header.age}-year-old` : ''
  const demographic = ageText

  const fmt = (s: ComputedGroupScore) => {
    const base = `${s.value}${s.severityLabel ? `, ${s.severityLabel}` : ''}`
    return s.percentileBand ? `${base}, ${formatPercentileBand(s.percentileBand)}` : base
  }

  const intro = `${name}${demographic ? `, a ${demographic},` : ''} completed the BAARS-IV Self-Report (Childhood Symptoms) on ${header.date || 'today'}. Ratings reflect recalled behavior between ages 5 and 12.${ageBand ? ` Raw scores were compared against the ${ageBand} age band.` : ''}`
  const subscales = `On the retrospective childhood symptom items, ${pronounLower} obtained the following raw scores: Inattention (${fmt(inattention)}) and Hyperactivity-Impulsivity (${fmt(hyperImp)}). ${possessive} Total ADHD raw score was ${fmt(totalAdhd)}.`
  const counts = `At the DSM symptom-count threshold (items rated "Often" or "Very Often"), ${pronounLower} endorsed ${inattCount.value}/9 inattention symptoms and ${hyperImpCount.value}/9 hyperactivity-impulsivity symptoms (${totalSymptomCount.value}/18 total).`
  const criteriaSuggestion = buildChildhoodCriteriaSuggestion(adhdCriteria, instrument, scores, answers)

  const followUpParts: string[] = []
  if (followUpPositive === 'yes') {
    followUpParts.push(`${pronoun} endorsed experiencing at least one childhood symptom at an "Often" frequency or higher.`)
    if (settingsText) {
      followUpParts.push(`Impairment was reported in the following settings: ${settingsText}.`)
    }
  } else if (followUpPositive === 'no') {
    followUpParts.push(`${pronoun} did not endorse any childhood symptoms at an "Often" frequency or higher.`)
  }

  const footer = 'Results should be interpreted alongside developmental history, collateral information, and the limits of retrospective recall.'

  return [intro, subscales, counts, criteriaSuggestion, followUpParts.join(' '), footer].filter(Boolean).join('\n\n')
}

function buildNarrative(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  ageBand: string | null,
  header: Record<string, string>,
  pronounChoice: 'she' | 'he' | 'they',
  followUpPositive: 'yes' | 'no' | null,
  age: number | null,
): string | null {
  if (instrument.id === 'baars_iv_self_report_childhood_symptoms') {
    return buildChildhoodNarrative(adhdCriteria, instrument, scores, answers, ageBand, header, pronounChoice, followUpPositive)
  }

  return buildCurrentNarrative(adhdCriteria, instrument, scores, answers, ageBand, header, pronounChoice, followUpPositive, age)
}

// --- Severity color coding ---
const severityColor: Record<string, string> = {
  'Subclinical': 'text-zinc-500 dark:text-zinc-400',
  'Mild': 'text-amber-600 dark:text-amber-400',
  'Moderate': 'text-orange-600 dark:text-orange-400',
  'High': 'text-red-600 dark:text-red-400',
}

export function BaarsDemo({
  instrument,
  adhdCriteria,
}: {
  instrument: InstrumentDefinition
  adhdCriteria: BaarsAdhdCriteriaMeta
}) {
  const [headerValues, setHeaderValues] = useState<Record<string, string>>(
    () => buildInitialHeaderValues(instrument.headerFields),
  )
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({})
  const [pronounChoice, setPronounChoice] = useState<'she' | 'he' | 'they'>('they')
  const ageValue = Number(headerValues.age)
  const age = Number.isFinite(ageValue) ? ageValue : null
  const ageBand = age !== null ? getBaarsAgeBand(age) : null

  const symptomSections = instrument.sections.filter(s => s.id !== 'follow_up')
  const followUpSection = instrument.sections.find(s => s.id === 'follow_up')
  const symptomQuestionIds = useMemo(
    () => symptomSections.flatMap(section => section.questions.map(question => question.id)),
    [symptomSections],
  )
  const firstFollowUpQuestion = useMemo(
    () => followUpSection?.questions[0] ?? null,
    [followUpSection],
  )
  const remainingFollowUpQuestions = useMemo(
    () => followUpSection?.questions.slice(1) ?? [],
    [followUpSection],
  )
  const followUpPositive = firstFollowUpQuestion
    ? deriveFollowUpPositive(symptomQuestionIds, answers)
    : null

  const answeredCount = symptomSections.reduce((sum, section) =>
    sum + section.questions.filter(q => typeof answers[q.id] === 'string' && answers[q.id] !== '').length, 0)
  const totalLikert = symptomSections.reduce((sum, s) => sum + s.questions.length, 0)

  const computedScores: ComputedGroupScore[] = instrument.scoringGroups.map(group => {
    const numericAnswers = group.questionIds
      .map(qid => answers[qid])
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
      .map(Number)
      .filter(Number.isFinite)

    if (numericAnswers.length !== group.questionIds.length) {
      return { group, value: null, answered: numericAnswers.length, total: group.questionIds.length, severityLabel: null, percentileBand: null }
    }

    const value = group.scoringType === 'raw_sum'
      ? numericAnswers.reduce((a, b) => a + b, 0)
      : numericAnswers.filter(v => v >= (group.positiveThresholdValue ?? Infinity)).length

    const percentileBand = group.scoringType === 'raw_sum' && age !== null
      ? instrument.id === 'baars_iv_self_report_childhood_symptoms'
        ? lookupBaarsChildhoodPercentile(group.id, value, age)
        : lookupBaarsCurrentPercentile(group.id, value, age)
      : null

    return { group, value, answered: numericAnswers.length, total: group.questionIds.length, severityLabel: getSeverityLabel(value, group.severityBands), percentileBand }
  })

  const followUpsDisabled = followUpPositive !== 'yes'

  // Clear stale follow-up values if the derived first follow-up question flips to "no"
  useEffect(() => {
    if (followUpPositive === 'no' && remainingFollowUpQuestions.length > 0) {
      setAnswers(c => {
        const shouldClear = remainingFollowUpQuestions.some(question => c[question.id] !== undefined)
        if (!shouldClear) return c
        const next = { ...c }
        remainingFollowUpQuestions.forEach(question => {
          delete next[question.id]
        })
        return next
      })
    }
  }, [followUpPositive, remainingFollowUpQuestions])

  const narrative = buildNarrative(
    adhdCriteria,
    instrument,
    computedScores,
    answers,
    ageBand,
    headerValues,
    pronounChoice,
    followUpPositive,
    age,
  )
  const [copied, setCopied] = useState(false)

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    symptomQuestionIds[0] ?? null,
  )
  const responseScale = instrument.responseScale ?? []

  const setQuestionRef = (questionId: string, element: HTMLDivElement | null) => {
    if (!element) return
    if (element.offsetParent === null) return
    questionRefs.current[questionId] = element
  }

  const selectSymptomAnswer = (questionId: string, value: string) => {
    setAnswers(current => ({ ...current, [questionId]: value }))
    const idx = symptomQuestionIds.indexOf(questionId)
    const next = symptomQuestionIds[idx + 1]
    if (next) {
      setTimeout(() => setActiveQuestionId(next), 80)
    } else {
      setActiveQuestionId(questionId)
    }
  }

  // When active question changes, scroll it into view
  useEffect(() => {
    if (!activeQuestionId) return
    const el = questionRefs.current[activeQuestionId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeQuestionId])

  // Global keydown: 1-4 fills active question then advances
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!activeQuestionId) return
      // Ignore when user is typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      }
      if (!['1', '2', '3', '4'].includes(e.key)) return
      e.preventDefault()
      setAnswers(c => ({ ...c, [activeQuestionId]: e.key }))
      const idx = symptomQuestionIds.indexOf(activeQuestionId)
      const next = symptomQuestionIds[idx + 1]
      if (next) {
        // small delay so the fill animates before scroll
        setTimeout(() => setActiveQuestionId(next), 120)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeQuestionId, symptomQuestionIds])

  const updateHeader = (id: string, value: string) => setHeaderValues(c => ({ ...c, [id]: value }))
  const updateSingleValue = (id: string, value: string) => setAnswers(c => ({ ...c, [id]: value }))
  const updateMultiValue = (id: string, val: string, checked: boolean) => {
    setAnswers(c => {
      const existing = Array.isArray(c[id]) ? c[id] : []
      return { ...c, [id]: checked ? [...existing, val] : existing.filter(v => v !== val) }
    })
  }
  const resetDemo = () => { setHeaderValues(buildInitialHeaderValues(instrument.headerFields)); setAnswers({}) }

  const scoreTableRows = useMemo(
    () => buildScoreTableRows(instrument, computedScores),
    [instrument, computedScores],
  )

  return (
    <div className="space-y-16">
      {/* --- Header Fields --- */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
            Respondent
          </h2>
          <button
            type="button"
            onClick={resetDemo}
            className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {instrument.headerFields.map(field => {
            if (field.type === 'single_select' && field.options) {
              return (
                <div key={field.id} className="space-y-2">
                  <Label className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">{field.label}</Label>
                  <div className="flex gap-1.5">
                    {field.options.map(opt => {
                      const isSelected = headerValues[field.id] === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateHeader(field.id, opt.value)}
                          className={`rounded-md border px-4 py-1.5 text-[12px] transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            }
            return (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">{field.label}</Label>
                <Input
                  id={field.id}
                  type={field.type === 'number' ? 'number' : field.type}
                  value={headerValues[field.id] ?? ''}
                  onChange={e => updateHeader(field.id, e.target.value)}
                  className="h-9"
                />
                {field.id === 'age' && (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {ageBand
                      ? `Using ${ageBand} percentile norms`
                      : 'Percentile norms available for ages 18-89'}
                  </p>
                )}
              </div>
            )
          })}
          <div className="space-y-2">
            <Label className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">Pronouns</Label>
            <div className="flex flex-wrap gap-1.5">
              {([
                { v: 'she', label: 'She/Her' },
                { v: 'he', label: 'He/Him' },
                { v: 'they', label: 'They/Them' },
              ] as const).map(opt => {
                const isSelected = pronounChoice === opt.v
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setPronounChoice(opt.v)}
                    className={`rounded-md border px-3 py-1.5 text-[12px] transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* --- Progress bar --- */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
            {answeredCount} / {totalLikert} items
          </p>
          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
            {totalLikert > 0 ? Math.round((answeredCount / totalLikert) * 100) : 0}%
          </p>
        </div>
        <div className="h-0.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300"
            style={{ width: `${totalLikert > 0 ? (answeredCount / totalLikert) * 100 : 0}%` }}
          />
        </div>
      </div>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Instructions
        </h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {instrument.instructions}
        </p>
      </section>

      {/* --- Symptom Sections --- */}
      {symptomSections.map(section => (
        <section key={section.id}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
              {section.title}
            </h2>
            <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
              {section.questions.filter(q => typeof answers[q.id] === 'string' && answers[q.id] !== '').length}/{section.questions.length}
            </p>
          </div>
          <div className="hidden rounded-xl border border-zinc-200 dark:border-zinc-800 md:block">
            <div className="sticky top-24 z-30 grid grid-cols-[minmax(0,1fr)_72px_72px_72px_72px] border-b border-zinc-200 bg-zinc-50/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/80">
              <div className="flex min-h-[68px] items-start px-4 pt-[14px] text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                Item
              </div>
              {responseScale.map(opt => (
                <div
                  key={opt.value}
                  className="flex min-h-[68px] flex-col items-center justify-start gap-1.5 border-l border-zinc-200 px-2 pt-3 pb-2 text-center dark:border-zinc-800"
                >
                  <span className="font-mono text-[13px] leading-none text-zinc-900 dark:text-zinc-100">
                    {opt.value}
                  </span>
                  <span className="text-[10px] leading-[1.15] text-zinc-400 dark:text-zinc-500 text-balance">
                    {opt.label}
                  </span>
                </div>
              ))}
            </div>
            <div>
              {section.questions.map(question => {
                const isActive = activeQuestionId === question.id
                return (
                  <div
                    key={question.id}
                    ref={el => setQuestionRef(question.id, el)}
                    onClick={() => setActiveQuestionId(question.id)}
                    className={cn(
                      'grid grid-cols-[minmax(0,1fr)_72px_72px_72px_72px] border-b border-zinc-100 transition-colors last:border-b-0 dark:border-zinc-800/70',
                      isActive && 'bg-zinc-50 dark:bg-zinc-900/50',
                    )}
                  >
                    <div className="flex items-start gap-3 px-4 py-3">
                      <span className="pt-0.5 font-mono text-[11px] text-zinc-300 dark:text-zinc-600">
                        {question.number}.
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                          {question.prompt}
                        </p>
                        {isActive && (
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                            Press 1-4
                          </p>
                        )}
                      </div>
                    </div>
                    {responseScale.map(opt => {
                      const isSelected = answers[question.id] === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={event => {
                            event.stopPropagation()
                            selectSymptomAnswer(question.id, opt.value)
                          }}
                          className={cn(
                            'border-l border-zinc-100 text-center font-mono text-sm transition-colors dark:border-zinc-800/70',
                            isSelected
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
                          )}
                          aria-pressed={isSelected}
                          aria-label={`Set question ${question.number} to ${opt.label}`}
                        >
                          {opt.value}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="space-y-5 md:hidden">
            {section.questions.map(question => {
              const isActive = activeQuestionId === question.id
              return (
              <div
                key={question.id}
                ref={el => setQuestionRef(question.id, el)}
                onClick={() => setActiveQuestionId(question.id)}
                className={`group rounded-lg transition-all duration-150 ${isActive ? 'bg-zinc-50 dark:bg-zinc-900/40 -mx-3 px-3 py-3' : ''}`}
              >
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3 flex items-start gap-2">
                  <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600">{question.number}.</span>
                  <span className="flex-1">{question.prompt}</span>
                  {isActive && (
                    <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
                      press 1&ndash;4
                    </span>
                  )}
                </p>
                <RadioGroup
                  value={typeof answers[question.id] === 'string' ? (answers[question.id] as string) : ''}
                  onValueChange={v => selectSymptomAnswer(question.id, v)}
                  className="flex gap-1"
                >
                  {responseScale.map(opt => {
                    const isSelected = answers[question.id] === opt.value
                    return (
                      <label
                        key={opt.value}
                        htmlFor={`${question.id}-${opt.value}`}
                        className={`flex-1 cursor-pointer rounded-md border px-2 py-2 text-center text-[12px] transition-all duration-150 ${
                          isSelected
                            ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} className="sr-only" />
                        <span className="hidden sm:inline">{opt.label}</span>
                        <span className="sm:hidden">{opt.value}</span>
                      </label>
                    )
                  })}
                </RadioGroup>
              </div>
              )
            })}
          </div>
        </section>
      ))}

      {/* --- Follow-Up --- */}
      {followUpSection && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-6">
            {followUpSection.title}
          </h2>
          <div className="space-y-5">
            {firstFollowUpQuestion && (
              <div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                  <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mr-2">{firstFollowUpQuestion.number}.</span>
                  {firstFollowUpQuestion.prompt}
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {followUpPositive === null ? '\u2014' : followUpPositive === 'yes' ? 'Yes' : 'No'}
                  <span className="ml-2 text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                    Auto-filled from symptom items
                  </span>
                </p>
              </div>
            )}

            {remainingFollowUpQuestions.map(question => {
              const gatedClass = followUpsDisabled ? 'opacity-40 pointer-events-none' : ''
              if (question.type === 'single_select' && question.options) {
                return (
                  <div key={question.id} className={gatedClass} aria-disabled={followUpsDisabled}>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                      <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mr-2">{question.number}.</span>
                      {question.prompt}
                    </p>
                    <RadioGroup
                      value={typeof answers[question.id] === 'string' ? (answers[question.id] as string) : ''}
                      onValueChange={v => updateSingleValue(question.id, v)}
                      className="flex gap-3"
                    >
                      {question.options.map(opt => (
                        <div key={opt.value} className="flex items-center gap-1.5">
                          <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} />
                          <Label htmlFor={`${question.id}-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )
              }

              if (question.type === 'multi_select' && question.options) {
                const selected = Array.isArray(answers[question.id]) ? answers[question.id] : []
                return (
                  <div key={question.id} className={gatedClass} aria-disabled={followUpsDisabled}>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                      <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mr-2">{question.number}.</span>
                      {question.prompt}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {question.options.map(opt => {
                        const isSelected = selected.includes(opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateMultiValue(question.id, opt.value, !isSelected)}
                            className={`rounded-md border px-3 py-1.5 text-[12px] transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              return (
                <div key={question.id} className={gatedClass} aria-disabled={followUpsDisabled}>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                    <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mr-2">{question.number}.</span>
                    {question.prompt}
                  </p>
                  <Input
                    id={question.id}
                    type={question.type === 'number' ? 'number' : 'text'}
                    value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
                    onChange={e => updateSingleValue(question.id, e.target.value)}
                    className="h-9 max-w-xs"
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* --- Scores --- */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-1">
          Scores
        </h2>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-6">
          {ageBand ? `Percentiles using ${ageBand} norms.` : 'Enter age for percentile lookup.'}
          {age !== null && age > 39 && ' Severity labels normed for ages 18-39.'}
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
                  Severity
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
              {scoreTableRows.map(row => (
                <tr key={row.label} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/70">
                  <td className="px-4 py-3 align-top text-sm text-zinc-700 dark:text-zinc-300">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.rawScore ? (
                      row.rawScore.value !== null ? (
                        <span className="text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {row.rawScore.value}
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-base font-semibold tabular-nums text-zinc-300 dark:text-zinc-600">—</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {row.rawScore.answered}/{row.rawScore.total}
                          </p>
                        </div>
                      )
                    ) : (
                      <span className="text-base font-semibold tabular-nums text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.rawScore?.severityLabel ? (
                      <span className={`text-[11px] font-medium ${severityColor[row.rawScore.severityLabel] ?? 'text-zinc-500'}`}>
                        {row.rawScore.severityLabel}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.rawScore?.percentileBand ? (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {formatPercentileBand(row.rawScore.percentileBand)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.symptomCount ? (
                      row.symptomCount.value !== null ? (
                        <span className="text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {row.symptomCount.value}/{row.symptomCount.total}
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-base font-semibold tabular-nums text-zinc-300 dark:text-zinc-600">—</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {row.symptomCount.answered}/{row.symptomCount.total}
                          </p>
                        </div>
                      )
                    ) : (
                      <span className="text-base font-semibold tabular-nums text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Clinical Summary --- */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Clinical Summary
        </h2>
        {narrative ? (
          <div className="relative">
            <textarea
              readOnly
              value={narrative}
              rows={14}
              className="w-full resize-y rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 pr-24 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-serif focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(narrative)
                setCopied(true)
                setTimeout(() => setCopied(false), 1800)
              }}
              className="absolute top-3 right-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Complete all symptom items to generate the summary.
          </p>
        )}
      </section>
    </div>
  )
}
