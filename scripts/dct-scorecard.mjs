// DCT A/B scorecard: per-variant sends, clicks (GA4), replies, and unsubscribes.
// This is the "learning" readout for the outreach loop — it tells you which email
// variant actually moves engagement so you can kill the losers and scale the winner.
//
// Run from the repo root (needs .env.local: SUPABASE_SERVICE_ROLE_KEY,
// NEXT_PUBLIC_SUPABASE_URL, GA4_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_KEY):
//   node scripts/dct-scorecard.mjs

import fs from 'fs'
import crypto from 'crypto'
import path from 'path'

// --- env ---
function loadEnv() {
  const candidates = [process.env.ENV_FILE, path.join(process.cwd(), '.env.local')].filter(Boolean)
  const env = { ...process.env }
  for (const f of candidates) {
    if (f && fs.existsSync(f)) {
      for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
        if (m && !env[m[1]]) env[m[1]] = m[2]
      }
      break
    }
  }
  return env
}
const env = loadEnv()
const unq = (s) => (s || '').trim().replace(/^["']|["']$/g, '')
const SURL = unq(env.NEXT_PUBLIC_SUPABASE_URL)
const SKEY = unq(env.SUPABASE_SERVICE_ROLE_KEY)
if (!SURL || !SKEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}
const sh = { apikey: SKEY, Authorization: `Bearer ${SKEY}` }

async function rest(p) {
  const r = await fetch(`${SURL}/rest/v1/${p}`, { headers: sh })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json()
}
async function count(table, filter = '') {
  const r = await fetch(`${SURL}/rest/v1/${table}?select=email${filter}`, {
    headers: { ...sh, Prefer: 'count=exact', Range: '0-0' },
  })
  return Number.parseInt(r.headers.get('content-range')?.split('/')[1] || '0', 10)
}

// --- GA4 clicks per utm_campaign (optional; skipped if no SA key) ---
async function gaClicks(utmCampaigns) {
  const PROP = unq(env.GA4_PROPERTY_ID)
  let raw = unq(env.GOOGLE_SERVICE_ACCOUNT_KEY)
  if (!PROP || !raw) return {}
  let sa
  try {
    sa = JSON.parse(raw)
  } catch {
    try {
      sa = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    } catch {
      return {}
    }
  }
  const b64 = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const now = Math.floor(Date.now() / 1000)
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const c = b64(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  )
  const s = crypto.createSign('RSA-SHA256')
  s.update(`${h}.${c}`)
  const jwt = `${h}.${c}.${b64(s.sign(sa.private_key))}`
  const tr = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const tok = (await tr.json()).access_token
  if (!tok) return {}
  const rr = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROP}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: '2026-06-01', endDate: 'today' }],
      dimensions: [{ name: 'sessionCampaignName' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'keyEvents' }],
      dimensionFilter: {
        filter: { fieldName: 'sessionCampaignName', inListFilter: { values: utmCampaigns } },
      },
    }),
  })
  const j = await rr.json()
  const out = {}
  for (const row of j.rows || []) {
    out[row.dimensionValues[0].value] = {
      sessions: +row.metricValues[0].value,
      users: +row.metricValues[1].value,
      keyEvents: +row.metricValues[2].value,
    }
  }
  return out
}

function pct(n, d) {
  return d ? `${((100 * n) / d).toFixed(1)}%` : '-'
}

async function main() {
  const campaigns = await rest('dct_campaigns?select=id,name,variant,utm_campaign,active,subject&order=id.asc')
  const replies = await rest('dct_replies?select=campaign_id,reply_type')
  const suppressions = await rest('dct_suppressions?select=email')
  const contacts = await rest('dct_contacts?select=email,campaign_id,followup_campaign_id')

  // Map each suppressed (unsubscribed) email to the variant it was assigned to.
  const suppSet = new Set(suppressions.map((s) => (s.email || '').trim().toLowerCase()))
  const unsubByCampaign = {}
  for (const c of contacts) {
    const e = (c.email || '').trim().toLowerCase()
    if (!suppSet.has(e)) continue
    const cid = c.followup_campaign_id ?? c.campaign_id
    if (cid != null) unsubByCampaign[cid] = (unsubByCampaign[cid] || 0) + 1
  }

  const repliesByCampaign = {}
  for (const r of replies) {
    const cid = r.campaign_id
    if (cid == null) continue
    repliesByCampaign[cid] = repliesByCampaign[cid] || {}
    repliesByCampaign[cid][r.reply_type] = (repliesByCampaign[cid][r.reply_type] || 0) + 1
  }

  const ga = await gaClicks(campaigns.map((c) => c.utm_campaign).filter(Boolean))

  console.log('\n=== DCT A/B Scorecard ===\n')
  for (const c of campaigns) {
    const coldSent = await count('dct_contacts', `&campaign_id=eq.${c.id}`)
    const fuSent = await count('dct_contacts', `&followup_campaign_id=eq.${c.id}`)
    const totalSent = coldSent + fuSent
    const reps = repliesByCampaign[c.id] || {}
    const totalReps = Object.values(reps).reduce((a, b) => a + b, 0)
    const positive = reps.positive || 0
    const clicks = ga[c.utm_campaign] || { sessions: 0, users: 0, keyEvents: 0 }
    const unsubs = unsubByCampaign[c.id] || 0

    const tag = `${c.variant ? `[${c.variant}] ` : ''}${c.name}${c.active ? ' (ACTIVE)' : ''}`
    console.log(tag)
    console.log(`  subject:   ${c.subject}`)
    console.log(`  sent:      ${totalSent}  (cold ${coldSent} / followup ${fuSent})`)
    console.log(`  clicks:    ${clicks.sessions} sessions, ${clicks.users} users, ${clicks.keyEvents} conv  | CTR ${pct(clicks.sessions, totalSent)}  [utm ${c.utm_campaign}]`)
    console.log(`  replies:   ${totalReps} total  (positive ${positive})  | reply rate ${pct(totalReps, totalSent)}`)
    console.log(`  unsubs:    ${unsubs}  | ${pct(unsubs, totalSent)}`)
    console.log(`  reply mix: ${Object.keys(reps).length ? JSON.stringify(reps) : '(none)'}\n`)
  }
  if (!Object.keys(ga).length) console.log('(GA4 click data unavailable — check GA4_PROPERTY_ID / GOOGLE_SERVICE_ACCOUNT_KEY)\n')
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
