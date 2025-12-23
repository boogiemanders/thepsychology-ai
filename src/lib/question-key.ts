import { createHash } from 'crypto'

function normalizeText(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function computeQuestionKey(input: {
  question: string
  options?: string[] | null
  correctAnswer?: string | null
}): string {
  const normalizedQuestion = normalizeText(input.question)
  const normalizedOptions = (input.options ?? []).map((option) => normalizeText(option))
  const normalizedCorrect = normalizeText(input.correctAnswer ?? null)

  const payload = JSON.stringify({
    q: normalizedQuestion,
    o: normalizedOptions,
    c: normalizedCorrect,
  })

  return createHash('sha256').update(payload).digest('hex')
}

