/**
 * Supervision prep generation orchestrator.
 * Provider chain: OpenAI (de-ID → cloud → re-ID) → Ollama → rule-based fallback.
 * OpenAI path de-identifies PHI before sending, re-identifies after receiving.
 */

import {
  IntakeData,
  DiagnosticImpression,
  TreatmentPlanData,
  MseChecklist,
  SessionTranscript,
  ProviderPreferences,
} from './types'
import { checkOllamaHealth, generateCompletion } from './ollama-client'
import { checkOpenAIHealth, generateOpenAICompletion } from './openai-client'
import { deidentify, reidentify, saveDeidentifyMapping } from './deidentify'
import { buildSupervisionPrompt } from './supervision-prompt'

// ── Types ──

export interface SupervisionPrep {
  caseSummary: string
  discussionQuestions: string[]
  blindSpotFlags: string[]
  modalityPrompts: string[]
  generatedAt: string
  generationMethod: 'openai' | 'llm' | 'rule-based' | ''
}

export const EMPTY_SUPERVISION_PREP: SupervisionPrep = {
  caseSummary: '',
  discussionQuestions: [],
  blindSpotFlags: [],
  modalityPrompts: [],
  generatedAt: '',
  generationMethod: '',
}

// ── Helpers ──

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

interface SupervisionSections {
  caseSummary: string
  discussionQuestions: string[]
  blindSpotFlags: string[]
  modalityPrompts: string[]
}

function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    return value
      .split(/\n/)
      .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(Boolean)
  }
  return []
}

function parseJsonResponse(raw: string): SupervisionSections | null {
  // Try direct JSON parse
  try {
    const obj = JSON.parse(raw)
    if (obj.caseSummary) {
      return {
        caseSummary: String(obj.caseSummary),
        discussionQuestions: ensureArray(obj.discussionQuestions),
        blindSpotFlags: ensureArray(obj.blindSpotFlags),
        modalityPrompts: ensureArray(obj.modalityPrompts),
      }
    }
  } catch {
    // not valid JSON
  }

  // Try extracting JSON from markdown fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    try {
      const obj = JSON.parse(fenceMatch[1])
      if (obj.caseSummary) {
        return {
          caseSummary: String(obj.caseSummary),
          discussionQuestions: ensureArray(obj.discussionQuestions),
          blindSpotFlags: ensureArray(obj.blindSpotFlags),
          modalityPrompts: ensureArray(obj.modalityPrompts),
        }
      }
    } catch {
      // not valid JSON in fence
    }
  }

  return null
}

function extractSections(raw: string): SupervisionSections | null {
  const summaryMatch = raw.match(
    /(?:^|\n)\s*(?:Case Summary|CASE SUMMARY)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Discussion Questions|DISCUSSION QUESTIONS)[:\s]|\n\s*$)/i
  )
  const questionsMatch = raw.match(
    /(?:^|\n)\s*(?:Discussion Questions|DISCUSSION QUESTIONS)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Blind Spot Flags|BLIND SPOT FLAGS|Blind Spots)[:\s]|\n\s*$)/i
  )
  const blindSpotsMatch = raw.match(
    /(?:^|\n)\s*(?:Blind Spot Flags|BLIND SPOT FLAGS|Blind Spots)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Modality Prompts|MODALITY PROMPTS)[:\s]|\n\s*$)/i
  )
  const modalityMatch = raw.match(
    /(?:^|\n)\s*(?:Modality Prompts|MODALITY PROMPTS)[:\s]*\n?([\s\S]*?)$/i
  )

  if (summaryMatch) {
    return {
      caseSummary: summaryMatch[1].trim(),
      discussionQuestions: ensureArray(questionsMatch?.[1] ?? ''),
      blindSpotFlags: ensureArray(blindSpotsMatch?.[1] ?? ''),
      modalityPrompts: ensureArray(modalityMatch?.[1] ?? ''),
    }
  }

  return null
}

function buildPrepFromSections(
  sections: SupervisionSections,
  method: SupervisionPrep['generationMethod'] = 'llm'
): SupervisionPrep {
  const now = new Date().toISOString()
  return {
    caseSummary: sections.caseSummary,
    discussionQuestions: sections.discussionQuestions,
    blindSpotFlags: sections.blindSpotFlags,
    modalityPrompts: sections.modalityPrompts,
    generatedAt: now,
    generationMethod: method,
  }
}

// ── Provider implementations ──

async function generateWithOpenAI(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlanData | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  mseChecklist: MseChecklist | null,
  prefs: ProviderPreferences
): Promise<SupervisionPrep | null> {
  const model = prefs.openaiModel || 'gpt-4o-mini'
  const { system, user } = buildSupervisionPrompt(
    transcript, sessionNotes, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs
  )

  // De-identify the prompt before sending to OpenAI
  const { sanitized: sanitizedUser, mapping: userMapping } = deidentify(user, intake)
  const { sanitized: sanitizedSystem, mapping: systemMapping } = deidentify(system, intake)

  // Merge mappings
  const fullMapping = { ...systemMapping, ...userMapping }

  // Save mapping to session storage for debugging/audit
  await saveDeidentifyMapping(fullMapping)

  console.log('[SPN] Generating supervision prep with OpenAI (de-identified)...', {
    model,
    originalLength: user.length,
    sanitizedLength: sanitizedUser.length,
    tokensReplaced: Object.keys(fullMapping).length,
  })

  const raw = await generateOpenAICompletion(sanitizedUser, sanitizedSystem, model, prefs.openaiApiKey)

  // Re-identify the response
  const reidentified = reidentify(raw, fullMapping)

  const parsed = parseJsonResponse(reidentified)
  if (!parsed) {
    console.warn('[SPN] Failed to parse OpenAI supervision response as JSON, attempting section extraction')
    const extracted = extractSections(reidentified)
    if (!extracted) return null
    return buildPrepFromSections(extracted, 'openai')
  }

  return buildPrepFromSections(parsed, 'openai')
}

async function generateWithLLM(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlanData | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  mseChecklist: MseChecklist | null,
  prefs: ProviderPreferences,
  model: string,
  endpoint: string
): Promise<SupervisionPrep | null> {
  const { system, user } = buildSupervisionPrompt(
    transcript, sessionNotes, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs
  )

  console.log('[SPN] Generating supervision prep with Ollama...', { model, promptLength: user.length })
  const raw = await generateCompletion(user, system, model, endpoint)

  const parsed = parseJsonResponse(raw)
  if (!parsed) {
    console.warn('[SPN] Failed to parse LLM supervision response as JSON, attempting section extraction')
    const extracted = extractSections(raw)
    if (!extracted) return null
    return buildPrepFromSections(extracted)
  }

  return buildPrepFromSections(parsed)
}

// ── Rule-based fallback ──

function buildRuleBasedPrep(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlanData | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  mseChecklist: MseChecklist | null
): SupervisionPrep {
  const now = new Date().toISOString()

  // ── Case Summary ──
  const diagNames = diagnosticImpressions.map((d) => `${d.name} (${d.code})`).join(', ')
  const chiefComplaint = intake?.chiefComplaint || ''
  const notesSnippet = sessionNotes.slice(0, 300).trim()

  const summaryParts: string[] = []
  if (diagNames) summaryParts.push(`Diagnoses: ${diagNames}.`)
  if (chiefComplaint) summaryParts.push(`Chief complaint: ${chiefComplaint}.`)
  if (notesSnippet) summaryParts.push(`Session notes excerpt: "${notesSnippet}..."`)
  const caseSummary = summaryParts.join(' ') || 'No clinical data available for case summary.'

  // ── Discussion Questions ──
  const discussionQuestions: string[] = []

  // Always include treatment goal prioritization
  discussionQuestions.push('What treatment goals should be prioritized at this stage?')

  // SI-related
  const hasSI =
    intake?.suicidalIdeation?.toLowerCase().includes('yes') ||
    intake?.suicideAttemptHistory?.toLowerCase().includes('yes') ||
    sessionNotes.toLowerCase().includes('suicidal') ||
    sessionNotes.toLowerCase().includes('safety plan')
  if (hasSI) {
    discussionQuestions.push('How should safety planning be addressed given the client\'s SI history?')
  }

  // Substance use
  const hasSubstanceUse =
    (intake?.alcoholUse && !['none', 'no', 'never', 'n/a', ''].includes(intake.alcoholUse.toLowerCase().trim())) ||
    (intake?.drugUse && !['none', 'no', 'never', 'n/a', ''].includes(intake.drugUse.toLowerCase().trim())) ||
    (intake?.substanceUseHistory && !['none', 'no', 'never', 'n/a', ''].includes(intake.substanceUseHistory.toLowerCase().trim()))
  if (hasSubstanceUse) {
    discussionQuestions.push('What role is substance use playing in the clinical presentation?')
  }

  // Trauma
  const hasTrauma =
    intake?.physicalSexualAbuseHistory?.toLowerCase().includes('yes') ||
    intake?.domesticViolenceHistory?.toLowerCase().includes('yes') ||
    sessionNotes.toLowerCase().includes('trauma')
  if (hasTrauma) {
    discussionQuestions.push('How should trauma history be integrated into the treatment approach?')
  }

  // Medication
  if (intake?.medications && intake.medications.toLowerCase() !== 'none') {
    discussionQuestions.push('Are current medications adequately addressing symptoms? Is a prescriber consultation warranted?')
  }

  // Ensure at least 3 questions
  if (discussionQuestions.length < 3) {
    discussionQuestions.push('What therapeutic alliance factors should be monitored?')
  }
  if (discussionQuestions.length < 3) {
    discussionQuestions.push('Are there cultural or contextual factors influencing the presentation?')
  }

  // ── Blind Spot Flags ──
  const blindSpotFlags: string[] = []

  // Check for assessment/session mismatch
  if (intake?.phq9 && intake.phq9.totalScore >= 10 && !sessionNotes.toLowerCase().includes('depress')) {
    blindSpotFlags.push(
      `PHQ-9 score of ${intake.phq9.totalScore} (${intake.phq9.severity}) suggests depression, but session notes do not appear to address depressive symptoms.`
    )
  }
  if (intake?.gad7 && intake.gad7.totalScore >= 10 && !sessionNotes.toLowerCase().includes('anxi')) {
    blindSpotFlags.push(
      `GAD-7 score of ${intake.gad7.totalScore} (${intake.gad7.severity}) suggests anxiety, but session notes do not appear to address anxiety symptoms.`
    )
  }

  // Check treatment plan goals not addressed in notes
  if (treatmentPlan?.goals) {
    for (const goal of treatmentPlan.goals) {
      const goalKeywords = goal.goal.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
      const addressed = goalKeywords.some((kw) => sessionNotes.toLowerCase().includes(kw))
      if (!addressed && goal.goal) {
        blindSpotFlags.push(
          `Treatment plan goal "${goal.goal.slice(0, 80)}" has no session notes addressing progress.`
        )
        break // limit to one goal-related flag
      }
    }
  }

  // Generic blind spot if none found
  if (blindSpotFlags.length === 0) {
    blindSpotFlags.push('Review session for potential countertransference or unaddressed client concerns.')
    blindSpotFlags.push('Consider whether cultural factors are being adequately explored.')
  }

  // ── Modality Prompts ──
  const modalityPrompts: string[] = []
  const diagLower = diagnosticImpressions.map((d) => d.name.toLowerCase()).join(' ')

  if (diagLower.includes('depress') || diagLower.includes('mdd')) {
    modalityPrompts.push('CBT: What cognitive distortions were identified? How is behavioral activation progressing?')
    modalityPrompts.push('What is the client\'s current activity level and engagement in pleasurable activities?')
  }

  if (diagLower.includes('ptsd') || diagLower.includes('trauma') || diagLower.includes('stress')) {
    modalityPrompts.push('Is the client ready for trauma processing, or is stabilization still needed?')
    modalityPrompts.push('What grounding or coping strategies have been established for distress tolerance?')
  }

  if (diagLower.includes('anxiety') || diagLower.includes('gad') || diagLower.includes('panic') || diagLower.includes('phobia')) {
    modalityPrompts.push('What exposure hierarchy has been developed? What avoidance patterns remain?')
    modalityPrompts.push('How is the client responding to relaxation training or cognitive restructuring?')
  }

  if (diagLower.includes('adhd') || diagLower.includes('attention')) {
    modalityPrompts.push('What executive functioning strategies have been implemented? How is the client managing organization and time?')
  }

  if (diagLower.includes('substance') || diagLower.includes('alcohol') || diagLower.includes('cannabis')) {
    modalityPrompts.push('What stage of change is the client in? Are motivational interviewing techniques appropriate?')
  }

  if (diagLower.includes('bipolar')) {
    modalityPrompts.push('Is mood charting being used? How is medication adherence?')
  }

  if (diagLower.includes('personality') || diagLower.includes('borderline')) {
    modalityPrompts.push('DBT: What distress tolerance skills have been taught? How is emotional regulation progressing?')
  }

  // Generic if no diagnosis-specific prompts generated
  if (modalityPrompts.length === 0) {
    modalityPrompts.push('What therapeutic modality is being used and how is the client responding?')
    modalityPrompts.push('What interventions were most effective this session?')
  }

  return {
    caseSummary,
    discussionQuestions,
    blindSpotFlags,
    modalityPrompts,
    generatedAt: now,
    generationMethod: 'rule-based',
  }
}

// ── Main export ──

export async function generateSupervisionPrep(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlanData | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  mseChecklist: MseChecklist | null,
  prefs: ProviderPreferences
): Promise<SupervisionPrep> {
  const provider = prefs.llmProvider || 'ollama'

  // Try OpenAI first if configured (de-identifies PHI before sending)
  if (provider === 'openai' && prefs.openaiApiKey) {
    const healthy = await checkOpenAIHealth(prefs.openaiApiKey)
    if (healthy) {
      try {
        const prep = await generateWithOpenAI(
          sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs
        )
        if (prep) return prep
      } catch (err) {
        console.info('[SPN] OpenAI supervision generation failed, falling back:', getErrorMessage(err))
      }
    }
  }

  // Try Ollama
  const endpoint = prefs.ollamaEndpoint || 'http://localhost:11434'
  const model = prefs.ollamaModel || 'llama3.1:8b'
  const healthy = await checkOllamaHealth(endpoint)
  if (healthy) {
    try {
      const prep = await generateWithLLM(
        sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, model, endpoint
      )
      if (prep) return prep
    } catch (err) {
      const message = getErrorMessage(err)
      if (!message.includes('Ollama blocked this Chrome extension')) {
        console.info('[SPN] Ollama supervision generation fell back to rule-based:', message)
      }
    }
  }

  // Fallback to rule-based builder
  return buildRuleBasedPrep(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist)
}
