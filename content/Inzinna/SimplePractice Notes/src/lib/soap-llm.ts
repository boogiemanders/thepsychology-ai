/**
 * Two-pass SOAP note generator.
 *
 * Pass 1 (Theme extraction): Send transcript + clinician loose notes to an LLM
 *         and ask for a structured list of 4-8 themes with verbatim supporting
 *         quotes and per-section relevance. Low temperature, small output.
 *
 * Pass 2 (SOAP synthesis): Take the themes plus the full clinical context
 *         (intake, diagnoses, treatment plan, MSE) and produce the four SOAP
 *         sections as JSON. The themes act as a scaffold that prevents the
 *         model from drifting off the transcript or missing topics that the
 *         clinician's loose notes flagged.
 *
 * Why two passes: on long sessions the single-pass LLM can drop themes that
 * appear briefly in the transcript. Giving the second pass an explicit theme
 * list (produced cheaply by the first pass) markedly improves theme coverage
 * and keeps each SOAP section anchored to concrete session content. This
 * mirrors the pattern proven in diagnostic-llm.ts.
 *
 * All PHI is de-identified ONCE before pass 1 so pass 1 and pass 2 share a
 * single token mapping, then re-identified only on the final pass 2 output.
 */

import { deidentify, reidentify, saveDeidentifyMapping } from './deidentify'
import { generateOpenAICompletion, generateOpenAICompletionSync } from './openai-client'
import { buildSoapPrompt } from './soap-prompt'
import type {
  DiagnosticImpression,
  IntakeData,
  MseChecklist,
  ProviderPreferences,
  SessionTranscript,
  TreatmentPlanData,
} from './types'

export interface SoapTheme {
  theme: string
  supportingQuotes: string[]
  relevantSections: Array<'subjective' | 'objective' | 'assessment' | 'plan'>
}

export interface SoapSections {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface SoapTwoPassResult {
  themes: SoapTheme[]
  soap: SoapSections
}

export interface SoapTwoPassOptions {
  apiKey: string
  model?: string
  onProgress?: (msg: string) => void
}

const DEFAULT_MODEL = 'gpt-4o-mini'

const THEMES_SYSTEM = `You are a clinical documentation assistant helping a licensed psychologist prepare a SOAP note.

You will receive:
1. The clinician's raw loose notes from this session (may be fragmentary bullet points).
2. A session transcript (captions from the video visit).

Your job: identify the 4-8 most clinically meaningful THEMES discussed this session. For each theme, return 1-3 short supporting quotes taken verbatim from the transcript (or from the clinician notes when nothing in the transcript matches), and tag which SOAP sections the theme is most relevant to.

Return STRICT JSON only. No markdown. No prose before or after the JSON.

{
  "themes": [
    {
      "theme": "<short label, e.g. 'work stress', 'values conflict', 'FOMO about peer growth'>",
      "supportingQuotes": ["<verbatim quote 1>", "<verbatim quote 2>"],
      "relevantSections": ["subjective", "assessment"]
    }
  ]
}

Rules:
- Prefer themes that the CLINICIAN'S LOOSE NOTES flag, even if the transcript mentions them only briefly.
- Do NOT invent themes or quotes. Every quote must appear in the inputs.
- Cap at 8 themes. Prefer fewer strong themes over many weak ones.
- "relevantSections" values must be from this exact set: "subjective", "objective", "assessment", "plan".
- Quotes should be <= 160 characters. Trim with an ellipsis if needed.
- Skip small talk, scheduling, and filler (e.g. "hi, how are you", "see you next week").`

interface ThemesResult {
  themes?: Array<{
    theme?: string
    supportingQuotes?: string[]
    relevantSections?: string[]
  }>
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

function sanitizeThemes(raw: unknown): SoapTheme[] {
  const parsed = raw as ThemesResult | null
  if (!parsed?.themes || !Array.isArray(parsed.themes)) return []

  const validSections: SoapTheme['relevantSections'][number][] = [
    'subjective',
    'objective',
    'assessment',
    'plan',
  ]

  return parsed.themes
    .map((t): SoapTheme | null => {
      const theme = typeof t?.theme === 'string' ? t.theme.trim() : ''
      if (!theme) return null

      const quotes = Array.isArray(t.supportingQuotes)
        ? t.supportingQuotes
            .filter((q): q is string => typeof q === 'string')
            .map((q) => q.trim())
            .filter(Boolean)
            .slice(0, 3)
        : []

      const sections = Array.isArray(t.relevantSections)
        ? t.relevantSections
            .filter((s): s is SoapTheme['relevantSections'][number] =>
              validSections.includes(s as SoapTheme['relevantSections'][number])
            )
            .filter((s, i, arr) => arr.indexOf(s) === i)
        : []

      return {
        theme,
        supportingQuotes: quotes,
        relevantSections: sections.length ? sections : ['subjective'],
      }
    })
    .filter((x): x is SoapTheme => x !== null)
    .slice(0, 8)
}

function formatTranscriptForThemes(
  transcript: SessionTranscript | null,
  prefs: ProviderPreferences
): string {
  if (!transcript?.entries.length) return '[No transcript captured.]'
  const providerName = [prefs.providerFirstName, prefs.providerLastName].filter(Boolean).join(' ') || 'Clinician'
  return transcript.entries
    .map((e) => `${e.speaker === 'clinician' ? providerName : 'Client'}: ${e.text}`)
    .join('\n')
}

function renderThemesBlock(themes: SoapTheme[]): string {
  if (!themes.length) return ''
  const lines = themes.map((t, i) => {
    const sections = t.relevantSections.join(', ')
    const quotes = t.supportingQuotes
      .map((q) => `    • "${q}"`)
      .join('\n')
    return `${i + 1}. ${t.theme} [sections: ${sections}]${quotes ? `\n${quotes}` : ''}`
  })
  return `=== SESSION THEMES (from pass 1 — USE ALL OF THESE) ===\n${lines.join('\n')}`
}

function parseSoapJson(raw: string): SoapSections | null {
  const json = extractJson(raw) as Partial<SoapSections> | null
  if (!json) return null
  const { subjective, objective, assessment, plan } = json
  if (
    typeof subjective === 'string' &&
    typeof objective === 'string' &&
    typeof assessment === 'string' &&
    typeof plan === 'string'
  ) {
    return { subjective, objective, assessment, plan }
  }
  return null
}

/**
 * Two-pass SOAP generator. Pass 1 extracts themes; Pass 2 synthesizes the
 * full SOAP grounded in the themes plus clinical context.
 *
 * De-identification is performed ONCE on the combined narrative before pass 1,
 * so the mapping is consistent across both passes. Re-identification happens
 * on the final pass-2 output.
 *
 * Throws on API failure or unparseable output. Callers should fall back to
 * single-pass OpenAI, Ollama, or the regex skeleton as appropriate.
 */
export async function generateSoapTwoPass(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  treatmentPlan: TreatmentPlanData | null,
  mseChecklist: MseChecklist | null,
  prefs: ProviderPreferences,
  opts: SoapTwoPassOptions
): Promise<SoapTwoPassResult> {
  if (!opts.apiKey) throw new Error('OpenAI API key is required')

  const model = opts.model || DEFAULT_MODEL
  const progress = opts.onProgress ?? (() => {})

  // Build a single de-identified narrative used by both passes
  const rawTranscript = formatTranscriptForThemes(transcript, prefs)
  const combinedForDeid = `=== CLINICIAN LOOSE NOTES ===\n${sessionNotes.trim() || '[none]'}\n\n=== TRANSCRIPT ===\n${rawTranscript}`

  const { sanitized: sanitizedCombined, mapping } = deidentify(combinedForDeid, intake)
  await saveDeidentifyMapping(mapping)

  // =============== Pass 1: theme extraction ===============
  progress('Pass 1: extracting session themes...')
  const themesUser = `${sanitizedCombined}\n\nExtract the 4-8 most clinically meaningful themes and return strict JSON.`

  const themesRaw = await generateOpenAICompletionSync(themesUser, THEMES_SYSTEM, model, opts.apiKey)
  const themes = sanitizeThemes(extractJson(themesRaw))

  if (!themes.length) {
    throw new Error(`Pass 1 returned no themes. Raw output: ${themesRaw.slice(0, 300)}`)
  }

  // =============== Pass 2: SOAP synthesis ===============
  progress(`Pass 2: synthesizing SOAP (${themes.length} themes)...`)

  // Reuse the canonical SOAP prompt, then inject the themes block in front of
  // the transcript. The system prompt already enforces JSON output and style.
  const { system, user } = buildSoapPrompt(
    transcript,
    sessionNotes,
    intake,
    diagnosticImpressions,
    treatmentPlan,
    mseChecklist,
    prefs
  )

  const themesBlock = renderThemesBlock(themes)
  const { sanitized: sanitizedUser, mapping: userMapping } = deidentify(user, intake)
  const { sanitized: sanitizedSystem, mapping: systemMapping } = deidentify(system, intake)

  // Merge any new mappings that deidentify produced on system/user strings
  const fullMapping = { ...systemMapping, ...userMapping, ...mapping }
  await saveDeidentifyMapping(fullMapping)

  const augmentedUser = `${themesBlock}\n\n${sanitizedUser}\n\n=== THEME COVERAGE REQUIREMENT ===\nEvery theme above MUST be reflected in at least one SOAP section matching its "sections" tag. Do not drop themes. Do not invent themes beyond the list.`

  const soapRaw = await generateOpenAICompletion(augmentedUser, sanitizedSystem, model, opts.apiKey)
  const reidentified = reidentify(soapRaw, fullMapping)
  const parsed = parseSoapJson(reidentified)

  if (!parsed) {
    throw new Error(`Pass 2 returned unparseable SOAP JSON. Raw output: ${reidentified.slice(0, 300)}`)
  }

  return { themes, soap: parsed }
}
