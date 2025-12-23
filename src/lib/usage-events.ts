import { getSupabaseClient } from '@/lib/supabase-server'

export type UsageEventInput = {
  userId?: string | null
  eventName: string
  endpoint?: string | null
  model?: string | null
  inputTokens?: number | null
  outputTokens?: number | null
  metadata?: Record<string, unknown> | null
}

export async function logUsageEvent(input: UsageEventInput): Promise<void> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return

  try {
    await supabase.from('usage_events').insert({
      user_id: input.userId ?? null,
      event_name: input.eventName,
      endpoint: input.endpoint ?? null,
      model: input.model ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      metadata: input.metadata ?? null,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[usage-events] Failed to log usage event:', error)
  }
}

