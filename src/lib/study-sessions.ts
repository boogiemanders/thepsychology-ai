import { supabase } from '@/lib/supabase'

export type StudySessionInput = {
  userId: string
  feature: string
  startedAt: Date
  endedAt: Date
  durationSeconds: number
  metadata?: Record<string, unknown>
}

export async function recordStudySession(input: StudySessionInput) {
  try {
    await supabase.from('study_sessions').insert({
      user_id: input.userId,
      feature: input.feature,
      started_at: input.startedAt.toISOString(),
      ended_at: input.endedAt.toISOString(),
      duration_seconds: input.durationSeconds,
      metadata: input.metadata ?? null,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[study-sessions] Failed to record session:', error)
  }
}

