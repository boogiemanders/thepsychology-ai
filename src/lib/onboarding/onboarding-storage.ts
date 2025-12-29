import { supabase } from '@/lib/supabase'

const STORAGE_PREFIX = 'onboarding'

/**
 * Check if the onboarding tour should be shown to the user
 */
export async function shouldShowOnboarding(userId: string): Promise<boolean> {
  // 1. Check localStorage first (instant, works offline)
  const localSkipped = localStorage.getItem(`${STORAGE_PREFIX}_skipped_${userId}`)
  const localCompleted = localStorage.getItem(`${STORAGE_PREFIX}_completed_${userId}`)

  if (localSkipped === 'true' || localCompleted === 'true') {
    return false
  }

  // 2. Check Supabase for authoritative state
  try {
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_skipped')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn('Failed to check onboarding status from Supabase:', error)
      return true // Default to showing tour if we can't check
    }

    if (data?.onboarding_completed || data?.onboarding_skipped) {
      // Sync to localStorage for future fast checks
      if (data.onboarding_completed) {
        localStorage.setItem(`${STORAGE_PREFIX}_completed_${userId}`, 'true')
      }
      if (data.onboarding_skipped) {
        localStorage.setItem(`${STORAGE_PREFIX}_skipped_${userId}`, 'true')
      }
      return false
    }
  } catch (err) {
    console.warn('Error checking onboarding status:', err)
  }

  return true
}

/**
 * Mark the onboarding tour as completed
 */
export async function markOnboardingComplete(userId: string): Promise<void> {
  // Update localStorage immediately
  localStorage.setItem(`${STORAGE_PREFIX}_completed_${userId}`, 'true')

  // Update Supabase in background
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

/**
 * Mark the onboarding tour as skipped
 */
export async function markOnboardingSkipped(userId: string): Promise<void> {
  // Update localStorage immediately
  localStorage.setItem(`${STORAGE_PREFIX}_skipped_${userId}`, 'true')

  // Update Supabase in background
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

/**
 * Get the current tour step from localStorage
 */
export function getCurrentTourStep(userId: string): number {
  const step = localStorage.getItem(`${STORAGE_PREFIX}_step_${userId}`)
  return step ? parseInt(step, 10) : 0
}

/**
 * Save the current tour step to localStorage
 */
export function saveCurrentTourStep(userId: string, step: number): void {
  localStorage.setItem(`${STORAGE_PREFIX}_step_${userId}`, step.toString())
}

/**
 * Clear the saved tour step
 */
export function clearTourStep(userId: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}_step_${userId}`)
}
