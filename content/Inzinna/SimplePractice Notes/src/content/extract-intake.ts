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

import { IntakeData, EMPTY_INTAKE, AssessmentResult, AssessmentItem, TreatmentPlanData, TreatmentPlanGoal, EMPTY_TREATMENT_PLAN } from '../lib/types'
import { mergeIntake, saveTreatmentPlan } from '../lib/storage'
import {
  injectButton,
  showToast,
  assertExtensionContext,
  isExtensionContextInvalidatedError,
  normalizedText,
  registerFloatingButtonsController,
} from './shared'

// ── URL Detection ──

const CLIENT_PATH_RE = /\/clients\/([^/]+)/

function getClientIdFromUrl(): string {
  const match = window.location.pathname.match(CLIENT_PATH_RE)
  return match?.[1] ?? ''
}

function isClientPage(): boolean {
  return CLIENT_PATH_RE.test(window.location.pathname)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toAbsoluteUrl(value: string): string {
  try {
    return new URL(value, window.location.origin).href
  } catch {
    return ''
  }
}

function isSameClientUrl(url: string, clientId = getClientIdFromUrl()): boolean {
  if (!clientId) return false

  try {
    const parsed = new URL(url)
    return parsed.origin === window.location.origin && parsed.pathname.startsWith(`/clients/${clientId}`)
  } catch {
    return false
  }
}

function extractIntakeNoteUrlsFromText(text: string, clientId = getClientIdFromUrl()): string[] {
  const pattern = clientId
    ? new RegExp(`/clients/${escapeRegExp(clientId)}/intake_notes/\\d+`, 'g')
    : /\/clients\/[^/]+\/intake_notes\/\d+/g

  const normalizedTextCandidates = [
    text,
    text.replace(/\\\//g, '/'),
  ]

  return Array.from(new Set(
    normalizedTextCandidates.flatMap((candidate) => candidate.match(pattern) ?? [])
      .map((match) => toAbsoluteUrl(match))
      .filter(Boolean)
  ))
}

function extractSameClientPageUrlsFromRoot(root: ParentNode, clientId = getClientIdFromUrl()): string[] {
  const urls = new Set<string>()

  for (const link of Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    const href = link.getAttribute('href') ?? ''
    const url = toAbsoluteUrl(href)
    if (!url) continue
    if (!isSameClientUrl(url, clientId)) continue
    urls.add(url)
  }

  return Array.from(urls)
}

function collectRenderedIntakeNoteUrls(clientId = getClientIdFromUrl()): string[] {
  return Array.from(new Set([
    ...extractIntakeNoteUrlsFromText(document.documentElement.outerHTML, clientId),
    ...extractSameClientPageUrlsFromRoot(document, clientId).filter((url) => url.includes('/intake_notes/')),
  ]))
}

async function discoverIntakeNoteUrlsViaBackground(clientId: string): Promise<string[]> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SPN_DISCOVER_INTAKE_NOTE_URLS',
      clientId,
    })
    return Array.isArray(response?.urls) ? response.urls : []
  } catch (err) {
    console.warn('[SPN] Background intake-note discovery failed:', err)
    return []
  }
}

async function discoverIntakeNoteUrls(): Promise<string[]> {
  const noteUrls = new Set<string>()
  const clientId = getClientIdFromUrl()
  const candidatePages = new Set<string>()

  const addNoteUrls = (urls: string[]) => {
    for (const url of urls) {
      if (!clientId || isSameClientUrl(url, clientId)) {
        noteUrls.add(url)
      }
    }
  }

  addNoteUrls(collectRenderedIntakeNoteUrls(clientId))

  if (clientId) {
    candidatePages.add(toAbsoluteUrl(`/clients/${clientId}/intake_notes`))
  }

  const parser = new DOMParser()

  for (const url of candidatePages) {
    try {
      const resp = await fetch(url, { credentials: 'include' })
      if (!resp.ok) {
        console.log(`[SPN] Intake-notes index returned ${resp.status} for ${url}`)
        continue
      }

      const html = await resp.text()
      addNoteUrls(extractIntakeNoteUrlsFromText(html, clientId))

      const doc = parser.parseFromString(html, 'text/html')
      addNoteUrls(extractSameClientPageUrlsFromRoot(doc, clientId).filter((candidate) => candidate.includes('/intake_notes/')))
    } catch (err) {
      console.warn(`[SPN] Failed to inspect intake-notes index ${url}:`, err)
    }
  }

  if (noteUrls.size === 0 && clientId) {
    console.log('[SPN] Falling back to background-tab intake-note discovery')
    addNoteUrls(await discoverIntakeNoteUrlsViaBackground(clientId))
  }

  return Array.from(noteUrls)
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

  intake.medicalHistory = findAnswer(pairs,
    'medical conditions',
    'medical history',
    'current medical conditions',
    'current health conditions'
  )

  intake.allergies = findAnswer(pairs,
    'allergies',
    'allergy'
  )

  intake.surgeries = findAnswer(pairs,
    'surgeries',
    'surgery history',
    'surgical history'
  )

  intake.troubleSleeping = findAnswer(pairs,
    'trouble sleeping',
    'sleep problems',
    'sleep issues',
    'difficulty sleeping'
  )

  intake.developmentalHistory = findAnswer(pairs,
    'developmental history',
    'within normal limits'
  )

  intake.tbiLoc = findAnswer(pairs,
    'tbi',
    'traumatic brain injury',
    'loss of consciousness',
    'loc'
  )

  // Substance use
  intake.alcoholUse = findAnswer(pairs, 'drink alcohol')
  intake.drugUse = findAnswer(pairs, 'recreational drugs', 'drug use')
  intake.substanceUseHistory = findAnswer(pairs,
    'using or abusing substances',
    'substance use',
    'substance abuse'
  )

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

function detectAssessmentTypeFromQuestions(root: Document | Element = document): 'GAD-7' | 'PHQ-9' | null {
  const questionTexts = Array.from(root.querySelectorAll('tbody tr.et-tr td:first-child'))
    .map((cell) => normalizedText(cell.textContent))
    .filter(Boolean)

  const combined = questionTexts.join(' ')
  if (/nervous anxious or on edge|unable to stop or control worrying|worrying too much about different things/.test(combined)) {
    return 'GAD-7'
  }
  if (/little interest or pleasure in doing things|feeling down depressed or hopeless|poor appetite or overeating/.test(combined)) {
    return 'PHQ-9'
  }

  const numberedQuestions = root.querySelectorAll('tbody tr.et-tr .question-number').length
  if (numberedQuestions === 7) return 'GAD-7'
  if (numberedQuestions === 9) return 'PHQ-9'

  return null
}

function detectAssessmentType(root: Document | Element = document): 'GAD-7' | 'PHQ-9' | null {
  const docTitle = root instanceof Document ? root.title : root.ownerDocument?.title ?? ''
  const title = normalizedText([
    root.querySelector('.title-item h3')?.textContent ?? '',
    root.querySelector('h1')?.textContent ?? '',
    docTitle,
  ].join(' '))

  if (title.includes('gad 7')) return 'GAD-7'
  if (title.includes('phq 9')) return 'PHQ-9'
  return detectAssessmentTypeFromQuestions(root)
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

  // Fetch all linked intake-note pages, then classify by the fetched page title.
  // This is more reliable than depending on the visible anchor text to contain
  // "PHQ" or "GAD".
  const uniqueLinks = await discoverIntakeNoteUrls()
  if (uniqueLinks.length === 0) {
    console.log('[SPN] Auto-capture found no sibling intake-note URLs on this page')
    return result
  }

  console.log('[SPN] Auto-capture candidate intake-note URLs:', uniqueLinks)

  for (const url of uniqueLinks) {
    try {
      const resp = await fetch(url, { credentials: 'include' })
      if (!resp.ok) continue
      const html = await resp.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const type = detectAssessmentType(doc)
      if (!type) {
        console.log(`[SPN] Skipping non-assessment intake note ${url}`)
        continue
      }
      const assessment = extractAssessmentFromRoot(type, doc)
      if (assessment.items.length > 0) {
        if (type === 'GAD-7') result.gad7 = assessment
        else result.phq9 = assessment
        console.log(`[SPN] Auto-captured ${type} from ${url}: score ${assessment.totalScore}`)
      }

      if (result.gad7 && result.phq9) break
    } catch (err) {
      console.warn(`[SPN] Failed to fetch linked intake note ${url}:`, err)
    }
  }

  if (!result.gad7 || !result.phq9) {
    console.log('[SPN] Auto-capture missing assessments after sibling-note scan:', {
      missing: [
        !result.gad7 ? 'GAD-7' : '',
        !result.phq9 ? 'PHQ-9' : '',
      ].filter(Boolean),
    })
  }

  return result
}

function hasAssessmentTable(): boolean {
  return !!document.querySelector('tbody tr.et-tr') && !!detectAssessmentType()
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

// ── Treatment Plan Extraction ──

function isTreatmentPlanPage(): boolean {
  return /\/clients\/[^/]+\/diagnosis_treatment_plans\//.test(window.location.pathname)
}

function extractTreatmentPlanData(): TreatmentPlanData {
  const plan: TreatmentPlanData = { ...EMPTY_TREATMENT_PLAN }
  plan.clientId = getClientIdFromUrl()
  plan.sourceUrl = window.location.href

  // Extract diagnoses from ul.diagnoses
  const diagEls = document.querySelectorAll('ul.diagnoses li div')
  plan.diagnoses = Array.from(diagEls).map((el) => {
    const text = (el.textContent ?? '').trim()
    const match = text.match(/^([A-Z]\d[\d.]*)\s*-\s*(.+)$/)
    return match
      ? { code: match[1], description: match[2].trim() }
      : { code: '', description: text }
  }).filter((d) => d.description)

  // Extract structured content from .markdown
  const markdown = document.querySelector('.markdown')
  if (markdown) {
    const sections = parseTreatmentPlanMarkdown(markdown)
    plan.presentingProblem = sections.presentingProblem
    plan.clientStrengths = sections.clientStrengths
    plan.clientRisks = sections.clientRisks
    plan.goals = sections.goals
    plan.interventions = sections.interventions
    plan.treatmentType = sections.treatmentType
    plan.estimatedLength = sections.estimatedLength
    plan.medicalNecessity = sections.medicalNecessity
  }

  // Extract treatment frequency
  const freqEl = document.querySelector('.treatment-frequency .field span')
  plan.treatmentFrequency = freqEl?.textContent?.trim() ?? ''

  // Extract date assigned
  const dateEl = document.querySelector('.date-time span')
  plan.dateAssigned = dateEl?.textContent?.trim() ?? ''

  plan.capturedAt = new Date().toISOString()
  return plan
}

interface ParsedTreatmentPlanSections {
  presentingProblem: string
  clientStrengths: string
  clientRisks: string
  goals: TreatmentPlanGoal[]
  interventions: string[]
  treatmentType: string
  estimatedLength: string
  medicalNecessity: string[]
}

function parseTreatmentPlanMarkdown(container: Element): ParsedTreatmentPlanSections {
  const result: ParsedTreatmentPlanSections = {
    presentingProblem: '',
    clientStrengths: '',
    clientRisks: '',
    goals: [],
    interventions: [],
    treatmentType: '',
    estimatedLength: '',
    medicalNecessity: [],
  }

  // Walk through headings and collect content after each
  const children = Array.from(container.children)
  let currentSection = ''
  let currentGoal: TreatmentPlanGoal | null = null
  let currentObjectiveId = ''

  for (let i = 0; i < children.length; i++) {
    const el = children[i]
    const tag = el.tagName.toLowerCase()
    const text = (el.textContent ?? '').trim()
    const id = el.id || ''

    // Detect section headings
    if (tag === 'h3' || tag === 'h2') {
      const lower = text.toLowerCase().replace(/:$/, '')

      if (lower.includes('presenting problem')) {
        currentSection = 'presenting-problem'
        continue
      }
      if (lower.includes('client strengths')) {
        currentSection = 'strengths'
        continue
      }
      if (lower.includes('client risks')) {
        currentSection = 'risks'
        continue
      }
      if (lower.includes('interventions')) {
        currentSection = 'interventions'
        continue
      }
      if (lower.includes('treatment approach')) {
        currentSection = 'treatment-approach'
        continue
      }
      if (lower.includes('medical necessity')) {
        currentSection = 'medical-necessity'
        continue
      }

      // Goal heading: "Goal 1", "Goal 2:", etc.
      const goalMatch = lower.match(/^goal\s*(\d+)/)
      if (goalMatch) {
        if (currentGoal) result.goals.push(currentGoal)
        currentGoal = {
          goalNumber: parseInt(goalMatch[1]),
          goal: '',
          estimatedCompletion: '',
          status: '',
          objectives: [],
        }
        currentSection = 'goal'
        continue
      }

      // Objective heading: "Objective 1A:", "Objective 2B:", etc.
      const objMatch = lower.match(/^objective\s*(\d+[a-z])/)
      if (objMatch) {
        currentObjectiveId = objMatch[1].toUpperCase()
        currentSection = 'objective'
        continue
      }

      if (lower.includes('goals and objectives')) {
        currentSection = 'goals-header'
        continue
      }
    }

    // Collect content based on current section
    if (tag === 'p') {
      const pText = text

      // Check for labeled content: "Goal: ...", "Estimated date of completion: ..."
      const labelMatch = pText.match(/^(.+?):\s*(.+)$/)
      if (labelMatch) {
        const label = labelMatch[1].toLowerCase()
        const value = labelMatch[2].trim()

        if (currentSection === 'goal' && currentGoal) {
          if (label === 'goal') currentGoal.goal = value
          else if (label.includes('estimated')) currentGoal.estimatedCompletion = value
          else if (label === 'status') currentGoal.status = value
          continue
        }

        if (currentSection === 'objective' && currentGoal) {
          if (label === 'objective') {
            currentGoal.objectives.push({
              id: currentObjectiveId,
              objective: value,
              estimatedCompletion: '',
            })
          } else if (label.includes('estimated') && currentGoal.objectives.length > 0) {
            currentGoal.objectives[currentGoal.objectives.length - 1].estimatedCompletion = value
          }
          continue
        }

        if (currentSection === 'treatment-approach') {
          if (label.includes('treatment type')) result.treatmentType = value
          else if (label.includes('estimated length')) result.estimatedLength = value
          continue
        }
      }

      if (currentSection === 'presenting-problem') {
        result.presentingProblem += (result.presentingProblem ? '\n' : '') + pText
      }
    }

    if (tag === 'ul') {
      const items = Array.from(el.querySelectorAll('li')).map((li) => (li.textContent ?? '').trim()).filter(Boolean)

      if (currentSection === 'strengths') {
        result.clientStrengths = items.join('\n')
      } else if (currentSection === 'risks') {
        result.clientRisks = items.join('\n')
      } else if (currentSection === 'interventions') {
        result.interventions = items.map((item) => {
          // Split "Therapy Name\ndescription" into just the name for the list
          return item.split('\n')[0].trim()
        })
      } else if (currentSection === 'medical-necessity') {
        result.medicalNecessity = items
      }
    }
  }

  // Push last goal
  if (currentGoal) result.goals.push(currentGoal)

  return result
}

async function handleCaptureTreatmentPlan(): Promise<void> {
  try {
    assertExtensionContext()
    showToast('Capturing treatment plan...', 'success')

    const plan = extractTreatmentPlanData()
    const diagCount = plan.diagnoses.length
    const goalCount = plan.goals.length

    if (diagCount === 0 && goalCount === 0 && !plan.presentingProblem) {
      showToast('No treatment plan data found on this page.', 'error')
      return
    }

    await saveTreatmentPlan(plan)

    const parts: string[] = []
    if (diagCount) parts.push(`${diagCount} diagnoses`)
    if (goalCount) parts.push(`${goalCount} goals`)
    if (plan.interventions.length) parts.push(`${plan.interventions.length} interventions`)

    showToast(`Captured treatment plan: ${parts.join(', ')}`, 'success')

    console.groupCollapsed(`[SPN] Captured treatment plan (${parts.join(', ')})`)
    console.log('[SPN] Treatment plan:', plan)
    console.groupEnd()
  } catch (err) {
    if (isExtensionContextInvalidatedError(err)) {
      showToast('Extension reloaded — please refresh this page.', 'error')
    } else {
      console.error('[SPN] Treatment plan capture error:', err)
      showToast('Failed to capture treatment plan.', 'error')
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

    await mergeIntake(intake)

    const extras: string[] = []
    if (assessments.gad7) extras.push(`GAD-7: ${assessments.gad7.totalScore}`)
    if (assessments.phq9) extras.push(`PHQ-9: ${assessments.phq9.totalScore}`)
    const extraText = extras.length ? ` + ${extras.join(', ')}` : ''

    const name = `${intake.firstName} ${intake.lastName}`.trim() || 'client'
    showToast(`Captured ${fieldCount} fields for ${name}${extraText}`, 'success')

    console.groupCollapsed(`[SPN] Captured intake data for ${name} (${fieldCount} fields, ${intake.rawQA.length} Q&A)`)
    console.log('[SPN] Intake summary:', {
      fieldCount,
      qaCount: intake.rawQA.length,
      clientId: intake.clientId,
      name,
    })
    console.log('[SPN] Full intake object:', intake)
    console.log('[SPN] rawQA:', intake.rawQA)
    console.groupEnd()
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

  // Treatment plan page — show treatment-plan capture button
  if (isTreatmentPlanPage()) {
    if (document.getElementById('spn-treatment-plan-btn')) return

    injectButton('Capture Treatment Plan', handleCaptureTreatmentPlan, {
      id: 'spn-treatment-plan-btn',
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
  const hasAnyCaptureButton =
    !!document.getElementById('spn-capture-btn') ||
    !!document.getElementById('spn-treatment-plan-btn') ||
    !!document.getElementById('spn-assessment-btn')

  if (isClientPage() && !hasAnyCaptureButton && retryCount < MAX_RETRIES) {
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

registerFloatingButtonsController(() => {
  setTimeout(injectCaptureButton, 0)
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'SPN_COLLECT_INTAKE_NOTE_URLS') {
    sendResponse({ urls: collectRenderedIntakeNoteUrls(msg.clientId || getClientIdFromUrl()) })
    return true
  }
})
