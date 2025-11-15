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

/**
 * Save a question result from any exam type
 */
export function saveQuestionResult(result: QuestionResult): void {
  if (typeof window === 'undefined') return

  // Store in local storage
  const resultsKey = `${QUESTION_RESULTS_PREFIX}${result.topic}`
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

  const key = `${QUESTION_RESULTS_PREFIX}${topic}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
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

  const key = `${SECTION_RESULTS_PREFIX}${topic}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

/**
 * Add a section result (when user gets question wrong from a specific section)
 */
export function addSectionResult(section: SectionResult): void {
  if (typeof window === 'undefined') return

  const key = `${SECTION_RESULTS_PREFIX}${section.topicName}`
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

  const key = `${SECTION_RESULTS_PREFIX}${topic}`
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

  localStorage.removeItem(`${QUESTION_RESULTS_PREFIX}${topic}`)
  localStorage.removeItem(`${SECTION_RESULTS_PREFIX}${topic}`)
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

  const key = `${QUESTION_RESULTS_PREFIX}${topic}`
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

  const key = `${SECTION_RESULTS_PREFIX}${topic}`
  localStorage.setItem(key, JSON.stringify(results))

  window.dispatchEvent(
    new CustomEvent('section-results-imported', {
      detail: { topic, count: results.length },
    })
  )
}
