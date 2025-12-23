import type { SupabaseClient } from '@supabase/supabase-js'

export type TopicAttempt = {
  topic: string
  domain?: string | null
  relatedSections?: string[] | null
  isCorrect: boolean
  timestamp: number
}

export type TopicMasteryDelta = {
  topic: string
  domain?: string | null
  section: string
  totalAttempts: number
  correctAttempts: number
  wrongAttempts: number
  lastAttempted: string
}

export function accumulateTopicMasteryDeltas(
  attempts: TopicAttempt[]
): TopicMasteryDelta[] {
  const bucket = new Map<string, TopicMasteryDelta>()

  for (const attempt of attempts) {
    const topic = attempt.topic?.trim()
    if (!topic) continue

    const sections =
      attempt.relatedSections && attempt.relatedSections.length > 0
        ? attempt.relatedSections
        : ['__ALL__']

    for (const rawSection of sections) {
      const section = rawSection?.trim() || '__ALL__'
      const key = `${topic}__${section}`
      const existing = bucket.get(key)
      const lastAttempted = new Date(attempt.timestamp).toISOString()

      if (!existing) {
        bucket.set(key, {
          topic,
          domain: attempt.domain ?? null,
          section,
          totalAttempts: 1,
          correctAttempts: attempt.isCorrect ? 1 : 0,
          wrongAttempts: attempt.isCorrect ? 0 : 1,
          lastAttempted,
        })
      } else {
        existing.totalAttempts += 1
        if (attempt.isCorrect) existing.correctAttempts += 1
        else existing.wrongAttempts += 1
        if (lastAttempted > existing.lastAttempted) {
          existing.lastAttempted = lastAttempted
        }
      }
    }
  }

  return Array.from(bucket.values())
}

export async function applyTopicMasteryDeltas(
  supabase: SupabaseClient,
  userId: string,
  deltas: TopicMasteryDelta[]
) {
  for (const delta of deltas) {
    const { data: existing, error } = await supabase
      .from('topic_mastery')
      .select('id, total_attempts, correct_attempts, wrong_attempts')
      .eq('user_id', userId)
      .eq('topic', delta.topic)
      .eq('section', delta.section)
      .maybeSingle()

    if (error) {
      console.error('[topic-mastery] lookup failed:', error)
      continue
    }

    if (existing?.id) {
      const updates = {
        total_attempts: (existing.total_attempts ?? 0) + delta.totalAttempts,
        correct_attempts: (existing.correct_attempts ?? 0) + delta.correctAttempts,
        wrong_attempts: (existing.wrong_attempts ?? 0) + delta.wrongAttempts,
        last_attempted: delta.lastAttempted,
        domain: delta.domain ?? null,
      }

      const { error: updateError } = await supabase
        .from('topic_mastery')
        .update(updates)
        .eq('id', existing.id)

      if (updateError) {
        console.error('[topic-mastery] update failed:', updateError)
      }
      continue
    }

    const { error: insertError } = await supabase
      .from('topic_mastery')
      .insert({
        user_id: userId,
        topic: delta.topic,
        domain: delta.domain ?? null,
        section: delta.section,
        total_attempts: delta.totalAttempts,
        correct_attempts: delta.correctAttempts,
        wrong_attempts: delta.wrongAttempts,
        last_attempted: delta.lastAttempted,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('[topic-mastery] insert failed:', insertError)
    }
  }
}

