import {
  DiagnosticImpression,
  IntakeData,
  ProgressNote,
  ProviderPreferences,
  EMPTY_PROGRESS_NOTE,
} from './types'
import { buildClinicalGuidance } from './clinical-guidance'

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function splitGoals(raw: string): string[] {
  return raw
    .split(/\n|;|•/)
    .map((part) => part.trim().replace(/^[\d\-*,.\s]+/, ''))
    .filter(Boolean)
}

function summarizeAssessments(intake: IntakeData): string[] {
  const parts: string[] = []

  if (intake.phq9) {
    parts.push(`PHQ-9 ${intake.phq9.totalScore}/27 (${intake.phq9.severity || 'severity not parsed'})`)
  }

  if (intake.gad7) {
    parts.push(`GAD-7 ${intake.gad7.totalScore}/21 (${intake.gad7.severity || 'severity not parsed'})`)
  }

  return parts
}

function summarizeRisk(intake: IntakeData): string[] {
  const parts: string[] = []

  if (intake.suicidalIdeation.trim()) parts.push(`SI: ${intake.suicidalIdeation.trim()}`)
  if (intake.homicidalIdeation.trim()) parts.push(`HI: ${intake.homicidalIdeation.trim()}`)
  if (intake.suicideAttemptHistory.trim()) parts.push(`Suicide attempt history: ${intake.suicideAttemptHistory.trim()}`)
  if (intake.psychiatricHospitalization.trim()) parts.push(`Psych hospitalization: ${intake.psychiatricHospitalization.trim()}`)

  return parts
}

function buildPresentingComplaint(intake: IntakeData): string {
  const sections = [
    firstNonEmpty(intake.chiefComplaint, intake.presentingProblems),
    intake.historyOfPresentIllness.trim(),
    intake.manualNotes.trim(),
    intake.additionalSymptoms.trim(),
    intake.recentSymptoms.trim(),
  ].filter(Boolean)

  const assessmentSummary = summarizeAssessments(intake)
  if (assessmentSummary.length) {
    sections.push(`Screening results: ${assessmentSummary.join('; ')}.`)
  }

  return sections.join('\n\n')
}

function buildFallbackClinicalFormulation(intake: IntakeData): string {
  const parts: string[] = []

  const chiefComplaint = firstNonEmpty(
    intake.chiefComplaint,
    intake.presentingProblems,
    intake.historyOfPresentIllness,
    intake.manualNotes
  )
  if (chiefComplaint) {
    parts.push(`Patient presents for intake reporting ${chiefComplaint.replace(/[.]+$/, '')}.`)
  }

  const history: string[] = []
  if (intake.priorTreatment.trim()) history.push(`prior treatment: ${intake.priorTreatment.trim()}`)
  if (intake.medications.trim()) history.push(`medications: ${intake.medications.trim()}`)
  if (intake.medicalHistory.trim()) history.push(`medical history: ${intake.medicalHistory.trim()}`)
  if (intake.familyPsychiatricHistory.trim()) history.push(`family psychiatric history: ${intake.familyPsychiatricHistory.trim()}`)
  if (intake.physicalSexualAbuseHistory.trim()) history.push(`trauma history: ${intake.physicalSexualAbuseHistory.trim()}`)
  if (intake.domesticViolenceHistory.trim()) history.push(`domestic violence history: ${intake.domesticViolenceHistory.trim()}`)
  if (history.length) {
    parts.push(`Relevant history includes ${history.join('; ')}.`)
  }

  const riskSummary = summarizeRisk(intake)
  if (riskSummary.length) {
    parts.push(`Risk-related intake responses: ${riskSummary.join('; ')}.`)
  }

  const contextualFactors: string[] = []
  if (intake.livingArrangement.trim()) contextualFactors.push(`living situation: ${intake.livingArrangement.trim()}`)
  if (intake.relationshipDescription.trim()) contextualFactors.push(`relationship context: ${intake.relationshipDescription.trim()}`)
  if (intake.occupation.trim()) contextualFactors.push(`occupation: ${intake.occupation.trim()}`)
  if (intake.counselingGoals.trim()) contextualFactors.push(`treatment goals: ${intake.counselingGoals.trim()}`)
  if (contextualFactors.length) {
    parts.push(`Contextual factors include ${contextualFactors.join('; ')}.`)
  }

  return parts.join(' ')
}

function buildInterventions(intake: IntakeData): string[] {
  const interventions = [
    'Complete diagnostic assessment and clarify symptom timeline.',
    'Review risk, protective factors, and prior treatment response.',
  ]

  if (intake.phq9) {
    interventions.push('Track depressive symptoms with PHQ-9 over follow-up visits.')
  }

  if (intake.gad7) {
    interventions.push('Track anxiety symptoms with GAD-7 over follow-up visits.')
  }

  if (intake.counselingGoals.trim()) {
    interventions.push('Align treatment planning with the patient-stated counseling goals.')
  }

  return interventions
}

export async function buildDraftNote(
  intake: IntakeData,
  prefs: ProviderPreferences,
  diagnosticImpressions: DiagnosticImpression[] = []
): Promise<ProgressNote> {
  const clientName = firstNonEmpty(
    intake.fullName,
    `${intake.firstName} ${intake.lastName}`.trim()
  )

  const goals = splitGoals(intake.counselingGoals)
  const sessionDate = firstNonEmpty(
    intake.formDate,
    intake.capturedAt ? new Date(intake.capturedAt).toLocaleDateString('en-US') : ''
  )
  const guidance = await buildClinicalGuidance(intake, diagnosticImpressions)

  const guidanceGoalLines = guidance.goals
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.endsWith(':'))
  const mergedGoals = Array.from(
    new Set([
      ...(goals.length ? goals : ['Clarify presenting concerns and establish treatment goals.']),
      ...guidanceGoalLines,
    ])
  ).slice(0, 5)

  const guidanceInterventionLines = guidance.interventions
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(l => l && !l.endsWith(':'))
  const mergedInterventions = Array.from(
    new Set([
      ...buildInterventions(intake),
      ...guidanceInterventionLines,
    ])
  ).slice(0, 6)

  return {
    ...EMPTY_PROGRESS_NOTE,
    clientName,
    sessionDate,
    sessionType: 'Initial Clinical Evaluation',
    cptCode: prefs.firstVisitCPT,
    chiefComplaint: firstNonEmpty(
      intake.chiefComplaint,
      intake.presentingProblems,
      intake.historyOfPresentIllness,
      intake.manualNotes
    ),
    presentingComplaint: buildPresentingComplaint(intake),
    diagnosticImpressions,
    clinicalFormulation: guidance.formulation || buildFallbackClinicalFormulation(intake),
    treatmentPlan: {
      goals: mergedGoals,
      interventions: mergedInterventions,
      frequency: guidance.frequency || 'To be determined after intake evaluation.',
      referrals: guidance.referrals || (
        intake.primaryCarePhysician.trim()
          ? `Coordinate with PCP as needed: ${intake.primaryCarePhysician.trim()}.`
          : ''
      ),
    },
    plan: guidance.plan || 'Complete the intake evaluation, finalize diagnostic impressions, and establish the initial treatment plan.',
    generatedAt: new Date().toISOString(),
    status: {
      intakeCaptured: true,
      noteGenerated: true,
      noteReviewed: false,
      noteSubmitted: false,
    },
  }
}
