import { parseCSV } from '../lib/csv-parser'
import { calculatePayrollWithHours, applyManualAddition } from '../lib/payroll-engine'
import { getManualRate, legend } from '../lib/compensation-legend'
import { formatShortDate } from '../lib/date-utils'
import { buildPayrollWorkbook, suggestFilename } from '../lib/xlsx-exporter'
import { buildJustWorksCSV, suggestJustWorksFilename } from '../lib/justworks-csv-exporter'
import type { PayrollResultWithHours, ManualAdditionKind, ClinicianSummary } from '../lib/types'

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

function buildManualGroupHtml(g: ManualGroup): string {
  const rate = getManualRate(g.clinician, g.kind)
  const entries = manualEntries.filter(e => e.groupId === g.id)
  const subtotal = entries.reduce((s, e) => s + (e.hours > 0 && e.date ? e.hours * (rate ?? 0) : 0), 0)

  const rowsHtml = entries.map(e => `
    <div class="manual-entry" data-entry-id="${e.id}">
      <input type="date" class="manual-date" value="${sanitizeHtmlDate(e.date)}" />
      <input type="number" class="manual-input" step="0.25" min="0" placeholder="hrs" value="${e.hours > 0 ? e.hours : ''}" />
      <button class="manual-delete" title="Remove">×</button>
    </div>
  `).join('')

  return `
    <div class="manual-group" data-group-id="${g.id}">
      <div class="manual-group-header">
        <span class="manual-group-label">${g.label.split(' ')[0]} <em>${rate !== null ? `$${rate}/hr` : 'no rate'}</em></span>
        <span class="manual-group-subtotal">$${subtotal.toFixed(2)}</span>
      </div>
      <div class="manual-group-rows">${rowsHtml}</div>
      <button class="manual-add-day" data-group-id="${g.id}">+ add day</button>
    </div>
  `
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

  if (target.classList.contains('manual-delete')) {
    const entryEl = target.closest('.manual-entry') as HTMLElement
    const entryId = entryEl?.dataset.entryId
    if (entryId) {
      manualEntries = manualEntries.filter(e => e.id !== entryId)
      recomputeFromBase()
    }
  }
})

clinicianList.addEventListener('input', (e) => {
  const target = e.target as HTMLInputElement
  const entryEl = target.closest('.manual-entry') as HTMLElement
  if (!entryEl) return
  const entryId = entryEl.dataset.entryId
  const entry = manualEntries.find(x => x.id === entryId)
  if (!entry) return

  if (target.classList.contains('manual-date')) {
    entry.date = sanitizeHtmlDate(target.value)
  } else if (target.classList.contains('manual-input')) {
    const v = parseFloat(target.value)
    entry.hours = isNaN(v) || v < 0 ? 0 : v
  }
  recomputeFromBase()
})

clinicianList.addEventListener('change', (e) => {
  // Date inputs often fire 'change' not 'input' in some browsers
  const target = e.target as HTMLInputElement
  if (target.classList.contains('manual-date')) {
    const entryEl = target.closest('.manual-entry') as HTMLElement
    const entryId = entryEl?.dataset.entryId
    const entry = manualEntries.find(x => x.id === entryId)
    if (entry) {
      entry.date = sanitizeHtmlDate(target.value)
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

  currentResult = result
  renderResults(currentResult)
  updateManualSubtotals()

  chrome.storage.local.set({
    payrollData: {
      timestamp: Date.now(),
      result: baseResult,
      manualEntries,
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
  csvInput.value = ''
  renderManualSection()
  resultsSection.classList.add('hidden')
  uploadSection.classList.remove('hidden')
  statusEl.classList.add('hidden')
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
    const hours = (f.totalMinutes / 60).toFixed(1)
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
      const hours = (fill.totalMinutes / 60).toFixed(1)
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
      ${manualHtml}
      ${breakdownHtml}
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

chrome.storage.local.get('payrollData', (data) => {
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
    renderManualSection()
    recomputeFromBase()
  } else {
    renderManualSection()
  }
})
