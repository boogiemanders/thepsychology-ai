import type { PayrollResultWithHours, JustWorksFillData } from '../lib/types'
import { formatShortDate } from '../lib/date-utils'

let panel: HTMLElement | null = null
let currentResult: PayrollResultWithHours | null = null

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FILL_PAYROLL') {
    currentResult = msg.payload as PayrollResultWithHours
    showPanel(currentResult)
    sendResponse({ success: true })
  }
  return true
})

chrome.storage.local.get('payrollData', (data) => {
  if (data.payrollData?.result) {
    currentResult = data.payrollData.result
  }
})

// -- React-compatible input setter --

function setInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype, 'value'
  )?.set
  if (nativeSetter) {
    nativeSetter.call(input, value)
  } else {
    input.value = value
  }
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.dispatchEvent(new Event('blur', { bubbles: true }))
}

function flashElement(el: HTMLElement, color = '#4f46e5') {
  el.style.outline = `2px solid ${color}`
  setTimeout(() => { el.style.outline = '' }, 2000)
}

// -- Wait for element to appear in DOM --

function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector)
    if (existing) { resolve(existing); return }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) { observer.disconnect(); resolve(el) }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { observer.disconnect(); resolve(null) }, timeout)
  })
}

// -- Fill logic --

async function fillTimeCard(fillData: JustWorksFillData) {
  const statusEl = panel?.querySelector(`#jw-status-${CSS.escape(fillData.clinicianName)}`)
  const setStatus = (msg: string) => {
    if (statusEl) statusEl.textContent = msg
  }

  // Step 1: Edit hourly rate
  setStatus('Setting rate...')
  const editBtn = document.querySelector('[data-testid="edit-icon"]')?.closest('button')
    || document.querySelector('[data-testid="edit-icon"]')?.parentElement
  if (editBtn) {
    (editBtn as HTMLElement).click()
    await new Promise(r => setTimeout(r, 500))

    // Look for a rate input that appeared after clicking edit
    const rateInput = await waitForElement(
      'input[name="rate"], input[name="hourlyRate"], input[name="pay_rate"], input[aria-label*="rate" i], input[aria-label*="hourly" i]'
    ) as HTMLInputElement | null

    if (rateInput) {
      setInputValue(rateInput, fillData.adjustedHourlyRate.toFixed(2))
      flashElement(rateInput, '#059669')
      setStatus(`Rate: $${fillData.adjustedHourlyRate.toFixed(2)}/hr`)

      // Try to save -- look for save/confirm button
      await new Promise(r => setTimeout(r, 300))
      const saveBtn = document.querySelector(
        'button[type="submit"], button[data-testid*="save"], button[data-testid*="confirm"]'
      ) as HTMLElement | null
      if (saveBtn) saveBtn.click()
      await new Promise(r => setTimeout(r, 500))
    } else {
      setStatus('Rate input not found -- copy rate manually')
      navigator.clipboard.writeText(fillData.adjustedHourlyRate.toFixed(2))
    }
  } else {
    setStatus('Edit button not found -- copy rate manually')
    navigator.clipboard.writeText(fillData.adjustedHourlyRate.toFixed(2))
  }

  // Step 2: Fill daily hours/minutes
  // JustWorks has separate hours + minutes inputs per day
  const hoursInputs = document.querySelectorAll<HTMLInputElement>(
    'input.TextInput[name="hours"], input[aria-label="hours-input"]'
  )
  const minutesInputs = document.querySelectorAll<HTMLInputElement>(
    'input.TextInput.minutes[name="minutes"], input[aria-label="minutes-input"]'
  )

  if (minutesInputs.length === 0 && hoursInputs.length === 0) {
    setStatus('No time inputs found on page')
    showToast('Navigate to the time card for this clinician first')
    return
  }

  // Map inputs to days: try to find day labels near each input
  const dayInputPairs = mapInputsToDays(hoursInputs, minutesInputs)

  console.log('[jw-autofill] inputs found:', { hours: hoursInputs.length, minutes: minutesInputs.length })
  console.log('[jw-autofill] day pairs (label -> input):', dayInputPairs.map(p => p.dayLabel))
  console.log('[jw-autofill] dailyBreakdown:', fillData.dailyBreakdown.map(d => ({
    date: d.date,
    dayOfWeek: d.dayOfWeek,
    shortDate: formatShortDate(d.date),
    minutes: d.totalMinutes,
  })))

  let filledDays = 0
  const unmatched: string[] = []
  for (const day of fillData.dailyBreakdown) {
    if (day.totalMinutes === 0) continue

    const hours = Math.floor(day.totalMinutes / 60)
    const mins = day.totalMinutes % 60
    const shortDate = formatShortDate(day.date)
    const dowPrefix = day.dayOfWeek.substring(0, 3).toUpperCase()

    // Match by date first (unique), fall back to day-of-week only if no date collision
    // Case-insensitive: JustWorks headers are "SUN 4/5" all-caps
    let pair = dayInputPairs.find(p => {
      const label = p.dayLabel.toUpperCase()
      return shortDate && label.includes(shortDate)
    })
    if (!pair) {
      // No date match — try day-of-week, but only if it's unambiguous (1 match)
      const dowMatches = dayInputPairs.filter(p =>
        p.dayLabel.toUpperCase().includes(dowPrefix)
      )
      if (dowMatches.length === 1) pair = dowMatches[0]
    }

    if (pair) {
      if (pair.hoursInput) {
        setInputValue(pair.hoursInput, String(hours))
        flashElement(pair.hoursInput, '#059669')
      }
      if (pair.minutesInput) {
        setInputValue(pair.minutesInput, String(mins).padStart(2, '0'))
        flashElement(pair.minutesInput, '#059669')
      }
      filledDays++
      console.log(`[jw-autofill] MATCH ${day.date} (${day.dayOfWeek}) ${hours}h ${mins}m -> "${pair.dayLabel}"`)
    } else {
      unmatched.push(`${day.date} (${day.dayOfWeek}) ${hours}h${mins}m`)
      console.warn(`[jw-autofill] NO MATCH for ${day.date} (${day.dayOfWeek}) ${hours}h${mins}m -- skipping (was previously filled in DOM order)`)
    }
  }

  if (unmatched.length) {
    showToast(`Skipped ${unmatched.length} days -- open devtools console for details`)
  }

  // Step 3: Verify total
  await new Promise(r => setTimeout(r, 1000))
  const payTotalEl = document.querySelector('[data-testid="hours-worked-pay-total"]')
  if (payTotalEl) {
    const displayedTotal = parseFloat(
      (payTotalEl.textContent || '').replace(/[^0-9.]/g, '')
    )
    const diff = Math.abs(displayedTotal - fillData.totalPay)
    if (diff < 0.02) {
      setStatus(`OK -- $${displayedTotal.toFixed(2)} matches`)
    } else {
      setStatus(`MISMATCH: JW shows $${displayedTotal.toFixed(2)}, expected $${fillData.totalPay.toFixed(2)}`)
    }
  } else {
    setStatus(`Filled ${filledDays} days`)
  }
}

interface DayInputPair {
  dayLabel: string
  hoursInput: HTMLInputElement | null
  minutesInput: HTMLInputElement | null
}

function mapInputsToDays(
  hoursInputs: NodeListOf<HTMLInputElement>,
  minutesInputs: NodeListOf<HTMLInputElement>
): DayInputPair[] {
  const pairs: DayInputPair[] = []
  const allInputs = minutesInputs.length > 0 ? minutesInputs : hoursInputs

  // Regex for M/D or MM/DD date format
  const DATE_RE = /\b\d{1,2}\/\d{1,2}\b/

  allInputs.forEach((input, idx) => {
    let dayLabel = ''

    // Strategy 1: walk up ancestors, at each level scan preceding siblings (and their
    // text) for a "M/D" date or a weekday token. JustWorks renders day headers above
    // the input cell in a separate row, so this usually finds them.
    let node: Element | null = input
    for (let depth = 0; depth < 6 && node && !dayLabel; depth++) {
      // Check self's text first (e.g., aria-label, wrapper label text)
      const selfText = node.textContent?.trim() || ''
      if (DATE_RE.test(selfText) && selfText.length < 40) {
        const m = selfText.match(DATE_RE)
        if (m) { dayLabel = selfText; break }
      }
      // Check preceding siblings at this level
      let sib: Element | null = node.previousElementSibling
      let scanned = 0
      while (sib && scanned < 8) {
        const txt = (sib.textContent || '').trim()
        if (DATE_RE.test(txt) || /\b(SUN|MON|TUE|WED|THU|FRI|SAT)\b/i.test(txt)) {
          // Extract compact label
          const dateMatch = txt.match(DATE_RE)
          const dowMatch = txt.match(/\b(SUN|MON|TUE|WED|THU|FRI|SAT)\b/i)
          const parts = [dowMatch?.[0], dateMatch?.[0]].filter(Boolean)
          if (parts.length) { dayLabel = parts.join(' '); break }
        }
        sib = sib.previousElementSibling
        scanned++
      }
      node = node.parentElement
    }

    // Strategy 2: aria-label or title on the input itself
    if (!dayLabel) {
      dayLabel = input.getAttribute('aria-label') || input.getAttribute('title') || ''
    }

    pairs.push({
      dayLabel: dayLabel || `Day ${idx + 1}`,
      hoursInput: hoursInputs[idx] || null,
      minutesInput: minutesInputs[idx] || null,
    })
  })

  return pairs
}

// -- Panel UI --

function showPanel(result: PayrollResultWithHours) {
  if (panel) panel.remove()

  panel = document.createElement('div')
  panel.id = 'jw-payroll-panel'
  panel.innerHTML = buildPanelHTML(result)
  document.body.appendChild(panel)

  makeDraggable(panel)

  panel.querySelector('#jw-panel-close')?.addEventListener('click', () => {
    panel?.remove()
    panel = null
  })

  panel.querySelector('#jw-panel-minimize')?.addEventListener('click', () => {
    const body = panel?.querySelector('#jw-panel-body') as HTMLElement
    if (body) body.classList.toggle('jw-hidden')
  })

  panel.querySelectorAll('.jw-copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const value = target.dataset.value || ''
      navigator.clipboard.writeText(value)
      target.textContent = 'Copied'
      setTimeout(() => { target.textContent = 'Copy' }, 1200)
    })
  })

  panel.querySelectorAll('.jw-fill-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const clinicianName = target.dataset.clinician || ''
      const fillData = result.fillData.find(f => f.clinicianName === clinicianName)
      if (fillData) fillTimeCard(fillData)
    })
  })

  // Toggle daily breakdown
  panel.querySelectorAll('.jw-toggle-daily').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const dailyEl = target.nextElementSibling as HTMLElement
      if (dailyEl) dailyEl.classList.toggle('jw-hidden')
    })
  })
}

function buildPanelHTML(result: PayrollResultWithHours): string {
  const rows = result.fillData.map((f) => {
    const isBret = f.clinicianName === 'Bret Boatwright'
    const estLabel = isBret ? ' <span class="jw-est">EST</span>' : ''
    const totalHours = (f.totalMinutes / 60).toFixed(2)
    const nudgeNote = f.minuteAdjustment !== 0
      ? `<span class="jw-nudge">${f.minuteAdjustment > 0 ? '+' : ''}${f.minuteAdjustment}m</span>`
      : ''

    const dailyRows = f.dailyBreakdown.map(d => {
      const h = Math.floor(d.totalMinutes / 60)
      const m = d.totalMinutes % 60
      return `<div class="jw-daily-row">
        <span>${d.dayOfWeek.substring(0, 3)} ${formatShortDate(d.date)}</span>
        <span>${h}h${m > 0 ? ` ${m}m` : ''}</span>
        <span class="jw-daily-sessions">${d.sessionCount}s</span>
      </div>`
    }).join('')

    return `
      <div class="jw-row-group">
        <div class="jw-row">
          <span class="jw-name">${f.clinicianName}</span>
          <span class="jw-amount">$${f.totalPay.toFixed(2)}${estLabel}</span>
        </div>
        <div class="jw-row jw-row-meta">
          <span class="jw-rate">$${f.adjustedHourlyRate.toFixed(2)}/hr</span>
          <span class="jw-hours">${totalHours}h${nudgeNote}</span>
          <button class="jw-copy-btn" data-value="${f.adjustedHourlyRate.toFixed(2)}">Rate</button>
          <button class="jw-fill-btn" data-clinician="${f.clinicianName}">Fill</button>
        </div>
        <div class="jw-row jw-row-meta">
          <button class="jw-toggle-daily">Daily</button>
          <span id="jw-status-${CSS.escape(f.clinicianName)}" class="jw-status"></span>
        </div>
        <div class="jw-daily-breakdown jw-hidden">
          ${dailyRows}
        </div>
      </div>
    `
  }).join('')

  return `
    <div id="jw-panel-header">
      <span id="jw-panel-title">Payroll</span>
      <div id="jw-panel-controls">
        <button id="jw-panel-minimize" title="Minimize">_</button>
        <button id="jw-panel-close" title="Close">X</button>
      </div>
    </div>
    <div id="jw-panel-body">
      ${rows}
    </div>
  `
}

function showToast(msg: string) {
  const toast = document.createElement('div')
  toast.className = 'jw-toast'
  toast.textContent = msg
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

function makeDraggable(el: HTMLElement) {
  const header = el.querySelector('#jw-panel-header') as HTMLElement
  if (!header) return

  let isDragging = false
  let startX = 0
  let startY = 0
  let origX = 0
  let origY = 0

  header.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    const rect = el.getBoundingClientRect()
    origX = rect.left
    origY = rect.top
    header.style.cursor = 'grabbing'
  })

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    el.style.left = `${origX + dx}px`
    el.style.top = `${origY + dy}px`
    el.style.right = 'auto'
  })

  document.addEventListener('mouseup', () => {
    isDragging = false
    header.style.cursor = 'grab'
  })
}
