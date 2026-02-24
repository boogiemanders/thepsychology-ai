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

    const topic = request.nextUrl.searchParams.get('topic')
    if (!topic) {
      return NextResponse.json({ error: 'Missing topic parameter' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the latest quiz attempt for this user + topic
    const { data: latestAttempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('topic', topic)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (attemptError || !latestAttempt?.id) {
      return NextResponse.json({ wrongAnswers: [] })
    }

    // Load wrong question attempts for this attempt
    const { data: wrongQuestions, error: questionsError } = await supabase
      .from('quiz_question_attempts')
      .select('question_id, question, selected_answer, correct_answer, is_correct, is_scored, related_sections, created_at')
      .eq('attempt_id', latestAttempt.id)
      .eq('is_correct', false)

    if (questionsError) {
      console.error('[quiz-question-attempts] Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to fetch question attempts' }, { status: 500 })
    }

    const wrongAnswers = (wrongQuestions || []).map((row) => ({
      questionId: row.question_id,
      questionKey: row.question_id,
      question: row.question || '',
      selectedAnswer: row.selected_answer || '',
      correctAnswer: row.correct_answer || '',
      relatedSections: Array.isArray(row.related_sections) ? row.related_sections : [],
      timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      isScored: row.is_scored !== false,
      isResolved: false,
    }))

    return NextResponse.json({ wrongAnswers })
  } catch (error) {
    console.error('[quiz-question-attempts] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
