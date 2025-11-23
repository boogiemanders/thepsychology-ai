// Utilities for clearing local, per-browser study data when switching accounts.
// This keeps quiz results, exam-history, unified-question-results, and
// priority recommendations isolated per Supabase user.

const LAST_USER_KEY = 'currentSupabaseUserId'

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
