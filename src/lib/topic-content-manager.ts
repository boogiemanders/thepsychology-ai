import { readFileSync } from 'fs'
import { join } from 'path'
import path from 'path'

export interface TopicContentMetadata {
  topic_name: string
  domain: string
  slug: string
  generated_at: string
  model: string
  version: number
}

export interface TopicContent {
  metadata: TopicContentMetadata
  content: string
  baseContent: string // Content without personalization placeholder
}

/**
 * Parse YAML frontmatter from markdown file
 */
function parseFrontmatter(
  content: string
): { metadata: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { metadata: {}, content }
  }

  const [, frontmatterText, body] = match
  const metadata: Record<string, any> = {}

  frontmatterText.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(': ')
    const value = valueParts.join(': ')
    if (key && value) {
      metadata[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
    }
  })

  return { metadata, content: body.trim() }
}

/**
 * Get the domain folder name from domain
 */
function getDomainFolder(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Load pre-generated topic content from filesystem
 */
export function loadTopicContent(
  topicName: string,
  domain: string
): TopicContent | null {
  try {
    const domainFolder = getDomainFolder(domain)
    const slug = topicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const filePath = join(
      process.cwd(),
      'topic-content',
      domainFolder,
      `${slug}.md`
    )

    const fileContent = readFileSync(filePath, 'utf-8')
    const { metadata, content } = parseFrontmatter(fileContent)

    // Remove personalization placeholder and keep as baseContent
    const baseContent = content.replace(/\n*## {{PERSONALIZED_EXAMPLES}}.*?(?=##|$)/s, '')

    return {
      metadata: metadata as TopicContentMetadata,
      content,
      baseContent: baseContent.trim(),
    }
  } catch (error) {
    console.error(`Failed to load topic content for ${topicName}:`, error)
    return null
  }
}

/**
 * Merge base content with personalized examples
 */
export function mergePersonalizedContent(
  baseContent: string,
  personalizedExamples: string
): string {
  // Insert personalized examples at the placeholder
  return baseContent.replace(
    '{{PERSONALIZED_EXAMPLES}}',
    personalizedExamples
  )
}

/**
 * Extract the personalization section from full content
 */
export function getPersonalizationSection(content: string): string {
  const match = content.match(/## {{PERSONALIZED_EXAMPLES}}\n\n([\s\S]*?)(?=##|$)/)
  return match ? match[1].trim() : ''
}

/**
 * Check if topic content exists
 */
export function topicContentExists(
  topicName: string,
  domain: string
): boolean {
  try {
    const domainFolder = getDomainFolder(domain)
    const slug = topicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const filePath = join(
      process.cwd(),
      'topic-content',
      domainFolder,
      `${slug}.md`
    )

    readFileSync(filePath, 'utf-8')
    return true
  } catch {
    return false
  }
}

/**
 * Load the full content (without removing personalization section) - used for follow-up Q&A
 */
export function loadFullTopicContent(
  topicName: string,
  domain: string
): string | null {
  try {
    const domainFolder = getDomainFolder(domain)
    const slug = topicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const filePath = join(
      process.cwd(),
      'topic-content',
      domainFolder,
      `${slug}.md`
    )

    const fileContent = readFileSync(filePath, 'utf-8')
    const { content } = parseFrontmatter(fileContent)

    // Return the full content body (without frontmatter)
    return content
  } catch (error) {
    console.error(`Failed to load full topic content for ${topicName}:`, error)
    return null
  }
}
