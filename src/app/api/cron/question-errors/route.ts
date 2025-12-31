import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

const ERROR_RATE_THRESHOLD = 0.7 // 70% wrong answers
const MIN_ATTEMPTS = 5 // Minimum attempts to be considered

/**
 * Question error rate alert cron endpoint.
 * Identifies questions with high wrong answer rates that may need review.
 *
 * Schedule: Monday 10am EST (0 15 * * 1 in UTC)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const hasValidSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  try {
    // Get question feedback from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: feedback, error } = await supabase
      .from('question_feedback')
      .select('question_key, question, was_correct, exam_type')
      .gte('created_at', thirtyDaysAgo)
      .not('was_correct', 'is', null)

    if (error) {
      // Table may not exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ message: 'No feedback table yet', flagged: 0 })
      }
      console.error('[question-errors] Failed to fetch feedback:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    if (!feedback || feedback.length === 0) {
      return NextResponse.json({ message: 'No feedback data', flagged: 0 })
    }

    // Aggregate by question_key
    const questionStats: Record<string, {
      key: string
      question: string
      examType: string
      total: number
      wrong: number
    }> = {}

    for (const item of feedback) {
      const key = item.question_key
      if (!questionStats[key]) {
        questionStats[key] = {
          key,
          question: item.question || '',
          examType: item.exam_type || 'unknown',
          total: 0,
          wrong: 0,
        }
      }
      questionStats[key].total++
      if (item.was_correct === false) {
        questionStats[key].wrong++
      }
    }

    // Find questions with high error rates
    const flaggedQuestions = Object.values(questionStats)
      .filter(q => q.total >= MIN_ATTEMPTS && (q.wrong / q.total) >= ERROR_RATE_THRESHOLD)
      .sort((a, b) => (b.wrong / b.total) - (a.wrong / a.total))
      .slice(0, 10) // Top 10 worst performers

    if (flaggedQuestions.length === 0) {
      return NextResponse.json({ message: 'No high-error questions found', flagged: 0 })
    }

    // Format message
    const questionList = flaggedQuestions.map((q, i) => {
      const errorRate = Math.round((q.wrong / q.total) * 100)
      const preview = q.question.slice(0, 60) + (q.question.length > 60 ? '...' : '')
      return `${i + 1}. [${q.examType}] ${errorRate}% wrong (${q.wrong}/${q.total})\n   "${preview}"`
    }).join('\n\n')

    const message = [
      `⚠️ *Question Error Rate Alert*`,
      `Found ${flaggedQuestions.length} question(s) with >${ERROR_RATE_THRESHOLD * 100}% wrong answers (min ${MIN_ATTEMPTS} attempts):`,
      '',
      questionList,
      '',
      `Review these questions for potential issues with wording, answer key, or difficulty.`,
    ].join('\n')

    await sendSlackNotification(message, 'metrics')

    return NextResponse.json({
      success: true,
      flagged: flaggedQuestions.length,
      questions: flaggedQuestions.map(q => ({
        key: q.key,
        errorRate: Math.round((q.wrong / q.total) * 100),
        attempts: q.total,
      })),
    })
  } catch (error) {
    console.error('[question-errors] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
