import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resultId = searchParams.get('id')

    if (!resultId) {
      return NextResponse.json(
        { error: 'Missing result ID' },
        { status: 400 }
      )
    }

    // Fetch exam result from Supabase
    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .eq('id', resultId)
      .single()

    if (error) {
      console.error('Error fetching exam results:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exam results' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Exam results not found' },
        { status: 404 }
      )
    }

    // Return the result data
    return NextResponse.json({
      success: true,
      results: {
        questions: data.questions,
        selectedAnswers: data.selected_answers,
        flaggedQuestions: data.flagged_questions,
        score: data.score,
        totalQuestions: data.total_questions,
        examType: data.exam_type,
        examMode: data.exam_mode,
        topPriorities: data.top_priorities,
        allResults: data.all_results,
      },
    })
  } catch (error) {
    console.error('Error in get-exam-results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
