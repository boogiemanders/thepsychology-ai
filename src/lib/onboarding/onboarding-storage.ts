import { supabase } from '@/lib/supabase'

const STORAGE_PREFIX = 'onboarding'

export type TourId = 'dashboard' | 'topic-teacher'

/**
 * Check if a tour should be shown to the user
 */
export async function shouldShowTour(userId: string, tourId: TourId): Promise<boolean> {
  const storageKey = tourId === 'dashboard' ? STORAGE_PREFIX : `${STORAGE_PREFIX}_${tourId}`

  // 1. Check localStorage first (instant, works offline)
  const localSkipped = localStorage.getItem(`${storageKey}_skipped_${userId}`)
  const localCompleted = localStorage.getItem(`${storageKey}_completed_${userId}`)

  if (localSkipped === 'true' || localCompleted === 'true') {
    return false
  }

  // 2. For dashboard tour, also check Supabase for authoritative state
  if (tourId === 'dashboard') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed, onboarding_skipped')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('Failed to check onboarding status from Supabase:', error)
        return true
      }

      if (data?.onboarding_completed || data?.onboarding_skipped) {
        if (data.onboarding_completed) {
          localStorage.setItem(`${storageKey}_completed_${userId}`, 'true')
        }
        if (data.onboarding_skipped) {
          localStorage.setItem(`${storageKey}_skipped_${userId}`, 'true')
        }
        return false
      }
    } catch (err) {
      console.warn('Error checking onboarding status:', err)
    }
  }

  return true
}

/**
 * Legacy function for backward compatibility
 */
export async function shouldShowOnboarding(userId: string): Promise<boolean> {
  return shouldShowTour(userId, 'dashboard')
}

/**
 * Mark a tour as completed
 */
export async function markTourComplete(userId: string, tourId: TourId): Promise<void> {
  const storageKey = tourId === 'dashboard' ? STORAGE_PREFIX : `${STORAGE_PREFIX}_${tourId}`

  // Update localStorage immediately
  localStorage.setItem(`${storageKey}_completed_${userId}`, 'true')

  // Update Supabase for dashboard tour
  if (tourId === 'dashboard') {
    try {
      await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', userId)
    } catch (err) {
      console.warn('Failed to save onboarding completion to Supabase:', err)
    }
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function markOnboardingComplete(userId: string): Promise<void> {
  return markTourComplete(userId, 'dashboard')
}

/**
 * Mark a tour as skipped
 */
export async function markTourSkipped(userId: string, tourId: TourId): Promise<void> {
  const storageKey = tourId === 'dashboard' ? STORAGE_PREFIX : `${STORAGE_PREFIX}_${tourId}`

  // Update localStorage immediately
  localStorage.setItem(`${storageKey}_skipped_${userId}`, 'true')

  // Update Supabase for dashboard tour
  if (tourId === 'dashboard') {
    try {
      await supabase
        .from('users')
        .update({
          onboarding_skipped: true,
        })
        .eq('id', userId)
    } catch (err) {
      console.warn('Failed to save onboarding skip to Supabase:', err)
    }
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function markOnboardingSkipped(userId: string): Promise<void> {
  return markTourSkipped(userId, 'dashboard')
}

/**
 * Get the current tour step from localStorage
 */
export function getCurrentTourStep(userId: string, tourId: TourId = 'dashboard'): number {
  const storageKey = tourId === 'dashboard' ? STORAGE_PREFIX : `${STORAGE_PREFIX}_${tourId}`
  const step = localStorage.getItem(`${storageKey}_step_${userId}`)
  return step ? parseInt(step, 10) : 0
}

/**
 * Save the current tour step to localStorage
 */
export function saveCurrentTourStep(userId: string, step: number, tourId: TourId = 'dashboard'): void {
  const storageKey = tourId === 'dashboard' ? STORAGE_PREFIX : `${STORAGE_PREFIX}_${tourId}`
  localStorage.setItem(`${storageKey}_step_${userId}`, step.toString())
}

/**
 * Clear the saved tour step
 */
export function clearTourStep(userId: string, tourId: TourId = 'dashboard'): void {
  const storageKey = tourId === 'dashboard' ? STORAGE_PREFIX : `${STORAGE_PREFIX}_${tourId}`
  localStorage.removeItem(`${storageKey}_step_${userId}`)
}

/**
 * Reset a tour so it can be shown again (for tutorial button)
 */
export function resetTour(userId: string, tourId: TourId): void {
  const storageKey = tourId === 'dashboard' ? STORAGE_PREFIX : `${STORAGE_PREFIX}_${tourId}`
  localStorage.removeItem(`${storageKey}_completed_${userId}`)
  localStorage.removeItem(`${storageKey}_skipped_${userId}`)
  localStorage.removeItem(`${storageKey}_step_${userId}`)
}
