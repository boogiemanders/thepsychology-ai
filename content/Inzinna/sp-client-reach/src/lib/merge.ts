import { parseCsv, rowsToObjects } from './csv'

export interface MergedRow {
  clientName: string
  location: string // Manhattan | Virtual | Unknown
  lastVisit: string // mm/dd/yyyy of most recent attended (Show) appointment
  phone: string
  email: string
  provider: string
  showsManhattan: number
  showsVirtual: number
  match: string // exact | normalized | first+last | couple_member | not_found
  note: string
}

export interface MergeStats {
  appointments: number
  attendanceClients: number
  detailClients: number
  rows: number
  matched: number
  notFound: number
  coupleMembers: number
  missingContact: number
}

export interface MergeResult {
  rows: MergedRow[]
  // one row per attended (Show) appointment, joined to contact info — this is the
  // rater8 feed shape (appointment-level, what rater8 asks for)
  rater8: string[][]
  stats: MergeStats
}

interface Appt {
  date: Date
  office: string
  status: string
  clinician: string
}

const OFFICE_LOCATION: Record<string, string> = {
  Manhattan: 'Manhattan',
  'Video Office': 'Virtual',
}

function parseDateUs(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim())
  if (!m) return null
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]))
  return isNaN(d.getTime()) ? null : d
}

function fmtDateUs(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

// lowercase, drop quoted nicknames ("Bobby"), periods, apostrophes, extra spaces
export function normName(s: string): string {
  return s
    .replace(/"[^"]*"/g, ' ')
    .replace(/[.']/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

interface DetailIndex {
  exact: Map<string, Record<string, string>>
  norm: Map<string, Record<string, string>>
  firstLast: Map<string, Record<string, string>[]>
}

// When the same client name appears twice in the details export, prefer the
// row that has contact info, then the one seen most recently.
function pickDetailRow(rows: Record<string, string>[]): Record<string, string> {
  return rows
    .slice()
    .sort((a, b) => {
      const hasA = a['Phone number'] || a['Email'] ? 1 : 0
      const hasB = b['Phone number'] || b['Email'] ? 1 : 0
      if (hasA !== hasB) return hasB - hasA
      const dA = parseDateUs(a['Last appointment'] || '')?.getTime() ?? 0
      const dB = parseDateUs(b['Last appointment'] || '')?.getTime() ?? 0
      return dB - dA
    })[0]
}

function buildDetailIndex(details: Record<string, string>[]): DetailIndex {
  const byName = new Map<string, Record<string, string>[]>()
  for (const r of details) {
    const name = (r['Client'] || '').trim()
    if (!name) continue
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name)!.push(r)
  }
  const exact = new Map<string, Record<string, string>>()
  const norm = new Map<string, Record<string, string>>()
  const firstLast = new Map<string, Record<string, string>[]>()
  for (const [name, rows] of byName) {
    const row = pickDetailRow(rows)
    exact.set(name, row)
    const n = normName(name)
    if (!norm.has(n)) norm.set(n, row)
    const toks = n.split(' ')
    if (toks.length >= 2) {
      const key = `${toks[0]}|${toks[toks.length - 1]}`
      if (!firstLast.has(key)) firstLast.set(key, [])
      firstLast.get(key)!.push(row)
    }
  }
  return { exact, norm, firstLast }
}

function lookupClient(
  name: string,
  idx: DetailIndex
): { row: Record<string, string> | null; how: string } {
  const exact = idx.exact.get(name)
  if (exact) return { row: exact, how: 'exact' }
  const n = idx.norm.get(normName(name))
  if (n) return { row: n, how: 'normalized' }
  const toks = normName(name).split(' ')
  if (toks.length >= 2) {
    const hits = idx.firstLast.get(`${toks[0]}|${toks[toks.length - 1]}`)
    if (hits && hits.length === 1) return { row: hits[0], how: 'first+last' }
  }
  return { row: null, how: 'not_found' }
}

// rater8 maps each of the 6 main providers to their own resource by their
// SimplePractice clinician ID; everyone else (practice clinicians + all current
// and future trainees, interns, externs, new hires) is labeled "Trainee" so
// they route to the generic Inzinna Therapy Group resource with no new mapping.
// Keyed by a distinctive last-name token in the clinician's name.
const MAIN_PROVIDER_IDS: Record<string, string> = {
  inzinna: '1428233', // Gregory Inzinna (Greg)
  boatwright: '1486605', // Bret Boatwright
  singh: '1726930', // Lorin Singh
  chan: '1973632', // Anders Chan
  difranco: '1717850', // Filomena DiFranco
  espinal: '1822167', // Juan Carlos Espinal (Carlos)
}

function providerOrTrainee(clinician: string): string {
  const tokens = clinician.toLowerCase().replace(/[.,]/g, '').split(/\s+/)
  for (const t of tokens) {
    if (MAIN_PROVIDER_IDS[t]) return MAIN_PROVIDER_IDS[t]
  }
  return 'Trainee'
}

// "Anders Chan" -> ["Anders", "Chan"]; single token -> last name blank
function splitName(full: string): [string, string] {
  const toks = full.trim().split(/\s+/)
  if (toks.length <= 1) return [toks[0] ?? '', '']
  return [toks.slice(0, -1).join(' '), toks[toks.length - 1]]
}

// "Ann & Bob Smith" -> ["Ann Smith", "Bob Smith"]
// "Ann Jones & Bob Smith" -> ["Ann Jones", "Bob Smith"]
export function expandCouple(name: string): string[] | null {
  if (!name.includes(' & ')) return null
  const sides = name.split(' & ').map((s) => s.trim()).filter(Boolean)
  if (sides.length < 2) return null
  const lastNames = sides
    .map((s) => s.split(/\s+/))
    .map((toks) => (toks.length >= 2 ? toks[toks.length - 1] : null))
  const fallbackLast = lastNames.find((l) => l !== null) ?? null
  return sides.map((s) => {
    const toks = s.split(/\s+/)
    if (toks.length >= 2) return s
    return fallbackLast ? `${s} ${fallbackLast}` : s
  })
}

export function mergeReports(attendanceCsv: string, detailsCsv: string): MergeResult {
  const attRows = rowsToObjects(parseCsv(attendanceCsv))
  // the attendance export inserts a summary row ("193 clients,11 clinicians,...")
  // right under the header; rows without a real date are skipped
  const appts = attRows.filter((r) => parseDateUs(r['date_of_service'] || ''))
  const details = rowsToObjects(parseCsv(detailsCsv)).filter((r) => (r['Client'] || '').trim())

  const byClient = new Map<string, Appt[]>()
  for (const r of appts) {
    const name = (r['client_name'] || '').trim()
    if (!name) continue
    if (!byClient.has(name)) byClient.set(name, [])
    byClient.get(name)!.push({
      date: parseDateUs(r['date_of_service'])!,
      office: (r['office_name'] || '').trim(),
      status: (r['status'] || '').trim(),
      clinician: (r['clinician_name'] || '').trim(),
    })
  }

  const idx = buildDetailIndex(details)
  const rows: MergedRow[] = []
  const rater8: string[][] = []
  const stats: MergeStats = {
    appointments: appts.length,
    attendanceClients: byClient.size,
    detailClients: idx.exact.size,
    rows: 0,
    matched: 0,
    notFound: 0,
    coupleMembers: 0,
    missingContact: 0,
  }

  for (const [name, clientAppts] of byClient) {
    const sorted = clientAppts.slice().sort((a, b) => b.date.getTime() - a.date.getTime())
    const shows = sorted.filter((a) => a.status === 'Show')
    const showsManhattan = shows.filter((a) => a.office === 'Manhattan').length
    const showsVirtual = shows.filter((a) => a.office === 'Video Office').length
    let office: string | null = null
    for (const pool of [shows, sorted]) {
      const hit = pool.find((a) => OFFICE_LOCATION[a.office])
      if (hit) {
        office = hit.office
        break
      }
    }
    const location = office ? OFFICE_LOCATION[office] : 'Unknown'
    const lastVisit = shows.length ? fmtDateUs(shows[0].date) : ''
    const provider = (shows[0] ?? sorted[0])?.clinician ?? ''

    // couples appear in attendance as one name; contact info lives on each member
    const coupleMembers = idx.exact.has(name) ? null : expandCouple(name)
    const targets = coupleMembers
      ? coupleMembers.map((m) => ({ name: m, couple: name }))
      : [{ name, couple: null as string | null }]

    for (const t of targets) {
      const { row, how } = lookupClient(t.name, idx)
      const match = t.couple && row ? 'couple_member' : how
      const phone = row?.['Phone number'] ?? ''
      const email = row?.['Email'] ?? ''
      if (row) stats.matched++
      else stats.notFound++
      if (t.couple && row) stats.coupleMembers++
      if (!phone && !email) stats.missingContact++

      // rater8 feed: one row per attended visit for anyone we can reach
      if (phone || email) {
        const [firstName, lastName] = splitName(t.name)
        for (const a of shows) {
          rater8.push([
            firstName,
            lastName,
            email,
            phone,
            a.clinician,
            providerOrTrainee(a.clinician),
            OFFICE_LOCATION[a.office] ?? a.office,
            fmtDateUs(a.date),
            a.status,
          ])
        }
      }

      rows.push({
        clientName: t.name,
        location,
        lastVisit,
        phone,
        email,
        provider,
        showsManhattan,
        showsVirtual,
        match,
        note: t.couple
          ? `from couple: ${t.couple}`
          : row
            ? ''
            : 'not in client details export (archived?)',
      })
    }
  }

  rows.sort((a, b) => a.location.localeCompare(b.location) || a.clientName.localeCompare(b.clientName))
  // rater8 feed sorted by visit date, then name (column index: 7=date, 1=last, 0=first)
  const sortable = (us: string) => us.split('/').reverse().join('')
  rater8.sort(
    (a, b) =>
      sortable(a[7]).localeCompare(sortable(b[7])) ||
      a[1].localeCompare(b[1]) ||
      a[0].localeCompare(b[0])
  )
  stats.rows = rows.length
  return { rows, rater8, stats }
}

export const RATER8_HEADER = [
  'First Name',
  'Last Name',
  'Email',
  'Cell Phone',
  'Provider',
  'Provider ID',
  'Location',
  'Appointment Date',
  'Appointment Status',
]

export const FULL_HEADER = [
  'Client',
  'Location',
  'Last Visit',
  'Phone',
  'Email',
  'Provider',
  'Shows Manhattan',
  'Shows Virtual',
  'Match',
  'Note',
]

export function fullRows(rows: MergedRow[]): string[][] {
  return rows.map((r) => [
    r.clientName,
    r.location,
    r.lastVisit,
    r.phone,
    r.email,
    r.provider,
    String(r.showsManhattan),
    String(r.showsVirtual),
    r.match,
    r.note,
  ])
}
