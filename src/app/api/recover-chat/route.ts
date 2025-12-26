import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { isNotificationEmailConfigured, sendNotificationEmail } from '@/lib/notify-email'
import { INITIAL_RECOVER_ASSISTANT_MESSAGE } from '@/lib/recover'

function getOpenAIClient(): OpenAI | null {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim()
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

function getSupabaseClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

type RecoverChunkMatch = {
  id: string
  document_id: string
  document_title: string | null
  document_apa_citation?: string | null
  storage_path: string | null
  content: string
  similarity: number
}

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(12_000),
})

const BodySchema = z.object({
  messages: z.array(MessageSchema).optional(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  userEmail: z.string().email().nullable().optional(),
})

const RECOVER_ALERT_MODE = (process.env.RECOVER_ALERT_MODE || 'harm').toLowerCase()
const RECOVER_ALERT_EMAIL_TO = process.env.RECOVER_ALERT_EMAIL_TO

const HARM_PATTERNS: RegExp[] = [
  /\bsuicid(e|al)\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bself[- ]?harm\b/i,
  /\bhurt myself\b/i,
  /\bharm myself\b/i,
  /\boverdose\b/i,
  /\bkill (someone|him|her|them)\b/i,
  /\bhurt (someone|others)\b/i,
  /\bharm (someone|others)\b/i,
]

const STRESS_PATTERNS: RegExp[] = [
  /\bstress(ed|ful)?\b/i,
  /\banxiet(y|ious)\b/i,
  /\bpanic\b/i,
  /\bburnout\b/i,
  /\boverwhelm(ed|ing)?\b/i,
]

function getAlertReason(text: string): 'harm' | 'stress' | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const harm = HARM_PATTERNS.some((pattern) => pattern.test(trimmed))
  if (harm) return 'harm'

  if (RECOVER_ALERT_MODE === 'stress_or_harm') {
    const stress = STRESS_PATTERNS.some((pattern) => pattern.test(trimmed))
    if (stress) return 'stress'
  }

  return null
}

function formatTranscript(messages: Array<{ role: string; content: string }>): string {
  return messages
    .map((message) => {
      const role = message.role.toUpperCase()
      return `${role}:\n${message.content}\n`
    })
    .join('\n')
    .trim()
}

async function maybeSendAlertEmail(input: {
  reason: 'harm' | 'stress'
  userId?: string | null
  userEmail?: string | null
  messages: Array<{ role: string; content: string }>
}): Promise<void> {
  if (RECOVER_ALERT_MODE === 'off') return
  if (RECOVER_ALERT_MODE === 'harm' && input.reason !== 'harm') return

  const to = (RECOVER_ALERT_EMAIL_TO || process.env.NOTIFY_EMAIL_TO || '').trim() || undefined
  if (!isNotificationEmailConfigured(to)) {
    console.warn('[recover-chat] Alert triggered but email is not configured (RESEND_API_KEY / NOTIFY_EMAIL_FROM / NOTIFY_EMAIL_TO or RECOVER_ALERT_EMAIL_TO).')
    return
  }

  const identifier = input.userEmail || input.userId || 'unknown user'
  const subject = `[Recover Alert] ${input.reason.toUpperCase()} – ${identifier}`
  const transcript = formatTranscript(input.messages)
  const text = [
    `Reason: ${input.reason}`,
    `User: ${identifier}`,
    '',
    'Transcript:',
    transcript,
  ].join('\n')

  try {
    await sendNotificationEmail({
      subject,
      text,
      to,
    })
    console.log('[recover-chat] Alert email sent:', { reason: input.reason, to: Array.isArray(to) ? to : [to] })
  } catch (error) {
    console.error('[recover-chat] Failed to send alert email:', error)
  }
}

function getRecoverSystemPrompt(): string {
  return `You are a supportive, non-judgmental coaching chatbot that blends:
- Acceptance and Commitment Therapy (ACT): values clarification, acceptance, cognitive defusion, present-moment awareness, self-as-context, and committed action.
- Motivational Interviewing (MI): OARS (Open questions, Affirmations, Reflections, Summaries), autonomy support, evoking change talk, rolling with resistance.

Primary goal: help the user reduce burnout and regain focus/motivation by clarifying values and choosing small, realistic next steps.

Conversation opening:
- The UI opens with: "How's studying been going?"
- After the user's first response, ask: "What has been hardest?"
- After they answer that, ask: "What would you like to be different?"

Session structure (adapt as needed):
1) Reflect what you hear + ask an open question.
2) Set an agenda: ask what would be most helpful right now (burnout, anxiety, motivation, confidence, study plan).
3) Clarify values: why passing the EPPP matters, what kind of person they want to be during prep.
4) Map the stuck point: triggers, thoughts, feelings, avoidance, and what’s been tried.
5) Offer options (with permission): a brief ACT skill (defusion/acceptance/mindfulness/values) or an MI exercise (importance/confidence, exploring ambivalence).
6) Choose one tiny committed action for the next 24–48 hours + a plan for obstacles.
7) Summarize and ask for a commitment rating (0–10) and how to raise it by 1 point.

Evidence-based learning (when the user asks about EPPP performance):
- Give general, educational suggestions for learning, sleep, memory, and stress that are aligned with cognitive science (e.g., active recall, spaced repetition, interleaving, sleep and consolidation, stress/arousal effects).
- Keep it practical and personalized to their schedule; avoid medical claims.

Style:
- Warm, calm, concise. Prefer short paragraphs.
- Start with reflection + an open question.
- Reflections should be direct, without filler like "It sounds like" or "It seems like". Prefer starting with "You're..." or naming the situation plainly.
- Ask one question at a time. Do not ask multiple questions in a single response. If you have more questions, hold them for later and ask them one by one.
- Ask permission before offering suggestions or exercises.
- Offer 2–4 small options when appropriate; avoid overwhelming lists.
- Avoid em dashes; use commas or periods instead.
- Do not diagnose. Do not claim to provide psychotherapy or mental health advice.

Safety:
- If the user mentions self-harm, suicide, intent to harm others, or immediate danger: respond with a brief, caring message encouraging immediate help (local emergency number). If in the US, mention 911 or 988. Do not provide detailed methods.
- If the user describes severe symptoms, encourage seeking help from a licensed professional.

Keep responses practical and grounded in the user’s context.`
}

async function getRecoverContext(
  userMessage: string
): Promise<{ context: string; sources: Array<{ title: string; citation: string; similarity: number }> }> {
  const openai = getOpenAIClient()
  const supabase = getSupabaseClient()
  if (!openai || !supabase) return { context: '', sources: [] }

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: userMessage,
    })

    const queryEmbedding = embeddingResponse.data[0]?.embedding
    if (!queryEmbedding) return { context: '', sources: [] }

    const { data, error } = await supabase.rpc('match_recover_chunks', {
      query_embedding: queryEmbedding,
      match_count: 6,
    })

    if (error || !data || data.length === 0) return { context: '', sources: [] }

    const matches = data as RecoverChunkMatch[]
    const sources = matches
      .map((match) => {
        const title = match.document_title || 'Untitled'
        const citation =
          typeof match.document_apa_citation === 'string' && match.document_apa_citation.trim().length > 0
            ? match.document_apa_citation.trim()
            : title
        return {
          title,
          citation,
          similarity: match.similarity,
        }
      })
      .filter((source) => source.citation.trim().length > 0)

    const context = matches
      .map((chunk, index) => {
        const title = chunk.document_title ? ` (${chunk.document_title})` : ''
        return `Source ${index + 1}${title}:\n${chunk.content}`
      })
      .join('\n\n')

    return { context, sources }
  } catch (error) {
    console.error('[recover-chat] Context error:', error)
    return { context: '', sources: [] }
  }
}

function getOpenAIErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const maybeStatus = (error as { status?: unknown }).status
  const status = typeof maybeStatus === 'number' ? maybeStatus : null
  if (status === 401) return 'OpenAI authentication failed. Check OPENAI_API_KEY.'
  if (status === 429) return 'OpenAI rate limit reached. Try again in a moment.'
  if (status && status >= 500) return 'OpenAI service error. Try again in a moment.'
  return null
}

async function persistRecoverTranscript(input: {
  supabase: ReturnType<typeof getSupabaseClient>
  sessionId: string
  userId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  assistantMessage: string
  assistantSources?: Array<{ citation: string; similarity?: number }>
  alertReason: 'harm' | 'stress' | null
}): Promise<void> {
  const supabase = input.supabase
  if (!supabase) return

  const now = new Date().toISOString()
  const lastUserIndex = [...input.messages].map((m) => m.role).lastIndexOf('user')
  const lastUserMessage = lastUserIndex >= 0 ? input.messages[lastUserIndex]?.content : null

  try {
    const { error: sessionError } = await supabase
      .from('recover_chat_sessions')
      .upsert({ id: input.sessionId, user_id: input.userId }, { onConflict: 'id' })

    if (sessionError) throw sessionError

    const { error: initialError } = await supabase
      .from('recover_chat_messages')
      .upsert(
        {
          session_id: input.sessionId,
          user_id: input.userId,
          message_index: 0,
          role: 'assistant',
          content: INITIAL_RECOVER_ASSISTANT_MESSAGE,
        },
        { onConflict: 'session_id,message_index' }
      )

    if (initialError) throw initialError

    if (typeof lastUserMessage === 'string' && lastUserMessage.trim().length > 0 && lastUserIndex > 0) {
      const { error: userMsgError } = await supabase
        .from('recover_chat_messages')
        .upsert(
          {
            session_id: input.sessionId,
            user_id: input.userId,
            message_index: lastUserIndex,
            role: 'user',
            content: lastUserMessage,
            alert_reason: input.alertReason,
            created_at: now,
          },
          { onConflict: 'session_id,message_index' }
        )

      if (userMsgError) throw userMsgError
    }

    const assistantIndex = input.messages.length
    const { error: assistantMsgError } = await supabase
      .from('recover_chat_messages')
      .upsert(
        {
          session_id: input.sessionId,
          user_id: input.userId,
          message_index: assistantIndex,
          role: 'assistant',
          content: input.assistantMessage,
          sources: input.assistantSources ?? null,
          created_at: now,
        },
        { onConflict: 'session_id,message_index' }
      )

    if (assistantMsgError) throw assistantMsgError

    const sessionUpdate: Record<string, unknown> = {
      last_message_at: now,
      message_count: assistantIndex + 1,
    }

    if (input.alertReason === 'harm') {
      sessionUpdate.has_harm_alert = true
      sessionUpdate.last_alert_reason = 'harm'
      sessionUpdate.last_alert_at = now
    } else if (input.alertReason === 'stress') {
      sessionUpdate.has_stress_alert = true
      sessionUpdate.last_alert_reason = 'stress'
      sessionUpdate.last_alert_at = now
    }

    const { error: updateError } = await supabase
      .from('recover_chat_sessions')
      .update(sessionUpdate)
      .eq('id', input.sessionId)

    if (updateError) throw updateError
  } catch (error) {
    console.error('[recover-chat] Failed to persist transcript:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY.' }, { status: 500 })
    }
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      )
    }

    const raw = await request.json().catch(() => null)
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const messages = parsed.data.messages ?? []
    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 })
    }

    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content
    const alertReason = lastUserMessage ? getAlertReason(lastUserMessage) : null

    if (alertReason) {
      await maybeSendAlertEmail({
        reason: alertReason,
        userId: parsed.data.userId ?? null,
        userEmail: parsed.data.userEmail ?? null,
        messages,
      })
    }

    const { context, sources } = lastUserMessage
      ? await getRecoverContext(lastUserMessage)
      : { context: '', sources: [] }

    const systemMessages = [{ role: 'system' as const, content: getRecoverSystemPrompt() }]
    if (context) {
      systemMessages.push({
        role: 'system' as const,
        content:
          `You may use the following reference excerpts when helpful. ` +
          `If you cite them, keep it short. Prefer paraphrase and do not provide long verbatim excerpts.\n\n${context}`,
      })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [...systemMessages, ...messages.slice(-20)],
    })

    const message = completion.choices[0]?.message?.content?.trim()
    if (!message) {
      return NextResponse.json({ error: 'No response from model.' }, { status: 502 })
    }

    const uniqueSources =
      sources.length > 0
        ? Array.from(
            new Map(sources.map((source) => [source.citation, source])).values()
          )
        : undefined

    const responsePayload = {
      message,
      sources: uniqueSources?.map(({ citation, similarity }) => ({ citation, similarity })),
    }

    if (parsed.data.userId) {
      void persistRecoverTranscript({
        supabase,
        sessionId: parsed.data.sessionId,
        userId: parsed.data.userId,
        messages,
        assistantMessage: message,
        assistantSources: responsePayload.sources,
        alertReason,
      })
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('[recover-chat] Error:', error)
    const openaiMessage = getOpenAIErrorMessage(error)
    if (openaiMessage) {
      return NextResponse.json({ error: openaiMessage }, { status: 502 })
    }
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
