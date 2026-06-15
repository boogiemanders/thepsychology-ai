import { toCsv } from '../lib/csv'
import {
  mergeReports,
  fullRows,
  RATER8_HEADER,
  FULL_HEADER,
  MergedRow,
  MergeResult,
} from '../lib/merge'

const SP = 'https://secure.simplepractice.com'
const DEFAULT_TOKEN = 'inz-r8-93kx7q4ftn2m'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const hasChrome = typeof chrome !== 'undefined' && !!chrome.runtime?.id

// ---------- state ----------
let merged: MergeResult | null = null
let periodLabel = ''
let activeFilter = 'all'
const manualFiles: { attendance?: string; details?: string } = {}

// ---------- dates ----------
function iso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function applyPreset(preset: string) {
  const start = $<HTMLInputElement>('start-date')
  const end = $<HTMLInputElement>('end-date')
  const today = new Date()
  if (preset === 'custom') return
  if (preset === 'this-month') {
    start.value = iso(new Date(today.getFullYear(), today.getMonth(), 1))
    end.value = iso(today)
  } else if (preset === 'last-month') {
    start.value = iso(new Date(today.getFullYear(), today.getMonth() - 1, 1))
    end.value = iso(new Date(today.getFullYear(), today.getMonth(), 0))
  } else {
    const days = Number(preset)
    const s = new Date(today)
    s.setDate(s.getDate() - days)
    start.value = iso(s)
    end.value = iso(today)
  }
}

// ---------- settings ----------
async function loadSettings(): Promise<{ url: string; token: string }> {
  if (!hasChrome) return { url: '', token: DEFAULT_TOKEN }
  const got = await chrome.storage.sync.get(['webAppUrl', 'webAppToken'])
  return { url: got.webAppUrl ?? '', token: got.webAppToken ?? DEFAULT_TOKEN }
}

async function saveSettings(url: string, token: string) {
  if (!hasChrome) return
  await chrome.storage.sync.set({ webAppUrl: url, webAppToken: token })
}

// ---------- status helpers ----------
function setStatus(id: string, msg: string, kind: '' | 'error' | 'ok' = '') {
  const el = $(id)
  el.textContent = msg
  el.className = `status ${kind}`.trim()
}

// ---------- fetch from SimplePractice ----------
function reportUrls(startsAt: string, endsAt: string): string[] {
  const f = encodeURIComponent
  return [
    `${SP}/frontend/client-attendance-report-rows.csv?filter%5BstartsAt%5D=${f(startsAt)}&filter%5BendsAt%5D=${f(endsAt)}&sort=clientName`,
    // JSON (not CSV): carries the client hashedId for deep links and the
    // parent/guardian contact for minors
    `${SP}/frontend/client-details-report-rows.json?filter%5BclientStatus%5D=Active&sort=clientName`,
  ]
}

async function pullFromSp() {
  const startsAt = $<HTMLInputElement>('start-date').value
  const endsAt = $<HTMLInputElement>('end-date').value
  if (!startsAt || !endsAt) {
    setStatus('fetch-status', 'Pick a start and end date first.', 'error')
    return
  }
  if (!hasChrome) {
    setStatus('fetch-status', 'Open this page through the extension icon to pull directly.', 'error')
    return
  }
  const btn = $<HTMLButtonElement>('fetch-btn')
  btn.disabled = true
  setStatus('fetch-status', 'Pulling both reports from SimplePractice...')
  try {
    const res = await chrome.runtime.sendMessage({
      type: 'FETCH_REPORTS',
      urls: reportUrls(startsAt, endsAt),
    })
    if (!res?.ok) {
      if (res?.error === 'LOGIN_REQUIRED') {
        setStatus('fetch-status', 'SimplePractice wants you to log in. Log in on the tab that just opened, then press the button again.', 'error')
      } else {
        setStatus('fetch-status', `Could not pull reports: ${res?.error ?? 'unknown error'}`, 'error')
      }
      return
    }
    const [attendance, details] = res.reports as string[]
    runMerge(attendance, details, `${startsAt} to ${endsAt}`)
    setStatus('fetch-status', 'Reports pulled.', 'ok')
  } finally {
    btn.disabled = false
  }
}

// ---------- manual files ----------
function detectKind(text: string): 'attendance' | 'details' | null {
  const first = text.slice(0, 300).split('\n')[0].toLowerCase()
  if (first.includes('client_name') && first.includes('office_name')) return 'attendance'
  if (first.startsWith('client,') || (first.includes('client') && first.includes('phone number'))) return 'details'
  return null
}

async function handleFiles(files: FileList | File[]) {
  for (const file of Array.from(files)) {
    const text = await file.text()
    const kind = detectKind(text)
    if (!kind) continue
    manualFiles[kind] = text
    const slot = $(`slot-${kind}`)
    slot.textContent = `${kind === 'attendance' ? 'attendance' : 'client details'}: ${file.name}`
    slot.classList.add('loaded')
  }
  if (manualFiles.attendance && manualFiles.details) {
    runMerge(manualFiles.attendance, manualFiles.details, '')
  }
}

// ---------- merge + render ----------
function runMerge(attendanceCsv: string, detailsCsv: string, label: string) {
  merged = mergeReports(attendanceCsv, detailsCsv)
  if (!label) {
    // manual mode: derive the period from the visits present in the data
    const dates = merged.rows
      .map((r) => r.lastVisit)
      .filter(Boolean)
      .map((s) => {
        const [mm, dd, yyyy] = s.split('/')
        return `${yyyy}-${mm}-${dd}`
      })
      .sort()
    label = dates.length ? `${dates[0]} to ${dates[dates.length - 1]}` : 'unknown period'
  }
  periodLabel = label
  render()
}

function visibleRows(): MergedRow[] {
  if (!merged) return []
  if (activeFilter === 'all') return merged.rows
  if (activeFilter === 'issues') {
    return merged.rows.filter((r) => r.match === 'not_found' || (!r.phone && !r.email))
  }
  return merged.rows.filter((r) => r.location === activeFilter)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function render() {
  if (!merged) return
  $('results').classList.remove('hidden')
  $('period-label').textContent = periodLabel
  const s = merged.stats
  const manhattan = merged.rows.filter((r) => r.location === 'Manhattan').length
  const virtual = merged.rows.filter((r) => r.location === 'Virtual').length
  const guardianBit = s.guardianFallback ? `${s.guardianFallback} via guardian · ` : ''
  $('stats-line').textContent =
    `${s.rows} people from ${s.appointments} appointments · ${manhattan} Manhattan · ${virtual} Virtual · ` +
    `${s.notFound} not in client details · ${s.missingContact} without contact info · ${guardianBit}` +
    `${merged.rater8.length} rater8 rows (one per visit)`

  const tbody = $('results-table').querySelector('tbody')!
  tbody.innerHTML = ''
  for (const r of visibleRows()) {
    const tr = document.createElement('tr')
    if (r.match === 'not_found' || (!r.phone && !r.email)) tr.className = 'problem'
    // clickable name -> SP client overview when we have the hashedId (JSON pull only)
    const nameCell = r.clientId
      ? `<a class="client-link" href="${SP}/clients/${encodeURIComponent(r.clientId)}/overview" target="_blank" rel="noopener noreferrer">${escapeHtml(r.clientName)}</a>`
      : escapeHtml(r.clientName)
    const matchCell =
      r.note && (r.match === 'not_found' || r.note.startsWith('parent:')) ? `${r.match} · ${r.note}` : r.match
    const cells = [
      nameCell,
      `<span class="loc-badge loc-${r.location}">${r.location}</span>`,
      r.lastVisit,
      r.phone,
      r.email,
      r.provider,
      matchCell,
    ]
    cells.forEach((c, i) => {
      const td = document.createElement('td')
      if (i === 0 || i === 1) td.innerHTML = c
      else td.textContent = c
      tr.appendChild(td)
    })
    tbody.appendChild(tr)
  }
}

// ---------- outputs ----------
function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function safeLabel(): string {
  return periodLabel.replace(/[^0-9a-z-]+/gi, '_')
}

async function sendToSheet() {
  if (!merged) return
  const { url, token } = await loadSettings()
  if (!url) {
    setStatus('action-status', 'Add the Google Sheet web app URL in settings (gear icon) first.', 'error')
    $('settings').classList.remove('hidden')
    return
  }
  const btn = $<HTMLButtonElement>('send-sheet')
  btn.disabled = true
  setStatus('action-status', 'Sending to Google Sheet...')
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token,
        tab: periodLabel,
        header: FULL_HEADER,
        rows: fullRows(merged.rows),
      }),
    })
    const data = await res.json().catch(() => null)
    if (data?.ok) {
      setStatus('action-status', `Sheet tab "${periodLabel}" updated (${data.rows} rows).`, 'ok')
    } else {
      setStatus('action-status', `Sheet update failed: ${data?.error ?? `HTTP ${res.status}`}`, 'error')
    }
  } catch (e) {
    setStatus('action-status', `Sheet update failed: ${e}`, 'error')
  } finally {
    btn.disabled = false
  }
}

async function copyList(kind: 'email' | 'phone') {
  const rows = visibleRows()
  const values = [...new Set(rows.map((r) => (kind === 'email' ? r.email : r.phone)).filter(Boolean))]
  await navigator.clipboard.writeText(values.join(', '))
  setStatus('action-status', `Copied ${values.length} ${kind === 'email' ? 'emails' : 'phone numbers'} (${activeFilter}).`, 'ok')
}

// ---------- init ----------
async function init() {
  applyPreset('30')
  $<HTMLSelectElement>('preset').addEventListener('change', (e) =>
    applyPreset((e.target as HTMLSelectElement).value)
  )
  $('fetch-btn').addEventListener('click', pullFromSp)

  const settings = await loadSettings()
  $<HTMLInputElement>('webapp-url').value = settings.url
  $<HTMLInputElement>('webapp-token').value = settings.token
  $('settings-toggle').addEventListener('click', () => $('settings').classList.toggle('hidden'))
  $('save-settings').addEventListener('click', async () => {
    await saveSettings($<HTMLInputElement>('webapp-url').value.trim(), $<HTMLInputElement>('webapp-token').value.trim())
    setStatus('settings-status', 'Saved.', 'ok')
  })

  const dz = $('drop-zone')
  dz.addEventListener('dragover', (e) => {
    e.preventDefault()
    dz.classList.add('dragover')
  })
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'))
  dz.addEventListener('drop', (e) => {
    e.preventDefault()
    dz.classList.remove('dragover')
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files)
  })
  $<HTMLInputElement>('file-input').addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement
    if (input.files) handleFiles(input.files)
  })

  $('dl-rater8').addEventListener('click', () => {
    if (!merged) return
    downloadCsv(`rater8_${safeLabel()}.csv`, toCsv(RATER8_HEADER, merged.rater8))
  })
  $('dl-full').addEventListener('click', () => {
    if (!merged) return
    downloadCsv(`client_locations_${safeLabel()}.csv`, toCsv(FULL_HEADER, fullRows(merged.rows)))
  })
  $('send-sheet').addEventListener('click', sendToSheet)
  $('copy-emails').addEventListener('click', () => copyList('email'))
  $('copy-phones').addEventListener('click', () => copyList('phone'))

  document.querySelectorAll<HTMLButtonElement>('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'))
      chip.classList.add('active')
      activeFilter = chip.dataset.filter!
      render()
    })
  })
}

init()
