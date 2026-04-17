import { parseCSV } from '../lib/csv-parser'
import { calculatePayrollWithHours, applyManualAddition, applyPendingSession } from '../lib/payroll-engine'
import { getManualRate, legend } from '../lib/compensation-legend'
import { formatShortDate } from '../lib/date-utils'
import { buildPayrollWorkbook, suggestFilename } from '../lib/xlsx-exporter'
import { buildJustWorksCSV, suggestJustWorksFilename } from '../lib/justworks-csv-exporter'
import type { PayrollResultWithHours, ManualAdditionKind, ClinicianSummary, PendingSession, PendingSessionStatus, BretInsurance } from '../lib/types'

const csvInput = document.getElementById('csv-input') as HTMLInputElement
const uploadLabel = document.querySelector('.upload-label') as HTMLLabelElement
const uploadSection = document.getElementById('upload-section')!
const resultsSection = document.getElementById('results-section')!
const clinicianList = document.getElementById('clinician-list')!
const bretSection = document.getElementById('bret-section')!
const bretDetails = document.getElementById('bret-details')!
const clearBtn = document.getElementById('clear-btn')!
const sendBtn = document.getElementById('send-to-justworks')!
const copyBtn = document.getElementById('copy-json')!
const downloadBtn = document.getElementById('download-xlsx')!
const downloadJwCsvBtn = document.getElementById('download-jw-csv')!
const statusEl = document.getElementById('status')!

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

// Bret per-client insurance — persists across payroll runs so Carlos only
// picks once per patient. Keyed by exact client name as it appears in CSV.
let bretInsuranceMap: Record<string, BretInsurance> = {}

function newPendingId(): string {
  return `p${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function isValidPendingStatus(s: unknown): s is PendingSessionStatus {
  return s === 'pending' || s === 'completed' || s === 'no-show'
}

function saveBretInsuranceMap() {
  chrome.storage.local.set({ bretInsuranceMap })
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
    const current = bretInsuranceMap[c]
    const mkBtn = (value: BretInsurance, label: string) =>
      `<button class="ins-btn${current === value ? ' active' : ''}" data-client="${esc(c)}" data-value="${value}">${label}</button>`
    const unsetMark = !current ? '<span class="ins-unset">pick insurance</span>' : ''
    return `
      <div class="ins-row">
        <span class="ins-client">${esc(c)}</span>
        <span class="ins-controls">
          ${mkBtn('united', 'United')}
          ${mkBtn('aetna', 'Aetna')}
        </span>
        ${unsetMark}
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
clinicianList.addEventListener('click', (e) => {
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
    // Toggle off if clicking the active one
    if (bretInsuranceMap[client] === value) {
      delete bretInsuranceMap[client]
    } else {
      bretInsuranceMap[client] = value
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

function recomputeFromBase() {
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

  baseResult = calculatePayrollWithHours(rows)
  manualEntries = []
  didacticDebugLogged = false
  renderManualSection()
  recomputeFromBase()
}

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
  clinicianList.innerHTML = ''

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

chrome.storage.local.get(['payrollData', 'bretInsuranceMap'], (data) => {
  // Long-lived Bret insurance map — load first so renders see it
  if (data.bretInsuranceMap && typeof data.bretInsuranceMap === 'object') {
    bretInsuranceMap = {}
    for (const [k, v] of Object.entries(data.bretInsuranceMap)) {
      if (v === 'united' || v === 'aetna') bretInsuranceMap[k] = v
    }
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
