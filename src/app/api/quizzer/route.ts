import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { loadTopicQuestions, TopicQuestion } from '@/lib/topic-question-loader'
import { loadFullTopicContent } from '@/lib/topic-content-manager'
import { deriveTopicMetaFromSourceFile } from '@/lib/topic-source-utils'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const QUIZZER_PROMPT = `You are an expert EPPP quiz generator. Your task is to generate exactly 10 multiple-choice questions on the given topic.

Requirements:
- 10 questions total (8 scored + 2 unscored experimental)
- 4 options per question (A, B, C, D)
- Scored questions (8): Mix of medium difficulty questions that count toward the score
- Unscored questions (2): Noticeably harder experimental questions that DO NOT count toward score
- Focus on concepts that might appear on the EPPP exam
- Include one correct answer per question
- Provide brief explanations for why the correct answer is right
- Include "relatedSections" - a list of 1-2 key concepts/section names that this question is about
  * Use specific, concise terms (3-5 words max)
  * These should be main topics or subtopics from the lesson
  * Examples: "Classical Conditioning", "Operant Conditioning", "Reinforcement Schedules"
  * Be consistent - reuse section names across multiple questions when appropriate
- Mark unscored questions with "isScored": false (these 2 questions should be the hardest)
- Mark scored questions with "isScored": true (default for all others)

Return the quiz in this exact JSON format:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct",
      "relatedSections": ["Main Concept", "Sub-concept"],
      "isScored": true
    }
  ]
}

IMPORTANT: Include exactly 2 questions with "isScored": false (the hardest ones). All others should have "isScored": true or omit the field (defaults to true).

Generate a quiz now. Return ONLY the JSON, no other text.`

type SectionInfo = { title: string; text: string }
const topicSectionCache = new Map<string, SectionInfo[]>()

function getTopicSections(topicName: string, domainId?: string | null) {
  const key = `${topicName}__${domainId || ''}`
  if (topicSectionCache.has(key)) return topicSectionCache.get(key)!

  const content = loadFullTopicContent(topicName, domainId || '')
  if (!content) {
    topicSectionCache.set(key, [])
    return []
  }

  const lines = content.split('\n')
  const sections: SectionInfo[] = []
  let current: SectionInfo | null = null

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,3})\s+(.*)$/)
    if (headingMatch) {
      if (current) sections.push(current)
      current = { title: headingMatch[2].trim(), text: '' }
    } else if (current) {
      current.text += line + '\n'
    }
  }
  if (current) sections.push(current)

  topicSectionCache.set(key, sections)
  return sections
}

const normalizeTokens = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)

const jaccardSimilarity = (a: string[], b: string[]): number => {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let intersection = 0
  setA.forEach((token) => {
    if (setB.has(token)) intersection++
  })
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

function isMeaningfulSection(section: string, topicName: string) {
  const normalizedSection = section.trim().toLowerCase()
  const normalizedTopic = topicName.trim().toLowerCase()
  if (!normalizedSection) return false
  return normalizedSection !== normalizedTopic
}

function attachSectionsToQuestion(
  question: any,
  topicName: string,
  domainId?: string | null
) {
  if (!topicName) return question

  const hasMeaningful =
    Array.isArray(question.relatedSections) &&
    question.relatedSections.some((section: string) =>
      section && isMeaningfulSection(section, topicName)
    )

  if (hasMeaningful) {
    return question
  }

  const sections = getTopicSections(topicName, domainId)
  if (!sections || sections.length === 0) {
    question.relatedSections = [topicName]
    return question
  }

  const questionText = `${question.question ?? ''} ${question.explanation ?? ''}`
  const qTokens = normalizeTokens(questionText)

  const scoredSections = sections
    .map((section) => {
      const sectionTokens = normalizeTokens(`${section.title} ${section.text}`)
      const titleTokens = normalizeTokens(section.title)
      const baseScore = jaccardSimilarity(qTokens, sectionTokens)

      // Bonus when question keywords appear in section TITLE (not just body)
      const titleOverlap = qTokens.filter(t => titleTokens.includes(t)).length
      const titleBonus = titleOverlap > 0 ? 0.2 + (titleOverlap * 0.1) : 0

      const score = baseScore + titleBonus
      return { title: section.title, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const topMatches = scoredSections.slice(0, 2).filter((s) => s.score >= 0.05)
  if (topMatches.length > 0) {
    question.relatedSections = topMatches.map((s) => s.title)
  } else {
    question.relatedSections = [topicName]
  }

  return question
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeDomain(domain?: string | null): string | undefined {
  if (!domain) return undefined
  return domain.split(':')[0].trim()
}

function shuffleArray<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function buildQuizFromLocalQuestions(topicName: string, domain?: string) {
  const loaded = loadTopicQuestions(topicName, domain)
  if (!loaded) return null

  const fileMeta = deriveTopicMetaFromSourceFile(loaded.filePath)
  const derivedTopicName = fileMeta?.topicName || topicName
  const derivedDomainId = fileMeta?.domainId || domain

  const validQuestions = loaded.questions.filter((q: TopicQuestion) => {
    const prompt = q.stem ?? q.question
    const options = Array.isArray(q.options) ? q.options.filter((opt) => typeof opt === 'string' && opt.trim().length > 0) : []
    const answer = q.answer ?? q.correct_answer
    return (
      typeof prompt === 'string' &&
      prompt.trim().length > 0 &&
      options.length >= 2 &&
      typeof answer === 'string' &&
      options.includes(answer)
    )
  })

  if (validQuestions.length < 10) {
    console.warn(`[Quizzer] Not enough valid questions for topic "${topicName}" (found ${validQuestions.length})`)
    return null
  }

  const selected = shuffleArray(validQuestions).slice(0, 10)
  const unscoredIndices = new Set<number>()

  while (unscoredIndices.size < Math.min(2, selected.length)) {
    unscoredIndices.add(Math.floor(Math.random() * selected.length))
  }

  return selected.map((q, idx) => {
    const baseOptions = shuffleArray(
      (Array.isArray(q.options) ? q.options : []).filter((opt) => typeof opt === 'string' && opt.trim().length > 0)
    )
    const correctAnswer = q.answer ?? q.correct_answer ?? baseOptions[0]

    const question = {
      id: idx + 1,
      question: q.stem ?? q.question ?? '',
      options: baseOptions,
      correctAnswer,
      explanation: q.explanation ?? '',
      relatedSections: q.relatedSections && q.relatedSections.length > 0 ? q.relatedSections : [derivedTopicName],
      isScored: !unscoredIndices.has(idx),
    }

    return attachSectionsToQuestion(question, derivedTopicName, derivedDomainId)
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, domain } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic required' },
        { status: 400 }
      )
    }

    const decodedTopic = safeDecode(topic)
    const normalizedDomain = normalizeDomain(domain)

    const localQuiz = decodedTopic ? buildQuizFromLocalQuestions(decodedTopic, normalizedDomain) : null
    if (localQuiz) {
      console.log(`[Quizzer] Serving local quiz for topic "${decodedTopic}" (${normalizedDomain ?? 'any domain'})`)
      return NextResponse.json({ questions: localQuiz })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `${QUIZZER_PROMPT}\n\nTopic: ${decodedTopic}`,
        },
      ],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse quiz JSON from response')
    }

    const quizData = JSON.parse(jsonMatch[0])

    if (decodedTopic && Array.isArray(quizData.questions)) {
      quizData.questions = quizData.questions.map((question: any, idx: number) => {
        const withId = { id: question.id ?? idx + 1, ...question }
        return attachSectionsToQuestion(withId, decodedTopic, normalizedDomain)
      })
    }

    return NextResponse.json(quizData)
  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}
