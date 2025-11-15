import { NextRequest, NextResponse } from 'next/server'
import { parseExamFile } from '@/lib/exam-file-manager'
import { readFileSync } from 'fs'
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

    // Read from local filesystem (instant access, no network latency)
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

    // Parse exam file
    const examData = parseExamFile(content)

    console.log(`[Exam Load] Loaded ${examType} exam from local filesystem: ${examFile} (${examData.questions.length} questions)`)

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
