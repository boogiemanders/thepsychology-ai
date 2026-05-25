import { NextRequest, NextResponse } from 'next/server'
import OpenAI, { toFile } from 'openai'
import { getOpenAIApiKey } from '@/lib/openai-api-key'
import { logUsageEvent } from '@/lib/usage-events'

export const runtime = 'nodejs'
export const maxDuration = 60

type WhisperWord = { word: string; start: number; end: number }

const ALLOWED_MIME_PREFIXES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
const MAX_BYTES = 15 * 1024 * 1024

export async function POST(request: NextRequest) {
  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Transcription is not configured (missing OPENAI_API_KEY).' },
      { status: 500 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data body.' }, { status: 400 })
  }

  const audio = formData.get('audio')
  const trial = formData.get('trial')
  const prompt = formData.get('prompt')
  const sessionId = formData.get('sessionId')

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: 'audio field is required.' }, { status: 400 })
  }
  if (audio.size === 0) {
    return NextResponse.json({ error: 'audio is empty.' }, { status: 400 })
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: 'audio exceeds 15MB limit.' }, { status: 413 })
  }

  const mime = audio.type || 'audio/webm'
  if (!ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
    return NextResponse.json({ error: `Unsupported audio type: ${mime}` }, { status: 415 })
  }

  const buffer = Buffer.from(await audio.arrayBuffer())
  const ext =
    mime.includes('ogg') ? 'ogg'
    : mime.includes('mp4') ? 'mp4'
    : mime.includes('mpeg') ? 'mp3'
    : mime.includes('wav') ? 'wav'
    : 'webm'

  const promptHint =
    typeof prompt === 'string' && prompt.trim()
      ? trial === 'letter'
        ? `Single-word responses. Words starting with the letter ${prompt}.`
        : `Single-word responses naming ${prompt.toLowerCase()}.`
      : 'Single-word verbal fluency responses.'

  const client = new OpenAI({ apiKey })
  const file = await toFile(buffer, `fluency.${ext}`, { type: mime })

  let response: any
  try {
    response = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
      temperature: 0,
      language: 'en',
      prompt: promptHint.slice(0, 500),
    })
  } catch (err: any) {
    console.error('[transcribe-fluency] Whisper error:', err?.message ?? err)
    return NextResponse.json({ error: 'Transcription failed.' }, { status: 502 })
  }

  const rawWords: WhisperWord[] = Array.isArray(response?.words)
    ? response.words
        .map((w: any) => ({
          word: typeof w?.word === 'string' ? w.word : '',
          start: typeof w?.start === 'number' ? w.start : NaN,
          end: typeof w?.end === 'number' ? w.end : NaN,
        }))
        .filter((w: WhisperWord) => w.word.trim() && Number.isFinite(w.start) && Number.isFinite(w.end))
    : []

  const fullText = typeof response?.text === 'string' ? response.text : rawWords.map((w) => w.word).join(' ')
  const estimatedSeconds = Math.ceil(buffer.byteLength / 16000)

  void logUsageEvent({
    eventName: 'ef-battery.verbal-fluency.transcribe',
    endpoint: '/api/ef-battery/transcribe-fluency',
    model: 'whisper-1',
    metadata: {
      sessionId: typeof sessionId === 'string' ? sessionId : null,
      trial: typeof trial === 'string' ? trial : null,
      prompt: typeof prompt === 'string' ? prompt : null,
      audioBytes: buffer.byteLength,
      audioSeconds: estimatedSeconds,
      wordCount: rawWords.length,
    },
  })

  return NextResponse.json({ words: rawWords, fullText })
}
