#!/usr/bin/env npx tsx
// Eval: hits match_kb_chunks directly (retrieval only — the LLM answer generation
// is tested separately by user feedback). Pass = expected chunk appears in top-K.
// Run: npx tsx content/Inzinna/Chatbot/scripts/eval.ts

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = join(SCRIPT_DIR, '..')
const PROJECT_ROOT = join(SCRIPT_DIR, '..', '..', '..', '..')

loadEnv({ path: join(PROJECT_ROOT, '.env.local') })

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

interface FaqEntry {
  q: string
  expected: string
  acceptable?: string[]
  category: string
}

const TOP_K = 6 // "correct" = any acceptable chunk in top 6 (same as what the LLM sees)
const MATCH_COUNT = 6

const faqPath = join(ROOT, 'out', 'faqs.jsonl')
const faqs: FaqEntry[] = readFileSync(faqPath, 'utf8')
  .trim()
  .split('\n')
  .map(l => JSON.parse(l))

interface Result {
  q: string
  expected: string
  top1: string
  top1Score: number
  rank: number // 1-indexed, 0 if not in top MATCH_COUNT
  pass: boolean
  topResults: { id: string; score: number }[]
}

async function main() {
  console.log(`Running eval on ${faqs.length} questions (pass = expected in top ${TOP_K})\n`)
  const results: Result[] = []

  for (const f of faqs) {
    const emb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: f.q,
    })
    const { data, error } = await supabase.rpc('match_kb_chunks', {
      query_embedding: emb.data[0].embedding,
      query_text: f.q,
      match_count: MATCH_COUNT,
    })
    if (error) {
      console.error(`  ERROR on "${f.q}":`, error.message)
      continue
    }
    const rows = (data || []) as Array<{ id: string; score: number }>
    const accepted = new Set(f.acceptable ?? [f.expected])
    const idx = rows.findIndex(r => accepted.has(r.id))
    const rank = idx < 0 ? 0 : idx + 1
    const pass = rank > 0 && rank <= TOP_K
    results.push({
      q: f.q,
      expected: f.expected,
      top1: rows[0]?.id ?? '',
      top1Score: rows[0]?.score ?? 0,
      rank,
      pass,
      topResults: rows.slice(0, 3).map(r => ({ id: r.id, score: Math.round(r.score * 1000) / 1000 })),
    })
    const mark = pass ? 'PASS' : 'FAIL'
    console.log(
      `  ${mark}  rank=${rank || '—'}  Q: ${f.q.slice(0, 70)}${f.q.length > 70 ? '…' : ''}`
    )
    if (!pass) {
      console.log(`         expected=${f.expected}`)
      console.log(`         top3=${JSON.stringify(results[results.length - 1].topResults)}`)
    }
  }

  const passed = results.filter(r => r.pass).length
  const pct = Math.round((passed / results.length) * 100)
  console.log(`\nAccuracy@${TOP_K}: ${passed}/${results.length} = ${pct}%`)
  if (pct < 85) {
    console.log(`\n⚠  Below 85% gate. Fail list:`)
    for (const r of results.filter(x => !x.pass)) {
      console.log(`  - "${r.q}"`)
      console.log(`    expected=${r.expected}  top=${r.topResults.map(x => x.id).join(', ')}`)
    }
    process.exit(2)
  }
  console.log('\nGate passed.')
}

main().catch(e => { console.error(e); process.exit(1) })
