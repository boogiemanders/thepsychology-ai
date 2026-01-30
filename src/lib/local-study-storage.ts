// Utilities for clearing local, per-browser study data when switching accounts.
// This keeps quiz results, exam-history, unified-question-results, and
// priority recommendations isolated per Supabase user.

const LAST_USER_KEY = 'currentSupabaseUserId'
const HYDRATION_KEY = 'quizDataHydratedAt'

const PREFIXES_TO_CLEAR = [
  'quizResults_',
  'questionResults_',
  'sectionResults_',
  'priorityRecommendations_latest_',
  'priorityRecommendations_history',
  'examHistory',
]

export function clearAllLocalStudyData(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key) continue

    if (PREFIXES_TO_CLEAR.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key))
  // Clear hydration marker so it re-hydrates on next login
  window.localStorage.removeItem(HYDRATION_KEY)
}

/**
 * Count how many quiz results are in localStorage
 */
function countLocalQuizResults(): number {
  if (typeof window === 'undefined') return 0
  let count = 0
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (key?.startsWith('quizResults_')) count++
  }
  return count
}

/**
 * Hydrate localStorage with quiz data from the database.
 * Only runs if localStorage is empty or missing quiz data.
 */
export async function hydrateQuizDataFromServer(accessToken: string): Promise<void> {
  if (typeof window === 'undefined') return

  // Check if we already have quiz data locally
  const localCount = countLocalQuizResults()
  if (localCount > 0) {
    // Already have local data, no need to hydrate
    return
  }

  // Check if we've already tried hydrating recently (prevent repeated calls)
  const lastHydration = window.localStorage.getItem(HYDRATION_KEY)
  if (lastHydration) {
    const lastTime = parseInt(lastHydration, 10)
    const hourAgo = Date.now() - 60 * 60 * 1000
    if (lastTime > hourAgo) {
      // Hydrated within the last hour, skip
      return
    }
  }

  try {
    const response = await fetch('/api/quiz-history', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.debug('[hydrate] Failed to fetch quiz history:', response.status)
      return
    }

    const { quizResults } = await response.json()

    if (!quizResults || quizResults.length === 0) {
      // No data to hydrate
      window.localStorage.setItem(HYDRATION_KEY, Date.now().toString())
      return
    }

    // Populate localStorage with quiz results
    for (const result of quizResults) {
      const key = `quizResults_${result.topic}`
      window.localStorage.setItem(key, JSON.stringify(result))
    }

    window.localStorage.setItem(HYDRATION_KEY, Date.now().toString())
    console.debug(`[hydrate] Restored ${quizResults.length} quiz results from server`)

    // Dispatch event to notify UI components
    window.dispatchEvent(new CustomEvent('quiz-data-hydrated', {
      detail: { count: quizResults.length }
    }))
  } catch (error) {
    console.debug('[hydrate] Error hydrating quiz data:', error)
  }
}

export function handleUserSwitch(newUserId: string | null | undefined): void {
  if (typeof window === 'undefined') return

  const previousUserId = window.localStorage.getItem(LAST_USER_KEY)

  if (!newUserId) {
    // No authenticated user (logout) – keep the previousUserId marker so
    // that the *next* login can detect whether the user changed and clear.
    return
  }

  if (previousUserId && previousUserId !== newUserId) {
    clearAllLocalStudyData()
  }

  window.localStorage.setItem(LAST_USER_KEY, newUserId)
}
