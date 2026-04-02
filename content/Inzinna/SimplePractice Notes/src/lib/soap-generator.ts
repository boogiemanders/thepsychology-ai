/**
 * SOAP note generation orchestrator.
 * Tries local Ollama LLM first, falls back to regex-based builder.
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
import { buildSoapPrompt } from './soap-prompt'
import { buildSoapDraft as buildSoapDraftRegex } from './soap-builder'

interface GenerationMeta {
  apptId?: string
  clientName?: string
  sessionDate?: string
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
  const endpoint = prefs.ollamaEndpoint || 'http://localhost:11434'
  const model = prefs.ollamaModel || 'llama3.1:8b'

  // Try LLM path
  const healthy = await checkOllamaHealth(endpoint)
  if (healthy) {
    try {
      const draft = await generateWithLLM(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, meta, model, endpoint)
      if (draft) return draft
    } catch (err) {
      console.warn('[SPN] LLM generation failed, falling back to regex:', err)
    }
  } else {
    console.log('[SPN] Ollama not available, using regex-based SOAP builder')
  }

  // Fallback to regex builder
  const regexDraft = buildSoapDraftRegex(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, prefs, meta)
  return { ...regexDraft, generationMethod: 'regex' }
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
  // Try to extract labeled sections from free text
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
  meta: GenerationMeta
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
    generationMethod: 'llm',
  }
}
