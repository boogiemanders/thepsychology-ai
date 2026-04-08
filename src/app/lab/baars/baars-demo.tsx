'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function buildInitialHeaderValues(fields: AssessmentField[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((values, field) => {
    if (field.type === 'date') {
      values[field.id] = getTodayDateValue()
    }

    return values
  }, {})
}

function getSeverityLabel(value: number, bands?: AssessmentSeverityBand[]): string | null {
  if (!bands) return null

  for (const band of bands) {
    const max = band.max ?? Number.POSITIVE_INFINITY
    if (value >= band.min && value <= max) {
      return band.label
    }
  }

  return null
}

function buildNarrative(
  scores: ComputedGroupScore[],
  answers: Record<string, QuestionValue>,
  ageText: string | null,
): string | null {
  const totalAdhd = scores.find(score => score.group.id === 'total_adhd_raw')
  const inattention = scores.find(score => score.group.id === 'inattention_raw')
  const hyperactivity = scores.find(score => score.group.id === 'hyperactivity_raw')
  const impulsivity = scores.find(score => score.group.id === 'impulsivity_raw')
  const sct = scores.find(score => score.group.id === 'sct_raw')
  const totalSymptomCount = scores.find(score => score.group.id === 'total_adhd_symptom_count')
  const hyperImpCount = scores.find(score => score.group.id === 'hyperactivity_impulsivity_symptom_count')
  const yesNo = answers.q28
  const onset = answers.q29
  const settings = answers.q30

  if (!totalAdhd?.value || !inattention?.value || !hyperactivity?.value || !impulsivity?.value || !sct?.value || !totalSymptomCount?.value || !hyperImpCount?.value) {
    return null
  }

  const onsetText = typeof onset === 'string' && onset.trim() ? `Reported symptom onset age: ${onset.trim()}.` : 'Symptom onset age not entered.'
  const settingsText = Array.isArray(settings) && settings.length > 0
    ? `Reported impairment settings: ${settings.join(', ')}.`
    : 'No impairment settings selected yet.'
  const followUpText = typeof yesNo === 'string'
    ? `Follow-up item 28: ${yesNo === 'yes' ? 'respondent endorsed symptoms occurring at least often.' : 'respondent did not endorse symptoms occurring at least often.'}`
    : 'Follow-up item 28 has not been answered yet.'
  const percentileText = totalAdhd.percentileBand
    ? `Age-banded percentile interpretation: Total ADHD is in the ${totalAdhd.percentileBand} percentile band${ageText ? ` for ages ${ageText}` : ''}.`
    : ageText
        ? `No percentile band was resolved from the current-symptoms norms for ages ${ageText}.`
        : 'No age was entered, so percentile interpretation is not available yet.'

  return [
    `BAARS-IV self-report demo summary: Total ADHD raw score ${totalAdhd.value}${totalAdhd.severityLabel ? ` (${totalAdhd.severityLabel})` : ''}.`,
    `Subscale pattern: Inattention ${inattention.value}${inattention.severityLabel ? ` (${inattention.severityLabel})` : ''}, Hyperactivity ${hyperactivity.value}${hyperactivity.severityLabel ? ` (${hyperactivity.severityLabel})` : ''}, Impulsivity ${impulsivity.value}${impulsivity.severityLabel ? ` (${impulsivity.severityLabel})` : ''}, and SCT ${sct.value}${sct.severityLabel ? ` (${sct.severityLabel})` : ''}.`,
    `Count of items rated often or very often: ${totalSymptomCount.value} across ADHD items, including ${hyperImpCount.value} across hyperactivity/impulsivity items.`,
    percentileText,
    followUpText,
    onsetText,
    settingsText,
    'This output is a demo summary only and should be interpreted alongside clinical interview, collateral information, and the official scoring materials.',
  ].join(' ')
}

function renderFieldLabel(field: AssessmentField) {
  return (
    <div>
      <Label htmlFor={field.id}>{field.label}</Label>
      {field.helpText && <p className="mt-1 text-[12px] text-zinc-400 dark:text-zinc-500">{field.helpText}</p>}
    </div>
  )
}

function renderQuestionMeta(question: AssessmentQuestion) {
  return (
    <div className="mb-3">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {question.number}. {question.prompt}
      </p>
      {question.helpText && (
        <p className="mt-1 text-[12px] text-zinc-400 dark:text-zinc-500">{question.helpText}</p>
      )}
    </div>
  )
}

export function BaarsDemo({ instrument }: { instrument: InstrumentDefinition }) {
  const [headerValues, setHeaderValues] = useState<Record<string, string>>(
    () => buildInitialHeaderValues(instrument.headerFields),
  )
  const [answers, setAnswers] = useState<Record<string, QuestionValue>>({})
  const ageValue = Number(headerValues.age)
  const age = Number.isFinite(ageValue) ? ageValue : null
  const ageBand = age !== null ? getBaarsAgeBand(age) : null

  const symptomSections = instrument.sections.filter(section => section.id !== 'follow_up')
  const followUpSection = instrument.sections.find(section => section.id === 'follow_up')
  const totalQuestions = instrument.sections.reduce((sum, section) => sum + section.questions.length, 0)
  const answeredLikertQuestions = symptomSections.reduce((sum, section) => {
    return sum + section.questions.filter(question => typeof answers[question.id] === 'string' && answers[question.id] !== '').length
  }, 0)
  const totalLikertQuestions = symptomSections.reduce((sum, section) => sum + section.questions.length, 0)

  const computedScores: ComputedGroupScore[] = instrument.scoringGroups.map(group => {
    const numericAnswers = group.questionIds
      .map(questionId => answers[questionId])
      .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
      .map(value => Number(value))
      .filter(value => Number.isFinite(value))

    if (numericAnswers.length !== group.questionIds.length) {
      return {
        group,
        value: null,
        answered: numericAnswers.length,
        total: group.questionIds.length,
        severityLabel: null,
        percentileBand: null,
      }
    }

    const value = group.scoringType === 'raw_sum'
      ? numericAnswers.reduce((sum, current) => sum + current, 0)
      : numericAnswers.filter(current => current >= (group.positiveThresholdValue ?? Number.POSITIVE_INFINITY)).length
    const percentileBand = group.scoringType === 'raw_sum' && age !== null
      ? lookupBaarsCurrentPercentile(group.id, value, age)
      : null

    return {
      group,
      value,
      answered: numericAnswers.length,
      total: group.questionIds.length,
      severityLabel: getSeverityLabel(value, group.severityBands),
      percentileBand,
    }
  })

  const narrative = buildNarrative(computedScores, answers, ageBand)

  const updateHeader = (fieldId: string, value: string) => {
    setHeaderValues(current => ({ ...current, [fieldId]: value }))
  }

  const updateSingleValue = (questionId: string, value: string) => {
    setAnswers(current => ({ ...current, [questionId]: value }))
  }

  const updateMultiValue = (questionId: string, optionValue: string, checked: boolean) => {
    setAnswers(current => {
      const existing = Array.isArray(current[questionId]) ? current[questionId] : []
      const next = checked
        ? [...existing, optionValue]
        : existing.filter(value => value !== optionValue)

      return { ...current, [questionId]: next }
    })
  }

  const resetDemo = () => {
    setHeaderValues(buildInitialHeaderValues(instrument.headerFields))
    setAnswers({})
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>BAARS Demo Form</CardTitle>
          <CardDescription>
            Source-backed local demo for the BAARS-IV self-report current symptoms form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">Respondent</p>
              <p>{instrument.respondentType}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">Likert Completion</p>
              <p>{answeredLikertQuestions} / {totalLikertQuestions}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">Total Questions</p>
              <p>{totalQuestions}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">Scoring Mode</p>
              <p>Local only</p>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-3">
              Instructions
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {instrument.instructions}
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={resetDemo}>
              Reset Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Header Fields</CardTitle>
          <CardDescription>Basic respondent metadata from the first page of the form.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {instrument.headerFields.map(field => {
            if (field.type === 'single_select' && field.options) {
              return (
                <div key={field.id} className="space-y-3">
                  {renderFieldLabel(field)}
                  <RadioGroup
                    value={headerValues[field.id] ?? ''}
                    onValueChange={(value) => updateHeader(field.id, value)}
                    className="gap-2"
                  >
                    {field.options.map(option => (
                      <div key={option.value} className="flex items-center gap-2">
                        <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                        <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )
            }

            return (
              <div key={field.id} className="space-y-3">
                {renderFieldLabel(field)}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    id={field.id}
                    type={field.type === 'number' ? 'number' : field.type}
                    value={headerValues[field.id] ?? ''}
                    onChange={(event) => updateHeader(field.id, event.target.value)}
                  />
                  {field.type === 'date' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => updateHeader(field.id, getTodayDateValue())}
                      className="sm:w-auto"
                    >
                      Use Today
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {symptomSections.map(section => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>
              {section.questions.filter(question => typeof answers[question.id] === 'string' && answers[question.id] !== '').length} of {section.questions.length} answered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.questions.map(question => (
              <div key={question.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                {renderQuestionMeta(question)}
                <RadioGroup
                  value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
                  onValueChange={(value) => updateSingleValue(question.id, value)}
                  className="gap-3 md:grid-cols-4"
                >
                  {instrument.responseScale?.map(option => (
                    <div key={option.value} className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                      <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                      <Label htmlFor={`${question.id}-${option.value}`} className="cursor-pointer">
                        <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 mr-2">{option.value}</span>
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {followUpSection && (
        <Card>
          <CardHeader>
            <CardTitle>{followUpSection.title}</CardTitle>
            <CardDescription>Additional follow-up items from page 3 of the form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {followUpSection.questions.map(question => {
              if (question.type === 'single_select' && question.options) {
                return (
                  <div key={question.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                    {renderQuestionMeta(question)}
                    <RadioGroup
                      value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
                      onValueChange={(value) => updateSingleValue(question.id, value)}
                      className="gap-2"
                    >
                      {question.options.map(option => (
                        <div key={option.value} className="flex items-center gap-2">
                          <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                          <Label htmlFor={`${question.id}-${option.value}`}>{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )
              }

              if (question.type === 'multi_select' && question.options) {
                const selectedValues = Array.isArray(answers[question.id]) ? answers[question.id] : []
                return (
                  <div key={question.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                    {renderQuestionMeta(question)}
                    <div className="space-y-3">
                      {question.options.map(option => {
                        const checked = selectedValues.includes(option.value)

                        return (
                          <div key={option.value} className="flex items-center gap-3">
                            <Checkbox
                              id={`${question.id}-${option.value}`}
                              checked={checked}
                              onCheckedChange={(nextChecked) => updateMultiValue(question.id, option.value, nextChecked === true)}
                            />
                            <Label htmlFor={`${question.id}-${option.value}`}>{option.label}</Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              return (
                <div key={question.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                  {renderQuestionMeta(question)}
                  <Input
                    id={question.id}
                    type={question.type === 'number' ? 'number' : 'text'}
                    value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
                    onChange={(event) => updateSingleValue(question.id, event.target.value)}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Live Scores</CardTitle>
          <CardDescription>
            Scores calculate when all questions required for that group have been answered.
            {ageBand && ` Percentile lookup is using the ${ageBand} norms band.`}
            {!ageBand && age !== null && ' Percentile lookup is only available for ages 18-89.'}
            {age !== null && age > 39 && ' Severity labels in the local scorer workbook are normed only for ages 18-39.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {computedScores.map(score => (
            <div key={score.group.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{score.group.label}</p>
                  <p className="mt-1 text-[12px] text-zinc-400 dark:text-zinc-500">
                    {score.value === null
                      ? `${score.answered}/${score.total} required responses entered`
                      : score.group.scoringType === 'raw_sum'
                          ? `Raw sum across ${score.total} items`
                          : `Count of items scored at or above ${score.group.positiveThresholdValue}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {score.value ?? '—'}
                  </p>
                  {score.severityLabel && (
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{score.severityLabel}</p>
                  )}
                  {score.percentileBand && (
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                      {score.percentileBand} percentile band
                    </p>
                  )}
                </div>
              </div>
              {score.group.note && (
                <p className="mt-2 text-[12px] text-zinc-400 dark:text-zinc-500">{score.group.note}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deterministic Summary</CardTitle>
          <CardDescription>
            Template-based narrative from the local demo state.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {narrative ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{narrative}</p>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 leading-relaxed">
              Complete all symptom items to generate the demo summary. Follow-up items enrich the narrative but are not required for raw scoring groups.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
