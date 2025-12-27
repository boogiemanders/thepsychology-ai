import { NextRequest, NextResponse } from 'next/server'
import { logUsageEvent } from '@/lib/usage-events'

const openaiApiKey = process.env.OPENAI_API_KEY

type Speaker = 'host' | 'cohost'

type PodcastScript = {
  segments: Array<{
    speaker: Speaker
    text: string
  }>
}

const DEFAULT_MODEL = 'gpt-4o-mini'
const MAX_LESSON_CHARS = 40000
const MAX_SEGMENTS = 14
const MAX_SEGMENT_CHARS = 900

function extractJsonObject(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  const withoutFences = trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()

  const first = withoutFences.indexOf('{')
  const last = withoutFences.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) return null
  return withoutFences.slice(first, last + 1)
}

function coerceSpeaker(raw: unknown, fallback: Speaker): Speaker {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (value === 'host' || value === 'cohost') return value
  if (value === 'a' || value === 'speaker_a' || value === 'speaker a' || value === 'speaker1' || value === 'speaker_1') {
    return 'host'
  }
  if (value === 'b' || value === 'speaker_b' || value === 'speaker b' || value === 'speaker2' || value === 'speaker_2') {
    return 'cohost'
  }
  return fallback
}

function normalizeScript(parsed: any): PodcastScript | null {
  const segments = Array.isArray(parsed?.segments) ? parsed.segments : null
  if (!segments) return null

  const normalized: PodcastScript['segments'] = []
  let fallback: Speaker = 'host'

  for (const seg of segments) {
    const text = typeof seg?.text === 'string' ? seg.text.trim() : ''
    if (!text) continue

    const speaker = coerceSpeaker(seg?.speaker, fallback)
    fallback = speaker === 'host' ? 'cohost' : 'host'

    normalized.push({
      speaker,
      text: text.length > MAX_SEGMENT_CHARS ? text.slice(0, MAX_SEGMENT_CHARS).trim() : text,
    })

    if (normalized.length >= MAX_SEGMENTS) break
  }

  if (normalized.length === 0) return null
  return { segments: normalized }
}

export async function POST(request: NextRequest) {
  if (!openaiApiKey) {
    return NextResponse.json(
      { error: 'Topic Teacher audio is not configured (missing OPENAI_API_KEY).' },
      { status: 500 }
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const lessonMarkdown = typeof body.lessonMarkdown === 'string' ? body.lessonMarkdown.trim() : ''
  if (!lessonMarkdown) {
    return NextResponse.json(
      { error: 'Lesson content is required.' },
      { status: 400 }
    )
  }

  if (lessonMarkdown.length > MAX_LESSON_CHARS) {
    return NextResponse.json(
      { error: 'Lesson content is too long to convert to a podcast script.' },
      { status: 400 }
    )
  }

  const topic = typeof body.topic === 'string' ? body.topic : null
  const domain = typeof body.domain === 'string' ? body.domain : null
  const userInterests = typeof body.userInterests === 'string' ? body.userInterests : null
  const languagePreference = typeof body.languagePreference === 'string' ? body.languagePreference : null
  const userId = typeof body.userId === 'string' ? body.userId : null

  const prompt = `You are creating a NotebookLM-style audio for a student learning psychology (EPPP).

Create a short, engaging, calm conversation between two speakers:
- "host": the guide who keeps structure and asks helpful questions
- "cohost": the teacher who explains clearly with examples

Requirements:
- Use the source lesson below as the ONLY source of truth.
- Keep any updated, interest-based metaphors/examples from the lesson.
- If the student's interests are provided, you can weave them in without changing the underlying meaning.
- Match the language of the source lesson (it may not be English).
- Do NOT output markdown, tables, bullet symbols, or speaker labels inside the text. Plain text only.
- Output STRICT JSON exactly in this shape:
  {"segments":[{"speaker":"host","text":"..."},{"speaker":"cohost","text":"..."}]}
- 10 to 14 segments total.
- Each segment text: 1-3 short paragraphs, maximum ${MAX_SEGMENT_CHARS} characters.
- Avoid excessive enthusiasm/exclamation marks. No filler words.

Student interests (optional): ${userInterests ? userInterests : 'none'}

Source lesson:
${lessonMarkdown}`

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.6,
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  await logUsageEvent({
    userId,
    eventName: 'topic-teacher.audio-script',
    endpoint: '/api/topic-teacher/audio-script',
    model: DEFAULT_MODEL,
    metadata: {
      topic,
      domain,
      languagePreference,
      hasInterests: Boolean(userInterests && userInterests.trim()),
    },
  })

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text()
    return NextResponse.json(
      { error: errorText || 'Failed to generate audio script.' },
      { status: openaiResponse.status || 500 }
    )
  }

  const data: any = await openaiResponse.json()
  const raw = data?.choices?.[0]?.message?.content
  if (!raw || typeof raw !== 'string') {
    return NextResponse.json(
      { error: 'No script returned from model.' },
      { status: 500 }
    )
  }

  const jsonText = extractJsonObject(raw)
  if (!jsonText) {
    return NextResponse.json(
      { error: 'Model did not return valid JSON.' },
      { status: 500 }
    )
  }

  try {
    const parsed = JSON.parse(jsonText)
    const script = normalizeScript(parsed)
    if (!script) {
      return NextResponse.json(
        { error: 'Model returned JSON but it did not match the expected format.' },
        { status: 500 }
      )
    }

    return NextResponse.json(script)
  } catch (error) {
    console.error('[topic-teacher.audio-script] JSON parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse model JSON.' },
      { status: 500 }
    )
  }
}

