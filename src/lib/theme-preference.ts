import { supabase } from './supabase'

let themePreferenceTableUnavailable = false

function shouldDisableThemeFeature(error: unknown): boolean {
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

export async function getUserThemePreference(userId: string): Promise<string | null> {
  if (themePreferenceTableUnavailable) return null

  try {
    const { data, error } = await supabase
      .from('user_theme_preference')
      .select('theme')
      .eq('user_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      if (shouldDisableThemeFeature(error)) {
        themePreferenceTableUnavailable = true
      }
      if (error.message && error.message.includes('relation')) {
        console.debug('Theme preference table not created yet')
        return null
      }
      console.debug('Error fetching theme preference:', error)
      return null
    }

    return data?.theme ?? null
  } catch (error) {
    if (shouldDisableThemeFeature(error)) {
      themePreferenceTableUnavailable = true
    }
    console.debug('Error fetching theme preference:', error)
    return null
  }
}

export async function updateUserThemePreference(userId: string, theme: string) {
  if (themePreferenceTableUnavailable) return

  try {
    const { data: existingPreference, error: fetchError } = await supabase
      .from('user_theme_preference')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      if (shouldDisableThemeFeature(fetchError)) {
        themePreferenceTableUnavailable = true
      }
      if (fetchError.message && fetchError.message.includes('relation')) {
        console.debug('Theme preference table not created yet')
        return
      }
      console.debug('Fetch error while updating theme preference:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      })
      return
    }

    if (existingPreference) {
      const { error: updateError } = await supabase
        .from('user_theme_preference')
        .update({ theme, updated_at: new Date() })
        .eq('user_id', userId)

      if (updateError) {
        if (shouldDisableThemeFeature(updateError)) {
          themePreferenceTableUnavailable = true
        }
        console.debug('Update error while updating theme preference:', updateError)
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_theme_preference')
        .insert([{ user_id: userId, theme, created_at: new Date(), updated_at: new Date() }])

      if (insertError) {
        if (shouldDisableThemeFeature(insertError)) {
          themePreferenceTableUnavailable = true
        }
        console.debug('Insert error while inserting theme preference:', insertError)
      }
    }
  } catch (error) {
    if (shouldDisableThemeFeature(error)) {
      themePreferenceTableUnavailable = true
    }
    console.debug('Error updating theme preference (non-fatal):', error)
  }
}
