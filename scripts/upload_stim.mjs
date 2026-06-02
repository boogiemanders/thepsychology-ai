import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { config } from 'dotenv'

config({ path: '/Users/anderschan/thepsychology-ai/.claude/worktrees/wais5-lab/.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('missing supabase env'); process.exit(1)
}

const supabase = createClient(url, key)
const localDir = '/Users/anderschan/thepsychology-ai/.claude/worktrees/wais5-lab/public/wais5/stim1'

const files = readdirSync(localDir).filter(f => f.endsWith('.png')).sort()
console.log(`uploading ${files.length} files...`)

let ok = 0, fail = 0
for (const f of files) {
  const buf = readFileSync(join(localDir, f))
  const { error } = await supabase.storage
    .from('wais5-stim')
    .upload(`stim1/${f}`, buf, { contentType: 'image/png', upsert: true })
  if (error) { console.error('FAIL', f, error.message); fail++ } else { ok++ }
}
console.log(`done: ${ok} ok, ${fail} fail`)
