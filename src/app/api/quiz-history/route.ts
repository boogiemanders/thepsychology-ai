import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getAuthedUserId(req: NextRequest): Promise<string | null> {
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

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all quiz attempts for this user, ordered by created_at desc
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('topic, domain, score, total_questions, correct_questions, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (attemptsError) {
      console.error('[quiz-history] Error fetching attempts:', attemptsError)
      return NextResponse.json({ error: 'Failed to fetch quiz history' }, { status: 500 })
    }

    // Group by topic, keeping only the latest attempt per topic
    const latestByTopic = new Map<string, any>()
    for (const attempt of attempts || []) {
      if (!latestByTopic.has(attempt.topic)) {
        latestByTopic.set(attempt.topic, {
          topic: attempt.topic,
          domain: attempt.domain,
          score: attempt.correct_questions,
          totalQuestions: attempt.total_questions,
          timestamp: new Date(attempt.created_at).getTime(),
          wrongAnswers: [],
          correctAnswers: [],
        })
      }
    }

    const quizResults = Array.from(latestByTopic.values())

    return NextResponse.json({ quizResults })
  } catch (error) {
    console.error('[quiz-history] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
