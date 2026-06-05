import { parseCSV, parseClientPayments, type ClientPaymentRow } from '../lib/csv-parser'
import { computeSosa } from '../lib/sosa'
import { computeRevenue } from '../lib/revenue'
import { calculatePayrollWithHours, applyManualAddition, applyPendingSession } from '../lib/payroll-engine'
import { getManualRate, legend } from '../lib/compensation-legend'
import { formatShortDate } from '../lib/date-utils'
import { buildPayrollWorkbook, suggestFilename } from '../lib/xlsx-exporter'
import { buildJustWorksCSV, suggestJustWorksFilename } from '../lib/justworks-csv-exporter'
import { parseClientRoster } from '../lib/client-roster-parser'
import type { PayrollResultWithHours, ManualAdditionKind, ClinicianSummary, PendingSession, PendingSessionStatus, BretInsurance, ClientRecord } from '../lib/types'

const csvInput = document.getElementById('csv-input') as HTMLInputElement
const uploadLabel = document.querySelector('.upload-label') as HTMLLabelElement
const uploadSection = document.getElementById('upload-section')!
const rosterInput = document.getElementById('roster-input') as HTMLInputElement
const rosterUploadLabel = document.querySelector('.upload-label-secondary') as HTMLLabelElement
const rosterUploadText = document.getElementById('roster-upload-text')!
const rosterToggleBtn = document.getElementById('roster-toggle') as HTMLButtonElement
const rosterClearBtn = document.getElementById('roster-clear') as HTMLButtonElement
const rosterBody = document.getElementById('roster-body')!
const rosterSearchInput = document.getElementById('roster-search') as HTMLInputElement
const rosterListEl = document.getElementById('roster-list')!
const resultsSection = document.getElementById('results-section')!
const clinicianList = document.getElementById('clinician-list')!
const insuranceStat = document.getElementById('insurance-stat')!
const bretSection = document.getElementById('bret-section')!
const bretDetails = document.getElementById('bret-details')!
const clearBtn = document.getElementById('clear-btn')!
const wipeAllBtn = document.getElementById('wipe-all-btn')!
const sendBtn = document.getElementById('send-to-justworks')!
const copyBtn = document.getElementById('copy-json')!
const downloadBtn = document.getElementById('download-xlsx')!
const downloadJwCsvBtn = document.getElementById('download-jw-csv')!
const statusEl = document.getElementById('status')!
const sosaScrapeBtn = document.getElementById('sosa-scrape-btn') as HTMLButtonElement
const sosaRosterStatus = document.getElementById('sosa-roster-status')!
const sosaStat = document.getElementById('sosa-stat')!
const tabBtnPayroll = document.getElementById('tab-btn-payroll') as HTMLButtonElement
const tabBtnRevenue = document.getElementById('tab-btn-revenue') as HTMLButtonElement
const tabPayroll = document.getElementById('tab-payroll')!
const tabRevenue = document.getElementById('tab-revenue')!

let baseResult: PayrollResultWithHours | null = null
let currentResult: PayrollResultWithHours | null = null

interface ManualGroup {
  id: string
  clinician: string
  kind: ManualAdditionKind
  label: string
}

const MANUAL_GROUPS: ManualGroup[] = [
  { id: 'didactic-anders', clinician: 'Anders Chan', kind: 'didactic', label: 'Didactic (Anders)' },
  { id: 'fusion-rachel', clinician: 'Rachel Beyer', kind: 'fusion', label: 'Fusion (Rachel)' },
  { id: 'fusion-izzy', clinician: 'Isabelle Feinstein', kind: 'fusion', label: 'Fusion (Izzy)' },
  { id: 'admin-filomena', clinician: 'Filomena DiFranco', kind: 'admin', label: 'Admin (Filomena)' },
]

interface ManualEntry {
  id: string
  groupId: string
  date: string  // YYYY-MM-DD (HTML input format)
  hours: number
}

let manualEntries: ManualEntry[] = []

// Pending sessions — placeholders Carlos adds Friday morning for Emily's
// afternoon sessions. Each has a status toggle he flips at end of Friday.
const PENDING_CLINICIANS = ['Emily Underwood']

// Which CPT codes to offer in the dropdown per clinician (from legend.rates keys)
function availableCodesFor(clinicianName: string): string[] {
  const cfg = legend[clinicianName]
  if (!cfg) return []
  if (cfg.type === 'cpt_based') return Object.keys(cfg.rates).filter(c => (cfg.rates as Record<string, number>)[c] > 0)
  return []
}

let pendingSessions: PendingSession[] = []

// SOSA self-pay check. clientPayments = money columns from the uploaded payroll
// CSV (kept here, dropped by the payroll parser). selfPayRoster = client names
// pulled from SimplePractice's Self-pay filter via the scrape button.
let clientPayments: ClientPaymentRow[] = []
let selfPayRoster: string[] = []
let selfPayCapturedAt = 0
const SP_SELFPAY_URL = 'https://secure.simplepractice.com/clients?billingType=Self-pay'

// Bret per-client insurance — persists across payroll runs so Carlos only
// picks once per patient. Keyed by SHA-256 hash of client name (not raw name)
// so anyone reading chrome.storage.local sees opaque hex, not patient names.
let bretInsuranceMap: Record<string, BretInsurance> = {}

// Client roster — persists across payroll runs. Loaded from SimplePractice
// "Client Details" report. Used to (1) auto-show Bret's insurance when no
// manual pick exists and (2) power the searchable client browser below the
// upload area. Only name + insurance + primary clinician are stored —
// address/phone/email/insurance ID are dropped at parse time.
let clientRoster: ClientRecord[] = []
// name (lowercased) -> record. Built once per roster load for O(1) lookup.
let rosterByName: Map<string, ClientRecord> = new Map()

// Memo: raw client name -> 16-char hex hash. Lets render path stay sync after
// an async warmup pass. Cleared on "Clear saved data".
const hashMemo = new Map<string, string>()

async function hashClient(name: string): Promise<string> {
  if (hashMemo.has(name)) return hashMemo.get(name)!
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(name))
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
  hashMemo.set(name, hex)
  return hex
}

// Sync memo read — only call after warmBretHashes has awaited all clients.
function hashClientSync(name: string): string {
  const h = hashMemo.get(name)
  if (!h) throw new Error(`hashClientSync called for un-warmed client: ${name}`)
  return h
}

async function warmBretHashes(result: PayrollResultWithHours) {
  const bret = result.clinicians.find(c => c.name === 'Bret Boatwright')
  if (!bret) return
  await Promise.all(uniqueBretClients(bret).map(c => hashClient(c)))
}

function newPendingId(): string {
  return `p${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function isValidPendingStatus(s: unknown): s is PendingSessionStatus {
  return s === 'pending' || s === 'completed' || s === 'no-show'
}

function saveBretInsuranceMap() {
  chrome.storage.local.set({ bretInsuranceMapV2: bretInsuranceMap })
}

function setClientRoster(records: ClientRecord[]) {
  clientRoster = records
  rosterByName = new Map()
  for (const r of records) {
    rosterByName.set(r.name.trim().toLowerCase(), r)
  }
}

function saveClientRoster() {
  chrome.storage.local.set({
    clientRoster: { uploadedAt: Date.now(), records: clientRoster },
  })
}

function getRosterRecord(clientName: string): ClientRecord | undefined {
  if (!clientName) return undefined
  return rosterByName.get(clientName.trim().toLowerCase())
}

function rosterUploadLabelText(): string {
  if (clientRoster.length === 0) return 'Drop client roster CSV (optional)'
  return `Roster loaded: ${clientRoster.length} clients (re-upload to refresh)`
}

function refreshRosterControls() {
  rosterUploadText.textContent = rosterUploadLabelText()
  if (clientRoster.length > 0) {
    rosterToggleBtn.classList.remove('hidden')
    rosterClearBtn.classList.remove('hidden')
  } else {
    rosterToggleBtn.classList.add('hidden')
    rosterClearBtn.classList.add('hidden')
    rosterBody.classList.add('hidden')
  }
}

// Format a clinician's typical session pay as a short string for the roster row.
// For cpt_based: shows their 90837/90834 rates. For flat: single rate. For Bret: 80% note.
function clinicianRateBlurb(clinicianName: string): string {
  const cfg = legend[clinicianName]
  if (!cfg) return ''
  if (cfg.type === 'flat') return `$${cfg.rate}/session`
  if (cfg.type === 'payer_dependent') return '80% of billing'
  // cpt_based
  const r37 = cfg.rates['90837']
  const r34 = cfg.rates['90834']
  const r91 = cfg.rates['90791']
  const parts: string[] = []
  if (r91) parts.push(`$${r91}/90791`)
  if (r37) parts.push(`$${r37}/90837`)
  if (r34) parts.push(`$${r34}/90834`)
  if (parts.length === 0 && cfg.default) parts.push(`$${cfg.default}/default`)
  return parts.join(' · ')
}

// HTML date input gives YYYY-MM-DD; the engine uses MM/DD/YYYY
const HTML_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidHtmlDate(s: unknown): s is string {
  return typeof s === 'string' && HTML_DATE_RE.test(s)
}

function sanitizeHtmlDate(s: unknown): string {
  return isValidHtmlDate(s) ? s : ''
}

function htmlDateToCsv(html: string): string {
  if (!isValidHtmlDate(html)) return ''
  const [y, m, d] = html.split('-')
  return `${m}/${d}/${y}`
}

function csvDateToHtml(csv: string): string {
  if (!csv || typeof csv !== 'string') return ''
  const parts = csv.split('/')
  if (parts.length !== 3) return ''
  const [m, d, y] = parts
  if (!m || !d || !y) return ''
  const out = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  return isValidHtmlDate(out) ? out : ''
}

function defaultDateForNewEntry(): string {
  if (!baseResult) return ''
  // Compare HTML-format dates (YYYY-MM-DD) — those sort correctly as strings.
  let latest = ''
  for (const f of baseResult.fillData) {
    for (const d of f.dailyBreakdown) {
      const html = csvDateToHtml(d.date)
      if (html && (!latest || html > latest)) latest = html
    }
  }
  return latest
}

// Every Tuesday (HTML dates YYYY-MM-DD) within the current pay period.
// Period = min..max date across ALL session rows (not just fillData, which can be
// empty for clinicians whose work isn't in the SimplePractice CSV — e.g. Anders
// didactic). We look at clinicians[].rows first, then fall back to fillData.
let didacticDebugLogged = false

function tuesdaysInPeriod(): string[] {
  const result = baseResult || currentResult

  let minT = Infinity, maxT = -Infinity
  const consider = (csvDate: string) => {
    if (!csvDate) return
    // SimplePractice exports "MM/DD/YYYY HH:MM" — strip the time suffix
    const datePart = csvDate.split(' ')[0]
    const parts = datePart.split('/').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return
    const [m, dd, y] = parts
    const t = new Date(y, m - 1, dd).getTime()
    if (!isFinite(t)) return
    if (t < minT) minT = t
    if (t > maxT) maxT = t
  }

  let cliniciansWithRows = 0
  let sampleRowDate = ''
  let fillWithDays = 0
  let sampleFillDate = ''

  if (result) {
    for (const c of result.clinicians) {
      if (c.rows.length > 0) {
        cliniciansWithRows++
        if (!sampleRowDate) sampleRowDate = c.rows[0].date
      }
      for (const r of c.rows) consider(r.date)
    }
    if (!isFinite(minT)) {
      for (const f of result.fillData) {
        if (f.dailyBreakdown.length > 0) {
          fillWithDays++
          if (!sampleFillDate) sampleFillDate = f.dailyBreakdown[0].date
        }
        for (const d of f.dailyBreakdown) consider(d.date)
      }
    }
  }

  // Fallback: no parseable dates found -> use last 14 days ending today.
  // Keeps the Didactic checklist usable even when data structure is unexpected.
  let usedFallback = false
  if (!isFinite(minT)) {
    usedFallback = true
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    maxT = today.getTime()
    const start = new Date(today)
    start.setDate(start.getDate() - 13)
    minT = start.getTime()
  }

  const out: string[] = []
  const cursor = new Date(minT)
  while (cursor.getDay() !== 2 && cursor.getTime() <= maxT) {
    cursor.setDate(cursor.getDate() + 1)
  }
  while (cursor.getTime() <= maxT) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const dd = String(cursor.getDate()).padStart(2, '0')
    out.push(`${y}-${m}-${dd}`)
    cursor.setDate(cursor.getDate() + 7)
  }

  if (!didacticDebugLogged) {
    didacticDebugLogged = true
    console.log('[didactic-tuesdays]', {
      hasBaseResult: !!baseResult,
      hasCurrentResult: !!currentResult,
      cliniciansWithRows,
      sampleRowDate,
      fillWithDays,
      sampleFillDate,
      minISO: isFinite(minT) ? new Date(minT).toISOString().slice(0, 10) : null,
      maxISO: isFinite(maxT) ? new Date(maxT).toISOString().slice(0, 10) : null,
      usedFallback,
      tuesdays: out,
    })
  }

  return out
}

function formatShortFromHtml(html: string): string {
  if (!isValidHtmlDate(html)) return ''
  const [, m, d] = html.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

function newEntryId(): string {
  return `e${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

// Short rate summary shown at the top of each clinician card.
function summarizeClinicianRate(name: string): string {
  const cfg = legend[name]
  if (!cfg) return ''
  if (cfg.type === 'flat') return `$${cfg.rate}/hr flat`
  if (cfg.type === 'payer_dependent') return '80% of billing'
  // cpt_based — prefer the max rate across rates+overrides, fall back to default
  const nonZero: number[] = []
  if (cfg.rates) nonZero.push(...Object.values(cfg.rates).filter(r => r > 0))
  if (cfg.overrides) nonZero.push(...Object.values(cfg.overrides).filter(r => r > 0))
  if (nonZero.length > 0) return `$${Math.max(...nonZero)}/hr`
  if (cfg.default !== undefined && cfg.default > 0) return `$${cfg.default}/hr`
  return ''
}

// CPT codes for sessions on a specific date, in order.
// Each CSV row = one session; multi-code rows ("90837\n90837") get joined with " / ".
function codesForDate(summary: ClinicianSummary, date: string): string[] {
  return summary.rows
    .filter(r => r.date === date)
    .map(r => r.code.split('\n').map(s => s.trim()).filter(Boolean).join(' / '))
    .filter(Boolean)
}

// Escape HTML so client names / codes can't break the DOM
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// List of unique Bret clients from current CSV, sorted alpha
function uniqueBretClients(summary: ClinicianSummary): string[] {
  const set = new Set<string>()
  for (const r of summary.rows) {
    if (r.client) set.add(r.client)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

function buildBretInsuranceHtml(summary: ClinicianSummary): string {
  const clients = uniqueBretClients(summary)
  if (clients.length === 0) return ''

  const rowsHtml = clients.map(c => {
    // data-client stays the raw display name; we hash before using as map key
    const manualPick = bretInsuranceMap[hashClientSync(c)]
    const rosterRec = getRosterRecord(c)
    const rosterPick = rosterRec?.insuranceNormalized ?? null
    // Manual pick wins. If no manual pick, the roster's value is shown as the
    // active button (visually flagged "from roster") but the user can override.
    const effective = manualPick ?? rosterPick
    const fromRoster = !manualPick && !!rosterPick
    const mkBtn = (value: BretInsurance, label: string) => {
      const active = effective === value ? ' active' : ''
      const rosterCls = active && fromRoster ? ' from-roster' : ''
      return `<button class="ins-btn${active}${rosterCls}" data-client="${esc(c)}" data-value="${value}">${label}</button>`
    }
    let badge = ''
    if (!effective) {
      badge = '<span class="ins-unset">pick insurance</span>'
    } else if (fromRoster) {
      badge = `<span class="ins-from-roster" title="${esc(rosterRec?.insuranceRaw ?? '')}">from roster</span>`
    }
    return `
      <div class="ins-row">
        <span class="ins-client">${esc(c)}</span>
        <span class="ins-controls">
          ${mkBtn('united', 'United')}
          ${mkBtn('aetna', 'Aetna')}
        </span>
        ${badge}
      </div>
    `
  }).join('')

  return `
    <div class="ins-block">
      <div class="ins-title">Insurance per client</div>
      <div class="ins-rows">${rowsHtml}</div>
      <div class="ins-note">Informational. Pay math unchanged (80% of CSV rate).</div>
    </div>
  `
}

function buildPendingSessionsHtml(clinicianName: string): string {
  const mine = pendingSessions.filter(p => p.clinician === clinicianName)
  const codes = availableCodesFor(clinicianName)
  const subtotal = mine.reduce((sum, p) => {
    const cfg = legend[p.clinician]
    if (!cfg || cfg.type !== 'cpt_based') return sum
    if (p.status === 'no-show') {
      return sum + (cfg.noShow?.['00001'] ?? 0)
    }
    return sum + (cfg.rates[p.code] ?? 0)
  }, 0)

  const rowsHtml = mine.map(p => `
    <div class="pending-row" data-pending-id="${p.id}">
      <input type="date" class="pending-date" value="${sanitizeHtmlDate(p.date)}" />
      <input type="text" class="pending-client" placeholder="client" value="${esc(p.client)}" />
      <select class="pending-code">
        <option value="">code</option>
        ${codes.map(c => `<option value="${c}"${p.code === c ? ' selected' : ''}>${c}</option>`).join('')}
      </select>
      <span class="pending-status-group">
        <button class="pending-status-btn${p.status === 'pending' ? ' active pending' : ''}" data-status="pending" title="Pending (counts as completed)">P</button>
        <button class="pending-status-btn${p.status === 'completed' ? ' active completed' : ''}" data-status="completed" title="Completed">C</button>
        <button class="pending-status-btn${p.status === 'no-show' ? ' active no-show' : ''}" data-status="no-show" title="No-show">N</button>
      </span>
      <button class="pending-delete" title="Remove">×</button>
    </div>
  `).join('')

  return `
    <div class="pending-block" data-clinician="${esc(clinicianName)}">
      <div class="pending-header">
        <span class="pending-title">Pending Sessions</span>
        <span class="pending-subtotal">$${subtotal.toFixed(2)}</span>
      </div>
      <div class="pending-rows">${rowsHtml}</div>
      <button class="pending-add" data-clinician="${esc(clinicianName)}">+ add pending session</button>
    </div>
  `
}

function buildManualGroupHtml(g: ManualGroup): string {
  const rate = getManualRate(g.clinician, g.kind)
  const entries = manualEntries.filter(e => e.groupId === g.id)
  const subtotal = entries.reduce((s, e) => s + (e.hours > 0 && e.date ? e.hours * (rate ?? 0) : 0), 0)

  // Didactic (Anders) is always 1h per Tuesday. Render as checkbox list instead of
  // free-form date+hours rows to make it click-once.
  const bodyHtml = g.kind === 'didactic'
    ? buildDidacticTuesdaysHtml(g, entries)
    : buildManualFreeformRowsHtml(g, entries)

  return `
    <div class="manual-group" data-group-id="${g.id}">
      <div class="manual-group-header">
        <span class="manual-group-label">${g.label.split(' ')[0]} <em>${rate !== null ? `$${rate}/hr` : 'no rate'}</em></span>
        <span class="manual-group-subtotal">$${subtotal.toFixed(2)}</span>
      </div>
      ${bodyHtml}
    </div>
  `
}

function buildManualFreeformRowsHtml(g: ManualGroup, entries: ManualEntry[]): string {
  const rowsHtml = entries.map(e => `
    <div class="manual-entry" data-entry-id="${e.id}">
      <input type="date" class="manual-date" value="${sanitizeHtmlDate(e.date)}" />
      <input type="number" class="manual-input" step="0.25" min="0" placeholder="hrs" value="${e.hours > 0 ? e.hours : ''}" />
      <button class="manual-delete" title="Remove">×</button>
    </div>
  `).join('')
  return `
    <div class="manual-group-rows">${rowsHtml}</div>
    <button class="manual-add-day" data-group-id="${g.id}">+ add day</button>
  `
}

function buildDidacticTuesdaysHtml(g: ManualGroup, entries: ManualEntry[]): string {
  const tuesdays = tuesdaysInPeriod()
  const checkedDates = new Set(entries.filter(e => e.hours > 0 && e.date).map(e => e.date))
  const itemsHtml = tuesdays.map(t => `
    <label class="didactic-tue${checkedDates.has(t) ? ' checked' : ''}">
      <input type="checkbox" class="didactic-check" data-group-id="${g.id}" data-date="${t}" ${checkedDates.has(t) ? 'checked' : ''} />
      <span>Tue ${formatShortFromHtml(t)}</span>
    </label>
  `).join('')
  return `<div class="didactic-tuesdays">${itemsHtml}</div>`
}

function renderManualSection() {
  // No-op standalone; manual groups are now rendered inside each clinician card.
  // Calling renderResults re-renders the cards (with their embedded manual groups).
  if (currentResult) renderResults(currentResult)
}

// Delegated event handlers on the clinician list (manual groups now live inside cards)
clinicianList.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement

  if (target.classList.contains('manual-add-day')) {
    const groupId = target.dataset.groupId!
    manualEntries.push({
      id: newEntryId(),
      groupId,
      date: defaultDateForNewEntry(),
      hours: 0,
    })
    recomputeFromBase()
    return
  }

  // Didactic Tuesday checkbox — always 1h per checked Tuesday
  if (target.classList.contains('didactic-check')) {
    const input = target as HTMLInputElement
    const groupId = input.dataset.groupId!
    const date = input.dataset.date!
    if (!groupId || !date) return
    if (input.checked) {
      const exists = manualEntries.some(e => e.groupId === groupId && e.date === date && e.hours > 0)
      if (!exists) {
        manualEntries.push({
          id: newEntryId(),
          groupId,
          date,
          hours: 1,
        })
      }
    } else {
      manualEntries = manualEntries.filter(e => !(e.groupId === groupId && e.date === date))
    }
    recomputeFromBase()
    return
  }

  if (target.classList.contains('manual-delete')) {
    const entryEl = target.closest('.manual-entry') as HTMLElement
    const entryId = entryEl?.dataset.entryId
    if (entryId) {
      manualEntries = manualEntries.filter(e => e.id !== entryId)
      recomputeFromBase()
    }
    return
  }

  // Bret insurance picker — stored globally, does NOT trigger recompute
  // (math unchanged, but we re-render the card to show active state)
  if (target.classList.contains('ins-btn')) {
    const client = target.dataset.client
    const value = target.dataset.value as BretInsurance | undefined
    if (!client || !value) return
    const key = await hashClient(client)
    // Toggle off if clicking the active one
    if (bretInsuranceMap[key] === value) {
      delete bretInsuranceMap[key]
    } else {
      bretInsuranceMap[key] = value
    }
    saveBretInsuranceMap()
    if (currentResult) renderResults(currentResult)
    return
  }

  if (target.classList.contains('pending-add')) {
    const clinician = target.dataset.clinician!
    pendingSessions.push({
      id: newPendingId(),
      clinician,
      date: defaultDateForNewEntry(),
      client: '',
      code: '',
      status: 'pending',
    })
    recomputeFromBase()
    return
  }

  if (target.classList.contains('pending-delete')) {
    const rowEl = target.closest('.pending-row') as HTMLElement
    const id = rowEl?.dataset.pendingId
    if (id) {
      pendingSessions = pendingSessions.filter(p => p.id !== id)
      recomputeFromBase()
    }
    return
  }

  if (target.classList.contains('pending-status-btn')) {
    const rowEl = target.closest('.pending-row') as HTMLElement
    const id = rowEl?.dataset.pendingId
    const status = target.dataset.status
    if (id && isValidPendingStatus(status)) {
      const p = pendingSessions.find(x => x.id === id)
      if (p) {
        p.status = status
        recomputeFromBase()
      }
    }
    return
  }
})

clinicianList.addEventListener('input', (e) => {
  const target = e.target as HTMLInputElement
  const manualEl = target.closest('.manual-entry') as HTMLElement | null
  const pendingEl = target.closest('.pending-row') as HTMLElement | null

  if (manualEl) {
    const entryId = manualEl.dataset.entryId
    const entry = manualEntries.find(x => x.id === entryId)
    if (!entry) return

    if (target.classList.contains('manual-date')) {
      entry.date = sanitizeHtmlDate(target.value)
    } else if (target.classList.contains('manual-input')) {
      const v = parseFloat(target.value)
      entry.hours = isNaN(v) || v < 0 ? 0 : v
    }
    recomputeFromBase()
    return
  }

  if (pendingEl) {
    const id = pendingEl.dataset.pendingId
    const p = pendingSessions.find(x => x.id === id)
    if (!p) return

    if (target.classList.contains('pending-date')) {
      p.date = sanitizeHtmlDate(target.value)
      recomputeFromBase()
    } else if (target.classList.contains('pending-client')) {
      // Don't re-render on every keystroke — would kill input focus.
      // State update only; blur/change will trigger recompute.
      p.client = target.value
    } else if (target.classList.contains('pending-code')) {
      p.code = target.value
      recomputeFromBase()
    }
  }
})

clinicianList.addEventListener('change', (e) => {
  // Date + select inputs often fire 'change' not 'input' in some browsers
  const target = e.target as HTMLInputElement | HTMLSelectElement
  const manualEl = target.closest('.manual-entry') as HTMLElement | null
  const pendingEl = target.closest('.pending-row') as HTMLElement | null

  if (manualEl && target.classList.contains('manual-date')) {
    const entryId = manualEl.dataset.entryId
    const entry = manualEntries.find(x => x.id === entryId)
    if (entry) {
      entry.date = sanitizeHtmlDate((target as HTMLInputElement).value)
      recomputeFromBase()
    }
    return
  }

  if (pendingEl) {
    const id = pendingEl.dataset.pendingId
    const p = pendingSessions.find(x => x.id === id)
    if (!p) return

    if (target.classList.contains('pending-date')) {
      p.date = sanitizeHtmlDate((target as HTMLInputElement).value)
      recomputeFromBase()
    } else if (target.classList.contains('pending-code')) {
      p.code = (target as HTMLSelectElement).value
      recomputeFromBase()
    } else if (target.classList.contains('pending-client')) {
      // Finalize after blur — persists state and triggers recompute
      p.client = (target as HTMLInputElement).value
      recomputeFromBase()
    }
  }
})

function updateManualSubtotals() {
  for (const g of MANUAL_GROUPS) {
    const rate = getManualRate(g.clinician, g.kind)
    if (rate === null) continue
    const entries = manualEntries.filter(e => e.groupId === g.id)
    const subtotal = entries.reduce((s, e) => s + (e.hours > 0 && e.date ? e.hours * rate : 0), 0)
    const groupEl = clinicianList.querySelector(`[data-group-id="${g.id}"]`)
    const subtotalEl = groupEl?.querySelector('.manual-group-subtotal')
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`
  }
}

async function recomputeFromBase() {
  if (!baseResult) return
  let result = baseResult

  for (const entry of manualEntries) {
    if (entry.hours <= 0 || !entry.date) continue
    const group = MANUAL_GROUPS.find(g => g.id === entry.groupId)
    if (!group) continue
    const rate = getManualRate(group.clinician, group.kind)
    if (!rate) continue
    const csvDate = htmlDateToCsv(entry.date)
    if (!csvDate) continue
    result = applyManualAddition(result, group.clinician, entry.hours, rate, group.label.split(' ')[0], csvDate)
  }

  for (const p of pendingSessions) {
    if (!p.date || !p.client || !p.code) continue
    const csvDate = htmlDateToCsv(p.date)
    if (!csvDate) continue
    result = applyPendingSession(result, p.clinician, csvDate, p.client, p.code, p.status)
  }

  currentResult = result
  // Warm the hash memo for any Bret clients BEFORE render so the sync
  // buildBretInsuranceHtml lookup works.
  await warmBretHashes(currentResult)
  renderResults(currentResult)
  updateManualSubtotals()

  chrome.storage.local.set({
    payrollData: {
      timestamp: Date.now(),
      result: baseResult,
      manualEntries,
      pendingSessions,
    },
  })
}

async function processCsvFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showStatus('That file is not a CSV.', 'error')
    return
  }

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0) {
    showStatus('No valid rows found in CSV. Check column headers.', 'error')
    return
  }

  clientPayments = parseClientPayments(text)
  baseResult = calculatePayrollWithHours(rows)
  manualEntries = []
  didacticDebugLogged = false
  renderManualSection()
  recomputeFromBase()
}

async function processRosterFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showStatus('Roster file must be a CSV.', 'error')
    return
  }
  const text = await file.text()
  const records = parseClientRoster(text)
  if (records.length === 0) {
    showStatus('No active clients found. Make sure CSV has Client + Primary insurance columns.', 'error')
    return
  }
  setClientRoster(records)
  saveClientRoster()
  refreshRosterControls()
  renderRosterList()
  // If results are showing, re-render so Bret's section picks up roster fallback.
  if (currentResult) renderResults(currentResult)
  showStatus(`Loaded ${records.length} clients.`, 'success')
}

function renderRosterList() {
  const q = (rosterSearchInput.value || '').trim().toLowerCase()
  const filtered = q
    ? clientRoster.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.insuranceRaw.toLowerCase().includes(q) ||
        r.primaryClinician.toLowerCase().includes(q))
    : clientRoster

  if (filtered.length === 0) {
    rosterListEl.innerHTML = '<div class="roster-empty">No matches.</div>'
    return
  }

  // Cap at 100 rows for popup perf; user can search to narrow.
  const capped = filtered.slice(0, 100)
  const moreNote = filtered.length > capped.length
    ? `<div class="roster-more">+${filtered.length - capped.length} more — refine search</div>`
    : ''

  rosterListEl.innerHTML = capped.map(r => {
    const insLabel = r.insuranceRaw || '<span class="ins-faint">no insurance</span>'
    const clin = r.primaryClinician || '<span class="ins-faint">unassigned</span>'
    const rate = r.primaryClinician ? clinicianRateBlurb(r.primaryClinician) : ''
    const rateHtml = rate ? `<span class="roster-rate">${rate}</span>` : ''
    return `
      <div class="roster-row">
        <div class="roster-row-top">
          <span class="roster-name">${esc(r.name)}</span>
          <span class="roster-clinician">${typeof clin === 'string' ? esc(clin) : clin}</span>
        </div>
        <div class="roster-row-bot">
          <span class="roster-ins">${typeof insLabel === 'string' ? esc(insLabel) : insLabel}</span>
          ${rateHtml}
        </div>
      </div>
    `
  }).join('') + moreNote
}

rosterInput.addEventListener('change', async () => {
  const file = rosterInput.files?.[0]
  if (!file) return
  await processRosterFile(file)
})

;['dragenter', 'dragover'].forEach((evt) => {
  rosterUploadLabel.addEventListener(evt, (e) => {
    e.preventDefault()
    e.stopPropagation()
    rosterUploadLabel.classList.add('dragging')
  })
})

;['dragleave', 'drop'].forEach((evt) => {
  rosterUploadLabel.addEventListener(evt, (e) => {
    e.preventDefault()
    e.stopPropagation()
    rosterUploadLabel.classList.remove('dragging')
  })
})

rosterUploadLabel.addEventListener('drop', async (e) => {
  const file = (e as DragEvent).dataTransfer?.files?.[0]
  if (!file) return
  await processRosterFile(file)
})

rosterToggleBtn.addEventListener('click', () => {
  const showing = !rosterBody.classList.contains('hidden')
  if (showing) {
    rosterBody.classList.add('hidden')
    rosterToggleBtn.textContent = `Show roster (${clientRoster.length})`
  } else {
    rosterBody.classList.remove('hidden')
    rosterToggleBtn.textContent = 'Hide roster'
    renderRosterList()
  }
})

rosterClearBtn.addEventListener('click', () => {
  if (!confirm('Remove the saved client roster?')) return
  setClientRoster([])
  chrome.storage.local.remove('clientRoster')
  refreshRosterControls()
  if (currentResult) renderResults(currentResult)
  showStatus('Roster cleared.', 'success')
})

rosterSearchInput.addEventListener('input', renderRosterList)

csvInput.addEventListener('change', async () => {
  const file = csvInput.files?.[0]
  if (!file) return
  await processCsvFile(file)
})

// Drag and drop
;['dragenter', 'dragover'].forEach((evt) => {
  uploadLabel.addEventListener(evt, (e) => {
    e.preventDefault()
    e.stopPropagation()
    uploadLabel.classList.add('dragging')
  })
})

;['dragleave', 'drop'].forEach((evt) => {
  uploadLabel.addEventListener(evt, (e) => {
    e.preventDefault()
    e.stopPropagation()
    uploadLabel.classList.remove('dragging')
  })
})

uploadLabel.addEventListener('drop', async (e) => {
  const file = (e as DragEvent).dataTransfer?.files?.[0]
  if (!file) return
  await processCsvFile(file)
})

clearBtn.addEventListener('click', () => {
  baseResult = null
  currentResult = null
  manualEntries = []
  pendingSessions = []
  csvInput.value = ''
  renderManualSection()
  resultsSection.classList.add('hidden')
  uploadSection.classList.remove('hidden')
  statusEl.classList.add('hidden')
  // NOTE: bretInsuranceMap intentionally persists — it's long-lived user prefs
  chrome.storage.local.remove('payrollData')
})

// Wipe all button — nukes everything in chrome.storage.local (payroll + insurance + roster).
// For end-of-session PHI hygiene.
wipeAllBtn.addEventListener('click', () => {
  if (!confirm('Wipe all payroll + insurance + roster data from this browser?')) return
  chrome.storage.local.clear(() => {
    baseResult = null
    currentResult = null
    manualEntries = []
    pendingSessions = []
    bretInsuranceMap = {}
    hashMemo.clear()
    setClientRoster([])
    refreshRosterControls()
    csvInput.value = ''
    rosterInput.value = ''
    resultsSection.classList.add('hidden')
    uploadSection.classList.remove('hidden')
    clinicianList.innerHTML = ''
    showStatus('Saved data cleared.', 'success')
  })
})

sendBtn.addEventListener('click', async () => {
  if (!currentResult) return

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    showStatus('No active tab found.', 'error')
    return
  }

  if (!tab.url?.includes('justworks.com')) {
    showStatus('Navigate to JustWorks first, then click Send.', 'info')
    return
  }

  chrome.tabs.sendMessage(tab.id, {
    type: 'FILL_PAYROLL',
    payload: currentResult,
  }, (response) => {
    if (chrome.runtime.lastError) {
      showStatus('Could not reach JustWorks page. Refresh and try again.', 'error')
      return
    }
    if (response?.success) {
      showStatus('Payroll panel opened on JustWorks.', 'success')
    } else {
      showStatus(response?.error || 'Unknown error.', 'error')
    }
  })
})

copyBtn.addEventListener('click', () => {
  if (!currentResult) return

  const lines: string[] = []
  for (const f of currentResult.fillData) {
    const hours = (f.totalMinutes / 60).toFixed(2)
    const nudge = f.minuteAdjustment ? ` (${f.minuteAdjustment > 0 ? '+' : ''}${f.minuteAdjustment}m)` : ''
    lines.push(`${f.clinicianName}: $${f.totalPay.toFixed(2)} | $${f.adjustedHourlyRate.toFixed(2)}/hr x ${hours}h${nudge}`)
  }

  navigator.clipboard.writeText(lines.join('\n'))
  showStatus('Copied to clipboard.', 'success')
})

downloadBtn.addEventListener('click', () => {
  if (!currentResult) return
  try {
    const blob = buildPayrollWorkbook(currentResult)
    const filename = suggestFilename(currentResult)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showStatus(`Saved ${filename}`, 'success')
  } catch (err) {
    showStatus(`Download failed: ${err instanceof Error ? err.message : 'unknown'}`, 'error')
  }
})

downloadJwCsvBtn.addEventListener('click', () => {
  if (!currentResult) return
  try {
    const blob = buildJustWorksCSV(currentResult)
    const filename = suggestJustWorksFilename(currentResult)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showStatus(`Saved ${filename}`, 'success')
  } catch (err) {
    showStatus(`JW CSV failed: ${err instanceof Error ? err.message : 'unknown'}`, 'error')
  }
})

function renderResults(result: PayrollResultWithHours) {
  uploadSection.classList.add('hidden')
  resultsSection.classList.remove('hidden')
  showTab('payroll')
  clinicianList.innerHTML = ''

  // Insurance billing stat — total billed across CPT-coded sessions + 8% of it.
  // 8% is the standard biller cut Carlos uses to estimate billing fees.
  const ib = result.insuranceBilling
  if (ib && ib.totalBilled > 0) {
    const fee = ib.totalBilled * 0.08
    insuranceStat.innerHTML = `
      <div class="ins-stat-row">
        <span class="ins-stat-label">Insurance billed</span>
        <span class="ins-stat-value">$${ib.totalBilled.toFixed(2)}</span>
        <span class="ins-stat-meta">${ib.sessionCount} session${ib.sessionCount === 1 ? '' : 's'}</span>
      </div>
      <div class="ins-stat-row ins-stat-fee">
        <span class="ins-stat-label">8% of billed</span>
        <span class="ins-stat-value">$${fee.toFixed(2)}</span>
      </div>
    `
    insuranceStat.classList.remove('hidden')
  } else {
    insuranceStat.innerHTML = ''
    insuranceStat.classList.add('hidden')
  }

  renderSosa()
  renderRevenue()

  for (const c of result.clinicians) {
    const isBret = c.name === 'Bret Boatwright'
    const fill = result.fillData.find(f => f.clinicianName === c.name)
    const card = document.createElement('div')
    card.className = `clinician-card${isBret ? ' estimated' : ''}`

    let supeHtml = ''
    if (c.supervisionForBret > 0) {
      supeHtml = `<span class="supe">Supe for Bret: $${c.supervisionForBret.toFixed(2)}</span>`
    }

    let fillHtml = ''
    if (fill && fill.totalMinutes > 0) {
      const hours = (fill.totalMinutes / 60).toFixed(2)
      const nudge = fill.minuteAdjustment
        ? ` <span class="nudge">${fill.minuteAdjustment > 0 ? '+' : ''}${fill.minuteAdjustment}m adj</span>`
        : ''

      // Verify the math
      const computed = Math.round(fill.adjustedHourlyRate * (fill.totalMinutes / 60) * 100) / 100
      const match = Math.abs(computed - fill.totalPay) < 0.02
      const verifyIcon = match ? '<span class="verify-ok">OK</span>' : '<span class="verify-warn">~$' + Math.abs(computed - fill.totalPay).toFixed(2) + '</span>'

      fillHtml = `
        <div class="fill-info">
          <span class="rate">$${fill.adjustedHourlyRate.toFixed(2)}/hr</span>
          <span class="hours">${hours}h${nudge}</span>
          ${verifyIcon}
        </div>
      `

      // Daily breakdown
      const dailyHtml = fill.dailyBreakdown.map(d => {
        if (d.totalMinutes === 0) return ''
        const h = Math.floor(d.totalMinutes / 60)
        const m = d.totalMinutes % 60
        const shortDate = formatShortDate(d.date)
        const dayLabel = shortDate
          ? `${d.dayOfWeek.substring(0, 3)} ${shortDate}`
          : d.dayOfWeek.substring(0, 3)
        const codes = codesForDate(c, d.date)
        const codesHtml = codes.length > 0
          ? `<div class="daily-codes">${codes.map(code => `<span class="cpt">${code}</span>`).join('')}</div>`
          : ''
        return `<div class="daily-row">
          <span>${dayLabel}</span>
          <span>${h}h${m > 0 ? ` ${m}m` : ''}</span>
          <span class="daily-sessions">${d.sessionCount}s</span>
        </div>${codesHtml}`
      }).filter(Boolean).join('')

      if (dailyHtml) {
        fillHtml += `<div class="daily-breakdown">${dailyHtml}</div>`
      }
    } else if (fill && fill.totalMinutes === 0 && fill.totalPay > 0) {
      fillHtml = '<div class="fill-info"><span class="zero-hours">0 hours -- enter as bonus/adjustment</span></div>'
    }

    // For Bret, show the formula breakdown inside the card so it's clear how
    // the total came from session pay + 5% supervision from each supervisee
    let breakdownHtml = ''
    if (isBret) {
      const b = result.bretFullCalc
      breakdownHtml = `
        <div class="breakdown">
          <div class="breakdown-title">How this total is built</div>
          <div class="breakdown-row">
            <span>Session pay (80% of billing, EST)</span>
            <span>$${b.sessionPay.toFixed(2)}</span>
          </div>
          <div class="breakdown-row">
            <span>+ Supe from Izzy (5%)</span>
            <span>$${b.supervisionFromIzzy.toFixed(2)}</span>
          </div>
          <div class="breakdown-row">
            <span>+ Supe from Carlos (5%)</span>
            <span>$${b.supervisionFromCarlos.toFixed(2)}</span>
          </div>
          <div class="breakdown-row">
            <span>+ Supe from Karen (5%)</span>
            <span>$${b.supervisionFromKaren.toFixed(2)}</span>
          </div>
          <div class="breakdown-row total">
            <span>= Grand total</span>
            <span>$${b.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      `
    }

    // Inject per-clinician manual-additions UI (Anders = Didactic; Rachel/Izzy = Fusion)
    const myGroups = MANUAL_GROUPS.filter(g => g.clinician === c.name)
    // Only show the grand-total line under manual groups when at least one
    // manual entry actually contributes hours — keeps the card quiet otherwise.
    const hasActiveManual = myGroups.some(g =>
      manualEntries.some(e => e.groupId === g.id && e.hours > 0 && e.date)
    )
    const grandTotalHtml = hasActiveManual
      ? `<div class="manual-grand-total">
          <span class="label">Total (w/ manual)</span>
          <span class="amount">$${(fill?.totalPay ?? c.sessionPay).toFixed(2)}</span>
        </div>`
      : ''
    const manualHtml = myGroups.length > 0
      ? `<div class="manual-in-card">${myGroups.map(buildManualGroupHtml).join('')}${grandTotalHtml}</div>`
      : ''

    // Pending sessions UI — currently only for clinicians in PENDING_CLINICIANS (Emily)
    const pendingHtml = PENDING_CLINICIANS.includes(c.name)
      ? buildPendingSessionsHtml(c.name)
      : ''

    // Bret per-client insurance picker — informational, persists across payroll runs
    const bretInsHtml = isBret ? buildBretInsuranceHtml(c) : ''

    const rateLegend = summarizeClinicianRate(c.name)
    const legendHtml = rateLegend
      ? `<span class="rate-legend">${rateLegend}</span>`
      : ''

    card.innerHTML = `
      <div class="name-row">
        <span class="name">${c.name}</span>
        ${legendHtml}
      </div>
      <div class="details">
        <span class="pay">$${(fill?.totalPay ?? c.sessionPay).toFixed(2)}</span>
        <span class="sessions">${c.sessionCount} sessions</span>
        ${supeHtml}
      </div>
      ${fillHtml}
      ${pendingHtml}
      ${manualHtml}
      ${breakdownHtml}
      ${bretInsHtml}
    `
    clinicianList.appendChild(card)
  }

  // Separate Bret section is redundant now; hide it
  bretSection.classList.add('hidden')
  bretDetails.innerHTML = ''
}

function showStatus(msg: string, type: 'success' | 'error' | 'info') {
  statusEl.textContent = msg
  statusEl.className = type
}

// ---- SOSA self-pay check ---------------------------------------------------

function escHtml(s: string): string {
  return s.replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}

function setSelfPayRoster(names: string[], capturedAt: number) {
  selfPayRoster = names
  selfPayCapturedAt = capturedAt
}

function saveSelfPayRoster() {
  chrome.storage.local.set({ selfPayRoster: { names: selfPayRoster, capturedAt: selfPayCapturedAt } })
}

function updateSosaRosterStatus() {
  if (!selfPayRoster.length) {
    sosaRosterStatus.textContent = 'No self-pay roster yet'
    return
  }
  const d = selfPayCapturedAt ? new Date(selfPayCapturedAt).toLocaleDateString() : '?'
  sosaRosterStatus.textContent = `${selfPayRoster.length} self-pay clients · ${d}`
}

function renderSosa() {
  if (!clientPayments.length) {
    sosaStat.innerHTML = ''
    sosaStat.classList.add('hidden')
    return
  }
  if (!selfPayRoster.length) {
    sosaStat.innerHTML =
      '<div class="ins-stat-row"><span class="ins-stat-label">SOSA self-pay check</span>' +
      '<span class="ins-stat-meta">No self-pay roster &mdash; click &ldquo;Refresh self-pay roster&rdquo;.</span></div>'
    sosaStat.classList.remove('hidden')
    return
  }
  const s = computeSosa(clientPayments, selfPayRoster)
  const top = s.disputable.slice(0, 8)
    .map(d => `<div class="sosa-line"><span>${escHtml(d.client)}</span><span>$${d.paid.toFixed(2)}</span></div>`)
    .join('')
  const more = s.disputable.length > 8
    ? `<div class="sosa-line sosa-more">+${s.disputable.length - 8} more</div>` : ''
  const drift = s.driftNew.length
    ? `<div class="sosa-drift">Verify (full-fee, not in self-pay roster): ${
        s.driftNew.slice(0, 6).map(d => escHtml(d.client)).join(', ')}${s.driftNew.length > 6 ? '…' : ''}</div>`
    : ''
  sosaStat.innerHTML =
    `<div class="ins-stat-row">
       <span class="ins-stat-label">Self-pay collected (not fee-eligible)</span>
       <span class="ins-stat-value">$${s.selfPayCollected.toFixed(2)}</span>
       <span class="ins-stat-meta">${s.matchedCount} client${s.matchedCount === 1 ? '' : 's'}</span>
     </div>
     <div class="ins-stat-row ins-stat-fee">
       <span class="ins-stat-label">SOSA 8% overcharge on self-pay</span>
       <span class="ins-stat-value">$${s.overcharge.toFixed(2)}</span>
     </div>
     <div class="sosa-detail">${top}${more}</div>
     ${drift}`
  sosaStat.classList.remove('hidden')
}

// ---- Revenue tab -----------------------------------------------------------

// Tab switching is pure show/hide — no re-parse. The revenue content is already
// rendered by renderRevenue() at result time, so flipping tabs is just classes.
function showTab(tab: 'payroll' | 'revenue') {
  const payroll = tab === 'payroll'
  tabPayroll.classList.toggle('hidden', !payroll)
  tabRevenue.classList.toggle('hidden', payroll)
  tabBtnPayroll.classList.toggle('active', payroll)
  tabBtnRevenue.classList.toggle('active', !payroll)
}

tabBtnPayroll.addEventListener('click', () => showTab('payroll'))
tabBtnRevenue.addEventListener('click', () => showTab('revenue'))

// Per-provider revenue + margin. Reads the same module vars as renderSosa
// (clientPayments + selfPayRoster) plus currentResult for pay/supervision.
function renderRevenue() {
  if (!currentResult || !clientPayments.length) {
    tabRevenue.innerHTML = '<div class="rev-empty">Upload a CSV to see revenue.</div>'
    return
  }

  const rosterHint = !selfPayRoster.length
    ? '<div class="rev-hint">No self-pay roster — everyone is treated as insurance. Click "Refresh self-pay roster" to split self-pay out.</div>'
    : ''

  const r = computeRevenue(clientPayments, selfPayRoster, currentResult)

  const money = (n: number) => `$${n.toFixed(2)}`
  const dash = '&mdash;'
  const netCls = (n: number) => n >= 0 ? 'rev-net-pos' : 'rev-net-neg'
  const pct = (m: number) => `${(m * 100).toFixed(0)}%`

  const totalsRow = `
    <div class="rev-row rev-totals">
      <div class="rev-main">
        <span class="rev-name">All providers</span>
        <span class="rev-total">${money(r.totals.revenueTotal)}</span>
      </div>
      <div class="rev-breakdown">ins ${money(r.totals.insuranceBilled)} billed · self-pay ${money(r.totals.selfPayCollected)} collected</div>
      <div class="rev-meta">
        <span>${r.totals.sessions} sessions</span>
        <span>est/mo ${money(r.totals.estMonthly)}</span>
        <span>pay ${money(r.totals.pay)}</span>
        <span>supe ${money(r.totals.supeCost)}</span>
        <span class="${netCls(r.totals.net)}">net ${money(r.totals.net)}</span>
        <span>${pct(r.totals.margin)} margin</span>
      </div>
    </div>`

  const providerRows = r.providers.map(p => {
    const payCell = p.ownerNoPayroll ? dash : money(p.pay)
    const supeCell = p.ownerNoPayroll ? dash : money(p.supeCost)
    const netCell = p.ownerNoPayroll ? dash : `<span class="${netCls(p.net)}">net ${money(p.net)}</span>`
    const marginCell = p.ownerNoPayroll || p.revenueTotal <= 0 ? '' : `<span>${pct(p.margin)} margin</span>`
    const supeIncome = p.supeIncome > 0
      ? `<div class="rev-note">+ ${money(p.supeIncome)} supervision income (from supervisees)</div>`
      : ''
    return `
      <div class="rev-row">
        <div class="rev-main">
          <span class="rev-name">${escHtml(p.name)}</span>
          <span class="rev-total">${money(p.revenueTotal)}</span>
        </div>
        <div class="rev-breakdown">ins ${money(p.insuranceBilled)} billed · self-pay ${money(p.selfPayCollected)} collected</div>
        <div class="rev-meta">
          <span>${p.sessions} sessions</span>
          <span>est/mo ${money(p.estMonthly)}</span>
          <span>pay ${payCell}</span>
          <span>supe ${supeCell}</span>
          ${netCell}
          ${marginCell}
        </div>
        ${supeIncome}
      </div>`
  }).join('')

  tabRevenue.innerHTML = `
    ${rosterHint}
    ${totalsRow}
    ${providerRows}
    <div class="rev-footer">Insurance revenue at billed rates — actual reimbursement may be lower. Self-pay at collected. Net = revenue − session pay − supervision cost.</div>`
}

// Injected into the SimplePractice clients tab. Self-contained (no outer refs):
// auto-scrolls the lazy list, harvests client-name links, returns the names.
function scrapeSelfPayInPage(): Promise<string[]> {
  return (async () => {
    const SEL = 'a[href*="/clients/"]'
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    const names = new Set<string>()
    const harvest = () => {
      document.querySelectorAll(SEL).forEach(a => {
        const href = a.getAttribute('href') || ''
        if (!/\/clients\/\d+/.test(href)) return
        const t = (a.textContent || '').replace(/\s+/g, ' ').trim()
        if (t && t.length > 1 && !/^clients$/i.test(t)) names.add(t)
      })
    }
    let sc: any = document.querySelector(SEL)
    while (sc && sc !== document.body) {
      const oy = getComputedStyle(sc).overflowY
      if (/(auto|scroll)/.test(oy) && sc.scrollHeight > sc.clientHeight + 20) break
      sc = sc.parentElement
    }
    if (!sc || sc === document.body) sc = document.scrollingElement || document.documentElement
    let stable = 0, last = -1
    for (let i = 0; i < 300 && stable < 5; i++) {
      harvest()
      sc.scrollTop += Math.max(400, sc.clientHeight * 0.9)
      window.scrollBy(0, 800)
      await sleep(250)
      if (names.size === last) stable++
      else { stable = 0; last = names.size }
    }
    harvest()
    return [...names].sort((a, b) => a.localeCompare(b))
  })()
}

function waitForTabComplete(tabId: number): Promise<void> {
  return new Promise(resolve => {
    const listener = (id: number, info: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }
    chrome.tabs.onUpdated.addListener(listener)
  })
}

sosaScrapeBtn.addEventListener('click', async () => {
  sosaScrapeBtn.disabled = true
  showStatus('Opening SimplePractice…', 'info')
  try {
    const tab = await chrome.tabs.create({ url: SP_SELFPAY_URL, active: true })
    if (!tab.id) throw new Error('could not open tab')
    await waitForTabComplete(tab.id)
    await new Promise(r => setTimeout(r, 1500))   // let the React list mount
    showStatus('Scraping self-pay list…', 'info')
    const [inj] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scrapeSelfPayInPage })
    const names = (inj?.result as string[]) || []
    if (names.length === 0) {
      showStatus('Scraped 0 — log in to SimplePractice and make sure the Self-pay list is showing, then retry.', 'error')
    } else {
      setSelfPayRoster(names, Date.now())
      saveSelfPayRoster()
      updateSosaRosterStatus()
      renderSosa()
      showStatus(`Self-pay roster updated: ${names.length} clients.`, 'success')
    }
  } catch (e) {
    showStatus('Scrape failed: ' + (e as Error).message, 'error')
  } finally {
    sosaScrapeBtn.disabled = false
  }
})

chrome.storage.local.get(['payrollData', 'bretInsuranceMap', 'bretInsuranceMapV2', 'clientRoster', 'selfPayRoster'], async (data) => {
  // Client roster — load before payroll so renderResults sees roster fallback.
  if (data.clientRoster && Array.isArray(data.clientRoster.records)) {
    const records = (data.clientRoster.records as ClientRecord[]).filter(r =>
      r && typeof r === 'object' && typeof r.name === 'string')
    setClientRoster(records)
  }
  refreshRosterControls()
  rosterToggleBtn.textContent = `Show roster (${clientRoster.length})`

  // Self-pay roster (from the SimplePractice scrape button) for the SOSA check.
  if (data.selfPayRoster && Array.isArray(data.selfPayRoster.names)) {
    setSelfPayRoster(
      (data.selfPayRoster.names as unknown[]).filter((n): n is string => typeof n === 'string'),
      typeof data.selfPayRoster.capturedAt === 'number' ? data.selfPayRoster.capturedAt : 0)
  }
  updateSosaRosterStatus()

  // Long-lived Bret insurance map — load V2 (hashed keys) first.
  if (data.bretInsuranceMapV2 && typeof data.bretInsuranceMapV2 === 'object') {
    bretInsuranceMap = {}
    for (const [k, v] of Object.entries(data.bretInsuranceMapV2)) {
      if (v === 'united' || v === 'aetna') bretInsuranceMap[k] = v
    }
  } else if (data.bretInsuranceMap && typeof data.bretInsuranceMap === 'object') {
    // One-time migration: old map was keyed by raw client name. Hash each key,
    // save under V2, then drop the old key.
    bretInsuranceMap = {}
    for (const [rawName, v] of Object.entries(data.bretInsuranceMap)) {
      if (v === 'united' || v === 'aetna') {
        const key = await hashClient(rawName)
        bretInsuranceMap[key] = v
      }
    }
    if (Object.keys(bretInsuranceMap).length > 0) {
      saveBretInsuranceMap()
    }
    chrome.storage.local.remove('bretInsuranceMap')
  }

  if (data.payrollData?.result) {
    baseResult = data.payrollData.result
    const saved = data.payrollData.manualEntries
    // Only load the new array shape; ignore old fixed-row format.
    // Sanitize date field so a corrupt persisted entry can't break the date input.
    if (Array.isArray(saved) && saved.every(e => e && typeof e === 'object' && 'groupId' in e)) {
      manualEntries = (saved as ManualEntry[]).map(e => ({
        id: typeof e.id === 'string' ? e.id : newEntryId(),
        groupId: String(e.groupId),
        date: sanitizeHtmlDate(e.date),
        hours: typeof e.hours === 'number' && e.hours > 0 ? e.hours : 0,
      }))
    } else {
      manualEntries = []
    }

    const savedPending = data.payrollData.pendingSessions
    if (Array.isArray(savedPending)) {
      pendingSessions = savedPending
        .filter((p): p is PendingSession =>
          !!p && typeof p === 'object' &&
          typeof p.clinician === 'string' &&
          isValidPendingStatus(p.status))
        .map(p => ({
          id: typeof p.id === 'string' ? p.id : newPendingId(),
          clinician: p.clinician,
          date: sanitizeHtmlDate(p.date),
          client: typeof p.client === 'string' ? p.client : '',
          code: typeof p.code === 'string' ? p.code : '',
          status: p.status,
        }))
    } else {
      pendingSessions = []
    }

    renderManualSection()
    recomputeFromBase()
  } else {
    renderManualSection()
  }
})
