import { NextRequest, NextResponse } from 'next/server'
import { logUsageEvent } from '@/lib/usage-events'
import { getOpenAIApiKey } from '@/lib/openai-api-key'

const openaiApiKey = getOpenAIApiKey()

type AudioFormat = 'mp3' | 'wav' | 'aac' | 'opus' | 'flac'

const DEFAULT_TTS_MODEL = 'gpt-4o-mini-tts'
const FALLBACK_TTS_MODEL = 'tts-1'
const DEFAULT_VOICE = 'alloy'
const MAX_INPUT_CHARS = 5000

function contentTypeForFormat(format: AudioFormat): string {
  switch (format) {
    case 'mp3':
      return 'audio/mpeg'
    case 'wav':
      return 'audio/wav'
    case 'aac':
      return 'audio/aac'
    case 'opus':
      return 'audio/opus'
    case 'flac':
      return 'audio/flac'
    default:
      return 'application/octet-stream'
  }
}

function normalizeFormat(raw: unknown): AudioFormat {
  if (raw === 'wav' || raw === 'aac' || raw === 'opus' || raw === 'flac') return raw
  return 'mp3'
}

function normalizeSpeed(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 1
  return Math.min(2, Math.max(0.5, raw))
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

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
  }

  if (text.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: `Text is too long (${text.length} chars). Please generate audio in smaller chunks.` },
      { status: 400 }
    )
  }

  const format = normalizeFormat(body.format)
  const voice = typeof body.voice === 'string' && body.voice.trim() ? body.voice.trim() : DEFAULT_VOICE
  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : DEFAULT_TTS_MODEL
  const speed = normalizeSpeed(body.speed)

  const userId = typeof body.userId === 'string' ? body.userId : null
  const topic = typeof body.topic === 'string' ? body.topic : null
  const domain = typeof body.domain === 'string' ? body.domain : null
  const mode = typeof body.mode === 'string' ? body.mode : null
  const languagePreference = typeof body.languagePreference === 'string' ? body.languagePreference : null

  const requestSpeech = (modelToUse: string) =>
    fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: modelToUse,
        voice,
        input: text,
        response_format: format,
        speed,
      }),
    })

  let modelUsed = model
  let openaiResponse = await requestSpeech(modelUsed)
  let errorText: string | null = null

  // Best-effort fallback for projects that don't yet have access to newer TTS models.
  if (!openaiResponse.ok && modelUsed === DEFAULT_TTS_MODEL) {
    errorText = await openaiResponse.text()
    const lower = errorText.toLowerCase()
    const looksLikeModelError =
      lower.includes('model') || lower.includes('not found') || openaiResponse.status === 404

    if (looksLikeModelError) {
      modelUsed = FALLBACK_TTS_MODEL
      openaiResponse = await requestSpeech(modelUsed)
      errorText = null
    }
  }

  if (!openaiResponse.ok) {
    const finalErrorText = errorText ?? (await openaiResponse.text())
    const normalized = finalErrorText.toLowerCase()
    const isInvalidKey =
      openaiResponse.status === 401 &&
      (normalized.includes('incorrect api key') || normalized.includes('invalid_api_key'))

    return NextResponse.json(
      {
        error: isInvalidKey
          ? 'Invalid OpenAI API key. Update `OPENAI_API_KEY` in `.env.local` (and redeploy/restart) and try again.'
          : finalErrorText || 'Failed to generate audio.',
      },
      { status: openaiResponse.status || 500 }
    )
  }

  const audioArrayBuffer = await openaiResponse.arrayBuffer()

  await logUsageEvent({
    userId,
    eventName: 'topic-teacher.audio',
    endpoint: '/api/topic-teacher/audio',
    model: modelUsed,
    metadata: {
      voice,
      format,
      speed,
      chars: text.length,
      topic,
      domain,
      mode,
      languagePreference,
    },
  })

  return new NextResponse(Buffer.from(audioArrayBuffer), {
    headers: {
      'Content-Type': contentTypeForFormat(format),
      'Cache-Control': 'no-store',
      'Content-Disposition': `inline; filename="topic-teacher.${format}"`,
    },
  })
}
