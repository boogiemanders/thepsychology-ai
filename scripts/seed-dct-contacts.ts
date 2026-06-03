/**
 * One-off seed: load the DCT cold-outreach contacts into Supabase (dct_contacts).
 *
 * Reads the local CSV (kept out of git for PII reasons), computes the same
 * deterministic 93/93/92 segment split the old send_dct.py used (sorted by
 * lowercased email), and upserts on email. Re-running is safe: it never touches
 * sent_at / resend_id, so send progress is preserved.
 *
 * Also applies the dct_contacts migration first via the exec_sql RPC (the same
 * way scripts/apply-feedback-migration.ts applies DDL). If that RPC is missing,
 * it prints the SQL so you can paste it into the Supabase SQL editor instead.
 *
 * Usage (run locally, where .env.local + the CSV live):
 *   bunx tsx scripts/seed-dct-contacts.ts                 # USA list, default path
 *   bunx tsx scripts/seed-dct-contacts.ts --country Canada --csv /path/to/canada.csv
 *
 * CASL note: seeding Canada rows is fine (they just sit there). Actually SENDING
 * to Canada stays gated behind CANADA_SENDS_ENABLED in the send route.
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// --- args ---
function argVal(flag: string, fallback: string): string {
  const i = process.argv.indexOf(flag)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}
const COUNTRY = argVal('--country', 'USA')
const CSV_PATH = argVal('--csv', '/Users/anderschan/Downloads/dct_contacts_277.csv')
const MIGRATION_PATH = path.join(process.cwd(), 'supabase/migrations/20260602_dct_contacts.sql')

// Deterministic split sizes (sorted by email): 93 / 93 / 92 = 278, matching send_dct.py.
const SEG1 = 93
const SEG2 = 93

// Minimal RFC4180-ish CSV parser: handles quoted fields with embedded commas/quotes.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  const header = (rows.shift() || []).map((h) => h.trim())
  return rows
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => {
      const obj: Record<string, string> = {}
      header.forEach((h, idx) => {
        obj[h] = (r[idx] || '').trim()
      })
      return obj
    })
}

async function run() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found: ${CSV_PATH}`)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  // 1. Ensure tables exist (idempotent: create table if not exists ...).
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
  const { error: ddlError } = await supabase.rpc('exec_sql', { sql })
  if (ddlError) {
    console.error('Could not auto-apply the migration via exec_sql:', ddlError.message)
    console.error('Paste this into the Supabase SQL editor, then re-run this script:\n')
    console.error(sql)
    process.exit(1)
  }
  console.log('Tables ready (dct_contacts, dct_send_runs).')

  // 2. Parse CSV, dedupe by lowercased email, sort by lowercased email.
  const parsed = parseCsv(fs.readFileSync(CSV_PATH, 'utf-8'))
  const seen = new Set<string>()
  const contacts = parsed
    .filter((r) => {
      const email = (r.email || '').trim()
      if (!email) return false
      const key = email.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.email.toLowerCase().localeCompare(b.email.toLowerCase()))

  // 3. Assign deterministic segments (only meaningful for the USA 93/93/92 split).
  const rows = contacts.map((r, idx) => ({
    email: r.email.trim(),
    last_name: r.last_name || null,
    greeting: r.greeting || null,
    raw_name: r.raw_name || null,
    institution: r.institution || null,
    country: COUNTRY,
    segment: idx < SEG1 ? 1 : idx < SEG1 + SEG2 ? 2 : 3,
  }))

  console.log(`Parsed ${rows.length} ${COUNTRY} contacts from ${path.basename(CSV_PATH)}.`)

  // 4. Upsert on email. sent_at / resend_id are intentionally omitted so re-runs
  //    update static fields without wiping send progress.
  const { error: upsertError, count } = await supabase
    .from('dct_contacts')
    .upsert(rows, { onConflict: 'email', count: 'exact' })

  if (upsertError) {
    throw upsertError
  }

  console.log(`Upserted ${count ?? rows.length} contacts. Done.`)
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
