import { NextRequest, NextResponse } from 'next/server'
import { requireMobileAuth, getServiceClient } from '@/lib/server/mobile-auth'
import { applyTopicMasteryDeltas, accumulateTopicMasteryDeltas, type TopicAttempt } from '@/lib/topic-mastery'
import { applyReviewQueueUpdates, type ReviewAttempt } from '@/lib/review-queue'

type SyncOperation = {
  operation_id: string
  operation_type: string
  payload: Record<string, any>
  timestamp: string
}

type ProcessedResult = { id: string }
type FailedResult = { id: string; error: string }

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request)
    if ('error' in auth) return auth.error

    const supabase = getServiceClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const userId = auth.userId
    const body = await request.json()
    const operations: SyncOperation[] = body.operations

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { error: 'operations array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (operations.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 operations per batch' },
        { status: 400 }
      )
    }

    const processed: ProcessedResult[] = []
    const failed: FailedResult[] = []

    // Check for already-processed operation_ids (idempotency)
    const opIds = operations.map((op) => op.operation_id).filter(Boolean)
    const { data: existingOps } = await supabase
      .from('mobile_sync_queue')
      .select('operation_id')
      .in('operation_id', opIds)

    const alreadyProcessed = new Set(
      (existingOps || []).map((row: any) => row.operation_id)
    )

    for (const op of operations) {
      // Skip already-processed operations (idempotent)
      if (alreadyProcessed.has(op.operation_id)) {
        processed.push({ id: op.operation_id })
        continue
      }

      try {
        await processOperation(supabase, userId, op)
        processed.push({ id: op.operation_id })

        // Record in audit trail
        await supabase.from('mobile_sync_queue').insert({
          operation_id: op.operation_id,
          user_id: userId,
          operation_type: op.operation_type,
          payload: op.payload,
          client_timestamp: op.timestamp,
          processed_at: new Date().toISOString(),
          status: 'processed',
        })
      } catch (opError) {
        const errorMsg =
          opError instanceof Error ? opError.message : String(opError)
        console.error(
          `[mobile/sync/push] Failed operation ${op.operation_id}:`,
          errorMsg
        )
        failed.push({ id: op.operation_id, error: errorMsg })

        // Record failure in audit trail
        await supabase
          .from('mobile_sync_queue')
          .insert({
            operation_id: op.operation_id,
            user_id: userId,
            operation_type: op.operation_type,
            payload: op.payload,
            client_timestamp: op.timestamp,
            processed_at: new Date().toISOString(),
            status: 'failed',
            error_message: errorMsg,
          })
          .catch((auditErr: any) => {
            console.error('[mobile/sync/push] Audit trail insert failed:', auditErr)
          })
      }
    }

    return NextResponse.json({ processed, failed })
  } catch (error) {
    console.error('[mobile/sync/push] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processOperation(
  supabase: any,
  userId: string,
  op: SyncOperation
): Promise<void> {
  const { operation_type, payload } = op

  switch (operation_type) {
    case 'exam_result_submitted':
      await handleExamResultSubmitted(supabase, userId, payload)
      break

    case 'lesson_progress_upsert':
      await handleLessonProgressUpsert(supabase, userId, payload)
      break

    case 'quiz_result_upsert':
      await handleQuizResultUpsert(supabase, userId, payload)
      break

    case 'study_session_recorded':
      await handleStudySessionRecorded(supabase, userId, payload)
      break

    case 'widget_answer_recorded':
      await handleWidgetAnswerRecorded(supabase, userId, payload)
      break

    case 'streak_update':
      await handleStreakUpdate(supabase, userId, payload)
      break

    default:
      throw new Error(`Unknown operation_type: ${operation_type}`)
  }
}

async function handleExamResultSubmitted(
  supabase: any,
  userId: string,
  payload: Record<string, any>
): Promise<void> {
  const {
    examType,
    examMode,
    questions,
    selectedAnswers,
    flaggedQuestions,
    score,
    totalQuestions,
    topPriorities,
    allResults,
  } = payload

  // Insert exam result
  const recordPayload = {
    user_id: userId,
    exam_type: examType,
    exam_mode: examMode,
    questions,
    selected_answers: selectedAnswers,
    flagged_questions: flaggedQuestions || {},
    score,
    total_questions: totalQuestions,
    top_priorities: topPriorities || null,
    all_results: allResults || null,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('exam_results')
    .insert(recordPayload)
    .select('id')
    .single()

  if (error) throw new Error(`exam_results insert failed: ${error.message}`)

  // Upsert study priorities
  if (topPriorities && Array.isArray(topPriorities)) {
    const topDomains = topPriorities.slice(0, 3)
    await supabase
      .from('study_priorities')
      .upsert(
        {
          user_id: userId,
          top_domains: topDomains,
          exam_score: score,
          total_questions: totalQuestions,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
  }

  // Insert exam history
  if (totalQuestions) {
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0
    await supabase.from('exam_history').insert({
      user_id: userId,
      exam_type: examType,
      exam_mode: examMode,
      score: Number(percentage.toFixed(2)),
      total_questions: totalQuestions,
      correct_answers: score,
      created_at: new Date().toISOString(),
    })
  }

  // Update topic mastery
  if (Array.isArray(questions) && selectedAnswers) {
    const attempts: TopicAttempt[] = []
    questions.forEach((question: any, index: number) => {
      const selected = selectedAnswers[index]
      if (!selected) return

      const topic = question.topicName || question.topic || ''
      const domain = question.domainId || question.domain || null
      const relatedSections = Array.isArray(question.relatedSections)
        ? question.relatedSections
        : []

      attempts.push({
        topic,
        domain,
        relatedSections,
        isCorrect: selected === question.correct_answer,
        timestamp: Date.now(),
      })
    })

    const deltas = accumulateTopicMasteryDeltas(attempts)
    if (deltas.length > 0) {
      await applyTopicMasteryDeltas(supabase, userId, deltas)
    }
  }

  // Update review queue
  if (Array.isArray(questions) && selectedAnswers) {
    const reviewAttempts: ReviewAttempt[] = []
    questions.forEach((question: any, index: number) => {
      const selected = selectedAnswers[index]
      if (!selected) return
      if (question.isScored === false || question.scored === false) return

      const topic = question.topicName || question.topic || ''
      const domain = question.domainId || question.domain || null
      const relatedSections = Array.isArray(question.relatedSections)
        ? question.relatedSections
        : []

      const options = Array.isArray(question.options) ? question.options : null
      const rawCorrect =
        typeof question.correct_answer === 'string' ? question.correct_answer : ''
      let correctAnswer = rawCorrect
      if (options && /^[A-D]$/.test(rawCorrect)) {
        const idx = rawCorrect.charCodeAt(0) - 65
        correctAnswer = options[idx] ?? rawCorrect
      }

      reviewAttempts.push({
        examType,
        questionId: question.id ? String(question.id) : null,
        question: question.question ?? '',
        options,
        correctAnswer: correctAnswer || null,
        selectedAnswer: selected,
        wasCorrect: selected === correctAnswer,
        attemptedAtMs: Date.now(),
        topic: topic || null,
        domain: domain ? String(domain) : null,
        relatedSections,
        metadata: {
          examMode,
          isScored: question.isScored !== false && question.scored !== false,
          sourceFile: question.sourceFile || question.source_file || null,
          knId: question.knId || null,
          difficulty: question.difficulty || null,
        },
      })
    })

    if (reviewAttempts.length > 0) {
      await applyReviewQueueUpdates(supabase, userId, reviewAttempts)
    }
  }
}

async function handleLessonProgressUpsert(
  supabase: any,
  userId: string,
  payload: Record<string, any>
): Promise<void> {
  const { lesson_slug, progress_pct, completed, last_position, time_spent_ms } = payload

  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        user_id: userId,
        lesson_slug,
        progress_pct: progress_pct ?? 0,
        completed: completed ?? false,
        last_position: last_position ?? null,
        time_spent_ms: time_spent_ms ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_slug' }
    )

  if (error) throw new Error(`lesson_progress upsert failed: ${error.message}`)
}

async function handleQuizResultUpsert(
  supabase: any,
  userId: string,
  payload: Record<string, any>
): Promise<void> {
  const { quiz_slug, score, total_questions, answers, completed_at } = payload

  const { error } = await supabase
    .from('quiz_results')
    .insert({
      user_id: userId,
      quiz_slug,
      score,
      total_questions,
      answers: answers ?? null,
      completed_at: completed_at ?? new Date().toISOString(),
    })

  if (error) throw new Error(`quiz_results insert failed: ${error.message}`)
}

async function handleStudySessionRecorded(
  supabase: any,
  userId: string,
  payload: Record<string, any>
): Promise<void> {
  const { session_type, duration_ms, content_slug, metadata } = payload

  const { error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      session_type: session_type ?? 'general',
      duration_ms: duration_ms ?? 0,
      content_slug: content_slug ?? null,
      metadata: metadata ?? null,
      created_at: new Date().toISOString(),
    })

  if (error) throw new Error(`study_sessions insert failed: ${error.message}`)
}

async function handleWidgetAnswerRecorded(
  supabase: any,
  userId: string,
  payload: Record<string, any>
): Promise<void> {
  const { question_key, was_correct, selected_answer, correct_answer, topic, domain } = payload

  const { error } = await supabase
    .from('widget_answers')
    .insert({
      user_id: userId,
      question_key,
      was_correct: was_correct ?? false,
      selected_answer: selected_answer ?? null,
      correct_answer: correct_answer ?? null,
      topic: topic ?? null,
      domain: domain ?? null,
      created_at: new Date().toISOString(),
    })

  if (error) throw new Error(`widget_answers insert failed: ${error.message}`)
}

async function handleStreakUpdate(
  supabase: any,
  userId: string,
  payload: Record<string, any>
): Promise<void> {
  const { current_streak, longest_streak, last_study_date, study_dates } = payload

  const { error } = await supabase
    .from('study_streaks')
    .upsert(
      {
        user_id: userId,
        current_streak: current_streak ?? 0,
        longest_streak: longest_streak ?? 0,
        last_study_date: last_study_date ?? new Date().toISOString().split('T')[0],
        study_dates: study_dates ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) throw new Error(`study_streaks upsert failed: ${error.message}`)
}
