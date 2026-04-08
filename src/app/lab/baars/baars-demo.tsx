'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getBaarsAgeBand, lookupBaarsCurrentPercentile } from './baars-config'
import type {
  AssessmentField,
  AssessmentQuestion,
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

function deriveQ28(answers: Record<string, QuestionValue>): 'yes' | 'no' | null {
  const symptomIds = Array.from({ length: 27 }, (_, i) => `q${i + 1}`)
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

function buildNarrative(
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  ageBand: string | null,
  header: Record<string, string>,
  pronounChoice: 'she' | 'he' | 'they',
): string | null {
  const totalAdhd = scores.find(s => s.group.id === 'total_adhd_raw')
  const inattention = scores.find(s => s.group.id === 'inattention_raw')
  const hyperactivity = scores.find(s => s.group.id === 'hyperactivity_raw')
  const impulsivity = scores.find(s => s.group.id === 'impulsivity_raw')
  const sct = scores.find(s => s.group.id === 'sct_raw')
  const totalSymptomCount = scores.find(s => s.group.id === 'total_adhd_symptom_count')
  const hyperImpCount = scores.find(s => s.group.id === 'hyperactivity_impulsivity_symptom_count')
  const inattCount = scores.find(s => s.group.id === 'inattention_symptom_count')
  const yesNo = deriveQ28(answers)
  const onset = answers.q29
  const settings = answers.q30

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
    return s.percentileBand ? `${base}, ${s.percentileBand}th percentile` : base
  }

  // Paragraph 1: header
  const intro = `${name}${demographic ? `, a ${demographic},` : ''} completed the BAARS-IV Self-Report (Current Symptoms) on ${header.date || 'today'}.${ageBand ? ` Raw scores were compared against the ${ageBand} age band.` : ''}`

  // Paragraph 2: subscales
  const subscales = `On the symptom items, ${pronounLower} obtained the following subscale raw scores: Inattention (${fmt(inattention)}); Hyperactivity (${fmt(hyperactivity)}); Impulsivity (${fmt(impulsivity)}); and Sluggish Cognitive Tempo (${fmt(sct)}). ${possessive} Total ADHD raw score was ${fmt(totalAdhd)}.`

  // Paragraph 3: symptom counts
  const counts = `At the DSM symptom-count threshold (items rated "Often" or "Very Often"), ${pronounLower} endorsed ${inattCount?.value ?? 0}/9 inattention symptoms and ${hyperImpCount.value}/9 hyperactivity-impulsivity symptoms (${totalSymptomCount.value}/18 total).`

  // Paragraph 4: follow-up
  const followUpParts: string[] = []
  if (yesNo === 'yes') {
    followUpParts.push(`${pronoun} endorsed experiencing at least one symptom at an "Often" frequency or higher.`)
    if (typeof onset === 'string' && onset.trim()) {
      followUpParts.push(`Reported age of symptom onset: ${onset.trim()}.`)
    }
    if (Array.isArray(settings) && settings.length > 0) {
      followUpParts.push(`Impairment was reported in the following settings: ${settings.join(', ')}.`)
    }
  } else if (yesNo === 'no') {
    followUpParts.push(`${pronoun} did not endorse any symptoms at an "Often" frequency or higher.`)
  }
  const followUp = followUpParts.join(' ')

  // Paragraph 5: interpretation footer
  const footer = 'Results should be interpreted in the context of clinical interview, developmental history, and collateral information.'

  return [intro, subscales, counts, followUp, footer].filter(Boolean).join('\n\n')
}

// --- Severity color coding ---
const severityColor: Record<string, string> = {
  'Subclinical': 'text-zinc-500 dark:text-zinc-400',
  'Mild': 'text-amber-600 dark:text-amber-400',
  'Moderate': 'text-orange-600 dark:text-orange-400',
  'High': 'text-red-600 dark:text-red-400',
}

export function BaarsDemo({ instrument }: { instrument: InstrumentDefinition }) {
  const [headerValues, setHeaderValues] = useState<Record<string, string>>(
    () => buildInitialHeaderValues(instrument.headerFields),
  )
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({})
  const ageValue = Number(headerValues.age)
  const age = Number.isFinite(ageValue) ? ageValue : null
  const ageBand = age !== null ? getBaarsAgeBand(age) : null

  const symptomSections = instrument.sections.filter(s => s.id !== 'follow_up')
  const followUpSection = instrument.sections.find(s => s.id === 'follow_up')

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
      ? lookupBaarsCurrentPercentile(group.id, value, age)
      : null

    return { group, value, answered: numericAnswers.length, total: group.questionIds.length, severityLabel: getSeverityLabel(value, group.severityBands), percentileBand }
  })

  const derivedQ28 = deriveQ28(answers)
  const followUpsDisabled = derivedQ28 !== 'yes'

  // Clear stale q29/q30 values if the derived Q28 flips to "no"
  useEffect(() => {
    if (derivedQ28 === 'no') {
      setAnswers(c => {
        if (c.q29 === undefined && c.q30 === undefined) return c
        const next = { ...c }
        delete next.q29
        delete next.q30
        return next
      })
    }
  }, [derivedQ28])

  const [pronounChoice, setPronounChoice] = useState<'she' | 'he' | 'they'>('they')
  const narrative = buildNarrative(computedScores, answers, ageBand, headerValues, pronounChoice)
  const [copied, setCopied] = useState(false)

  // Flat ordered list of symptom question ids for keyboard nav + auto-advance
  const symptomQuestionIds = useMemo(
    () => symptomSections.flatMap(s => s.questions.map(q => q.id)),
    [symptomSections],
  )
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    symptomQuestionIds[0] ?? null,
  )

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

  // Separate raw-sum scores from symptom counts for display
  const rawSumScores = computedScores.filter(s => s.group.scoringType === 'raw_sum')
  const symptomCountScores = computedScores.filter(s => s.group.scoringType === 'count_at_or_above')

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
              </div>
            )
          })}
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
          <div className="space-y-5">
            {section.questions.map(question => {
              const isActive = activeQuestionId === question.id
              return (
              <div
                key={question.id}
                ref={el => { questionRefs.current[question.id] = el }}
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
                  onValueChange={v => updateSingleValue(question.id, v)}
                  className="flex gap-1"
                >
                  {instrument.responseScale?.map(opt => {
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
            <div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mr-2">28.</span>
                Experienced any symptom at &ldquo;Often&rdquo; or higher?
              </p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {derivedQ28 === null ? '\u2014' : derivedQ28 === 'yes' ? 'Yes' : 'No'}
                <span className="ml-2 text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                  Auto-filled from items 1&ndash;27
                </span>
              </p>
            </div>

            {followUpSection.questions.filter(q => q.id !== 'q28').map(question => {
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

        {/* Raw sum scores */}
        <div className="mb-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-3">
            Raw Scores
          </p>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {rawSumScores.map(score => (
              <div key={score.group.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{score.group.label.replace(' Raw Score', '')}</p>
                  {score.value === null && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {score.answered}/{score.total} items
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {score.value ?? '\u2014'}
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    {score.severityLabel && (
                      <p className={`text-[11px] font-medium ${severityColor[score.severityLabel] ?? 'text-zinc-500'}`}>
                        {score.severityLabel}
                      </p>
                    )}
                    {score.percentileBand && (
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {score.percentileBand}%ile
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Symptom counts */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-3">
            Symptom Counts (Often+)
          </p>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {symptomCountScores.map(score => (
              <div key={score.group.id} className="flex items-center justify-between py-3">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {score.group.label.replace(' Symptom Count', '')}
                </p>
                <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {score.value !== null ? `${score.value}/${score.total}` : '\u2014'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Clinical Summary --- */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
            Clinical Summary
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Pronouns
            </span>
            <div className="flex gap-1">
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
                    className={`rounded-md border px-2.5 py-1 text-[11px] transition-all duration-150 cursor-pointer ${
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
