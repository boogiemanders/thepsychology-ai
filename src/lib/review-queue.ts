import type { SupabaseClient } from '@supabase/supabase-js'
import { computeQuestionKey } from '@/lib/question-key'

type ReviewExamType = 'quiz' | 'diagnostic' | 'practice'

export type ReviewAttempt = {
  examType: ReviewExamType
  questionId?: string | null
  question: string
  options?: string[] | null
  correctAnswer?: string | null
  selectedAnswer?: string | null
  wasCorrect: boolean
  attemptedAtMs?: number
  topic?: string | null
  domain?: string | null
  relatedSections?: string[] | null
  metadata?: Record<string, unknown> | null
}

type ExistingReviewRow = {
  question_key: string
  repetitions: number | null
  interval_days: number | null
  ease_factor: number | null
  suspended: boolean | null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function pickSection(relatedSections?: string[] | null): string | null {
  if (!relatedSections || relatedSections.length === 0) return null
  const first = relatedSections.find((s) => typeof s === 'string' && s.trim().length > 0)
  return first ? first.trim() : null
}

function computeNextSchedule(input: {
  existing?: ExistingReviewRow | null
  wasCorrect: boolean
  attemptedAt: Date
}) {
  const attemptedAtMs = input.attemptedAt.getTime()
  const existingReps = input.existing?.repetitions ?? 0
  const existingInterval = input.existing?.interval_days ?? 0
  const existingEf = input.existing?.ease_factor ?? 2.5

  if (!input.wasCorrect) {
    const easeFactor = clamp(existingEf - 0.2, 1.3, 2.7)
    const intervalDays = 1
    const nextReviewAt = new Date(attemptedAtMs + intervalDays * 24 * 60 * 60 * 1000)
    return { repetitions: 0, intervalDays, easeFactor, nextReviewAt }
  }

  const nextRepetitions = existingReps + 1
  const easeFactor = clamp(existingEf + 0.1, 1.3, 2.7)

  let intervalDays: number
  if (nextRepetitions === 1) intervalDays = 1
  else if (nextRepetitions === 2) intervalDays = 6
  else intervalDays = Math.round(Math.max(existingInterval, 1) * easeFactor)

  intervalDays = Math.max(intervalDays, 1)
  const nextReviewAt = new Date(attemptedAtMs + intervalDays * 24 * 60 * 60 * 1000)
  return { repetitions: nextRepetitions, intervalDays, easeFactor, nextReviewAt }
}

function chunkArray<T>(input: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.slice(i, i + size))
  }
  return chunks
}

export async function applyReviewQueueUpdates(
  supabase: SupabaseClient,
  userId: string,
  attempts: ReviewAttempt[]
): Promise<void> {
  if (!attempts || attempts.length === 0) return

  const normalized = attempts
    .filter((attempt) => attempt && typeof attempt.question === 'string' && attempt.question.trim().length > 0)
    .map((attempt) => {
      const attemptedAt = new Date(attempt.attemptedAtMs ?? Date.now())
      const questionKey = computeQuestionKey({
        question: attempt.question,
        options: Array.isArray(attempt.options) ? attempt.options : null,
        correctAnswer: typeof attempt.correctAnswer === 'string' ? attempt.correctAnswer : null,
      })

      return { ...attempt, attemptedAt, questionKey }
    })

  // De-dupe by questionKey, keeping the latest attempt.
  const latestByKey = new Map<string, (typeof normalized)[number]>()
  for (const attempt of normalized) {
    const existing = latestByKey.get(attempt.questionKey)
    if (!existing || attempt.attemptedAt.getTime() >= existing.attemptedAt.getTime()) {
      latestByKey.set(attempt.questionKey, attempt)
    }
  }

  const deduped = Array.from(latestByKey.values())
  const keys = deduped.map((a) => a.questionKey)

  for (const keyChunk of chunkArray(keys, 40)) {
    const attemptsForChunk = deduped.filter((a) => keyChunk.includes(a.questionKey))

    const { data: existingRows, error: existingError } = await supabase
      .from('review_queue')
      .select('question_key,repetitions,interval_days,ease_factor,suspended')
      .eq('user_id', userId)
      .in('question_key', keyChunk)

    if (existingError) {
      console.error('[review-queue] lookup failed:', existingError)
    }

    const existingMap = new Map<string, ExistingReviewRow>()
    ;(existingRows as ExistingReviewRow[] | null | undefined)?.forEach((row) => {
      if (row?.question_key) existingMap.set(row.question_key, row)
    })

    const upsertRows: any[] = []

    for (const attempt of attemptsForChunk) {
      const existing = existingMap.get(attempt.questionKey) ?? null

      // Keep the queue focused on wrong questions:
      // - Wrong answers always upsert (create or reset schedule).
      // - Correct answers only update if the item already exists.
      if (attempt.wasCorrect && !existing) continue

      const schedule = computeNextSchedule({
        existing,
        wasCorrect: attempt.wasCorrect,
        attemptedAt: attempt.attemptedAt,
      })

      const section = pickSection(attempt.relatedSections)

      upsertRows.push({
        user_id: userId,
        question_key: attempt.questionKey,
        exam_type: attempt.examType,
        topic: attempt.topic ?? null,
        domain: attempt.domain ?? null,
        section,
        question: attempt.question,
        options: Array.isArray(attempt.options) ? attempt.options : null,
        correct_answer: typeof attempt.correctAnswer === 'string' ? attempt.correctAnswer : null,
        last_answer: typeof attempt.selectedAnswer === 'string' ? attempt.selectedAnswer : null,
        last_was_correct: attempt.wasCorrect,
        last_attempted: attempt.attemptedAt.toISOString(),
        repetitions: schedule.repetitions,
        interval_days: schedule.intervalDays,
        ease_factor: schedule.easeFactor,
        next_review_at: schedule.nextReviewAt.toISOString(),
        suspended: existing?.suspended ?? false,
        metadata: attempt.metadata ?? null,
      })
    }

    if (upsertRows.length === 0) continue

    const { error: upsertError } = await supabase
      .from('review_queue')
      .upsert(upsertRows, { onConflict: 'user_id,question_key' })

    if (upsertError) {
      console.error('[review-queue] upsert failed:', upsertError)
    }
  }
}

