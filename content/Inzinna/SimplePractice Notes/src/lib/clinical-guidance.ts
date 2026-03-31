import {
  ClinicalKnowledgeSearchResult,
  searchClinicalKnowledge,
} from './clinical-knowledge'
import { DiagnosticImpression, IntakeData } from './types'

export interface ClinicalGuidanceReference {
  resourceId: string
  resourceTitle: string
  pageStart: number
  heading: string
  preview: string
  score: number
}

export interface ClinicalGuidance {
  modalities: string[]
  formulation: string
  goals: string[]
  interventions: string[]
  frequency: string
  referrals: string
  plan: string
  references: ClinicalGuidanceReference[]
  queries: string[]
}

type ClinicalProfile = {
  diagnoses: string[]
  primaryConcern: string
  patientGoals: string[]
  predisposingFactors: string[]
  precipitatingFactors: string[]
  perpetuatingFactors: string[]
  protectiveFactors: string[]
  severeSymptoms: boolean
  hasDepression: boolean
  hasAnxiety: boolean
  hasTrauma: boolean
  hasSubstance: boolean
  hasPersonality: boolean
  hasSelfHarmRisk: boolean
  hasEmotionDysregulation: boolean
  hasInterpersonalStrain: boolean
  hasSleepIssue: boolean
  hasAdolescentPresentation: boolean
  needsMedicalCoordination: boolean
}

const guidanceCache = new Map<string, Promise<ClinicalGuidance>>()

const RESOURCE_IDS = {
  caseFormulationCbt: 'case-formulation-approach-cbt',
  behavioralCbt: 'behavioral-interventions-cbt-2e',
  dbtAdult: 'dbt-skills-training-handouts-worksheets-2e',
  dbtAdolescent: 'dbt-skills-manual-adolescents',
  mi: 'motivational-interviewing-helping-people-change-and-grow',
  psychoanalytic: 'psychoanalytic-case-formulation',
  pdm: 'psychodynamic-diagnostic-manual-pdm-3',
  asam: 'asam-principles-of-addiction-medicine-7e',
} as const

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function clip(value: string, max = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max - 1).trimEnd()}...`
}

function firstNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function joinList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function unique(items: string[]): string[] {
  return Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function splitGoals(raw: string): string[] {
  return unique(
    raw
      .split(/\n|;|•/)
      .map((part) => part.trim().replace(/^[\d\-*,.\s]+/, ''))
      .filter(Boolean)
  )
}

function parseAge(dob: string): number | null {
  if (!dob.trim()) return null
  const date = new Date(dob)
  if (Number.isNaN(date.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const birthdayPassed =
    now.getMonth() > date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate())
  if (!birthdayPassed) age -= 1
  return age >= 0 ? age : null
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function pickFactors(values: Array<string | null | undefined>, max = 3): string[] {
  return values
    .map((value) => clip(value ?? ''))
    .filter(Boolean)
    .slice(0, max)
}

function buildProfile(
  intake: IntakeData,
  diagnosticImpressions: DiagnosticImpression[]
): ClinicalProfile {
  const diagnosisText = normalizeText(
    diagnosticImpressions.map((impression) => `${impression.name} ${impression.disorderId}`).join(' ')
  )
  const narrativeText = normalizeText(
    [
      intake.chiefComplaint,
      intake.presentingProblems,
      intake.historyOfPresentIllness,
      intake.recentSymptoms,
      intake.additionalSymptoms,
      intake.additionalInfo,
      intake.manualNotes,
      intake.suicidalIdeation,
      intake.suicideAttemptHistory,
      intake.alcoholUse,
      intake.drugUse,
      intake.substanceUseHistory,
      intake.physicalSexualAbuseHistory,
      intake.domesticViolenceHistory,
      intake.troubleSleeping,
      intake.relationshipDescription,
    ].join(' ')
  )

  const age = parseAge(intake.dob)
  const hasDepression =
    /depress|mdd|persistent depressive/.test(diagnosisText) ||
    /depress|hopeless|sad|anhedonia|low mood/.test(narrativeText) ||
    (intake.phq9?.totalScore ?? 0) >= 10
  const hasAnxiety =
    /anxiety|gad|panic|ocd|ptsd|stress/.test(diagnosisText) ||
    /anxious|worry|panic|obsess|compuls|on edge|stress/.test(narrativeText) ||
    (intake.gad7?.totalScore ?? 0) >= 10
  const hasTrauma =
    /ptsd|acute stress|trauma/.test(diagnosisText) ||
    hasAny(narrativeText, [/trauma/, /abuse/, /assault/, /violence/, /sexual assault/])
  const hasSubstance =
    /alcohol|cannabis|substance|addict|opioid|use disorder/.test(diagnosisText) ||
    hasAny(narrativeText, [/alcohol/, /drug/, /substance/, /cannabis/, /opioid/, /craving/, /withdrawal/])
  const hasPersonality =
    /personality|borderline|narciss|avoidant|dependent|ocpd|antisocial/.test(diagnosisText)
  const hasSelfHarmRisk =
    hasAny(narrativeText, [/suicid/, /self-harm/, /cutting/, /overdose/]) ||
    /borderline/.test(diagnosisText)
  const hasEmotionDysregulation =
    hasSelfHarmRisk ||
    /emotion regulation|mood swings|labile|anger|impulsive/.test(narrativeText)
  const hasInterpersonalStrain = hasAny(narrativeText, [/relationship/, /conflict/, /attachment/, /interpersonal/])
  const hasSleepIssue = /sleep|insomnia|hypersomnia/.test(normalizeText(`${intake.troubleSleeping} ${intake.additionalSymptoms}`))
  const severeSymptoms = (intake.phq9?.totalScore ?? 0) >= 15 || (intake.gad7?.totalScore ?? 0) >= 15
  const needsMedicalCoordination = Boolean(
    intake.primaryCarePhysician.trim() ||
    intake.prescribingMD.trim() ||
    intake.medications.trim()
  )

  return {
    diagnoses: unique(diagnosticImpressions.map((impression) => impression.name)).slice(0, 3),
    primaryConcern: clip(
      firstNonEmpty(
        intake.chiefComplaint,
        intake.presentingProblems,
        intake.historyOfPresentIllness,
        intake.manualNotes,
        intake.additionalSymptoms
      ),
      150
    ),
    patientGoals: splitGoals(intake.counselingGoals).slice(0, 3),
    predisposingFactors: unique([
      ...pickFactors([intake.familyPsychiatricHistory, intake.familyMentalEmotionalHistory], 2),
      ...pickFactors([intake.physicalSexualAbuseHistory, intake.domesticViolenceHistory], 1),
      ...pickFactors([intake.developmentalHistory, intake.medicalHistory], 1),
    ]).slice(0, 4),
    precipitatingFactors: unique([
      ...pickFactors([intake.chiefComplaint, intake.presentingProblems, intake.historyOfPresentIllness], 2),
      ...pickFactors([intake.recentSymptoms, intake.additionalSymptoms], 1),
    ]).slice(0, 4),
    perpetuatingFactors: unique([
      ...pickFactors([intake.troubleSleeping], 1),
      ...pickFactors([intake.alcoholUse, intake.drugUse, intake.substanceUseHistory], 1),
      ...pickFactors([intake.relationshipDescription, intake.occupation], 1),
      ...pickFactors([
        intake.phq9?.difficulty ? `Depression-related impairment: ${intake.phq9.difficulty}` : '',
        intake.gad7?.difficulty ? `Anxiety-related impairment: ${intake.gad7.difficulty}` : '',
      ], 1),
    ]).slice(0, 4),
    protectiveFactors: unique([
      ...pickFactors([intake.counselingGoals ? `Stated treatment goals: ${intake.counselingGoals}` : ''], 1),
      ...pickFactors([intake.livingArrangement, intake.relationshipDescription], 1),
      ...pickFactors([intake.priorTreatment ? `Prior treatment engagement: ${intake.priorTreatment}` : ''], 1),
      ...pickFactors([
        needsMedicalCoordination
          ? `Existing medical contacts: ${firstNonEmpty(intake.primaryCarePhysician, intake.prescribingMD, intake.medications)}`
          : '',
      ], 1),
    ]).slice(0, 4),
    severeSymptoms,
    hasDepression,
    hasAnxiety,
    hasTrauma,
    hasSubstance,
    hasPersonality,
    hasSelfHarmRisk,
    hasEmotionDysregulation,
    hasInterpersonalStrain,
    hasSleepIssue,
    hasAdolescentPresentation: age !== null && age <= 19,
    needsMedicalCoordination,
  }
}

function selectResourceIds(profile: ClinicalProfile): string[] {
  const ids = new Set<string>([
    RESOURCE_IDS.caseFormulationCbt,
    RESOURCE_IDS.behavioralCbt,
  ])

  if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk || profile.hasAdolescentPresentation) {
    ids.add(RESOURCE_IDS.dbtAdult)
    ids.add(RESOURCE_IDS.dbtAdolescent)
  }

  if (profile.hasSubstance) {
    ids.add(RESOURCE_IDS.mi)
    ids.add(RESOURCE_IDS.asam)
  }

  if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
    ids.add(RESOURCE_IDS.psychoanalytic)
    ids.add(RESOURCE_IDS.pdm)
  }

  return Array.from(ids)
}

function buildQueries(profile: ClinicalProfile): string[] {
  const diagnosisClause = profile.diagnoses.length
    ? profile.diagnoses.join(' ')
    : [profile.hasDepression ? 'depression' : '', profile.hasAnxiety ? 'anxiety' : '', profile.hasSubstance ? 'substance use' : '']
      .filter(Boolean)
      .join(' ')

  const queries = unique([
    `case formulation ${diagnosisClause} ${profile.primaryConcern}`.trim(),
    `treatment plan interventions ${diagnosisClause} ${profile.patientGoals.join(' ')}`.trim(),
    profile.hasSubstance
      ? 'motivational interviewing relapse prevention ambivalence substance use'
      : '',
    profile.hasEmotionDysregulation || profile.hasSelfHarmRisk
      ? 'dbt distress tolerance emotion regulation chain analysis safety planning'
      : '',
    profile.hasTrauma || profile.hasPersonality || profile.hasInterpersonalStrain
      ? 'psychodynamic formulation attachment personality functioning relationship patterns'
      : '',
  ])

  return queries.slice(0, 5)
}

function dedupeReferences(results: ClinicalKnowledgeSearchResult[]): ClinicalGuidanceReference[] {
  const seen = new Set<string>()
  const references: ClinicalGuidanceReference[] = []

  for (const result of results) {
    const key = `${result.resourceId}:${result.chunk.pageStart}`
    if (seen.has(key)) continue
    seen.add(key)
    references.push({
      resourceId: result.resourceId,
      resourceTitle: result.resourceTitle,
      pageStart: result.chunk.pageStart,
      heading: result.chunk.heading,
      preview: result.chunk.preview,
      score: result.score,
    })
    if (references.length >= 6) break
  }

  return references
}

function recommendModalities(profile: ClinicalProfile): string[] {
  const modalities = ['CBT case formulation']

  if (profile.hasDepression || profile.hasAnxiety) {
    modalities.push('Behavioral CBT')
  }

  if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk || profile.hasAdolescentPresentation) {
    modalities.push('DBT skills')
  }

  if (profile.hasSubstance) {
    modalities.push('Motivational interviewing')
    modalities.push('ASAM-informed addiction planning')
  }

  if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
    modalities.push('Psychodynamic formulation')
  }

  return unique(modalities).slice(0, 4)
}

function buildFormulation(profile: ClinicalProfile, modalities: string[]): string {
  const sentences: string[] = []

  if (profile.diagnoses.length) {
    sentences.push(`Working diagnostic focus currently centers on ${joinList(profile.diagnoses)}.`)
  } else if (profile.primaryConcern) {
    sentences.push(`Current presentation is organized around ${profile.primaryConcern.replace(/[.]+$/, '')}.`)
  }

  if (profile.predisposingFactors.length) {
    sentences.push(`Predisposing factors include ${joinList(profile.predisposingFactors)}.`)
  }

  if (profile.precipitatingFactors.length) {
    sentences.push(`Precipitating factors include ${joinList(profile.precipitatingFactors)}.`)
  }

  if (profile.perpetuatingFactors.length) {
    sentences.push(`Perpetuating factors likely include ${joinList(profile.perpetuatingFactors)}.`)
  }

  if (profile.protectiveFactors.length) {
    sentences.push(`Protective factors include ${joinList(profile.protectiveFactors)}.`)
  } else {
    sentences.push('Protective factors need direct clarification during follow-up.')
  }

  sentences.push(`Initial formulation and treatment planning are best anchored in ${joinList(modalities)}.`)

  return sentences.join(' ')
}

function buildGoals(profile: ClinicalProfile): string[] {
  const goals = [...profile.patientGoals]

  if (!goals.length) {
    goals.push('Clarify the symptom pattern and improve day-to-day functioning.')
  }

  if (profile.hasDepression || profile.hasAnxiety) {
    goals.push('Reduce mood and anxiety symptom burden while restoring routine functioning.')
  }

  if (profile.hasSelfHarmRisk || profile.hasEmotionDysregulation) {
    goals.push('Increase safety, distress tolerance, and use of non-harm coping responses.')
  }

  if (profile.hasTrauma) {
    goals.push('Strengthen grounding, stabilization, and trauma-informed coping.')
  }

  if (profile.hasSubstance) {
    goals.push('Reduce substance-related harm and strengthen relapse-prevention planning.')
  }

  if (profile.hasInterpersonalStrain || profile.hasPersonality) {
    goals.push('Improve interpersonal stability and reflective capacity in relationships.')
  }

  return unique(goals).slice(0, 5)
}

function buildInterventions(profile: ClinicalProfile): string[] {
  const interventions = [
    'Complete diagnostic clarification, timeline review, and measurement-based monitoring at follow-up visits.',
  ]

  if (profile.hasDepression) {
    interventions.push('Use behavioral activation and routine-building to increase reinforcement and daily structure.')
  }

  if (profile.hasAnxiety) {
    interventions.push('Use CBT skills to target worry, avoidance, and graduated behavioral practice.')
  }

  if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
    interventions.push('Teach DBT distress-tolerance and emotion-regulation skills, and use chain analysis for high-risk behaviors.')
  }

  if (profile.hasSubstance) {
    interventions.push('Use motivational interviewing to explore ambivalence, strengthen change talk, and build relapse-prevention steps.')
    interventions.push('Review ASAM-informed level-of-care, withdrawal-risk, and recovery-support needs.')
  }

  if (profile.hasTrauma) {
    interventions.push('Prioritize stabilization, grounding, and pacing before deeper trauma processing.')
  }

  if (profile.hasPersonality || profile.hasInterpersonalStrain) {
    interventions.push('Track recurrent relational patterns, attachment themes, and therapy-interfering behaviors in treatment.')
  }

  if (profile.hasSleepIssue) {
    interventions.push('Address sleep disruption with behavioral sleep-routine interventions and symptom monitoring.')
  }

  return unique(interventions).slice(0, 6)
}

function buildFrequency(profile: ClinicalProfile): string {
  if (profile.hasSelfHarmRisk || profile.hasSubstance || profile.severeSymptoms) {
    return 'Recommend weekly psychotherapy initially, with higher-contact follow-up or higher level of care if risk, withdrawal, or impairment escalates.'
  }
  return 'Recommend weekly psychotherapy initially, then adjust frequency based on symptom change and functional improvement.'
}

function buildReferrals(intake: IntakeData, profile: ClinicalProfile): string {
  const referrals: string[] = []

  if (profile.needsMedicalCoordination) {
    const medicalContact = firstNonEmpty(intake.primaryCarePhysician, intake.prescribingMD)
    referrals.push(
      medicalContact
        ? `Coordinate with existing medical prescriber/PCP: ${medicalContact}.`
        : 'Coordinate with PCP and any current prescriber as clinically indicated.'
    )
  }

  if (profile.hasSubstance) {
    referrals.push('Consider SUD specialty services, medication evaluation, or higher level of care if withdrawal risk or relapse severity warrants.')
  }

  if (profile.hasSelfHarmRisk) {
    referrals.push('Escalate to crisis resources, safety planning, or higher level of care if suicidal risk increases.')
  }

  return referrals.join(' ')
}

function buildPlan(profile: ClinicalProfile): string {
  const steps = [
    'review the diagnostic timeline and current impairment',
    profile.hasSelfHarmRisk ? 'update safety planning' : '',
    profile.hasSubstance ? 'assess motivation, use pattern, and relapse risk' : '',
    profile.hasEmotionDysregulation ? 'introduce one concrete DBT coping skill for between-session use' : '',
    profile.hasDepression || profile.hasAnxiety ? 'assign one behavioral practice or symptom-monitoring task' : '',
    'finalize measurable treatment goals',
  ].filter(Boolean)

  return `Next session: ${steps.join(', ')}.`
}

async function computeGuidance(
  intake: IntakeData,
  diagnosticImpressions: DiagnosticImpression[]
): Promise<ClinicalGuidance> {
  const profile = buildProfile(intake, diagnosticImpressions)
  const resourceIds = selectResourceIds(profile)
  const queries = buildQueries(profile)

  const searchResults = (
    await Promise.all(
      queries.map((query) =>
        searchClinicalKnowledge(query, {
          limit: 4,
          resourceIds,
        })
      )
    )
  )
    .flat()
    .sort((a, b) => b.score - a.score)

  const modalities = recommendModalities(profile)

  return {
    modalities,
    formulation: buildFormulation(profile, modalities),
    goals: buildGoals(profile),
    interventions: buildInterventions(profile),
    frequency: buildFrequency(profile),
    referrals: buildReferrals(intake, profile),
    plan: buildPlan(profile),
    references: dedupeReferences(searchResults),
    queries,
  }
}

function buildCacheKey(
  intake: IntakeData,
  diagnosticImpressions: DiagnosticImpression[]
): string {
  return JSON.stringify({
    clientId: intake.clientId,
    capturedAt: intake.capturedAt,
    chiefComplaint: intake.chiefComplaint,
    presentingProblems: intake.presentingProblems,
    counselingGoals: intake.counselingGoals,
    manualNotes: intake.manualNotes,
    phq9: intake.phq9?.totalScore ?? null,
    gad7: intake.gad7?.totalScore ?? null,
    diagnoses: diagnosticImpressions.map((impression) => `${impression.disorderId}:${impression.name}`),
  })
}

export async function buildClinicalGuidance(
  intake: IntakeData,
  diagnosticImpressions: DiagnosticImpression[] = []
): Promise<ClinicalGuidance> {
  const key = buildCacheKey(intake, diagnosticImpressions)
  if (!guidanceCache.has(key)) {
    guidanceCache.set(key, computeGuidance(intake, diagnosticImpressions))
  }
  return guidanceCache.get(key) as Promise<ClinicalGuidance>
}
