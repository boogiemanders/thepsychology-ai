import { NextRequest, NextResponse } from 'next/server'
import { requireMobileAuth } from '@/lib/server/mobile-auth'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'

type RouteContext = { params: Promise<{ bundleId: string }> }

/**
 * Recursively find a file by slug across nested directories.
 * Returns the full path or null.
 */
async function findFileBySlug(
  baseDir: string,
  slug: string,
  extension: string
): Promise<string | null> {
  try {
    const entries = await readdir(baseDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(baseDir, entry.name)
      if (entry.isDirectory()) {
        const found = await findFileBySlug(fullPath, slug, extension)
        if (found) return found
      } else if (entry.isFile()) {
        // Match by slug: file name without extension
        const nameWithoutExt = entry.name.replace(new RegExp(`\\${extension}$`), '')
        if (nameWithoutExt === slug) {
          return fullPath
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return null
}

function computeChecksum(content: string): string {
  return createHash('md5').update(content).digest('hex')
}

/**
 * Parse frontmatter from a markdown file.
 * Returns { metadata, body } where metadata is key-value pairs.
 */
function parseFrontmatter(raw: string): { metadata: Record<string, string>; body: string } {
  const metadata: Record<string, string> = {}
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { metadata, body: raw }

  const frontmatter = match[1]
  const body = match[2]

  for (const line of frontmatter.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    metadata[key] = value
  }

  return { metadata, body }
}

/**
 * Extract section headings from markdown.
 */
function extractSections(markdown: string): string[] {
  const sections: string[] = []
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^#{1,3}\s+(.+)$/)
    if (heading) {
      sections.push(heading[1].trim())
    }
  }
  return sections
}

async function handleLesson(slug: string) {
  const baseDir = join(process.cwd(), 'topic-content-v4')
  const filePath = await findFileBySlug(baseDir, slug, '.md')
  if (!filePath) return null

  const raw = await readFile(filePath, 'utf-8')
  const { metadata, body } = parseFrontmatter(raw)
  const sections = extractSections(body)

  return {
    id: `lesson:${slug}`,
    type: 'lesson',
    title: metadata.topic_name || slug,
    domain: metadata.domain || null,
    slug: metadata.slug || slug,
    version: metadata.version || '1',
    markdown: body,
    sections,
    audioManifest: null,
  }
}

async function handleExam(slug: string) {
  // Exams are markdown-based question sets; look in topic-content-v4 or a dedicated exam dir
  const baseDir = join(process.cwd(), 'topic-content-v4')
  const filePath = await findFileBySlug(baseDir, slug, '.md')
  if (!filePath) return null

  const raw = await readFile(filePath, 'utf-8')
  const { metadata, body } = parseFrontmatter(raw)

  return {
    id: `exam:${slug}`,
    type: 'exam',
    title: metadata.topic_name || slug,
    domain: metadata.domain || null,
    markdown: body,
    version: metadata.version || '1',
  }
}

async function handleQuiz(slug: string) {
  const baseDir = join(process.cwd(), 'questionsGPT')
  const filePath = await findFileBySlug(baseDir, slug, '.json')
  if (!filePath) return null

  const raw = await readFile(filePath, 'utf-8')
  const parsed = JSON.parse(raw)

  return {
    id: `quiz:${slug}`,
    type: 'quiz',
    questions: parsed.questions || parsed,
  }
}

async function handleAudio(slug: string) {
  // Audio manifests live in public/audio/<slug>/manifest.json
  const manifestPath = join(process.cwd(), 'public', 'audio', slug, 'manifest.json')
  try {
    const raw = await readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(raw)
    return {
      id: `audio:${slug}`,
      type: 'audio',
      ...manifest,
    }
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireMobileAuth(request)
    if ('error' in auth) return auth.error

    const { bundleId } = await context.params
    const colonIdx = bundleId.indexOf(':')
    if (colonIdx === -1) {
      return NextResponse.json(
        { error: 'Invalid bundleId format. Expected type:slug (e.g., lesson:1-cerebral-cortex)' },
        { status: 400 }
      )
    }

    const type = bundleId.slice(0, colonIdx)
    const slug = bundleId.slice(colonIdx + 1)

    let result: Record<string, unknown> | null = null

    switch (type) {
      case 'lesson':
        result = await handleLesson(slug)
        break
      case 'exam':
        result = await handleExam(slug)
        break
      case 'quiz':
        result = await handleQuiz(slug)
        break
      case 'audio':
        result = await handleAudio(slug)
        break
      default:
        return NextResponse.json(
          { error: `Unknown bundle type: ${type}. Expected lesson, exam, quiz, or audio.` },
          { status: 400 }
        )
    }

    if (!result) {
      return NextResponse.json(
        { error: `Bundle not found: ${bundleId}` },
        { status: 404 }
      )
    }

    const body = JSON.stringify(result)
    const checksum = computeChecksum(body)

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Version': String((result as any).version || '1'),
        'X-Content-Checksum': checksum,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[mobile/content-bundles] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
