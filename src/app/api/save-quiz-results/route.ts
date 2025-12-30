import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-server'
import { applyTopicMasteryDeltas, accumulateTopicMasteryDeltas, TopicAttempt } from '@/lib/topic-mastery'
import { applyReviewQueueUpdates, type ReviewAttempt } from '@/lib/review-queue'
import { createRecoverInsight } from '@/lib/recover-insights'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function requireAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token || !supabaseUrl || !supabaseAnonKey) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      topic,
      domain,
      score,
      totalQuestions,
      correctQuestions,
      durationSeconds,
      questionAttempts = [],
    } = body as {
      userId?: string
      topic?: string
      domain?: string | null
      score?: number
      totalQuestions?: number
      correctQuestions?: number
      durationSeconds?: number | null
      questionAttempts?: Array<{
        questionId: string
        question: string
        options?: string[]
        selectedAnswer: string
        correctAnswer: string
        isCorrect: boolean
        isScored?: boolean
        relatedSections?: string[]
        timeSpentMs?: number | null
        visitCount?: number | null
        answerChanges?: number | null
        changedCorrectToWrong?: boolean
        changedWrongToCorrect?: boolean
        flagged?: boolean
        highlightCount?: number | null
        strikethroughCount?: number | null
      }>
    }

    if (!userId || !topic || !totalQuestions || typeof correctQuestions !== 'number') {
      return NextResponse.json({ error: 'Missing required quiz fields' }, { status: 400 })
    }

    const authedUserId = await requireAuthedUserId(request)
    if (!authedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (authedUserId !== userId) {
      return NextResponse.json({ error: 'User mismatch' }, { status: 403 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const attemptPayload = {
      user_id: userId,
      topic,
      domain: domain ?? null,
      score: typeof score === 'number' ? score : correctQuestions,
      total_questions: totalQuestions,
      correct_questions: correctQuestions,
      duration_seconds: durationSeconds ?? null,
      created_at: new Date().toISOString(),
    }

    const { data: attemptRow, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert(attemptPayload)
      .select('id')
      .single()

    if (attemptError || !attemptRow?.id) {
      console.error('[save-quiz-results] failed to insert quiz_attempts:', attemptError)
      return NextResponse.json({ error: 'Failed to save quiz attempt' }, { status: 500 })
    }

    const attemptId = attemptRow.id
    const questionRows = (questionAttempts || [])
      .filter((attempt) => attempt && attempt.questionId && attempt.selectedAnswer)
      .map((attempt) => ({
        attempt_id: attemptId,
        user_id: userId,
        topic,
        domain: domain ?? null,
        question_id: attempt.questionId,
        question: attempt.question,
        selected_answer: attempt.selectedAnswer,
        correct_answer: attempt.correctAnswer,
        is_correct: attempt.isCorrect,
        is_scored: attempt.isScored !== false,
        related_sections: Array.isArray(attempt.relatedSections) ? attempt.relatedSections : null,
        time_spent_ms: typeof attempt.timeSpentMs === 'number' ? attempt.timeSpentMs : null,
        visit_count: typeof attempt.visitCount === 'number' ? attempt.visitCount : null,
        answer_changes: typeof attempt.answerChanges === 'number' ? attempt.answerChanges : null,
        changed_correct_to_wrong: attempt.changedCorrectToWrong === true,
        changed_wrong_to_correct: attempt.changedWrongToCorrect === true,
        flagged: attempt.flagged === true,
        highlight_count: typeof attempt.highlightCount === 'number' ? attempt.highlightCount : null,
        strikethrough_count: typeof attempt.strikethroughCount === 'number' ? attempt.strikethroughCount : null,
        created_at: new Date().toISOString(),
      }))

    if (questionRows.length > 0) {
      const { error: questionError } = await supabase
        .from('quiz_question_attempts')
        .insert(questionRows)

      if (questionError) {
        console.error('[save-quiz-results] failed to insert quiz_question_attempts:', questionError)
      }
    }

    const attemptsForMastery: TopicAttempt[] = questionRows.map((attempt) => ({
      topic: attempt.topic,
      domain: attempt.domain,
      relatedSections: attempt.related_sections ?? undefined,
      isCorrect: attempt.is_correct,
      timestamp: Date.now(),
    }))

    const deltas = accumulateTopicMasteryDeltas(attemptsForMastery)
    if (deltas.length > 0) {
      await applyTopicMasteryDeltas(supabase, userId, deltas)
    }

    try {
      const reviewAttempts: ReviewAttempt[] = (questionAttempts || [])
        .filter((attempt) => attempt && attempt.questionId && attempt.selectedAnswer)
        .filter((attempt) => attempt.isScored !== false)
        .map((attempt) => ({
          examType: 'quiz',
          questionId: attempt.questionId,
          question: attempt.question,
          options: Array.isArray(attempt.options) ? attempt.options : null,
          correctAnswer: attempt.correctAnswer,
          selectedAnswer: attempt.selectedAnswer,
          wasCorrect: attempt.isCorrect,
          attemptedAtMs: Date.now(),
          topic,
          domain: domain ?? null,
          relatedSections: Array.isArray(attempt.relatedSections) ? attempt.relatedSections : null,
          metadata: {
            attemptId,
            isScored: attempt.isScored !== false,
          },
        }))

      if (reviewAttempts.length > 0) {
        await applyReviewQueueUpdates(supabase, userId, reviewAttempts)
      }
    } catch (reviewError) {
      console.error('[save-quiz-results] Failed to update review queue:', reviewError)
    }

    try {
      const insightAttempts = (questionAttempts || []).map((attempt) => ({
        questionId: attempt.questionId,
        question: attempt.question,
        topic,
        domain: domain ?? null,
        relatedSections: Array.isArray(attempt.relatedSections) ? attempt.relatedSections : null,
        isCorrect: attempt.isCorrect,
        isScored: attempt.isScored !== false,
        timeSpentMs: attempt.timeSpentMs ?? null,
        visitCount: attempt.visitCount ?? null,
        answerChanges: attempt.answerChanges ?? null,
        changedCorrectToWrong: attempt.changedCorrectToWrong ?? null,
        changedWrongToCorrect: attempt.changedWrongToCorrect ?? null,
        flagged: attempt.flagged ?? null,
        highlightCount: attempt.highlightCount ?? null,
        strikethroughCount: attempt.strikethroughCount ?? null,
      }))

      await createRecoverInsight(supabase, {
        userId,
        sourceType: 'quiz',
        sourceId: attemptId,
        topic,
        domain: domain ?? null,
        totalQuestions,
        correctQuestions,
        questionAttempts: insightAttempts,
      })
    } catch (insightError) {
      console.error('[save-quiz-results] Failed to generate Recover insight:', insightError)
    }

    return NextResponse.json({ success: true, attemptId })
  } catch (error) {
    console.error('[save-quiz-results] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
