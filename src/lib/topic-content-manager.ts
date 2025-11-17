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
      'topic-content-v3-test',
      domainFolder,
      `${slug}.md`
    )

    console.log(`[Topic Content Manager] Attempting to load from: ${filePath}`)
    console.log(`[Topic Content Manager] Working directory: ${process.cwd()}`)
    console.log(`[Topic Content Manager] Topic: "${topicName}", Domain: "${domain}"`)
    console.log(`[Topic Content Manager] Computed slug: "${slug}", Domain folder: "${domainFolder}"`)

    const fileContent = readFileSync(filePath, 'utf-8')
    const { metadata, content } = parseFrontmatter(fileContent)

    // Remove personalization placeholder and keep as baseContent
    const baseContent = content.replace(/\n*## {{PERSONALIZED_EXAMPLES}}.*?(?=##|$)/s, '')

    console.log(`[Topic Content Manager] ✅ Successfully loaded content for ${topicName}`)

    return {
      metadata: metadata as TopicContentMetadata,
      content,
      baseContent: baseContent.trim(),
    }
  } catch (error) {
    console.error(`[Topic Content Manager] ❌ Failed to load topic content for ${topicName}:`, error)
    console.error(`[Topic Content Manager] Error details:`, {
      name: (error as Error).name,
      message: (error as Error).message,
      code: (error as any).code,
    })
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
      'topic-content-v3-test',
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
      'topic-content-v3-test',
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
 * Extract all marked metaphors from content
 * Returns array of objects with original text and position
 */
function extractMarkedMetaphors(content: string): Array<{ text: string; startIndex: number; endIndex: number }> {
  const metaphors: Array<{ text: string; startIndex: number; endIndex: number }> = []
  const regex = /\{\{M\}\}(.*?)\{\{\/M\}\}/gs

  let match
  while ((match = regex.exec(content)) !== null) {
    metaphors.push({
      text: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return metaphors
}

/**
 * Replace marked metaphors inline with personalized versions (FAST approach)
 *
 * This function finds {{M}}...{{/M}} markers and replaces ONLY those metaphors
 * with personalized ones, leaving all other content untouched.
 *
 * @param baseContent - Content with {{M}}...{{/M}} marked metaphors
 * @param userInterests - User's interests as a comma-separated string
 * @param topicName - The name of the topic (for context)
 * @returns Promise resolving to content with personalized metaphors
 */
export async function replaceMetaphors(
  baseContent: string,
  userInterests: string,
  topicName: string
): Promise<string> {
  // Extract all marked metaphors
  const markedMetaphors = extractMarkedMetaphors(baseContent)

  if (markedMetaphors.length === 0) {
    console.log('[Metaphor Replacement] No marked metaphors found, returning original content')
    return baseContent
  }

  console.log(`[Metaphor Replacement] Found ${markedMetaphors.length} marked metaphors to personalize`)

  // Build prompt with just the metaphors to replace
  const metaphorList = markedMetaphors.map((m, i) => `${i + 1}. "${m.text}"`).join('\n')

  const INLINE_METAPHOR_PROMPT = `You are personalizing metaphors for a psychology student studying "${topicName}".

Student's Interests: ${userInterests}

IMPORTANT: If the student mentions media/pop culture (like "The Office", "Star Wars", "Harry Potter", etc.), interpret these as the well-known TV shows, movies, or franchises - NOT literal meanings. For example:
- "The Office" = the popular TV comedy series about office workers
- "Star Wars" = the science fiction film franchise
- "Harry Potter" = the fantasy book/film series
- etc.

Below are ${markedMetaphors.length} generic metaphors/analogies from the lesson. Replace each one with a version that relates to the student's interests.

Generic Metaphors:
${metaphorList}

Instructions:
- Keep the same educational purpose and clarity
- Make it relatable to their interests: ${userInterests}
- Use specific characters, scenes, or concepts from their mentioned shows/movies/books
- Keep the same length (don't make them longer)
- Return ONLY the replacement metaphors, numbered 1-${markedMetaphors.length}
- Do NOT include any other text or explanation

Return format:
1. [your personalized metaphor for #1]
2. [your personalized metaphor for #2]
...and so on.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: INLINE_METAPHOR_PROMPT,
        },
      ],
    })

    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Parse the numbered responses
    const personalizedMetaphors: string[] = []
    const lines = textContent.text.split('\n')

    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/)
      if (match) {
        personalizedMetaphors.push(match[1].trim())
      }
    }

    if (personalizedMetaphors.length !== markedMetaphors.length) {
      console.warn(`[Metaphor Replacement] Expected ${markedMetaphors.length} metaphors but got ${personalizedMetaphors.length}, using original`)
      return baseContent
    }

    // Replace metaphors in reverse order to preserve indices
    let result = baseContent
    for (let i = markedMetaphors.length - 1; i >= 0; i--) {
      const original = markedMetaphors[i]
      const replacement = personalizedMetaphors[i]

      // Replace the entire {{M}}...{{/M}} block with just the personalized text
      result = result.substring(0, original.startIndex) + replacement + result.substring(original.endIndex)
    }

    console.log(`[Metaphor Replacement] Successfully personalized ${personalizedMetaphors.length} metaphors`)
    return result

  } catch (error) {
    console.error('Error replacing metaphors:', error)
    // Fallback: return original content with markers removed
    return baseContent.replace(/\{\{M\}\}|\{\{\/M\}\}/g, '')
  }
}
