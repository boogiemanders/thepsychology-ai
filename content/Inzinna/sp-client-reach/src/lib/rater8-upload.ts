// Pure helpers for the rater8 auto-upload pipeline. No chrome.* APIs here so
// everything is unit-testable in Node (test/run-rater8-upload.mjs).
//
// Protocol constants come from a captured real upload (2026-07-01), see
// docs/superpowers/specs/2026-07-01-rater8-auto-upload-design.md.

export const RATER8_ORIGIN = 'https://rave.rater8.com'
export const RATER8_TENANT_ID = 9008
export const RATER8_POLLING_FOLDER_ID = '2719'
export const RATER8_POLLING_FOLDER_NAME = 'Inzinna Therapy Group - Simple Practice - Manual'

const SP = 'https://secure.simplepractice.com'

export function isoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// The date range still owed to rater8: the day after the last successful
// upload through yesterday, capped at the trailing 7 days (a lost sent-log
// must never resend weeks of visits). null = nothing owed.
export function owedWindow(
  lastUploadedThrough: string | null,
  now: Date
): { start: string; end: string } | null {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const floor = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  let start: Date
  if (lastUploadedThrough) {
    start = parseIso(lastUploadedThrough)
    start.setDate(start.getDate() + 1)
  } else {
    start = new Date(yesterday.getTime())
  }
  if (start.getTime() < floor.getTime()) start = floor
  if (start.getTime() > yesterday.getTime()) return null
  return { start: isoDate(start), end: isoDate(yesterday) }
}

// Same two SimplePractice report URLs the app page uses (app.ts reportUrls)
export function reportUrls(startsAt: string, endsAt: string): string[] {
  const f = encodeURIComponent
  return [
    `${SP}/frontend/client-attendance-report-rows.csv?filter%5BstartsAt%5D=${f(startsAt)}&filter%5BendsAt%5D=${f(endsAt)}&sort=clientName`,
    `${SP}/frontend/client-details-report-rows.csv?filter%5BclientStatus%5D=Active&sort=clientName`,
  ]
}

export function csvFilename(start: string, end: string): string {
  return `rater8_${start}_to_${end}.csv`
}

// SHA-256 of the joined row: the sent-log stores fingerprints, not PHI
export async function hashRow(row: string[]): Promise<string> {
  const data = new TextEncoder().encode(row.join('|'))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Drop rows already uploaded (sent-log hit) and collapse duplicates within
// the batch (a same-day repeat visit = one review ask). Returns the surviving
// rows plus their hashes so the caller can record them after a verified upload.
export async function filterUnsent(
  rows: string[][],
  sentLog: Record<string, string>
): Promise<{ fresh: string[][]; hashes: string[] }> {
  const fresh: string[][] = []
  const hashes: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const h = await hashRow(row)
    if (sentLog[h] || seen.has(h)) continue
    seen.add(h)
    fresh.push(row)
    hashes.push(h)
  }
  return { fresh, hashes }
}

export function pruneSentLog(
  sentLog: Record<string, string>,
  now: Date,
  keepDays = 30
): Record<string, string> {
  const floor = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - keepDays))
  const out: Record<string, string> = {}
  for (const [hash, date] of Object.entries(sentLog)) {
    if (date >= floor) out[hash] = date
  }
  return out
}

// Raw record of one HTTP exchange made inside the rater8 tab
export interface UploadStep {
  step: string // 'store' | 'process' | 'error'
  status: number
  body: string
}

export interface UploadVerdict {
  ok: boolean
  loggedOut: boolean
  detail: string
}

function parseJson(body: string): Record<string, unknown> | null {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

// Interpret the two-step upload exchange. Logged-out shows up as
// unAuthorizedRequest: true or as an HTML login page instead of JSON.
export function evaluateUpload(steps: UploadStep[]): UploadVerdict {
  if (!steps.length) return { ok: false, loggedOut: false, detail: 'no response from the rater8 tab' }
  const err = steps.find((s) => s.step === 'error')
  if (err) return { ok: false, loggedOut: false, detail: err.body }
  for (const s of steps) {
    const j = parseJson(s.body)
    if (j === null) return { ok: false, loggedOut: true, detail: `${s.step}: got a login page instead of JSON` }
    if (j.unAuthorizedRequest) return { ok: false, loggedOut: true, detail: `${s.step}: not signed in` }
    if (s.status < 200 || s.status >= 300 || !j.success) {
      return { ok: false, loggedOut: false, detail: `${s.step}: HTTP ${s.status}` }
    }
  }
  const process = steps.find((s) => s.step === 'process')
  if (!process) return { ok: false, loggedOut: false, detail: 'file stored but processing never started' }
  const result = (parseJson(process.body)?.result ?? {}) as { filesUploaded?: number; filesFailed?: number }
  const uploaded = result.filesUploaded ?? 0
  const failed = result.filesFailed ?? 0
  if (failed > 0 || uploaded < 1) {
    return { ok: false, loggedOut: false, detail: `rater8 processed ${uploaded} file(s), rejected ${failed}` }
  }
  return { ok: true, loggedOut: false, detail: `rater8 accepted ${uploaded} file(s)` }
}
