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

import { IntakeData, EMPTY_INTAKE, AssessmentResult, AssessmentItem } from '../lib/types'
import { saveIntake, mergeIntake, getIntake } from '../lib/storage'
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

// ── Assessment Extraction (GAD-7, PHQ-9) ──

function detectAssessmentType(): 'GAD-7' | 'PHQ-9' | null {
  const titleEl = document.querySelector('.title-item h3')
  const title = titleEl?.textContent?.trim().toLowerCase() ?? ''
  if (title.includes('gad-7') || title.includes('gad 7')) return 'GAD-7'
  if (title.includes('phq-9') || title.includes('phq 9')) return 'PHQ-9'
  return null
}

function extractAssessmentFromRoot(name: 'GAD-7' | 'PHQ-9', root: Document | Element = document): AssessmentResult {
  const items: AssessmentItem[] = []
  let difficulty = ''

  // Parse scoring description
  const scoringEl = root.querySelector('.scoring-description')
  const severityMatch = scoringEl?.textContent?.match(/indicate\s+(.+)/i)
  const severity = severityMatch?.[1]?.replace(/\.$/, '').trim() ?? ''

  // Parse table rows
  const rows = root.querySelectorAll('tbody tr.et-tr')
  for (const row of Array.from(rows)) {
    const cells = row.querySelectorAll('td')
    if (cells.length < 3) continue

    const firstCell = cells[0]
    const questionNumEl = firstCell.querySelector('.question-number')

    if (questionNumEl) {
      const num = parseInt(questionNumEl.textContent?.replace('.', '') ?? '0', 10)
      const questionText = firstCell.querySelector('.question-number + div p')?.textContent?.trim() ?? ''
      const response = cells[1]?.querySelector('.cell-container p')?.textContent?.trim() ?? ''
      const scoreText = cells[2]?.querySelector('.cell-container p')?.textContent?.trim() ?? ''
      const scoreParts = scoreText.match(/^(\d+)\/(\d+)$/)

      items.push({
        number: num,
        question: questionText,
        response,
        score: scoreParts ? parseInt(scoreParts[1], 10) : 0,
        maxScore: scoreParts ? parseInt(scoreParts[2], 10) : 3,
      })
    } else if (!firstCell.querySelector('.intro-row') && firstCell.textContent?.includes('difficult')) {
      difficulty = cells[1]?.querySelector('.cell-container p')?.textContent?.trim() ?? ''
    }
  }

  // Also check non-intro rows for difficulty question
  const allRows = root.querySelectorAll('tbody tr.et-tr:not(.intro-row)')
  for (const row of Array.from(allRows)) {
    const firstCell = row.querySelector('td')
    if (!firstCell?.querySelector('.question-number') &&
        firstCell?.textContent?.includes('difficult')) {
      const cells = row.querySelectorAll('td')
      difficulty = cells[1]?.querySelector('.cell-container p')?.textContent?.trim() ?? ''
    }
  }

  const totalScore = items.reduce((sum, item) => sum + item.score, 0)

  return { name, totalScore, severity, items, difficulty, capturedAt: new Date().toISOString() }
}

/**
 * Find GAD-7 and PHQ-9 links on the current page, fetch them, and extract scores.
 */
async function fetchAssessmentsFromLinks(): Promise<{ gad7: AssessmentResult | null; phq9: AssessmentResult | null }> {
  const result: { gad7: AssessmentResult | null; phq9: AssessmentResult | null } = { gad7: null, phq9: null }

  // Find links to assessments (e.g. <a href="/clients/.../intake_notes/...">GAD-7</a>)
  const links = document.querySelectorAll('a[href*="/intake_notes/"]')
  const assessmentLinks: { type: 'GAD-7' | 'PHQ-9'; url: string }[] = []

  for (const link of Array.from(links)) {
    const text = link.textContent?.trim().toLowerCase() ?? ''
    const href = (link as HTMLAnchorElement).href
    if (text.includes('gad') && href) assessmentLinks.push({ type: 'GAD-7', url: href })
    else if (text.includes('phq') && href) assessmentLinks.push({ type: 'PHQ-9', url: href })
  }

  for (const { type, url } of assessmentLinks) {
    try {
      const resp = await fetch(url, { credentials: 'include' })
      if (!resp.ok) continue
      const html = await resp.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const assessment = extractAssessmentFromRoot(type, doc)
      if (assessment.items.length > 0) {
        if (type === 'GAD-7') result.gad7 = assessment
        else result.phq9 = assessment
        console.log(`[SPN] Auto-captured ${type} from ${url}: score ${assessment.totalScore}`)
      }
    } catch (err) {
      console.warn(`[SPN] Failed to fetch ${type} from ${url}:`, err)
    }
  }

  return result
}

function hasAssessmentTable(): boolean {
  return !!document.querySelector('.scoring-description') && !!detectAssessmentType()
}

async function handleAssessmentCapture(): Promise<void> {
  try {
    assertExtensionContext()
    const type = detectAssessmentType()
    if (!type) {
      showToast('Not a recognized assessment page.', 'error')
      return
    }

    const result = extractAssessmentFromRoot(type)
    const key = type === 'GAD-7' ? 'gad7' : 'phq9'
    await mergeIntake({ [key]: result })

    showToast(`Captured ${type}: score ${result.totalScore} (${result.severity})`, 'success')
    console.log(`[SPN] Captured ${type}:`, result)
  } catch (err) {
    if (isExtensionContextInvalidatedError(err)) {
      showToast('Extension reloaded — please refresh this page.', 'error')
    } else {
      console.error('[SPN] Assessment capture error:', err)
      showToast('Failed to capture assessment.', 'error')
    }
  }
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

    // Auto-fetch GAD-7 and PHQ-9 from linked assessment pages
    const assessments = await fetchAssessmentsFromLinks()
    if (assessments.gad7) intake.gad7 = assessments.gad7
    if (assessments.phq9) intake.phq9 = assessments.phq9

    await saveIntake(intake)

    const extras: string[] = []
    if (assessments.gad7) extras.push(`GAD-7: ${assessments.gad7.totalScore}`)
    if (assessments.phq9) extras.push(`PHQ-9: ${assessments.phq9.totalScore}`)
    const extraText = extras.length ? ` + ${extras.join(', ')}` : ''

    const name = `${intake.firstName} ${intake.lastName}`.trim() || 'client'
    showToast(`Captured ${fieldCount} fields for ${name}${extraText}`, 'success')

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

  // Assessment page (GAD-7 / PHQ-9) — show assessment capture button
  if (hasAssessmentTable()) {
    if (document.getElementById('spn-assessment-btn')) return
    const type = detectAssessmentType()!
    injectButton(`Capture ${type}`, handleAssessmentCapture, {
      id: 'spn-assessment-btn',
      position: 'bottom-right',
    })
    return
  }

  // Intake form page — show intake capture button
  if (document.getElementById('spn-capture-btn')) return
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
