import { DSM5_DISORDER_MAP, DSM5_DISORDERS } from '../data/dsm5-criteria'
import {
  CriterionEvaluation,
  CriterionMatchStatus,
  DSM5CriterionDefinition,
  DSM5DisorderDefinition,
  DiagnosticImpression,
  DiagnosticSuggestion,
  DiagnosticWorkspaceState,
  IntakeData,
  IntakeEvidenceField,
  ManualCriterionOverride,
} from './types'

const FIELD_LABELS: Partial<Record<IntakeEvidenceField, string>> = {
  chiefComplaint: 'Chief complaint',
  presentingProblems: 'Presenting problems',
  historyOfPresentIllness: 'History of present illness',
  priorTreatment: 'Prior treatment',
  medicalHistory: 'Medical history',
  suicidalIdeation: 'Suicidal ideation',
  suicideAttemptHistory: 'Suicide attempt history',
  homicidalIdeation: 'Homicidal ideation',
  psychiatricHospitalization: 'Psychiatric hospitalization',
  alcoholUse: 'Alcohol use',
  drugUse: 'Drug use',
  substanceUseHistory: 'Substance use history',
  familyPsychiatricHistory: 'Family psychiatric history',
  familyMentalEmotionalHistory: 'Family mental/emotional history',
  maritalStatus: 'Marital status',
  relationshipDescription: 'Relationship description',
  livingArrangement: 'Living arrangement',
  education: 'Education',
  occupation: 'Occupation',
  physicalSexualAbuseHistory: 'Physical/sexual abuse history',
  domesticViolenceHistory: 'Domestic violence history',
  recentSymptoms: 'Recent symptoms',
  additionalSymptoms: 'Additional symptoms',
  additionalInfo: 'Additional info',
  manualNotes: 'Clinician notes',
  rawQA: 'Raw intake Q&A',
  combinedSymptoms: 'Combined symptoms',
  combinedNarrative: 'Combined intake narrative',
}

const NEGATIVE_PATTERN = /\b(no|none|denies|denied|not really|never|negative|n\/a)\b/i
const SUBSTANCE_POSITIVE_PATTERN = /\b(daily|weekly|weekends|regular|often|frequent|binge|heavy|abuse|misuse|depend|dependent|withdrawal|craving)\b/i
const MANIA_PATTERN = /\b(manic|mania|hypomanic|euphoric|grandiose|decreased need for sleep|little sleep|pressured speech|racing thoughts|spending spree|reckless)\b/i
const TRAUMA_PATTERN = /\b(trauma|abuse|assault|violence|accident|witnessed|rape|sexual assault)\b/i

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function buildCombinedNarrative(intake: IntakeData): string {
  return [
    intake.chiefComplaint,
    intake.presentingProblems,
    intake.historyOfPresentIllness,
    intake.recentSymptoms,
    intake.additionalSymptoms,
    intake.additionalInfo,
    intake.manualNotes,
    intake.priorTreatment,
    intake.medicalHistory,
    intake.suicidalIdeation,
    intake.suicideAttemptHistory,
    intake.homicidalIdeation,
    intake.psychiatricHospitalization,
    intake.alcoholUse,
    intake.drugUse,
    intake.substanceUseHistory,
    intake.familyPsychiatricHistory,
    intake.familyMentalEmotionalHistory,
    intake.relationshipDescription,
    intake.livingArrangement,
    intake.occupation,
    intake.physicalSexualAbuseHistory,
    intake.domesticViolenceHistory,
    ...intake.rawQA.map((pair) => `${pair.question} ${pair.answer}`),
    ...(intake.phq9?.items.map((item) => `${item.question} ${item.response}`) ?? []),
    ...(intake.gad7?.items.map((item) => `${item.question} ${item.response}`) ?? []),
  ]
    .filter(Boolean)
    .join('\n')
}

function clipEvidence(value: string, max = 140): string {
  const trimmed = value.replace(/\s+/g, ' ').trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

function getFieldValues(intake: IntakeData, field: IntakeEvidenceField): string[] {
  switch (field) {
    case 'rawQA':
      return intake.rawQA
        .map((pair) => `${pair.question}: ${pair.answer}`)
        .filter(Boolean)
    case 'combinedSymptoms':
      return [intake.recentSymptoms, intake.additionalSymptoms].filter(Boolean)
    case 'combinedNarrative':
      return [buildCombinedNarrative(intake)]
    default: {
      const value = intake[field as keyof IntakeData]
      if (typeof value === 'string') return value.trim() ? [value] : []
      return []
    }
  }
}

function getAssessmentItemEvidence(
  intake: IntakeData,
  criterion: DSM5CriterionDefinition
): { evidence: string[]; sources: string[]; status: CriterionMatchStatus | null } {
  if (criterion.phqItem && intake.phq9) {
    const item = intake.phq9.items.find((candidate) => candidate.number === criterion.phqItem)
    if (item) {
      if (item.score > 0) {
        return {
          evidence: [`PHQ-9 item ${item.number}: ${item.response}`],
          sources: [`PHQ-9 item ${item.number}`],
          status: 'met',
        }
      }
      return { evidence: [], sources: [`PHQ-9 item ${item.number}`], status: 'not_met' }
    }
  }

  if (criterion.gadItem && intake.gad7) {
    const item = intake.gad7.items.find((candidate) => candidate.number === criterion.gadItem)
    if (item) {
      if (item.score > 0) {
        return {
          evidence: [`GAD-7 item ${item.number}: ${item.response}`],
          sources: [`GAD-7 item ${item.number}`],
          status: 'met',
        }
      }
      return { evidence: [], sources: [`GAD-7 item ${item.number}`], status: 'not_met' }
    }
  }

  return { evidence: [], sources: [], status: null }
}

function evaluateGenericCriterion(
  intake: IntakeData,
  criterion: DSM5CriterionDefinition
): CriterionEvaluation {
  const assessmentEvidence = getAssessmentItemEvidence(intake, criterion)
  const evidence: string[] = [...assessmentEvidence.evidence]
  const sources = [...assessmentEvidence.sources]
  const matchedKeywords: string[] = []

  for (const field of criterion.intakeFields) {
    const values = getFieldValues(intake, field)
    const label = FIELD_LABELS[field] ?? field

    for (const value of values) {
      const normalized = normalizeText(value)
      if (!normalized) continue

      if (criterion.keywords?.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
        matchedKeywords.push(...(criterion.keywords ?? []).filter((keyword) => normalized.includes(keyword.toLowerCase())))
        evidence.push(`${label}: ${clipEvidence(value)}`)
        sources.push(label)
        break
      }
    }
  }

  const uniqueEvidence = Array.from(new Set(evidence)).slice(0, 3)
  const uniqueSources = Array.from(new Set(sources))

  let status: CriterionMatchStatus = 'not_assessed'
  if (assessmentEvidence.status === 'met') {
    status = 'met'
  } else if (matchedKeywords.length >= 2) {
    status = 'met'
  } else if (matchedKeywords.length === 1) {
    status = 'likely'
  } else if (assessmentEvidence.status === 'not_met') {
    status = 'not_met'
  } else {
    const fieldTexts = criterion.intakeFields.flatMap((field) => getFieldValues(intake, field))
    const nonEmpty = fieldTexts.filter((value) => value.trim())
    if (nonEmpty.length > 0 && nonEmpty.every((value) => NEGATIVE_PATTERN.test(value))) {
      status = 'not_met'
    }
  }

  const rationale =
    status === 'met'
      ? 'Direct intake or assessment evidence supports this criterion.'
      : status === 'likely'
        ? 'There is partial narrative support, but clinician confirmation is still needed.'
        : status === 'not_met'
          ? 'Available assessment or intake responses do not support this criterion.'
          : 'The current intake packet does not provide enough evidence to decide this criterion.'

  return {
    criterionId: criterion.id,
    status,
    evidence: uniqueEvidence,
    sources: uniqueSources,
    rationale,
    followUpQuestion: criterion.followUpQuestion,
  }
}

function overrideCriterionEvaluation(
  disorder: DSM5DisorderDefinition,
  intake: IntakeData,
  criterion: DSM5CriterionDefinition,
  evaluation: CriterionEvaluation
): CriterionEvaluation {
  if (criterion.id === 'mdd.B' && intake.phq9?.difficulty) {
    if (/not difficult at all/i.test(intake.phq9.difficulty)) {
      return { ...evaluation, status: 'likely', evidence: [`PHQ-9 difficulty: ${intake.phq9.difficulty}`], sources: ['PHQ-9 impairment'], rationale: 'Symptoms are present, but the recorded functional difficulty is limited.' }
    }
    return { ...evaluation, status: 'met', evidence: [`PHQ-9 difficulty: ${intake.phq9.difficulty}`], sources: ['PHQ-9 impairment'], rationale: 'The PHQ-9 functional difficulty item suggests clinically meaningful impairment.' }
  }

  if (criterion.id === 'gad.D' && intake.gad7?.difficulty) {
    if (/not difficult at all/i.test(intake.gad7.difficulty)) {
      return { ...evaluation, status: 'likely', evidence: [`GAD-7 difficulty: ${intake.gad7.difficulty}`], sources: ['GAD-7 impairment'], rationale: 'Anxiety symptoms are present, but the recorded functional difficulty is limited.' }
    }
    return { ...evaluation, status: 'met', evidence: [`GAD-7 difficulty: ${intake.gad7.difficulty}`], sources: ['GAD-7 impairment'], rationale: 'The GAD-7 functional difficulty item suggests clinically meaningful impairment.' }
  }

  if (criterion.id === 'mdd.E' || criterion.id === 'pdd.E') {
    const maniaEvidence = buildCombinedNarrative(intake)
    if (MANIA_PATTERN.test(maniaEvidence)) {
      return {
        ...evaluation,
        status: 'not_met',
        evidence: ['Intake narrative includes possible manic/hypomanic language.'],
        sources: ['Combined intake narrative'],
        rationale: 'Possible manic or hypomanic history blocks automatic satisfaction of this exclusion criterion.',
      }
    }
    return {
      ...evaluation,
      status: 'unclear',
      evidence: [],
      sources: [],
      rationale: 'Absence of mania/hypomania usually requires direct clinical review rather than intake inference alone.',
    }
  }

  if ((criterion.id === 'bipolar_i.A' || criterion.id === 'bipolar_ii.A') && evaluation.status === 'not_assessed') {
    if (/bipolar/i.test(`${intake.familyPsychiatricHistory} ${intake.familyMentalEmotionalHistory}`)) {
      return {
        ...evaluation,
        status: 'likely',
        evidence: ['Family history references bipolar spectrum illness.'],
        sources: ['Family psychiatric history'],
        rationale: 'Family history raises bipolar differential concern, but a lifetime hypomanic/manic history still needs direct confirmation.',
      }
    }
  }

  if (criterion.id === 'ptsd.A' || criterion.id === 'acute_stress.A') {
    const traumaText = [
      intake.physicalSexualAbuseHistory,
      intake.domesticViolenceHistory,
      buildCombinedNarrative(intake),
    ].join('\n')
    if (TRAUMA_PATTERN.test(traumaText)) {
      return {
        ...evaluation,
        status: 'met',
        evidence: evaluation.evidence.length ? evaluation.evidence : ['Trauma exposure language appears in intake history.'],
        sources: evaluation.sources.length ? evaluation.sources : ['Trauma history'],
        rationale: 'The intake packet documents trauma exposure relevant to this criterion.',
      }
    }
  }

  if ((criterion.id === 'alcohol_use.A.10' || criterion.id === 'alcohol_use.A.11' || criterion.id === 'cannabis_use.A.10' || criterion.id === 'cannabis_use.A.11') && evaluation.status === 'not_assessed') {
    return {
      ...evaluation,
      status: 'unclear',
      rationale: 'Tolerance and withdrawal usually require direct questioning and are not reliably inferred from routine intake data.',
    }
  }

  if ((criterion.id === 'mdd.C' || criterion.id === 'gad.E' || criterion.id === 'ptsd.H' || criterion.id === 'acute_stress.E') && evaluation.status === 'not_assessed') {
    return {
      ...evaluation,
      status: 'unclear',
      rationale: 'Substance and medical exclusions generally require clinician review rather than passive intake inference.',
    }
  }

  if ((criterion.id === 'alcohol_use.A.1' || criterion.id === 'cannabis_use.A.1') && evaluation.status === 'not_assessed') {
    const substanceText = `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory}`.trim()
    if (SUBSTANCE_POSITIVE_PATTERN.test(substanceText)) {
      return {
        ...evaluation,
        status: 'likely',
        evidence: [clipEvidence(substanceText)],
        sources: ['Substance use history'],
        rationale: 'Frequency or intensity language suggests the use pattern may exceed intended or casual use.',
      }
    }
  }

  return evaluation
}

function evaluateDisorder(disorder: DSM5DisorderDefinition, intake: IntakeData): CriterionEvaluation[] {
  return disorder.criteria.map((criterion) => {
    const generic = evaluateGenericCriterion(intake, criterion)
    return overrideCriterionEvaluation(disorder, intake, criterion, generic)
  })
}

function isPositive(status: CriterionMatchStatus): boolean {
  return status === 'met' || status === 'likely'
}

function countStatuses(criteria: CriterionEvaluation[], prefix: string): { met: number; positive: number } {
  return criteria.reduce(
    (acc, evaluation) => {
      if (!evaluation.criterionId.startsWith(prefix)) return acc
      if (evaluation.status === 'met') acc.met += 1
      if (isPositive(evaluation.status)) acc.positive += 1
      return acc
    },
    { met: 0, positive: 0 }
  )
}

function determineConfidence(score: number): DiagnosticSuggestion['confidence'] {
  if (score >= 11) return 'high'
  if (score >= 5) return 'moderate'
  return 'low'
}

function determineMddSpecifier(intake: IntakeData): string | undefined {
  const score = intake.phq9?.totalScore ?? 0
  if (!score) return undefined
  if (score >= 20) return 'Severe'
  if (score >= 15) return 'Moderately severe'
  if (score >= 10) return 'Moderate'
  if (score >= 5) return 'Mild'
  return undefined
}

function determineSubstanceSpecifier(positiveCount: number): string | undefined {
  if (positiveCount >= 6) return 'Severe'
  if (positiveCount >= 4) return 'Moderate'
  if (positiveCount >= 2) return 'Mild'
  return undefined
}

function summarizeRequirement(
  disorder: DSM5DisorderDefinition,
  criteria: CriterionEvaluation[]
): number {
  if (disorder.requiredCounts.length) {
    return disorder.requiredCounts.reduce((sum, item) => sum + item.required, 0)
  }
  return criteria.filter((criterion) => !criterion.criterionId.match(/\.\d+$/)).length || criteria.length
}

function scoreDisorder(
  disorder: DSM5DisorderDefinition,
  intake: IntakeData,
  criteria: CriterionEvaluation[]
): Pick<DiagnosticSuggestion, 'confidence' | 'reason' | 'score' | 'suggestedSpecifier'> {
  const positiveCount = criteria.filter((criterion) => isPositive(criterion.status)).length
  const metCount = criteria.filter((criterion) => criterion.status === 'met').length
  const combinedNarrative = buildCombinedNarrative(intake)

  switch (disorder.id) {
    case 'mdd': {
      const countA = countStatuses(criteria, 'mdd.A.')
      const hasCore = isPositive(criteria.find((criterion) => criterion.criterionId === 'mdd.A.1')?.status ?? 'not_assessed') ||
        isPositive(criteria.find((criterion) => criterion.criterionId === 'mdd.A.2')?.status ?? 'not_assessed')
      const phq = intake.phq9?.totalScore ?? 0
      const score = countA.met * 2 + countA.positive + (hasCore ? 2 : 0) + Math.floor(phq / 5)
      const reason = phq
        ? `PHQ-9 ${phq}/27 with ${countA.positive} depressive symptom criteria supported.`
        : `${countA.positive} depressive symptom criteria are supported by intake text.`
      const confidence =
        phq >= 15 && countA.positive >= 5 && hasCore
          ? 'high'
          : phq >= 10 || countA.positive >= 4
            ? 'moderate'
            : 'low'
      return { confidence, reason, score, suggestedSpecifier: determineMddSpecifier(intake) }
    }
    case 'gad': {
      const countC = countStatuses(criteria, 'gad.C.')
      const gad = intake.gad7?.totalScore ?? 0
      const score = countC.met * 2 + countC.positive + Math.floor(gad / 5)
      const reason = gad
        ? `GAD-7 ${gad}/21 with ${countC.positive} core anxiety criteria supported.`
        : `${countC.positive} core anxiety criteria are supported by intake text.`
      const confidence =
        gad >= 15 && countC.positive >= 3
          ? 'high'
          : gad >= 10 || countC.positive >= 3
            ? 'moderate'
            : 'low'
      return { confidence, reason, score, suggestedSpecifier: undefined }
    }
    case 'ptsd': {
      const b = countStatuses(criteria, 'ptsd.B.')
      const c = countStatuses(criteria, 'ptsd.C.')
      const d = countStatuses(criteria, 'ptsd.D.')
      const e = countStatuses(criteria, 'ptsd.E.')
      const trauma = criteria.find((criterion) => criterion.criterionId === 'ptsd.A')?.status
      const traumaScore = isPositive(trauma ?? 'not_assessed') ? 3 : 0
      const score = traumaScore + b.positive + c.positive + d.positive + e.positive
      const confidence =
        trauma === 'met' && b.positive >= 1 && c.positive >= 1 && d.positive >= 2 && e.positive >= 2
          ? 'high'
          : traumaScore > 0 && score >= 5
            ? 'moderate'
            : 'low'
      return {
        confidence,
        score,
        reason: traumaScore
          ? `Trauma exposure is documented with ${b.positive + c.positive + d.positive + e.positive} PTSD symptom criteria supported.`
          : 'PTSD remains a differential only if trauma exposure is later confirmed.',
        suggestedSpecifier: undefined,
      }
    }
    case 'acute_stress_disorder': {
      const b = countStatuses(criteria, 'acute_stress.B.')
      const trauma = criteria.find((criterion) => criterion.criterionId === 'acute_stress.A')?.status
      const score = (isPositive(trauma ?? 'not_assessed') ? 3 : 0) + b.positive
      const confidence =
        trauma === 'met' && b.positive >= 9
          ? 'high'
          : trauma && isPositive(trauma) && b.positive >= 5
            ? 'moderate'
            : 'low'
      return {
        confidence,
        score,
        reason: isPositive(trauma ?? 'not_assessed')
          ? `Acute trauma exposure is documented with ${b.positive} acute stress symptoms supported.`
          : 'Acute stress disorder depends on recent trauma exposure and symptom timing.',
        suggestedSpecifier: undefined,
      }
    }
    case 'panic_disorder': {
      const attackSymptoms = countStatuses(criteria, 'panic.A.')
      const aftermath = countStatuses(criteria, 'panic.B.')
      const score = attackSymptoms.positive + aftermath.positive * 2
      return {
        confidence:
          attackSymptoms.positive >= 4 && aftermath.positive >= 1
            ? 'moderate'
            : attackSymptoms.positive >= 3
              ? 'low'
              : 'low',
        score,
        reason: attackSymptoms.positive
          ? `${attackSymptoms.positive} panic attack symptoms are supported by intake text.`
          : 'No strong panic-attack language is present in the intake packet.',
        suggestedSpecifier: undefined,
      }
    }
    case 'social_anxiety_disorder': {
      const score = positiveCount
      return {
        confidence: positiveCount >= 5 ? 'moderate' : 'low',
        score,
        reason: positiveCount
          ? `${positiveCount} social anxiety criteria are supported by narrative intake text.`
          : 'Only minimal social-anxiety evidence appears in the intake packet.',
        suggestedSpecifier: undefined,
      }
    }
    case 'ocd': {
      const score = positiveCount
      return {
        confidence: positiveCount >= 4 ? 'moderate' : 'low',
        score,
        reason: positiveCount
          ? `${positiveCount} obsession/compulsion criteria are supported by intake text.`
          : 'Only limited obsession/compulsion evidence appears in the intake packet.',
        suggestedSpecifier: undefined,
      }
    }
    case 'adjustment_disorder': {
      const score = positiveCount + (/\b(breakup|divorce|job loss|recent loss|stress|moved|financial)\b/i.test(combinedNarrative) ? 2 : 0)
      return {
        confidence: score >= 5 ? 'moderate' : 'low',
        score,
        reason: /\b(breakup|divorce|job loss|recent loss|stress|moved|financial)\b/i.test(combinedNarrative)
          ? 'Intake text describes an identifiable stressor with emotional impact.'
          : 'Adjustment disorder depends on clarifying the temporal link to a stressor.',
        suggestedSpecifier: /\b(anxious|worry|panic)\b/i.test(combinedNarrative)
          ? 'With anxiety'
          : /\b(sad|depressed|hopeless)\b/i.test(combinedNarrative)
            ? 'With depressed mood'
            : undefined,
      }
    }
    case 'adhd': {
      const inattentive = countStatuses(criteria, 'adhd.A1.')
      const hyper = countStatuses(criteria, 'adhd.A2.')
      const score = inattentive.positive + hyper.positive + (criteria.find((criterion) => criterion.criterionId === 'adhd.B')?.status === 'met' ? 2 : 0)
      let suggestedSpecifier: string | undefined
      if (inattentive.positive >= 6 && hyper.positive >= 6) suggestedSpecifier = 'Combined presentation'
      else if (inattentive.positive >= 6) suggestedSpecifier = 'Predominantly inattentive presentation'
      else if (hyper.positive >= 6) suggestedSpecifier = 'Predominantly hyperactive/impulsive presentation'

      return {
        confidence:
          (inattentive.positive >= 6 || hyper.positive >= 6) && score >= 8
            ? 'moderate'
            : 'low',
        score,
        reason: score
          ? `${inattentive.positive} inattentive and ${hyper.positive} hyperactive/impulsive criteria have supporting narrative evidence.`
          : 'ADHD remains a differential only if childhood onset and cross-setting symptoms are later confirmed.',
        suggestedSpecifier,
      }
    }
    case 'bipolar_i': {
      const maniaSymptoms = countStatuses(criteria, 'bipolar_i.B.')
      const manicEpisode = criteria.find((criterion) => criterion.criterionId === 'bipolar_i.A')?.status
      const hospitalization = criteria.find((criterion) => criterion.criterionId === 'bipolar_i.C')?.status
      const familyBipolar = /\bbipolar\b/i.test(`${intake.familyPsychiatricHistory} ${intake.familyMentalEmotionalHistory}`)
      const score = maniaSymptoms.positive + (isPositive(manicEpisode ?? 'not_assessed') ? 3 : 0) + (isPositive(hospitalization ?? 'not_assessed') ? 2 : 0) + (familyBipolar ? 1 : 0)
      return {
        confidence:
          isPositive(manicEpisode ?? 'not_assessed') && maniaSymptoms.positive >= 3
            ? 'moderate'
            : familyBipolar && (intake.phq9?.totalScore ?? 0) >= 10
              ? 'low'
              : 'low',
        score,
        reason: score
          ? 'Possible manic-spectrum history or family bipolar history warrants bipolar I review.'
          : 'No strong manic-spectrum evidence appears in the intake packet.',
        suggestedSpecifier: undefined,
      }
    }
    case 'bipolar_ii': {
      const familyBipolar = /\bbipolar\b/i.test(`${intake.familyPsychiatricHistory} ${intake.familyMentalEmotionalHistory}`)
      const score = positiveCount + (familyBipolar ? 1 : 0) + ((intake.phq9?.totalScore ?? 0) >= 10 ? 2 : 0)
      return {
        confidence:
          (criteria.find((criterion) => criterion.criterionId === 'bipolar_ii.A')?.status === 'met' && criteria.find((criterion) => criterion.criterionId === 'bipolar_ii.B')?.status === 'met')
            ? 'moderate'
            : familyBipolar && (intake.phq9?.totalScore ?? 0) >= 10
              ? 'low'
              : 'low',
        score,
        reason: score
          ? 'Depressive burden with possible hypomanic history or family bipolar history warrants bipolar II review.'
          : 'No strong bipolar II evidence appears in the intake packet.',
        suggestedSpecifier: undefined,
      }
    }
    case 'alcohol_use_disorder': {
      const score = positiveCount + (SUBSTANCE_POSITIVE_PATTERN.test(intake.alcoholUse) ? 2 : 0)
      return {
        confidence: positiveCount >= 4 ? 'moderate' : positiveCount >= 2 ? 'low' : 'low',
        score,
        reason: intake.alcoholUse.trim()
          ? `Alcohol history suggests ${positiveCount} alcohol-use criteria may be present.`
          : 'No meaningful alcohol-use narrative is present in the intake packet.',
        suggestedSpecifier: determineSubstanceSpecifier(criteria.filter((criterion) => isPositive(criterion.status)).length),
      }
    }
    case 'cannabis_use_disorder': {
      const score = positiveCount + (SUBSTANCE_POSITIVE_PATTERN.test(intake.drugUse) || /\b(cannabis|marijuana|weed|thc)\b/i.test(intake.drugUse) ? 2 : 0)
      return {
        confidence: positiveCount >= 4 ? 'moderate' : positiveCount >= 2 ? 'low' : 'low',
        score,
        reason: `${positiveCount} cannabis-use criteria have supporting narrative evidence.`,
        suggestedSpecifier: determineSubstanceSpecifier(criteria.filter((criterion) => isPositive(criterion.status)).length),
      }
    }
    case 'borderline_personality_disorder': {
      const score = positiveCount + (/self-harm|cutting|abandonment|unstable relationship|empty|rage/i.test(combinedNarrative) ? 2 : 0)
      return {
        confidence: positiveCount >= 5 ? 'moderate' : positiveCount >= 3 ? 'low' : 'low',
        score,
        reason: positiveCount
          ? `${positiveCount} borderline personality features have narrative support and warrant structured review.`
          : 'No strong borderline personality feature cluster appears in the intake packet.',
        suggestedSpecifier: undefined,
      }
    }
    default:
      return {
        confidence: determineConfidence(metCount * 2 + positiveCount),
        reason: `${positiveCount} criteria have narrative or assessment support.`,
        score: metCount * 2 + positiveCount,
        suggestedSpecifier: undefined,
      }
  }
}

export function getDiagnosticSuggestions(intake: IntakeData): DiagnosticSuggestion[] {
  return DSM5_DISORDERS.map((disorder) => {
    const criteria = evaluateDisorder(disorder, intake)
    const scoring = scoreDisorder(disorder, intake, criteria)
    return {
      disorderId: disorder.id,
      disorderName: disorder.name,
      code: disorder.icd10Codes[0] ?? '',
      confidence: scoring.confidence,
      reason: scoring.reason,
      score: scoring.score,
      criteria,
      metCount: criteria.filter((criterion) => criterion.status === 'met').length,
      likelyCount: criteria.filter((criterion) => criterion.status === 'likely').length,
      unresolvedCount: criteria.filter((criterion) => criterion.status === 'unclear' || criterion.status === 'not_assessed').length,
      requiredCount: summarizeRequirement(disorder, criteria),
      suggestedSpecifier: scoring.suggestedSpecifier,
      ruleOuts: disorder.ruleOuts,
    }
  }).sort((a, b) => b.score - a.score || b.metCount - a.metCount || a.disorderName.localeCompare(b.disorderName))
}

export function findSuggestion(
  suggestions: DiagnosticSuggestion[],
  disorderId: string
): DiagnosticSuggestion | undefined {
  return suggestions.find((suggestion) => suggestion.disorderId === disorderId)
}

export function getOverride(
  workspace: DiagnosticWorkspaceState | null | undefined,
  disorderId: string,
  criterionId: string
): ManualCriterionOverride | undefined {
  return workspace?.overrides.find((override) => override.disorderId === disorderId && override.criterionId === criterionId)
}

export function getEffectiveCriterionStatus(
  workspace: DiagnosticWorkspaceState | null | undefined,
  disorderId: string,
  evaluation: CriterionEvaluation
): CriterionMatchStatus {
  return getOverride(workspace, disorderId, evaluation.criterionId)?.status ?? evaluation.status
}

export function getDisorderNotes(
  workspace: DiagnosticWorkspaceState | null | undefined,
  disorderId: string
): string {
  return workspace?.disorderNotes.find((entry) => entry.disorderId === disorderId)?.notes ?? ''
}

function buildCriteriaSummary(
  disorder: DSM5DisorderDefinition,
  criteria: CriterionEvaluation[],
  workspace: DiagnosticWorkspaceState | null | undefined
): string[] {
  if (disorder.requiredCounts.length === 0) {
    const met = criteria.filter((criterion) => getEffectiveCriterionStatus(workspace, disorder.id, criterion) === 'met').length
    const likely = criteria.filter((criterion) => getEffectiveCriterionStatus(workspace, disorder.id, criterion) === 'likely').length
    return [`${met} criteria marked met and ${likely} marked likely after clinician review.`]
  }

  return disorder.requiredCounts.map((requirement) => {
    const relevant = criteria.filter((criterion) => criterion.criterionId.startsWith(`${disorder.id}.${requirement.criterion}`) || criterion.criterionId.startsWith(requirement.criterion))
    const positive = relevant.filter((criterion) => isPositive(getEffectiveCriterionStatus(workspace, disorder.id, criterion))).length
    const mustIncludeMet = requirement.mustInclude
      ? requirement.mustInclude.some((criterionId) => isPositive(getEffectiveCriterionStatus(workspace, disorder.id, criteria.find((criterion) => criterion.criterionId === criterionId) ?? {
          criterionId,
          status: 'not_assessed',
          evidence: [],
          sources: [],
          rationale: '',
          followUpQuestion: '',
        })))
      : true
    return `${requirement.criterion}: ${positive}/${requirement.total} met or likely${requirement.mustInclude ? `; core requirement ${mustIncludeMet ? 'present' : 'not yet confirmed'}` : ''}.`
  })
}

function buildEvidenceSummary(
  disorderId: string,
  criteria: CriterionEvaluation[],
  workspace: DiagnosticWorkspaceState | null | undefined
): string[] {
  return criteria
    .filter((criterion) => isPositive(getEffectiveCriterionStatus(workspace, disorderId, criterion)))
    .slice(0, 6)
    .map((criterion) => {
      const detail = criterion.evidence[0] ?? criterion.rationale
      return `${criterion.criterionId}: ${detail}`
    })
}

export function buildDiagnosticImpressions(
  intake: IntakeData,
  suggestions: DiagnosticSuggestion[],
  workspace: DiagnosticWorkspaceState | null | undefined
): DiagnosticImpression[] {
  const selectedIds = workspace?.pinnedDisorderIds.length
    ? workspace.pinnedDisorderIds
    : workspace?.activeDisorderId
      ? [workspace.activeDisorderId]
      : []

  if (!selectedIds.length) return []

  return selectedIds
    .map((disorderId) => {
      const suggestion = findSuggestion(suggestions, disorderId)
      const disorder = DSM5_DISORDER_MAP[disorderId]
      if (!suggestion || !disorder) return null

      const name = suggestion.suggestedSpecifier
        ? `${suggestion.disorderName} — ${suggestion.suggestedSpecifier}`
        : suggestion.disorderName

      return {
        disorderId,
        code: suggestion.code,
        name,
        confidence: suggestion.confidence,
        criteriaEvidence: buildEvidenceSummary(disorderId, suggestion.criteria, workspace),
        criteriaSummary: buildCriteriaSummary(disorder, suggestion.criteria, workspace),
        ruleOuts: suggestion.ruleOuts,
        clinicianNotes: getDisorderNotes(workspace, disorderId) || undefined,
      }
    })
    .filter((impression): impression is DiagnosticImpression => impression !== null)
}

export function getAvailableDiagnosisOptions(
  workspace: DiagnosticWorkspaceState | null | undefined
): DSM5DisorderDefinition[] {
  const pinned = new Set(workspace?.pinnedDisorderIds ?? [])
  return DSM5_DISORDERS.filter((disorder) => !pinned.has(disorder.id))
}
