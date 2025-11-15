import { NextRequest, NextResponse } from 'next/server'
import { parseExamFile, getGitHubRawUrl } from '@/lib/exam-file-manager'

/**
 * Fetch exam file from GitHub
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

    // Construct GitHub raw content URL
    const repoOwner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || 'boogiemanders'
    const repoName = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME || 'thepsychology-ai'
    const filePath = `exams/${examType}/${examFile}`
    const githubUrl = getGitHubRawUrl(repoOwner, repoName, filePath)

    // Fetch from GitHub
    const response = await fetch(githubUrl)

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Exam file not found', fileExists: false },
          { status: 404 }
        )
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const content = await response.text()

    // Parse exam file
    const examData = parseExamFile(content)

    return NextResponse.json({
      success: true,
      fileExists: true,
      ...examData,
    })
  } catch (error) {
    console.error('Error fetching exam from GitHub:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch exam file',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
