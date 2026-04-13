'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Info, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  BAARS_NORM_CITATION,
  BAARS_OTHER_REPORT_CHILDHOOD_SYMPTOMS,
  BAARS_OTHER_REPORT_CURRENT_SYMPTOMS,
  BAARS_SELF_REPORT_CHILDHOOD_SYMPTOMS,
  BAARS_SELF_REPORT_CURRENT_SYMPTOMS,
  getBaarsAgeBand,
  lookupBaarsChildhoodPercentile,
  lookupBaarsCurrentPercentile,
} from './baars-config'
import type {
  AssessmentField,
  AssessmentScoringGroup,
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

type PronounChoice = 'she' | 'he' | 'they'
type SctCdsDimension = 'Cognitive Disengagement' | 'Motor Hypoactivity'
type SctCdsCoverage = 'direct' | 'partial' | 'not_assessed'

interface BaarsDraftState {
  headerValues: Record<string, string>
  answers: Record<string, QuestionValue>
  pronounChoice: PronounChoice
}

interface BaarsMasterFormSummary {
  instrument: InstrumentDefinition
  timeframe: 'current' | 'childhood'
  rater: 'self' | 'observer'
  label: string
  completed: boolean
  sentence: string
  thresholdMet: boolean | null
  presentation: string | null
  raterDescriptor: string | null
}

export interface BaarsAdhdCriteriaMeta {
  disorderId: string
  disorderName: string
  durationRequirement: string | null
  childhoodThreshold: number
  adultThreshold: number
  exclusions: string[]
}

const baarsDraftStore = new Map<string, BaarsDraftState>()

const SHORT_LABELS: Record<string, string> = {
  '1': 'Never',
  '2': 'Some.',
  '3': 'Often',
  '4': 'V. often',
}

const DSM_CRITERION_MAP: Record<string, { domain: string; code: string }> = {
  q1: { domain: 'Inattention (A1)', code: 'A1.1' },
  q2: { domain: 'Inattention (A1)', code: 'A1.2' },
  q3: { domain: 'Inattention (A1)', code: 'A1.3' },
  q4: { domain: 'Inattention (A1)', code: 'A1.4' },
  q5: { domain: 'Inattention (A1)', code: 'A1.5' },
  q6: { domain: 'Inattention (A1)', code: 'A1.6' },
  q7: { domain: 'Inattention (A1)', code: 'A1.7' },
  q8: { domain: 'Inattention (A1)', code: 'A1.8' },
  q9: { domain: 'Inattention (A1)', code: 'A1.9' },
  q10: { domain: 'Hyperactivity-Impulsivity (A2)', code: 'A2.1' },
  q11: { domain: 'Hyperactivity-Impulsivity (A2)', code: 'A2.2' },
  q12: { domain: 'Hyperactivity-Impulsivity (A2)', code: 'A2.3' },
  q13: { domain: 'Hyperactivity-Impulsivity (A2)', code: 'A2.4' },
  q14: { domain: 'Hyperactivity-Impulsivity (A2)', code: 'A2.5' },
  q15: { domain: 'Hyperactivity-Impulsivity (A2)', code: 'A2.6' },
  q16: { domain: 'Hyperactivity-Impulsivity (A2)', code: 'A2.7' },
  q17: { domain: 'Hyperactivity-Impulsivity (A2)', code: 'A2.8' },
  q18: { domain: 'Hyperactivity-Impulsivity (A2)', code: 'A2.9' },
}

interface SctCdsCriterionDefinition {
  code: string
  dimension: SctCdsDimension
  criterion: string
  reportLabel: string
  questionIds: string[]
  coverage: SctCdsCoverage
}

const SCT_CDS_CRITERIA: SctCdsCriterionDefinition[] = [
  {
    code: 'CD1',
    dimension: 'Cognitive Disengagement',
    criterion: 'Excessive or maladaptive daydreaming (task-unrelated thought intrusions during goal-directed activity)',
    reportLabel: 'daydreaming during tasks',
    questionIds: ['q19'],
    coverage: 'direct',
  },
  {
    code: 'CD2',
    dimension: 'Cognitive Disengagement',
    criterion: 'Prolonged episodes of blank staring unrelated to absence seizure activity',
    reportLabel: 'blank staring episodes',
    questionIds: [],
    coverage: 'not_assessed',
  },
  {
    code: 'CD3',
    dimension: 'Cognitive Disengagement',
    criterion: 'Persistent mental fogginess or clouded sensorium',
    reportLabel: 'mental fog or feeling spacey',
    questionIds: ['q23'],
    coverage: 'direct',
  },
  {
    code: 'CD4',
    dimension: 'Cognitive Disengagement',
    criterion: 'Absorption in internal mentation (frequently "lost in thought" to the exclusion of environmental awareness)',
    reportLabel: 'getting lost in thought',
    questionIds: ['q19'],
    coverage: 'partial',
  },
  {
    code: 'CD5',
    dimension: 'Cognitive Disengagement',
    criterion: 'Recurrent episodes of cognitive disengagement from the immediate external context ("spacing out" or "zoning out")',
    reportLabel: 'spacing out or zoning out',
    questionIds: ['q23'],
    coverage: 'partial',
  },
  {
    code: 'CD6',
    dimension: 'Cognitive Disengagement',
    criterion: 'Frequent loss of cognitive set or train of thought',
    reportLabel: 'losing track of thoughts',
    questionIds: [],
    coverage: 'not_assessed',
  },
  {
    code: 'CD7',
    dimension: 'Cognitive Disengagement',
    criterion: 'Impaired thought formulation or verbal expression (difficulty organizing and articulating thoughts)',
    reportLabel: 'trouble putting thoughts into words',
    questionIds: [],
    coverage: 'not_assessed',
  },
  {
    code: 'CD8',
    dimension: 'Cognitive Disengagement',
    criterion: 'Easily confused; difficulty with rapid or accurate comprehension of novel information',
    reportLabel: 'getting confused easily or having trouble taking in new information quickly',
    questionIds: ['q21', 'q27'],
    coverage: 'direct',
  },
  {
    code: 'CD9',
    dimension: 'Cognitive Disengagement',
    criterion: 'Slowed cognitive processing speed',
    reportLabel: 'slower thinking speed',
    questionIds: ['q27'],
    coverage: 'direct',
  },
  {
    code: 'CD10',
    dimension: 'Cognitive Disengagement',
    criterion: 'Frequent retrieval failures during active discourse (e.g., forgetting intended verbalizations mid-conversation)',
    reportLabel: 'forgetting what one was about to say mid-conversation',
    questionIds: [],
    coverage: 'not_assessed',
  },
  {
    code: 'MH1',
    dimension: 'Motor Hypoactivity',
    criterion: 'Diminished spontaneous motor activity; hypoactivity',
    reportLabel: 'being underactive or not moving much',
    questionIds: ['q25'],
    coverage: 'direct',
  },
  {
    code: 'MH2',
    dimension: 'Motor Hypoactivity',
    criterion: 'Excessive daytime somnolence not attributable to a primary sleep disorder',
    reportLabel: 'trouble staying awake or alert in boring situations',
    questionIds: ['q20'],
    coverage: 'partial',
  },
  {
    code: 'MH3',
    dimension: 'Motor Hypoactivity',
    criterion: 'Chronic fatigue or low energy disproportionate to activity level and not attributable to a medical condition',
    reportLabel: 'low energy or tiredness',
    questionIds: ['q24', 'q25'],
    coverage: 'direct',
  },
  {
    code: 'MH4',
    dimension: 'Motor Hypoactivity',
    criterion: 'Psychomotor retardation',
    reportLabel: 'slow moving behavior that may reflect psychomotor slowing',
    questionIds: ['q26'],
    coverage: 'partial',
  },
]

const OTHER_REPORT_RELATIONSHIP_LABELS: Record<string, string> = {
  mother: 'Mother',
  father: 'Father',
  brother_sister: 'Brother/Sister',
  spouse_partner: 'Spouse/Partner',
  friend: 'Friend',
  other: 'Other',
}

const BAARS_MASTER_SUMMARY_INSTRUMENTS: InstrumentDefinition[] = [
  BAARS_SELF_REPORT_CURRENT_SYMPTOMS,
  BAARS_SELF_REPORT_CHILDHOOD_SYMPTOMS,
  BAARS_OTHER_REPORT_CURRENT_SYMPTOMS,
  BAARS_OTHER_REPORT_CHILDHOOD_SYMPTOMS,
]

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

function cloneDraftAnswers(answers: Record<string, QuestionValue>): Record<string, QuestionValue> {
  return Object.fromEntries(
    Object.entries(answers).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value,
    ]),
  )
}

function readBaarsDraft(
  instrumentId: string,
  fields: AssessmentField[],
): BaarsDraftState | null {
  const draft = baarsDraftStore.get(instrumentId)
  if (!draft) return null

  const initialHeaderValues = buildInitialHeaderValues(fields)
  const headerValues = fields.reduce<Record<string, string>>((values, field) => {
    const storedValue = draft.headerValues[field.id]
    if (typeof storedValue === 'string') {
      values[field.id] = storedValue
    }
    return values
  }, { ...initialHeaderValues })

  return {
    headerValues,
    answers: cloneDraftAnswers(draft.answers),
    pronounChoice: draft.pronounChoice,
  }
}

function writeBaarsDraft(
  instrumentId: string,
  fields: AssessmentField[],
  headerValues: Record<string, string>,
  pronounChoice: PronounChoice,
  answers: Record<string, QuestionValue>,
) {
  const serializedHeaderValues = fields.reduce<Record<string, string>>((values, field) => {
    values[field.id] = headerValues[field.id] ?? ''
    return values
  }, {})

  baarsDraftStore.set(instrumentId, {
    headerValues: serializedHeaderValues,
    answers: cloneDraftAnswers(answers),
    pronounChoice,
  })
}

function clearBaarsDraft(instrumentId: string) {
  baarsDraftStore.delete(instrumentId)
}

function getBaarsDraftEntries(): Array<[string, BaarsDraftState]> {
  return Array.from(baarsDraftStore.entries()).map(([instrumentId, draft]) => [
    instrumentId,
    {
      headerValues: { ...draft.headerValues },
      answers: cloneDraftAnswers(draft.answers),
      pronounChoice: draft.pronounChoice,
    },
  ])
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

function parsePercentileBand(percentileBand: string): { min: number; max: number } | null {
  if (/^\d+\+$/.test(percentileBand)) {
    const value = Number(percentileBand.slice(0, -1))
    return Number.isFinite(value) ? { min: value, max: Number.POSITIVE_INFINITY } : null
  }

  if (/^\d+$/.test(percentileBand)) {
    const value = Number(percentileBand)
    return Number.isFinite(value) ? { min: value, max: value } : null
  }

  const rangeMatch = percentileBand.match(/^(\d+)-(\d+)$/)
  if (!rangeMatch) return null

  const min = Number(rangeMatch[1])
  const max = Number(rangeMatch[2])
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null

  return { min, max }
}

function getDescriptiveCategoryFromPercentileBand(percentileBand: string | null): string | null {
  if (!percentileBand) return null

  const parsedBand = parsePercentileBand(percentileBand)
  if (!parsedBand) return null

  if (parsedBand.min >= 99) return 'High'
  if (parsedBand.min >= 97 && parsedBand.max <= 98) return 'Moderate'
  if (parsedBand.min >= 93 && parsedBand.max <= 96) return 'Mild'
  if (parsedBand.min >= 84 && parsedBand.max <= 92) return 'Subclinical'
  if (parsedBand.min >= 1 && parsedBand.max <= 83) return 'Normal'

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
  if (!question?.options) return formatReportList(value)

  const labels = value
    .map(optionValue => question.options?.find(option => option.value === optionValue)?.label ?? optionValue)
  return formatReportList(labels)
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

function formatReportList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function lowercaseFirst(text: string): string {
  if (!text) return text
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`
}

function formatSymptomPhrase(prompt: string): string {
  const trimmed = prompt.trim().replace(/[.:;!?]+$/, '')

  return lowercaseFirst(
    trimmed
      .replace(/^don['’]t listen when spoken to directly$/i, 'not listening when spoken to directly')
      .replace(/^didn['’]t listen when spoken to directly$/i, 'not listening when spoken to directly')
      .replace(/^don['’]t follow through on instructions and fail to finish work or chores$/i, 'not following through on instructions and failing to finish work or chores')
      .replace(/^didn['’]t follow through on instructions and failed to finish work or chores$/i, 'not following through on instructions and failing to finish work or chores')
      .replace(/^avoid, dislike, or am reluctant to engage in tasks that require sustained mental effort$/i, 'avoiding or disliking tasks that require sustained mental effort')
      .replace(/^avoided, disliked, or was reluctant to engage in tasks that required sustained mental effort$/i, 'avoiding or disliking tasks that required sustained mental effort')
      .replace(/^has difficulty engaging in leisure activities quietly \(feels uncomfortable, or is loud or noisy\)$/i, 'having difficulty doing leisure activities quietly')
      .replace(/^have difficulty engaging in leisure activities quietly \(feel uncomfortable, or am loud or noisy\)$/i, 'having difficulty doing leisure activities quietly')
      .replace(/^had difficulty engaging in leisure activities quietly \(felt uncomfortable, or was loud or noisy\)$/i, 'having difficulty doing leisure activities quietly')
      .replace(/^is ["“]on the go["”] or acts as if ["“]driven by a motor["”].*$/i, 'being "on the go" or acting as if "driven by a motor"')
      .replace(/^i am ["“]on the go["”] or act as if ["“]driven by a motor["”].*$/i, 'being "on the go" or acting as if "driven by a motor"')
      .replace(/^was ["“]on the go["”] or acted as if ["“]driven by a motor["”]$/i, 'being "on the go" or acting as if "driven by a motor"')
      .replace(/^talk(?:s|ed)? excessively(?: \(in social situations\))?$/i, 'talking excessively')
      .replace(/^blurt(?:s|ed)? out answers before questions (?:have|had) been completed, complete(?:s|d)? others['’] sentences, or jump(?:s|ed)? the gun$/i, "blurting out answers before questions are finished, completing others' sentences, or jumping the gun")
      .replace(/^interrupt(?:s|ed)? or intrud(?:e|es|ed) on others .*$/i, 'interrupting or intruding on others')
      .replace(/^fidget(?:s|ed)? with hands or feet or squirm(?:s|ed)? in seat$/i, 'fidgeting with hands or feet or squirming in seat')
      .replace(/^fidget(?:s|ed)? with his\/her hands or feet or squirm(?:s|ed)? in his\/her seat$/i, 'fidgeting with hands or feet or squirming in seat')
      .replace(/^shift(?:s|ed)? around excessively or feel(?:s|t)? restless or hemmed in$/i, 'shifting around excessively or feeling restless or hemmed in')
      .replace(/^is prone to daydreaming when he\/she should be concentrating on something or working$/i, 'daydreaming when attention should be on a task or work')
      .replace(/^prone to daydreaming when i should be concentrating on something or working$/i, 'daydreaming when attention should be on a task or work')
      .replace(/^doesn['’]t seem to process information as quickly or as accurately as others$/i, 'processing information more slowly or less accurately than others')
      .replace(/^i don['’]t seem to process information as quickly or as accurately as others$/i, 'processing information more slowly or less accurately than others')
      .replace(/^I\s+/i, '')
      .replace(/\bmy\b\s+/gi, '')
      .replace(/^don['’]t\s+/i, 'not ')
      .replace(/^doesn['’]t\s+/i, 'not ')
      .replace(/^didn['’]t\s+/i, 'not ')
      .replace(/^has difficulty\s+/i, 'having difficulty ')
      .replace(/^have difficulty\s+/i, 'having difficulty ')
      .replace(/^has trouble\s+/i, 'having trouble ')
      .replace(/^have trouble\s+/i, 'having trouble ')
      .replace(/^had difficulty\s+/i, 'having difficulty ')
      .replace(/^had trouble\s+/i, 'having trouble ')
      .replace(/^fails to\s+/i, 'failing to ')
      .replace(/^fail to\s+/i, 'failing to ')
      .replace(/^failed to\s+/i, 'failing to ')
      .replace(/^avoids\s+/i, 'avoiding ')
      .replace(/^avoid\s+/i, 'avoiding ')
      .replace(/^avoided\s+/i, 'avoiding ')
      .replace(/^loses\s+/i, 'losing ')
      .replace(/^lose\s+/i, 'losing ')
      .replace(/^lost\s+/i, 'losing ')
      .replace(/^is easily distracted by\s+/i, 'easily distracted by ')
      .replace(/^was easily distracted by\s+/i, 'easily distracted by ')
      .replace(/^is forgetful in\s+/i, 'forgetful in ')
      .replace(/^was forgetful in\s+/i, 'forgetful in ')
      .replace(/^am\s+/i, 'being ')
      .replace(/^is\s+/i, 'being ')
      .replace(/^was\s+/i, 'being ')
      .replace(/^feel\s+/i, 'feeling ')
      .replace(/^felt\s+/i, 'feeling ')
      .replace(/^fidgets\s+/i, 'fidgeting ')
      .replace(/^fidget\s+/i, 'fidgeting ')
      .replace(/^fidgeted\s+/i, 'fidgeting ')
      .replace(/^leaves\s+/i, 'leaving ')
      .replace(/^leave\s+/i, 'leaving ')
      .replace(/^left\s+/i, 'leaving ')
      .replace(/^shifts\s+/i, 'shifting ')
      .replace(/^shift\s+/i, 'shifting ')
      .replace(/^shifted\s+/i, 'shifting ')
      .replace(/^run about\s+/i, 'running about ')
      .replace(/^run around\s+/i, 'running around ')
      .replace(/^talks excessively\s*/i, 'talking excessively')
      .replace(/^talk excessively\s*/i, 'talking excessively')
      .replace(/^talked\s+/i, 'talking ')
      .replace(/^interrupts\s+/i, 'interrupting ')
      .replace(/^interrupt\s+/i, 'interrupting ')
      .replace(/^interrupted\s+/i, 'interrupting ')
      .replace(/^blurts out\s+/i, 'blurting out ')
      .replace(/^blurt out\s+/i, 'blurting out ')
      .replace(/^blurted out\s+/i, 'blurting out ')
      .replace(/^blurts out\s+/i, 'blurting out ')
  )
}

function hasEndorsedCriterionEvidence(
  answers: Record<string, QuestionValue>,
  questionIds: string[],
): boolean {
  return questionIds.some(questionId => {
    const value = answers[questionId]
    return typeof value === 'string' && Number(value) >= 3
  })
}

function formatPossessiveName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "the respondent's"
  return /s$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`
}

function isBaarsOtherReportInstrument(instrument: InstrumentDefinition): boolean {
  return instrument.id.includes('other_report')
}

function isBaarsChildhoodInstrument(instrument: InstrumentDefinition): boolean {
  return instrument.id.includes('childhood_symptoms')
}

function isBaarsCurrentInstrument(instrument: InstrumentDefinition): boolean {
  return instrument.id.includes('current_symptoms')
}

function getBaarsSubjectName(
  instrument: InstrumentDefinition,
  header: Record<string, string>,
): string {
  const name = (header.name || '').trim()
  if (name) return name
  return isBaarsOtherReportInstrument(instrument) ? 'The rated person' : 'The respondent'
}

function getBaarsPronounSet(pronounChoice: PronounChoice): {
  subject: string
  subjectLower: string
  possessive: string
} {
  if (pronounChoice === 'she') {
    return { subject: 'She', subjectLower: 'she', possessive: 'Her' }
  }

  if (pronounChoice === 'he') {
    return { subject: 'He', subjectLower: 'he', possessive: 'His' }
  }

  return { subject: 'They', subjectLower: 'they', possessive: 'Their' }
}

function formatBaarsRaterDescriptor(header: Record<string, string>): string | null {
  const raterName = (header.raterName || '').trim()
  const relationshipValue = (header.relationship || '').trim()
  const relationshipLabel = relationshipValue ? (OTHER_REPORT_RELATIONSHIP_LABELS[relationshipValue] ?? relationshipValue) : ''

  if (raterName && relationshipLabel) return `${raterName} (${relationshipLabel})`
  if (raterName) return raterName
  if (relationshipLabel) return relationshipLabel
  return null
}

function buildBaarsReportLead(
  instrument: InstrumentDefinition,
  header: Record<string, string>,
  subjectName: string,
): string {
  if (isBaarsOtherReportInstrument(instrument)) {
    const raterDescriptor = formatBaarsRaterDescriptor(header)
    return `According to the DSM-5-TR, the observer report for ${subjectName}${raterDescriptor ? ` from ${raterDescriptor}` : ''}`
  }

  return `According to the DSM-5-TR, ${formatPossessiveName(subjectName)} self-report`
}

function buildEndorsedSymptomsSection(
  instrument: InstrumentDefinition,
  answers: Record<string, QuestionValue>,
): string | null {
  const groupedSymptoms = new Map<string, Map<string, string[]>>()

  for (const section of instrument.sections) {
    if (section.id === 'follow_up') continue

    const normalizedSectionTitle = section.title.replace(/^Section \d+:?\s*/, '').trim()
    const fallbackDomain = section.id === 'sluggish_cognitive_tempo'
      ? 'Sluggish Cognitive Tempo'
      : normalizedSectionTitle || section.title

    for (const question of section.questions) {
      const value = answers[question.id]
      if (typeof value !== 'string' || Number(value) < 3) continue

      const dsmCriterion = DSM_CRITERION_MAP[question.id]
      const domain = dsmCriterion?.domain ?? fallbackDomain
      const responseLabel = (instrument.responseScale?.find(option => option.value === value)?.label ?? value).toLowerCase()
      const line = formatSymptomPhrase(question.prompt)

      const domainMap = groupedSymptoms.get(domain) ?? new Map<string, string[]>()
      const responseLines = domainMap.get(responseLabel) ?? []
      responseLines.push(line)
      domainMap.set(responseLabel, responseLines)
      groupedSymptoms.set(domain, domainMap)
    }
  }

  if (groupedSymptoms.size === 0) return null

  const responseOrder = ['very often', 'often']
  const isChildhoodInstrument = isBaarsChildhoodInstrument(instrument)
  const ratingVerb = isBaarsOtherReportInstrument(instrument)
    ? 'rated at "Often" or "Very Often"'
    : 'endorsed at "Often" or "Very Often"'
  const bulletLines = Array.from(groupedSymptoms.entries()).map(([domain, responseGroups]) => {
    const label = domain === 'Inattention (A1)'
      ? isChildhoodInstrument
        ? 'Childhood Inattention'
        : 'Inattention'
      : domain === 'Hyperactivity-Impulsivity (A2)'
        ? isChildhoodInstrument
          ? 'Childhood Hyperactivity-Impulsivity'
          : 'Hyperactivity-Impulsivity'
        : 'SCT/CDS'

    const details = responseOrder
      .filter(responseLabel => (responseGroups.get(responseLabel) ?? []).length > 0)
      .map(responseLabel => `${formatReportList(responseGroups.get(responseLabel) ?? [])} (${responseLabel})`)
      .join('; ')

    return `- ${label}: ${details}.`
  })

  const heading = isChildhoodInstrument
    ? `ADHD symptoms ${ratingVerb}:`
    : groupedSymptoms.has('Sluggish Cognitive Tempo')
      ? `ADHD and SCT/CDS symptoms ${ratingVerb}:`
      : `ADHD symptoms ${ratingVerb}:`

  return [heading, ...bulletLines].join('\n')
}

function buildSctCriteriaSummary(
  instrument: InstrumentDefinition,
  answers: Record<string, QuestionValue>,
): string | null {
  if (!isBaarsCurrentInstrument(instrument)) return null

  const directByDimension = new Map<SctCdsDimension, string[]>()
  const partialByDimension = new Map<SctCdsDimension, string[]>()

  for (const criterion of SCT_CDS_CRITERIA) {
    if (criterion.coverage === 'not_assessed') continue

    if (!hasEndorsedCriterionEvidence(answers, criterion.questionIds)) continue

    const detail = criterion.reportLabel
    const bucket = criterion.coverage === 'direct' ? directByDimension : partialByDimension
    const currentItems = bucket.get(criterion.dimension) ?? []
    currentItems.push(detail)
    bucket.set(criterion.dimension, currentItems)
  }

  const directCognitive = directByDimension.get('Cognitive Disengagement') ?? []
  const directMotor = directByDimension.get('Motor Hypoactivity') ?? []
  const partialCognitive = partialByDimension.get('Cognitive Disengagement') ?? []
  const partialMotor = partialByDimension.get('Motor Hypoactivity') ?? []
  const notAssessed = SCT_CDS_CRITERIA
    .filter(criterion => criterion.coverage === 'not_assessed')
    .map(criterion => criterion.reportLabel)

  const parts: string[] = [
    'SCT/CDS criteria coverage across the BAARS items:'
  ]

  if (directCognitive.length > 0) {
    parts.push(`- Direct cognitive disengagement features: ${formatReportList(directCognitive)}.`)
  }

  if (directMotor.length > 0) {
    parts.push(`- Direct motor hypoactivity features: ${formatReportList(directMotor)}.`)
  }

  if (directCognitive.length === 0 && directMotor.length === 0) {
    parts.push(
      isBaarsOtherReportInstrument(instrument)
        ? '- No directly measured SCT/CDS features were rated at the "Often" or "Very Often" level.'
        : '- No directly measured SCT/CDS features were endorsed at the "Often" or "Very Often" level.',
    )
  }

  if (partialCognitive.length > 0) {
    parts.push(`- Partial cognitive disengagement overlap: ${formatReportList(partialCognitive)}.`)
  }

  if (partialMotor.length > 0) {
    parts.push(`- Partial motor hypoactivity overlap: ${formatReportList(partialMotor)}.`)
  }

  parts.push(`- Not directly assessed by this BAARS form: ${formatReportList(notAssessed)}.`)

  return parts.join('\n')
}

function buildCurrentCriteriaSuggestion(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  age: number | null,
  header: Record<string, string>,
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
  const subjectName = getBaarsSubjectName(instrument, header)
  const reportLead = buildBaarsReportLead(instrument, header, subjectName)
  const impairmentVerb = isBaarsOtherReportInstrument(instrument) ? 'reported' : 'endorsed'

  if (!presentation) {
    return `${reportLead} does not reach the ${adhdCriteria.disorderName} symptom threshold on this administration (${threshold}+ symptoms in either the inattention or hyperactivity-impulsivity domain for this age band).`
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
    return `${reportLead} is consistent with ${adhdCriteria.disorderName}, ${presentation} presentation, because the symptom threshold is met (${threshold}+ symptoms for this age band), the rating window reflects ${durationText}, onset was reported by age 12, and impairment was ${impairmentVerb} in ${settings.length} settings${settingsText ? ` (${settingsText})` : ''}. Exclusion review is still required, so this remains a screening inference rather than a standalone diagnosis.`
  }

  return `${reportLead} reaches the ${adhdCriteria.disorderName} symptom threshold for ${presentation} presentation, but this form does not fully establish ${missingParts.join(' and ')}. The DSM duration window is ${durationText}, and final diagnosis still requires exclusion review and clinical rule-outs.`
}

function buildChildhoodCriteriaSuggestion(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  header: Record<string, string>,
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
  const subjectName = getBaarsSubjectName(instrument, header)
  const reportLead = buildBaarsReportLead(instrument, header, subjectName)
  const impairmentVerb = isBaarsOtherReportInstrument(instrument) ? 'reported' : 'endorsed'

  if (!presentation) {
    return `${reportLead} of childhood symptoms does not reach the ${adhdCriteria.disorderName} childhood symptom threshold on this administration (${threshold}+ symptoms in either domain).`
  }

  if (settingsMet === true) {
    return `${reportLead} of childhood symptoms suggests the childhood symptom threshold is met for ${adhdCriteria.disorderName}, ${presentation} presentation, with impairment ${impairmentVerb} in ${settings.length} settings${settingsText ? ` (${settingsText})` : ''}. This form still does not independently confirm ${adhdCriteria.durationRequirement?.toLowerCase() ?? 'the full DSM duration requirement'} or current adult persistence.`
  }

  return `${reportLead} of childhood symptoms reaches the childhood symptom threshold for ${adhdCriteria.disorderName}, ${presentation} presentation, but cross-setting impairment is not fully documented on this form. This form also does not independently confirm ${adhdCriteria.durationRequirement?.toLowerCase() ?? 'the full DSM duration requirement'} or current adult persistence.`
}

function buildScoreTableRows(
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
): ScoreTableRow[] {
  if (isBaarsChildhoodInstrument(instrument)) {
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
  pronounChoice: PronounChoice,
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

  const ageText = header.age ? `${header.age}-year-old` : ''
  const demographic = ageText
  const subjectName = getBaarsSubjectName(instrument, header)
  const { subject: pronoun, subjectLower: pronounLower, possessive } = getBaarsPronounSet(pronounChoice)
  const raterDescriptor = formatBaarsRaterDescriptor(header)
  const isOtherReport = isBaarsOtherReportInstrument(instrument)

  const fmt = (s: ComputedGroupScore) => {
    const base = `${s.value}${s.severityLabel ? `, ${s.severityLabel}` : ''}`
    return s.percentileBand ? `${base}, ${formatPercentileBand(s.percentileBand)}` : base
  }

  const intro = isOtherReport
    ? `${subjectName}${demographic ? `, a ${demographic},` : ''} was rated on the ${instrument.title} on ${header.date || 'today'}${raterDescriptor ? ` by ${raterDescriptor}` : ''}.${ageBand ? ` Raw scores were compared against the ${ageBand} age band.` : ''}`
    : `${subjectName}${demographic ? `, a ${demographic},` : ''} completed the ${instrument.title} on ${header.date || 'today'}.${ageBand ? ` Raw scores were compared against the ${ageBand} age band.` : ''}`
  const subscales = isOtherReport
    ? `On the symptom items, ${subjectName} was rated with the following subscale raw scores: Inattention (${fmt(inattention)}); Hyperactivity (${fmt(hyperactivity)}); Impulsivity (${fmt(impulsivity)}); and Sluggish Cognitive Tempo (${fmt(sct)}). ${possessive} Total ADHD raw score was ${fmt(totalAdhd)}.`
    : `On the symptom items, ${pronounLower} obtained the following subscale raw scores: Inattention (${fmt(inattention)}); Hyperactivity (${fmt(hyperactivity)}); Impulsivity (${fmt(impulsivity)}); and Sluggish Cognitive Tempo (${fmt(sct)}). ${possessive} Total ADHD raw score was ${fmt(totalAdhd)}.`
  const counts = isOtherReport
    ? `At the DSM symptom-count threshold (items rated "Often" or "Very Often"), the rater marked ${inattCount?.value ?? 0}/9 inattention symptoms and ${hyperImpCount.value}/9 hyperactivity-impulsivity symptoms for ${subjectName} (${totalSymptomCount.value}/18 total).`
    : `At the DSM symptom-count threshold (items rated "Often" or "Very Often"), ${pronounLower} endorsed ${inattCount?.value ?? 0}/9 inattention symptoms and ${hyperImpCount.value}/9 hyperactivity-impulsivity symptoms (${totalSymptomCount.value}/18 total).`
  const endorsedSymptoms = buildEndorsedSymptomsSection(instrument, answers)
  const sctCriteriaSummary = buildSctCriteriaSummary(instrument, answers)
  const criteriaSuggestion = buildCurrentCriteriaSuggestion(adhdCriteria, instrument, scores, answers, age, header)

  const followUpParts: string[] = []
  if (followUpPositive === 'yes') {
    followUpParts.push(
      isOtherReport
        ? `${subjectName} was rated as experiencing at least one symptom at an "Often" frequency or higher.`
        : `${pronoun} endorsed experiencing at least one symptom at an "Often" frequency or higher.`,
    )
    if (typeof onset === 'string' && onset.trim()) {
      followUpParts.push(`Reported age of symptom onset: ${onset.trim()}.`)
    }
    if (settingsText) {
      followUpParts.push(`Impairment was reported in the following settings: ${settingsText}.`)
    }
  } else if (followUpPositive === 'no') {
    followUpParts.push(
      isOtherReport
        ? `${subjectName} was not rated as showing any symptoms at an "Often" frequency or higher.`
        : `${pronoun} did not endorse any symptoms at an "Often" frequency or higher.`,
    )
  }

  const footer = 'Results should be interpreted in the context of clinical interview, developmental history, and collateral information.'

  return [intro, subscales, counts, endorsedSymptoms, sctCriteriaSummary, criteriaSuggestion, followUpParts.join(' '), footer].filter(Boolean).join('\n\n')
}

function buildChildhoodNarrative(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  ageBand: string | null,
  header: Record<string, string>,
  pronounChoice: PronounChoice,
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

  const ageText = header.age ? `${header.age}-year-old` : ''
  const demographic = ageText
  const subjectName = getBaarsSubjectName(instrument, header)
  const { subject: pronoun, subjectLower: pronounLower, possessive } = getBaarsPronounSet(pronounChoice)
  const raterDescriptor = formatBaarsRaterDescriptor(header)
  const isOtherReport = isBaarsOtherReportInstrument(instrument)

  const fmt = (s: ComputedGroupScore) => {
    const base = `${s.value}${s.severityLabel ? `, ${s.severityLabel}` : ''}`
    return s.percentileBand ? `${base}, ${formatPercentileBand(s.percentileBand)}` : base
  }

  const intro = isOtherReport
    ? `${subjectName}${demographic ? `, a ${demographic},` : ''} was rated on the ${instrument.title} on ${header.date || 'today'}${raterDescriptor ? ` by ${raterDescriptor}` : ''}. Ratings reflect reported childhood behavior between ages 5 and 12.${ageBand ? ` Raw scores were compared against the ${ageBand} age band.` : ''}`
    : `${subjectName}${demographic ? `, a ${demographic},` : ''} completed the ${instrument.title} on ${header.date || 'today'}. Ratings reflect recalled behavior between ages 5 and 12.${ageBand ? ` Raw scores were compared against the ${ageBand} age band.` : ''}`
  const subscales = isOtherReport
    ? `On the retrospective childhood symptom items, ${subjectName} was rated with the following raw scores: Inattention (${fmt(inattention)}) and Hyperactivity-Impulsivity (${fmt(hyperImp)}). ${possessive} Total ADHD raw score was ${fmt(totalAdhd)}.`
    : `On the retrospective childhood symptom items, ${pronounLower} obtained the following raw scores: Inattention (${fmt(inattention)}) and Hyperactivity-Impulsivity (${fmt(hyperImp)}). ${possessive} Total ADHD raw score was ${fmt(totalAdhd)}.`
  const counts = isOtherReport
    ? `At the DSM symptom-count threshold (items rated "Often" or "Very Often"), the rater marked ${inattCount.value}/9 inattention symptoms and ${hyperImpCount.value}/9 hyperactivity-impulsivity symptoms for ${subjectName} (${totalSymptomCount.value}/18 total).`
    : `At the DSM symptom-count threshold (items rated "Often" or "Very Often"), ${pronounLower} endorsed ${inattCount.value}/9 inattention symptoms and ${hyperImpCount.value}/9 hyperactivity-impulsivity symptoms (${totalSymptomCount.value}/18 total).`
  const endorsedSymptoms = buildEndorsedSymptomsSection(instrument, answers)
  const criteriaSuggestion = buildChildhoodCriteriaSuggestion(adhdCriteria, instrument, scores, answers, header)

  const followUpParts: string[] = []
  if (followUpPositive === 'yes') {
    followUpParts.push(
      isOtherReport
        ? `${subjectName} was rated as experiencing at least one childhood symptom at an "Often" frequency or higher.`
        : `${pronoun} endorsed experiencing at least one childhood symptom at an "Often" frequency or higher.`,
    )
    if (settingsText) {
      followUpParts.push(`Impairment was reported in the following settings: ${settingsText}.`)
    }
  } else if (followUpPositive === 'no') {
    followUpParts.push(
      isOtherReport
        ? `${subjectName} was not rated as showing any childhood symptoms at an "Often" frequency or higher.`
        : `${pronoun} did not endorse any childhood symptoms at an "Often" frequency or higher.`,
    )
  }

  const footer = 'Results should be interpreted alongside developmental history, collateral information, and the limits of retrospective recall.'

  return [intro, subscales, counts, endorsedSymptoms, criteriaSuggestion, followUpParts.join(' '), footer].filter(Boolean).join('\n\n')
}

function buildNarrative(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  ageBand: string | null,
  header: Record<string, string>,
  pronounChoice: PronounChoice,
  followUpPositive: 'yes' | 'no' | null,
  age: number | null,
): string | null {
  if (isBaarsChildhoodInstrument(instrument)) {
    return buildChildhoodNarrative(adhdCriteria, instrument, scores, answers, ageBand, header, pronounChoice, followUpPositive)
  }

  return buildCurrentNarrative(adhdCriteria, instrument, scores, answers, ageBand, header, pronounChoice, followUpPositive, age)
}

function getBaarsSymptomSections(instrument: InstrumentDefinition): typeof instrument.sections {
  return instrument.sections.filter(section => section.id !== 'follow_up')
}

function computeBaarsScores(
  instrument: InstrumentDefinition,
  answers: Record<string, QuestionValue>,
  age: number | null,
): ComputedGroupScore[] {
  return instrument.scoringGroups.map(group => {
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
      ? isBaarsChildhoodInstrument(instrument)
        ? lookupBaarsChildhoodPercentile(group.id, value, age)
        : lookupBaarsCurrentPercentile(group.id, value, age)
      : null

    const severityLabel = group.scoringType === 'raw_sum'
      ? getDescriptiveCategoryFromPercentileBand(percentileBand)
      : null

    return { group, value, answered: numericAnswers.length, total: group.questionIds.length, severityLabel, percentileBand }
  })
}

function hasMeaningfulBaarsDraft(draft: BaarsDraftState): boolean {
  const hasAnswers = Object.values(draft.answers).some(value =>
    Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string' && value.trim() !== '',
  )
  const hasHeaders = Object.entries(draft.headerValues).some(([key, value]) =>
    key !== 'date' && value.trim() !== '',
  )

  return hasAnswers || hasHeaders
}

function getBaarsMasterFormLabel(instrument: InstrumentDefinition): string {
  const timeframe = isBaarsChildhoodInstrument(instrument) ? 'Childhood' : 'Current'
  const rater = isBaarsOtherReportInstrument(instrument) ? 'observer report' : 'self-report'
  return `${timeframe} ${rater}`
}

function formatBaarsMasterScore(score: ComputedGroupScore | null): string {
  if (!score || score.value === null) return 'unavailable'

  const details: string[] = []
  if (score.severityLabel) details.push(score.severityLabel)
  if (score.percentileBand) details.push(formatPercentileBand(score.percentileBand))

  return details.length > 0 ? `${score.value} (${details.join(', ')})` : `${score.value}`
}

function buildBaarsDraftProgressNote(
  instrument: InstrumentDefinition,
  draft: BaarsDraftState,
): string {
  const raterDescriptor = formatBaarsRaterDescriptor(draft.headerValues)
  const symptomSections = getBaarsSymptomSections(instrument)
  const totalLikert = symptomSections.reduce((sum, section) => sum + section.questions.length, 0)
  const answeredCount = symptomSections.reduce((sum, section) =>
    sum + section.questions.filter(question => typeof draft.answers[question.id] === 'string' && draft.answers[question.id] !== '').length,
  0)
  const label = getBaarsMasterFormLabel(instrument)
  const labelWithSource = isBaarsOtherReportInstrument(instrument) && raterDescriptor
    ? `${label} from ${raterDescriptor}`
    : label

  return `${labelWithSource} is in progress (${answeredCount}/${totalLikert} symptom items completed).`
}

function buildBaarsMasterFormSummary(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  instrument: InstrumentDefinition,
  draft: BaarsDraftState,
): BaarsMasterFormSummary {
  const ageValue = Number(draft.headerValues.age)
  const age = Number.isFinite(ageValue) ? ageValue : null
  const ageBand = age !== null ? getBaarsAgeBand(age) : null
  const symptomSections = getBaarsSymptomSections(instrument)
  const symptomQuestionIds = symptomSections.flatMap(section => section.questions.map(question => question.id))
  const firstFollowUpQuestion = instrument.sections.find(section => section.id === 'follow_up')?.questions[0] ?? null
  const followUpPositive = firstFollowUpQuestion
    ? deriveFollowUpPositive(symptomQuestionIds, draft.answers)
    : null
  const computedScores = computeBaarsScores(instrument, draft.answers, age)
  const raterDescriptor = formatBaarsRaterDescriptor(draft.headerValues)
  const label = getBaarsMasterFormLabel(instrument)
  const labelWithSource = isBaarsOtherReportInstrument(instrument) && raterDescriptor
    ? `${label} from ${raterDescriptor}`
    : label
  const timeframe = isBaarsChildhoodInstrument(instrument) ? 'childhood' : 'current'
  const rater = isBaarsOtherReportInstrument(instrument) ? 'observer' : 'self'

  const narrative = buildNarrative(
    adhdCriteria,
    instrument,
    computedScores,
    draft.answers,
    ageBand,
    draft.headerValues,
    draft.pronounChoice,
    followUpPositive,
    age,
  )

  if (!narrative) {
    return {
      instrument,
      timeframe,
      rater,
      label,
      completed: false,
      sentence: buildBaarsDraftProgressNote(instrument, draft),
      thresholdMet: null,
      presentation: null,
      raterDescriptor,
    }
  }

  const inattentionCount = getScoreById(computedScores, 'inattention_symptom_count')
  const hyperImpCount = getScoreById(computedScores, 'hyperactivity_impulsivity_symptom_count')
  const totalAdhd = getScoreById(computedScores, 'total_adhd_raw')
  const settingsValue = isBaarsChildhoodInstrument(instrument) ? draft.answers.q20 : draft.answers.q30
  const settings = Array.isArray(settingsValue) ? settingsValue : []
  const settingsText = isBaarsChildhoodInstrument(instrument)
    ? formatSelectedOptionLabels(instrument, 'q20', draft.answers.q20)
    : formatSelectedOptionLabels(instrument, 'q30', draft.answers.q30)

  if (
    !inattentionCount ||
    inattentionCount.value === null ||
    !hyperImpCount ||
    hyperImpCount.value === null ||
    !totalAdhd ||
    totalAdhd.value === null
  ) {
    return {
      instrument,
      timeframe,
      rater,
      label,
      completed: false,
      sentence: buildBaarsDraftProgressNote(instrument, draft),
      thresholdMet: null,
      presentation: null,
      raterDescriptor,
    }
  }

  if (isBaarsChildhoodInstrument(instrument)) {
    const threshold = adhdCriteria.childhoodThreshold
    const presentation = getAdhdPresentationLabel(inattentionCount.value, hyperImpCount.value, threshold)
    const thresholdMet = presentation !== null
    const hyperImpRaw = getScoreById(computedScores, 'hyperactivity_impulsivity_raw')

    const sentenceParts = [
      `${labelWithSource} showed ${inattentionCount.value}/9 inattention symptoms and ${hyperImpCount.value}/9 hyperactivity-impulsivity symptoms, with a Total ADHD raw score of ${formatBaarsMasterScore(totalAdhd)}${hyperImpRaw ? ` and a Hyperactivity-Impulsivity raw score of ${formatBaarsMasterScore(hyperImpRaw)}` : ''}.`,
    ]

    if (presentation) {
      if (settings.length >= 2) {
        sentenceParts.push(
          `On this retrospective form, the pattern is consistent with childhood ADHD ${presentation} presentation, with impairment reported in ${settingsText}.`,
        )
      } else {
        sentenceParts.push(
          settings.length === 1 && settingsText
            ? `On this retrospective form, symptom counts reach the childhood ADHD ${presentation} presentation threshold, though cross-setting impairment was only reported in ${settingsText}.`
            : `On this retrospective form, symptom counts reach the childhood ADHD ${presentation} presentation threshold, though cross-setting impairment was not fully documented.`,
        )
      }
    } else {
      sentenceParts.push('This form does not reach the childhood ADHD symptom threshold.')
    }

    return {
      instrument,
      timeframe,
      rater,
      label,
      completed: true,
      sentence: sentenceParts.join(' '),
      thresholdMet,
      presentation,
      raterDescriptor,
    }
  }

  const threshold = age !== null && age <= 16 ? adhdCriteria.childhoodThreshold : adhdCriteria.adultThreshold
  const presentation = getAdhdPresentationLabel(inattentionCount.value, hyperImpCount.value, threshold)
  const thresholdMet = presentation !== null
  const onsetValue = typeof draft.answers.q29 === 'string' && draft.answers.q29.trim() !== ''
    ? Number(draft.answers.q29)
    : null
  const onsetBeforeTwelve = onsetValue !== null && Number.isFinite(onsetValue) ? onsetValue <= 12 : null
  const sctRaw = getScoreById(computedScores, 'sct_raw')
  const sentenceParts = [
    `${labelWithSource} showed ${inattentionCount.value}/9 inattention symptoms and ${hyperImpCount.value}/9 hyperactivity-impulsivity symptoms, with a Total ADHD raw score of ${formatBaarsMasterScore(totalAdhd)}${sctRaw ? ` and an SCT raw score of ${formatBaarsMasterScore(sctRaw)}` : ''}.`,
  ]

  if (presentation) {
    if (onsetBeforeTwelve === true && settings.length >= 2) {
      sentenceParts.push(
        `On this form, the pattern is consistent with an ADHD ${presentation} presentation screening profile, with onset reported at age ${onsetValue} and impairment reported in ${settingsText}.`,
      )
    } else {
      const caveats: string[] = []
      if (onsetBeforeTwelve !== true) {
        caveats.push(
          onsetBeforeTwelve === false && onsetValue !== null
            ? `onset was entered as age ${onsetValue}`
            : 'onset before age 12 was not documented',
        )
      }
      if (settings.length < 2) {
        caveats.push(
          settings.length === 1 && settingsText
            ? `impairment was only reported in ${settingsText}`
            : 'cross-setting impairment was not fully documented',
        )
      }

      sentenceParts.push(
        `On this form, symptom counts reach the ADHD ${presentation} presentation threshold, though ${caveats.join(' and ')}.`,
      )
    }
  } else {
    sentenceParts.push('This form does not reach the ADHD symptom threshold.')
  }

  return {
    instrument,
    timeframe,
    rater,
    label,
    completed: true,
    sentence: sentenceParts.join(' '),
    thresholdMet,
    presentation,
    raterDescriptor,
  }
}

function buildBaarsMasterOverview(
  formSummaries: BaarsMasterFormSummary[],
  draftEntries: Array<[string, BaarsDraftState]>,
): string {
  const subjectName = draftEntries
    .map(([, draft]) => (draft.headerValues.name || '').trim())
    .find(name => name.length > 0)
    ?? (formSummaries.some(summary => summary.rater === 'observer') ? 'The rated person' : 'The respondent')
  const age = draftEntries
    .map(([, draft]) => Number(draft.headerValues.age))
    .find(value => Number.isFinite(value))
  const ageText = typeof age === 'number' ? `, a ${age}-year-old,` : ''
  const observerSources = Array.from(
    new Set(
      formSummaries
        .map(summary => summary.raterDescriptor)
        .filter((value): value is string => Boolean(value)),
    ),
  )
  const completedLabels = formSummaries.filter(summary => summary.completed).map(summary => summary.label)
  const draftLabels = formSummaries.filter(summary => !summary.completed).map(summary => summary.label)
  const sentences = [
    `${subjectName}${ageText} has BAARS-IV data across the available self-report and observer forms.`,
  ]

  if (observerSources.length > 0) {
    sentences.push(`Collateral input in this session comes from ${formatReportList(observerSources)}.`)
  }
  if (completedLabels.length > 0) {
    sentences.push(`Completed forms: ${formatReportList(completedLabels)}.`)
  }
  if (draftLabels.length > 0) {
    sentences.push(`Forms still in progress: ${formatReportList(draftLabels)}.`)
  }

  return sentences.join(' ')
}

function buildBaarsMasterTimeframeParagraph(
  prefix: string,
  formSummaries: BaarsMasterFormSummary[],
): string | null {
  if (formSummaries.length === 0) return null
  return `${prefix}: ${formSummaries.map(summary => summary.sentence).join(' ')}`
}

function buildBaarsConcordanceSentence(
  label: string,
  selfSummary: BaarsMasterFormSummary | undefined,
  observerSummary: BaarsMasterFormSummary | undefined,
): string | null {
  if (!selfSummary || !observerSummary) return null
  if (selfSummary.thresholdMet === null || observerSummary.thresholdMet === null) return null

  if (selfSummary.thresholdMet === observerSummary.thresholdMet) {
    if (!selfSummary.thresholdMet) {
      return `${label} self- and observer ratings are concordant in remaining below the ADHD symptom threshold.`
    }

    if (
      selfSummary.presentation &&
      observerSummary.presentation &&
      selfSummary.presentation === observerSummary.presentation
    ) {
      return `${label} self- and observer ratings are concordant for an ADHD ${selfSummary.presentation} presentation pattern.`
    }

    return `${label} self- and observer ratings are directionally concordant for clinically significant ADHD symptom elevation.`
  }

  return `${label} self- and observer ratings are not fully concordant, so cross-informant interpretation remains mixed.`
}

function buildBaarsMasterIntegratedImpression(formSummaries: BaarsMasterFormSummary[]): string {
  const completed = formSummaries.filter(summary => summary.completed)
  if (completed.length === 0) {
    return 'Integrated impression: No BAARS form is complete enough yet for score-based interpretation. Finish at least one form to generate an integrated clinical summary.'
  }

  const currentCompleted = completed.filter(summary => summary.timeframe === 'current')
  const childhoodCompleted = completed.filter(summary => summary.timeframe === 'childhood')
  const currentThresholdMet = currentCompleted.filter(summary => summary.thresholdMet === true)
  const childhoodThresholdMet = childhoodCompleted.filter(summary => summary.thresholdMet === true)
  const currentSelf = currentCompleted.find(summary => summary.rater === 'self')
  const currentObserver = currentCompleted.find(summary => summary.rater === 'observer')
  const childhoodSelf = childhoodCompleted.find(summary => summary.rater === 'self')
  const childhoodObserver = childhoodCompleted.find(summary => summary.rater === 'observer')
  const sentences: string[] = []

  if (currentThresholdMet.length > 0 && childhoodThresholdMet.length > 0) {
    sentences.push('Completed BAARS data show elevated ADHD symptoms in both current and retrospective childhood timeframes, supporting a persistent developmental pattern on screening.')
  } else if (currentThresholdMet.length > 0) {
    sentences.push(
      childhoodCompleted.length > 0
        ? 'Completed BAARS data show elevated current ADHD symptoms, while retrospective childhood threshold evidence is not established on the completed forms.'
        : 'Completed BAARS data show elevated current ADHD symptoms, while retrospective childhood forms are not yet complete.',
    )
  } else if (childhoodThresholdMet.length > 0) {
    sentences.push(
      currentCompleted.length > 0
        ? 'Completed BAARS data support retrospective childhood ADHD symptom elevation, while current adult threshold evidence is not established on the completed forms.'
        : 'Completed BAARS data support retrospective childhood ADHD symptom elevation, while current adult forms are not yet complete.',
    )
  } else {
    sentences.push('Completed BAARS forms do not currently reach ADHD symptom thresholds across the available timeframes.')
  }

  const currentConcordance = buildBaarsConcordanceSentence('Current', currentSelf, currentObserver)
  if (currentConcordance) sentences.push(currentConcordance)

  const childhoodConcordance = buildBaarsConcordanceSentence('Childhood', childhoodSelf, childhoodObserver)
  if (childhoodConcordance) sentences.push(childhoodConcordance)

  if (formSummaries.some(summary => !summary.completed)) {
    sentences.push('Some BAARS forms remain in progress, so the integrated cross-informant picture is still provisional.')
  }

  sentences.push('These findings should be interpreted alongside clinical interview, developmental history, collateral information, and differential diagnosis.')

  return `Integrated impression: ${sentences.join(' ')}`
}

function buildBaarsMasterSummary(
  adhdCriteria: BaarsAdhdCriteriaMeta,
  draftEntries: Array<[string, BaarsDraftState]>,
): string | null {
  const draftMap = new Map(draftEntries)
  const formStates = BAARS_MASTER_SUMMARY_INSTRUMENTS
    .map(instrument => {
      const draft = draftMap.get(instrument.id)
      if (!draft || !hasMeaningfulBaarsDraft(draft)) return null
      return { instrument, draft }
    })
    .filter((value): value is { instrument: InstrumentDefinition; draft: BaarsDraftState } => value !== null)

  if (formStates.length === 0) return null

  const formSummaries = formStates.map(({ instrument, draft }) =>
    buildBaarsMasterFormSummary(adhdCriteria, instrument, draft),
  )
  const currentParagraph = buildBaarsMasterTimeframeParagraph(
    'Current findings',
    formSummaries.filter(summary => summary.timeframe === 'current'),
  )
  const childhoodParagraph = buildBaarsMasterTimeframeParagraph(
    'Childhood findings',
    formSummaries.filter(summary => summary.timeframe === 'childhood'),
  )
  const integratedImpression = buildBaarsMasterIntegratedImpression(formSummaries)

  return [
    'BAARS Master Summary',
    buildBaarsMasterOverview(formSummaries, formStates.map(({ instrument, draft }) => [instrument.id, draft])),
    currentParagraph,
    childhoodParagraph,
    integratedImpression,
  ].filter(Boolean).join('\n\n')
}

// --- Severity color coding ---
const severityColor: Record<string, string> = {
  'Normal': 'text-zinc-400 dark:text-zinc-500',
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
  const prefersReducedMotion = useReducedMotion()
  const initialHeaderValues = useMemo(
    () => buildInitialHeaderValues(instrument.headerFields),
    [instrument.headerFields],
  )
  const initialDraft = useMemo(
    () => readBaarsDraft(instrument.id, instrument.headerFields),
    [instrument.id, instrument.headerFields],
  )
  const [headerValues, setHeaderValues] = useState<Record<string, string>>(
    () => initialDraft?.headerValues ?? initialHeaderValues,
  )
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>(
    () => initialDraft?.answers ?? {},
  )
  const [pronounChoice, setPronounChoice] = useState<PronounChoice>(
    () => initialDraft?.pronounChoice ?? 'they',
  )
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const userExpandedRef = useRef<Set<string>>(new Set())
  const answerHistoryRef = useRef<Array<{ id: string; prev: QuestionValue | undefined }>>([])
  const hasInitializedActiveQuestionRef = useRef(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
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
  const computedScores = useMemo(
    () => computeBaarsScores(instrument, answers, age),
    [instrument, answers, age],
  )

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

  useEffect(() => {
    writeBaarsDraft(instrument.id, instrument.headerFields, headerValues, pronounChoice, answers)
  }, [instrument.id, instrument.headerFields, headerValues, pronounChoice, answers])

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
  const masterDraftEntries = useMemo(() => {
    const otherEntries = getBaarsDraftEntries().filter(([draftInstrumentId]) => draftInstrumentId !== instrument.id)
    otherEntries.push([
      instrument.id,
      {
        headerValues: { ...headerValues },
        answers: cloneDraftAnswers(answers),
        pronounChoice,
      },
    ])
    return otherEntries
  }, [instrument.id, headerValues, answers, pronounChoice])
  const masterNarrative = useMemo(
    () => buildBaarsMasterSummary(adhdCriteria, masterDraftEntries),
    [adhdCriteria, masterDraftEntries],
  )
  const [summaryCopied, setSummaryCopied] = useState(false)
  const [masterCopied, setMasterCopied] = useState(false)

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    symptomQuestionIds[0] ?? null,
  )
  const responseScale = instrument.responseScale ?? []
  const DESKTOP_STICKY_SCALE_TOP = 24
  const DESKTOP_STICKY_SCALE_HEIGHT = 36
  const desktopQuestionScrollMargin = DESKTOP_STICKY_SCALE_TOP + DESKTOP_STICKY_SCALE_HEIGHT + 16

  const setQuestionRef = (questionId: string, element: HTMLDivElement | null) => {
    if (!element) return
    if (element.offsetParent === null) return
    questionRefs.current[questionId] = element
  }

  const pushHistory = useCallback((id: string, prev: QuestionValue | undefined) => {
    const stack = answerHistoryRef.current
    stack.push({ id, prev })
    if (stack.length > 50) stack.shift()
  }, [])

  const selectSymptomAnswer = (questionId: string, value: string) => {
    setAnswers(current => {
      pushHistory(questionId, current[questionId])
      return { ...current, [questionId]: value }
    })
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
    if (!hasInitializedActiveQuestionRef.current) {
      hasInitializedActiveQuestionRef.current = true
      return
    }
    const el = questionRefs.current[activeQuestionId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeQuestionId])

  // Global keydown: 1-4 fills active question then advances; arrows navigate/cycle; cmd+z undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      // Undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !inField) {
        const stack = answerHistoryRef.current
        const last = stack.pop()
        if (last) {
          e.preventDefault()
          setAnswers(c => {
            const next = { ...c }
            if (last.prev === undefined) delete next[last.id]
            else next[last.id] = last.prev
            return next
          })
          setActiveQuestionId(last.id)
        }
        return
      }

      if (!activeQuestionId) return
      if (inField) return

      // 1-4: fill + advance
      if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault()
        setAnswers(c => {
          pushHistory(activeQuestionId, c[activeQuestionId])
          return { ...c, [activeQuestionId]: e.key }
        })
        const idx = symptomQuestionIds.indexOf(activeQuestionId)
        const next = symptomQuestionIds[idx + 1]
        if (next) setTimeout(() => setActiveQuestionId(next), 120)
        return
      }

      // Arrow navigation (no auto-advance)
      const idx = symptomQuestionIds.indexOf(activeQuestionId)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = symptomQuestionIds[idx + 1]
        if (next) setActiveQuestionId(next)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = symptomQuestionIds[idx - 1]
        if (prev) setActiveQuestionId(prev)
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        setAnswers(c => {
          const cur = typeof c[activeQuestionId] === 'string' ? Number(c[activeQuestionId]) : null
          let nextVal: number
          if (cur === null || Number.isNaN(cur)) {
            nextVal = e.key === 'ArrowRight' ? 1 : 4
          } else {
            nextVal = e.key === 'ArrowRight' ? (cur === 4 ? 1 : cur + 1) : (cur === 1 ? 4 : cur - 1)
          }
          pushHistory(activeQuestionId, c[activeQuestionId])
          return { ...c, [activeQuestionId]: String(nextVal) }
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeQuestionId, symptomQuestionIds, pushHistory])

  const updateHeader = (id: string, value: string) => setHeaderValues(c => ({ ...c, [id]: value }))
  const updateSingleValue = (id: string, value: string) => setAnswers(c => {
    pushHistory(id, c[id])
    return { ...c, [id]: value }
  })
  const updateMultiValue = (id: string, val: string, checked: boolean) => {
    setAnswers(c => {
      pushHistory(id, c[id])
      const existing = Array.isArray(c[id]) ? c[id] : []
      return { ...c, [id]: checked ? [...existing, val] : existing.filter(v => v !== val) }
    })
  }
  const resetDemo = () => {
    clearBaarsDraft(instrument.id)
    setHeaderValues(initialHeaderValues)
    setAnswers({})
    setPronounChoice('they')
    answerHistoryRef.current = []
    setCollapsedSections(new Set())
    userExpandedRef.current = new Set()
  }

  // Auto-collapse fully-answered sections (Item 17)
  useEffect(() => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      let changed = false
      for (const section of symptomSections) {
        if (section.id === activeQuestionId) continue
        const allAnswered = section.questions.every(q => typeof answers[q.id] === 'string' && answers[q.id] !== '')
        const containsActive = section.questions.some(q => q.id === activeQuestionId)
        if (allAnswered && !next.has(section.id) && !userExpandedRef.current.has(section.id) && !containsActive) {
          next.add(section.id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [answers, symptomSections, activeQuestionId])

  const expandSection = (id: string) => {
    userExpandedRef.current.add(id)
    setCollapsedSections(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const scoreTableRows = useMemo(
    () => buildScoreTableRows(instrument, computedScores),
    [instrument, computedScores],
  )

  // Section progress map for collapsed-summary chip + checklist (Item 15, 17)
  const sectionProgress = useMemo(() => {
    return symptomSections.map(section => {
      const answered = section.questions.filter(q => typeof answers[q.id] === 'string' && answers[q.id] !== '').length
      return { id: section.id, title: section.title, answered, total: section.questions.length, complete: answered === section.questions.length }
    })
  }, [symptomSections, answers])

  // Build empty-state checklist when narrative is null (Item 15)
  const requirementsChecklist = useMemo(() => {
    const items: Array<{ label: string; satisfied: boolean }> = []
    items.push({ label: 'Age entered', satisfied: !!headerValues.age && headerValues.age.trim() !== '' })
    sectionProgress.forEach(s => {
      items.push({ label: `${s.title} ${s.answered}/${s.total}`, satisfied: s.complete })
    })
    if (followUpPositive === 'yes') {
      // Q29 onset (current form) or equivalent
      const onsetQ = remainingFollowUpQuestions.find(q => q.type === 'number')
      if (onsetQ) {
        items.push({ label: 'Onset age', satisfied: typeof answers[onsetQ.id] === 'string' && (answers[onsetQ.id] as string).trim() !== '' })
      }
      const settingsQ = remainingFollowUpQuestions.find(q => q.type === 'multi_select')
      if (settingsQ) {
        const sel = answers[settingsQ.id]
        items.push({ label: 'Impairment settings', satisfied: Array.isArray(sel) && sel.length > 0 })
      }
    }
    return items
  }, [headerValues.age, sectionProgress, followUpPositive, remainingFollowUpQuestions, answers])
  const pronounFieldLabel = isBaarsOtherReportInstrument(instrument)
    ? "Rated Person's Pronouns"
    : 'Pronouns'

  const motionSection = (index: number) => prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] as const },
      }

  return (
    <TooltipProvider delayDuration={150}>
    <div>
      {/* --- Header Fields --- */}
      <motion.section {...motionSection(0)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
            Details
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
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map(opt => {
                      const isSelected = headerValues[field.id] === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateHeader(field.id, opt.value)}
                          className={`rounded-md border px-4 py-1.5 text-[12px] transition-all duration-100 cursor-pointer active:scale-[0.97] ${
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
            <Label className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">{pronounFieldLabel}</Label>
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
                    className={`rounded-md border px-3 py-1.5 text-[12px] transition-all duration-100 cursor-pointer active:scale-[0.97] ${
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
      </motion.section>

      {/* --- Progress bar --- */}
      <div className="mt-12 border-t border-zinc-100 dark:border-zinc-800/50 pt-12">
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

      <motion.section {...motionSection(1)} className="mt-24 border-t border-zinc-100 dark:border-zinc-800/50 pt-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Instructions
        </h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {instrument.instructions}
        </p>
      </motion.section>

      {/* --- Symptom Sections --- */}
      {symptomSections.map((section, sIndex) => {
        const progress = sectionProgress.find(p => p.id === section.id)
        const isCollapsed = collapsedSections.has(section.id)
        return (
          <motion.section
            key={section.id}
            layout={!prefersReducedMotion}
            {...motionSection(2 + sIndex)}
            className={cn(
              'border-zinc-100 dark:border-zinc-800/50',
              isCollapsed
                ? 'mt-12'
                : 'mt-24 border-t pt-12',
            )}
          >
            {isCollapsed && (
              <div className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800/70 bg-zinc-50/60 dark:bg-zinc-900/30 px-5 py-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {section.title} <span className="font-mono text-[11px] text-zinc-400 ml-2">{progress?.answered}/{progress?.total}</span>
                </span>
                <button
                  type="button"
                  onClick={() => expandSection(section.id)}
                  className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors active:scale-[0.97]"
                >
                  Edit
                </button>
              </div>
            )}

            {!isCollapsed && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
                    {section.title}
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                    {section.questions.filter(q => typeof answers[q.id] === 'string' && answers[q.id] !== '').length}/{section.questions.length}
                  </p>
                </div>
                <div className="hidden md:block border-y border-zinc-200 dark:border-zinc-800/70">
                    <div
                      className="sticky z-30 grid grid-cols-[minmax(0,1fr)_96px_96px_96px_96px] border-b border-zinc-200 bg-background dark:border-zinc-800/70"
                      style={{ top: DESKTOP_STICKY_SCALE_TOP }}
                    >
                      <div className="min-h-[36px]" />
                      {responseScale.map(opt => (
                        <div
                          key={opt.value}
                          className="flex min-h-[36px] items-center justify-center px-2"
                        >
                          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                            {opt.value}
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
                            style={{ scrollMarginTop: desktopQuestionScrollMargin }}
                            className={cn(
                              'group relative grid grid-cols-[minmax(0,1fr)_96px_96px_96px_96px] items-center border-b border-dashed border-zinc-100 last:border-b-0 dark:border-zinc-900 transition-colors duration-150 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 scroll-mt-28',
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-px bg-zinc-900 dark:bg-zinc-100" />
                            )}
                            <div className="flex items-start gap-3 px-5 py-4">
                              <span className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-300 dark:text-zinc-600">
                                {question.number}.
                              </span>
                              <div className="min-w-0">
                                <p className="text-[13.5px] leading-[1.55] text-zinc-600 dark:text-zinc-300">
                                  {question.prompt}
                                </p>
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
                                    'flex items-center justify-center px-2 py-3 transition-colors duration-100 active:scale-[0.97]',
                                  )}
                                  aria-pressed={isSelected}
                                  aria-label={`Set question ${question.number} to ${opt.label}`}
                                >
                                  <span
                                    className={cn(
                                      'inline-flex min-h-[28px] w-full items-center justify-center rounded-md border px-2 text-[11px] leading-tight transition-all duration-150',
                                      isSelected
                                        ? 'border-zinc-900 text-zinc-900 font-medium dark:border-zinc-100 dark:text-zinc-100'
                                        : 'border-transparent text-zinc-400 hover:border-zinc-200 hover:text-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-800 dark:hover:text-zinc-100',
                                    )}
                                  >
                                    {opt.label}
                                  </span>
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
                          className={cn(
                            'relative rounded-lg transition-all duration-200 ease-out scroll-mt-28',
                            isActive && 'bg-zinc-50 dark:bg-zinc-900/40 -mx-3 px-3 py-3',
                          )}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full origin-top animate-[scaleY_180ms_ease-out]" />
                          )}
                          <div className="mb-3">
                            <span className="block font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mb-1">{question.number}.</span>
                            <span className="block text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{question.prompt}</span>
                          </div>
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
                                  className={cn(
                                    'flex-1 cursor-pointer rounded-md border min-h-[44px] flex items-center justify-center text-center text-[12px] transition-all duration-100 active:scale-[0.97]',
                                    isSelected
                                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400',
                                  )}
                                >
                                  <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} className="sr-only" />
                                  <span className="hidden sm:inline">{opt.label}</span>
                                  <span className="sm:hidden">{SHORT_LABELS[opt.value] ?? opt.value}</span>
                                </label>
                              )
                            })}
                          </RadioGroup>
                        </div>
                      )
                    })}
                  </div>
              </div>
            )}
          </motion.section>
        )
      })}

      {/* --- Follow-Up --- */}
      {followUpSection && (
        <motion.section {...motionSection(symptomSections.length + 2)} className="mt-24 border-t border-zinc-100 dark:border-zinc-800/50 pt-12">
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
                            className={`rounded-md border px-3 py-1.5 text-[12px] transition-all duration-100 cursor-pointer active:scale-[0.97] ${
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
        </motion.section>
      )}

      {/* --- Scores --- */}
      <motion.section {...motionSection(symptomSections.length + 3)} className="mt-24 border-t border-zinc-100 dark:border-zinc-800/50 pt-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-1">
          Scores
        </h2>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-6 flex items-center gap-2">
          <span>
            {ageBand ? `Percentiles using ${ageBand} norms.` : 'Enter age for percentile lookup.'}
            {ageBand && ' Descriptive categories derived from percentile bands: Normal 1-83, Subclinical 84-92, Mild 93-96, Moderate 97-98, High 99+.'}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Norm citation" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                <Info className="h-3 w-3" strokeWidth={1.75} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{BAARS_NORM_CITATION}</TooltipContent>
          </Tooltip>
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
              {scoreTableRows.map(row => (
                <tr key={row.label} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/70">
                  <td className="px-4 py-3 align-top text-sm text-zinc-700 dark:text-zinc-300">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.rawScore ? (
                      row.rawScore.value !== null ? (
                        <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {row.rawScore.value}
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-sm tabular-nums text-zinc-300 dark:text-zinc-600">—</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {row.rawScore.answered}/{row.rawScore.total}
                          </p>
                        </div>
                      )
                    ) : (
                      <span className="text-sm tabular-nums text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    {row.rawScore?.severityLabel ? (
                      <span className={`text-[10px] uppercase tracking-[0.12em] font-medium ${severityColor[row.rawScore.severityLabel] ?? 'text-zinc-500'}`}>
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
                        <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {row.symptomCount.value}/{row.symptomCount.total}
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-sm tabular-nums text-zinc-300 dark:text-zinc-600">—</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {row.symptomCount.answered}/{row.symptomCount.total}
                          </p>
                        </div>
                      )
                    ) : (
                      <span className="text-sm tabular-nums text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* --- Current Form Summary --- */}
      <motion.section {...motionSection(symptomSections.length + 4)} className="mt-24 hidden md:block border-t border-zinc-100 dark:border-zinc-800/50 pt-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Current Form Summary
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
                  setSummaryCopied(true)
                  setTimeout(() => setSummaryCopied(false), 1800)
                }}
                className={cn(
                  'absolute top-3 right-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-transform duration-150 active:scale-95',
                  summaryCopied && 'scale-105',
                )}
              >
                {summaryCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
              Required to generate
            </p>
            <ul className="space-y-1.5">
              {requirementsChecklist.map(item => (
                <li key={item.label} className="flex items-center gap-2 text-[13px]">
                  <span className={cn('font-mono text-base leading-none', item.satisfied ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600')}>
                    {item.satisfied ? '✓' : '○'}
                  </span>
                  <span className={cn(item.satisfied ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500')}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>

      {/* --- Master Summary --- */}
      {masterNarrative && (
        <motion.section {...motionSection(symptomSections.length + 5)} className="mt-24 hidden md:block border-t border-zinc-100 dark:border-zinc-800/50 pt-12">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
            Master Summary
          </h2>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
              <Lock className="h-3 w-3" strokeWidth={1.75} />
              <span>Aggregates saved drafts across all BAARS tabs in this browser session.</span>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={masterNarrative}
                rows={24}
                className="w-full resize-y rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 pr-24 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(masterNarrative)
                  setMasterCopied(true)
                  setTimeout(() => setMasterCopied(false), 1800)
                }}
                className={cn(
                  'absolute top-3 right-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-transform duration-150 active:scale-95',
                  masterCopied && 'scale-105',
                )}
              >
                {masterCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* --- Mobile sticky View Summary (Item 31) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur px-4 py-3">
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              disabled={!narrative && !masterNarrative}
              className="w-full rounded-md border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 text-[12px] font-medium uppercase tracking-[0.12em] disabled:opacity-40 transition-transform active:scale-[0.98]"
            >
              {narrative || masterNarrative ? 'View Summaries' : `Complete (${answeredCount}/${totalLikert})`}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold tracking-tight">BAARS Summaries</SheetTitle>
            </SheetHeader>
            {(narrative || masterNarrative) && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { v: 'she', label: 'She/Her' },
                    { v: 'he', label: 'He/Him' },
                    { v: 'they', label: 'They/Them' },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setPronounChoice(opt.v)}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-[12px] transition-transform active:scale-[0.97]',
                        pronounChoice === opt.v
                          ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                  <Lock className="h-3 w-3" strokeWidth={1.75} />
                  <span>Runs entirely in your browser. No PHI transmitted.</span>
                </div>
                {narrative && (
                  <>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                      Current Form Summary
                    </p>
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
                        setSummaryCopied(true)
                        setTimeout(() => setSummaryCopied(false), 1800)
                      }}
                      className="w-full rounded-md border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 text-[12px] font-medium uppercase tracking-[0.12em] transition-transform active:scale-[0.98]"
                    >
                      {summaryCopied ? 'Copied' : 'Copy Current Form Summary'}
                    </button>
                  </>
                )}
                {masterNarrative && (
                  <>
                    <p className="pt-2 text-[11px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                      Master Summary
                    </p>
                    <textarea
                      readOnly
                      value={masterNarrative}
                      rows={22}
                      className="w-full resize-y rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(masterNarrative)
                        setMasterCopied(true)
                        setTimeout(() => setMasterCopied(false), 1800)
                      }}
                      className="w-full rounded-md border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 text-[12px] font-medium uppercase tracking-[0.12em] transition-transform active:scale-[0.98]"
                    >
                      {masterCopied ? 'Copied' : 'Copy Master Summary'}
                    </button>
                  </>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
    </TooltipProvider>
  )
}
