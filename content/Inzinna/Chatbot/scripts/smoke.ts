#!/usr/bin/env npx tsx
// End-to-end smoke: embed → retrieve → generate, same logic as /api/chatbot.
// Run: npx tsx content/Inzinna/Chatbot/scripts/smoke.ts "your question"

import { config as loadEnv } from 'dotenv'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
loadEnv({ path: join(PROJECT_ROOT, '.env.local') })

const SYSTEM_PROMPT = `You are the DIPS internal assistant for Dr. Inzinna Psychological Services PLLC.
Answer staff questions about clinic operations, compliance, booking, billing, HR, and benefits using ONLY the CONTEXT below.

Rules:
- Ground every statement in the CONTEXT. If the answer is not in the CONTEXT, say "I don't have that in the manual — ask Greg (clinical) or Carlos (admin)."
- Quote phone numbers, dollar amounts, CPT codes, and hour counts verbatim from the CONTEXT. Never paraphrase numbers.
- Keep answers short — 3-6 sentences unless the user asks for steps. For workflows, use a numbered list that matches the source.
- Cite sources inline like [1], [2] matching the order of the CONTEXT blocks. Do not invent citations.
- Do NOT give clinical opinions. For clinical questions ("should I do X in session"), say "consult Greg or Bret."
- No emojis.`

async function ask(question: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const emb = await openai.embeddings.create({ model: 'text-embedding-3-small', input: question })
  const { data: matches, error } = await supabase.rpc('match_kb_chunks', {
    query_embedding: emb.data[0].embedding,
    query_text: question,
    match_count: 6,
  })
  if (error) { console.error(error); return }
  const rows = (matches || []) as any[]
  const context = rows
    .map((r, i) => `[${i + 1}] ${r.title} (${r.doc})\n${r.content}`)
    .join('\n\n---\n\n')

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `QUESTION: ${question}\n\nCONTEXT:\n${context}` },
    ],
  })

  console.log('Q:', question)
  console.log('A:', chat.choices[0].message.content)
  console.log('\nSources:')
  rows.forEach((r, i) => console.log(`  [${i + 1}] ${r.title} (${r.doc})`))
}

const questions = process.argv.slice(2).length
  ? [process.argv.slice(2).join(' ')]
  : [
      'What CPT code for a 45-minute session?',
      'What is the NY Child Abuse Hotline number?',
      'Can I use ChatGPT with client info?',
      'How much paid sick leave do I get?',
    ]

async function main() {
  for (const q of questions) {
    await ask(q)
    console.log('\n' + '='.repeat(80) + '\n')
  }
}
main().catch(e => { console.error(e); process.exit(1) })
