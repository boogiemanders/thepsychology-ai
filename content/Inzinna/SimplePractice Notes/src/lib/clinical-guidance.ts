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
  goals: string
  interventions: string
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
  hasSexualHealthConcern: boolean
  hasAdolescentPresentation: boolean
  needsMedicalCoordination: boolean
  // Demographics for biopsychosocial narrative
  clientName: string
  age: number | null
  genderLabel: string
  ethnicityLabel: string
  occupationContext: string
  relationshipContext: string
  livingContext: string
  hasMedicalIssues: boolean
  medicationContext: string
  substanceContext: string
  phq9Score: number | null
  gad7Score: number | null
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

function normalizeGenderLabel(raw: string): string {
  const lower = raw.trim().toLowerCase()
  if (/\b(male|man|boy)\b/.test(lower)) return 'male'
  if (/\b(female|woman|girl)\b/.test(lower)) return 'female'
  if (/\b(non-?binary|genderqueer|genderfluid)\b/.test(lower)) return 'non-binary'
  return ''
}

function buildEthnicityLabel(ethnicity: string, race: string): string {
  const eth = ethnicity.trim()
  const r = race.trim()
  if (/^yes$/i.test(eth)) return r ? `${r} Hispanic/Latino` : 'Hispanic/Latino'
  if (/^no$/i.test(eth)) return r
  return eth || r
}

function buildOccupationContext(occupation: string): string {
  const trimmed = occupation.trim()
  if (!trimmed) return ''
  if (/unemployed|not working|out of work/i.test(trimmed)) return 'currently unemployed'
  // Include the actual occupation if it's specific enough
  const cleaned = trimmed.replace(/^(a|an)\s+/i, '').replace(/[.]+$/, '').trim()
  if (cleaned.length > 3 && cleaned.length < 60) return `with stable employment as a ${cleaned.toLowerCase()}`
  return 'with stable employment'
}

function buildSubstanceContext(alcohol: string, drug: string, history: string): string {
  const negative = /^(no|none|n\/a|na|denied|denies|negative)$/i
  const parts = [alcohol, drug, history]
    .map((v) => v.trim())
    .filter((v) => v && !negative.test(v))
  if (!parts.length) return ''
  return unique(parts).slice(0, 2).join('; ')
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
  const hasSexualHealthConcern =
    /sexual dysfunction|erectile|sex therap|libido|orgasm|premature ejaculation|vaginismus|dyspareunia/.test(narrativeText) ||
    /sexual dysfunction|erectile|sex therap/.test(diagnosisText)
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
    hasSexualHealthConcern,
    hasAdolescentPresentation: age !== null && age <= 19,
    needsMedicalCoordination,
    // Demographics for biopsychosocial narrative
    clientName: firstNonEmpty(intake.firstName, intake.fullName) || 'Patient',
    age,
    genderLabel: normalizeGenderLabel(firstNonEmpty(intake.genderIdentity, intake.sex)),
    ethnicityLabel: buildEthnicityLabel(intake.ethnicity, intake.race),
    occupationContext: buildOccupationContext(intake.occupation),
    relationshipContext: clip(intake.relationshipDescription.trim(), 80),
    livingContext: intake.livingArrangement.trim().toLowerCase(),
    hasMedicalIssues: Boolean(
      intake.medicalHistory.trim() &&
      !/^(none|no|denied|denies|n\/a|na)$/i.test(intake.medicalHistory.trim())
    ),
    medicationContext: intake.medications.trim() && !/^(none|no|denied|denies|n\/a|na)$/i.test(intake.medications.trim())
      ? clip(intake.medications.trim(), 80)
      : '',
    substanceContext: buildSubstanceContext(intake.alcoholUse, intake.drugUse, intake.substanceUseHistory),
    phq9Score: intake.phq9?.totalScore ?? null,
    gad7Score: intake.gad7?.totalScore ?? null,
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

function buildFormulationQueries(
  profile: ClinicalProfile,
  diagnosticImpressions: DiagnosticImpression[]
): string[] {
  const diagnosisClause = diagnosticImpressions.length
    ? diagnosticImpressions.map((impression) => impression.name).join(' ')
    : profile.diagnoses.join(' ')

  const queries = [
    `case formulation ${diagnosisClause} mechanisms precipitants origins treatment planning`.trim(),
    'elements of a case formulation symptoms problems mechanisms precipitants origins',
    'using the formulation to develop a treatment plan diagnosis goals',
  ]

  // Add psychodynamic formulation queries when relevant
  if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
    queries.push('psychodynamic formulation attachment defenses personality functioning relationship patterns')
    queries.push('case formulation psychodynamic trauma personality disrupted safety defenses coping')
  }

  return unique(queries).slice(0, 5)
}

function selectFormulationResourceIds(profile: ClinicalProfile): string[] {
  const ids: string[] = [RESOURCE_IDS.caseFormulationCbt]
  if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
    ids.push(RESOURCE_IDS.psychoanalytic)
    ids.push(RESOURCE_IDS.pdm)
  }
  return ids
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
    if (references.length >= 5) break
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

  if (profile.hasSexualHealthConcern) {
    modalities.push('Sex therapy (sensate focus, psychoeducation)')
  }

  return unique(modalities).slice(0, 4)
}

function stripSupportingSentence(reasoning: string): string {
  return reasoning.replace(/\s*Most direct supporting sentence:\s.+$/i, '').trim()
}

function buildProblemList(profile: ClinicalProfile): string[] {
  const problems: string[] = []

  if (profile.hasDepression) problems.push('depressed mood and reduced interest/pleasure')
  if (profile.hasAnxiety) problems.push('anxiety, worry, and physiological tension')
  if (profile.hasTrauma) problems.push('trauma-related symptoms and cue sensitivity')
  if (profile.hasSleepIssue) problems.push('sleep disruption')
  if (profile.hasInterpersonalStrain) problems.push('interpersonal strain')
  if (profile.hasSubstance) problems.push('substance-related coping or harm')
  if (profile.primaryConcern) problems.push(profile.primaryConcern.replace(/[.]+$/, ''))

  return unique(problems).slice(0, 5)
}

function buildMechanismHypotheses(profile: ClinicalProfile): string[] {
  const mechanisms: string[] = []

  if (profile.hasDepression) {
    mechanisms.push('withdrawal from routine and reinforcing activity appears to be sustaining depressive symptoms')
  }

  if (profile.hasAnxiety) {
    mechanisms.push('worry, hyperarousal, and avoidance likely reinforce anxiety over time')
  }

  if (profile.hasTrauma) {
    mechanisms.push('trauma reminders and avoidance may be preserving a trauma-response pattern')
  }

  if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
    mechanisms.push('poor distress tolerance appears to increase impulsive or high-risk coping under stress')
  }

  if (profile.hasInterpersonalStrain || profile.hasPersonality) {
    mechanisms.push('recurrent relationship stress likely amplifies mood reactivity and self-appraisal')
  }

  if (profile.hasSleepIssue) {
    mechanisms.push('sleep disruption likely lowers resilience and worsens mood and anxiety symptoms')
  }

  if (profile.hasSubstance) {
    mechanisms.push('substance use may be functioning as short-term relief that perpetuates the broader problem pattern')
  }

  return unique(mechanisms).slice(0, 3)
}

function inferPronoun(genderLabel: string): { subject: string; possessive: string } {
  if (genderLabel === 'male') return { subject: 'he', possessive: 'his' }
  if (genderLabel === 'female') return { subject: 'she', possessive: 'her' }
  return { subject: 'they', possessive: 'their' }
}

function summarizePresentingConcern(profile: ClinicalProfile): string {
  const symptoms: string[] = []
  if (profile.hasAnxiety) symptoms.push('anxiety')
  if (profile.hasDepression) symptoms.push('depression')
  if (profile.hasTrauma) symptoms.push('trauma-related distress')
  if (profile.hasSubstance) symptoms.push('substance use concerns')
  if (profile.hasEmotionDysregulation) symptoms.push('difficulty managing emotions')
  if (!symptoms.length && profile.primaryConcern) {
    return profile.primaryConcern.replace(/[.]+$/, '').toLowerCase()
  }
  return symptoms.length ? `symptoms of ${joinList(symptoms)}` : 'presenting concerns'
}

function normalizeRelationshipForNarrative(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/^(Girlfriend|Boyfriend|Partner|Spouse|Wife|Husband)/i, (m) => m.toLowerCase())
    .replace(/,\s*/, ' of ')
    .trim()
}

function buildOpeningSentence(profile: ClinicalProfile): string {
  const parts: string[] = [profile.clientName]
  parts.push('is a')

  const descriptors: string[] = []
  if (profile.age) descriptors.push(`${profile.age}-year-old`)
  if (profile.ethnicityLabel) descriptors.push(profile.ethnicityLabel)
  if (profile.genderLabel) descriptors.push(profile.genderLabel)

  if (descriptors.length) {
    parts.push(descriptors.join(' '))
  } else {
    parts.push('patient')
  }

  // Context qualifiers (employment, relationship)
  const context: string[] = []
  if (profile.occupationContext) context.push(profile.occupationContext)
  const relNarrative = normalizeRelationshipForNarrative(profile.relationshipContext)
  if (relNarrative) context.push(`${relNarrative}`)
  if (context.length) parts.push(context.join(' and '))

  // Presenting concern: summarized clinically, not raw intake text
  const concern = summarizePresentingConcern(profile)
  // Try to identify a precipitant from the primary concern
  const precipitant = profile.primaryConcern.match(/(?:following|after|relating to|due to)\s+(.+)/i)?.[1]?.replace(/[.]+$/, '')
  if (precipitant) {
    parts.push(`who presents with ${concern} relating to ${precipitant.toLowerCase()}`)
  } else if (profile.precipitatingFactors.length) {
    parts.push(`who presents with ${concern} relating to ${clip(profile.precipitatingFactors[0], 80).toLowerCase().replace(/[.]+$/, '')}`)
  } else {
    parts.push(`who presents with ${concern}`)
  }

  return `${parts.join(' ')}.`
}

function buildBiologicalParagraph(profile: ClinicalProfile): string {
  const { possessive } = inferPronoun(profile.genderLabel)
  const capPossessive = possessive.charAt(0).toUpperCase() + possessive.slice(1)
  const lines: string[] = []

  if (profile.hasMedicalIssues) {
    lines.push(`${profile.clientName} has a history of medical issues that may be playing a role.`)
  } else {
    lines.push(`${profile.clientName} has no major medical issues reported.`)
  }

  if (profile.medicationContext) {
    lines.push(`Current medications include ${profile.medicationContext}.`)
  }

  // Somatic symptoms with colon, not em dash
  const somatic: string[] = []
  if (profile.hasSleepIssue) somatic.push('trouble sleeping')
  if (profile.hasDepression) somatic.push('low energy')
  if (profile.hasAnxiety) somatic.push('physical tension')

  if (somatic.length) {
    lines.push(`${capPossessive} body is showing signs of stress: ${joinList(somatic)}.`)
  }

  return lines.join(' ')
}

function buildPsychologicalParagraphs(
  profile: ClinicalProfile,
  diagnosticImpressions: DiagnosticImpression[]
): string[] {
  const { subject } = inferPronoun(profile.genderLabel)
  const capSubject = subject.charAt(0).toUpperCase() + subject.slice(1)
  const paragraphs: string[] = []

  // Reported symptoms + scores in one sentence
  const problemList = buildProblemList(profile)
  if (problemList.length) {
    const scores: string[] = []
    if (profile.phq9Score !== null) scores.push(`PHQ-9: ${profile.phq9Score}`)
    if (profile.gad7Score !== null) scores.push(`GAD-7: ${profile.gad7Score}`)
    const scoreNote = scores.length ? ` (in clinical interview, ${scores.join(', and ')})` : ''
    paragraphs.push(`${capSubject} reported ${joinList(problemList)}${scoreNote}.`)
  }

  // CBT lens — always present
  if (profile.hasDepression && profile.hasAnxiety) {
    paragraphs.push('From a CBT lens, catastrophic interpretations and somatic vigilance may be maintaining anxiety, while behavioral withdrawal reinforces low mood.')
  } else if (profile.hasDepression) {
    paragraphs.push('From a CBT lens, doing less and pulling away from daily routines reinforces the low mood over time.')
  } else if (profile.hasAnxiety) {
    paragraphs.push('From a CBT lens, avoiding the things that cause worry gives short-term relief but makes the anxiety stronger over time.')
  } else {
    paragraphs.push('From a CBT lens, avoidance and withdrawal patterns may be keeping the current problems in place.')
  }

  // Trauma-focused lens
  if (profile.hasTrauma) {
    const traumaLines: string[] = [
      'From a trauma-focused view, avoiding reminders of what happened may feel safer in the short term but keeps the fear response active.',
    ]
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      traumaLines.push(`${capSubject} may also struggle to handle strong feelings, which can lead to risky or impulsive ways of coping when stress gets too high.`)
    }
    paragraphs.push(traumaLines.join(' '))
  } else if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
    paragraphs.push(`${capSubject} may also struggle to handle strong feelings, which can lead to risky or impulsive ways of coping when stress gets too high.`)
  }

  // Psychodynamic lens
  if (profile.hasTrauma && (profile.hasPersonality || profile.hasInterpersonalStrain)) {
    paragraphs.push(`From a psychodynamic view, the trauma can change ${profile.clientName}'s earlier sense of safety and control, overwhelming coping strategies that used to work. Relationship patterns may reflect old ways of protecting against feeling helpless or unsafe.`)
  } else if (profile.hasTrauma) {
    paragraphs.push(`From a psychodynamic view, the trauma can change ${profile.clientName}'s earlier sense of safety and control, overwhelming coping strategies that used to work.`)
  } else if (profile.hasPersonality || profile.hasInterpersonalStrain) {
    paragraphs.push(`From a psychodynamic view, repeating patterns in relationships, like expecting rejection or needing constant reassurance, may trace back to earlier experiences that shaped how ${subject} relates to others.`)
  }

  return paragraphs
}

function buildSocialParagraph(profile: ClinicalProfile): string {
  const lines: string[] = []

  // Protective factors framed as strengths
  const strengths: string[] = []
  if (profile.occupationContext && profile.occupationContext !== 'currently unemployed') {
    strengths.push('employment')
  }
  const relNarrative = normalizeRelationshipForNarrative(profile.relationshipContext)
  if (relNarrative) strengths.push(`a relationship (${relNarrative})`)
  if (profile.livingContext && !/alone/i.test(profile.livingContext)) {
    strengths.push(`housing (${profile.livingContext})`)
  }

  if (strengths.length) {
    lines.push(`On the social side, ${profile.clientName} has some important supports in place: ${joinList(strengths)}.`)
  } else {
    lines.push(`Social supports are limited and should be explored more in follow-up.`)
  }

  // Erosion signals
  if (profile.hasDepression || profile.hasInterpersonalStrain) {
    lines.push(`However, pulling away from people and activities is a concern that could weaken these supports over time.`)
  }

  return lines.join(' ')
}

function buildFormulation(
  profile: ClinicalProfile,
  modalities: string[],
  diagnosticImpressions: DiagnosticImpression[]
): string {
  const paragraphs: string[] = []

  // Opening: clinical snapshot
  paragraphs.push(buildOpeningSentence(profile))

  // Biological
  paragraphs.push(buildBiologicalParagraph(profile))

  // Psychological: each lens gets its own paragraph
  paragraphs.push(...buildPsychologicalParagraphs(profile, diagnosticImpressions))

  // Social
  paragraphs.push(buildSocialParagraph(profile))

  // Substance note if applicable
  if (profile.hasSubstance && profile.substanceContext) {
    const isVague = /^(yes|y)$/i.test(profile.substanceContext.trim())
    if (isVague) {
      paragraphs.push(`${profile.clientName} reported substance use in the intake form, which could be a way of coping with distress and raise the risk that symptoms stick around longer. More assessment for type of substances is needed.`)
    } else {
      paragraphs.push(`${profile.clientName} reported substance use (${profile.substanceContext}), which could be a way of coping with distress and raise the risk that symptoms stick around longer.`)
    }
  } else if (profile.hasSubstance) {
    paragraphs.push(`${profile.clientName} reported substance use in the intake form, which could be a way of coping with distress and raise the risk that symptoms stick around longer. More assessment for type of substances is needed.`)
  }

  // Treatment anchor
  paragraphs.push(`Treatment can start with ${joinList(modalities)}.`)

  return paragraphs.join('\n\n')
}

function buildGoals(profile: ClinicalProfile): string {
  const goals: string[] = []
  const objectives: string[] = []

  // Goals: patient-specific, tied to actual clinical flags
  if (profile.hasTrauma && profile.hasAnxiety) {
    goals.push('Reduce anxiety symptoms related to trauma')
  } else if (profile.hasAnxiety) {
    goals.push('Reduce anxiety symptoms and worry')
  } else if (profile.hasTrauma) {
    goals.push('Process trauma-related distress and restore safety')
  }

  if (profile.hasDepression) {
    goals.push('Improve mood and energy')
  }

  if (profile.hasAnxiety || profile.hasTrauma) {
    goals.push('Decrease avoidance and increase functioning')
  }

  if (profile.hasSubstance) {
    goals.push('Address substance use as coping')
  }

  if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
    goals.push('Strengthen distress tolerance and reduce self-harm risk')
  }

  if (profile.hasInterpersonalStrain || profile.hasPersonality) {
    goals.push('Improve relational stability and reflective capacity')
  }

  // Include patient-stated goals if available
  for (const g of profile.patientGoals) {
    if (!goals.some(existing => existing.toLowerCase().includes(g.toLowerCase().slice(0, 20)))) {
      goals.push(g)
    }
  }

  if (!goals.length) {
    goals.push('Clarify the symptom pattern and restore baseline functioning')
  }

  goals.push('Restore baseline functioning')

  // Objectives: concrete steps with timeframes
  objectives.push('Identify and track triggers (week 1-2)')

  if (profile.hasDepression) {
    objectives.push('Increase 2-3 pleasurable or meaningful activities weekly')
  }

  if (profile.hasAnxiety || profile.hasTrauma) {
    objectives.push('Learn 2 grounding skills')
  }

  if (profile.hasAnxiety || profile.hasDepression) {
    objectives.push('Begin cognitive restructuring of unhelpful thought patterns')
  }

  if (profile.hasSubstance) {
    objectives.push('Explore substance use patterns and motivation for change')
  }

  if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
    objectives.push('Practice one distress tolerance skill between sessions')
  }

  if (profile.hasInterpersonalStrain || profile.hasPersonality) {
    objectives.push('Identify one recurring relational pattern to explore')
  }

  objectives.push('Finalize measurable treatment goals (session 2-3)')

  const lines: string[] = []
  lines.push('Goals:')
  for (const g of unique(goals).slice(0, 6)) {
    lines.push(`  ${g}`)
  }
  lines.push('')
  lines.push('Objectives:')
  for (const o of unique(objectives).slice(0, 6)) {
    lines.push(`  ${o}`)
  }

  return lines.join('\n')
}

function buildInterventions(profile: ClinicalProfile): string {
  type Domain = { title: string; items: string[] }
  const domains: Domain[] = []
  let domainNum = 0

  // 1. Trauma + Anxiety Focus
  if (profile.hasTrauma) {
    const items: string[] = []
    items.push('Trauma-focused CBT')
    items.push('Psychoeducation on trauma response')
    items.push('Gradual exposure to trauma-related cues (as appropriate)')
    if (profile.hasAnxiety) {
      items.push('Grounding and stabilization before deeper processing')
    }
    domains.push({ title: 'Trauma + Anxiety Focus', items })
  }

  // 2. Depression Interventions
  if (profile.hasDepression) {
    const items: string[] = []
    items.push('Behavioral activation (increase engagement, reduce withdrawal)')
    items.push('Monitor sleep and appetite')
    if (profile.hasSleepIssue) {
      items.push('Behavioral sleep-routine interventions')
    }
    domains.push({ title: 'Depression Interventions', items })
  }

  // 3. Anxiety / Somatic Symptoms
  if (profile.hasAnxiety) {
    const items: string[] = []
    items.push('CBT for anxiety (cognitive restructuring, interoceptive awareness)')
    items.push('Teach grounding and distress tolerance (DBT-informed skills)')
    domains.push({ title: 'Anxiety / Somatic Symptoms', items })
  }

  // 4. Emotion Dysregulation / Self-Harm
  if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
    const items: string[] = []
    items.push('DBT distress-tolerance and emotion-regulation skills')
    items.push('Chain analysis for high-risk behaviors')
    if (profile.hasSelfHarmRisk) {
      items.push('Safety planning and crisis resource review')
    }
    domains.push({ title: 'Emotion Regulation / Safety', items })
  }

  // 5. Substance Use
  if (profile.hasSubstance) {
    const items: string[] = []
    items.push('Motivational Interviewing to explore ambivalence and function of use')
    items.push('Harm reduction vs abstinence planning based on readiness')
    items.push('Review ASAM dimensions for level of care adjustment')
    domains.push({ title: 'Substance Use', items })
  }

  // 6. Psychodynamic / Insight Work
  if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
    const items: string[] = []
    if (profile.hasTrauma) {
      items.push('Explore meaning of trauma (control, vulnerability)')
    }
    items.push('Assess emotional avoidance patterns')
    if (profile.hasInterpersonalStrain || profile.hasPersonality) {
      items.push('Track recurrent relational patterns and attachment themes')
    }
    domains.push({ title: 'Psychodynamic / Insight Work', items })
  }

  // 7. Sexual Health
  if (profile.hasSexualHealthConcern) {
    const items: string[] = []
    items.push('Comprehensive sexual health assessment (medical, psychological, relational factors)')
    items.push('Psychoeducation on sexual response cycle and contributing factors')
    items.push('Sensate focus exercises to reduce performance anxiety')
    items.push('Cognitive restructuring of maladaptive beliefs about sexual performance')
    if (profile.hasAnxiety) {
      items.push('Address performance anxiety and anticipatory avoidance')
    }
    if (profile.hasInterpersonalStrain) {
      items.push('Couples communication skills around intimacy')
    }
    items.push('Coordinate with medical provider to rule out physiological contributors')
    domains.push({ title: 'Sexual Health', items })
  }

  // 8. Medication Evaluation
  if (profile.needsMedicalCoordination || profile.severeSymptoms) {
    const items: string[] = []
    items.push('Consider consulting with a psychiatrist if symptoms persist or worsen')
    if (profile.hasSleepIssue) {
      items.push('Sleep support if insomnia emerges')
    }
    if (profile.hasSubstance) {
      items.push('Medication evaluation for co-occurring substance use')
    }
    domains.push({ title: 'Medication Evaluation', items })
  }

  // Fallback: always include at least diagnostic clarification
  if (!domains.length) {
    domains.push({
      title: 'Assessment and Monitoring',
      items: [
        'Complete diagnostic clarification and timeline review',
        'Measurement-based monitoring at follow-up visits',
      ],
    })
  }

  // Format as numbered domain sections
  const lines: string[] = []
  for (const domain of domains) {
    domainNum++
    lines.push(`${domainNum}. ${domain.title}`)
    for (const item of domain.items) {
      lines.push(`   ${item}`)
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}

function buildFrequency(profile: ClinicalProfile): string {
  const lines: string[] = []

  // Frequency
  if (profile.hasSelfHarmRisk || profile.severeSymptoms) {
    lines.push('Frequency: Weekly outpatient therapy (consider twice weekly if risk escalates)')
  } else {
    lines.push('Frequency: Weekly outpatient therapy')
  }

  // Monitoring
  lines.push('')
  lines.push('Monitoring:')
  const monitors: string[] = []
  if (profile.hasDepression || profile.hasAnxiety) {
    monitors.push('PHQ-9 / GAD-7 every 2-4 weeks')
  }
  if (profile.hasSubstance) {
    monitors.push('Substance use tracking')
  }
  if (profile.hasSelfHarmRisk) {
    monitors.push('Safety plan review each session')
  }
  if (!monitors.length) {
    monitors.push('Symptom and functioning check-in each session')
  }
  for (const m of monitors) {
    lines.push(`  ${m}`)
  }

  // Reassessment
  lines.push('')
  lines.push('Reassessment:')
  const reassess: string[] = []
  if (profile.hasTrauma) {
    reassess.push('Evaluate PTSD criteria next session and after 1 month')
  }
  if (profile.hasSubstance) {
    reassess.push('Reassess ASAM dimensions for level of care adjustment')
  }
  if (profile.diagnoses.length) {
    const dxList = profile.diagnoses.slice(0, 3).join(', ')
    reassess.push(`Review diagnostic accuracy for ${dxList} after 4-6 sessions`)
  }
  if (!reassess.length) {
    reassess.push('Re-evaluate diagnostic impressions after 4-6 sessions')
  }
  for (const r of reassess) {
    lines.push(`  ${r}`)
  }

  // Referral
  lines.push('')
  lines.push('Referral:')
  if (profile.needsMedicalCoordination || profile.severeSymptoms) {
    lines.push('  Psychiatry if symptoms persist or escalate')
  } else {
    lines.push('  Psychiatry if symptoms escalate')
  }
  if (profile.hasSubstance) {
    lines.push('  SUD specialty services if relapse severity warrants')
  }

  // Safety
  lines.push('')
  lines.push('Safety:')
  if (profile.hasSelfHarmRisk) {
    lines.push('  Continue monitoring SI/HI each session: update safety plan as needed')
  } else {
    lines.push('  Continue monitoring SI (currently denied)')
  }

  return lines.join('\n')
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
  const goals: string[] = []
  const objectives: string[] = []

  // Goals: what to achieve (mirrors buildGoals but for next-session plan framing)
  if (profile.hasTrauma && profile.hasAnxiety) {
    goals.push('Reduce anxiety symptoms related to trauma')
  } else if (profile.hasAnxiety) {
    goals.push('Reduce anxiety and worry')
  }
  if (profile.hasDepression) {
    goals.push('Improve mood and energy')
  }
  if (profile.hasAnxiety || profile.hasTrauma) {
    goals.push('Decrease avoidance and increase functioning')
  }
  if (profile.hasSubstance) {
    goals.push('Address substance use as coping')
  }
  if (profile.hasSelfHarmRisk || profile.hasEmotionDysregulation) {
    goals.push('Strengthen distress tolerance and safety')
  }
  if (!goals.length) {
    goals.push('Clarify symptom pattern and restore functioning')
  }
  goals.push('Restore baseline functioning')

  // Objectives: concrete next steps with timeframes
  objectives.push('Review diagnostic timeline and current impairment (session 1-2)')
  if (profile.hasSelfHarmRisk) {
    objectives.push('Update safety plan (each session)')
  }
  if (profile.hasSubstance) {
    objectives.push('Assess motivation, use pattern, and relapse risk (session 1-2)')
  }
  if (profile.hasEmotionDysregulation) {
    objectives.push('Introduce one DBT coping skill for between-session use (session 2)')
  }
  if (profile.hasDepression || profile.hasAnxiety) {
    objectives.push('Assign one behavioral practice or symptom-monitoring task (session 2)')
  }
  objectives.push('Finalize measurable treatment goals (session 2-3)')

  const lines: string[] = []
  lines.push('Goals:')
  for (const g of unique(goals).slice(0, 6)) {
    lines.push(`  ${g}`)
  }
  lines.push('')
  lines.push('Objectives:')
  for (const o of unique(objectives).slice(0, 6)) {
    lines.push(`  ${o}`)
  }

  return lines.join('\n')
}

async function computeGuidance(
  intake: IntakeData,
  diagnosticImpressions: DiagnosticImpression[]
): Promise<ClinicalGuidance> {
  const profile = buildProfile(intake, diagnosticImpressions)
  const resourceIds = selectResourceIds(profile)
  const treatmentQueries = buildQueries(profile)
  const formulationQueries = buildFormulationQueries(profile, diagnosticImpressions)

  const [formulationResults, treatmentResults] = await Promise.all([
    Promise.all(
      formulationQueries.map((query) =>
        searchClinicalKnowledge(query, {
          limit: 3,
          resourceIds: selectFormulationResourceIds(profile),
        })
      )
    ).then((results) => results.flat()),
    Promise.all(
      treatmentQueries.map((query) =>
        searchClinicalKnowledge(query, {
          limit: 4,
          resourceIds,
        })
      )
    ).then((results) => results.flat()),
  ])

  const searchResults = [...formulationResults, ...treatmentResults]
    .sort((a, b) => b.score - a.score)

  const modalities = recommendModalities(profile)

  return {
    modalities,
    formulation: buildFormulation(profile, modalities, diagnosticImpressions),
    goals: buildGoals(profile),
    interventions: buildInterventions(profile),
    frequency: buildFrequency(profile),
    referrals: buildReferrals(intake, profile),
    plan: buildPlan(profile),
    references: dedupeReferences(searchResults),
    queries: [...formulationQueries, ...treatmentQueries],
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
    diagnoses: diagnosticImpressions.map((impression) => ({
      id: impression.disorderId,
      name: impression.name,
      confidence: impression.confidence,
      reasoning: impression.diagnosticReasoning ?? '',
      evidence: impression.criteriaEvidence,
      notes: impression.clinicianNotes ?? '',
    })),
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
