import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

let languagePreferenceTableUnavailable = false

function shouldDisableLanguageFeature(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: string; message?: string }
  const code = candidate.code || ''
  const message = (candidate.message || '').toLowerCase()

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('relation') ||
    message.includes('could not find the table')
  )
}

export async function getUserLanguagePreference(userId: string): Promise<string | null> {
  if (languagePreferenceTableUnavailable) return null

  try {
    const { data, error } = await supabase
      .from('user_language_preference')
      .select('language')
      .eq('user_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      if (shouldDisableLanguageFeature(error)) {
        languagePreferenceTableUnavailable = true
      }
      if (error.message && error.message.includes('relation')) {
        console.debug('Language preference table not created yet')
        return null
      }
      console.debug('Error fetching language preference:', error)
      return null
    }

    return data?.language ?? null
  } catch (error) {
    if (shouldDisableLanguageFeature(error)) {
      languagePreferenceTableUnavailable = true
    }
    console.debug('Error fetching language preference:', error)
    return null
  }
}

export async function updateUserLanguagePreference(userId: string, language: string) {
  if (languagePreferenceTableUnavailable) return

  try {
    const normalizedLanguage = language.trim()

    if (!normalizedLanguage) {
      // We intentionally use UPDATE to clear the preference instead of DELETE.
      // The table migration includes SELECT/INSERT/UPDATE RLS policies but no DELETE policy.
      const { error: updateError } = await supabase
        .from('user_language_preference')
        .update({ language: '', updated_at: new Date() })
        .eq('user_id', userId)

      if (updateError) {
        if (shouldDisableLanguageFeature(updateError)) {
          languagePreferenceTableUnavailable = true
        }
        if (updateError.message && updateError.message.includes('relation')) {
          console.debug('Language preference table not created yet')
          return
        }
        console.debug('Update error while clearing language preference:', updateError)
      }
      return
    }

    const { data: existingPreference, error: fetchError } = await supabase
      .from('user_language_preference')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      if (shouldDisableLanguageFeature(fetchError)) {
        languagePreferenceTableUnavailable = true
      }
      if (fetchError.message && fetchError.message.includes('relation')) {
        console.debug('Language preference table not created yet')
        return
      }
      console.debug('Fetch error while updating language preference:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      })
      return
    }

    if (existingPreference) {
      const { error: updateError } = await supabase
        .from('user_language_preference')
        .update({ language: normalizedLanguage, updated_at: new Date() })
        .eq('user_id', userId)

      if (updateError) {
        if (shouldDisableLanguageFeature(updateError)) {
          languagePreferenceTableUnavailable = true
        }
        console.debug('Update error while updating language preference:', updateError)
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_language_preference')
        .insert([{ user_id: userId, language: normalizedLanguage, created_at: new Date(), updated_at: new Date() }])

      if (insertError) {
        if (shouldDisableLanguageFeature(insertError)) {
          languagePreferenceTableUnavailable = true
        }
        console.debug('Insert error while inserting language preference:', insertError)
      }
    }
  } catch (error) {
    if (shouldDisableLanguageFeature(error)) {
      languagePreferenceTableUnavailable = true
    }
    console.debug('Error updating language preference (non-fatal):', error)
  }
}

export function subscribeToUserLanguagePreferenceChanges(
  userId: string,
  callback: (language: string | null) => void
): RealtimeChannel | null {
  if (languagePreferenceTableUnavailable) return null

  try {
    const channel = supabase
      .channel(`user_language_preference_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_language_preference',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback(null)
            return
          }

          const next = (payload.new?.language as string | null | undefined) ?? null
          callback(next && next.trim().length > 0 ? next : null)
        }
      )
      .subscribe()

    return channel
  } catch (error) {
    console.error('Error subscribing to language preference changes:', error)
    return null
  }
}

export function unsubscribeFromLanguagePreferenceChanges(channel: RealtimeChannel | null) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}
