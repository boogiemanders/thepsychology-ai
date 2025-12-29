// Unified question result tracking across all exam types (diagnostic, practice, quiz)
// Supports local storage and Supabase for cross-device sync

export interface QuestionResult {
  questionId: string // Unique identifier for the question
  question: string
  examType: 'diagnostic' | 'practice' | 'quiz'
  topic: string // Topic name this question relates to
  domain: string // Domain name
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timestamp: number
  sessionId?: string // Exam session ID
  // New fields for source tracking and org psych integration
  source_file?: string // Exact .md filename from eppp-reference
  source_folder?: string // Directory name containing the file
  question_type?: 'standard' | 'distinction' | 'difficult'
  is_org_psych?: boolean // Whether question is organizational psychology
  knId?: string // Knowledge Statement ID
  difficulty?: 'easy' | 'medium' | 'hard'
  isScored?: boolean // Whether question counts toward score
}

export interface SectionResult {
  sectionName: string // Section in the topic content where user got wrong
  topicName: string
  domain: string
  wrongCount: number
  lastAttempted: number // timestamp
  isResolved: boolean // Has user answered a question from this section correctly since?
}

const QUESTION_RESULTS_PREFIX = 'questionResults_'
const SECTION_RESULTS_PREFIX = 'sectionResults_'

function normalizeTopicStorageKey(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/^[\d\s]+/, '') // strip leading numeric prefixes like "5 6 "
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-') // normalize punctuation (/, –, …) to dashes
    .replace(/^-+|-+$/g, '')
}

function getStorageKeysForTopic(prefix: string, topic: string): string[] {
  const normalized = normalizeTopicStorageKey(topic)
  const normalizedKey = `${prefix}${normalized}`
  const legacyKey = `${prefix}${topic}`

  const keys: string[] = []

  if (localStorage.getItem(normalizedKey) != null) {
    keys.push(normalizedKey)
  }
  if (legacyKey !== normalizedKey && localStorage.getItem(legacyKey) != null) {
    keys.push(legacyKey)
  }

  // Fuzzy fallback: match any legacy key whose suffix normalizes to the same value.
  // This handles cases like "Brain Regions/Functions" vs "Brain Regions-Functions".
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(prefix)) continue
    if (keys.includes(key)) continue

    const suffix = key.slice(prefix.length)
    if (normalizeTopicStorageKey(suffix) === normalized) {
      keys.push(key)
    }
  }

  // Prefer normalized key first if present.
  return keys.sort((a, b) => {
    if (a === normalizedKey) return -1
    if (b === normalizedKey) return 1
    return 0
  })
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Save a question result from any exam type
 */
export function saveQuestionResult(result: QuestionResult): void {
  if (typeof window === 'undefined') return

  // Store in local storage
  const resultsKey = `${QUESTION_RESULTS_PREFIX}${normalizeTopicStorageKey(result.topic)}`
  const existing = getQuestionResults(result.topic)
  const updated = [...existing, result]
  localStorage.setItem(resultsKey, JSON.stringify(updated))

  // Dispatch event for listeners
  window.dispatchEvent(
    new CustomEvent('question-result-saved', {
      detail: { topic: result.topic, result },
    })
  )

  // TODO: Also save to Supabase for cross-device sync when userId available
}

/**
 * Get all question results for a topic
 */
export function getQuestionResults(topic: string): QuestionResult[] {
  if (typeof window === 'undefined') return []

  const keys = getStorageKeysForTopic(QUESTION_RESULTS_PREFIX, topic)
  if (keys.length === 0) return []

  const combined: QuestionResult[] = []
  const seen = new Set<string>()
  for (const key of keys) {
    const parsed = safeParseJson<QuestionResult[]>(localStorage.getItem(key))
    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (!entry) continue
        const fingerprint = [
          entry.questionId ?? '',
          entry.timestamp ?? 0,
          entry.examType ?? '',
          entry.selectedAnswer ?? '',
          entry.correctAnswer ?? '',
          entry.isCorrect ? '1' : '0',
        ].join('|')

        if (seen.has(fingerprint)) continue
        seen.add(fingerprint)
        combined.push(entry)
      }
    }
  }

  // Opportunistically migrate merged data to the normalized key.
  const normalizedKey = `${QUESTION_RESULTS_PREFIX}${normalizeTopicStorageKey(topic)}`
  if (keys.length > 1 || (keys.length === 1 && keys[0] !== normalizedKey)) {
    localStorage.setItem(normalizedKey, JSON.stringify(combined))
  }

  return combined
}

/**
 * Get wrong questions for a topic
 */
export function getWrongQuestions(topic: string): QuestionResult[] {
  return getQuestionResults(topic).filter((q) => !q.isCorrect)
}

/**
 * Get section results (sections with wrong answers) for a topic
 */
export function getSectionResults(topic: string): SectionResult[] {
  if (typeof window === 'undefined') return []

  const keys = getStorageKeysForTopic(SECTION_RESULTS_PREFIX, topic)
  if (keys.length === 0) return []

  const mergedByName = new Map<string, SectionResult>()

  for (const key of keys) {
    const parsed = safeParseJson<SectionResult[]>(localStorage.getItem(key))
    if (!Array.isArray(parsed)) continue

    for (const entry of parsed) {
      if (!entry?.sectionName) continue
      const existing = mergedByName.get(entry.sectionName)
      if (!existing) {
        mergedByName.set(entry.sectionName, entry)
        continue
      }

      mergedByName.set(entry.sectionName, {
        ...existing,
        wrongCount: Math.max(existing.wrongCount || 0, entry.wrongCount || 0),
        lastAttempted: Math.max(existing.lastAttempted || 0, entry.lastAttempted || 0),
        isResolved: existing.isResolved && entry.isResolved,
      })
    }
  }

  const combined = Array.from(mergedByName.values())

  // Opportunistically migrate merged data to the normalized key.
  const normalizedKey = `${SECTION_RESULTS_PREFIX}${normalizeTopicStorageKey(topic)}`
  if (keys.length > 1 || (keys.length === 1 && keys[0] !== normalizedKey)) {
    localStorage.setItem(normalizedKey, JSON.stringify(combined))
  }

  return combined
}

/**
 * Add a section result (when user gets question wrong from a specific section)
 */
export function addSectionResult(section: SectionResult): void {
  if (typeof window === 'undefined') return

  const key = `${SECTION_RESULTS_PREFIX}${normalizeTopicStorageKey(section.topicName)}`
  const existing = getSectionResults(section.topicName)

  // Check if this section already exists
  const existingIndex = existing.findIndex(
    (s) => s.sectionName === section.sectionName
  )

  if (existingIndex >= 0) {
    // Update existing
    existing[existingIndex] = {
      ...existing[existingIndex],
      wrongCount: (existing[existingIndex].wrongCount || 0) + 1,
      lastAttempted: section.lastAttempted,
    }
  } else {
    // Add new
    existing.push(section)
  }

  localStorage.setItem(key, JSON.stringify(existing))

  // Dispatch event
  window.dispatchEvent(
    new CustomEvent('section-result-updated', {
      detail: { topic: section.topicName, section },
    })
  )
}

/**
 * Mark a section as resolved (user got question from this section correct)
 */
export function resolveSectionResult(
  topic: string,
  sectionName: string
): void {
  if (typeof window === 'undefined') return

  const key = `${SECTION_RESULTS_PREFIX}${normalizeTopicStorageKey(topic)}`
  const existing = getSectionResults(topic)

  const index = existing.findIndex((s) => s.sectionName === sectionName)
  if (index >= 0) {
    existing[index].isResolved = true
    existing[index].lastAttempted = Date.now()
    localStorage.setItem(key, JSON.stringify(existing))

    window.dispatchEvent(
      new CustomEvent('section-resolved', {
        detail: { topic, sectionName },
      })
    )
  }
}

/**
 * Clear all results for a topic
 */
export function clearTopicResults(topic: string): void {
  if (typeof window === 'undefined') return

  const questionKeys = getStorageKeysForTopic(QUESTION_RESULTS_PREFIX, topic)
  const sectionKeys = getStorageKeysForTopic(SECTION_RESULTS_PREFIX, topic)

  questionKeys.forEach((key) => localStorage.removeItem(key))
  sectionKeys.forEach((key) => localStorage.removeItem(key))

  // Also remove the canonical normalized keys even if they didn't exist at scan time.
  localStorage.removeItem(`${QUESTION_RESULTS_PREFIX}${normalizeTopicStorageKey(topic)}`)
  localStorage.removeItem(`${SECTION_RESULTS_PREFIX}${normalizeTopicStorageKey(topic)}`)
}

/**
 * Get all unresolved sections (sections with wrong answers) for a topic
 * These are the sections that should show green apples
 */
export function getUnresolvedSections(topic: string): SectionResult[] {
  return getSectionResults(topic).filter((s) => !s.isResolved)
}

/**
 * Get section names from exam/diagnostic wrong answers for highlighting in topic-teacher
 * Returns array of section names that should show green apple emoji
 */
export function getExamWrongSections(topic: string): string[] {
  return getUnresolvedSections(topic).map((s) => s.sectionName)
}

/**
 * Batch import question results (useful for syncing from Supabase)
 */
export function importQuestionResults(
  topic: string,
  results: QuestionResult[]
): void {
  if (typeof window === 'undefined') return

  const key = `${QUESTION_RESULTS_PREFIX}${normalizeTopicStorageKey(topic)}`
  localStorage.setItem(key, JSON.stringify(results))

  window.dispatchEvent(
    new CustomEvent('question-results-imported', {
      detail: { topic, count: results.length },
    })
  )
}

/**
 * Batch import section results
 */
export function importSectionResults(
  topic: string,
  results: SectionResult[]
): void {
  if (typeof window === 'undefined') return

  const key = `${SECTION_RESULTS_PREFIX}${normalizeTopicStorageKey(topic)}`
  localStorage.setItem(key, JSON.stringify(results))

  window.dispatchEvent(
    new CustomEvent('section-results-imported', {
      detail: { topic, count: results.length },
    })
  )
}
