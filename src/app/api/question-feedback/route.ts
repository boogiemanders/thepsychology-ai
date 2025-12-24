import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-server'
import { computeQuestionKey } from '@/lib/question-key'
import { isNotificationEmailConfigured, sendNotificationEmail } from '@/lib/notify-email'

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

type ExamType = 'quiz' | 'diagnostic' | 'practice'

function truncate(value: string, maxLen: number) {
  if (value.length <= maxLen) return value
  return `${value.slice(0, Math.max(0, maxLen - 1))}…`
}

export async function POST(request: NextRequest) {
  try {
    const authedUserId = await requireAuthedUserId(request)
    if (!authedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      examType,
      questionId,
      question,
      options,
      selectedAnswer,
      correctAnswer,
      wasCorrect,
      rating,
      confidence,
      comment,
      metadata,
    } = body as {
      examType?: ExamType
      questionId?: string | number | null
      question?: string
      options?: string[]
      selectedAnswer?: string | null
      correctAnswer?: string | null
      wasCorrect?: boolean | null
      rating?: number
      confidence?: number | null
      comment?: string | null
      metadata?: Record<string, unknown> | null
    }

    if (!examType || !['quiz', 'diagnostic', 'practice'].includes(examType)) {
      return NextResponse.json({ error: 'Invalid examType' }, { status: 400 })
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const normalizedRating = Number(rating)
    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const normalizedConfidence =
      confidence === null || confidence === undefined ? null : Number(confidence)
    if (
      normalizedConfidence !== null &&
      (!Number.isFinite(normalizedConfidence) || normalizedConfidence < 1 || normalizedConfidence > 5)
    ) {
      return NextResponse.json({ error: 'Confidence must be 1-5' }, { status: 400 })
    }

    const questionKey = computeQuestionKey({
      question,
      options: Array.isArray(options) ? options : null,
      correctAnswer: typeof correctAnswer === 'string' ? correctAnswer : null,
    })

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const payload = {
      user_id: authedUserId,
      question_key: questionKey,
      exam_type: examType,
      question_id: questionId !== undefined && questionId !== null ? String(questionId) : null,
      question,
      options: Array.isArray(options) ? options : null,
      selected_answer: typeof selectedAnswer === 'string' ? selectedAnswer : null,
      correct_answer: typeof correctAnswer === 'string' ? correctAnswer : null,
      was_correct: typeof wasCorrect === 'boolean' ? wasCorrect : null,
      rating: normalizedRating,
      confidence: normalizedConfidence,
      comment: typeof comment === 'string' ? comment : null,
      metadata: metadata ?? null,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('question_feedback').insert(payload)
    if (error) {
      console.error('[question-feedback] insert failed:', error)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    if (isNotificationEmailConfigured()) {
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', authedUserId)
          .maybeSingle()

        const userEmail = userProfile?.email ?? 'unknown'
        const fullName = userProfile?.full_name ?? null

        const subject = `[Question Feedback] ${normalizedRating}/5 • ${examType} • ${userEmail}`
        const textLines = [
          `New question feedback submitted`,
          `- Time: ${payload.created_at}`,
          `- Exam type: ${examType}`,
          `- User: ${userEmail}${fullName ? ` (${fullName})` : ''}`,
          `- User ID: ${authedUserId}`,
          `- Question key: ${questionKey}`,
          `- Question ID: ${payload.question_id ?? 'n/a'}`,
          `- Rating (quality): ${normalizedRating}/5`,
          `- Was correct: ${payload.was_correct === null ? 'n/a' : payload.was_correct ? 'yes' : 'no'}`,
          `- Selected answer: ${payload.selected_answer ?? 'n/a'}`,
          `- Correct answer: ${payload.correct_answer ?? 'n/a'}`,
          '',
          'Question:',
          truncate(question.trim(), 1200),
        ]

        if (Array.isArray(payload.options) && payload.options.length > 0) {
          textLines.push('', 'Answer choices:')
          payload.options.slice(0, 12).forEach((opt, idx) => {
            textLines.push(`${idx + 1}. ${truncate(String(opt), 300)}`)
          })
          if (payload.options.length > 12) {
            textLines.push(`... (${payload.options.length - 12} more)`)
          }
        }

        if (payload.comment) {
          textLines.push('', 'Comment:', truncate(payload.comment, 2000))
        }

        await sendNotificationEmail({
          subject,
          text: textLines.join('\n'),
        })
      } catch (emailError) {
        console.error('[question-feedback] email notify failed (continuing):', emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[question-feedback] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
