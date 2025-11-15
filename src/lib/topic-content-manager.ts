import { readFileSync } from 'fs'
import { join } from 'path'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

/**
 * Replace generic metaphors in content with personalized metaphors based on user interests
 *
 * This function takes pre-generated content with adult-friendly metaphors and replaces them
 * with metaphors tailored to the user's specific interests (e.g., sports, music, cooking, etc.)
 *
 * @param baseContent - The pre-generated teaching content with generic metaphors
 * @param userInterests - User's interests as a comma-separated string
 * @param topicName - The name of the topic (for context)
 * @returns Promise resolving to content with personalized metaphors
 */
export async function replaceMetaphors(
  baseContent: string,
  userInterests: string,
  topicName: string
): Promise<string> {
  const METAPHOR_REPLACEMENT_PROMPT = `You are helping personalize psychology education content.

You have teaching content about "${topicName}" that contains generic metaphors and examples. Your task is to replace these with metaphors that connect to the student's specific interests.

Student's Interests: ${userInterests}

Original Content:
${baseContent}

Your Task:
Rewrite the content to replace generic metaphors and examples with ones that relate to the student's interests. Keep all the core psychology concepts, key terms, and factual information exactly the same - only change the analogies, metaphors, and examples.

Guidelines:
- Preserve all headers, structure, and formatting
- Keep all technical terms and definitions unchanged
- Replace generic metaphors (workplace, technology, etc.) with interest-based ones
- Make sure new metaphors are just as clear and educational
- Maintain the same reading level and tone
- Keep the same length (don't make it significantly longer or shorter)
- Bold the same key terms that were bolded before

Return the complete rewritten content with personalized metaphors.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: METAPHOR_REPLACEMENT_PROMPT,
        },
      ],
    })

    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    return textContent.text
  } catch (error) {
    console.error('Error replacing metaphors:', error)
    // Fallback: return original content if personalization fails
    return baseContent
  }
}
