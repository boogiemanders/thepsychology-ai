import { CapturedClient } from '../lib/types'
import { getClient, updateStatus } from '../lib/storage'
import { openVobEmail } from '../lib/vob-email'
import { injectButton, showToast, fillField, selectOptionByText } from './shared'

/**
 * SimplePractice form field selectors — mapped from actual SP DOM.
 * SP uses Ember.js with name-based inputs.
 */

function tryFill(selectors: string[], value: string): boolean {
  if (!value) return false
  for (const sel of selectors) {
    if (fillField(sel, value)) return true
  }
  return false
}

function trySelect(selectors: string[], text: string): boolean {
  if (!text) return false
  for (const sel of selectors) {
    if (selectOptionByText(sel, text)) return true
  }
  return false
}

/**
 * Parse DOB "09/09/2000" or "MM/DD/YYYY" into month/day/year for SP's 3 selects.
 */
function parseDobParts(dob: string): { month: string; day: string; year: string } {
  // Try MM/DD/YYYY
  const match = dob.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) {
    return { month: match[1], day: match[2], year: match[3] }
  }
  // Try YYYY-MM-DD
  const isoMatch = dob.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    return { month: isoMatch[2], day: isoMatch[3], year: isoMatch[1] }
  }
  return { month: '', day: '', year: '' }
}

/**
 * Fill the DOB selects in SP (month, day, year are separate <select> elements).
 */
function fillDob(dob: string): number {
  const { month, day, year } = parseDobParts(dob)
  if (!month) return 0

  let filled = 0

  // Month select — value might be "1" through "12" or "01" through "12"
  const monthSelect = document.querySelector('select[name="month"]') as HTMLSelectElement
  if (monthSelect) {
    const monthNum = parseInt(month, 10).toString()
    // Try exact match first, then padded
    for (const option of Array.from(monthSelect.options)) {
      if (option.value === monthNum || option.value === month ||
          option.text.toLowerCase().includes(getMonthName(parseInt(month, 10)))) {
        monthSelect.value = option.value
        monthSelect.dispatchEvent(new Event('change', { bubbles: true }))
        filled++
        break
      }
    }
  }

  // Day select
  const daySelect = document.querySelector('select[name="day"]') as HTMLSelectElement
  if (daySelect) {
    const dayNum = parseInt(day, 10).toString()
    for (const option of Array.from(daySelect.options)) {
      if (option.value === dayNum || option.value === day) {
        daySelect.value = option.value
        daySelect.dispatchEvent(new Event('change', { bubbles: true }))
        filled++
        break
      }
    }
  }

  // Year select
  const yearSelect = document.querySelector('select[name="year"]') as HTMLSelectElement
  if (yearSelect) {
    for (const option of Array.from(yearSelect.options)) {
      if (option.value === year) {
        yearSelect.value = option.value
        yearSelect.dispatchEvent(new Event('change', { bubbles: true }))
        filled++
        break
      }
    }
  }

  return filled
}

function getMonthName(num: number): string {
  const names = ['', 'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december']
  return names[num] || ''
}

async function fillClientDemographics(): Promise<void> {
  const client = await getClient().catch((err: unknown) => {
    console.error('[ZSP] fillClientDemographics error:', err)
    showToast('Extension reloaded — please refresh this page.', 'error')
    return null
  })
  if (!client) {
    showToast('No captured client. Capture from ZocDoc first.', 'error')
    return
  }

  let filled = 0

  // First name
  if (tryFill(['input[name="firstName"]'], client.firstName)) filled++

  // Last name
  if (tryFill(['input[name="lastName"]'], client.lastName)) filled++

  // DOB — three separate selects
  filled += fillDob(client.dob)

  // Email — may need to click "Add email" button first to reveal the input
  if (client.email) {
    const addEmailBtn = Array.from(document.querySelectorAll('button.add-row-button'))
      .find(btn => btn.textContent?.trim().includes('Add email')) as HTMLElement | undefined
    if (addEmailBtn) {
      addEmailBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }
    if (tryFill(['input[name="email"]', 'input[type="email"]', 'input[placeholder*="Email"]'], client.email)) filled++
  }

  // Phone — may need to click "Add phone" button first
  if (client.phone) {
    const addPhoneBtn = Array.from(document.querySelectorAll('button.add-row-button'))
      .find(btn => btn.textContent?.trim().includes('Add phone')) as HTMLElement | undefined
    if (addPhoneBtn) {
      addPhoneBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }
    if (tryFill(['input[name="phone"]', 'input[type="tel"]', 'input[placeholder*="Phone"]'], client.phone)) filled++
  }

  // Select "Insurance" billing type (radio button) — individual and group
  const insuranceRadio = document.querySelector('input[name="billingType"][value="Insurance"]') as HTMLInputElement
  if (insuranceRadio && !insuranceRadio.checked) {
    insuranceRadio.click()
    filled++
  }
  const groupInsuranceRadio = document.querySelector('input[name="billingTypeGroupAppt"][value="Insurance"]') as HTMLInputElement
  if (groupInsuranceRadio && !groupInsuranceRadio.checked) {
    groupInsuranceRadio.click()
    filled++
  }

  // Set status to "Active" — SP uses Ember dropdown (spds-input-dropdown-list)
  // Find the trigger button whose text says "Select" (the status dropdown)
  const dropdownTriggers = document.querySelectorAll('.spds-input-dropdown-list-trigger')
  for (const trigger of Array.from(dropdownTriggers)) {
    const textEl = trigger.querySelector('.spds-input-dropdown-list-trigger-text-container')
    if (textEl?.textContent?.trim() === 'Select' || textEl?.textContent?.trim() === '') {
      // Click to open the dropdown
      ;(trigger as HTMLElement).click()
      // Wait for menu to appear, then click "Active"
      await new Promise(r => setTimeout(r, 200))
      const menuId = trigger.getAttribute('aria-controls')
      const menu = menuId ? document.getElementById(menuId) : null
      if (menu) {
        const options = menu.querySelectorAll('[role="option"], li, button')
        for (const opt of Array.from(options)) {
          if (opt.textContent?.trim().toLowerCase() === 'active') {
            ;(opt as HTMLElement).click()
            filled++
            break
          }
        }
      }
      break
    }
  }

  // Set primary clinician to "Anders Chan"
  const clinicianSelect = document.querySelector('select[name="clinician"], select#new-client-clinician') as HTMLSelectElement
  if (clinicianSelect) {
    for (const option of Array.from(clinicianSelect.options)) {
      if (option.text.includes('Anders') || option.text.includes('Chan')) {
        clinicianSelect.value = option.value
        clinicianSelect.dispatchEvent(new Event('change', { bubbles: true }))
        filled++
        break
      }
    }
  }

  // Turn on reminder notifications — find toggle switches and enable them
  const toggleSwitches = document.querySelectorAll('input[type="checkbox"][id*="toggle-switch"]') as NodeListOf<HTMLInputElement>
  toggleSwitches.forEach((toggle) => {
    if (!toggle.checked) {
      toggle.click()
      filled++
    }
  })

  await updateStatus({ clientCreated: true })
  showToast(`Filled ${filled} fields for ${client.firstName} ${client.lastName}`, 'success')

  console.log('[ZSP] Filled client demographics:', { filled, firstName: client.firstName, lastName: client.lastName })
}

async function fillInsurance(): Promise<void> {
  const client = await getClient()
  if (!client) {
    showToast('No captured client. Capture from ZocDoc first.', 'error')
    return
  }

  let filled = 0

  if (tryFill(['input[name="insurance_company"]', 'input[name*="payer"]', 'input[placeholder*="Insurance"]'], client.insuranceCompany)) filled++
  if (tryFill(['input[name="member_id"]', 'input[name*="member"]', 'input[placeholder*="Member"]'], client.memberId)) filled++
  if (tryFill(['input[name="group_number"]', 'input[name*="group"]', 'input[placeholder*="Group"]'], client.groupNumber)) filled++
  if (tryFill(['input[name="subscriber_name"]', 'input[name*="insured"]', 'input[placeholder*="Subscriber"]'], client.subscriberName)) filled++
  if (tryFill(['input[name="copay"]', 'input[name*="copay"]', 'input[placeholder*="Copay"]'], client.copay)) filled++

  await updateStatus({ insuranceAdded: true })
  showToast(`Filled ${filled} insurance fields`, 'success')
}

async function fillAppointment(): Promise<void> {
  const client = await getClient()
  if (!client) {
    showToast('No captured client. Capture from ZocDoc first.', 'error')
    return
  }

  let filled = 0

  // Date — input[name="startDate"]
  if (client.appointmentDate) {
    if (tryFill(['input[name="startDate"]', 'input[name="date"]'], client.appointmentDate)) filled++
  }

  // Time — input[name="startTime"] (text input, e.g. "1:00 PM")
  if (client.appointmentTime) {
    if (tryFill(['input[name="startTime"]', 'input[name="time"]'], client.appointmentTime)) filled++
  }

  // Location — typeahead with class "typeahead-label", set to "Video Office"
  // Click the current location label to open the typeahead, then find and click "Video Office"
  const locationLabel = document.querySelector('.typeahead-label') as HTMLElement
  if (locationLabel) {
    locationLabel.click()
    await new Promise(r => setTimeout(r, 300))
    // Look for a typeahead input that appeared
    const typeaheadInput = document.querySelector('.ember-power-select-search-input, input[placeholder*="location" i], input[placeholder*="search" i]') as HTMLInputElement
    if (typeaheadInput) {
      fillField('input.ember-power-select-search-input, input[placeholder*="location" i], input[placeholder*="search" i]', 'Video')
      await new Promise(r => setTimeout(r, 500))
      // Click the matching option
      const options = document.querySelectorAll('.ember-power-select-option, [role="option"]')
      for (const opt of Array.from(options)) {
        if (opt.textContent?.trim().toLowerCase().includes('video office')) {
          ;(opt as HTMLElement).click()
          filled++
          break
        }
      }
    }
  }

  // CPT code — native <select name="code">, set to 90791
  const codeSelect = document.querySelector('select[name="code"]') as HTMLSelectElement
  if (codeSelect) {
    codeSelect.value = '90791'
    codeSelect.dispatchEvent(new Event('change', { bubbles: true }))
    filled++
  }

  // Notes
  const notes = [
    client.reasonForVisit,
    client.presentingConcerns ? `Presenting concerns: ${client.presentingConcerns}` : '',
    client.medications ? `Medications: ${client.medications}` : '',
    client.priorTreatment ? `Prior treatment: ${client.priorTreatment}` : '',
  ].filter(Boolean).join('\n')

  if (notes && tryFill(['textarea[name*="note"]', 'textarea[name*="reason"]'], notes)) filled++

  await updateStatus({ appointmentSet: true })
  showToast(`Filled ${filled} appointment fields`, 'success')
}

async function sendVobEmail(): Promise<void> {
  try {
    const client = await getClient()
    if (!client) {
      showToast('No captured client. Capture from ZocDoc first.', 'error')
      return
    }

    openVobEmail(client)
    await updateStatus({ vobEmailSent: true })
    showToast('VOB email opened in Gmail', 'success')
  } catch (err) {
    console.error('[ZSP] sendVobEmail error:', err)
    showToast('Extension reloaded — please refresh this page.', 'error')
  }
}

/**
 * Inject a fill button directly next to the firstName input inside the form.
 * This avoids floating buttons that interfere with SP's overlay/sidebar behavior.
 */
function injectInlineButton(
  label: string,
  onClick: () => void,
  anchorSelector: string,
  id: string
): void {
  // Remove existing
  const existing = document.getElementById(id)
  if (existing) existing.remove()

  const anchor = document.querySelector(anchorSelector)
  if (!anchor) return

  const btn = document.createElement('button')
  btn.id = id
  btn.textContent = label
  btn.type = 'button' // Prevent form submission
  btn.style.cssText = 'margin:8px 0;padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,sans-serif;'
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()
    onClick()
  }, true)

  // Insert before the anchor element's parent (to appear above the name field)
  const parent = anchor.closest('.input-module_component__0r299')?.parentElement ||
    anchor.parentElement
  if (parent) {
    parent.insertBefore(btn, parent.firstChild)
  } else {
    anchor.parentElement?.insertBefore(btn, anchor)
  }
}

/**
 * Detect the create client form and inject fill button inline.
 */
function detectAndInject(): void {
  const firstNameInput = document.querySelector('input[name="firstName"]')

  if (firstNameInput) {
    // Inject inline button near the form fields
    injectInlineButton(
      'Fill from ZocDoc',
      fillClientDemographics,
      'input[name="firstName"]',
      'zsp-fill-btn'
    )
  }

  // Appointment form — detect by startTime input or CPT code select
  const apptForm = document.querySelector('input[name="startTime"], select[name="code"]')
  if (apptForm && !document.getElementById('zsp-appt-btn')) {
    injectButton('Fill Appointment from ZocDoc', fillAppointment, { id: 'zsp-appt-btn', position: 'bottom-left-high' })
  }

  // Always have a floating VOB button available
  injectButton('Send VOB Email', sendVobEmail, { id: 'zsp-vob-btn', position: 'bottom-left' })
}

// Watch for DOM changes — SP is an Ember SPA, forms appear/disappear dynamically
function watchForForms(): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      // Check if we need to inject (form appeared) or clean up (form disappeared)
      const hasClientForm = !!document.querySelector('input[name="firstName"]')
      const hasClientBtn = !!document.getElementById('zsp-fill-btn')
      const hasApptForm = !!document.querySelector('input[name="startTime"], select[name="code"]')
      const hasApptBtn = !!document.getElementById('zsp-appt-btn')
      if ((hasClientForm && !hasClientBtn) || (hasApptForm && !hasApptBtn)) {
        detectAndInject()
      }
    }, 500)
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

function init(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      detectAndInject()
      watchForForms()
    })
  } else {
    detectAndInject()
    watchForForms()
  }
}

init()
