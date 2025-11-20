import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { parseExamFile } from '@/lib/exam-file-manager'

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
      // Load it from disk
      const { metadata, questions } = loadExamFromDisk(
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

    // Load exam data from disk
    const { metadata, questions } = loadExamFromDisk(
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
 *
 * NOTE: Only practice-exam-001.md is available for practice exams.
 * practice-exam-002.md, 003.md, and 004.md are temporarily disabled due to format issues.
 * They will be regenerated and re-enabled in a future update.
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
    // Temporarily only serve practice-exam-001.md
    // practice-exam-002, 003, 004 will be regenerated
    return [
      'practice-exam-001.md',
    ]
  }
}

/**
 * Load exam directly from disk (no HTTP round-trip needed)
 * This is much faster and more reliable than the previous HTTP fetch approach
 * For split exams (version 3+), also loads explanations from separate file
 */
function loadExamFromDisk(
  examFile: string,
  examType: 'diagnostic' | 'practice'
) {
  // First, try to load from examsGPT JSON if available.
  // This lets us use the new GPT-generated exams while keeping
  // the legacy exams/ markdown files as a safe fallback.
  try {
    const gptExam = loadExamFromGptJson(examFile, examType)
    if (gptExam) {
      return gptExam
    }
  } catch (gptError) {
    console.warn(
      `[Assign Exam] Failed to load GPT exam for ${examType} ${examFile}, falling back to legacy exams/:`,
      gptError
    )
  }

  try {
    const examsDir = join(process.cwd(), 'exams', examType)
    const filePath = join(examsDir, examFile)

    console.log(`[Assign Exam] Loading exam from disk: ${filePath}`)

    const content = readFileSync(filePath, 'utf-8')
    const examData = parseExamFile(content)

    console.log(`[Assign Exam] Successfully loaded ${examData.questions.length} questions from ${examFile}`)

    // Check if this is a split exam (version 3+) that needs explanations loaded separately
    if (examData.metadata.version >= 3 || examData.metadata.format === 'split') {
      try {
        // Load explanations from separate file
        const explanationsDir = join(process.cwd(), 'exams', 'explanations')
        const explanationFile = examFile.replace('.md', '-explanations.json')
        const explanationPath = join(explanationsDir, explanationFile)

        console.log(`[Assign Exam] Loading explanations from: ${explanationPath}`)

        const explanationContent = readFileSync(explanationPath, 'utf-8')
        const explanationData = JSON.parse(explanationContent)

        // Merge explanations into questions
        const questionsWithExplanations = examData.questions.map((q: any, idx: number) => ({
          ...q,
          explanation: explanationData.explanations[String(idx + 1)] || 'Explanation not available',
        }))

        console.log(`[Assign Exam] Successfully merged ${Object.keys(explanationData.explanations).length} explanations`)

        return {
          metadata: examData.metadata,
          questions: questionsWithExplanations,
        }
      } catch (explanationError) {
        console.warn(`[Assign Exam] Could not load explanations, using questions without explanations:`, explanationError)
        // Fall back to questions without explanations (old format)
        return {
          metadata: examData.metadata,
          questions: examData.questions,
        }
      }
    }

    // Legacy format (version 1-2) - questions already include explanations
    return {
      metadata: examData.metadata,
      questions: examData.questions,
    }
  } catch (error) {
    console.error(`[Assign Exam] Error loading exam file ${examFile}:`, error)
    throw new Error(`Failed to load exam file: ${examFile}`)
  }
}

/**
 * Try to load a GPT-generated exam from the examsGPT directory.
 * Returns null if no matching JSON file exists so callers can fall back.
 */
function loadExamFromGptJson(
  examFile: string,
  examType: 'diagnostic' | 'practice'
) {
  // Expect examFile patterns like "practice-exam-001.md" or "diagnostic-exam-002.md"
  const match = examFile.match(/(\d+)/)
  const examNumber = match ? parseInt(match[1], 10) : 1

  const gptDir =
    examType === 'practice'
      ? join(process.cwd(), 'examsGPT')
      : join(process.cwd(), 'diagnosticGPT')
  const jsonFileName =
    examType === 'practice'
      ? `practice-exam-${examNumber}.json`
      : `diagnostic-exam-${examNumber}.json`
  const jsonPath = join(gptDir, jsonFileName)

  if (!existsSync(jsonPath)) {
    // No GPT exam yet for this slot – let caller fall back
    return null
  }

  const raw = readFileSync(jsonPath, 'utf-8')
  const parsed = JSON.parse(raw)

  const questions = Array.isArray(parsed.questions) ? parsed.questions : []

  const mappedQuestions = questions.map((q: any, idx: number) => {
    const domainNumber =
      typeof q.domain === 'number'
        ? q.domain
        : typeof q.domain === 'string'
        ? parseInt(q.domain, 10)
        : undefined

    return {
      id: idx + 1,
      question: q.stem ?? q.question ?? '',
      options: q.options ?? [],
      correct_answer: q.answer ?? q.correct_answer ?? '',
      explanation: q.explanation ?? '',
      // Store domain in a consistent string format so prioritizer
      // can extract the domain number (e.g., "Domain 6")
      domain: domainNumber && !Number.isNaN(domainNumber) ? `Domain ${domainNumber}` : q.domain ?? '',
      difficulty:
        q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard'
          ? q.difficulty
          : 'medium',
      isScored: typeof q.scored === 'boolean' ? q.scored : q.isScored,
      knId: q.kn ?? q.knId,
      type: q.type ?? 'standard',
      // Preserve any extra metadata if present
      source_file: q.sourceFile ?? q.source_file,
      source_folder: q.sourceFolder ?? q.source_folder,
      question_type: q.question_type,
      is_org_psych: q.is_org_psych,
    }
  })

  const metadata = {
    exam_id: `${examType}-gpt-${examNumber}`,
    exam_type: examType,
    generated_at: parsed.meta?.generatedAt ?? new Date().toISOString(),
    question_count: mappedQuestions.length,
    version: 1,
  }

  console.log(
    `[Assign Exam] Loaded GPT ${examType} exam from examsGPT: ${jsonFileName} (${mappedQuestions.length} questions)`
  )

  return {
    metadata,
    questions: mappedQuestions,
  }
}
