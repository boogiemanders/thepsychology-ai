// This utility handles quiz results storage and retrieval
// Stores which questions were answered incorrectly, correctly, and previously correct
//
// Dual-write: localStorage (always) + Supabase quiz_results (signed-in users).
// Supabase is source of truth for cross-device sync; localStorage is offline cache.

import { supabase } from '@/lib/supabase'

export interface WrongAnswer {
  questionId: number
  questionKey?: string
  question: string
  selectedAnswer: string
  correctAnswer: string
  relatedSections: string[]
  timestamp: number
  previouslyWrong?: boolean // Was this wrong before and now correct?

  // New fields for matching practice exam behavior
  options?: string[]        // Answer choices (A, B, C, D)
  explanation?: string      // Explanation text
  isScored?: boolean
  isResolved?: boolean      // Whether this has been answered correctly since
}

export interface CorrectAnswer {
  questionId: number
  questionKey?: string
  question: string
  correctAnswer?: string
  options?: string[]
  explanation?: string
  isScored?: boolean
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
  lastAttemptWrongAnswers?: WrongAnswer[]
  lastAttemptCorrectAnswers?: CorrectAnswer[]
}

const QUIZ_RESULTS_PREFIX = 'quizResults_'

function getQuizResultsKey(topic: string): string {
  return `${QUIZ_RESULTS_PREFIX}${topic}`
}

export function saveQuizResults(results: QuizResults): void {
  if (typeof window === 'undefined') return
  const key = getQuizResultsKey(results.topic)
  const payload = JSON.stringify(results)

  // Best-effort persistence: never let storage failures block quiz completion UX.
  try {
    localStorage.setItem(key, payload)
  } catch (error) {
    console.error('[quiz-results-storage] Failed to save quiz results:', error)
  }

  // Fire-and-forget Supabase write for signed-in users
  saveQuizResultsToSupabase(results)

  // Dispatch a custom event to notify listeners of quiz results update
  window.dispatchEvent(new CustomEvent('quiz-results-updated', {
    detail: { topic: results.topic, results }
  }))
}

/**
 * Async Supabase insert — best-effort, never blocks UI.
 * Appends a new row per attempt (table is append-only).
 */
async function saveQuizResultsToSupabase(results: QuizResults): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('quiz_results').insert({
      user_id: user.id,
      topic_name: results.topic,
      domain_id: results.domain ?? null,
      score: results.score,
      total_questions: results.totalQuestions,
      wrong_answers: results.wrongAnswers,
      correct_answers: results.correctAnswers,
      source: 'web',
      completed_at: new Date(results.timestamp).toISOString(),
    })

    if (error) {
      console.error('[quiz-results-storage] Supabase write failed:', error.message)
    }
  } catch (error) {
    console.error('[quiz-results-storage] Supabase write failed:', error)
  }
}

/**
 * Fetch all quiz results from Supabase for a signed-in user.
 * Returns empty array if not signed in or on error.
 */
export async function fetchSupabaseQuizResults(): Promise<QuizResults[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('quiz_results')
      .select('topic_name, domain_id, score, total_questions, percentage, wrong_answers, correct_answers, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    if (error || !data) return []

    return data.map((row) => ({
      topic: row.topic_name,
      domain: row.domain_id ?? undefined,
      timestamp: new Date(row.completed_at).getTime(),
      score: row.score,
      totalQuestions: row.total_questions,
      wrongAnswers: row.wrong_answers ?? [],
      correctAnswers: row.correct_answers ?? [],
    }))
  } catch {
    return []
  }
}

/**
 * One-time backfill: push localStorage quiz results to Supabase.
 * Skips topics that already exist remotely. Call once on sign-in.
 */
export async function backfillLocalToSupabase(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const localResults = getAllQuizResults()
    if (localResults.length === 0) return

    // Fetch existing remote topics to avoid duplicates
    const { data: existing } = await supabase
      .from('quiz_results')
      .select('topic_name')
      .eq('user_id', user.id)

    const remoteTopics = new Set((existing ?? []).map((r: { topic_name: string }) => r.topic_name))

    const toInsert = localResults
      .filter((r) => !remoteTopics.has(r.topic))
      .map((r) => ({
        user_id: user.id,
        topic_name: r.topic,
        domain_id: r.domain ?? null,
        score: r.score,
        total_questions: r.totalQuestions,
        wrong_answers: r.wrongAnswers,
        correct_answers: r.correctAnswers,
        source: 'web' as const,
        completed_at: new Date(r.timestamp).toISOString(),
      }))

    if (toInsert.length > 0) {
      await supabase.from('quiz_results').insert(toInsert)
    }
  } catch (error) {
    console.error('[quiz-results-storage] Backfill failed:', error)
  }
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
