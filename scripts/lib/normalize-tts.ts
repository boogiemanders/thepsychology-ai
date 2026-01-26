/**
 * Text normalization utilities for TTS (Text-to-Speech) and MFA (Montreal Forced Aligner).
 *
 * These functions prepare text so that:
 * 1. The TTS system can pronounce it correctly
 * 2. MFA can align the audio with the text accurately
 */

// Number-to-words conversion arrays
const DIGIT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const TEEN_WORDS = [
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]
const TENS_WORDS = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function numberToWordsUnder100(value: number): string {
  if (value < 10) return DIGIT_WORDS[value]
  if (value < 20) return TEEN_WORDS[value - 10]
  const tens = Math.floor(value / 10)
  const ones = value % 10
  const tensWord = TENS_WORDS[tens - 2]
  return ones ? `${tensWord} ${DIGIT_WORDS[ones]}` : tensWord
}

function numberToWordsUnder1000(value: number): string {
  if (value < 100) return numberToWordsUnder100(value)
  const hundreds = Math.floor(value / 100)
  const rest = value % 100
  const base = `${DIGIT_WORDS[hundreds]} hundred`
  return rest ? `${base} ${numberToWordsUnder100(rest)}` : base
}

function numberToWords(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value < 0) {
    const positive = numberToWords(Math.abs(value))
    return positive ? `minus ${positive}` : ''
  }
  if (value < 1000) return numberToWordsUnder1000(value)
  if (value < 1_000_000) {
    const thousands = Math.floor(value / 1000)
    const rest = value % 1000
    const base = `${numberToWordsUnder1000(thousands)} thousand`
    return rest ? `${base} ${numberToWordsUnder1000(rest)}` : base
  }
  if (value < 1_000_000_000) {
    const millions = Math.floor(value / 1_000_000)
    const rest = value % 1_000_000
    const base = `${numberToWordsUnder1000(millions)} million`
    return rest ? `${base} ${numberToWords(rest)}` : base
  }
  return String(value)
}

function expandNumericToken(token: string): string {
  const normalized = token.replace(/,/g, '')
  if (!/^\d+(\.\d+)?$/.test(normalized)) return token

  const [wholeRaw, fraction] = normalized.split('.')
  const wholeValue = Number.parseInt(wholeRaw, 10)
  const wholeWords = numberToWords(wholeValue)
  if (!wholeWords) return token
  if (!fraction) return wholeWords

  const fractionWords = fraction
    .split('')
    .map((digit) => DIGIT_WORDS[Number.parseInt(digit, 10)])
    .filter(Boolean)
    .join(' ')

  return fractionWords ? `${wholeWords} point ${fractionWords}` : wholeWords
}

/**
 * Convert markdown to speakable text by removing formatting.
 * Matches the logic in src/lib/speech-text.ts for consistency.
 */
export function markdownToSpeakableText(markdown: string): string {
  const input = typeof markdown === 'string' ? markdown : ''
  if (!input.trim()) return ''

  let text = input

  // Remove fenced code blocks entirely
  text = text.replace(/```[\s\S]*?```/g, '')

  // Convert headings to plain lines
  text = text.replace(/^#{1,6}\s+/gm, '')

  // Remove horizontal rules
  text = text.replace(/^\s*---+\s*$/gm, '')

  // Remove blockquote markers
  text = text.replace(/^\s*>\s?/gm, '')

  // Images: keep alt text only
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')

  // Links: keep display text only
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Inline code: keep content
  text = text.replace(/`([^`]+)`/g, '$1')

  // Emphasis: keep content
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/_([^_]+)_/g, '$1')

  // Tables: remove alignment row, and turn table rows into comma-separated lines
  text = text.replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, '')
  text = text.replace(/^\s*\|(.+)\|\s*$/gm, (_match, row: string) => {
    const cells = row
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean)
    return cells.join(', ')
  })

  // Lists: remove list markers but keep line breaks so TTS pauses naturally
  text = text.replace(/^\s*[-*+]\s+/gm, '')
  text = text.replace(/^\s*\d+\.\s+/gm, '')

  // Collapse whitespace
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}

/**
 * Normalize text for TTS generation and MFA alignment.
 *
 * This function prepares text so that:
 * 1. Acronyms are spelled out (CNS → C N S)
 * 2. EPPP is spoken as "E triple P"
 * 3. Numbers are expanded to words (128 → one hundred twenty eight)
 * 4. Percentages are handled (8% → eight percent)
 * 5. Ranges are handled (8-10 → eight to ten)
 * 6. Ampersands are expanded (& → and)
 * 7. Metaphor tags are stripped (defensive)
 */
export function normalizeForTTS(text: string): string {
  const input = typeof text === 'string' ? text : ''
  if (!input.trim()) return ''

  let normalized = input

  // 1. Strip any leaked metaphor tags (defensive)
  normalized = normalized.replace(/\{\{M\}\}/g, '')
  normalized = normalized.replace(/\{\{\/M\}\}/g, '')

  // 2. EPPP → "E triple P" (case-insensitive)
  normalized = normalized.replace(/\bE\.?P\.?P\.?P\.?\b/gi, 'E triple P')

  // 3. Spell out ampersands so word counts match speech
  normalized = normalized.replace(/&/g, ' and ')

  // 4. Expand numeric ranges with percent first (e.g., 8-10% -> eight to ten percent)
  normalized = normalized.replace(
    /\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)%\b/g,
    (_match, start, end) => `${expandNumericToken(start)} to ${expandNumericToken(end)} percent`
  )

  // 5. Expand numeric ranges without percent (e.g., 8-10 -> eight to ten)
  normalized = normalized.replace(
    /\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\b/g,
    (_match, start, end) => `${expandNumericToken(start)} to ${expandNumericToken(end)}`
  )

  // 6. Expand standalone percentages (e.g., 8% -> eight percent)
  normalized = normalized.replace(
    /\b(\d+(?:\.\d+)?)%\b/g,
    (_match, value) => `${expandNumericToken(value)} percent`
  )

  // 7. Expand remaining numeric tokens to spoken words (e.g., 128 -> one hundred twenty eight)
  normalized = normalized.replace(/\b\d+(?:\.\d+)?\b/g, (match) => expandNumericToken(match))

  // 8. Spell out short acronyms (e.g., CNS -> C N S). Skip EPPP (already handled).
  // Also skip acronyms that contain vowels (likely pronounceable)
  normalized = normalized.replace(/\b([A-Z]{2,5})\b/g, (match) => {
    if (/^EPPP$/i.test(match)) return match
    if (/[AEIOUY]/.test(match)) return match // Likely pronounceable
    return match.split('').join(' ')
  })

  // 9. Clean up whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

/**
 * Prepare text for TTS - simpler version that just handles EPPP.
 * Used for backward compatibility with existing audio caching.
 */
export function prepareTextForTts(text: string): string {
  const input = typeof text === 'string' ? text : ''
  if (!input.trim()) return ''
  return input.replace(/\bE\.?P\.?P\.?P\.?\b/gi, 'E triple P').trim()
}

/**
 * Split text into chunks suitable for TTS requests.
 * Respects paragraph and sentence boundaries.
 */
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
