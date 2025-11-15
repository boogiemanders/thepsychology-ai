import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Assign an exam file to a user
 * POST /api/assign-exam
 * Body: { userId: string, examType: 'diagnostic' | 'practice' }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, examType } = await request.json()

    if (!userId || !examType) {
      return NextResponse.json(
        { error: 'Missing userId or examType' },
        { status: 400 }
      )
    }

    if (!['diagnostic', 'practice'].includes(examType)) {
      return NextResponse.json(
        { error: 'Invalid exam type' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Query which exam files the user has already completed
    const { data: completedAssignments, error: queryError } = await supabase
      .from('user_exam_assignments')
      .select('exam_file')
      .eq('user_id', userId)
      .eq('exam_type', examType)
      .eq('completed', true)

    if (queryError) {
      console.error('Error querying completed assignments:', queryError)
      throw queryError
    }

    const completedFiles = new Set(
      (completedAssignments || []).map((a: any) => a.exam_file)
    )

    // TODO: Get list of available exam files for this type
    // For now, we'll need to implement a function to list available exam files
    // This could be done by:
    // 1. Reading from a static list
    // 2. Querying GitHub API
    // 3. Reading from filesystem in development

    // For MVP, we'll use a fallback approach:
    // Try common exam file naming patterns
    const availableFiles = getAvailableExamFilesList(examType)

    // Find an unused exam file
    const unusedFile = availableFiles.find(file => !completedFiles.has(file))

    if (!unusedFile) {
      // All exams have been used - need to fall back to on-demand generation
      return NextResponse.json({
        success: false,
        message: 'No unused exam files available',
        fallbackRequired: true,
        action: 'generate_on_demand',
      })
    }

    // Check if user has already been assigned this file (incomplete)
    const { data: existingAssignment, error: existingError } = await supabase
      .from('user_exam_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('exam_file', unusedFile)
      .eq('completed', false)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing assignment:', existingError)
      throw existingError
    }

    if (existingAssignment) {
      // User already has this exam assigned but not completed
      // Fetch and return it
      const { metadata, questions } = await fetchExamFromGitHub(
        unusedFile,
        examType
      )

      return NextResponse.json({
        success: true,
        assignmentId: existingAssignment.id,
        examFile: unusedFile,
        metadata,
        questions,
      })
    }

    // Create new assignment
    const { data: assignment, error: insertError } = await supabase
      .from('user_exam_assignments')
      .insert({
        user_id: userId,
        exam_type: examType,
        exam_file: unusedFile,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating assignment:', insertError)
      throw insertError
    }

    // Fetch exam data from GitHub
    const { metadata, questions } = await fetchExamFromGitHub(
      unusedFile,
      examType
    )

    return NextResponse.json({
      success: true,
      assignmentId: assignment.id,
      examFile: unusedFile,
      metadata,
      questions,
    })
  } catch (error) {
    console.error('Error assigning exam:', error)
    return NextResponse.json(
      {
        error: 'Failed to assign exam',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get list of available exam files for a type
 * Now using standardized naming convention (001-004)
 * Matches the exam generation system and allows for quick rotation
 */
function getAvailableExamFilesList(examType: 'diagnostic' | 'practice'): string[] {
  if (examType === 'diagnostic') {
    return [
      'diagnostic-exam-001.md',
      'diagnostic-exam-002.md',
      'diagnostic-exam-003.md',
      'diagnostic-exam-004.md',
    ]
  } else {
    return [
      'practice-exam-001.md',
      'practice-exam-002.md',
      'practice-exam-003.md',
      'practice-exam-004.md',
    ]
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
