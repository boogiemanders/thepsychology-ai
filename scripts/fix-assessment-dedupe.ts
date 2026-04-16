import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^["']|["']$/g,'')]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Drop redundant phases that duplicate step bars at the same range.
// Steps already render as bars; phases stacking on top causes text collision.
const phases: unknown[] = []
const steps = [
  { text: 'Apply Bret feedback on BAARS/ADHD-RS', done: false, start_at: 0.10, due_at: 0.22 },
  { text: 'Finalize scoring logic', done: false, start_at: 0.22, due_at: 0.25 },
  { text: 'Build Trail-making test', done: false, start_at: 0.25, due_at: 0.375 },
  { text: 'Build Tower of Hanoi', done: false, start_at: 0.375, due_at: 0.50 },
  { text: 'Rorschach administration flow', done: false, start_at: 0.50, due_at: 0.625 },
  { text: 'Rorschach scoring', done: false, start_at: 0.625, due_at: 0.75 },
  { text: 'Rorschach interpretation', done: false, start_at: 0.75, due_at: 1.00 },
]

async function run() {
  const { error } = await sb.from('timeline_projects')
    .update({ phases, steps })
    .eq('timeline_key', 'inzinna-leadership').eq('num', '05')
  if (error) console.error(error); else console.log('ok')
}
run()
