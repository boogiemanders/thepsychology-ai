import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Get user's completed exams with all details
 * GET /api/user-completed-exams?userId=xxxxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId query parameter' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Query completed assignments
    const { data: assignments, error: queryError } = await supabase
      .from('user_exam_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('completed_at', { ascending: false })

    if (queryError) {
      console.error('Error querying completed assignments:', queryError)
      throw queryError
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        success: true,
        completedExams: [],
      })
    }

    // Fetch exam details for each completed exam
    const completedExams = await Promise.all(
      assignments.map(async (assignment: any) => {
        try {
          const examData = await fetchExamFromGitHub(
            assignment.exam_file,
            assignment.exam_type
          )

          return {
            assignmentId: assignment.id,
            examFile: assignment.exam_file,
            examType: assignment.exam_type,
            assignedAt: assignment.assigned_at,
            completedAt: assignment.completed_at,
            score: assignment.score,
            metadata: examData.metadata,
            questions: examData.questions,
          }
        } catch (error) {
          console.error(
            `Error fetching exam ${assignment.exam_file}:`,
            error
          )
          return {
            assignmentId: assignment.id,
            examFile: assignment.exam_file,
            examType: assignment.exam_type,
            assignedAt: assignment.assigned_at,
            completedAt: assignment.completed_at,
            score: assignment.score,
            error: 'Failed to load exam details',
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      completedExams,
    })
  } catch (error) {
    console.error('Error getting completed exams:', error)
    return NextResponse.json(
      {
        error: 'Failed to get completed exams',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Fetch exam from GitHub
 */
async function fetchExamFromGitHub(
  examFile: string,
  examType: 'diagnostic' | 'practice'
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fetch-exam-from-github?examFile=${examFile}&examType=${examType}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch exam: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    metadata: data.metadata,
    questions: data.questions,
  }
}
