// This utility handles quiz results storage and retrieval
// Stores which questions were answered incorrectly, correctly, and previously correct

export interface WrongAnswer {
  questionId: number
  question: string
  selectedAnswer: string
  correctAnswer: string
  relatedSections: string[]
  timestamp: number
  previouslyWrong?: boolean // Was this wrong before and now correct?
}

export interface CorrectAnswer {
  questionId: number
  question: string
  relatedSections: string[]
  timestamp: number
  wasPreviouslyWrong?: boolean // Was this wrong before but now correct?
}

export interface QuizResults {
  topic: string
  domain?: string
  timestamp: number
  score: number
  totalQuestions: number
  wrongAnswers: WrongAnswer[]
  correctAnswers: CorrectAnswer[]
}

const QUIZ_RESULTS_PREFIX = 'quizResults_'

function getQuizResultsKey(topic: string): string {
  return `${QUIZ_RESULTS_PREFIX}${topic}`
}

export function saveQuizResults(results: QuizResults): void {
  if (typeof window === 'undefined') return
  const key = getQuizResultsKey(results.topic)
  localStorage.setItem(key, JSON.stringify(results))
}

export function getQuizResults(topic: string): QuizResults | null {
  if (typeof window === 'undefined') return null
  const key = getQuizResultsKey(topic)
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

export function getQuizResultsByTopic(topic: string): QuizResults | null {
  return getQuizResults(topic)
}

export function clearQuizResults(topic: string): void {
  if (typeof window === 'undefined') return
  const key = getQuizResultsKey(topic)
  localStorage.removeItem(key)
}

export function getAllQuizResults(): QuizResults[] {
  if (typeof window === 'undefined') return []
  const results: QuizResults[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(QUIZ_RESULTS_PREFIX)) {
      const data = localStorage.getItem(key)
      if (data) {
        results.push(JSON.parse(data))
      }
    }
  }
  return results
}

export function hasQuizResults(topic: string): boolean {
  if (typeof window === 'undefined') return false
  const key = getQuizResultsKey(topic)
  return localStorage.getItem(key) !== null
}

export function getWrongAnswersByTopic(
  topic: string
): WrongAnswer[] {
  const results = getQuizResults(topic)
  return results ? results.wrongAnswers : []
}

export function getRecentWrongAnswers(
  topic: string,
  timeLimitMinutes: number = 60
): WrongAnswer[] {
  const results = getQuizResults(topic)
  if (!results) return []

  const now = Date.now()
  const timeLimitMs = timeLimitMinutes * 60 * 1000

  return results.wrongAnswers.filter(
    (answer) => now - answer.timestamp < timeLimitMs
  )
}
