// Exam History Storage and Tracking
// Tracks which exams have been completed (diagnostic/practice, study/test modes)
// Used for: default selection logic, prioritizer recommendations, progress tracking

export type ExamType = "diagnostic" | "practice"
export type ExamMode = "study" | "test"

export interface ExamCompletion {
  id: string // Unique identifier (UUID)
  userId?: string // Supabase user ID (optional for local storage)
  examType: ExamType // "diagnostic" or "practice"
  examMode: ExamMode // "study" or "test"
  score: number // Percentage score (0-100)
  totalQuestions: number // Total questions in exam
  correctAnswers: number // Number correct
  timestamp: number // When exam was completed
  topics?: string[] // Topics covered (if applicable)
}

export interface ExamHistorySummary {
  lastDiagnosticStudy?: ExamCompletion
  lastDiagnosticTest?: ExamCompletion
  lastPracticeStudy?: ExamCompletion
  lastPracticeTest?: ExamCompletion
  totalDiagnosticCompleted: number
  totalPracticeCompleted: number
  allCompletions: ExamCompletion[]
}

const EXAM_HISTORY_KEY = "examHistory"

/**
 * Save an exam completion to local storage and return the history
 */
export function saveExamCompletion(completion: Omit<ExamCompletion, "id" | "timestamp">): ExamCompletion {
  if (typeof window === "undefined") {
    return { ...completion, id: "", timestamp: Date.now() }
  }

  const examCompletion: ExamCompletion = {
    ...completion,
    id: crypto.randomUUID?.() || `exam-${Date.now()}`,
    timestamp: Date.now(),
  }

  const history = getExamHistory()
  history.allCompletions.push(examCompletion)

  localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(history.allCompletions))

  // Dispatch a custom event to notify listeners of exam history update
  window.dispatchEvent(
    new CustomEvent("exam-completed", {
      detail: { completion: examCompletion, history },
    })
  )

  return examCompletion
}

/**
 * Get the exam history summary
 */
export function getExamHistory(): ExamHistorySummary {
  if (typeof window === "undefined") {
    return {
      totalDiagnosticCompleted: 0,
      totalPracticeCompleted: 0,
      allCompletions: [],
    }
  }

  const data = localStorage.getItem(EXAM_HISTORY_KEY)
  const allCompletions: ExamCompletion[] = data ? JSON.parse(data) : []

  // Sort by timestamp descending (most recent first)
  allCompletions.sort((a, b) => b.timestamp - a.timestamp)

  // Find the most recent completion for each exam type/mode combination
  const summary: ExamHistorySummary = {
    totalDiagnosticCompleted: 0,
    totalPracticeCompleted: 0,
    allCompletions,
  }

  for (const completion of allCompletions) {
    if (completion.examType === "diagnostic") {
      summary.totalDiagnosticCompleted++
      if (completion.examMode === "study" && !summary.lastDiagnosticStudy) {
        summary.lastDiagnosticStudy = completion
      }
      if (completion.examMode === "test" && !summary.lastDiagnosticTest) {
        summary.lastDiagnosticTest = completion
      }
    } else if (completion.examType === "practice") {
      summary.totalPracticeCompleted++
      if (completion.examMode === "study" && !summary.lastPracticeStudy) {
        summary.lastPracticeStudy = completion
      }
      if (completion.examMode === "test" && !summary.lastPracticeTest) {
        summary.lastPracticeTest = completion
      }
    }
  }

  return summary
}

/**
 * Determine the recommended default selections based on exam history
 * Logic:
 * - Never taken any exam: Diagnostic + Study
 * - Taken Diagnostic (any mode): Practice + Study (to expand their knowledge)
 * - Taken both Diagnostic and Practice Study: Practice + Test (time to test knowledge)
 */
export function getRecommendedDefaults(): {
  examType: ExamType
  examMode: ExamMode
} {
  const history = getExamHistory()

  // Never taken any exam
  if (history.totalDiagnosticCompleted === 0 && history.totalPracticeCompleted === 0) {
    return { examType: "diagnostic", examMode: "study" }
  }

  // Taken Diagnostic but not Practice
  if (history.totalDiagnosticCompleted > 0 && history.totalPracticeCompleted === 0) {
    return { examType: "practice", examMode: "study" }
  }

  // Taken both Diagnostic and Practice Study mode
  if (
    history.totalDiagnosticCompleted > 0 &&
    history.totalPracticeCompleted > 0 &&
    history.lastPracticeStudy &&
    (!history.lastPracticeTest || history.lastPracticeStudy.timestamp > (history.lastPracticeTest?.timestamp || 0))
  ) {
    return { examType: "practice", examMode: "test" }
  }

  // Default fallback
  return { examType: "practice", examMode: "study" }
}

/**
 * Get the most recent exam completion of any type
 */
export function getLastExamCompletion(): ExamCompletion | null {
  const history = getExamHistory()
  return history.allCompletions.length > 0 ? history.allCompletions[0] : null
}

/**
 * Check if user has completed a specific exam type/mode combination
 */
export function hasCompletedExam(examType: ExamType, examMode: ExamMode): boolean {
  const history = getExamHistory()
  return history.allCompletions.some((c) => c.examType === examType && c.examMode === examMode)
}

/**
 * Get all exams of a specific type
 */
export function getExamsOfType(examType: ExamType): ExamCompletion[] {
  const history = getExamHistory()
  return history.allCompletions.filter((c) => c.examType === examType)
}

/**
 * Clear all exam history (for testing/reset purposes)
 */
export function clearExamHistory(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(EXAM_HISTORY_KEY)
  window.dispatchEvent(new CustomEvent("exam-history-cleared", {}))
}

/**
 * Get exam history statistics
 */
export function getExamStatistics() {
  const history = getExamHistory()

  const diagnosticScores = getExamsOfType("diagnostic").map((e) => e.score)
  const practiceScores = getExamsOfType("practice").map((e) => e.score)

  const avgDiagnosticScore = diagnosticScores.length > 0 ? diagnosticScores.reduce((a, b) => a + b) / diagnosticScores.length : 0

  const avgPracticeScore = practiceScores.length > 0 ? practiceScores.reduce((a, b) => a + b) / practiceScores.length : 0

  return {
    totalExamsCompleted: history.allCompletions.length,
    diagnosticCount: history.totalDiagnosticCompleted,
    practiceCount: history.totalPracticeCompleted,
    avgDiagnosticScore: Math.round(avgDiagnosticScore),
    avgPracticeScore: Math.round(avgPracticeScore),
    highestScore: Math.max(...history.allCompletions.map((e) => e.score), 0),
  }
}
