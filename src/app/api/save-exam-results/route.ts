import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { saveDevExamResult } from '@/lib/dev-exam-results-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null

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
      assignmentId,
    } = body

    // Validate required fields
    if (!userId || !examType || !examMode || !questions || !selectedAnswers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Prepare record payload for Supabase or local storage fallback
    const recordPayload = {
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
      created_at: new Date().toISOString(),
    }

    let resultId: string | null = null

    if (supabase) {
      const { data, error } = await supabase
        .from('exam_results')
        .insert(recordPayload)
        .select('id')
        .single()

      if (error) {
        console.error('Error saving exam results to Supabase:', error)
      } else {
        resultId = data.id

        // If assignmentId is provided, mark the assignment as completed
        if (assignmentId) {
          const { error: assignmentError } = await supabase
            .from('user_exam_assignments')
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
              exam_result_id: data.id,
            })
            .eq('id', assignmentId)

          if (assignmentError) {
            console.error('Error updating assignment:', assignmentError)
            // Don't fail the entire request if assignment update fails
          }
        }
      }
    } else {
      console.warn(
        '[save-exam-results] SUPABASE_SERVICE_ROLE_KEY not configured. Falling back to local in-memory storage.'
      )
    }

    if (!resultId) {
      resultId = saveDevExamResult(recordPayload)
    }

    return NextResponse.json({
      success: true,
      resultId,
      storage: supabase ? 'supabase' : 'local',
    })
  } catch (error) {
    console.error('Error in save-exam-results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
