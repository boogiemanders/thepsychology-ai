import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export async function saveUserInterest(userId: string, interest: string) {
  if (!interest.trim()) return

  try {
    // Save to current_interest
    const { data: existingInterest, error: fetchError } = await supabase
      .from('user_current_interest')
      .select('*')
      .eq('user_id', userId)
      .single()

    // PGRST116 means no rows found (expected for new users)
    // Other errors might indicate table doesn't exist or RLS issues
    if (fetchError && fetchError.code !== 'PGRST116') {
      // Log to debug console only (won't trigger error boundary)
      console.debug('Fetch error details:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      })

      // Silently handle any fetch error (tables may not exist yet)
      console.debug('Interest tables may not be created yet, or RLS policy issue. Skipping interest save.')
      return
    }

    if (existingInterest) {
      // Update existing
      const { error: updateError } = await supabase
        .from('user_current_interest')
        .update({ interest, updated_at: new Date() })
        .eq('user_id', userId)

      if (updateError) {
        console.debug('Update error:', updateError)
        // Silently skip if tables don't exist
        return
      }
    } else {
      // Create new
      const { error: insertError } = await supabase
        .from('user_current_interest')
        .insert([{ user_id: userId, interest, created_at: new Date(), updated_at: new Date() }])

      if (insertError) {
        console.debug('Insert error:', insertError)
        // Silently skip if tables don't exist
        return
      }
    }

    // Add to all_interests
    const { error: historyError } = await supabase
      .from('user_all_interests')
      .insert([{ user_id: userId, interest, created_at: new Date() }])

    if (historyError) {
      console.debug('Warning: Failed to save to interests history:', historyError)
      // Don't throw - this is secondary
    }
  } catch (error) {
    console.debug('Error saving interest:', error)
    // Don't re-throw - allow graceful degradation
  }
}

export async function getUserCurrentInterest(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_current_interest')
      .select('interest')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // Silently handle missing tables
      if (error.message && error.message.includes('relation')) {
        console.debug('Interest tables not created yet')
        return null
      }
      console.debug('Error fetching current interest:', error)
      return null
    }

    return data?.interest || null
  } catch (error) {
    console.debug('Error fetching interest:', error)
    return null
  }
}

export async function updateUserCurrentInterest(userId: string, interest: string) {
  try {
    const normalizedInterest = interest.trim()

    if (!normalizedInterest) {
      const { error: deleteError } = await supabase
        .from('user_current_interest')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        if (deleteError.message && deleteError.message.includes('relation')) {
          console.debug('Interest tables not created yet')
          return
        }
        console.debug('Delete error while clearing interest:', deleteError)
      }
      return
    }

    // Update current interest
    const { data: existingInterest, error: fetchError } = await supabase
      .from('user_current_interest')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Silently handle missing tables
      if (fetchError.message && fetchError.message.includes('relation')) {
        console.debug('Interest tables not created yet')
        return
      }
      // Log details at debug level so it doesn't surface as a client error
      console.debug('Fetch error while updating interest:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      })
      return
    }

    if (existingInterest) {
      const { error: updateError } = await supabase
        .from('user_current_interest')
        .update({ interest: normalizedInterest, updated_at: new Date() })
        .eq('user_id', userId)

      if (updateError) {
        console.debug('Update error while updating interest:', updateError)
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_current_interest')
        .insert([{ user_id: userId, interest: normalizedInterest, created_at: new Date(), updated_at: new Date() }])

      if (insertError) {
        console.debug('Insert error while inserting interest:', insertError)
      }
    }

    // Also add to all_interests history
    const { error: historyError } = await supabase
      .from('user_all_interests')
      .insert([{ user_id: userId, interest: normalizedInterest, created_at: new Date() }])

    if (historyError) {
      console.debug('History error while saving interest history:', historyError)
    }
  } catch (error) {
    console.debug('Error updating interest (non-fatal):', error)
  }
}

export function subscribeToUserInterestChanges(
  userId: string,
  callback: (interest: string | null) => void
): RealtimeChannel | null {
  try {
    const channel = supabase
      .channel(`user_interest_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_current_interest',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback(null)
          } else {
            callback(payload.new?.interest || null)
          }
        }
      )
      .subscribe()

    return channel
  } catch (error) {
    console.error('Error subscribing to interest changes:', error)
    return null
  }
}

export function unsubscribeFromInterestChanges(channel: RealtimeChannel | null) {
  if (channel) {
    supabase.removeChannel(channel)
  }
}
