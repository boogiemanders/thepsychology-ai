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

    // Fetch all user progress data in parallel
    const [
      examResultsRes,
      lessonProgressRes,
      studyPrioritiesRes,
      reviewQueueRes,
      studyStreaksRes,
      examHistoryRes,
    ] = await Promise.all([
      supabase
        .from('exam_results')
        .select('id,exam_type,exam_mode,score,total_questions,top_priorities,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('study_priorities')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('review_queue')
        .select('question_key,exam_type,topic,domain,section,question,options,correct_answer,last_was_correct,last_attempted,repetitions,interval_days,ease_factor,next_review_at,suspended')
        .eq('user_id', userId)
        .eq('suspended', false)
        .order('next_review_at', { ascending: true })
        .limit(500),
      supabase
        .from('study_streaks')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('exam_history')
        .select('id,exam_type,exam_mode,score,total_questions,correct_answers,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    return NextResponse.json({
      exam_results: examResultsRes.data || [],
      lesson_progress: lessonProgressRes.data || [],
      study_priorities: studyPrioritiesRes.data || null,
      review_queue_snapshot: reviewQueueRes.data || [],
      study_streaks: studyStreaksRes.data || null,
      exam_history: examHistoryRes.data || [],
      synced_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[mobile/sync/bootstrap] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
