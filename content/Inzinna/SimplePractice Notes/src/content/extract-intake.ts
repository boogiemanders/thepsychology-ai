/**
 * SimplePractice Notes — Intake Data Extractor
 *
 * Extracts patient intake data from SimplePractice's client profile
 * and intake/assessment pages. Injects a "Capture Intake" button
 * when on a client page.
 *
 * SimplePractice URL patterns:
 *   Client overview:  /clients/{id}/overview
 *   Client details:   /clients/{id}/details
 *   Intake forms:     /clients/{id}/intake
 *   Documents:        /clients/{id}/documents
 */

import { IntakeData, EMPTY_INTAKE } from '../lib/types'
import { saveIntake, getIntake } from '../lib/storage'
import {
  injectButton,
  showToast,
  assertExtensionContext,
  isExtensionContextInvalidatedError,
  textFrom,
  valueFrom,
  normalizedText,
  isVisible,
  findFieldContainer,
  findFieldElement,
  wait,
} from './shared'

// ── URL Detection ──

function getClientIdFromUrl(): string {
  const match = window.location.pathname.match(/\/clients\/(\d+)/)
  return match?.[1] ?? ''
}

function isClientPage(): boolean {
  return /\/clients\/\d+/.test(window.location.pathname)
}

// ── Extraction Helpers ──

/**
 * Extract text from the first matching selector or label.
 * Tries multiple strategies: direct selector, label-based lookup, aria attributes.
 */
function extractBySelectors(selectors: string[]): string {
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (!el) continue
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      if (el.value.trim()) return el.value.trim()
    }
    if (el.textContent?.trim()) return el.textContent.trim()
  }
  return ''
}

/**
 * Extract value from a field identified by its label text.
 * SP uses various patterns: label + input, label + span, label + div.
 */
function extractByLabel(labelText: string): string {
  const container = findFieldContainer(labelText)
  if (!container) return ''

  // Try input/textarea first
  const input = container.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null
  if (input?.value?.trim()) return input.value.trim()

  // Try span/div with value content (not the label itself)
  const target = normalizedText(labelText)
  for (const child of Array.from(container.children)) {
    const text = child.textContent?.trim() ?? ''
    if (text && !normalizedText(text).includes(target)) {
      return text
    }
  }

  // Try the next sibling of the label
  const labels = container.querySelectorAll('label, .form-label, .field-label, .spds-label')
  for (const label of Array.from(labels)) {
    if (!normalizedText(label.textContent).includes(target)) continue
    const sibling = label.nextElementSibling
    if (sibling?.textContent?.trim()) return sibling.textContent.trim()
  }

  return ''
}

/**
 * Extract text content from elements matching a section heading,
 * grabbing the content that follows it.
 */
function extractSectionContent(sectionHeading: string): string {
  const target = normalizedText(sectionHeading)

  // Look for headings (h1-h6, strong, .section-title, etc.)
  const headings = document.querySelectorAll(
    'h1, h2, h3, h4, h5, h6, strong, .section-title, .section-heading, [class*="heading"], [class*="title"]'
  )

  for (const heading of Array.from(headings)) {
    if (!normalizedText(heading.textContent).includes(target)) continue

    // Get the parent section/container
    const section = heading.closest('section, .section, .card, .panel, [class*="section"], [class*="card"]')
    if (section) {
      // Get all text content after the heading
      const allText = section.textContent?.trim() ?? ''
      const headingText = heading.textContent?.trim() ?? ''
      const afterHeading = allText.substring(allText.indexOf(headingText) + headingText.length).trim()
      if (afterHeading) return afterHeading
    }

    // Fallback: collect sibling content
    let content = ''
    let sibling = heading.nextElementSibling
    while (sibling && !sibling.matches('h1, h2, h3, h4, h5, h6')) {
      content += (sibling.textContent?.trim() ?? '') + '\n'
      sibling = sibling.nextElementSibling
    }
    if (content.trim()) return content.trim()
  }

  return ''
}

/**
 * Extract text from intake questionnaire responses.
 * SP intake forms often use question/answer pairs.
 */
function extractQuestionnaireResponse(questionText: string): string {
  const target = normalizedText(questionText)

  // Look for question elements
  const questions = document.querySelectorAll(
    '.question, .intake-question, [class*="question"], dt, .form-group label, td:first-child'
  )

  for (const question of Array.from(questions)) {
    if (!normalizedText(question.textContent).includes(target)) continue

    // Answer might be a sibling, next element, or paired element
    const answer =
      question.nextElementSibling ??
      question.closest('tr')?.querySelector('td:last-child') ??
      question.closest('.form-group')?.querySelector('input, textarea, .response, [class*="answer"]')

    if (answer) {
      if (answer instanceof HTMLInputElement || answer instanceof HTMLTextAreaElement) {
        return answer.value.trim()
      }
      return answer.textContent?.trim() ?? ''
    }
  }

  return ''
}

// ── Main Extraction ──

async function extractIntakeData(): Promise<IntakeData> {
  const intake: IntakeData = { ...EMPTY_INTAKE }
  intake.clientId = getClientIdFromUrl()
  intake.capturedAt = new Date().toISOString()

  // Demographics — client details page
  intake.firstName = extractBySelectors([
    'input[name="firstName"]',
    '[data-test="first-name"]',
  ]) || extractByLabel('first name')

  intake.lastName = extractBySelectors([
    'input[name="lastName"]',
    '[data-test="last-name"]',
  ]) || extractByLabel('last name')

  intake.sex = extractBySelectors([
    'select[name="sex"]',
  ]) || extractByLabel('sex') || extractByLabel('gender')

  intake.dob = extractBySelectors([
    'input[name="dob"]',
    '[data-test="dob"]',
  ]) || extractByLabel('date of birth') || extractByLabel('dob')

  // If DOB is in 3 separate selects
  if (!intake.dob) {
    const month = valueFrom('select[name="month"]')
    const day = valueFrom('select[name="day"]')
    const year = valueFrom('select[name="year"]')
    if (month && day && year) {
      intake.dob = `${month}/${day}/${year}`
    }
  }

  intake.phone = extractBySelectors([
    'input[name="phone"]',
    'input[type="tel"]',
    '[data-test="phone"]',
  ]) || extractByLabel('phone')

  intake.email = extractBySelectors([
    'input[name="email"]',
    'input[type="email"]',
    '[data-test="email"]',
  ]) || extractByLabel('email')

  // Address
  intake.address.street = extractBySelectors([
    'input[name="addressStreet"]',
    'input[name="street"]',
  ]) || extractByLabel('street') || extractByLabel('address')

  intake.address.city = extractBySelectors([
    'input[name="city"]',
  ]) || extractByLabel('city')

  intake.address.state = extractBySelectors([
    'input[name="state"]',
    'select[name="state"]',
  ]) || extractByLabel('state')

  intake.address.zip = extractBySelectors([
    'input[name="zip"]',
    'input[name="postalCode"]',
  ]) || extractByLabel('zip') || extractByLabel('postal code')

  // Insurance
  intake.insuranceCompany = extractByLabel('payer') || extractByLabel('insurance company') || extractByLabel('insurance plan')
  intake.memberId = extractByLabel('member id') || extractByLabel('subscriber id')
  intake.groupNumber = extractByLabel('group number') || extractByLabel('group #')

  // Clinical intake — these map to common SP intake form sections
  intake.chiefComplaint =
    extractByLabel('chief complaint') ||
    extractByLabel('reason for seeking treatment') ||
    extractByLabel('reason for visit') ||
    extractQuestionnaireResponse('what brings you') ||
    extractQuestionnaireResponse('reason for seeking') ||
    extractSectionContent('chief complaint') ||
    extractSectionContent('reason for visit')

  intake.presentingProblems =
    extractByLabel('presenting problems') ||
    extractByLabel('presenting concerns') ||
    extractSectionContent('presenting problems') ||
    extractSectionContent('presenting concerns') ||
    extractQuestionnaireResponse('current symptoms') ||
    extractQuestionnaireResponse('describe your current')

  intake.historyOfPresentIllness =
    extractByLabel('history of present illness') ||
    extractSectionContent('history of present illness') ||
    extractSectionContent('hpi')

  intake.pastPsychiatricHistory =
    extractByLabel('past psychiatric history') ||
    extractByLabel('previous mental health treatment') ||
    extractSectionContent('psychiatric history') ||
    extractQuestionnaireResponse('previous therapy') ||
    extractQuestionnaireResponse('previous psychiatric')

  intake.medications =
    extractByLabel('current medications') ||
    extractByLabel('medications') ||
    extractSectionContent('medications') ||
    extractQuestionnaireResponse('medications')

  intake.medicalHistory =
    extractByLabel('medical history') ||
    extractByLabel('medical conditions') ||
    extractSectionContent('medical history') ||
    extractQuestionnaireResponse('medical conditions') ||
    extractQuestionnaireResponse('health conditions')

  intake.familyPsychiatricHistory =
    extractByLabel('family psychiatric history') ||
    extractByLabel('family mental health history') ||
    extractSectionContent('family history') ||
    extractQuestionnaireResponse('family history of mental')

  intake.socialHistory =
    extractByLabel('social history') ||
    extractSectionContent('social history') ||
    extractQuestionnaireResponse('living situation') ||
    extractQuestionnaireResponse('relationship status')

  intake.substanceUseHistory =
    extractByLabel('substance use') ||
    extractByLabel('alcohol and drug use') ||
    extractSectionContent('substance use') ||
    extractQuestionnaireResponse('alcohol use') ||
    extractQuestionnaireResponse('drug use') ||
    extractQuestionnaireResponse('substance use')

  intake.priorTreatment =
    extractByLabel('prior treatment') ||
    extractByLabel('treatment history') ||
    extractSectionContent('prior treatment') ||
    extractSectionContent('treatment history')

  intake.suicidalIdeation =
    extractByLabel('suicidal ideation') ||
    extractByLabel('suicidal thoughts') ||
    extractQuestionnaireResponse('suicidal') ||
    extractQuestionnaireResponse('thoughts of harming yourself')

  intake.homicidalIdeation =
    extractByLabel('homicidal ideation') ||
    extractByLabel('homicidal thoughts') ||
    extractQuestionnaireResponse('homicidal') ||
    extractQuestionnaireResponse('thoughts of harming others')

  return intake
}

function countCapturedFields(intake: IntakeData): number {
  let count = 0
  const skip = new Set(['capturedAt', 'clientId', 'address'])

  for (const [key, value] of Object.entries(intake)) {
    if (skip.has(key)) continue
    if (typeof value === 'string' && value.trim()) count++
  }

  // Count address fields separately
  for (const value of Object.values(intake.address)) {
    if (value.trim()) count++
  }

  return count
}

// ── Button Injection & Main Loop ──

async function handleCaptureClick(): Promise<void> {
  try {
    assertExtensionContext()
    showToast('Capturing intake data...', 'success')

    const intake = await extractIntakeData()
    const fieldCount = countCapturedFields(intake)

    if (fieldCount === 0) {
      showToast('No intake data found on this page. Navigate to a client profile or intake form.', 'error')
      return
    }

    await saveIntake(intake)
    showToast(
      `Captured ${fieldCount} fields for ${intake.firstName || 'client'} ${intake.lastName || ''}`.trim(),
      'success'
    )

    console.log('[SPN] Captured intake data:', { fieldCount, clientId: intake.clientId })
  } catch (err) {
    if (isExtensionContextInvalidatedError(err)) {
      showToast('Extension reloaded — please refresh this page.', 'error')
    } else {
      console.error('[SPN] Capture error:', err)
      showToast('Failed to capture intake data.', 'error')
    }
  }
}

function injectCaptureButton(): void {
  if (!isClientPage()) return

  // Don't inject if already present
  if (document.getElementById('spn-capture-btn')) return

  injectButton('Capture Intake', handleCaptureClick, {
    id: 'spn-capture-btn',
    position: 'bottom-right',
  })
}

// Watch for SPA navigation
let lastUrl = window.location.href
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    // Re-inject button on navigation
    setTimeout(injectCaptureButton, 500)
  }
})

observer.observe(document.body, { childList: true, subtree: true })

// Initial injection
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(injectCaptureButton, 500))
} else {
  setTimeout(injectCaptureButton, 500)
}
