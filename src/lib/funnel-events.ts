import { supabase } from '@/lib/supabase'

export async function trackFunnelEvent(
  userId: string | null | undefined,
  eventName: string,
  metadata?: Record<string, unknown>
) {
  if (!userId) return

  try {
    await supabase.from('funnel_events').insert({
      user_id: userId,
      event_name: eventName,
      metadata: metadata ?? null,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[funnel-events] Failed to track event:', error)
  }
}

