export type HastNode = {
  type: string
  tagName?: string
  value?: string
  children?: HastNode[]
  properties?: Record<string, unknown>
}

export const READ_ALONG_WORD_REGEX = /\d+(?:\.\d+)+|[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g
export const READ_ALONG_SKIP_TAGS = new Set(['pre', 'script', 'style', 'svg', 'code'])

export function splitTextForReadAlong(value: string, wordIndexRef: { current: number }): HastNode[] {
  if (!value) return []

  const nodes: HastNode[] = []
  let lastIndex = 0
  READ_ALONG_WORD_REGEX.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = READ_ALONG_WORD_REGEX.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: value.slice(lastIndex, match.index) })
    }

    const word = match[0]
    nodes.push({
      type: 'element',
      tagName: 'span',
      properties: {
        className: 'tt-word',
        'data-tt-word-index': String(wordIndexRef.current),
      },
      children: [{ type: 'text', value: word }],
    })
    wordIndexRef.current += 1
    lastIndex = match.index + word.length
  }

  if (lastIndex < value.length) {
    nodes.push({ type: 'text', value: value.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', value }]
}

// ── Alignment utilities (shared between topic-teacher and blog audio) ──

import { expandNumericTokenForReadAlong } from '@/lib/speech-text'

export const EPPP_WORD_REGEX = /\bE\.?P\.?P\.?P\.?\b/i
export const ACRONYM_WORD_REGEX = /^[A-Z]{2,5}$/
export const ACRONYM_VOWEL_REGEX = /[AEIOUY]/

type ReadAlongWordEntry = { word: string; index: number }

export function normalizeReadAlongWord(word: string): string {
  const normalized = word.trim().toLowerCase()
  return normalized.replace(/['\u2019]s$/i, '')
}

/**
 * Expand each DOM span into spoken-word entries.
 * E.g. "EPPP" → 3 entries (e, triple, p) all pointing at the same span index.
 * Acronyms like "CNS" → 3 entries (c, n, s).
 * Numbers like "128" → spoken-word entries (one, hundred, twenty, eight).
 */
export function buildReadAlongWordEntries(spans: HTMLSpanElement[]): ReadAlongWordEntry[] {
  const entries: ReadAlongWordEntry[] = []
  spans.forEach((span, index) => {
    const text = (span.textContent || '').trim()
    if (!text) return
    if (EPPP_WORD_REGEX.test(text)) {
      entries.push(
        { word: 'e', index },
        { word: 'triple', index },
        { word: 'p', index }
      )
    } else {
      const numericWords = expandNumericTokenForReadAlong(text)
      if (numericWords.length > 0) {
        numericWords.forEach((word) => {
          entries.push({ word: normalizeReadAlongWord(word), index })
        })
      } else if (ACRONYM_WORD_REGEX.test(text) && !ACRONYM_VOWEL_REGEX.test(text)) {
        text.split('').forEach((letter) => {
          entries.push({ word: letter.toLowerCase(), index })
        })
      } else {
        entries.push({ word: normalizeReadAlongWord(text), index })
      }
    }
  })
  return entries
}

/**
 * LCS alignment: map[spokenWordIdx] → spanIdx.
 * Aligns the spoken word sequence (from TTS/MFA) to the DOM span sequence
 * using longest common subsequence, handling expansions like acronyms and numbers.
 */
export function buildReadAlongIndexMap(
  spans: HTMLSpanElement[],
  spokenWords: string[]
): Array<number | null> {
  if (spans.length === 0 || spokenWords.length === 0) return []

  const entries = buildReadAlongWordEntries(spans)
  if (entries.length === 0) return []

  const displayWords = entries.map((entry) => entry.word)
  const n = spokenWords.length
  const m = displayWords.length

  if (n === 0 || m === 0) return []
  if (n > 65000 || m > 65000) {
    return new Array(spokenWords.length).fill(null)
  }

  const rowLen = m + 1
  const dirs = new Uint8Array((n + 1) * rowLen)
  let prev = new Uint16Array(rowLen)
  let curr = new Uint16Array(rowLen)

  for (let i = 1; i <= n; i += 1) {
    curr[0] = 0
    const spokenWord = spokenWords[i - 1]
    const baseIdx = i * rowLen
    for (let j = 1; j <= m; j += 1) {
      if (spokenWord === displayWords[j - 1]) {
        curr[j] = prev[j - 1] + 1
        dirs[baseIdx + j] = 1
      } else if (prev[j] >= curr[j - 1]) {
        curr[j] = prev[j]
        dirs[baseIdx + j] = 2
      } else {
        curr[j] = curr[j - 1]
        dirs[baseIdx + j] = 3
      }
    }
    const swap = prev
    prev = curr
    curr = swap
  }

  const map: Array<number | null> = new Array(spokenWords.length).fill(null)
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    const dir = dirs[i * rowLen + j]
    if (dir === 1) {
      map[i - 1] = entries[j - 1].index
      i -= 1
      j -= 1
    } else if (dir === 2) {
      i -= 1
    } else {
      j -= 1
    }
  }

  return map
}

export function rehypeReadAlongWords() {
  return (tree: HastNode) => {
    const wordIndexRef = { current: 0 }

    const visit = (node: HastNode) => {
      if (!node || !node.children) return
      if (node.type === 'element' && node.tagName && READ_ALONG_SKIP_TAGS.has(node.tagName)) {
        return
      }

      const nextChildren: HastNode[] = []
      for (const child of node.children) {
        if (child.type === 'text') {
          nextChildren.push(...splitTextForReadAlong(child.value ?? '', wordIndexRef))
          continue
        }
        visit(child)
        nextChildren.push(child)
      }
      node.children = nextChildren
    }

    visit(tree)
  }
}
