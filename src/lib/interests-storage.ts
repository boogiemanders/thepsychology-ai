// This utility handles user interests storage
// Currently uses localStorage, but can be easily migrated to database/API

const INTERESTS_KEY = 'userInterests'

export function getUserInterests(): string | null {
  if (typeof window === 'undefined') return null
  const interests = localStorage.getItem(INTERESTS_KEY)
  return interests
}

export function saveUserInterests(interests: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(INTERESTS_KEY, interests)
}

export function clearUserInterests(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(INTERESTS_KEY)
}

export function hasUserInterests(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(INTERESTS_KEY) !== null
}
