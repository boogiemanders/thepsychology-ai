/**
 * Parse lesson text into stable and metaphor chunks based on {{M}}...{{/M}} tags.
 *
 * Stable chunks: Text outside metaphor tags (never changes between users)
 * Metaphor chunks: Text inside {{M}}...{{/M}} tags (can have hobby-specific variants)
 *
 * Chunks are organized into sections based on ## or ### headers for navigation.
 */

export type ChunkType = 'stable' | 'metaphor'

export type ParsedChunk = {
  id: string // e.g., "s0001" or "m0001"
  type: ChunkType
  text: string // Original text (no tags)
  index: number // Position in chunk array
  sectionIdx: number // Which section this chunk belongs to (0-indexed)
  sectionTitle: string // Header text of the section
  sectionStart: boolean // True if this is the first chunk in its section
}

export type Section = {
  title: string
  content: string
}

/**
 * Split lesson into sections by ## or ### headers.
 * Removes YAML frontmatter before parsing.
 */
export function splitIntoSections(lessonText: string): Section[] {
  // Remove YAML frontmatter
  const withoutFrontmatter = lessonText.replace(/^---[\s\S]*?---\n*/, '')

  // Split by headers (## or ###)
  const headerRegex = /^(#{2,3})\s+(.+)$/gm
  const sections: Section[] = []
  let lastIdx = 0
  let lastTitle = 'Introduction'
  let match: RegExpExecArray | null

  while ((match = headerRegex.exec(withoutFrontmatter)) !== null) {
    if (match.index > lastIdx) {
      const content = withoutFrontmatter.slice(lastIdx, match.index).trim()
      if (content) sections.push({ title: lastTitle, content })
    }
    lastTitle = match[2].trim()
    lastIdx = match.index + match[0].length
  }

  const remaining = withoutFrontmatter.slice(lastIdx).trim()
  if (remaining) sections.push({ title: lastTitle, content: remaining })

  return sections
}

/**
 * Parse a single section's content into stable/metaphor chunks.
 */
export function parseChunksFromSection(
  content: string,
  sectionIdx: number,
  sectionTitle: string,
  counters: { stable: number; metaphor: number }
): ParsedChunk[] {
  const chunks: ParsedChunk[] = []
  const metaphorRegex = /\{\{M\}\}([\s\S]*?)\{\{\/M\}\}/g
  let isFirst = true
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = metaphorRegex.exec(content)) !== null) {
    const stableText = content.slice(lastIndex, match.index).trim()
    if (stableText) {
      // Prepend section title to the first chunk so audio includes headers
      const textWithHeader = isFirst ? `${sectionTitle}. ${stableText}` : stableText
      chunks.push({
        id: `s${String(++counters.stable).padStart(4, '0')}`,
        type: 'stable',
        text: textWithHeader,
        index: -1, // Will be assigned later
        sectionIdx,
        sectionTitle,
        sectionStart: isFirst,
      })
      isFirst = false
    }

    const metaphorText = match[1].trim()
    if (metaphorText) {
      // Prepend section title to the first chunk so audio includes headers
      const textWithHeader = isFirst ? `${sectionTitle}. ${metaphorText}` : metaphorText
      chunks.push({
        id: `m${String(++counters.metaphor).padStart(4, '0')}`,
        type: 'metaphor',
        text: textWithHeader,
        index: -1, // Will be assigned later
        sectionIdx,
        sectionTitle,
        sectionStart: isFirst,
      })
      isFirst = false
    }
    lastIndex = match.index + match[0].length
  }

  const remaining = content.slice(lastIndex).trim()
  if (remaining) {
    // Prepend section title to the first chunk so audio includes headers
    const textWithHeader = isFirst ? `${sectionTitle}. ${remaining}` : remaining
    chunks.push({
      id: `s${String(++counters.stable).padStart(4, '0')}`,
      type: 'stable',
      text: textWithHeader,
      index: -1, // Will be assigned later
      sectionIdx,
      sectionTitle,
      sectionStart: isFirst,
    })
  }

  return chunks
}

/**
 * Parse lesson text into section-aware chunks.
 *
 * Example:
 *   "## Section One\nIntro {{M}}Metaphor one{{/M}} Middle\n\n## Section Two\nMore text"
 *   → Chunks with sectionIdx, sectionTitle, and sectionStart fields
 */
export function parseChunks(lessonText: string): ParsedChunk[] {
  const sections = splitIntoSections(lessonText)
  const counters = { stable: 0, metaphor: 0 }
  const allChunks: ParsedChunk[] = []

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx]
    const sectionChunks = parseChunksFromSection(
      section.content,
      sIdx,
      section.title,
      counters
    )
    allChunks.push(...sectionChunks)
  }

  // Assign global indices
  allChunks.forEach((chunk, i) => {
    chunk.index = i
  })

  return allChunks
}

/**
 * Legacy parseChunks for backward compatibility - no section info.
 * Use parseChunks() for new code that needs section navigation.
 */
export function parseChunksLegacy(lessonText: string): Omit<ParsedChunk, 'sectionIdx' | 'sectionTitle' | 'sectionStart'>[] {
  const chunks: Omit<ParsedChunk, 'sectionIdx' | 'sectionTitle' | 'sectionStart'>[] = []
  const metaphorRegex = /\{\{M\}\}([\s\S]*?)\{\{\/M\}\}/g

  let lastIndex = 0
  let stableCount = 0
  let metaphorCount = 0
  let match: RegExpExecArray | null

  while ((match = metaphorRegex.exec(lessonText)) !== null) {
    // Stable text before this metaphor
    const stableText = lessonText.slice(lastIndex, match.index).trim()
    if (stableText) {
      chunks.push({
        id: `s${String(++stableCount).padStart(4, '0')}`,
        type: 'stable',
        text: stableText,
        index: chunks.length,
      })
    }

    // Metaphor text (inside tags)
    const metaphorText = match[1].trim()
    if (metaphorText) {
      chunks.push({
        id: `m${String(++metaphorCount).padStart(4, '0')}`,
        type: 'metaphor',
        text: metaphorText,
        index: chunks.length,
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining stable text after last metaphor
  const remainingText = lessonText.slice(lastIndex).trim()
  if (remainingText) {
    chunks.push({
      id: `s${String(++stableCount).padStart(4, '0')}`,
      type: 'stable',
      text: remainingText,
      index: chunks.length,
    })
  }

  return chunks
}

/**
 * Strip metaphor tags from text, returning plain text and the ranges where metaphors were.
 * This is useful for backward compatibility with existing audio generation.
 */
export function stripMetaphorTags(content: string): { text: string; ranges: Array<{ start: number; end: number }> } {
  const ranges: Array<{ start: number; end: number }> = []
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
  // Clean up any remaining tags (defensive)
  out = out.replace(/\{\{\/?M\}\}/g, '')
  return { text: out, ranges }
}

/**
 * Check if text contains metaphor tags.
 */
export function hasMetaphorTags(text: string): boolean {
  return /\{\{M\}\}[\s\S]*?\{\{\/M\}\}/.test(text)
}

/**
 * Count the number of metaphor sections in the text.
 */
export function countMetaphors(text: string): number {
  const matches = text.match(/\{\{M\}\}[\s\S]*?\{\{\/M\}\}/g)
  return matches ? matches.length : 0
}
