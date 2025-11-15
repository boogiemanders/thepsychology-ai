/**
 * Exam File Manager
 * Handles loading and parsing exam .md files from GitHub
 */

export interface ExamFileMetadata {
  exam_id: string
  exam_type: 'diagnostic' | 'practice'
  generated_at: string
  question_count: number
  version: number
}

export interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  domain: string
  difficulty: 'easy' | 'medium' | 'hard'
  isScored?: boolean
  knId?: string
  type?: string
}

export interface ExamData {
  metadata: ExamFileMetadata
  questions: Question[]
}

/**
 * Parse frontmatter from markdown file
 */
export function parseFrontmatter(content: string): { metadata: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    throw new Error('Invalid frontmatter format')
  }

  const metadataStr = match[1]
  const body = match[2]

  // Parse YAML manually (simple key: value format)
  const metadata: Record<string, any> = {}
  metadataStr.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim()
      // Remove quotes if present
      let parsedValue: any = value.replace(/^['"]|['"]$/g, '')
      // Parse numbers
      if (!isNaN(parsedValue as any)) {
        parsedValue = Number(parsedValue)
      }
      // Parse booleans
      if (parsedValue === 'true') parsedValue = true
      if (parsedValue === 'false') parsedValue = false
      metadata[key.trim()] = parsedValue
    }
  })

  return { metadata, body }
}

/**
 * Parse exam data from markdown content
 */
export function parseExamFile(content: string): ExamData {
  const { metadata, body } = parseFrontmatter(content)

  // Parse JSON questions from body
  const questions = JSON.parse(body).questions || JSON.parse(body)

  return {
    metadata: metadata as ExamFileMetadata,
    questions: questions as Question[],
  }
}

/**
 * Format exam data as markdown with frontmatter
 */
export function formatExamFile(metadata: ExamFileMetadata, questions: Question[]): string {
  const frontmatter = `---
exam_id: ${metadata.exam_id}
exam_type: ${metadata.exam_type}
generated_at: ${metadata.generated_at}
question_count: ${metadata.question_count}
version: ${metadata.version}
---`

  const body = JSON.stringify({ questions }, null, 2)

  return `${frontmatter}\n\n${body}`
}

/**
 * Get exam file path from exam_id
 */
export function getExamFilePath(exam_id: string, exam_type: 'diagnostic' | 'practice'): string {
  return `exams/${exam_type}/${exam_id}.md`
}

/**
 * Get GitHub raw content URL
 */
export function getGitHubRawUrl(repoOwner: string, repoName: string, filePath: string): string {
  return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${filePath}`
}

/**
 * List available exam files in a directory
 * This would typically be done by checking the Git repository
 */
export async function getAvailableExamFiles(
  examType: 'diagnostic' | 'practice'
): Promise<string[]> {
  // This function would need access to the git repository
  // For now, it returns an empty array - will be implemented with actual file listing
  // Can be done via:
  // 1. GitHub API to list files in directory
  // 2. Reading from local filesystem in development
  // 3. Pre-computed list from build process
  return []
}
