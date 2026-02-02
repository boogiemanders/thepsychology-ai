import { readFileSync, readdirSync, existsSync } from 'fs'
import path from 'path'
import { getOpenAIApiKey } from '@/lib/openai-api-key'

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

// Maps domain IDs to actual folder names in topic-content-v4
const DOMAIN_FOLDER_MAP: Record<string, string> = {
  '1': '1 Biopsychology (Neuroscience & Pharmacology)',
  '2': '2 Learning and Memory',
  '3-social': '3 Social Psychology',
  '3-cultural': '3 Cultural Considerations',
  '4': '4 Development',
  '5-assessment': '5 Assessment',
  '5-diagnosis': '5 Diagnosis',
  '5-test': '5 Test Construction',
  '6': '6 Clinical Interventions',
  '7': '7 Research and Stats',
  '8': '8 Ethics',
  '3-5-6': '2 3 5 6 I-O Psychology',
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
 * Get the domain folder name from domain ID.
 */
function getDomainFolder(domainId: string): string {
  return DOMAIN_FOLDER_MAP[domainId] || domainId
}

/**
 * Normalize a topic name or filename to a slug used for lookups.
 * Strips leading numbers and spaces so both:
 *   - "Organizational Leadership"
 *   - "5 6 Organizational Leadership"
 * map to the same slug.
 */
function slugifyTopicName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(?:\d+[\s-]+)+/, '') // remove leading numeric prefixes like "5 ", "5 6 ", or "5-6-"
    .replace(/[&]/g, 'and')
    .replace(/\band\b/g, '') // strip word "and" so "Standards 1 and 2" matches "standards-1-2"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Resolve the actual markdown file path for a topic.
 *
 * Behaviors:
 * - If a domain ID is provided, search that domain folder first.
 * - Always fall back to scanning all known domain folders so links that
 *   omit the domain (e.g., from quiz results) still work.
 */
function resolveTopicFilePath(
  topicName: string,
  domain?: string | null,
  rootDirName: string = 'topic-content-v4',
): string | null {
  const slug = slugifyTopicName(topicName)
  const rootDir = path.join(process.cwd(), rootDirName)

  // Build ordered list of folders to search: requested domain (if any) first,
  // then all other known domain folders.
  const searchFolders: string[] = []
  let domainFolder: string | null = null

  if (domain) {
    const mapped = getDomainFolder(domain)
    if (mapped) {
      domainFolder = mapped
      searchFolders.push(mapped)
    }
  }

  for (const folder of Object.values(DOMAIN_FOLDER_MAP)) {
    if (folder && folder !== domainFolder && !searchFolders.includes(folder)) {
      searchFolders.push(folder)
    }
  }

  for (const folder of searchFolders) {
    const baseDir = path.join(rootDir, folder)

    // 1) Direct slug match (for legacy kebab-case filenames)
    const directPath = path.join(baseDir, `${slug}.md`)
    if (existsSync(directPath)) {
      return directPath
    }

    // 2) Scan directory and match by normalized slug of each filename
    let entries: ReturnType<typeof readdirSync>
    try {
      entries = readdirSync(baseDir, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const baseName = entry.name.slice(0, -3) // drop ".md"
      const candidateSlug = slugifyTopicName(baseName)
      if (candidateSlug === slug) {
        return path.join(baseDir, entry.name)
      }
    }
  }

  return null
}

/**
 * Remove {{M}}...{{/M}} markers while leaving the inner metaphor text intact.
 */
export function stripMetaphorMarkers(content: string): string {
  return content.replace(/\{\{\/?M\}\}/g, '')
}

export type MetaphorRange = { start: number; end: number }

/**
 * Remove {{M}}...{{/M}} markers while leaving the inner metaphor text intact,
 * and also return the ranges (in the stripped string) corresponding to each
 * metaphor block. This lets clients treat metaphor spans as "dynamic".
 */
export function stripMetaphorMarkersWithRanges(content: string): {
  content: string
  ranges: MetaphorRange[]
} {
  const ranges: MetaphorRange[] = []
  let out = ''
  let cursor = 0

  const regex = /\{\{M\}\}([\s\S]*?)\{\{\/M\}\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    const before = content.slice(cursor, match.index)
    out += before

    const inner = match[1] ?? ''
    const start = out.length
    out += inner
    const end = out.length
    ranges.push({ start, end })

    cursor = match.index + match[0].length
  }

  out += content.slice(cursor)

  // Defensive cleanup if malformed markers exist.
  out = out.replace(/\{\{\/?M\}\}/g, '')

  return { content: out, ranges }
}

/**
 * Load pre-generated topic content from filesystem
 */
export function loadTopicContent(
  topicName: string,
  domain: string
): TopicContent | null {
  try {
    const filePath = resolveTopicFilePath(topicName, domain)
    const domainFolder = getDomainFolder(domain)
    const slug = slugifyTopicName(topicName)

    if (!filePath) {
      console.error(
        `[Topic Content Manager] ❌ Could not resolve file for topic "${topicName}" in domain "${domain}"`
      )
      return null
    }

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
    const filePath = resolveTopicFilePath(topicName, domain)
    if (!filePath) return false
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
    const filePath = resolveTopicFilePath(topicName, domain)
    if (!filePath) return null
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
 * Load pre-generated topic content specifically from the free-contentGPT folder.
 * Used for free-tier users so they only see the curated free topics.
 */
export function loadFreeTopicContent(
  topicName: string,
  domain: string
): TopicContent | null {
  try {
    const filePath = resolveTopicFilePath(topicName, domain, 'free-contentGPT')
    const domainFolder = getDomainFolder(domain)
    const slug = slugifyTopicName(topicName)

    if (!filePath) {
      console.error(
        `[Topic Content Manager] ❌ Could not resolve FREE file for topic "${topicName}" in domain "${domain}"`
      )
      return null
    }

    console.log(`[Topic Content Manager] Attempting to load FREE content from: ${filePath}`)
    console.log(`[Topic Content Manager] Working directory: ${process.cwd()}`)
    console.log(`[Topic Content Manager] Topic: "${topicName}", Domain: "${domain}"`)
    console.log(`[Topic Content Manager] Computed slug: "${slug}", Domain folder: "${domainFolder}"`)

    const fileContent = readFileSync(filePath, 'utf-8')
    const { metadata, content } = parseFrontmatter(fileContent)

    const baseContent = content.replace(/\n*## {{PERSONALIZED_EXAMPLES}}.*?(?=##|$)/s, '')

    console.log(`[Topic Content Manager] ✅ Successfully loaded FREE content for ${topicName}`)

    return {
      metadata: metadata as TopicContentMetadata,
      content,
      baseContent: baseContent.trim(),
    }
  } catch (error) {
    console.error(`[Topic Content Manager] ❌ Failed to load FREE topic content for ${topicName}:`, error)
    console.error(`[Topic Content Manager] Error details:`, {
      name: (error as Error).name,
      message: (error as Error).message,
      code: (error as any).code,
    })
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
  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    console.warn('[Metaphor Replacement] OPENAI_API_KEY not set, returning content without markers')
    return stripMetaphorMarkers(baseContent)
  }

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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: INLINE_METAPHOR_PROMPT,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
    }

    const data: any = await response.json()
    const text = data.choices?.[0]?.message?.content
    if (!text || typeof text !== 'string') {
      throw new Error('No text content in OpenAI response')
    }

    // Parse the numbered responses
    const personalizedMetaphors: string[] = []
    const lines = text.split('\n')

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
    return stripMetaphorMarkers(baseContent)
  }
}
