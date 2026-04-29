import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface MatchRow {
  id: string
  doc: string
  title: string
  category: string
  audience: string
  content: string
  links: string[]
  score: number
}

const SYSTEM_PROMPT = `You are the Inzinna internal assistant for Inzinna Psychological Services.
Answer staff questions about clinic operations, compliance, booking, billing, HR, benefits, and the brand using ONLY the CONTEXT below.

Voice (from the Inzinna brand strategy):
- The Clear-Eyed Guide. Grounded. Direct. Human.
- Listen first. Name what's real. Don't hide behind technique or jargon.
- Plain language. Short sentences. No buzzwords, no marketing fluff, no hype.
- Warm without being soft. Honest without being cold.
- Say the hard thing out loud when it matters. Don't pad answers.

Rules:
- Ground every statement in the CONTEXT. If the answer is not in the CONTEXT, say "I don't have that in the manual. Ask Greg (clinical) or Carlos (admin)."
- Quote phone numbers, dollar amounts, CPT codes, and hour counts verbatim from the CONTEXT. Never paraphrase numbers.
- Keep answers short. 3-6 sentences unless the user asks for steps. For workflows, use a numbered list that matches the source.
- Cite sources inline like [1], [2] matching the order of the CONTEXT blocks. Do not invent citations.
- Do NOT give clinical opinions. For clinical questions ("should I do X in session"), say "consult Greg or Bret."
- No emojis. No em-dashes. Use periods, commas, or colons instead.`

export async function POST(req: Request) {
  const { question } = (await req.json().catch(() => ({}))) as { question?: string }

  if (!question || typeof question !== 'string' || question.trim().length < 3) {
    return NextResponse.json({ error: 'Missing or too-short question' }, { status: 400 })
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const openai = new OpenAI({ apiKey: openaiKey })

  // 1. Embed the question.
  const emb = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question,
  })
  const queryEmbedding = emb.data[0].embedding

  // 2. Hybrid retrieve from Supabase.
  const { data: matches, error } = await supabase.rpc('match_kb_chunks', {
    query_embedding: queryEmbedding,
    query_text: question,
    match_count: 6,
  })

  if (error) {
    console.error('match_kb_chunks rpc failed:', error)
    return NextResponse.json({ error: 'Retrieval failed', detail: error.message }, { status: 500 })
  }

  const rows = (matches || []) as MatchRow[]

  if (rows.length === 0) {
    return NextResponse.json({
      answer: "I don't have that in the manual — ask Greg (clinical) or Carlos (admin).",
      sources: [],
    })
  }

  // 3. Build context with explicit citation numbers.
  const docLabel = (doc: string) =>
    doc === 'clinic-manual' ? 'Clinic Manual'
    : doc === 'employee-handbook' ? 'Employee Handbook'
    : doc === 'brand-strategy' ? 'Brand Strategy'
    : doc
  const context = rows
    .map((r, i) => `[${i + 1}] ${r.title} (${docLabel(r.doc)})\n${r.content}`)
    .join('\n\n---\n\n')

  // 4. Generate grounded answer.
  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `QUESTION: ${question}\n\nCONTEXT:\n${context}` },
    ],
  })

  const answer = chat.choices[0]?.message?.content ?? ''

  return NextResponse.json({
    answer,
    sources: rows.map(r => ({
      id: r.id,
      title: r.title,
      doc: r.doc,
      category: r.category,
      score: Math.round(r.score * 1000) / 1000,
    })),
    topChunk: rows[0]?.id ?? null,
  })
}
