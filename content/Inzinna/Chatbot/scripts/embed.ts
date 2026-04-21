#!/usr/bin/env npx tsx
// Embed kb.jsonl via OpenAI text-embedding-3-small, upsert into Supabase kb_chunks.
// Run: npx tsx content/Inzinna/Chatbot/scripts/embed.ts

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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing in .env.local')
if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing in .env.local')
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing in .env.local')

interface Chunk {
  id: string
  doc: string
  title: string
  category: string
  audience: string
  content: string
  links: string[]
  related: string[]
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const kbPath = join(ROOT, 'out', 'kb.jsonl')
const chunks: Chunk[] = readFileSync(kbPath, 'utf8')
  .trim()
  .split('\n')
  .map(l => JSON.parse(l))

console.log(`Embedding ${chunks.length} chunks with text-embedding-3-small...`)

const BATCH = 64

async function main() {
  let done = 0
  for (let i = 0; i < chunks.length; i += BATCH) {
  const slice = chunks.slice(i, i + BATCH)
  // Prepend title so titles contribute to the embedding even when the body doesn't repeat them.
  const inputs = slice.map(c => `${c.title}\n\n${c.content}`.slice(0, 8000))

    const resp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: inputs,
    })

    const rows = slice.map((c, idx) => ({
      id: c.id,
      doc: c.doc,
      title: c.title,
      category: c.category,
      audience: c.audience,
      content: c.content,
      links: c.links,
      related: c.related,
      embedding: resp.data[idx].embedding,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('kb_chunks').upsert(rows as any, { onConflict: 'id' })
    if (error) {
      console.error('upsert error:', error)
      process.exit(1)
    }
    done += slice.length
    console.log(`  upserted ${done}/${chunks.length}`)
  }
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
