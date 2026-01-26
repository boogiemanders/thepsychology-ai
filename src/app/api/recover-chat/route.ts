import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { isNotificationEmailConfigured, sendNotificationEmail } from '@/lib/notify-email'
import { sendSlackNotification } from '@/lib/notify-slack'
import { INITIAL_RECOVER_ASSISTANT_MESSAGE } from '@/lib/recover'
import fs from 'node:fs'
import path from 'node:path'
import { sanitizeOpenAIApiKey } from '@/lib/openai-api-key'
import { logUsageEvent } from '@/lib/usage-events'
import { SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Types for user progress context
type DomainProgress = {
  domain_name: string
  mastery_level: number
  questions_answered: number
}

type ExamHistoryEntry = {
  score: number
  total_questions: number
  correct_answers: number
  exam_type: string
  created_at: string
}

type UserProgressContext = {
  progress: DomainProgress[] | null
  exams: ExamHistoryEntry[] | null
  examCount: number
}

function readDotenvLocalValue(key: string): string | null {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const text = fs.readFileSync(envPath, 'utf8')
    const line = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith('#') && l.startsWith(`${key}=`))
    if (!line) return null
    let value = line.slice(key.length + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return value.trim() || null
  } catch {
    return null
  }
}

function resolveOpenAIApiKey(): string {
  const fromProcess = sanitizeOpenAIApiKey(process.env.OPENAI_API_KEY) ?? ''
  if (process.env.NODE_ENV === 'production') return fromProcess

  const fromEnvLocal = sanitizeOpenAIApiKey(readDotenvLocalValue('OPENAI_API_KEY')) ?? ''
  if (fromEnvLocal && fromEnvLocal !== fromProcess) {
    console.warn(
      '[recover-chat] Detected differing OPENAI_API_KEY values; using .env.local value (shell env vars override .env.local).'
    )
    return fromEnvLocal
  }

  return fromProcess || fromEnvLocal
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = resolveOpenAIApiKey()
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

async function maybeSendAlert(input: {
  reason: 'harm' | 'stress'
  userId?: string | null
  sessionId: string
}): Promise<void> {
  if (RECOVER_ALERT_MODE === 'off') return
  if (RECOVER_ALERT_MODE === 'harm' && input.reason !== 'harm') return

  const alertEmoji = input.reason === 'harm' ? '🚨' : '⚠️'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.thepsychology.ai'

  // PHI-free Slack notification
  try {
    await sendSlackNotification(
      `${alertEmoji} Recover ${input.reason.toUpperCase()} alert triggered. Review in admin dashboard.`,
      'recover'
    )
    console.log('[recover-chat] Slack alert sent:', { reason: input.reason })
  } catch (error) {
    console.error('[recover-chat] Failed to send Slack alert:', error)
  }

  // PHI-free email notification (no transcript, no user identity)
  const to = (RECOVER_ALERT_EMAIL_TO || process.env.NOTIFY_EMAIL_TO || '').trim() || undefined
  if (!isNotificationEmailConfigured(to)) {
    console.warn('[recover-chat] Alert triggered but email is not configured.')
    return
  }

  const subject = `[Recover Alert] ${input.reason.toUpperCase()} – Action Required`
  const text = [
    `A ${input.reason} alert was triggered in a Recover chat session.`,
    '',
    'For HIPAA compliance, user details and transcript are not included in this email.',
    '',
    `Review the session in your admin dashboard:`,
    `${baseUrl}/admin/recover?session=${input.sessionId}`,
    '',
    'Please follow up appropriately based on your protocols.',
  ].join('\n')

  try {
    await sendNotificationEmail({ subject, text, to })
    console.log('[recover-chat] Alert email sent (PHI-free):', { reason: input.reason })
  } catch (error) {
    console.error('[recover-chat] Failed to send alert email:', error)
  }
}

async function getUserProgressContext(
  userId: string,
  supabase: SupabaseClient
): Promise<UserProgressContext> {
  try {
    // Get topic mastery from user_domain_progress
    const { data: progress } = await supabase
      .from('user_domain_progress')
      .select('domain_name, mastery_level, questions_answered')
      .eq('user_id', userId)

    // Get recent exam scores from exam_history
    const { data: exams } = await supabase
      .from('exam_history')
      .select('score, total_questions, correct_answers, exam_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    // Get total exam count
    const { count: examCount } = await supabase
      .from('exam_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      progress: progress as DomainProgress[] | null,
      exams: exams as ExamHistoryEntry[] | null,
      examCount: examCount ?? 0,
    }
  } catch (error) {
    console.error('[recover-chat] Failed to fetch user progress:', error)
    return { progress: null, exams: null, examCount: 0 }
  }
}

function getRecoverSystemPrompt(userContext?: UserProgressContext): string {
  let contextSection = ''

  if (userContext) {
    const parts: string[] = []

    // Format weak topics (mastery < 50%)
    if (userContext.progress && userContext.progress.length > 0) {
      const weakTopics = userContext.progress
        .filter((p) => p.mastery_level < 50)
        .sort((a, b) => a.mastery_level - b.mastery_level)
        .slice(0, 5)
        .map((p) => `${p.domain_name} (${Math.round(p.mastery_level)}%)`)

      if (weakTopics.length > 0) {
        parts.push(`Topics needing work: ${weakTopics.join(', ')}`)
      }
    }

    // Format recent exam performance
    if (userContext.exams && userContext.exams.length > 0) {
      const latestExam = userContext.exams[0]
      const scorePercent = Math.round(latestExam.score)
      parts.push(`Recent exam score: ${scorePercent}%`)
    } else {
      parts.push('Recent exam score: no exams taken yet')
    }

    // Add exam count
    if (userContext.examCount > 0) {
      parts.push(`Total practice exams taken: ${userContext.examCount}`)
    }

    if (parts.length > 0) {
      contextSection = `

## User's Study Progress (use to personalize recommendations)
${parts.map((p) => `- ${p}`).join('\n')}

When suggesting study actions, recommend specific topics from their weak areas above.
When they mention struggling with certain content, connect it to their actual progress data.
`
    }
  }

  return `You are a supportive study coach for EPPP test-takers. Your goal is to help users get unstuck and back to studying quickly.

## How conversations work
- The UI opens with: "How's studying been going?"
- After they share what's hard, move quickly to offering concrete help
- Don't stay in "listening mode" for too long. Get to action within 2-3 exchanges.

## Your approach
1. Briefly acknowledge what they're experiencing (one sentence max)
2. Ask ONE clarifying question if needed, OR move directly to offering options
3. Offer 2-3 concrete choices tailored to their situation
4. Help them pick one small action they can do in the next 24 hours

## Concrete options to offer (pick what fits their situation)
- "Want me to suggest a 15-minute study plan to get started?"
- "Should we figure out which topic to tackle first based on your weak areas?"
- "Would a quick 5-question quiz help you warm up?"
- "Want to talk through what's blocking you, or just get a concrete next step?"

## For specific struggles
- **Motivation/energy**: Suggest starting with just 5-10 minutes, or their easiest weak topic
- **Overwhelm**: Help them pick ONE topic to focus on today
- **Procrastination**: Offer a tiny first step (open Topic Teacher, do 3 questions)
- **ADHD/attention**: Suggest shorter study chunks, the Quizzer for variety, taking breaks
- **Retention**: Recommend spaced practice, mixing topics, sleep before review sessions
- **Anxiety**: Normalize it, suggest starting with familiar material to build momentum

## Style
- Warm but efficient. Get to the point.
- Keep responses to 2-3 short paragraphs max
- One question at a time
- Avoid em dashes; use commas or periods
- Do not diagnose or claim to provide therapy

## Response patterns to AVOID
- Starting every response with "You're feeling..." or "You're finding it..."
- Multiple reflective statements in a row
- Asking "What would you like to be different?" repeatedly
- Staying in listening mode without offering concrete help

## Safety
- If the user mentions self-harm, suicide, or intent to harm: respond with a brief caring message and encourage immediate help (911 or 988 in the US)
- For severe symptoms, encourage seeking a licensed professional

Be practical and action-oriented. Help them take one small step forward.${contextSection}`
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

    // Log embedding usage (no userId available in this context)
    void logUsageEvent({
      eventName: 'recover-chat.embedding',
      endpoint: '/api/recover-chat',
      model: 'text-embedding-3-small',
      inputTokens: embeddingResponse.usage?.prompt_tokens ?? null,
      outputTokens: embeddingResponse.usage?.total_tokens ?? null,
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
  if (status === 401) {
    const hint =
      process.env.NODE_ENV === 'production'
        ? ''
        : ' (Local dev tip: exported shell env vars override .env.local; restart `next dev` after updating.)'
    return `OpenAI authentication failed. Check OPENAI_API_KEY.${hint}`
  }
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
  const initialAssistantMessage =
    input.messages[0]?.role === 'assistant' && input.messages[0]?.content.trim()
      ? input.messages[0].content
      : INITIAL_RECOVER_ASSISTANT_MESSAGE

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
          content: initialAssistantMessage,
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
      await maybeSendAlert({
        reason: alertReason,
        userId: parsed.data.userId ?? null,
        sessionId: parsed.data.sessionId,
      })
    }

    const { context, sources } = lastUserMessage
      ? await getRecoverContext(lastUserMessage)
      : { context: '', sources: [] }

    // Fetch user progress data for personalization
    const userContext = parsed.data.userId
      ? await getUserProgressContext(parsed.data.userId, supabase)
      : undefined

    const systemMessages = [{ role: 'system' as const, content: getRecoverSystemPrompt(userContext) }]
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

    // Log chat completion usage
    void logUsageEvent({
      userId: parsed.data.userId,
      eventName: 'recover-chat.completion',
      endpoint: '/api/recover-chat',
      model: 'gpt-4o',
      inputTokens: completion.usage?.prompt_tokens ?? null,
      outputTokens: completion.usage?.completion_tokens ?? null,
      metadata: { sessionId: parsed.data.sessionId }
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
