import { NextRequest, NextResponse } from 'next/server'
import { logUsageEvent } from '@/lib/usage-events'
import { getOpenAIApiKey } from '@/lib/openai-api-key'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const openaiApiKey = getOpenAIApiKey()

type AudioFormat = 'mp3' | 'wav' | 'aac' | 'opus' | 'flac'

export const runtime = 'nodejs'

const DEFAULT_TTS_MODEL = 'gpt-4o-mini-tts'
const FALLBACK_TTS_MODEL = 'tts-1'
const DEFAULT_VOICE = 'alloy'
const MAX_INPUT_CHARS = 5000
const AUDIO_CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'topic-teacher-audio')
const MAX_MEMORY_CACHE_BYTES = 75 * 1024 * 1024

type MemoryCacheEntry = {
  buffer: Buffer
  size: number
}

type MemoryCacheState = {
  map: Map<string, MemoryCacheEntry>
  bytes: number
}

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

function getMemoryCache(): MemoryCacheState {
  const g = globalThis as unknown as {
    __topicTeacherAudioCache?: MemoryCacheState
  }
  if (!g.__topicTeacherAudioCache) {
    g.__topicTeacherAudioCache = { map: new Map(), bytes: 0 }
  }
  return g.__topicTeacherAudioCache
}

function pruneMemoryCache(state: MemoryCacheState): void {
  while (state.bytes > MAX_MEMORY_CACHE_BYTES && state.map.size > 0) {
    const firstKey = state.map.keys().next().value as string | undefined
    if (!firstKey) break
    const entry = state.map.get(firstKey)
    state.map.delete(firstKey)
    state.bytes -= entry?.size ?? 0
  }
}

function getCacheFilePath(cacheKey: string, format: AudioFormat): string {
  return path.join(AUDIO_CACHE_DIR, `${cacheKey}.${format}`)
}

function readAudioFromCache(cacheKey: string, format: AudioFormat): Buffer | null {
  const memory = getMemoryCache()
  const cached = memory.map.get(cacheKey)
  if (cached) {
    // Refresh insertion order for simple LRU behavior.
    memory.map.delete(cacheKey)
    memory.map.set(cacheKey, cached)
    return cached.buffer
  }

  const filePath = getCacheFilePath(cacheKey, format)
  try {
    const buffer = fs.readFileSync(filePath)
    memory.map.set(cacheKey, { buffer, size: buffer.byteLength })
    memory.bytes += buffer.byteLength
    pruneMemoryCache(memory)
    return buffer
  } catch {
    return null
  }
}

function writeAudioToCache(cacheKey: string, format: AudioFormat, buffer: Buffer): void {
  const memory = getMemoryCache()
  const existing = memory.map.get(cacheKey)
  if (existing) {
    memory.bytes -= existing.size
  }

  memory.map.set(cacheKey, { buffer, size: buffer.byteLength })
  memory.bytes += buffer.byteLength
  pruneMemoryCache(memory)

  try {
    fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true })
    fs.writeFileSync(getCacheFilePath(cacheKey, format), buffer)
  } catch {
    // Best-effort cache; ignore filesystem errors (e.g., read-only or serverless).
  }
}

function normalizeSpeechInput(raw: string): string {
  return raw.replace(/\bE\.?P\.?P\.?P\.?\b/gi, 'E triple P').trim()
}

function computeCacheKey(input: {
  model: string
  voice: string
  format: AudioFormat
  speed: number
  text: string
}): string {
  const fingerprint = [
    'topic-teacher-audio-v1',
    input.model,
    input.voice,
    input.format,
    input.speed.toString(),
    input.text,
  ].join('|')
  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

function normalizeFormat(raw: unknown): AudioFormat {
  if (raw === 'wav' || raw === 'aac' || raw === 'opus' || raw === 'flac') return raw
  return 'mp3'
}

function normalizeSpeed(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 1
  return Math.min(3, Math.max(0.5, raw))
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

  const rawText = typeof body.text === 'string' ? body.text.trim() : ''
  const cacheable = body.cacheable === true
  const text = normalizeSpeechInput(rawText)
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

  if (cacheable) {
    const primaryKey = computeCacheKey({ model, voice, format, speed, text })
    const primaryHit = readAudioFromCache(primaryKey, format)
    if (primaryHit) {
      return new NextResponse(primaryHit, {
        headers: {
          'Content-Type': contentTypeForFormat(format),
          'Cache-Control': 'no-store',
          'Content-Disposition': `inline; filename="topic-teacher.${format}"`,
        },
      })
    }

    if (model === DEFAULT_TTS_MODEL) {
      const fallbackKey = computeCacheKey({ model: FALLBACK_TTS_MODEL, voice, format, speed, text })
      const fallbackHit = readAudioFromCache(fallbackKey, format)
      if (fallbackHit) {
        return new NextResponse(fallbackHit, {
          headers: {
            'Content-Type': contentTypeForFormat(format),
            'Cache-Control': 'no-store',
            'Content-Disposition': `inline; filename="topic-teacher.${format}"`,
          },
        })
      }
    }
  }

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
  const audioBuffer = Buffer.from(audioArrayBuffer)

  if (cacheable) {
    const cacheKeyUsed = computeCacheKey({ model: modelUsed, voice, format, speed, text })
    writeAudioToCache(cacheKeyUsed, format, audioBuffer)
  }

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
      cacheable,
    },
  })

  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': contentTypeForFormat(format),
      'Cache-Control': 'no-store',
      'Content-Disposition': `inline; filename="topic-teacher.${format}"`,
    },
  })
}
