import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { saveDevExamResult } from '@/lib/dev-exam-results-store'
import { applyTopicMasteryDeltas, accumulateTopicMasteryDeltas, TopicAttempt } from '@/lib/topic-mastery'
import { applyReviewQueueUpdates, type ReviewAttempt } from '@/lib/review-queue'
import { createRecoverInsight } from '@/lib/recover-insights'
import { checkUserMilestone } from '@/lib/user-milestones'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null

async function requireAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token || !supabaseUrl || !supabaseAnonKey) return null

  const anon = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await anon.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      examType,
      examMode,
      questions,
      selectedAnswers,
      flaggedQuestions,
      score,
      totalQuestions,
      topPriorities,
      allResults,
      assignmentId,
      questionAttempts,
    } = body

    // Validate required fields
    if (!userId || !examType || !examMode || !questions || !selectedAnswers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Always enforce authentication - never skip auth checks
    const authedUserId = await requireAuthedUserId(request)
    if (!authedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (authedUserId !== userId) {
      return NextResponse.json({ error: 'User mismatch' }, { status: 403 })
    }

    // Prepare record payload for Supabase or local storage fallback
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

    let resultId: string | null = null

    if (supabase) {
      const { data, error } = await supabase
        .from('exam_results')
        .insert(recordPayload)
        .select('id')
        .single()

      if (error) {
        console.error('Error saving exam results to Supabase:', error)
      } else {
        resultId = data.id

        // Also upsert study_priorities so dashboard/topic-selector
        // can immediately reflect the latest priority focus areas.
        if (userId && topPriorities && Array.isArray(topPriorities)) {
          try {
            const topDomains = (topPriorities as any[]).slice(0, 3)
            const { error: prioritiesError } = await supabase
              .from('study_priorities')
              .upsert(
                {
                  user_id: userId,
                  top_domains: topDomains,
                  exam_score: score,
                  total_questions: totalQuestions,
                  created_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
              )

            if (prioritiesError) {
              console.error('Error upserting study_priorities in save-exam-results:', prioritiesError)
            }
          } catch (prioritiesException) {
            console.error('Exception upserting study_priorities in save-exam-results:', prioritiesException)
          }
        }

        // If assignmentId is provided, mark the assignment as completed
        if (assignmentId) {
          const { error: assignmentError } = await supabase
            .from('user_exam_assignments')
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
              exam_result_id: data.id,
            })
            .eq('id', assignmentId)

          if (assignmentError) {
            console.error('Error updating assignment:', assignmentError)
            // Don't fail the entire request if assignment update fails
          }
        }
      }

      // Store a summary row for chart-friendly analytics.
      if (userId && examType && examMode && totalQuestions) {
        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0
        try {
          const { error: historyError } = await supabase
            .from('exam_history')
            .insert({
              user_id: userId,
              exam_type: examType,
              exam_mode: examMode,
              score: Number(percentage.toFixed(2)),
              total_questions: totalQuestions,
              correct_answers: score,
              created_at: new Date().toISOString(),
            })

          if (historyError) {
            console.error('Error inserting exam_history in save-exam-results:', historyError)
          } else {
            // Check for user milestones after successful exam_history insert
            checkUserMilestone(supabase, userId, totalQuestions).catch(err => {
              console.error('Error checking user milestone:', err)
            })
          }
        } catch (historyException) {
          console.error('Exception inserting exam_history in save-exam-results:', historyException)
        }
      }

      // Store per-question exam telemetry (if provided).
      if (resultId && Array.isArray(questionAttempts) && questionAttempts.length > 0) {
        try {
          const attemptRows = questionAttempts.map((attempt: any) => ({
            exam_result_id: resultId,
            user_id: userId,
            exam_type: examType,
            exam_mode: examMode,
            question_index: typeof attempt.questionIndex === 'number' ? attempt.questionIndex : null,
            question_id: attempt.questionId ? String(attempt.questionId) : null,
            topic: attempt.topic ?? null,
            domain: attempt.domain ?? null,
            kn_id: attempt.knId ?? null,
            difficulty: attempt.difficulty ?? null,
            question: attempt.question ?? null,
            options: Array.isArray(attempt.options) ? attempt.options : null,
            selected_answer: attempt.selectedAnswer ?? null,
            correct_answer: attempt.correctAnswer ?? null,
            is_correct: attempt.isCorrect === true,
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

          const { error: attemptError } = await supabase
            .from('exam_question_attempts')
            .insert(attemptRows)

          if (attemptError) {
            console.error('Error inserting exam_question_attempts:', attemptError)
          }
        } catch (attemptException) {
          console.error('Exception inserting exam_question_attempts:', attemptException)
        }
      }

      // Update topic mastery rollups for per-topic/section progress tracking.
      if (userId && Array.isArray(questions) && selectedAnswers) {
        try {
          const attempts: TopicAttempt[] = []
          questions.forEach((question: any, index: number) => {
            const selected = selectedAnswers[index]
            if (!selected) return

            const topic = question.topicName || question.topic || question.topicName || ''
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
        } catch (masteryError) {
          console.error('Error updating topic_mastery in save-exam-results:', masteryError)
        }
      }

      // Update spaced repetition review queue (primarily wrong answers).
      if (userId && Array.isArray(questions) && selectedAnswers) {
        try {
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
            const rawCorrect = typeof question.correct_answer === 'string' ? question.correct_answer : ''
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
                assignmentId: assignmentId ?? null,
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
        } catch (reviewError) {
          console.error('Error updating review_queue in save-exam-results:', reviewError)
        }
      }

      if (userId && Array.isArray(questionAttempts) && questionAttempts.length > 0) {
        try {
          const insightAttempts = questionAttempts.map((attempt: any) => ({
            questionId: attempt.questionId ?? null,
            question: attempt.question ?? null,
            topic: attempt.topic ?? null,
            domain: attempt.domain ?? null,
            knId: attempt.knId ?? null,
            relatedSections: Array.isArray(attempt.relatedSections) ? attempt.relatedSections : null,
            difficulty: attempt.difficulty ?? null,
            isCorrect: attempt.isCorrect === true,
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
            sourceType: 'exam',
            sourceId: resultId,
            examType,
            examMode,
            questionAttempts: insightAttempts,
          })
        } catch (insightError) {
          console.error('[save-exam-results] Failed to generate Recover insight:', insightError)
        }
      }
    } else {
      console.warn(
        '[save-exam-results] SUPABASE_SERVICE_ROLE_KEY not configured. Falling back to local in-memory storage.'
      )
    }

    if (!resultId) {
      resultId = saveDevExamResult(recordPayload)
    }

    return NextResponse.json({
      success: true,
      resultId,
      storage: supabase ? 'supabase' : 'local',
    })
  } catch (error) {
    console.error('Error in save-exam-results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
