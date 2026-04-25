import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { logUsageEvent } from '@/lib/usage-events'
import { THERAPY_SYSTEM_PROMPT } from '@/lib/therapy/system-prompt'
import { messageSchema, type CrisisResponse } from '@/lib/therapy/schemas'
import {
  regexCrisisCheck,
  miniCrisisCheck,
  isCrisisAdjacent,
} from '@/lib/therapy/safety-classifier'
import { evaluateDraft, SAFE_FALLBACK_MESSAGE } from '@/lib/therapy/post-draft-evaluator'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Hybrid router: premium for first turn / complex / crisis-adjacent, mini otherwise.
// Model IDs verified elsewhere in this repo.
const PREMIUM_MODEL = 'gpt-4o'
const DEFAULT_MODEL = 'gpt-4o-mini'

function pickModel(content: string, priorMessageCount: number): string {
  if (priorMessageCount === 0) return PREMIUM_MODEL
  if (content.length > 500) return PREMIUM_MODEL
  if (isCrisisAdjacent(content)) return PREMIUM_MODEL
  return DEFAULT_MODEL
}

const CRISIS_RESPONSE: CrisisResponse = {
  crisis: true,
  message:
    "I hear what you are saying, and I am worried about you. You deserve to talk to a real person right now.\n\n- Call or text 988 (Suicide & Crisis Lifeline). 24/7, free, confidential.\n- Text HOME to 741741 (Crisis Text Line).\n- If you are in immediate danger, call 911.\n\nI am AI. I cannot replace a person on the other end of a call, and this is exactly the moment to reach one. I will still be here when you come back.",
  resources: [
    { label: 'Call 988', href: 'tel:988' },
    { label: 'Text 741741', href: 'sms:741741?&body=HOME' },
    { label: 'Call 911', href: 'tel:911' },
  ],
}

export async function POST(request: NextRequest) {
  const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseClient(
    { global: { headers: { Authorization: `Bearer ${authToken}` } } },
    { requireServiceRole: true }
  )
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid message' }, { status: 400 })

  const { session_id, content } = parsed.data

  const { data: session, error: sessionError } = await supabase
    .from('therapy_sessions')
    .select('id, user_id, ended_at, deleted_at, crisis_events, harm_risk_flag')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  if (session.ended_at || session.deleted_at) {
    return NextResponse.json({ error: 'Session is closed' }, { status: 400 })
  }

  const { data: priorMessages } = await supabase
    .from('therapy_messages')
    .select('role, content, message_index')
    .eq('session_id', session_id)
    .order('message_index', { ascending: true })

  const priorCount = priorMessages?.length ?? 0
  const userIndex = priorCount

  // Run regex + mini classifier concurrently. Regex is sync; mini awaits with a 2s timeout.
  const regexResult = regexCrisisCheck(content)
  const miniResult = await miniCrisisCheck(content)
  const isCrisis = regexResult.hit || miniResult.crisis

  const userClassification = {
    regex: regexResult,
    mini: miniResult,
    is_crisis: isCrisis,
  }

  await supabase.from('therapy_messages').insert({
    session_id,
    user_id: user.id,
    role: 'user',
    content,
    message_index: userIndex,
    safety_classification: userClassification,
  })

  if (isCrisis) {
    const trigger =
      regexResult.hit && miniResult.crisis
        ? 'regex+mini'
        : regexResult.hit
          ? 'regex'
          : 'mini'

    const crisisEvent = {
      at: new Date().toISOString(),
      message_index: userIndex,
      trigger,
      regex_patterns: regexResult.patterns_matched,
      mini_category: miniResult.category,
      mini_confidence: miniResult.confidence,
    }
    const existingEvents = Array.isArray(session.crisis_events) ? session.crisis_events : []

    await supabase
      .from('therapy_sessions')
      .update({
        harm_risk_flag: true,
        crisis_events: [...existingEvents, crisisEvent],
      })
      .eq('id', session_id)

    await supabase.from('therapy_messages').insert({
      session_id,
      user_id: user.id,
      role: 'assistant',
      content: CRISIS_RESPONSE.message,
      message_index: userIndex + 1,
      safety_classification: { crisis_response: true, trigger, ...userClassification },
      model_used: 'hardcoded_crisis',
    })

    await logUsageEvent({
      userId: user.id,
      eventName: 'therapy-chat.crisis_triggered',
      endpoint: '/api/therapy-chat/message',
      model: 'hardcoded_crisis',
      metadata: {
        session_id,
        message_index: userIndex,
        trigger,
        regex_patterns: regexResult.patterns_matched,
        mini_category: miniResult.category,
        mini_confidence: miniResult.confidence,
      },
    })

    return NextResponse.json(CRISIS_RESPONSE, { status: 200 })
  }

  const model = pickModel(content, priorCount)
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: THERAPY_SYSTEM_PROMPT },
    ...(priorMessages ?? []).map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
    { role: 'user' as const, content },
  ]

  // Phase 3: buffer the full draft server-side so the post-draft evaluator can gate it
  // BEFORE anything streams to the client. Client's reader loop handles one big chunk fine.
  let draftResponse
  try {
    draftResponse = await client.chat.completions.create({
      model,
      messages: openaiMessages,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: 1500,
    })
  } catch (err) {
    console.error('OpenAI create failed:', err)
    return NextResponse.json({ error: 'Upstream model error' }, { status: 502 })
  }

  let draftText = ''
  let inputTokens = 0
  let outputTokens = 0
  try {
    for await (const chunk of draftResponse) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) draftText += delta
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0
        outputTokens = chunk.usage.completion_tokens ?? 0
      }
    }
  } catch (err) {
    console.error('therapy-chat draft collection failed:', err)
    return NextResponse.json({ error: 'Upstream model error' }, { status: 502 })
  }

  if (!draftText.trim()) {
    return NextResponse.json({ error: 'Empty model response' }, { status: 502 })
  }

  // Post-draft safety evaluator. Unsafe drafts are swapped for a safe fallback.
  const evalResult = await evaluateDraft({
    user_message: content,
    draft: draftText,
    context_high_risk_flag: !!session.harm_risk_flag,
  })

  const swapped = !evalResult.safe
  const finalText = swapped ? SAFE_FALLBACK_MESSAGE : draftText

  if (swapped) {
    console.warn('[therapy-chat] draft swapped for safe fallback:', {
      session_id,
      turn_index: userIndex,
      reasons: evalResult.reasons,
    })
  }

  await supabase.from('therapy_messages').insert({
    session_id,
    user_id: user.id,
    role: 'assistant',
    content: finalText,
    message_index: userIndex + 1,
    model_used: swapped ? `${model}_swapped_fallback` : model,
    tokens_in: inputTokens,
    tokens_out: outputTokens,
    safety_classification: {
      input: userClassification,
      output_eval: evalResult,
      swapped,
      original_draft_if_swapped: swapped ? draftText.slice(0, 1500) : null,
    },
  })

  await logUsageEvent({
    userId: user.id,
    eventName: swapped ? 'therapy-chat.draft_swapped' : 'therapy-chat.message',
    endpoint: '/api/therapy-chat/message',
    model,
    inputTokens,
    outputTokens,
    metadata: {
      session_id,
      turn_index: userIndex,
      eval_safe: evalResult.safe,
      eval_reasons: evalResult.reasons,
      eval_latency_ms: evalResult.latency_ms,
      eval_error: evalResult.error ?? null,
    },
  })

  const finalStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(finalText))
      controller.close()
    },
  })

  return new NextResponse(finalStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
