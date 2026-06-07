// Auto-classifies an incoming DCT outreach reply into the dct_replies.reply_type
// buckets. Deterministic regex runs first (auto-responders and unsubscribe
// language are unambiguous and must never burn an LLM call); a mini model
// handles the positive/neutral/negative judgment the regex can't. Mirrors the
// two-layer shape of src/lib/therapy/safety-classifier.ts.

import OpenAI from 'openai'
import { z } from 'zod'

const MINI_MODEL = 'gpt-4o-mini'
const MINI_TIMEOUT_MS = 4000

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Matches the dct_replies.reply_type CHECK constraint.
export type ReplyType = 'positive' | 'neutral' | 'negative' | 'auto_reply' | 'opt_out' | 'unknown'

export type ReplyClassification = {
  reply_type: ReplyType
  confidence: number
  reason: string
  source: 'regex' | 'mini' | 'fallback'
  latency_ms: number
  error?: string
}

// Deterministic layer. Auto-responders and opt-outs have stable phrasings; catch
// them without a model call. Opt-out is checked first (a bounce of an opt-out is
// still an opt-out).
const OPT_OUT_RE =
  /\b(unsubscribe|opt[-\s]?out|remove me|take me off|stop emailing|do not (email|contact)|please remove)\b/i
const AUTO_REPLY_RE =
  /\b(out of (the )?office|auto(matic|[-\s]?reply|[-\s]?response|responder)|away from (my |the )?(desk|office)|on (vacation|leave|sabbatical|maternity|paternity)|delivery (status|has failed)|undeliverable|mail delivery|returning on|no longer (with|at))\b/i

function regexCheck(text: string): ReplyType | null {
  if (OPT_OUT_RE.test(text)) return 'opt_out'
  if (AUTO_REPLY_RE.test(text)) return 'auto_reply'
  return null
}

const miniSchema = z.object({
  reply_type: z.enum(['positive', 'neutral', 'negative', 'opt_out', 'auto_reply']),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(200),
})

const MINI_SYSTEM_PROMPT = `You classify replies to a cold outreach email. The original email was sent by a psychologist to Directors of Clinical Training at psychology doctoral programs, offering an affordable EPPP exam-prep tool (thepsychology.ai) and free access for their students.

Classify the reply into exactly one reply_type:
- "positive": interest or a warm action. Wants access/a trial/a call/more info, says they will forward it to students or share with the cohort, asks a question that signals genuine interest, thanks you and engages.
- "neutral": acknowledged but non-committal. "Thanks, will take a look", "received", polite deferral, forwards with no comment, a purely logistical question with no interest signal.
- "negative": declines or pushes back. Not interested, not relevant, "please don't pitch us", critical of cold outreach.
- "opt_out": asks to be removed / unsubscribed / to stop being emailed. (This is stronger than negative: a request to stop contact.)
- "auto_reply": an automated message. Out-of-office, autoresponder, "I am on leave", "wrong person / I am no longer the DCT", bounce or delivery-failure notice.

Return JSON with EXACTLY this shape:
{"reply_type": "...", "confidence": 0.0-1.0, "reason": "short phrase"}

Weigh the body over the subject. When genuinely ambiguous, prefer "neutral" with confidence below 0.6. Return ONLY the JSON.`

export async function classifyReply(subject: string, body: string | null): Promise<ReplyClassification> {
  const started = Date.now()
  const text = `${subject || ''}\n\n${body || ''}`.trim()

  // Empty body and uninformative subject: nothing to classify.
  if (!text || text.length < 2) {
    return { reply_type: 'unknown', confidence: 0, reason: 'empty', source: 'fallback', latency_ms: 0 }
  }

  const regexHit = regexCheck(`${subject || ''} ${body || ''}`)
  if (regexHit) {
    return {
      reply_type: regexHit,
      confidence: 0.95,
      reason: `regex matched ${regexHit}`,
      source: 'regex',
      latency_ms: Date.now() - started,
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { reply_type: 'unknown', confidence: 0, reason: 'no_openai_key', source: 'fallback', latency_ms: 0 }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), MINI_TIMEOUT_MS)
  try {
    const completion = await client.chat.completions.create(
      {
        model: MINI_MODEL,
        temperature: 0,
        max_tokens: 120,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: MINI_SYSTEM_PROMPT },
          { role: 'user', content: text.slice(0, 4000) },
        ],
      },
      { signal: controller.signal }
    )
    const raw = completion.choices[0]?.message?.content ?? ''
    const parsed = miniSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      return {
        reply_type: 'unknown',
        confidence: 0,
        reason: 'schema_fail',
        source: 'fallback',
        latency_ms: Date.now() - started,
        error: parsed.error.message.slice(0, 120),
      }
    }
    return { ...parsed.data, source: 'mini', latency_ms: Date.now() - started }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return {
      reply_type: 'unknown',
      confidence: 0,
      reason: aborted ? 'timeout' : 'error',
      source: 'fallback',
      latency_ms: Date.now() - started,
      error: err instanceof Error ? err.message.slice(0, 120) : 'unknown',
    }
  } finally {
    clearTimeout(timer)
  }
}
