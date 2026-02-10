// Utilities for clearing local, per-browser study data when switching accounts.
// This keeps quiz results, exam-history, unified-question-results, and
// priority recommendations isolated per Supabase user.

import {
  safeLocalStorageGetItem,
  safeLocalStorageRemoveItem,
  safeLocalStorageSetItem,
} from '@/lib/safe-storage'

const LAST_USER_KEY = 'currentSupabaseUserId'
const HYDRATION_KEY = 'quizDataHydratedAt'
const QUIZ_RESULTS_PREFIX = 'quizResults_'
const HYDRATION_COOLDOWN_MS = 60 * 1000

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
  safeLocalStorageRemoveItem(HYDRATION_KEY)
}

/**
 * Hydrate localStorage with quiz data from the database.
 * Merges server data into local data so progress survives browser switches.
 */
export async function hydrateQuizDataFromServer(accessToken: string): Promise<void> {
  if (typeof window === 'undefined') return

  // Check if we've already tried hydrating recently (prevent repeated calls)
  const lastHydration = safeLocalStorageGetItem(HYDRATION_KEY)
  if (lastHydration) {
    const lastTime = parseInt(lastHydration, 10)
    const cooldownCutoff = Date.now() - HYDRATION_COOLDOWN_MS
    if (lastTime > cooldownCutoff) {
      // Hydrated recently, skip to prevent duplicate calls from rapid auth events.
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

    if (!quizResults || quizResults.length === 0 || !Array.isArray(quizResults)) {
      // No data to hydrate
      safeLocalStorageSetItem(HYDRATION_KEY, Date.now().toString())
      return
    }

    let mergedCount = 0

    // Merge server quiz results into localStorage.
    for (const result of quizResults) {
      if (!result?.topic) continue

      const key = `${QUIZ_RESULTS_PREFIX}${result.topic}`
      const serverTimestamp = Number(result.timestamp) || 0

      let localTimestamp = 0
      const localRaw = safeLocalStorageGetItem(key)
      if (localRaw) {
        try {
          const localParsed = JSON.parse(localRaw)
          localTimestamp = Number(localParsed?.timestamp) || 0
        } catch {
          localTimestamp = 0
        }
      }

      // Prefer the newest attempt for each topic.
      if (!localRaw || serverTimestamp >= localTimestamp) {
        safeLocalStorageSetItem(key, JSON.stringify(result))
        mergedCount += 1
      }
    }

    safeLocalStorageSetItem(HYDRATION_KEY, Date.now().toString())
    console.debug(`[hydrate] Synced ${mergedCount}/${quizResults.length} quiz results from server`)

    // Dispatch event to notify UI components
    window.dispatchEvent(new CustomEvent('quiz-data-hydrated', {
      detail: { count: mergedCount, totalFromServer: quizResults.length }
    }))

    if (mergedCount > 0) {
      // Keep existing listeners (dashboard, quizzer, etc.) in sync without refresh.
      window.dispatchEvent(new CustomEvent('quiz-results-updated', {
        detail: { source: 'server-hydration', count: mergedCount }
      }))
    }
  } catch (error) {
    console.debug('[hydrate] Error hydrating quiz data:', error)
  }
}

export function handleUserSwitch(newUserId: string | null | undefined): void {
  if (typeof window === 'undefined') return

  const previousUserId = safeLocalStorageGetItem(LAST_USER_KEY)

  if (!newUserId) {
    // No authenticated user (logout) – keep the previousUserId marker so
    // that the *next* login can detect whether the user changed and clear.
    return
  }

  if (previousUserId && previousUserId !== newUserId) {
    clearAllLocalStudyData()
  }

  safeLocalStorageSetItem(LAST_USER_KEY, newUserId)
}
