import { CapturedClient, ProviderPreferences } from '../lib/types'
import { getClient, updateStatus, getPreferences } from '../lib/storage'
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

/**
 * Find and click the "Referred by" dropdown, then select "Zoc Doc".
 * SP's referral source is an Ember select-box. We identify it by:
 * 1. Finding a label/text containing "Referred by"
 * 2. Finding the sibling or descendant typeahead trigger
 * 3. Opening the dropdown and selecting the "Zoc Doc" option
 */
/**
 * Fill "Referred by" with "Zoc Doc".
 * The actual DOM is: div.select-box__selected-option.typeahead-trigger with a
 * span.placeholder "Select" inside. Clicking it opens options with role="option".
 */
async function fillReferredBy(): Promise<boolean> {
  // Target the exact Ember select-box trigger for "Referred by"
  // It's a .select-box__selected-option.typeahead-trigger with placeholder "Select"
  let targetTrigger: HTMLElement | null = null

  // Strategy 1: Find by label text "Referred by" and get its sibling trigger
  const allLabels = document.querySelectorAll('label, .form-label, .field-label, .spds-label, [class*="label"]')
  for (const label of Array.from(allLabels)) {
    if (label.textContent?.trim().toLowerCase().includes('referred by')) {
      const parent = label.closest('.form-group, .field-wrapper, [class*="field"], [class*="row"]') || label.parentElement
      if (parent) {
        targetTrigger = parent.querySelector('.select-box__selected-option.typeahead-trigger, .typeahead-trigger') as HTMLElement
      }
      break
    }
  }

  // Strategy 2: Find all select-box__selected-option.typeahead-trigger elements
  // with placeholder "Select" — skip ones for clinician/office (those have name-based selects)
  if (!targetTrigger) {
    const triggers = document.querySelectorAll('.select-box__selected-option.typeahead-trigger')
    for (const trigger of Array.from(triggers)) {
      const placeholder = trigger.querySelector('.placeholder')
      if (placeholder?.textContent?.trim() === 'Select') {
        targetTrigger = trigger as HTMLElement
        break
      }
    }
  }

  if (!targetTrigger) {
    console.log('[ZSP] Referred by trigger not found')
    return false
  }

  targetTrigger.click()
  await new Promise(r => setTimeout(r, 400))

  // Look for "Zoc Doc" in the dropdown options
  const options = document.querySelectorAll('.select-box__option[role="option"], .ember-power-select-option, [role="option"]')
  for (const opt of Array.from(options)) {
    const text = opt.textContent?.trim().toLowerCase() ?? ''
    if (text.includes('zoc doc') || text.includes('zocdoc') || text === 'zoc doc') {
      ;(opt as HTMLElement).click()
      console.log('[ZSP] Set Referred by to Zoc Doc')
      return true
    }
  }

  console.log('[ZSP] "Zoc Doc" option not found in referral dropdown')
  return false
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
  // Ember uses aria-checked, so click the parent label to ensure state updates
  const insuranceRadio = document.querySelector('input[name="billingType"][value="Insurance"]') as HTMLInputElement
  if (insuranceRadio) {
    const label = insuranceRadio.closest('label')
    if (label) { label.click() } else { insuranceRadio.click() }
    filled++
  }
  const groupInsuranceRadio = document.querySelector('input[name="billingTypeGroupAppt"][value="Insurance"]') as HTMLInputElement
  if (groupInsuranceRadio) {
    const label = groupInsuranceRadio.closest('label')
    if (label) { label.click() } else { groupInsuranceRadio.click() }
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

  // Set primary clinician from preferences
  const prefs = await getPreferences()
  const clinicianSelect = document.querySelector('select[name="clinician"], select#new-client-clinician') as HTMLSelectElement
  if (clinicianSelect) {
    for (const option of Array.from(clinicianSelect.options)) {
      if (option.text.includes(prefs.providerFirstName) || option.text.includes(prefs.providerLastName)) {
        clinicianSelect.value = option.value
        clinicianSelect.dispatchEvent(new Event('change', { bubbles: true }))
        filled++
        break
      }
    }
  }

  // Referred by — Ember select-box, find the referral source field specifically.
  // SP labels the field "Referred by" — look for a label or section heading first,
  // then find the adjacent typeahead/select trigger.
  const referralFilled = await fillReferredBy()
  if (referralFilled) filled++

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

/**
 * Fill the payer/insurance company via SP's typeahead select-box.
 * The search input may not exist until the trigger is clicked.
 */
async function fillPayerTypeahead(insuranceCompany: string): Promise<number> {
  // Try to find an existing search input first
  let payerInput = document.querySelector('.select-box__input[role="searchbox"], input[placeholder*="payer" i], input[placeholder*="insurance" i]') as HTMLInputElement

  // If not found, look for the payer trigger and click it to reveal the search
  if (!payerInput) {
    // Find the payer section by label
    const labels = document.querySelectorAll('label, .form-label, .spds-label, [class*="label"]')
    for (const label of Array.from(labels)) {
      const text = label.textContent?.trim().toLowerCase() ?? ''
      if (text.includes('payer') || text.includes('insurance company') || text.includes('insurance plan')) {
        const parent = label.closest('.form-group, .field-wrapper, [class*="field"], [class*="row"]') || label.parentElement
        const trigger = parent?.querySelector('.select-box__trigger, .typeahead-trigger, .ember-power-select-trigger, [role="combobox"]') as HTMLElement
        if (trigger) {
          trigger.click()
          await new Promise(r => setTimeout(r, 400))
          payerInput = document.querySelector('.select-box__input[role="searchbox"], .ember-power-select-search-input, input[role="searchbox"]') as HTMLInputElement
          break
        }
      }
    }
  }

  // Still no input — try clicking any select-box trigger on the insurance page
  if (!payerInput) {
    const trigger = document.querySelector('.select-box__trigger, .ember-power-select-trigger') as HTMLElement
    if (trigger) {
      trigger.click()
      await new Promise(r => setTimeout(r, 400))
      payerInput = document.querySelector('.select-box__input[role="searchbox"], .ember-power-select-search-input') as HTMLInputElement
    }
  }

  if (!payerInput) {
    // Last fallback — standard input
    if (tryFill(['input[name="insurance_company"]', 'input[name*="payer"]'], insuranceCompany)) return 1
    console.log('[ZSP] Payer typeahead input not found')
    return 0
  }

  // Type the insurance company name
  payerInput.focus()
  fillField('.select-box__input[role="searchbox"], .ember-power-select-search-input, input[role="searchbox"]', insuranceCompany)
  await new Promise(r => setTimeout(r, 1000)) // Wait for typeahead results

  // Select the best matching option
  const options = document.querySelectorAll('.ember-power-select-option, .select-kit-row, .select-box__option, [role="option"]')
  const lowerCompany = insuranceCompany.toLowerCase()
  let bestMatch: HTMLElement | null = null

  for (const opt of Array.from(options)) {
    const text = opt.textContent?.trim().toLowerCase() ?? ''
    if (text === lowerCompany) {
      // Exact match — use immediately
      ;(opt as HTMLElement).click()
      console.log('[ZSP] Payer selected (exact):', text)
      return 1
    }
    if (text.includes(lowerCompany) && text.length < (bestMatch?.textContent?.length ?? Infinity)) {
      bestMatch = opt as HTMLElement
    }
  }

  if (bestMatch) {
    bestMatch.click()
    console.log('[ZSP] Payer selected (partial):', bestMatch.textContent?.trim())
    return 1
  }

  // If no match, just pick the first option (often the closest match)
  const firstOption = options[0] as HTMLElement
  if (firstOption) {
    firstOption.click()
    console.log('[ZSP] Payer selected (first option):', firstOption.textContent?.trim())
    return 1
  }

  console.log('[ZSP] No payer options found for:', insuranceCompany)
  return 0
}

async function fillInsurance(): Promise<void> {
  const client = await getClient()
  if (!client) {
    showToast('No captured client. Capture from ZocDoc first.', 'error')
    return
  }

  let filled = 0

  // Payer/insurance company — typeahead search box.
  // SP's payer field is an Ember select-box. We may need to click the trigger first
  // to reveal the search input.
  if (client.insuranceCompany) {
    filled += await fillPayerTypeahead(client.insuranceCompany)
  }

  // Member ID — SP uses input#memberId or input near a "Member ID" label
  if (tryFill([
    'input#memberId', 'input[name="memberId"]', 'input[name="member_id"]',
    'input[name*="member" i]', 'input[placeholder*="Member" i]'
  ], client.memberId)) filled++

  // Group number
  if (tryFill([
    'input[name="groupNumber"]', 'input[name="group_number"]', 'input#groupNumber',
    'input[name*="group" i]', 'input[placeholder*="Group" i]'
  ], client.groupNumber)) filled++

  // Subscriber name
  if (tryFill([
    'input[name="subscriberName"]', 'input[name="subscriber_name"]',
    'input[name*="subscriber" i]', 'input[name*="insured" i]', 'input[placeholder*="Subscriber" i]'
  ], client.subscriberName)) filled++

  // Copay
  if (tryFill([
    'input[name="copay"]', 'input#copay',
    'input[name*="copay" i]', 'input[placeholder*="Copay" i]'
  ], client.copay)) filled++

  // Insurance card images — upload via file input if we have base64 data
  if (client.insuranceCardFront) {
    filled += await uploadInsuranceCard(client.insuranceCardFront, 'front')
  }
  if (client.insuranceCardBack) {
    filled += await uploadInsuranceCard(client.insuranceCardBack, 'back')
  }

  await updateStatus({ insuranceAdded: true })
  showToast(`Filled ${filled} insurance fields`, 'success')
}

async function uploadInsuranceCard(base64Data: string, side: 'front' | 'back'): Promise<number> {
  try {
    // Find the dropzone for front or back card
    const dropzones = document.querySelectorAll('.dropzone-inner')
    let targetInput: HTMLInputElement | null = null
    for (const dz of Array.from(dropzones)) {
      const heading = dz.querySelector('h5')
      if (side === 'back' && heading?.textContent?.toLowerCase().includes('back')) {
        targetInput = dz.querySelector('input[type="file"]')
        break
      }
      if (side === 'front' && (!heading || !heading.textContent?.toLowerCase().includes('back'))) {
        targetInput = dz.querySelector('input[type="file"]')
        break
      }
    }

    if (!targetInput || !base64Data) return 0

    // Convert base64 data URL to File object
    const response = await fetch(base64Data)
    const blob = await response.blob()
    const file = new File([blob], `insurance-card-${side}.png`, { type: 'image/png' })

    // Create a DataTransfer to set files on the input
    const dt = new DataTransfer()
    dt.items.add(file)
    targetInput.files = dt.files
    targetInput.dispatchEvent(new Event('change', { bubbles: true }))

    console.log(`[ZSP] Uploaded insurance card ${side}`)
    return 1
  } catch (err) {
    console.error(`[ZSP] Failed to upload insurance card ${side}:`, err)
    return 0
  }
}

async function fillAppointment(): Promise<void> {
  const client = await getClient()
  if (!client) {
    showToast('No captured client. Capture from ZocDoc first.', 'error')
    return
  }

  let filled = 0

  // Client name — typeahead search box
  const clientName = `${client.firstName} ${client.lastName}`.trim()
  if (clientName) {
    const typeaheadTrigger = document.querySelector('.typeahead-trigger') as HTMLElement
    if (typeaheadTrigger) {
      typeaheadTrigger.click()
      await new Promise(r => setTimeout(r, 300))
      // Find the search input that appears
      const searchInput = document.querySelector('.ember-power-select-search-input, .select-kit-filter input, input[placeholder*="Search"]') as HTMLInputElement
      if (searchInput) {
        fillField('.ember-power-select-search-input, .select-kit-filter input, input[placeholder*="Search"]', client.lastName)
        await new Promise(r => setTimeout(r, 800))
        // Click the first matching option
        const options = document.querySelectorAll('.ember-power-select-option, .select-kit-row, [role="option"]')
        for (const opt of Array.from(options)) {
          const text = opt.textContent?.trim().toLowerCase() ?? ''
          if (text.includes(client.lastName.toLowerCase()) || text.includes(client.firstName.toLowerCase())) {
            ;(opt as HTMLElement).click()
            filled++
            break
          }
        }
      }
    }
  }

  // Date — input[name="startDate"]
  if (client.appointmentDate) {
    if (tryFill(['input[name="startDate"]', 'input[name="date"]'], client.appointmentDate)) filled++
  }

  // Time — input[name="startTime"] (text input, e.g. "1:00 PM")
  if (client.appointmentTime) {
    if (tryFill(['input[name="startTime"]', 'input[name="time"]'], client.appointmentTime)) filled++
  }

  // Location/Office — native <select id="new-client-office" name="office">
  const prefs = await getPreferences()
  const officeSelect = document.querySelector('select#new-client-office, select[name="office"]') as HTMLSelectElement
  if (officeSelect && prefs.defaultLocation) {
    for (const option of Array.from(officeSelect.options)) {
      if (option.text.trim().toLowerCase() === prefs.defaultLocation.toLowerCase()) {
        officeSelect.value = option.value
        officeSelect.dispatchEvent(new Event('change', { bubbles: true }))
        filled++
        break
      }
    }
  }

  // CPT code — native <select name="code">, use first-visit CPT from preferences
  const codeSelect = document.querySelector('select[name="code"]') as HTMLSelectElement
  if (codeSelect && prefs.firstVisitCPT) {
    codeSelect.value = prefs.firstVisitCPT
    codeSelect.dispatchEvent(new Event('change', { bubbles: true }))
    filled++
  }

  // Recurring appointment — toggle on, set weekly with follow-up CPT
  filled += await setupRecurringAppointment(prefs)

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

async function setupRecurringAppointment(prefs: ProviderPreferences): Promise<number> {
  let filled = 0

  // Find recurring toggle — try multiple selectors since SP may use different names
  const recurringToggle = document.querySelector(
    'input#recurring-toggle, input[name="recurringToggle"], input[name="recurring"], input[type="checkbox"][id*="recurring"]'
  ) as HTMLInputElement

  if (!recurringToggle) {
    // Also try a toggle switch component (Ember-style)
    const toggleLabel = Array.from(document.querySelectorAll('label, .toggle-label, [class*="toggle"]'))
      .find(el => el.textContent?.trim().toLowerCase().includes('recurring'))
    if (toggleLabel) {
      ;(toggleLabel as HTMLElement).click()
      filled++
      await new Promise(r => setTimeout(r, 600))
    } else {
      console.log('[ZSP] Recurring toggle not found')
      return 0
    }
  } else if (!recurringToggle.checked) {
    // Click the label if available (Ember toggles often need label click)
    const label = recurringToggle.closest('label') || document.querySelector(`label[for="${recurringToggle.id}"]`)
    if (label) {
      ;(label as HTMLElement).click()
    } else {
      recurringToggle.click()
    }
    filled++
    await new Promise(r => setTimeout(r, 600))
  }

  // After toggling, SP may render additional fields for the recurring series.
  // Look for a separate code select for recurring appointments first, then fall back
  // to all code selects on the page.
  if (prefs.followUpCPT) {
    const allCodeSelects = document.querySelectorAll('select[name="code"], select[name="recurringCode"], select[name="recurring_code"], select[name*="cpt" i]')
    // If there are 2+ code selects, the second one is likely the recurring code
    const targetSelect = allCodeSelects.length > 1
      ? allCodeSelects[allCodeSelects.length - 1] as HTMLSelectElement
      : allCodeSelects[0] as HTMLSelectElement

    if (targetSelect) {
      for (const option of Array.from(targetSelect.options)) {
        if (option.value === prefs.followUpCPT || option.text.includes(prefs.followUpCPT)) {
          targetSelect.value = option.value
          targetSelect.dispatchEvent(new Event('change', { bubbles: true }))
          filled++
          break
        }
      }
    }
  }

  // Set frequency to weekly if available
  const freqSelect = document.querySelector('select[name="frequency"], select[name="recurrenceFrequency"], select[name*="repeat" i]') as HTMLSelectElement
  if (freqSelect) {
    for (const option of Array.from(freqSelect.options)) {
      if (option.text.toLowerCase().includes('week')) {
        freqSelect.value = option.value
        freqSelect.dispatchEvent(new Event('change', { bubbles: true }))
        filled++
        break
      }
    }
  }

  console.log('[ZSP] Recurring appointment setup:', { filled })
  return filled
}

async function sendVobEmail(): Promise<void> {
  try {
    const client = await getClient()
    if (!client) {
      showToast('No captured client. Capture from ZocDoc first.', 'error')
      return
    }

    await openVobEmail(client)
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

  // Insurance form — detect by member ID input, payer select, or dropzone for card uploads
  const insuranceForm = document.querySelector('input[name="memberId"], input[name*="member"], .dropzone-inner, .select-box__input[role="searchbox"]')
  if (insuranceForm && !document.getElementById('zsp-insurance-btn')) {
    injectButton('Fill Insurance from ZocDoc', fillInsurance, { id: 'zsp-insurance-btn', position: 'bottom-left-high' })
  }

  // Appointment form — detect by startTime input or CPT code select
  const apptForm = document.querySelector('input[name="startTime"], select[name="code"]')
  if (apptForm && !document.getElementById('zsp-appt-btn')) {
    injectButton('Fill Appointment from ZocDoc', fillAppointment, { id: 'zsp-appt-btn', position: 'bottom-left-higher' })
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
      const hasInsuranceForm = !!document.querySelector('input[name="memberId"], input[name*="member"], .dropzone-inner')
      const hasInsuranceBtn = !!document.getElementById('zsp-insurance-btn')
      const hasApptForm = !!document.querySelector('input[name="startTime"], select[name="code"]')
      const hasApptBtn = !!document.getElementById('zsp-appt-btn')
      if ((hasClientForm && !hasClientBtn) || (hasInsuranceForm && !hasInsuranceBtn) || (hasApptForm && !hasApptBtn)) {
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
