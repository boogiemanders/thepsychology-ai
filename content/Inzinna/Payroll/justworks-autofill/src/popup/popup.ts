import { parseCSV } from '../lib/csv-parser'
import { calculatePayrollWithHours } from '../lib/payroll-engine'
import type { PayrollResultWithHours } from '../lib/types'

const csvInput = document.getElementById('csv-input') as HTMLInputElement
const uploadSection = document.getElementById('upload-section')!
const resultsSection = document.getElementById('results-section')!
const clinicianList = document.getElementById('clinician-list')!
const bretSection = document.getElementById('bret-section')!
const bretDetails = document.getElementById('bret-details')!
const clearBtn = document.getElementById('clear-btn')!
const sendBtn = document.getElementById('send-to-justworks')!
const copyBtn = document.getElementById('copy-json')!
const statusEl = document.getElementById('status')!

let currentResult: PayrollResultWithHours | null = null

csvInput.addEventListener('change', async () => {
  const file = csvInput.files?.[0]
  if (!file) return

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0) {
    showStatus('No valid rows found in CSV. Check column headers.', 'error')
    return
  }

  currentResult = calculatePayrollWithHours(rows)
  renderResults(currentResult)

  chrome.storage.local.set({
    payrollData: {
      timestamp: Date.now(),
      result: currentResult,
    },
  })
})

clearBtn.addEventListener('click', () => {
  currentResult = null
  csvInput.value = ''
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
        return `<div class="daily-row">
          <span>${d.dayOfWeek.substring(0, 3)}</span>
          <span>${h}h${m > 0 ? ` ${m}m` : ''}</span>
          <span class="daily-sessions">${d.sessionCount}s</span>
        </div>`
      }).filter(Boolean).join('')

      if (dailyHtml) {
        fillHtml += `<div class="daily-breakdown">${dailyHtml}</div>`
      }
    } else if (fill && fill.totalMinutes === 0 && fill.totalPay > 0) {
      fillHtml = '<div class="fill-info"><span class="zero-hours">0 hours -- enter as bonus/adjustment</span></div>'
    }

    card.innerHTML = `
      <div class="name">${c.name}</div>
      <div class="details">
        <span class="pay">$${(fill?.totalPay ?? c.sessionPay).toFixed(2)}</span>
        <span class="sessions">${c.sessionCount} sessions</span>
        ${supeHtml}
      </div>
      ${fillHtml}
    `
    clinicianList.appendChild(card)
  }

  // Bret's full calc
  const b = result.bretFullCalc
  if (b.sessionPay > 0 || b.totalSupervision > 0) {
    bretSection.classList.remove('hidden')
    bretDetails.innerHTML = `
      <div class="bret-line">
        <span>Session pay (EST -- needs payer rates)</span>
        <span>$${b.sessionPay.toFixed(2)}</span>
      </div>
      <div class="bret-line">
        <span>Supervision from Izzy</span>
        <span>$${b.supervisionFromIzzy.toFixed(2)}</span>
      </div>
      <div class="bret-line">
        <span>Supervision from Carlos</span>
        <span>$${b.supervisionFromCarlos.toFixed(2)}</span>
      </div>
      <div class="bret-line">
        <span>Supervision from Karen</span>
        <span>$${b.supervisionFromKaren.toFixed(2)}</span>
      </div>
      <div class="bret-line">
        <span>Total supervision</span>
        <span>$${b.totalSupervision.toFixed(2)}</span>
      </div>
      <div class="bret-line total">
        <span>ESTIMATED GRAND TOTAL</span>
        <span>$${b.grandTotal.toFixed(2)}</span>
      </div>
    `
  }
}

function showStatus(msg: string, type: 'success' | 'error' | 'info') {
  statusEl.textContent = msg
  statusEl.className = type
}

chrome.storage.local.get('payrollData', (data) => {
  if (data.payrollData?.result) {
    currentResult = data.payrollData.result
    renderResults(currentResult)
  }
})
