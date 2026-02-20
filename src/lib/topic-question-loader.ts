import fs from 'fs'
import path from 'path'
import { DOMAIN_FOLDER_MAP, DOMAIN_NUMBER_MAP, findTopicFile } from './topic-paths'

const QUESTIONS_DIR = path.join(process.cwd(), 'questionsGPT')

export interface TopicQuestion {
  stem?: string
  question?: string
  options?: string[]
  answer?: string
  correct_answer?: string
  explanation?: string
  relatedSections?: string[]
  is_lock_in_drill?: boolean
  lock_in_level?: string
  tags?: string[]
}

export interface LoadedTopicQuestions {
  filePath: string
  questions: TopicQuestion[]
}

function normalizeTopicLookupKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/^(?:\d+[\s-]+)+/, '')
    .replace(/[&]/g, 'and')
    .replace(/\band\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseFrontmatterField(markdown: string, field: string): string | null {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return null

  const lines = match[1].split('\n')
  const needle = `${field}:`
  for (const line of lines) {
    if (!line.startsWith(needle)) continue
    const raw = line.slice(needle.length).trim()
    if (!raw) return null
    return raw.replace(/^["']|["']$/g, '')
  }

  return null
}

function findQuestionFileByAlias(
  aliasBaseName: string,
  domainId: string
): string | null {
  const domainFolder = DOMAIN_FOLDER_MAP[domainId]
  if (!domainFolder) return null

  const folderPath = path.join(QUESTIONS_DIR, domainFolder)
  if (!fs.existsSync(folderPath)) return null

  const targetKey = normalizeTopicLookupKey(aliasBaseName)
  if (!targetKey) return null

  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.toLowerCase().endsWith('.json'))

  for (const file of files) {
    const base = file.replace(/\.json$/i, '')
    const key = normalizeTopicLookupKey(base)
    if (key === targetKey) {
      return path.join(folderPath, file)
    }
  }

  return null
}

function findTopicContentAlias(topicName: string, domainId: string): string | null {
  const domainFolder = DOMAIN_FOLDER_MAP[domainId]
  if (!domainFolder) return null

  const topicDir = path.join(process.cwd(), 'topic-content-v4', domainFolder)
  if (!fs.existsSync(topicDir)) return null

  const targetKey = normalizeTopicLookupKey(topicName)
  if (!targetKey) return null

  const entries = fs
    .readdirSync(topicDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))

  for (const entry of entries) {
    const candidatePath = path.join(topicDir, entry.name)
    const baseName = entry.name.replace(/\.md$/i, '')

    // First try the filename itself.
    if (normalizeTopicLookupKey(baseName) === targetKey) {
      return baseName
    }

    // Then match canonical topic names from frontmatter.
    try {
      const raw = fs.readFileSync(candidatePath, 'utf-8')
      const frontmatterTopic = parseFrontmatterField(raw, 'topic_name')
      const frontmatterSlug = parseFrontmatterField(raw, 'slug')

      if (
        (frontmatterTopic && normalizeTopicLookupKey(frontmatterTopic) === targetKey) ||
        (frontmatterSlug && normalizeTopicLookupKey(frontmatterSlug) === targetKey)
      ) {
        return baseName
      }
    } catch {
      // Ignore malformed files and continue scanning.
    }
  }

  return null
}

export function loadTopicQuestions(topicName: string, domainId?: string | null): LoadedTopicQuestions | null {
  if (!topicName) return null

  let filePath = findTopicFile(QUESTIONS_DIR, topicName, '.json', domainId)

  // Fallback: resolve the canonical topic to the matched topic-content filename,
  // then locate the paired questions file by that alias.
  if (!filePath && domainId) {
    const aliasBaseName = findTopicContentAlias(topicName, domainId)
    if (aliasBaseName) {
      filePath = findQuestionFileByAlias(aliasBaseName, domainId)
    }
  }

  if (!filePath) {
    console.warn(`[Topic Question Loader] No question file found for topic "${topicName}" (domain: ${domainId ?? 'any'})`)
    return null
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    const questions = Array.isArray(parsed.questions) ? parsed.questions : []

    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn(`[Topic Question Loader] Question file ${filePath} has no questions array`)
      return null
    }

    return { filePath, questions }
  } catch (error) {
    console.error(`[Topic Question Loader] Failed to load questions from ${filePath}:`, error)
    return null
  }
}

export function topicHasQuestionFile(topicName: string, domainId: string): boolean {
  const domainFolder = DOMAIN_FOLDER_MAP[domainId]
  const domainNumbers = DOMAIN_NUMBER_MAP[domainId]

  if (!domainFolder || !domainNumbers) {
    return false
  }

  const filePath = findTopicFile(QUESTIONS_DIR, topicName, '.json', domainId)
  return Boolean(filePath)
}
