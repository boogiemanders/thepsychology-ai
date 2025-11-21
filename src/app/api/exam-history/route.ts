import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDevExamResultsForUser } from '@/lib/dev-exam-results-store'

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
    const limitParam = searchParams.get('limit')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    const limit = Math.min(
      Math.max(parseInt(limitParam ?? '10', 10) || 10, 1),
      50
    )

    if (supabase) {
      const { data, error } = await supabase
        .from('exam_results')
        .select('id, exam_type, exam_mode, score, total_questions, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching exam history from Supabase:', error)
      } else if (data) {
        return NextResponse.json({
          success: true,
          history: data.map((item) => ({
            id: item.id,
            examType: item.exam_type,
            examMode: item.exam_mode,
            score: item.score,
            totalQuestions: item.total_questions,
            createdAt: item.created_at,
          })),
          storage: 'supabase' as const,
        })
      }
    }

    const devResults = getDevExamResultsForUser(userId).slice(0, limit)
    if (devResults.length > 0) {
      return NextResponse.json({
        success: true,
        history: devResults.map(({ id, record }) => ({
          id,
          examType: record.exam_type,
          examMode: record.exam_mode,
          score: record.score,
          totalQuestions: record.total_questions,
          createdAt: record.created_at,
        })),
        storage: 'local' as const,
      })
    }

    return NextResponse.json({
      success: true,
      history: [],
      storage: supabase ? 'supabase' as const : 'local' as const,
    })
  } catch (error) {
    console.error('Error fetching exam history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
