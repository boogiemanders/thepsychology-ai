import { NextRequest, NextResponse } from 'next/server'
import { loadTopicQuestions, type TopicQuestion } from '@/lib/topic-question-loader'

type LockInQuestion = {
  stem: string
  options: string[]
  answer: string
  explanation: string
  lock_in_level?: 'easier' | 'harder'
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function isLockInDrillQuestion(question: TopicQuestion): boolean {
  return (
    question.is_lock_in_drill === true ||
    (Array.isArray(question.tags) && question.tags.includes('lock_in_drill'))
  )
}

function normalizeLockInLevel(value: unknown): 'easier' | 'harder' | null {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'easier') return 'easier'
  if (normalized === 'harder') return 'harder'
  return null
}

function toLockInQuestion(question: TopicQuestion): LockInQuestion | null {
  const stem = String(question.stem ?? question.question ?? '').trim()
  const options = Array.isArray(question.options)
    ? question.options.map((opt) => String(opt || '').trim()).filter(Boolean)
    : []
  const answer = String(question.answer ?? question.correct_answer ?? '').trim()
  const explanation = String(question.explanation ?? '').trim()
  const lock_in_level = normalizeLockInLevel(question.lock_in_level)

  if (!stem || options.length !== 4 || !answer || !options.includes(answer) || !explanation) return null

  return {
    stem,
    options,
    answer,
    explanation,
    lock_in_level: lock_in_level ?? undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const topic = typeof body?.topic === 'string' ? safeDecode(body.topic) : ''
    const domain = typeof body?.domain === 'string' ? body.domain : null

    if (!topic) {
      return NextResponse.json({ error: 'Topic required' }, { status: 400 })
    }

    const loaded = loadTopicQuestions(topic, domain)
    if (!loaded) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    const lockIn = loaded.questions
      .filter(isLockInDrillQuestion)
      .map(toLockInQuestion)
      .filter((q): q is LockInQuestion => Boolean(q))

    if (lockIn.length === 0) {
      return NextResponse.json({ error: 'No lock-in questions found for topic' }, { status: 404 })
    }

    const easier = lockIn.find((q) => q.lock_in_level === 'easier')
    const harder = lockIn.find((q) => q.lock_in_level === 'harder')

    const selected: LockInQuestion[] = []
    if (easier) selected.push(easier)
    if (harder) selected.push(harder)

    if (selected.length < 2) {
      for (const candidate of lockIn) {
        if (selected.length >= 2) break
        if (selected.some((q) => q.stem === candidate.stem)) continue
        selected.push(candidate)
      }
    }

    return NextResponse.json({ questions: selected.slice(0, 2) })
  } catch (error) {
    console.error('[lock-in-questions] Error:', error)
    return NextResponse.json({ error: 'Failed to load lock-in questions' }, { status: 500 })
  }
}

