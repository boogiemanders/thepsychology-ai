export function markdownToSpeakableText(markdown: string): string {
  const input = typeof markdown === 'string' ? markdown : ''
  if (!input.trim()) return ''

  let text = input

  // Remove fenced code blocks entirely (topic-teacher lessons should rarely include these).
  text = text.replace(/```[\s\S]*?```/g, '')

  // Convert headings to plain lines.
  text = text.replace(/^#{1,6}\s+/gm, '')

  // Remove horizontal rules.
  text = text.replace(/^\s*---+\s*$/gm, '')

  // Remove blockquote markers.
  text = text.replace(/^\s*>\s?/gm, '')

  // Images: keep alt text only.
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')

  // Links: keep display text only.
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Inline code: keep content.
  text = text.replace(/`([^`]+)`/g, '$1')

  // Emphasis: keep content.
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/_([^_]+)_/g, '$1')

  // Tables: remove alignment row, and turn table rows into comma-separated lines.
  text = text.replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, '')
  text = text.replace(/^\s*\|(.+)\|\s*$/gm, (_match, row: string) => {
    const cells = row
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean)
    return cells.join(', ')
  })

  // Lists: remove list markers but keep line breaks so TTS pauses naturally.
  text = text.replace(/^\s*[-*+]\s+/gm, '')
  text = text.replace(/^\s*\d+\.\s+/gm, '')

  // Collapse whitespace.
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}

function splitLongTextBySentences(text: string, maxChars: number): string[] {
  const sentenceMatches = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)
  const sentences = sentenceMatches?.map((s) => s.trim()).filter(Boolean) ?? [text]

  const parts: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if (!current) {
      if (sentence.length <= maxChars) {
        current = sentence
        continue
      }

      for (let i = 0; i < sentence.length; i += maxChars) {
        parts.push(sentence.slice(i, i + maxChars).trim())
      }
      continue
    }

    const candidate = `${current} ${sentence}`.trim()
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }

    parts.push(current.trim())
    if (sentence.length <= maxChars) {
      current = sentence
      continue
    }

    for (let i = 0; i < sentence.length; i += maxChars) {
      const slice = sentence.slice(i, i + maxChars).trim()
      if (slice) parts.push(slice)
    }
    current = ''
  }

  if (current.trim()) parts.push(current.trim())
  return parts.filter(Boolean)
}

export function chunkTextForTts(text: string, maxChars: number): string[] {
  const input = typeof text === 'string' ? text.trim() : ''
  if (!input) return []
  if (maxChars <= 0) return [input]

  const paragraphs = input
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs) {
    if (!current) {
      if (paragraph.length <= maxChars) {
        current = paragraph
      } else {
        chunks.push(...splitLongTextBySentences(paragraph, maxChars))
      }
      continue
    }

    const candidate = `${current}\n\n${paragraph}`.trim()
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }

    chunks.push(current.trim())
    if (paragraph.length <= maxChars) {
      current = paragraph
    } else {
      chunks.push(...splitLongTextBySentences(paragraph, maxChars))
      current = ''
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks.filter(Boolean)
}

