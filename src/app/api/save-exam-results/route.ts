import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    } = body

    // Validate required fields
    if (!userId || !examType || !examMode || !questions || !selectedAnswers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert exam result into Supabase
    const { data, error } = await supabase
      .from('exam_results')
      .insert({
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
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving exam results:', error)
      return NextResponse.json(
        { error: 'Failed to save exam results' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resultId: data.id,
    })
  } catch (error) {
    console.error('Error in save-exam-results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
