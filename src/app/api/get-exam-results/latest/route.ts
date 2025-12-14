import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLatestDevExamResultForUser } from '@/lib/dev-exam-results-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const examType = searchParams.get('examType')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    if (supabase) {
      let query = supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', userId)

      if (examType) {
        query = query.eq('exam_type', examType)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1)

      if (error) {
        console.error('Error fetching latest exam result from Supabase:', error)
      } else if (data && data.length > 0) {
        const latest = data[0]

        return NextResponse.json({
          success: true,
          resultId: latest.id,
          results: {
            questions: latest.questions,
            selectedAnswers: latest.selected_answers,
            flaggedQuestions: latest.flagged_questions,
            score: latest.score,
            totalQuestions: latest.total_questions,
            examType: latest.exam_type,
            examMode: latest.exam_mode,
            topPriorities: latest.top_priorities,
            allResults: latest.all_results,
          },
          storage: 'supabase' as const,
        })
      }
    }

    const localResult = getLatestDevExamResultForUser(userId, examType)
    if (localResult) {
      return NextResponse.json({
        success: true,
        resultId: localResult.id,
        results: {
          questions: localResult.record.questions,
          selectedAnswers: localResult.record.selected_answers,
          flaggedQuestions: localResult.record.flagged_questions,
          score: localResult.record.score,
          totalQuestions: localResult.record.total_questions,
          examType: localResult.record.exam_type,
          examMode: localResult.record.exam_mode,
          topPriorities: localResult.record.top_priorities,
          allResults: localResult.record.all_results,
        },
        storage: 'local' as const,
      })
    }

    return NextResponse.json(
      { error: 'No exam results found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching latest exam result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
