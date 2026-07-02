import { NextRequest, NextResponse } from 'next/server'
import { EPPP_DOMAINS } from '@/lib/eppp-data'
import { loadTopicQuestions, TopicQuestion } from '@/lib/topic-question-loader'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/questions/quick?count=5&domain=1
 * Random questions from the topic question banks for the iOS Quick Study
 * modes (5-Question Sprint / 10-Minute Mode). Returns a bare JSON array in
 * the iOS `Question` shape (see ios/EPPPStudy/Models/Exam.swift).
 */

interface IOSChoice {
  id: string
  label: string
  text: string
}

interface IOSQuestion {
  id: string
  stem: string
  choices: IOSChoice[]
  correctChoiceId: string
  explanation: string
  domain: string
  subdomain: string | null
  difficulty: 'easy' | 'medium' | 'hard'
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function stripPrefix(text: string): string {
  return text.replace(/^[A-Ha-h][.)]\s*/, '').trim()
}

function toIOSQuestion(
  q: TopicQuestion,
  domainName: string,
  topicName: string,
  index: number
): IOSQuestion | null {
  const stem = q.stem ?? q.question
  const options = q.options
  const correctText = q.answer ?? q.correct_answer
  if (!stem || !options?.length || !correctText) return null

  const questionId = `quick_${topicName.replace(/\W+/g, '-').toLowerCase()}_${index}`
  const choices: IOSChoice[] = options.map((text, i) => ({
    id: `${questionId}_${LETTERS[i]?.toLowerCase() ?? i}`,
    label: LETTERS[i] ?? String(i + 1),
    text: stripPrefix(String(text ?? '')),
  }))

  const target = stripPrefix(correctText)
  const correctChoice =
    choices.find((c) => c.text === target) ??
    choices.find((c) => c.text.toLowerCase() === target.toLowerCase()) ??
    (/^[A-F]$/i.test(correctText.trim())
      ? choices.find((c) => c.label === correctText.trim().toUpperCase())
      : undefined)
  if (!correctChoice) return null

  return {
    id: questionId,
    stem,
    choices,
    correctChoiceId: correctChoice.id,
    explanation: q.explanation ?? '',
    domain: domainName,
    subdomain: topicName,
    difficulty: 'medium',
  }
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const count = Math.min(Math.max(Number(searchParams.get('count')) || 5, 1), 25)
    const domainFilter = searchParams.get('domain')

    const domains = domainFilter
      ? EPPP_DOMAINS.filter((d) => d.id === domainFilter)
      : EPPP_DOMAINS

    // Sample a handful of random topics, then random questions within them,
    // so one request doesn't read every bank file on disk.
    const topicPool = shuffle(
      domains.flatMap((d) =>
        d.topics.map((t) => ({ domainId: d.id, domainName: d.name, topicName: t.name }))
      )
    )

    const picked: IOSQuestion[] = []
    for (const topic of topicPool) {
      if (picked.length >= count) break
      const loaded = loadTopicQuestions(topic.topicName, topic.domainId)
      if (!loaded?.questions?.length) continue

      const perTopic = Math.min(2, count - picked.length)
      for (const [i, q] of shuffle(loaded.questions).slice(0, perTopic).entries()) {
        const converted = toIOSQuestion(q, topic.domainName, topic.topicName, picked.length + i)
        if (converted) picked.push(converted)
      }
    }

    if (!picked.length) {
      return NextResponse.json({ error: 'No questions available' }, { status: 404 })
    }

    return NextResponse.json(shuffle(picked).slice(0, count))
  } catch (error) {
    console.error('[Mobile Quick Questions] Error:', error)
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }
}
