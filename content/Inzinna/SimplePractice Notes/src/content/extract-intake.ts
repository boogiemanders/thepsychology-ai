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
  isVisible,
  wait,
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

function isClientOverviewPage(): boolean {
  return /\/clients\/[^/]+\/overview(?:$|[/?#])/.test(window.location.pathname)
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

type AssessmentName = 'GAD-7' | 'PHQ-9' | 'C-SSRS' | 'DASS-21'

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

function extractClientNameFromPage(): Partial<IntakeData> {
  const name = [
    document.querySelector('h1.name')?.textContent?.trim() ?? '',
    document.querySelector('h1[data-test-client-name]')?.textContent?.trim() ?? '',
    document.querySelector('main h1')?.textContent?.trim() ?? '',
  ].find(Boolean) ?? ''

  if (!name) return {}
  const [firstName, ...rest] = name.split(/\s+/)
  return {
    fullName: name,
    firstName,
    lastName: rest.join(' '),
  }
}

function extractDobFromPage(): string {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('.item, [class*="item"], [class*="meta"], [class*="demographic"]'))
    .map((el) => el.textContent?.trim() ?? '')
    .filter(Boolean)

  const dobText = candidates.find((text) => /\bDOB\b/i.test(text)) ?? ''
  const match = dobText.match(/\bDOB\b[:\s-]*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  return match?.[1]?.trim() ?? ''
}

function formatReadMoreParagraph(paragraph: Element): string {
  const strong = paragraph.querySelector('strong')
  const raw = paragraph.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  if (!raw) return ''
  if (!strong?.textContent) return raw

  const label = strong.textContent.replace(/:\s*$/, '').trim()
  const remainder = raw.replace(strong.textContent, '').replace(/^:\s*/, '').trim()
  return remainder ? `${label}: ${remainder}` : label
}

function formatReadMoreBlock(block: Element): string {
  const lines: string[] = []

  for (const child of Array.from(block.children)) {
    const tag = child.tagName.toLowerCase()
    if (tag === 'p') {
      const line = formatReadMoreParagraph(child)
      if (line) lines.push(line)
      continue
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(child.querySelectorAll('li'))
        .map((item) => item.textContent?.replace(/\s+/g, ' ').trim() ?? '')
        .filter(Boolean)
      if (items.length) lines.push(...items.map((item) => `- ${item}`))
      continue
    }

    const text = child.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    if (text) lines.push(text)
  }

  return lines.join('\n').trim()
}

async function expandReadMoreSections(): Promise<number> {
  const toggles = Array.from(document.querySelectorAll<HTMLElement>('[data-readmore-toggle]'))
    .filter((toggle) => isVisible(toggle))
    .filter((toggle) => /read more/i.test(toggle.textContent ?? '') || toggle.getAttribute('aria-expanded') === 'false')

  let clicked = 0
  for (const toggle of toggles) {
    toggle.click()
    clicked++
    await wait(60)
  }

  if (clicked > 0) {
    await wait(120)
  }

  return clicked
}

function collectOverviewClinicalNotes(): string {
  const blocks = Array.from(document.querySelectorAll<HTMLElement>('[data-test-shared-read-more], [data-readmore].markdown'))
    .map((block) => formatReadMoreBlock(block))
    .filter((text) => text.length >= 40)

  const uniqueBlocks = Array.from(new Set(blocks))
  return uniqueBlocks
    .slice(0, 3)
    .map((text, index) => `Overview note ${index + 1}:\n${text}`)
    .join('\n\n')
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

// ── Assessment Extraction (GAD-7, PHQ-9, C-SSRS) ──

function detectAssessmentTypeFromQuestions(root: Document | Element = document): AssessmentName | null {
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
  if (/wished you were dead|thoughts of killing yourself|prepared to do anything to end your life/.test(combined)) {
    return 'C-SSRS'
  }
  if (/hard to wind down|dryness of my mouth|close to panic|could not seem to experience any positive feeling/.test(combined)) {
    return 'DASS-21'
  }

  const numberedQuestions = root.querySelectorAll('tbody tr.et-tr .question-number').length
  if (numberedQuestions === 7) return 'GAD-7'
  if (numberedQuestions === 9) return 'PHQ-9'
  if (numberedQuestions === 6 && /kill yourself|end your life|wished you were dead/.test(combined)) {
    return 'C-SSRS'
  }
  if (numberedQuestions === 21 && /stress|panic|wind down|positive feeling/.test(combined)) {
    return 'DASS-21'
  }

  return null
}

function detectAssessmentType(root: Document | Element = document): AssessmentName | null {
  const docTitle = root instanceof Document ? root.title : root.ownerDocument?.title ?? ''
  const title = normalizedText([
    root.querySelector('.title-item h3')?.textContent ?? '',
    root.querySelector('h1')?.textContent ?? '',
    docTitle,
  ].join(' '))

  if (title.includes('gad 7')) return 'GAD-7'
  if (title.includes('phq 9')) return 'PHQ-9'
  if (
    title.includes('c-ssrs') ||
    title.includes('cssrs') ||
    title.includes('columbia-suicide severity rating scale') ||
    title.includes('columbia suicide severity rating scale')
  ) {
    return 'C-SSRS'
  }
  if (
    title.includes('dass 21') ||
    title.includes('dass-21') ||
    title.includes('depression anxiety stress scales')
  ) {
    return 'DASS-21'
  }
  return detectAssessmentTypeFromQuestions(root)
}

function isAffirmativeAssessmentResponse(value: string): boolean {
  return /^(yes|y|true)$/i.test(value.trim())
}

function summarizeCssrs(items: AssessmentItem[]): { totalScore: number; severity: string; difficulty: string } {
  const yesItems = items.filter((item) => isAffirmativeAssessmentResponse(item.response))
  const yesNumbers = new Set(yesItems.map((item) => item.number))
  const totalScore = yesItems.length
  const highestIdeationLevel = [5, 4, 3, 2, 1].find((number) => yesNumbers.has(number)) ?? 0
  const suicidalBehavior = yesNumbers.has(6)

  let severity = 'No recent suicidal ideation or behavior endorsed'
  if (highestIdeationLevel === 1) severity = 'Passive wish to be dead endorsed'
  if (highestIdeationLevel === 2) severity = 'Active suicidal ideation endorsed'
  if (highestIdeationLevel === 3) severity = 'Suicidal ideation with method endorsed'
  if (highestIdeationLevel === 4) severity = 'Suicidal ideation with intent endorsed'
  if (highestIdeationLevel === 5) severity = 'Suicidal ideation with plan and intent endorsed'
  if (suicidalBehavior) {
    severity =
      highestIdeationLevel > 0
        ? `${severity}; suicidal behavior/preparation also endorsed`
        : 'Suicidal behavior/preparation endorsed without current ideation items'
  }

  const difficulty = [
    `Highest recent ideation level: ${highestIdeationLevel}/5`,
    suicidalBehavior ? 'Behavior item 6: Yes' : 'Behavior item 6: No',
  ].join(' · ')

  return { totalScore, severity, difficulty }
}

function extractCssrsFromRoot(root: Document | Element = document): AssessmentResult {
  const items: AssessmentItem[] = []

  const rows = root.querySelectorAll('tbody tr.et-tr')
  for (const row of Array.from(rows)) {
    const cells = row.querySelectorAll('td')
    if (cells.length < 3) continue

    const firstCell = cells[0]
    const questionNumEl = firstCell.querySelector('.question-number')
    if (!questionNumEl) continue

    const number = parseInt(questionNumEl.textContent?.replace('.', '') ?? '0', 10)
    if (!number) continue

    const questionText = firstCell.querySelector('.question-number + div p')?.textContent?.trim() ?? ''
    const response = cells[1]?.querySelector('.cell-container p')?.textContent?.trim() ?? ''
    const lastResponse = cells[2]?.querySelector('.cell-container p')?.textContent?.trim() ?? ''

    items.push({
      number,
      question: questionText,
      response,
      score: isAffirmativeAssessmentResponse(response) ? 1 : 0,
      maxScore: 1,
      lastResponse: lastResponse === '--' ? '' : lastResponse,
    })
  }

  const summary = summarizeCssrs(items)
  return {
    name: 'C-SSRS',
    totalScore: summary.totalScore,
    severity: summary.severity,
    items,
    difficulty: summary.difficulty,
    capturedAt: new Date().toISOString(),
  }
}

function classifyDassSeverity(
  score: number,
  thresholds: [number, number, number, number]
): string {
  if (score <= thresholds[0]) return 'normal'
  if (score <= thresholds[1]) return 'mild'
  if (score <= thresholds[2]) return 'moderate'
  if (score <= thresholds[3]) return 'severe'
  return 'extremely severe'
}

function summarizeDass21(items: AssessmentItem[]): { totalScore: number; severity: string; difficulty: string } {
  const groups = {
    Depression: [3, 5, 10, 13, 16, 17, 21],
    Anxiety: [2, 4, 7, 9, 15, 19, 20],
    Stress: [1, 6, 8, 11, 12, 14, 18],
  } as const

  const totals = Object.entries(groups).map(([label, itemNumbers]) => {
    const raw = items
      .filter((item) => itemNumbers.includes(item.number))
      .reduce((sum, item) => sum + item.score, 0)
    const scaled = raw * 2
    const severity = label === 'Depression'
      ? classifyDassSeverity(scaled, [9, 13, 20, 27])
      : label === 'Anxiety'
        ? classifyDassSeverity(scaled, [7, 9, 14, 19])
        : classifyDassSeverity(scaled, [14, 18, 25, 33])
    return { label, raw, scaled, severity }
  })

  return {
    totalScore: items.reduce((sum, item) => sum + item.score, 0),
    severity: totals.map((entry) => `${entry.label} ${entry.severity}`).join(' · '),
    difficulty: totals.map((entry) => `${entry.label}: ${entry.scaled}`).join(' · '),
  }
}

function extractAssessmentFromRoot(name: AssessmentName, root: Document | Element = document): AssessmentResult {
  if (name === 'C-SSRS') {
    return extractCssrsFromRoot(root)
  }

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

  if (name === 'DASS-21') {
    const summary = summarizeDass21(items)
    return {
      name,
      totalScore: summary.totalScore,
      severity: summary.severity,
      items,
      difficulty: summary.difficulty,
      capturedAt: new Date().toISOString(),
    }
  }

  return { name, totalScore, severity, items, difficulty, capturedAt: new Date().toISOString() }
}

/**
 * Find GAD-7 and PHQ-9 links on the current page, fetch them, and extract scores.
 */
async function fetchAssessmentsFromLinks(): Promise<{
  gad7: AssessmentResult | null
  phq9: AssessmentResult | null
  cssrs: AssessmentResult | null
  dass21: AssessmentResult | null
}> {
  const result: {
    gad7: AssessmentResult | null
    phq9: AssessmentResult | null
    cssrs: AssessmentResult | null
    dass21: AssessmentResult | null
  } = {
    gad7: null,
    phq9: null,
    cssrs: null,
    dass21: null,
  }

  // Fetch all linked intake-note pages, then classify by the fetched page title.
  // This is more reliable than depending on the visible anchor text to contain
  // "PHQ" or "GAD".
  const uniqueLinks = await discoverIntakeNoteUrls()
  if (uniqueLinks.length === 0) {
    console.log('[SPN] Auto-capture found no sibling intake-note URLs on this page')
    return result
  }

  console.log('[SPN] Auto-capture candidate intake-note URLs:', uniqueLinks)

  // SimplePractice uses Ember.js — intake_notes pages return 400 on direct fetch().
  // Open each URL in a background tab so Ember renders, then extract from live DOM.
  for (const url of uniqueLinks) {
    if (result.gad7 && result.phq9 && result.cssrs && result.dass21) break
    try {
      const absUrl = toAbsoluteUrl(url)
      if (!absUrl) continue
      console.log(`[SPN] Opening background tab for assessment: ${absUrl}`)
      const response = await chrome.runtime.sendMessage({
        type: 'SPN_FETCH_ASSESSMENT_VIA_TAB',
        url: absUrl,
      }) as { type: string | null; assessment: AssessmentResult | null } | null

      if (!response?.type || !response.assessment) {
        console.log(`[SPN] No assessment found in background tab for ${url}`)
        continue
      }

      const { type, assessment } = response
      if (type === 'GAD-7' && !result.gad7) result.gad7 = assessment
      else if (type === 'PHQ-9' && !result.phq9) result.phq9 = assessment
      else if (type === 'DASS-21' && !result.dass21) result.dass21 = assessment
      else if (type === 'C-SSRS' && !result.cssrs) result.cssrs = assessment

      const detail = type === 'C-SSRS'
        ? assessment.severity
        : `score ${assessment.totalScore}`
      console.log(`[SPN] Captured ${type} from background tab: ${detail}`)
    } catch (err) {
      console.warn(`[SPN] Background-tab assessment extraction failed for ${url}:`, err)
    }
  }

  if (!result.gad7 || !result.phq9 || !result.cssrs || !result.dass21) {
    console.log('[SPN] Auto-capture missing assessments:', {
      missing: [
        !result.gad7 ? 'GAD-7' : '',
        !result.phq9 ? 'PHQ-9' : '',
        !result.dass21 ? 'DASS-21' : '',
        !result.cssrs ? 'C-SSRS' : '',
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
    const updates = type === 'GAD-7'
      ? { gad7: result }
      : type === 'PHQ-9'
        ? { phq9: result }
        : type === 'DASS-21'
          ? { dass21: result }
          : { cssrs: result }
    await mergeIntake(updates)

    const message = type === 'C-SSRS'
      ? `Captured ${type}: ${result.severity}`
      : `Captured ${type}: score ${result.totalScore} (${result.severity})`
    showToast(message, 'success')
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
    if (assessments.cssrs) intake.cssrs = assessments.cssrs
    if (assessments.dass21) intake.dass21 = assessments.dass21

    await mergeIntake(intake)

    const extras: string[] = []
    if (assessments.gad7) extras.push(`GAD-7: ${assessments.gad7.totalScore}`)
    if (assessments.phq9) extras.push(`PHQ-9: ${assessments.phq9.totalScore}`)
    if (assessments.dass21) extras.push(`DASS-21: ${assessments.dass21.totalScore}`)
    if (assessments.cssrs) extras.push(`C-SSRS: ${assessments.cssrs.totalScore} yes`)
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

async function handleOverviewCaptureClick(): Promise<void> {
  const btn = document.getElementById('spn-overview-btn')
  const originalLabel = btn?.textContent ?? ''
  if (btn) {
    btn.classList.add('spn-btn-loading')
    btn.textContent = 'Capturing...'
  }
  try {
    assertExtensionContext()
    showToast('Capturing overview, intake form, and assessments...', 'success')

    const clicked = await expandReadMoreSections()
    const overviewClinicalNote = collectOverviewClinicalNotes()

    // Fetch assessments and intake form data in parallel via background tabs
    const intakeNoteUrls = await discoverIntakeNoteUrls()
    const [assessments, intakeFromTab] = await Promise.all([
      fetchAssessmentsFromLinks(),
      fetchIntakeFormViaTab(intakeNoteUrls),
    ])

    // Start with intake form data if we got it (has the full Q&A, demographics, etc.)
    // Only use overview page name/DOB as fallbacks — intake form data is more reliable
    const overviewName = extractClientNameFromPage()
    const overviewDob = extractDobFromPage()
    const partial: Partial<IntakeData> = {
      ...(intakeFromTab ?? {}),
      clientId: getClientIdFromUrl(),
      capturedAt: new Date().toISOString(),
      overviewClinicalNote,
    }
    // Use overview name/DOB only if intake form didn't provide them
    if (!partial.fullName && overviewName.fullName) partial.fullName = overviewName.fullName
    if (!partial.firstName && overviewName.firstName) partial.firstName = overviewName.firstName
    if (!partial.lastName && overviewName.lastName) partial.lastName = overviewName.lastName
    if (!partial.dob && overviewDob) partial.dob = overviewDob

    if (assessments.gad7) partial.gad7 = assessments.gad7
    if (assessments.phq9) partial.phq9 = assessments.phq9
    if (assessments.cssrs) partial.cssrs = assessments.cssrs
    if (assessments.dass21) partial.dass21 = assessments.dass21

    const hasProfileData =
      !!partial.fullName ||
      !!partial.firstName ||
      !!partial.dob ||
      !!overviewClinicalNote ||
      !!intakeFromTab ||
      !!assessments.gad7 ||
      !!assessments.phq9 ||
      !!assessments.dass21 ||
      !!assessments.cssrs

    if (!hasProfileData) {
      showToast('No overview note or assessment data found on this page.', 'error')
      return
    }

    await mergeIntake(partial)

    const extras: string[] = []
    if (intakeFromTab) extras.push(`intake form (${intakeFromTab.rawQA?.length ?? 0} Q&A)`)
    if (overviewClinicalNote) extras.push(`${overviewClinicalNote.split(/\n\n+/).length} note block(s)`)
    if (assessments.gad7) extras.push(`GAD-7 ${assessments.gad7.totalScore}`)
    if (assessments.phq9) extras.push(`PHQ-9 ${assessments.phq9.totalScore}`)
    if (assessments.dass21) extras.push(`DASS-21 ${assessments.dass21.totalScore}`)
    if (assessments.cssrs) extras.push(`C-SSRS ${assessments.cssrs.totalScore} yes`)
    if (clicked) extras.push(`expanded ${clicked} "Read More" section(s)`)

    const name = partial.fullName || [partial.firstName, partial.lastName].filter(Boolean).join(' ') || 'client'
    showToast(`Captured overview prep for ${name}${extras.length ? `: ${extras.join(', ')}` : ''}`, 'success')

    console.groupCollapsed(`[SPN] Captured overview prep for ${name}`)
    console.log('[SPN] Overview partial:', partial)
    console.log('[SPN] Overview clinical note:', overviewClinicalNote)
    console.log('[SPN] Intake from background tab:', intakeFromTab)
    console.log('[SPN] Assessments:', assessments)
    console.groupEnd()

    if (btn) {
      btn.classList.remove('spn-btn-loading')
      btn.classList.add('spn-btn-success')
      btn.textContent = 'Captured'
    }
  } catch (err) {
    if (btn) {
      btn.classList.remove('spn-btn-loading')
      btn.textContent = originalLabel
    }
    if (isExtensionContextInvalidatedError(err)) {
      showToast('Extension reloaded — please refresh this page.', 'error')
    } else {
      console.error('[SPN] Overview capture error:', err)
      showToast('Failed to capture overview prep.', 'error')
    }
  }
}

async function fetchIntakeFormViaTab(intakeNoteUrls: string[]): Promise<IntakeData | null> {
  // Try all intake note URLs and return the one with the most Q&A data (the DIPS form)
  let best: IntakeData | null = null
  let bestQACount = 0

  for (const url of intakeNoteUrls) {
    try {
      const absUrl = toAbsoluteUrl(url)
      if (!absUrl) continue
      console.log(`[SPN] Trying to extract intake form from background tab: ${absUrl}`)
      const response = await chrome.runtime.sendMessage({
        type: 'SPN_FETCH_INTAKE_VIA_TAB',
        url: absUrl,
      }) as { intake: IntakeData | null } | null

      if (response?.intake) {
        const qaCount = response.intake.rawQA?.length ?? 0
        console.log(`[SPN] Got intake form data from ${absUrl}: ${qaCount} Q&A pairs`)
        if (qaCount > bestQACount) {
          best = response.intake
          bestQACount = qaCount
        }
      }
    } catch (err) {
      console.warn(`[SPN] Background-tab intake extraction failed for ${url}:`, err)
    }
  }

  if (best) {
    console.log(`[SPN] Selected intake form with ${bestQACount} Q&A pairs`)
  }
  return best
}

function hasIntakeForm(): boolean {
  return !!document.querySelector('.markdown.intake-answers')
}

function hasOverviewReadMoreContent(): boolean {
  return isClientOverviewPage() && !!document.querySelector('[data-readmore-toggle], [data-test-shared-read-more], [data-readmore].markdown')
}

const CAPTURE_BUTTON_IDS = [
  'spn-capture-btn',
  'spn-treatment-plan-btn',
  'spn-assessment-btn',
  'spn-overview-btn',
]

function removeCaptureButtons(exceptId = ''): void {
  for (const id of CAPTURE_BUTTON_IDS) {
    if (id === exceptId) continue
    document.getElementById(id)?.remove()
  }
}

function injectCaptureButton(): void {
  if (!isClientPage()) {
    removeCaptureButtons()
    return
  }

  // Assessment page (GAD-7 / PHQ-9) — show assessment capture button
  if (hasAssessmentTable()) {
    removeCaptureButtons('spn-assessment-btn')
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
    removeCaptureButtons('spn-treatment-plan-btn')
    if (document.getElementById('spn-treatment-plan-btn')) return

    injectButton('Capture Treatment Plan', handleCaptureTreatmentPlan, {
      id: 'spn-treatment-plan-btn',
      position: 'bottom-right',
    })
    return
  }

  if (hasOverviewReadMoreContent()) {
    removeCaptureButtons('spn-overview-btn')
    if (document.getElementById('spn-overview-btn')) return

    injectButton('Capture Overview Prep', handleOverviewCaptureClick, {
      id: 'spn-overview-btn',
      position: 'bottom-right',
    })
    return
  }

  // Intake form page — show intake capture button
  removeCaptureButtons('spn-capture-btn')
  if (document.getElementById('spn-capture-btn')) return
  if (!hasIntakeForm()) {
    removeCaptureButtons()
    return
  }

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
    !!document.getElementById('spn-assessment-btn') ||
    !!document.getElementById('spn-overview-btn')

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

  if (msg?.type === 'SPN_EXTRACT_ASSESSMENT') {
    const type = detectAssessmentType()
    if (!type) {
      sendResponse({ type: null, assessment: null })
      return true
    }
    const assessment = extractAssessmentFromRoot(type)
    sendResponse({ type, assessment: assessment.items.length > 0 ? assessment : null })
    return true
  }

  if (msg?.type === 'SPN_EXTRACT_INTAKE') {
    if (!hasIntakeForm()) {
      sendResponse({ intake: null })
      return true
    }
    const intake = extractIntakeData()
    const fieldCount = countCapturedFields(intake)
    sendResponse({ intake: fieldCount > 0 ? intake : null })
    return true
  }
})
