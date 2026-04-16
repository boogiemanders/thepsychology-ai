/**
 * Generic SOAP skeleton fallback.
 *
 * This module is ONLY used when both OpenAI and Ollama are unavailable.
 * It intentionally produces a minimal, neutral skeleton — NOT a generated
 * clinical narrative — so no prior-patient content can ever leak into a
 * different patient's note. The clinician is expected to edit this manually
 * or retry with a working LLM backend.
 *
 * Only uses per-patient data that was already scoped to this session:
 *   - intake.chiefComplaint / presentingProblems
 *   - treatmentPlan.goals / interventions / frequency
 *   - diagnosticImpressions
 *   - sessionNotes (clinician's typed notes this session)
 *   - transcript (this session's captions)
 *
 * No regex pattern matching against transcript text. No hardcoded patient
 * stories. No cross-session keyword bleed.
 */

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

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function buildTranscriptText(transcript: SessionTranscript | null): string {
  if (!transcript?.entries.length) return ''
  return transcript.entries
    .map((entry) => `${entry.speaker}: ${entry.text}`)
    .join('\n')
}

function extractTreatmentPlanId(treatmentPlan: TreatmentPlanData | null): string {
  const sourceUrl = treatmentPlan?.sourceUrl ?? ''
  const match = sourceUrl.match(/diagnosis_treatment_plans\/([^/?#]+)/)
  return match?.[1] ?? ''
}

const FALLBACK_NOTICE =
  '[LLM unavailable — this is a skeleton draft. Edit manually before submitting.]'

function buildSubjective(sessionNotes: string, intake: IntakeData | null): string {
  const parts: string[] = [FALLBACK_NOTICE]

  const notes = sessionNotes.trim()
  if (notes) {
    parts.push(`Clinician session notes (verbatim):\n${notes}`)
  }

  const chief = firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems)
  if (chief) {
    parts.push(`Chief complaint (from intake): ${normalizeWhitespace(chief)}.`)
  }

  if (!notes && !chief) {
    parts.push('No session notes or intake chief complaint captured. Add manually.')
  }

  return parts.join('\n\n')
}

function buildObjective(
  transcript: SessionTranscript | null,
  intake: IntakeData | null
): string {
  const parts: string[] = []

  const transcriptLineCount = transcript?.entries.length ?? 0
  if (transcriptLineCount > 0) {
    parts.push(
      `Session transcript captured (${transcriptLineCount} caption lines). LLM synthesis unavailable — review transcript manually.`
    )
  } else {
    parts.push('No session transcript or formal MSE documented. Add manually.')
  }

  const measurementLines: string[] = []
  if (intake?.phq9) {
    measurementLines.push(`PHQ-9 (intake): ${intake.phq9.totalScore}/27 — ${intake.phq9.severity}`)
  }
  if (intake?.gad7) {
    measurementLines.push(`GAD-7 (intake): ${intake.gad7.totalScore}/21 — ${intake.gad7.severity}`)
  }
  if (measurementLines.length) {
    parts.push(measurementLines.join('\n'))
  }

  parts.push(
    'Mental Status Exam:\nAppearance: \nBehavior: \nSpeech: \nMood/Affect: \nThoughts: \nCognition: \nInsight/Judgment: '
  )

  return parts.join('\n\n')
}

function buildAssessment(
  treatmentPlan: TreatmentPlanData | null,
  diagnosticImpressions: DiagnosticImpression[],
  intake: IntakeData | null
): string {
  const parts: string[] = []

  const diagnosisList = diagnosticImpressions.length
    ? diagnosticImpressions
        .map((d) => `${d.name}${d.code ? ` (${d.code})` : ''}`)
        .join(', ')
    : (treatmentPlan?.diagnoses ?? [])
        .map((d) => `${d.description}${d.code ? ` (${d.code})` : ''}`)
        .join(', ')

  if (diagnosisList) {
    parts.push(`Active diagnoses: ${diagnosisList}.`)
  }

  if (treatmentPlan?.goals?.length) {
    const goalLines = treatmentPlan.goals.map(
      (goal) => `- Goal ${goal.goalNumber}: ${normalizeWhitespace(goal.goal)} (status: ${goal.status || 'active'})`
    )
    parts.push(`Treatment plan goals under review:\n${goalLines.join('\n')}`)
  }

  const chief = firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems)
  if (chief && !diagnosisList) {
    parts.push(`Clinical focus: ${normalizeWhitespace(chief)}.`)
  }

  parts.push(
    'Clinical synthesis, symptom trajectory, medical necessity, and protective/risk factors need manual completion.'
  )

  return parts.join('\n\n')
}

function buildPlan(treatmentPlan: TreatmentPlanData | null): string {
  const items: string[] = []

  if (treatmentPlan?.treatmentFrequency) {
    items.push(`Continue ${treatmentPlan.treatmentFrequency} psychotherapy.`)
  } else {
    items.push('Continue psychotherapy as scheduled.')
  }

  if (treatmentPlan?.interventions?.length) {
    const summary = treatmentPlan.interventions
      .map((x) => normalizeWhitespace(x))
      .filter(Boolean)
      .join('; ')
    if (summary) items.push(`Continue interventions: ${summary}.`)
  }

  items.push('Add session-specific focus, homework, and next appointment manually.')

  return items.join(' ')
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
    subjective: buildSubjective(sessionNotes, intake),
    objective: buildObjective(transcript, intake),
    assessment: buildAssessment(treatmentPlan, diagnosticImpressions, intake),
    plan: buildPlan(treatmentPlan),
    sessionNotes: sessionNotes.trim(),
    transcript: transcriptText,
    treatmentPlanId: extractTreatmentPlanId(treatmentPlan),
    generatedAt: now,
    editedAt: now,
    status: 'draft',
  }
}
