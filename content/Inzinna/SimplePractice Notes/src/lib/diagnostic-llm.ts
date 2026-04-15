/**
 * Two-pass RAG diagnostic suggester.
 *
 * Pass 1: LLM picks 3-5 candidate disorder IDs from a roster of 161 DSM-5-TR
 *         disorders (dsm5-criteria-v2.ts) using the de-identified intake.
 * Pass 2: For each candidate, send the real DSM criteria text back to the LLM
 *         for criterion-by-criterion evaluation (met / likely / unclear / not_met)
 *         with a one-sentence evidence snippet per criterion.
 *
 * Why two passes: grounds the LLM in DSM-5-TR source text to prevent the kind
 * of hallucinations (e.g. wrong duration thresholds) observed in a single-shot
 * unguided call, while still letting the LLM navigate 161 disorders.
 *
 * PHI never leaves the device unaddressed — intake is routed through
 * deidentify() before the API call and reidentify() on the way back.
 */

import { DSM5_DIAGNOSES_V2, type DSM5DiagnosisCriteriaV2 } from '../data/dsm5-criteria-v2'
import { deidentify, reidentify } from './deidentify'
import { generateOpenAICompletionSync } from './openai-client'
import type { DiagnosticConfidence, IntakeData } from './types'

export type LLMCriterionStatus = 'met' | 'likely' | 'unclear' | 'not_met'

export interface LLMCriterionEval {
  letter: string
  criterionText: string
  status: LLMCriterionStatus
  evidence: string
}

export interface LLMDiagnosticSuggestion {
  disorderId: string
  disorderName: string
  code?: string
  chapter: string
  confidence: DiagnosticConfidence
  reasoning: string
  criteriaEval: LLMCriterionEval[]
  ruleOuts: string[]
}

export interface LLMDiagnosticOptions {
  apiKey: string
  model?: string
  onProgress?: (msg: string) => void
  /** Cap criteria text per disorder before sending to pass 2 (chars). */
  maxCriteriaChars?: number
}

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_MAX_CRITERIA_CHARS = 4000

const PICK_SYSTEM = `You are a licensed clinical psychologist doing DSM-5-TR differential diagnosis from an intake packet.

You will receive:
1. Patient intake + SimplePractice AI note content (de-identified; names and dates replaced with tokens).
2. A roster of 161 DSM-5-TR disorders (id, name, chapter, ICD-10 code).

Pick 3-5 disorders that best fit this presentation. Return strict JSON only:

{
  "candidates": [
    { "disorderId": "<exact id from roster>", "confidence": "high" | "moderate" | "low", "reasoning": "<one sentence>" }
  ]
}

Hard rules:
- Only use disorderIds that appear in the roster. No inventions.
- Do NOT diagnose from a single symptom. Require a coherent clinical pattern.
- Cap at 5 candidates. Prefer fewer strong picks over many weak ones.
- If the intake suggests a medical workup is still relevant (sexual, somatic, neurologic), you may still list the disorder — note rule-outs in the reasoning.
- If trauma-related symptoms are present but trauma exposure is not clearly documented, do NOT include PTSD.
- Respond with JSON only. No prose outside the JSON. No markdown fences.`

const MATCH_SYSTEM = `You are a licensed clinical psychologist doing DSM-5-TR criterion-by-criterion evaluation.

You will receive:
1. Patient intake + AI note content (de-identified).
2. A short list of candidate disorders, each with verbatim DSM-5-TR criteria text.

For each disorder, evaluate each lettered criterion (A, B, C, …) and return strict JSON only:

{
  "results": [
    {
      "disorderId": "<id>",
      "confidence": "high" | "moderate" | "low",
      "reasoning": "<2-3 sentences synthesizing the evidence>",
      "criteriaEval": [
        {
          "letter": "A",
          "criterionText": "<short paraphrase or first sentence of the criterion, <= 160 chars>",
          "status": "met" | "likely" | "unclear" | "not_met",
          "evidence": "<one sentence from intake, <= 200 chars, or 'No evidence in intake'>"
        }
      ],
      "ruleOuts": ["<differential 1>", "<differential 2>"]
    }
  ]
}

Status rules:
- "met": direct intake or assessment evidence clearly satisfies the criterion.
- "likely": partial or inferred evidence; needs clinician confirmation.
- "unclear": intake is silent; a direct question is needed.
- "not_met": intake contradicts, denies, or fails a required threshold.

Do NOT hallucinate durations or thresholds. If the DSM criterion requires "6 months or more" and the intake says "4 months", mark the duration criterion "not_met" (or "unclear" if duration is not stated).

Confidence calibration:
- "high" requires the majority of required criteria rated "met" with supporting evidence.
- "moderate" requires most criteria met or likely with minor gaps.
- "low" is appropriate when trauma exposure, duration, or functional impairment is unclear.

Respond with JSON only. No prose outside the JSON. No markdown fences.`

function formatAssessment(
  label: string,
  assessment: IntakeData['phq9'] | IntakeData['gad7'] | IntakeData['cssrs'] | IntakeData['dass21'],
  maxScore?: number
): string | null {
  if (!assessment) return null
  const score = maxScore ? `${assessment.totalScore}/${maxScore}` : `${assessment.totalScore}`
  const sev = assessment.severity ? ` (${assessment.severity})` : ''
  const diff = assessment.difficulty ? `, impairment: ${assessment.difficulty}` : ''
  return `${label}: ${score}${sev}${diff}`
}

function buildIntakeNarrative(intake: IntakeData): string {
  const parts: string[] = []
  // Age is not a typed field on IntakeData, but some fixtures add it; pass through if present.
  const age = (intake as unknown as { age?: number | string }).age
  if (age) parts.push(`Age: ${age}`)
  if (intake.sex) parts.push(`Sex: ${intake.sex}`)
  if (intake.genderIdentity) parts.push(`Gender identity: ${intake.genderIdentity}`)
  if (intake.chiefComplaint) parts.push(`Chief complaint: ${intake.chiefComplaint}`)
  if (intake.presentingProblems) parts.push(`Presenting problems: ${intake.presentingProblems}`)
  if (intake.historyOfPresentIllness) parts.push(`HPI: ${intake.historyOfPresentIllness}`)
  if (intake.medicalHistory) parts.push(`Medical history: ${intake.medicalHistory}`)
  if (intake.priorTreatment) parts.push(`Prior mental-health treatment: ${intake.priorTreatment}`)
  if (intake.counselingGoals) parts.push(`Counseling goals: ${intake.counselingGoals}`)
  if (intake.suicidalIdeation) parts.push(`SI: ${intake.suicidalIdeation}`)
  if (intake.suicideAttemptHistory) parts.push(`Suicide attempt history: ${intake.suicideAttemptHistory}`)
  if (intake.homicidalIdeation) parts.push(`HI: ${intake.homicidalIdeation}`)
  if (intake.psychiatricHospitalization) parts.push(`Psychiatric hospitalization: ${intake.psychiatricHospitalization}`)
  if (intake.alcoholUse) parts.push(`Alcohol use: ${intake.alcoholUse}`)
  if (intake.drugUse) parts.push(`Drug use: ${intake.drugUse}`)
  if (intake.substanceUseHistory) parts.push(`Substance use history: ${intake.substanceUseHistory}`)
  if (intake.familyPsychiatricHistory) parts.push(`Family psychiatric history: ${intake.familyPsychiatricHistory}`)
  if (intake.familyMentalEmotionalHistory) parts.push(`Family mental/emotional history: ${intake.familyMentalEmotionalHistory}`)
  if (intake.maritalStatus) parts.push(`Marital status: ${intake.maritalStatus}`)
  if (intake.relationshipDescription) parts.push(`Relationship: ${intake.relationshipDescription}`)
  if (intake.livingArrangement) parts.push(`Living arrangement: ${intake.livingArrangement}`)
  if (intake.education) parts.push(`Education: ${intake.education}`)
  if (intake.occupation) parts.push(`Occupation: ${intake.occupation}`)
  if (intake.physicalSexualAbuseHistory) parts.push(`Physical/sexual abuse history: ${intake.physicalSexualAbuseHistory}`)
  if (intake.domesticViolenceHistory) parts.push(`Domestic violence history: ${intake.domesticViolenceHistory}`)
  if (intake.recentSymptoms) parts.push(`Recent symptoms: ${intake.recentSymptoms}`)
  if (intake.additionalSymptoms) parts.push(`Additional symptoms: ${intake.additionalSymptoms}`)
  if (intake.additionalInfo) parts.push(`Additional info / MSE: ${intake.additionalInfo}`)
  if (intake.overviewClinicalNote) parts.push(`Overview clinical note: ${intake.overviewClinicalNote}`)
  if (intake.manualNotes) parts.push(`Clinician manual notes: ${intake.manualNotes}`)

  const phq = formatAssessment('PHQ-9', intake.phq9, 27)
  if (phq) parts.push(phq)
  const gad = formatAssessment('GAD-7', intake.gad7, 21)
  if (gad) parts.push(gad)
  const cssrs = formatAssessment('C-SSRS', intake.cssrs)
  if (cssrs) parts.push(cssrs)
  const dass21 = formatAssessment('DASS-21', intake.dass21, 63)
  if (dass21) parts.push(dass21)

  if (intake.phq9?.items?.length) {
    const items = intake.phq9.items
      .filter((item) => item.score > 0)
      .map((item) => `  - item ${item.number}: ${item.question.trim()} — ${item.response}`)
    if (items.length) parts.push(`PHQ-9 endorsed items:\n${items.join('\n')}`)
  }
  if (intake.gad7?.items?.length) {
    const items = intake.gad7.items
      .filter((item) => item.score > 0)
      .map((item) => `  - item ${item.number}: ${item.question.trim()} — ${item.response}`)
    if (items.length) parts.push(`GAD-7 endorsed items:\n${items.join('\n')}`)
  }

  if (intake.rawQA?.length) {
    const bits = intake.rawQA
      .filter((p) => p.answer?.trim())
      .map((p) => `  - ${p.question}: ${p.answer}`)
    if (bits.length) parts.push(`Raw intake Q&A:\n${bits.join('\n')}`)
  }

  return parts.join('\n')
}

function buildDisorderRoster(): string {
  return DSM5_DIAGNOSES_V2.map((d) => {
    const icd = d.icd10Code ? ` | ${d.icd10Code}` : ''
    return `- ${d.id} | ${d.name} | ${d.chapter}${icd}`
  }).join('\n')
}

function clipCriteria(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}\n... [truncated]`
}

function extractJson(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  try {
    return JSON.parse(stripped)
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

interface PickResult {
  candidates?: Array<{ disorderId?: string; confidence?: DiagnosticConfidence; reasoning?: string }>
}

interface MatchResult {
  results?: Array<{
    disorderId?: string
    confidence?: DiagnosticConfidence
    reasoning?: string
    criteriaEval?: Array<{
      letter?: string
      criterionText?: string
      status?: LLMCriterionStatus
      evidence?: string
    }>
    ruleOuts?: string[]
  }>
}

function sanitizeConfidence(value: unknown): DiagnosticConfidence {
  if (value === 'high' || value === 'moderate' || value === 'low') return value
  return 'low'
}

function sanitizeStatus(value: unknown): LLMCriterionStatus {
  if (value === 'met' || value === 'likely' || value === 'unclear' || value === 'not_met') return value
  return 'unclear'
}

/**
 * Run the two-pass RAG diagnostic suggester.
 *
 * Throws on API/network failure or unparseable LLM output. The sidepanel
 * should catch and fall back to the rules-based engine output.
 */
export async function getLLMDiagnosticSuggestions(
  intake: IntakeData,
  opts: LLMDiagnosticOptions
): Promise<LLMDiagnosticSuggestion[]> {
  if (!opts.apiKey) throw new Error('OpenAI API key is required')

  const model = opts.model || DEFAULT_MODEL
  const maxCriteriaChars = opts.maxCriteriaChars ?? DEFAULT_MAX_CRITERIA_CHARS
  const progress = opts.onProgress ?? (() => {})

  // Build a single narrative string, then de-identify once so pass 1 and pass 2
  // share the same token mapping for clean re-identification.
  const narrative = buildIntakeNarrative(intake)
  const { sanitized, mapping } = deidentify(narrative, intake)

  // ================= Pass 1: candidate picking =================
  progress('Pass 1: picking candidate disorders...')
  const roster = buildDisorderRoster()
  const pickUser = `=== PATIENT INTAKE (de-identified) ===
${sanitized}

=== DSM-5-TR DISORDER ROSTER (${DSM5_DIAGNOSES_V2.length} entries) ===
${roster}

Return JSON with 3-5 candidate disorderIds from the roster above.`

  const pickRaw = await generateOpenAICompletionSync(pickUser, PICK_SYSTEM, model, opts.apiKey)
  const pickJson = extractJson(pickRaw) as PickResult | null
  const candidates = (pickJson?.candidates ?? []).filter(
    (c): c is { disorderId: string; confidence?: DiagnosticConfidence; reasoning?: string } =>
      typeof c?.disorderId === 'string' && c.disorderId.length > 0
  )

  if (!candidates.length) {
    throw new Error(`Pass 1 returned no candidates. Raw output: ${pickRaw.slice(0, 300)}`)
  }

  const candidateEntries = candidates
    .map((c) => {
      const disorder = DSM5_DIAGNOSES_V2.find((d) => d.id === c.disorderId)
      return disorder ? { candidate: c, disorder } : null
    })
    .filter((x): x is { candidate: typeof candidates[number]; disorder: DSM5DiagnosisCriteriaV2 } => x !== null)

  if (!candidateEntries.length) {
    throw new Error(`Pass 1 returned candidates but none matched the v2 roster: ${candidates.map((c) => c.disorderId).join(', ')}`)
  }

  progress(`Pass 1 got ${candidateEntries.length} matched candidates: ${candidateEntries.map((e) => e.disorder.id).join(', ')}`)

  // ================= Pass 2: criterion matching =================
  const disordersSection = candidateEntries
    .map(
      (e) => `=== ${e.disorder.id} — ${e.disorder.name}${e.disorder.icd10Code ? ' (' + e.disorder.icd10Code + ')' : ''} ===
${clipCriteria(e.disorder.criteriaText, maxCriteriaChars)}`
    )
    .join('\n\n')

  const matchUser = `=== PATIENT INTAKE (de-identified) ===
${sanitized}

=== CANDIDATE DISORDERS WITH DSM-5-TR CRITERIA ===
${disordersSection}

Evaluate each disorder criterion-by-criterion. Return JSON matching the schema in the system prompt.`

  progress('Pass 2: evaluating criteria...')
  const matchRaw = await generateOpenAICompletionSync(matchUser, MATCH_SYSTEM, model, opts.apiKey)
  const matchJson = extractJson(matchRaw) as MatchResult | null
  const rawResults = matchJson?.results ?? []

  if (!rawResults.length) {
    throw new Error(`Pass 2 returned no results. Raw output: ${matchRaw.slice(0, 300)}`)
  }

  const suggestions: LLMDiagnosticSuggestion[] = []
  for (const r of rawResults) {
    if (!r.disorderId) continue
    const entry = candidateEntries.find((e) => e.disorder.id === r.disorderId)
    if (!entry) continue

    const criteriaEval: LLMCriterionEval[] = (r.criteriaEval ?? []).map((c) => ({
      letter: typeof c.letter === 'string' ? c.letter : '',
      criterionText: reidentify(typeof c.criterionText === 'string' ? c.criterionText : '', mapping),
      status: sanitizeStatus(c.status),
      evidence: reidentify(typeof c.evidence === 'string' ? c.evidence : '', mapping),
    }))

    suggestions.push({
      disorderId: r.disorderId,
      disorderName: entry.disorder.name,
      code: entry.disorder.icd10Code,
      chapter: entry.disorder.chapter,
      confidence: sanitizeConfidence(r.confidence),
      reasoning: reidentify(typeof r.reasoning === 'string' ? r.reasoning : '', mapping),
      criteriaEval,
      ruleOuts: Array.isArray(r.ruleOuts) ? r.ruleOuts.filter((x): x is string => typeof x === 'string') : [],
    })
  }

  if (!suggestions.length) {
    throw new Error('Pass 2 returned results but none could be mapped to candidates')
  }

  progress(`Done: ${suggestions.length} suggestions`)
  return suggestions
}
