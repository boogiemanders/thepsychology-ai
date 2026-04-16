/**
 * SOAP note generation orchestrator.
 * Provider chain: OpenAI (de-ID → cloud → re-ID) → Ollama → regex fallback.
 * OpenAI path de-identifies PHI before sending, re-identifies after receiving.
 */

import {
  IntakeData,
  DiagnosticImpression,
  TreatmentPlanData,
  MseChecklist,
  SessionTranscript,
  ProviderPreferences,
  SoapDraft,
  EMPTY_SOAP_DRAFT,
} from './types'
import { checkOllamaHealth, generateCompletion } from './ollama-client'
import { checkOpenAIHealth, generateOpenAICompletion } from './openai-client'
import { deidentify, reidentify, saveDeidentifyMapping } from './deidentify'
import { buildSoapPrompt } from './soap-prompt'
import { buildSoapDraft as buildSoapDraftRegex } from './soap-builder'
import { generateSoapTwoPass } from './soap-llm'

interface GenerationMeta {
  apptId?: string
  clientName?: string
  sessionDate?: string
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

export async function generateSoapDraft(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlanData | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  mseChecklist: MseChecklist | null,
  prefs: ProviderPreferences,
  meta: GenerationMeta = {}
): Promise<SoapDraft> {
  const provider = prefs.llmProvider || 'ollama'

  // Try OpenAI first if configured (de-identifies PHI before sending)
  if (provider === 'openai' && prefs.openaiApiKey) {
    const healthy = await checkOpenAIHealth(prefs.openaiApiKey)
    if (healthy) {
      try {
        const draft = await generateWithOpenAI(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, meta)
        if (draft) return draft
      } catch (err) {
        console.info('[SPN] OpenAI generation failed, falling back:', getErrorMessage(err))
      }
    }
  }

  // Try Ollama
  const endpoint = prefs.ollamaEndpoint || 'http://localhost:11434'
  const model = prefs.ollamaModel || 'llama3.1:8b'
  const healthy = await checkOllamaHealth(endpoint)
  if (healthy) {
    try {
      const draft = await generateWithLLM(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, meta, model, endpoint)
      if (draft) return draft
    } catch (err) {
      const message = getErrorMessage(err)
      if (!message.includes('Ollama blocked this Chrome extension')) {
        console.info('[SPN] Ollama generation fell back to regex:', message)
      }
    }
  }

  // Fallback to regex builder
  const regexDraft = buildSoapDraftRegex(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, prefs, meta)
  return { ...regexDraft, generationMethod: 'regex' }
}

async function generateWithOpenAI(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlanData | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  mseChecklist: MseChecklist | null,
  prefs: ProviderPreferences,
  meta: GenerationMeta
): Promise<SoapDraft | null> {
  const model = prefs.openaiModel || 'gpt-4o-mini'

  // Two-pass (theme extraction → synthesis) when both transcript and notes
  // are present — this is the quality path. Falls through to single-pass if
  // two-pass throws (e.g. no themes returned, network blip).
  if (transcript?.entries.length && sessionNotes.trim()) {
    try {
      console.log('[SPN] Generating SOAP with OpenAI two-pass (de-identified)...', { model })
      const result = await generateSoapTwoPass(
        sessionNotes,
        transcript,
        intake,
        diagnosticImpressions,
        treatmentPlan,
        mseChecklist,
        prefs,
        {
          apiKey: prefs.openaiApiKey,
          model,
          onProgress: (msg) => console.log(`[SPN] ${msg}`),
        }
      )
      console.log(`[SPN] Two-pass produced ${result.themes.length} themes:`, result.themes.map((t) => t.theme).join(', '))
      return buildDraftFromSections(result.soap, sessionNotes, transcript, prefs, meta, 'openai')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.info('[SPN] Two-pass failed, falling through to single-pass:', msg)
    }
  }

  // Single-pass fallback (also used when transcript or notes are missing)
  const { system, user } = buildSoapPrompt(transcript, sessionNotes, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs)

  // De-identify the prompt before sending to OpenAI
  const { sanitized: sanitizedUser, mapping: userMapping } = deidentify(user, intake)
  const { sanitized: sanitizedSystem, mapping: systemMapping } = deidentify(system, intake)

  // Merge mappings
  const fullMapping = { ...systemMapping, ...userMapping }

  // Save mapping to session storage for debugging/audit
  await saveDeidentifyMapping(fullMapping)

  console.log('[SPN] Generating SOAP with OpenAI single-pass (de-identified)...', {
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
    console.warn('[SPN] Failed to parse OpenAI response as JSON, attempting section extraction')
    const extracted = extractSections(reidentified)
    if (!extracted) return null
    return buildDraftFromSections(extracted, sessionNotes, transcript, prefs, meta, 'openai')
  }

  return buildDraftFromSections(parsed, sessionNotes, transcript, prefs, meta, 'openai')
}

async function generateWithLLM(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlanData | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  mseChecklist: MseChecklist | null,
  prefs: ProviderPreferences,
  meta: GenerationMeta,
  model: string,
  endpoint: string
): Promise<SoapDraft | null> {
  const { system, user } = buildSoapPrompt(transcript, sessionNotes, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs)

  console.log('[SPN] Generating SOAP with Ollama...', { model, promptLength: user.length })
  const raw = await generateCompletion(user, system, model, endpoint)

  // Parse JSON response
  const parsed = parseJsonResponse(raw)
  if (!parsed) {
    console.warn('[SPN] Failed to parse LLM response as JSON, attempting section extraction')
    const extracted = extractSections(raw)
    if (!extracted) return null
    return buildDraftFromSections(extracted, sessionNotes, transcript, prefs, meta)
  }

  return buildDraftFromSections(parsed, sessionNotes, transcript, prefs, meta)
}

interface SoapSections {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

function parseJsonResponse(raw: string): SoapSections | null {
  // Try direct JSON parse
  try {
    const obj = JSON.parse(raw)
    if (obj.subjective && obj.objective && obj.assessment && obj.plan) {
      return obj as SoapSections
    }
  } catch {
    // not valid JSON
  }

  // Try extracting JSON from markdown fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    try {
      const obj = JSON.parse(fenceMatch[1])
      if (obj.subjective && obj.objective && obj.assessment && obj.plan) {
        return obj as SoapSections
      }
    } catch {
      // not valid JSON in fence
    }
  }

  return null
}

function extractSections(raw: string): SoapSections | null {
  const subMatch = raw.match(/(?:^|\n)\s*(?:Subjective|SUBJECTIVE)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Objective|OBJECTIVE)[:\s]|\n\s*$)/i)
  const objMatch = raw.match(/(?:^|\n)\s*(?:Objective|OBJECTIVE)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Assessment|ASSESSMENT)[:\s]|\n\s*$)/i)
  const assMatch = raw.match(/(?:^|\n)\s*(?:Assessment|ASSESSMENT)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Plan|PLAN)[:\s]|\n\s*$)/i)
  const planMatch = raw.match(/(?:^|\n)\s*(?:Plan|PLAN)[:\s]*\n?([\s\S]*?)$/i)

  if (subMatch && objMatch && assMatch && planMatch) {
    return {
      subjective: subMatch[1].trim(),
      objective: objMatch[1].trim(),
      assessment: assMatch[1].trim(),
      plan: planMatch[1].trim(),
    }
  }

  return null
}

function buildDraftFromSections(
  sections: SoapSections,
  sessionNotes: string,
  transcript: SessionTranscript | null,
  prefs: ProviderPreferences,
  meta: GenerationMeta,
  method: string = 'llm'
): SoapDraft {
  const clientName = meta.clientName || 'Client'
  const sessionDate = meta.sessionDate || new Date().toLocaleDateString('en-US')
  const transcriptText = transcript?.entries
    .map((e) => `${e.speaker === 'clinician' ? 'Clinician' : 'Client'}: ${e.text}`)
    .join('\n') ?? ''
  const now = new Date().toISOString()

  return {
    ...EMPTY_SOAP_DRAFT,
    apptId: meta.apptId ?? '',
    clientName,
    sessionDate,
    cptCode: prefs.followUpCPT || '90837',
    subjective: sections.subjective,
    objective: sections.objective,
    assessment: sections.assessment,
    plan: sections.plan,
    sessionNotes: sessionNotes.trim(),
    transcript: transcriptText,
    treatmentPlanId: '',
    generatedAt: now,
    editedAt: now,
    status: 'draft',
    generationMethod: method as SoapDraft['generationMethod'],
  }
}
