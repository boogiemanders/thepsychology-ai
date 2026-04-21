// Phase 3 safety layer: two complementary input-side classifiers.
// Regex runs first (deterministic, fast, cannot be prompt-injected).
// Mini classifier catches indirect wordings the regex misses.

import OpenAI from 'openai'
import { z } from 'zod'

const MINI_MODEL = 'gpt-4o-mini'
const MINI_TIMEOUT_MS = 2000

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ---------------------------------------------------------------------------
// Regex layer (moved out of route.ts)
// ---------------------------------------------------------------------------
const CRISIS_PATTERNS: { label: string; re: RegExp }[] = [
  { label: 'kill_self', re: /\b(kill\s+my?\s*self|kill\s+me|end\s+(it\s+all|my\s+life))\b/i },
  { label: 'want_to_die', re: /\b(want\s+to\s+die|wanna\s+die|better\s+off\s+dead)\b/i },
  { label: 'suicide_term', re: /\bsuicid(e|al)\b/i },
  { label: 'self_harm', re: /\b(cut(ting)?\s+my?\s*self|hurt(ing)?\s+my?\s*self|self[-\s]?harm)\b/i },
  { label: 'overdose', re: /\b(overdose|overdosing|taking\s+a\s+bunch\s+of\s+pills)\b/i },
  { label: 'homicidal', re: /\b(kill\s+(him|her|them|someone)|homicid(e|al))\b/i },
]

export const CRISIS_ADJACENT_PATTERNS: RegExp[] = [
  /\b(hopeless|worthless|can[''`]?t\s+go\s+on|trapped)\b/i,
  /\b(abus(e|ed|er)|hit(s|ting)?\s+me|beat(s|ing)?\s+me)\b/i,
  /\b(trauma|ptsd|flashbacks?)\b/i,
  /\b(grief|died|death)\b/i,
]

export type RegexCrisisResult = {
  hit: boolean
  patterns_matched: string[]
}

export function regexCrisisCheck(content: string): RegexCrisisResult {
  const patterns_matched = CRISIS_PATTERNS.filter((p) => p.re.test(content)).map((p) => p.label)
  return { hit: patterns_matched.length > 0, patterns_matched }
}

export function isCrisisAdjacent(content: string): boolean {
  return CRISIS_ADJACENT_PATTERNS.some((re) => re.test(content))
}

// ---------------------------------------------------------------------------
// Mini classifier layer
// ---------------------------------------------------------------------------
const miniResultSchema = z.object({
  crisis: z.boolean(),
  category: z.enum(['suicide', 'self_harm', 'abuse_disclosure', 'homicidal', 'none']),
  confidence: z.number().min(0).max(1),
})

export type MiniCrisisResult = z.infer<typeof miniResultSchema> & {
  latency_ms: number
  error?: string
  raw?: string
}

const MINI_SYSTEM_PROMPT = `You are a safety classifier for an AI mental-health reflection tool. Your ONLY job is to decide whether a single user message indicates imminent risk that requires a crisis response.

Return JSON with EXACTLY this shape:
{"crisis": boolean, "category": "suicide" | "self_harm" | "abuse_disclosure" | "homicidal" | "none", "confidence": number between 0 and 1}

Mark crisis=true when the message expresses:
- Suicidal ideation, intent, or plan (even indirect: "I don't want to be here anymore", "I want everything to stop for good", "I'm done")
- Self-harm intent or active behavior (cutting, burning, starving beyond generic dieting language)
- Active abuse being done to the user right now OR describing an actively unsafe situation
- Intent to harm another person

Do NOT mark crisis=true for:
- General sadness, frustration, anxiety, stress
- Past resolved trauma being discussed reflectively
- Metaphor or hyperbole where context makes non-literal meaning clear ("I'm dying of boredom", "that test killed me")
- Hopelessness without any directional language toward harm

Be conservative in BOTH directions. A false positive interrupts a conversation that could help; a false negative misses someone who needs 988. When genuinely ambiguous, set crisis=true with confidence below 0.6.

Return ONLY the JSON. No explanation.`

export async function miniCrisisCheck(content: string): Promise<MiniCrisisResult> {
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), MINI_TIMEOUT_MS)

  try {
    const completion = await client.chat.completions.create(
      {
        model: MINI_MODEL,
        temperature: 0,
        max_tokens: 80,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: MINI_SYSTEM_PROMPT },
          { role: 'user', content },
        ],
      },
      { signal: controller.signal }
    )

    const raw = completion.choices[0]?.message?.content ?? ''
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.warn('[safety-classifier] mini returned non-JSON:', raw.slice(0, 200))
      return {
        crisis: false,
        category: 'none',
        confidence: 0,
        latency_ms: Date.now() - started,
        error: 'non_json',
        raw: raw.slice(0, 200),
      }
    }

    const result = miniResultSchema.safeParse(parsed)
    if (!result.success) {
      console.warn('[safety-classifier] mini JSON failed schema:', result.error.message)
      return {
        crisis: false,
        category: 'none',
        confidence: 0,
        latency_ms: Date.now() - started,
        error: 'schema_fail',
        raw: JSON.stringify(parsed).slice(0, 200),
      }
    }

    return { ...result.data, latency_ms: Date.now() - started }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    console.warn(
      `[safety-classifier] mini ${aborted ? 'timed out' : 'errored'}:`,
      err instanceof Error ? err.message : err
    )
    return {
      crisis: false,
      category: 'none',
      confidence: 0,
      latency_ms: Date.now() - started,
      error: aborted ? 'timeout' : 'error',
    }
  } finally {
    clearTimeout(timer)
  }
}
