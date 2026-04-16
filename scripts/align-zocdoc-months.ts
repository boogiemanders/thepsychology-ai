import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^["']|["']$/g,'')]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Snap to month boundaries: 0=Apr, 0.25=May, 0.50=Jun, 0.75=Jul, 1.0=end of Jul.
const phases = [
  { kind: 'build', start: 0.00, end: 0.25, label: 'Google admin + Chrome store' },
]
const steps = [
  { text: 'Get Google Workspace admin access', done: false },
  { text: 'Submit plugin to Chrome Web Store (private)', done: false },
  { text: 'Pilot with P02', done: false, start_at: 0.25, due_at: 0.50 },
  { text: 'Push-install to clinicians', done: false, start_at: 0.50, due_at: 0.75 },
]

async function run() {
  const { error } = await sb.from('timeline_projects')
    .update({ phases, steps })
    .eq('timeline_key', 'inzinna-leadership').eq('num', '01')
  if (error) console.error(error); else console.log('ok')
}
run()
