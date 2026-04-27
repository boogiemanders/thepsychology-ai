import { CapturedClient, DEFAULT_STATUS } from '../lib/types'
import { saveClient } from '../lib/storage'
import {
  injectButton,
  showToast,
  imageToBase64,
  urlToBase64,
  assertExtensionContext,
  isExtensionContextInvalidatedError,
  registerFloatingButtonsController,
} from './shared'

/**
 * ZocDoc provider portal selectors — mapped from actual DOM data-test attributes.
 * The detail panel (appointment flyout) must be open for most fields to be available.
 */

function getText(selector: string): string {
  const el = document.querySelector(selector)
  return el?.textContent?.trim() ?? ''
}

function isVisible(el: Element): boolean {
  return !(el instanceof HTMLElement) || el.offsetParent !== null || el.getClientRects().length > 0
}

function getImgSrc(selector: string): string {
  const el = document.querySelector(selector)
  // Could be an img inside the container, or the element itself
  const img = el?.querySelector('img') ?? (el instanceof HTMLImageElement ? el : null)
  return img?.src ?? ''
}

function textLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function getVisibleElement<T extends Element>(selector: string): T | null {
  const visible = Array.from(document.querySelectorAll(selector)).find(isVisible)
  return (visible as T | undefined) ?? document.querySelector(selector)
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function getVisibleText(selectors: string[]): string {
  for (const selector of selectors) {
    const visibleMatch = Array.from(document.querySelectorAll(selector))
      .find((el) => isVisible(el) && normalizeWhitespace(el.textContent ?? '').length > 0)
    if (visibleMatch) {
      return normalizeWhitespace(visibleMatch.textContent ?? '')
    }

    const anyMatch = Array.from(document.querySelectorAll(selector))
      .find((el) => normalizeWhitespace(el.textContent ?? '').length > 0)
    if (anyMatch) {
      return normalizeWhitespace(anyMatch.textContent ?? '')
    }
  }

  return ''
}

function findSexFromLabel(): string {
  const sexValues = new Set(['male', 'female', 'other', 'prefer not to say', 'nonbinary', 'non-binary'])

  // Strategy 1: find a label/heading element whose text is "Sex" or "Gender",
  // then read the next sibling or adjacent element value.
  const candidates = Array.from(document.querySelectorAll('div, span, p, label, dt'))
    .filter(isVisible)
    .filter((el) => {
      const t = normalizeWhitespace(el.textContent ?? '').toLowerCase()
      return t === 'sex' || t === 'gender'
    })

  for (const labelEl of candidates) {
    // Try next sibling
    const next = labelEl.nextElementSibling
    if (next) {
      const text = normalizeWhitespace(next.textContent ?? '')
      if (text && sexValues.has(text.toLowerCase())) return text
    }
    // Try parent's next div child after the label
    const parent = labelEl.parentElement
    if (parent) {
      const siblings = Array.from(parent.children)
      const idx = siblings.indexOf(labelEl)
      for (let i = idx + 1; i < siblings.length; i++) {
        const text = normalizeWhitespace(siblings[i].textContent ?? '')
        if (text && sexValues.has(text.toLowerCase())) return text
      }
    }
  }

  // Strategy 2: any visible div whose text is exactly Male/Female/Other inside
  // a patient/demographics container.
  const patientContainers = document.querySelectorAll(
    '[class*="patient" i], [class*="demographic" i], [data-test*="patient" i]'
  )
  for (const container of Array.from(patientContainers)) {
    const divs = container.querySelectorAll('div, span')
    for (const d of Array.from(divs)) {
      const text = normalizeWhitespace(d.textContent ?? '')
      if (sexValues.has(text.toLowerCase())) return text
    }
  }

  return ''
}

function findPatientRecordLink(): HTMLAnchorElement | null {
  return (
    getVisibleElement<HTMLAnchorElement>('[data-test="patient-record-link"]') ??
    getVisibleElement<HTMLAnchorElement>('a[href*="/patient/"][href*="/record"]')
  )
}

type ObservedPatientContext = {
  fullName: string
  dobRaw: string
  phone: string
  email: string
  addressRaw: string
  appointmentRaw: string
  sexRaw: string
}

const lastObservedContext: ObservedPatientContext = {
  fullName: '',
  dobRaw: '',
  phone: '',
  email: '',
  addressRaw: '',
  appointmentRaw: '',
  sexRaw: '',
}

function rememberIfPresent<K extends keyof ObservedPatientContext>(
  key: K,
  value: ObservedPatientContext[K]
): void {
  if (typeof value === 'string' && value.trim()) {
    lastObservedContext[key] = value
  }
}

function snapshotVisiblePatientContext(): void {
  const patientLink = findPatientRecordLink()

  rememberIfPresent('fullName', getVisibleText([
    '[data-test="patient-record-header"]',
    '[data-test="patient-record-link"]',
    'a[href*="/patient/"][href*="/record"]',
  ]) || normalizeWhitespace(patientLink?.textContent ?? ''))
  rememberIfPresent('dobRaw', getText('[data-test="patient-dob"]') || getText('[data-test="age-content"]'))
  rememberIfPresent('phone', getText('[data-test="phone-number-content"]'))
  rememberIfPresent('email', getText('[data-test="email-content"]'))
  rememberIfPresent('addressRaw', getText('[data-test="address-content"]') || findCalendarCardAddress(patientLink))
  rememberIfPresent('appointmentRaw', getText('[data-test="appointment-details-section-appointment-time"]'))
  rememberIfPresent('sexRaw', getText('[data-test="sex-content"]') || findSexFromLabel())
}

/**
 * Parse full name "Xavier Lee" into { first, last }
 */
function parseName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

/**
 * Parse DOB from "DOB: 09/09/2000" or "25 (DOB: 09/09/2000)"
 */
function parseDob(text: string): string {
  const match = text.match(/DOB:\s*(\d{2}\/\d{2}\/\d{4})/)
  return match?.[1] ?? ''
}

/**
 * Parse address from "19 Lefferts pl Apt 2, Brooklyn, NJ, 08820"
 */
function parseAddress(text: string): { street: string; city: string; state: string; zip: string } {
  // Format: "street, city, state, zip"
  const parts = text.split(',').map(s => s.trim())
  if (parts.length >= 4) {
    return { street: parts[0], city: parts[1], state: parts[2], zip: parts[3] }
  }
  if (parts.length === 3) {
    // Could be "street, city, state zip"
    const lastParts = parts[2].split(/\s+/)
    if (lastParts.length >= 2) {
      return { street: parts[0], city: parts[1], state: lastParts[0], zip: lastParts[1] }
    }
    return { street: parts[0], city: parts[1], state: parts[2], zip: '' }
  }
  return { street: text, city: '', state: '', zip: '' }
}

function looksLikeStreetAddress(text: string): boolean {
  const normalized = normalizeWhitespace(text)
  return /,\s*[A-Za-z .'-]+,\s*[A-Z]{2},\s*\d{5}(?:-\d{4})?$/.test(normalized)
}

function findCalendarCardAddress(patientLink: Element | null): string {
  const knownCalendarAddress = getVisibleElement<HTMLElement>('div.sc-ijDOKB.bmbNov')
  if (knownCalendarAddress && looksLikeStreetAddress(knownCalendarAddress.textContent ?? '')) {
    return normalizeWhitespace(knownCalendarAddress.textContent ?? '')
  }

  let current = patientLink?.parentElement ?? null
  let depth = 0
  while (current && depth < 6) {
    const candidates = current.querySelectorAll('div, span, p')
    for (const candidate of Array.from(candidates)) {
      const text = normalizeWhitespace(candidate.textContent ?? '')
      if (looksLikeStreetAddress(text)) {
        return text
      }
    }
    current = current.parentElement
    depth++
  }

  return ''
}

function findCardCaptureRoot(start: Element | null): Element | null {
  let current: Element | null = start
  let depth = 0

  while (current && depth < 6) {
    if (current.querySelector('a[href], img')) {
      return current
    }
    current = current.parentElement
    depth++
  }

  return start
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function inferAppointmentYear(month: number, day: number): number {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()

  if (month < currentMonth || (month === currentMonth && day < currentDay - 1)) {
    return currentYear + 1
  }

  return currentYear
}

function normalizeAppointmentDate(text: string): string {
  const cleaned = text.trim()
  if (!cleaned) return ''

  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    return toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]))
  }

  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (slashMatch) {
    const month = Number(slashMatch[1])
    const day = Number(slashMatch[2])
    const yearRaw = slashMatch[3]
    const year = yearRaw
      ? yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw)
      : inferAppointmentYear(month, day)
    return toIsoDate(year, month, day)
  }

  const monthNames: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  }

  const namedMatch = cleaned.match(/([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/)
  if (namedMatch) {
    const month = monthNames[namedMatch[1].slice(0, 3).toLowerCase()]
    const day = Number(namedMatch[2])
    if (!month || !day) return cleaned
    const year = namedMatch[3] ? Number(namedMatch[3]) : inferAppointmentYear(month, day)
    return toIsoDate(year, month, day)
  }

  return cleaned
}

function extractInsuranceCompany(...sources: string[]): string {
  const ignoredPatterns = [
    /^insurance$/i,
    /^view details$/i,
    /^view card$/i,
    /^download$/i,
    /^member/i,
    /^group/i,
    /^subscriber/i,
    /^policy/i,
    /^copay/i,
    /^in-network$/i,
    /^out-of-network$/i,
  ]

  for (const source of sources) {
    for (const line of textLines(source)) {
      if (ignoredPatterns.some((pattern) => pattern.test(line))) continue
      return line
    }
  }

  return ''
}

async function captureCardFromElement(container: Element | null): Promise<string> {
  if (!container) return ''

  const link = container.closest('a[href]') ?? container.querySelector('a[href]')
  if (link instanceof HTMLAnchorElement && link.href) {
    try {
      return await urlToBase64(link.href)
    } catch {
      // Fall back to img handling below.
    }
  }

  const img = container.querySelector('img')
  if (img?.src) {
    try {
      return await urlToBase64(img.src)
    } catch {
      try {
        return await imageToBase64(img.src)
      } catch {
        return ''
      }
    }
  }

  return ''
}

/**
 * Parse appointment time from "Appointment timeMonday Mar 30 at 1:00 PM EDT"
 * or from table column "Mar 30, 2026 at 1:00 PM"
 */
function parseAppointmentDateTime(text: string): { date: string; time: string } {
  // Remove prefix labels
  let cleaned = text
    .replace(/^Appointment\s*time/i, '')
    .replace(/\s*(EDT|EST|CDT|CST|MDT|MST|PDT|PST)\s*$/i, '')
    .trim()

  // Try to extract date and time from "Monday Mar 30 at 1:00 PM" or "Mar 30, 2026 at 1:00 PM"
  const atMatch = cleaned.match(/(.+?)\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
  if (atMatch) {
    const datePart = atMatch[1]
      .replace(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*/i, '')
      .trim()
    return { date: normalizeAppointmentDate(datePart), time: atMatch[2].trim() }
  }

  return { date: normalizeAppointmentDate(cleaned), time: '' }
}

async function captureClient(): Promise<void> {
  try {
    assertExtensionContext()
    snapshotVisiblePatientContext()
    const patientLink = findPatientRecordLink()

    // Get patient name from the detail panel header or record link
    const fullName = getVisibleText([
      '[data-test="patient-record-header"]',
      '[data-test="patient-record-link"]',
      'a[href*="/patient/"][href*="/record"]',
    ]) ||
      normalizeWhitespace(patientLink?.textContent ?? '') ||
      lastObservedContext.fullName
    const { first, last } = parseName(fullName)

    if (!first && !last) {
      showToast('No client selected. Click a patient row first to open their details.', 'error')
      return
    }

    // DOB — from detail panel or flyout
    const dobRaw = getText('[data-test="patient-dob"]') ||
      getText('[data-test="age-content"]') ||
      lastObservedContext.dobRaw
    const dob = parseDob(dobRaw)

    // Contact info
    const phone = getText('[data-test="phone-number-content"]') || lastObservedContext.phone
    const email = getText('[data-test="email-content"]') || lastObservedContext.email

    // Address
    const addressRaw = getText('[data-test="address-content"]') ||
      findCalendarCardAddress(patientLink) ||
      lastObservedContext.addressRaw
    // Strip "Address" prefix if present
    const addressClean = addressRaw.replace(/^Address/i, '').trim()
    const address = parseAddress(addressClean)

    // Appointment date/time — try detail section first, then fall back to table column
    const apptTimeRaw = getText('[data-test="appointment-details-section-appointment-time"]') ||
      lastObservedContext.appointmentRaw
    let appt = parseAppointmentDateTime(apptTimeRaw)

    // If detail section didn't work, try the table column for the selected row
    if (!appt.date) {
      const tableAppt = document.querySelector('[data-test^="appointmentDateColumn-"]')
      if (tableAppt?.textContent) {
        appt = parseAppointmentDateTime(tableAppt.textContent.trim())
      }
    }

    // Insurance card images — ZocDoc shows download buttons (data-test="download-button").
    // The images themselves may be behind CORS, so we also try <img> tags as fallback.
    let cardFront = ''
    let cardBack = ''

    // Try direct img src first
    const frontSrc = getImgSrc('[data-test="image-front"]')
    const backSrc = getImgSrc('[data-test="image-back"]')
    if (frontSrc) {
      try { cardFront = await imageToBase64(frontSrc) } catch { /* CORS */ }
    }
    if (backSrc) {
      try { cardBack = await imageToBase64(backSrc) } catch { /* CORS */ }
    }

    // If img approach failed, try download buttons or linked resources nearby.
    if (!cardFront || !cardBack) {
      const downloadBtns = document.querySelectorAll('button[data-test="download-button"]')
      for (const [index, btn] of Array.from(downloadBtns).entries()) {
        const container =
          findCardCaptureRoot(btn.parentElement) ??
          btn.closest('[class*="card"], [class*="image"], [class*="insurance"]') ??
          btn.parentElement
        const isBack = container?.textContent?.toLowerCase().includes('back') ?? index > 0
        const captured = await captureCardFromElement(container)
        if (!captured) continue

        if (isBack && !cardBack) {
          cardBack = captured
        } else if (!cardFront) {
          cardFront = captured
        } else if (!cardBack) {
          cardBack = captured
        }
      }
    }

    // Insurance info — the insurance section shows carrier name in network-status area
    // but detailed insurance fields (member ID, group #) are likely on the intake submission page
    const insuranceRow = getText('[data-test="intake-insurance-row"]')
    const networkStatus = getText('[data-test="network-status"]')
    // Extract carrier name if present (often in the insurance row text)
    const insuranceCompany = extractInsuranceCompany(insuranceRow, networkStatus)

    // Sex
    const sexRaw = getText('[data-test="sex-content"]') || findSexFromLabel() || lastObservedContext.sexRaw
    const sex = sexRaw.replace(/^Sex/i, '').trim()

    const client: CapturedClient = {
      firstName: first,
      lastName: last,
      sex: sex,
      dob: dob,
      phone: phone.replace(/^Phone\s*number/i, '').trim(),
      email: email.replace(/^Email/i, '').trim(),
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
      insuranceCompany: insuranceCompany,
      memberId: '', // Need to get from intake submission details
      groupNumber: '',
      subscriberName: '',
      subscriberRelationship: '',
      copay: '',
      insuranceCardFront: cardFront,
      insuranceCardBack: cardBack,
      appointmentDate: appt.date,
      appointmentTime: appt.time,
      serviceType: '',
      reasonForVisit: '',
      presentingConcerns: '',
      medications: '',
      priorTreatment: '',
      capturedAt: new Date().toISOString(),
      status: { ...DEFAULT_STATUS },
    }

    await saveClient(client)

    const fieldsFound = [
      client.firstName, client.lastName, client.sex, client.dob, client.phone,
      client.email, client.address.street, client.appointmentDate,
      client.appointmentTime, client.insuranceCardFront,
    ].filter(Boolean).length

    showToast(
      `Captured ${client.firstName} ${client.lastName} (${fieldsFound} fields)`,
      'success'
    )

    // Update button to show success
    const btn = document.getElementById('zsp-capture-btn')
    if (btn) {
      btn.textContent = `Captured: ${client.firstName} ${client.lastName}`
      btn.classList.add('zsp-btn-success')
    }

    // Log what we found for debugging
    console.log('[ZSP] Captured client:', {
      name: `${client.firstName} ${client.lastName}`,
      sex: client.sex,
      dob: client.dob,
      phone: client.phone,
      email: client.email,
      address: client.address,
      appointment: `${client.appointmentDate} at ${client.appointmentTime}`,
      hasInsuranceCardFront: !!client.insuranceCardFront,
      hasInsuranceCardBack: !!client.insuranceCardBack,
    })
  } catch (err) {
    console.error('[ZSP] Capture error:', err)
    if (isExtensionContextInvalidatedError(err)) {
      showToast('Extension reloaded. Refresh this ZocDoc tab and try again.', 'error')
      return
    }
    showToast('Error capturing client data. Check console for details.', 'error')
  }
}

function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      snapshotVisiblePatientContext()
      inject()
      watchPatientContext()
    })
  } else {
    snapshotVisiblePatientContext()
    inject()
    watchPatientContext()
  }
}

function inject() {
  injectButton('Capture Client', captureClient, { id: 'zsp-capture-btn', position: 'bottom-right-high' })
}

function watchPatientContext(): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      snapshotVisiblePatientContext()
    }, 150)
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

init()
registerFloatingButtonsController(() => {
  inject()
})
