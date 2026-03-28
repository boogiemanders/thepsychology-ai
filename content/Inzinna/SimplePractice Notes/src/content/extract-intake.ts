/**
 * SimplePractice Notes — Intake Data Extractor
 *
 * Extracts patient intake data from SimplePractice's DIPS Intake Form.
 *
 * The form renders as a Q&A inside `.markdown.intake-answers`:
 *   <h3>Question text</h3>
 *   <p>Answer line 1</p>
 *   <p>Answer line 2</p>
 *   -- or --
 *   <ul><li>Answer</li></ul>
 *
 * This script parses all Q&A pairs, then maps them to structured IntakeData fields.
 */

import { IntakeData, EMPTY_INTAKE } from '../lib/types'
import { saveIntake } from '../lib/storage'
import {
  injectButton,
  showToast,
  assertExtensionContext,
  isExtensionContextInvalidatedError,
  normalizedText,
} from './shared'

// ── URL Detection ──

function getClientIdFromUrl(): string {
  const match = window.location.pathname.match(/\/clients\/(\d+)/)
  return match?.[1] ?? ''
}

function isClientPage(): boolean {
  return /\/clients\/\d+/.test(window.location.pathname)
}

// ── Q&A Parsing ──

interface QAPair {
  question: string
  answer: string
}

/**
 * Parse all Q&A pairs from the .markdown.intake-answers container.
 * Questions are <h3> elements. Answers are all sibling <p> and <ul>
 * elements between one <h3> and the next.
 */
function parseIntakeQA(): QAPair[] {
  const container = document.querySelector('.markdown.intake-answers')
  if (!container) return []

  const pairs: QAPair[] = []
  const children = Array.from(container.children)

  let currentQuestion = ''
  let answerParts: string[] = []

  for (const child of children) {
    if (child.tagName === 'H3') {
      // Save previous Q&A pair
      if (currentQuestion) {
        pairs.push({
          question: currentQuestion,
          answer: answerParts.join('\n').trim(),
        })
      }
      currentQuestion = child.textContent?.trim() ?? ''
      answerParts = []
    } else if (currentQuestion) {
      // Skip signature blocks
      if (child.classList.contains('signature-header') ||
          child.classList.contains('signature-content') ||
          child.classList.contains('signature-info') ||
          child.classList.contains('signature-ip')) {
        continue
      }

      if (child.tagName === 'P') {
        const text = child.textContent?.trim() ?? ''
        // Skip signature metadata that doesn't have the class
        if (text.startsWith('Signed by') || text.startsWith('IP address:')) continue
        if (text && text !== 'No answer given.') {
          answerParts.push(text)
        }
      } else if (child.tagName === 'UL') {
        const items = Array.from(child.querySelectorAll('li'))
          .map(li => li.textContent?.trim() ?? '')
          .filter(Boolean)
        answerParts.push(...items)
      }
    }
  }

  // Save last Q&A pair
  if (currentQuestion) {
    pairs.push({
      question: currentQuestion,
      answer: answerParts.join('\n').trim(),
    })
  }

  return pairs
}

/**
 * Find a Q&A pair by matching question text (case-insensitive, partial match).
 */
function findAnswer(pairs: QAPair[], ...searchTerms: string[]): string {
  for (const term of searchTerms) {
    const target = normalizedText(term)
    const match = pairs.find(p => normalizedText(p.question).includes(target))
    if (match?.answer) return match.answer
  }
  return ''
}

// ── Form Metadata ──

function extractFormMetadata(): { title: string; date: string; signedBy: string; signedAt: string } {
  const titleItem = document.querySelector('.title-item h3')
  const title = titleItem?.childNodes?.[0]?.textContent?.trim() ?? ''
  const dateText = document.querySelector('.title-item .subtext')?.textContent?.trim() ?? ''

  // Extract signature info
  const signatureContent = document.querySelector('.signature-content')?.textContent?.trim() ?? ''
  const signatureInfo = Array.from(document.querySelectorAll('.signature-info'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean)

  const signedBy = signatureInfo.find(s => s.startsWith('Signed by'))?.replace('Signed by ', '') ?? signatureContent
  const signedAt = signatureInfo.find(s => !s.startsWith('Signed by')) ?? ''

  return { title, date: dateText, signedBy, signedAt }
}

// ── Address Parsing ──

function parseAddress(raw: string): IntakeData['address'] {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const addr: IntakeData['address'] = { street: '', city: '', state: '', zip: '', country: '', raw }

  if (lines.length === 0) return addr

  // First line is usually street
  addr.street = lines[0] ?? ''

  // Second line might be "City State" or "City, State"
  if (lines.length >= 2) {
    const cityLine = lines[1]
    // Try "City, State ZIP" or "City State ZIP" or "City State"
    const match = cityLine.match(/^(.+?)[,\s]+([A-Z]{2})\s*(\d{5})?/)
    if (match) {
      addr.city = match[1].trim()
      addr.state = match[2]
      if (match[3]) addr.zip = match[3]
    } else {
      // Just assign as-is
      addr.city = cityLine
    }
  }

  // Third line might be ZIP
  if (lines.length >= 3) {
    const zipLine = lines[2]
    if (/^\d{5}(-\d{4})?$/.test(zipLine)) {
      addr.zip = zipLine
    } else if (!addr.zip) {
      addr.zip = zipLine
    }
  }

  // Fourth line might be country
  if (lines.length >= 4) {
    addr.country = lines[3]
  }

  return addr
}

// ── Name Parsing ──

function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

// ── Main Extraction ──

function extractIntakeData(): IntakeData {
  const intake: IntakeData = {
    ...EMPTY_INTAKE,
    address: { ...EMPTY_INTAKE.address },
    rawQA: [],
  }

  intake.clientId = getClientIdFromUrl()
  intake.capturedAt = new Date().toISOString()

  // Parse form metadata
  const meta = extractFormMetadata()
  intake.formTitle = meta.title
  intake.formDate = meta.date
  intake.signedBy = meta.signedBy
  intake.signedAt = meta.signedAt

  // Parse all Q&A pairs
  const pairs = parseIntakeQA()
  intake.rawQA = pairs.map(p => ({ question: p.question, answer: p.answer }))

  if (pairs.length === 0) return intake

  // ── Map Q&A to structured fields ──

  // Demographics
  intake.dob = findAnswer(pairs, 'date of birth')

  intake.fullName = findAnswer(pairs, 'full legal name', 'full name', 'name')
  const { firstName, lastName } = parseName(intake.fullName)
  intake.firstName = firstName
  intake.lastName = lastName

  intake.phone = findAnswer(pairs, 'phone number')
  intake.sex = findAnswer(pairs, 'what is your sex')
  intake.genderIdentity = findAnswer(pairs, 'gender identity')
  intake.race = findAnswer(pairs, 'indicate your race', 'race')
  intake.ethnicity = findAnswer(pairs, 'latino or hispanic', 'ethnicity')

  // Address
  const rawAddress = findAnswer(pairs, 'home address', 'address')
  if (rawAddress) {
    intake.address = parseAddress(rawAddress)
  }

  // Emergency contact
  intake.emergencyContact = findAnswer(pairs, 'emergency contact')

  // Clinical
  intake.chiefComplaint = findAnswer(pairs,
    'what brings you to counseling',
    'what brings you to therapy',
    'what brings you',
    'reason for seeking',
    'chief complaint'
  )

  intake.counselingGoals = findAnswer(pairs,
    'goals for counseling',
    'goals for therapy',
    'goals for treatment'
  )

  intake.priorTreatment = findAnswer(pairs,
    'seen a mental health professional before',
    'previous mental health',
    'prior treatment'
  )

  intake.medications = findAnswer(pairs,
    'medications and supplements',
    'medications',
    'currently taking'
  )

  intake.prescribingMD = findAnswer(pairs,
    'prescribing md',
    'prescribing doctor',
    'prescribing physician'
  )

  intake.primaryCarePhysician = findAnswer(pairs,
    'primary care physician',
    'primary care doctor',
    'pcp'
  )

  // Substance use
  intake.alcoholUse = findAnswer(pairs, 'drink alcohol')
  intake.drugUse = findAnswer(pairs, 'recreational drugs', 'drug use')

  // Risk assessment
  intake.suicidalIdeation = findAnswer(pairs, 'suicidal thoughts', 'suicidal ideation')
  intake.suicideAttemptHistory = findAnswer(pairs, 'attempted suicide', 'suicide attempt')
  intake.homicidalIdeation = findAnswer(pairs, 'thoughts or urges to harm others', 'homicidal')
  intake.psychiatricHospitalization = findAnswer(pairs, 'hospitalized for a psychiatric', 'psychiatric hospitalization')

  // Family & mental health history
  intake.familyPsychiatricHistory = findAnswer(pairs, 'history of mental illness in your family')
  intake.familyMentalEmotionalHistory = findAnswer(pairs,
    'family history of mental/emotional',
    'family history of mental',
    'emotional disturbance'
  )

  // Social history
  intake.maritalStatus = findAnswer(pairs, 'marital status')
  intake.relationshipDescription = findAnswer(pairs,
    'describe the nature of the relationship',
    'relationship'
  )
  intake.livingArrangement = findAnswer(pairs,
    'current living situation',
    'living situation',
    'live alone'
  )
  intake.education = findAnswer(pairs,
    'level of education',
    'highest grade',
    'education'
  )
  intake.occupation = findAnswer(pairs,
    'current occupation',
    'occupation'
  )

  // Trauma
  intake.physicalSexualAbuseHistory = findAnswer(pairs, 'physical/sexual abuse', 'physical abuse', 'sexual abuse')
  intake.domesticViolenceHistory = findAnswer(pairs, 'domestic violence')

  // Symptom checklists
  intake.recentSymptoms = findAnswer(pairs, 'experienced in the past six months', 'past six months')
  intake.additionalSymptoms = findAnswer(pairs, 'following that apply')
  intake.additionalInfo = findAnswer(pairs, 'what else would you like me to know', 'anything else')

  return intake
}

function countCapturedFields(intake: IntakeData): number {
  let count = 0
  const skip = new Set(['capturedAt', 'clientId', 'address', 'rawQA', 'formTitle', 'formDate', 'signedBy', 'signedAt'])

  for (const [key, value] of Object.entries(intake)) {
    if (skip.has(key)) continue
    if (typeof value === 'string' && value.trim()) count++
  }

  // Count address if any part is filled
  if (intake.address.raw) count++

  return count
}

// ── Button Injection & Main Loop ──

async function handleCaptureClick(): Promise<void> {
  try {
    assertExtensionContext()
    showToast('Capturing intake data...', 'success')

    const intake = extractIntakeData()
    const fieldCount = countCapturedFields(intake)

    if (fieldCount === 0) {
      showToast('No intake data found. Make sure you are viewing an intake form.', 'error')
      return
    }

    await saveIntake(intake)

    const name = `${intake.firstName} ${intake.lastName}`.trim() || 'client'
    showToast(`Captured ${fieldCount} fields for ${name} (${intake.rawQA.length} Q&A pairs)`, 'success')

    console.log('[SPN] Captured intake data:', {
      fieldCount,
      qaCount: intake.rawQA.length,
      clientId: intake.clientId,
      name,
    })
  } catch (err) {
    if (isExtensionContextInvalidatedError(err)) {
      showToast('Extension reloaded — please refresh this page.', 'error')
    } else {
      console.error('[SPN] Capture error:', err)
      showToast('Failed to capture intake data.', 'error')
    }
  }
}

function hasIntakeForm(): boolean {
  return !!document.querySelector('.markdown.intake-answers')
}

function injectCaptureButton(): void {
  if (!isClientPage()) return
  if (document.getElementById('spn-capture-btn')) return

  // Only inject if there's an intake form on the page
  if (!hasIntakeForm()) return

  injectButton('Capture Intake', handleCaptureClick, {
    id: 'spn-capture-btn',
    position: 'bottom-right',
  })
}

// Watch for SPA navigation and DOM changes (intake form may load async)
let lastUrl = window.location.href
let retryCount = 0
const MAX_RETRIES = 10

const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    retryCount = 0
    setTimeout(injectCaptureButton, 500)
  }

  // Retry injection if form hasn't loaded yet
  if (isClientPage() && !document.getElementById('spn-capture-btn') && retryCount < MAX_RETRIES) {
    retryCount++
    setTimeout(injectCaptureButton, 1000)
  }
})

observer.observe(document.body, { childList: true, subtree: true })

// Initial injection
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(injectCaptureButton, 500))
} else {
  setTimeout(injectCaptureButton, 500)
}
