import {
  DiagnosticImpression,
  IntakeData,
  ProviderPreferences,
  SessionTranscript,
  SoapDraft,
  TreatmentPlanData,
  EMPTY_SOAP_DRAFT,
} from './types'

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function splitLines(value: string): string[] {
  return value
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []

  for (const value of values) {
    const key = value.toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }

  return output
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function sentence(value: string): string {
  const trimmed = normalizeWhitespace(value).replace(/[.]+$/, '')
  return trimmed ? `${trimmed}.` : ''
}

function buildTranscriptText(transcript: SessionTranscript | null): string {
  if (!transcript?.entries.length) return ''

  return transcript.entries
    .map((entry) => `${entry.speaker}: ${entry.text}`)
    .join('\n')
}

function buildKeywordSet(value: string): string[] {
  return unique(
    normalizeWhitespace(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4)
      .filter((word) => ![
        'goal',
        'objective',
        'with',
        'from',
        'that',
        'this',
        'have',
        'been',
        'were',
        'will',
        'client',
        'session',
      ].includes(word))
  )
}

function findRelevantLines(lines: string[], sources: string[], limit = 2): string[] {
  const keywords = unique(sources.flatMap((source) => buildKeywordSet(source)))
  if (!keywords.length) return []

  const matches = lines.filter((line) => {
    const lower = line.toLowerCase()
    return keywords.some((keyword) => lower.includes(keyword))
  })

  return unique(matches).slice(0, limit)
}

function summarizeSubjective(
  sessionLines: string[],
  transcript: SessionTranscript | null,
  intake: IntakeData | null
): string {
  const clientTranscriptLines = transcript?.entries
    .filter((entry) => entry.speaker === 'client')
    .map((entry) => normalizeWhitespace(entry.text))
    .filter(Boolean) ?? []

  const primary = unique([
    ...sessionLines.filter((line) => !/\b(mse|appearance|affect|speech|thought|oriented|a&o|objective)\b/i.test(line)),
    ...clientTranscriptLines,
  ]).slice(0, 4)

  if (primary.length) {
    return primary.map((line) => sentence(line)).join(' ')
  }

  const fallback = [
    firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems),
    intake?.historyOfPresentIllness ?? '',
  ]
    .map((value) => sentence(value))
    .filter(Boolean)

  return fallback.join(' ') || 'Client self-report was documented in session notes; clinician should review and refine subjective details before submission.'
}

function summarizeObjective(
  sessionLines: string[],
  intake: IntakeData | null
): string {
  const observationLines = unique([
    ...sessionLines.filter((line) => /\b(mse|appearance|affect|speech|behavior|thought|oriented|a&o|observed|presented|engaged|tearful|anxious|calm|guarded)\b/i.test(line)),
    ...sessionLines.filter((line) => /\b(phq|gad|score|screen|assessment)\b/i.test(line)),
  ]).slice(0, 4)

  const measurementLines: string[] = []
  if (sessionLines.some((line) => /\bphq\b/i.test(line)) && intake?.phq9) {
    measurementLines.push(`PHQ-9 previously captured at ${intake.phq9.totalScore}/27 (${intake.phq9.severity}).`)
  }
  if (sessionLines.some((line) => /\bgad\b/i.test(line)) && intake?.gad7) {
    measurementLines.push(`GAD-7 previously captured at ${intake.gad7.totalScore}/21 (${intake.gad7.severity}).`)
  }

  const combined = unique([
    ...observationLines.map((line) => sentence(line)),
    ...measurementLines,
  ])

  if (combined.length) {
    return combined.join(' ')
  }

  return 'Client was seen for a psychotherapy follow-up session. Formal MSE details were not fully documented in the source notes; clinician should review appearance, affect, speech, thought process, orientation, insight, and judgment before final submission.'
}

function inferGoalStatus(goal: TreatmentPlanData['goals'][number], evidence: string[]): string {
  const source = evidence.join(' ').toLowerCase()
  if (/\b(improved|better|reduced|less|increased insight|progress)\b/.test(source)) {
    return 'Some progress noted'
  }
  if (/\b(worse|escalat|continued conflict|ongoing|persistent|no change)\b/.test(source)) {
    return 'Ongoing symptoms/issues remain present'
  }
  if (goal.status.trim()) return goal.status.trim()
  return 'Progress remains under review'
}

function summarizeAssessment(
  sessionLines: string[],
  treatmentPlan: TreatmentPlanData | null,
  diagnosticImpressions: DiagnosticImpression[],
  intake: IntakeData | null
): string {
  const parts: string[] = []

  if (treatmentPlan?.goals.length) {
    for (const goal of treatmentPlan.goals) {
      const evidence = findRelevantLines(
        sessionLines,
        [
          goal.goal,
          ...goal.objectives.map((objective) => objective.objective),
        ],
        2
      )

      const status = inferGoalStatus(goal, evidence)
      const evidenceText = evidence.length
        ? `Session evidence: ${evidence.map((line) => sentence(line)).join(' ')}`
        : 'Session content was reviewed in relation to this treatment goal.'

      parts.push(
        `Goal ${goal.goalNumber} (${goal.goal}): ${status}. ${evidenceText}`
      )
    }
  }

  const diagnosisSummary = diagnosticImpressions.length
    ? diagnosticImpressions.map((impression) => `${impression.name}${impression.code ? ` (${impression.code})` : ''}`).join(', ')
    : treatmentPlan?.diagnoses.length
      ? treatmentPlan.diagnoses.map((diagnosis) => `${diagnosis.description}${diagnosis.code ? ` (${diagnosis.code})` : ''}`).join(', ')
      : ''

  if (diagnosisSummary) {
    parts.push(`Diagnostic focus remains consistent with current working diagnoses: ${diagnosisSummary}.`)
  } else if (firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems)) {
    parts.push(`Clinical focus remains on ${firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems)}.`)
  }

  return parts.join('\n\n') || 'Assessment should be updated in relation to the captured treatment plan and current session notes.'
}

function summarizePlan(
  sessionLines: string[],
  treatmentPlan: TreatmentPlanData | null
): string {
  const nextStepLines = unique(
    sessionLines.filter((line) => /\b(homework|practice|plan|next session|next week|track|journal|log|monitor|referral|follow up|follow-up)\b/i.test(line))
  ).slice(0, 4)

  const objectiveLines = treatmentPlan?.goals
    .flatMap((goal) => goal.objectives.slice(0, 2))
    .slice(0, 3)
    .map((objective) => `Continue work on ${objective.id}: ${objective.objective}.`) ?? []

  const interventionLine = treatmentPlan?.interventions.length
    ? `Continue interventions including ${treatmentPlan.interventions.slice(0, 3).join(', ')}.`
    : ''

  const frequencyLine = treatmentPlan?.treatmentFrequency
    ? `Continue ${treatmentPlan.treatmentFrequency} psychotherapy.`
    : ''

  const parts = unique([
    ...nextStepLines.map((line) => sentence(line)),
    ...objectiveLines,
    interventionLine,
    frequencyLine,
  ].filter(Boolean))

  return parts.join(' ') || 'Continue psychotherapy per treatment plan and review next-session focus, homework, and referrals before submission.'
}

function extractTreatmentPlanId(treatmentPlan: TreatmentPlanData | null): string {
  const sourceUrl = treatmentPlan?.sourceUrl ?? ''
  const match = sourceUrl.match(/diagnosis_treatment_plans\/([^/?#]+)/)
  return match?.[1] ?? ''
}

export function buildSoapDraft(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlanData | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  prefs: ProviderPreferences,
  meta: {
    apptId?: string
    clientName?: string
    sessionDate?: string
  } = {}
): SoapDraft {
  const sessionLines = splitLines(sessionNotes)
  const transcriptText = buildTranscriptText(transcript)
  const clientName = firstNonEmpty(
    meta.clientName,
    intake?.fullName,
    `${intake?.firstName ?? ''} ${intake?.lastName ?? ''}`.trim(),
    'Client'
  )
  const sessionDate = firstNonEmpty(
    meta.sessionDate,
    intake?.formDate,
    new Date().toLocaleDateString('en-US')
  )
  const now = new Date().toISOString()

  return {
    ...EMPTY_SOAP_DRAFT,
    apptId: meta.apptId ?? '',
    clientName,
    sessionDate,
    cptCode: prefs.followUpCPT || '90837',
    subjective: summarizeSubjective(sessionLines, transcript, intake),
    objective: summarizeObjective(sessionLines, intake),
    assessment: summarizeAssessment(sessionLines, treatmentPlan, diagnosticImpressions, intake),
    plan: summarizePlan(sessionLines, treatmentPlan),
    sessionNotes: sessionNotes.trim(),
    transcript: transcriptText,
    treatmentPlanId: extractTreatmentPlanId(treatmentPlan),
    generatedAt: now,
    editedAt: now,
    status: 'draft',
  }
}
