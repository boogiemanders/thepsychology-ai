'use client'

function normalizeText(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cyrb53(input: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0)
  return `qk_${combined.toString(16)}`
}

export function computeQuestionKeyClient(input: {
  question: string
  options?: string[] | null
  correctAnswer?: string | null
}): string {
  const normalizedQuestion = normalizeText(input.question)
  const normalizedOptions = (input.options ?? []).map((option) => normalizeText(option)).sort()
  const normalizedCorrect = normalizeText(input.correctAnswer ?? null)

  const payload = JSON.stringify({
    q: normalizedQuestion,
    o: normalizedOptions,
    c: normalizedCorrect,
  })

  return cyrb53(payload)
}

