import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export async function getUserLanguagePreference(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_language_preference')
      .select('language')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      if (error.message && error.message.includes('relation')) {
        console.debug('Language preference table not created yet')
        return null
      }
      console.debug('Error fetching language preference:', error)
      return null
    }

    return data?.language ?? null
  } catch (error) {
    console.debug('Error fetching language preference:', error)
    return null
  }
}

export async function updateUserLanguagePreference(userId: string, language: string) {
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
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
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
        console.debug('Update error while updating language preference:', updateError)
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_language_preference')
        .insert([{ user_id: userId, language: normalizedLanguage, created_at: new Date(), updated_at: new Date() }])

      if (insertError) {
        console.debug('Insert error while inserting language preference:', insertError)
      }
    }
  } catch (error) {
    console.debug('Error updating language preference (non-fatal):', error)
  }
}

export function subscribeToUserLanguagePreferenceChanges(
  userId: string,
  callback: (language: string | null) => void
): RealtimeChannel | null {
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
