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

    // Update total_study_minutes and study_streak on the users table
    await updateStudyAggregates(input.userId, input.durationSeconds)
  } catch (error) {
    console.error('[study-sessions] Failed to record session:', error)
  }
}

async function updateStudyAggregates(userId: string, durationSeconds: number) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('total_study_minutes, study_streak, last_study_date')
      .eq('id', userId)
      .single()

    if (!user) return

    const additionalMinutes = Math.round(durationSeconds / 60)
    const newTotalMinutes = (user.total_study_minutes || 0) + additionalMinutes

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().slice(0, 10)

    let newStreak = user.study_streak || 0
    const lastStudyDate = user.last_study_date
      ? new Date(user.last_study_date)
      : null

    if (lastStudyDate) {
      lastStudyDate.setHours(0, 0, 0, 0)
      const lastStr = lastStudyDate.toISOString().slice(0, 10)

      if (lastStr === todayStr) {
        // Already studied today — streak unchanged
      } else {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().slice(0, 10)

        if (lastStr === yesterdayStr) {
          // Studied yesterday — extend streak
          newStreak += 1
        } else {
          // Gap — reset streak
          newStreak = 1
        }
      }
    } else {
      // First ever study session
      newStreak = 1
    }

    await supabase
      .from('users')
      .update({
        total_study_minutes: newTotalMinutes,
        study_streak: newStreak,
        last_study_date: todayStr,
      })
      .eq('id', userId)
  } catch (error) {
    console.error('[study-sessions] Failed to update study aggregates:', error)
  }
}

