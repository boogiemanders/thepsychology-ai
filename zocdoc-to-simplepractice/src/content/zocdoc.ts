import { CapturedClient, DEFAULT_STATUS } from '../lib/types'
import { saveClient } from '../lib/storage'
import { injectButton, showToast, imageToBase64 } from './shared'

/**
 * ZocDoc provider portal selectors — mapped from actual DOM data-test attributes.
 * The detail panel (appointment flyout) must be open for most fields to be available.
 */

function getText(selector: string): string {
  const el = document.querySelector(selector)
  return el?.textContent?.trim() ?? ''
}

function getImgSrc(selector: string): string {
  const el = document.querySelector(selector)
  // Could be an img inside the container, or the element itself
  const img = el?.querySelector('img') ?? (el instanceof HTMLImageElement ? el : null)
  return img?.src ?? ''
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
    return { date: datePart, time: atMatch[2].trim() }
  }

  return { date: cleaned, time: '' }
}

async function captureClient(): Promise<void> {
  try {
    // Get patient name from the detail panel header or record link
    const fullName = getText('[data-test="patient-record-header"]') ||
      getText('[data-test="patient-record-link"]')
    const { first, last } = parseName(fullName)

    if (!first && !last) {
      showToast('No client selected. Click a patient row first to open their details.', 'error')
      return
    }

    // DOB — from detail panel or flyout
    const dobRaw = getText('[data-test="patient-dob"]') ||
      getText('[data-test="age-content"]')
    const dob = parseDob(dobRaw)

    // Contact info
    const phone = getText('[data-test="phone-number-content"]')
    const email = getText('[data-test="email-content"]')

    // Address
    const addressRaw = getText('[data-test="address-content"]')
    // Strip "Address" prefix if present
    const addressClean = addressRaw.replace(/^Address/i, '').trim()
    const address = parseAddress(addressClean)

    // Appointment date/time — try detail section first, then fall back to table column
    const apptTimeRaw = getText('[data-test="appointment-details-section-appointment-time"]')
    let appt = parseAppointmentDateTime(apptTimeRaw)

    // If detail section didn't work, try the table column for the selected row
    if (!appt.date) {
      const tableAppt = document.querySelector('[data-test^="appointmentDateColumn-"]')
      if (tableAppt?.textContent) {
        appt = parseAppointmentDateTime(tableAppt.textContent.trim())
      }
    }

    // Insurance card images
    let cardFront = ''
    let cardBack = ''
    const frontSrc = getImgSrc('[data-test="image-front"]')
    const backSrc = getImgSrc('[data-test="image-back"]')
    if (frontSrc) {
      try { cardFront = await imageToBase64(frontSrc) } catch { /* CORS */ }
    }
    if (backSrc) {
      try { cardBack = await imageToBase64(backSrc) } catch { /* CORS */ }
    }

    // Insurance info — the insurance section shows carrier name in network-status area
    // but detailed insurance fields (member ID, group #) are likely on the intake submission page
    const insuranceRow = getText('[data-test="intake-insurance-row"]')
    const networkStatus = getText('[data-test="network-status"]')
    // Extract carrier name if present (often in the insurance row text)
    let insuranceCompany = ''
    if (networkStatus) {
      // "insurance shield in network iconIn-network" — not the carrier name
      // The carrier might be in a view-details page. For now capture what's visible.
      insuranceCompany = networkStatus
        .replace(/insurance shield.*?icon/gi, '')
        .replace(/In-network|Out-of-network/gi, '')
        .trim()
    }

    // Sex
    const sexRaw = getText('[data-test="sex-content"]')
    const sex = sexRaw.replace(/^Sex/i, '').trim()

    const client: CapturedClient = {
      firstName: first,
      lastName: last,
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
      client.firstName, client.lastName, client.dob, client.phone,
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
    showToast('Error capturing client data. Check console for details.', 'error')
  }
}

function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject)
  } else {
    inject()
  }
}

function inject() {
  injectButton('Capture Client', captureClient, { id: 'zsp-capture-btn' })
}

init()
