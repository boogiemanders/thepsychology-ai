import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getDevExamResult } from '@/lib/dev-exam-results-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null

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

    let storageSource: 'supabase' | 'local' | null = null

    if (supabase) {
      // Fetch exam result from Supabase
      const { data, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('id', resultId)
        .single()

      if (error) {
        console.error('Error fetching exam results from Supabase:', error)
      } else if (data) {
        storageSource = 'supabase'
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
          storage: storageSource,
        })
      }
    }

    // Fall back to local in-memory storage (dev environments without Supabase)
    const localResult = getDevExamResult(resultId)
    if (localResult) {
      storageSource = 'local'
      return NextResponse.json({
        success: true,
        results: {
          questions: localResult.questions,
          selectedAnswers: localResult.selected_answers,
          flaggedQuestions: localResult.flagged_questions,
          score: localResult.score,
          totalQuestions: localResult.total_questions,
          examType: localResult.exam_type,
          examMode: localResult.exam_mode,
          topPriorities: localResult.top_priorities,
          allResults: localResult.all_results,
        },
        storage: storageSource,
      })
    }

    return NextResponse.json(
      { error: 'Exam results not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error in get-exam-results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
