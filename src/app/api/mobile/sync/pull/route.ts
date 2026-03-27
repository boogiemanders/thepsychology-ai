import { NextRequest, NextResponse } from 'next/server'
import { requireMobileAuth, getServiceClient } from '@/lib/server/mobile-auth'

export async function GET(request: NextRequest) {
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
    const since = request.nextUrl.searchParams.get('since')

    if (!since) {
      return NextResponse.json(
        { error: 'Missing required query parameter: since (ISO timestamp)' },
        { status: 400 }
      )
    }

    // Validate timestamp format
    const sinceDate = new Date(since)
    if (isNaN(sinceDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid since parameter. Expected ISO 8601 timestamp.' },
        { status: 400 }
      )
    }

    const sinceISO = sinceDate.toISOString()

    // Fetch all rows updated after the since timestamp, in parallel
    const [
      lessonProgressRes,
      examResultsRes,
      studyPrioritiesRes,
      reviewQueueRes,
      studyStreaksRes,
    ] = await Promise.all([
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .gte('updated_at', sinceISO),
      supabase
        .from('exam_results')
        .select('id,exam_type,exam_mode,score,total_questions,top_priorities,created_at')
        .eq('user_id', userId)
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false }),
      supabase
        .from('study_priorities')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sinceISO)
        .single(),
      supabase
        .from('review_queue')
        .select('question_key,exam_type,topic,domain,section,question,options,correct_answer,last_was_correct,last_attempted,repetitions,interval_days,ease_factor,next_review_at,suspended')
        .eq('user_id', userId)
        .gte('last_attempted', sinceISO)
        .order('next_review_at', { ascending: true }),
      supabase
        .from('study_streaks')
        .select('*')
        .eq('user_id', userId)
        .gte('updated_at', sinceISO)
        .single(),
    ])

    const syncedAt = new Date().toISOString()

    return NextResponse.json({
      lesson_progress: lessonProgressRes.data || [],
      exam_results: examResultsRes.data || [],
      study_priorities: studyPrioritiesRes.data || null,
      review_queue_updates: reviewQueueRes.data || [],
      study_streaks: studyStreaksRes.data || null,
      synced_at: syncedAt,
    })
  } catch (error) {
    console.error('[mobile/sync/pull] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
