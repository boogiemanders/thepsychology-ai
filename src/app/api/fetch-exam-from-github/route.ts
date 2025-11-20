import { NextRequest, NextResponse } from 'next/server'
import { parseExamFile } from '@/lib/exam-file-manager'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * Fetch exam file from local filesystem (fast, instant access)
 * Previously fetched from GitHub which added network latency (200-500ms)
 * GET /api/fetch-exam-from-github?examFile=diagnostic-2025-01-14.md&examType=diagnostic
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examFile = searchParams.get('examFile')
    const examType = searchParams.get('examType') as 'diagnostic' | 'practice' | null

    if (!examFile || !examType) {
      return NextResponse.json(
        { error: 'Missing examFile or examType query parameters' },
        { status: 400 }
      )
    }

    // Validate exam type
    if (!['diagnostic', 'practice'].includes(examType)) {
      return NextResponse.json(
        { error: 'Invalid exam type' },
        { status: 400 }
      )
    }

    // Validate exam file name (prevent directory traversal)
    if (examFile.includes('..') || examFile.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid exam file name' },
        { status: 400 }
      )
    }

    // First try to load from examsGPT JSON if available
    const gptResult = loadExamFromGptJson(examFile, examType)
    let examData

    if (gptResult) {
      examData = gptResult
      console.log(
        `[Exam Load] Loaded GPT ${examType} exam from examsGPT for review: ${examFile} (${examData.questions.length} questions)`
      )
    } else {
      // Fall back to legacy exams/ markdown files
      const examsDir = join(process.cwd(), 'exams', examType)
      const filePath = join(examsDir, examFile)

      let content: string
      try {
        content = readFileSync(filePath, 'utf-8')
      } catch (fsError) {
        console.warn(`Exam file not found locally: ${filePath}`)
        return NextResponse.json(
          { error: 'Exam file not found', fileExists: false },
          { status: 404 }
        )
      }

      examData = parseExamFile(content)

      console.log(
        `[Exam Load] Loaded ${examType} exam from local filesystem: ${examFile} (${examData.questions.length} questions)`
      )
    }

    return NextResponse.json({
      success: true,
      fileExists: true,
      ...examData,
    })
  } catch (error) {
    console.error('Error fetching exam from filesystem:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch exam file',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Try to load a GPT-generated exam from the examsGPT directory for review.
 * Mirrors the mapping logic used by /api/assign-exam so review-exams sees the same content.
 * Returns null if no matching GPT exam exists.
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
      domain: domainNumber && !Number.isNaN(domainNumber) ? `Domain ${domainNumber}` : q.domain ?? '',
      difficulty:
        q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard'
          ? q.difficulty
          : 'medium',
      isScored: typeof q.scored === 'boolean' ? q.scored : q.isScored,
      knId: q.kn ?? q.knId,
      type: q.type ?? 'standard',
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

  return {
    metadata,
    questions: mappedQuestions,
  }
}
