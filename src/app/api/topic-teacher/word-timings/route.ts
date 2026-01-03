import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIApiKey } from '@/lib/openai-api-key'
import { normalizeTextForReadAlong } from '@/lib/speech-text'
import OpenAI, { toFile } from 'openai'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'

export const runtime = 'nodejs'

type WordTiming = { word: string; start: number; end: number }

type CachePayload = {
  version: 1
  audioKey: string
  wordsHash: string
  words: string[]
  timings: WordTiming[]
  createdAt: string
}

const WORD_REGEX = /[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g
const DEFAULT_AUDIO_FORMAT = 'mp3'
const AUDIO_CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'topic-teacher-audio')
const WORD_TIMINGS_CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'topic-teacher-audio-words')
const R2_PREFIX = path.posix.join('topic-teacher-audio', 'v1')

function normalizeReadAlongWord(word: string): string {
  const normalized = word.trim().toLowerCase()
  return normalized.replace(/['\u2019]s$/i, '')
}

function tokenizeNormalizedWords(text: string): string[] {
  const normalizedText = normalizeTextForReadAlong(text)
  const matches = normalizedText.match(WORD_REGEX)
  return matches ? matches.map((w) => normalizeReadAlongWord(w)).filter(Boolean) : []
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function computeWordsHash(words: string[]): string {
  return sha256Hex(words.join('|'))
}

function getWordsCachePath(audioKey: string): string {
  return path.join(WORD_TIMINGS_CACHE_DIR, `${audioKey}.words.json`)
}

function readCacheFromDisk(audioKey: string): CachePayload | null {
  try {
    const raw = fs.readFileSync(getWordsCachePath(audioKey), 'utf8')
    const parsed = JSON.parse(raw) as CachePayload
    if (parsed?.version !== 1) return null
    if (typeof parsed.audioKey !== 'string' || parsed.audioKey !== audioKey) return null
    if (!Array.isArray(parsed.words) || !Array.isArray(parsed.timings)) return null
    if (typeof parsed.wordsHash !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

function writeCacheToDisk(payload: CachePayload): void {
  try {
    fs.mkdirSync(WORD_TIMINGS_CACHE_DIR, { recursive: true })
    fs.writeFileSync(getWordsCachePath(payload.audioKey), JSON.stringify(payload))
  } catch {
    // ignore
  }
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function getR2Client(): { client: S3Client; bucket: string } | null {
  const g = globalThis as unknown as {
    __topicTeacherR2Client?: { client: S3Client; bucket: string } | null
  }
  if (g.__topicTeacherR2Client !== undefined) return g.__topicTeacherR2Client

  const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '').trim()
  const bucket = (process.env.CLOUDFLARE_R2_BUCKET || '').trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    g.__topicTeacherR2Client = null
    return null
  }

  const endpoint = (
    process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`
  ).trim()

  g.__topicTeacherR2Client = {
    bucket,
    client: new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    }),
  }
  return g.__topicTeacherR2Client
}

async function readObjectFromR2(key: string): Promise<Buffer | null> {
  const r2 = getR2Client()
  if (!r2) return null
  try {
    const obj = await r2.client.send(new GetObjectCommand({ Bucket: r2.bucket, Key: key }))
    const body = obj.Body
    if (!body) return null
    if (Buffer.isBuffer(body)) return body
    if (typeof body === 'string') return Buffer.from(body)
    if (body instanceof Uint8Array) return Buffer.from(body)
    if (typeof (body as any).transformToByteArray === 'function') {
      const arr = await (body as any).transformToByteArray()
      return Buffer.from(arr)
    }
    return await streamToBuffer(body as Readable)
  } catch {
    return null
  }
}

async function writeObjectToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  const r2 = getR2Client()
  if (!r2) return
  try {
    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    )
  } catch (err) {
    console.warn('[topic-teacher.word-timings] Failed to upload timings to R2:', err)
  }
}

type WhisperWord = { word: string; start: number; end: number }

function expandTranscriptToken(token: WhisperWord): WhisperWord[] {
  const raw = token.word ?? ''
  const normalizedText = normalizeTextForReadAlong(raw)
  const matches = normalizedText.match(WORD_REGEX)
  const words = matches ? matches.map((w) => normalizeReadAlongWord(w)).filter(Boolean) : []
  if (words.length === 0) return []
  if (words.length === 1) {
    return [{ word: words[0], start: token.start, end: token.end }]
  }

  const duration = Math.max(0, token.end - token.start)
  const step = duration / words.length
  return words.map((word, idx) => ({
    word,
    start: token.start + step * idx,
    end: token.start + step * (idx + 1),
  }))
}

function buildLcsIndexMap(expected: string[], transcript: string[]): Array<number | null> {
  const n = expected.length
  const m = transcript.length
  if (n === 0 || m === 0) return new Array(n).fill(null)
  if (n > 65000 || m > 65000) return new Array(n).fill(null)

  const rowLen = m + 1
  const dirs = new Uint8Array((n + 1) * rowLen)
  let prev = new Uint16Array(rowLen)
  let curr = new Uint16Array(rowLen)

  for (let i = 1; i <= n; i += 1) {
    curr[0] = 0
    const expectedWord = expected[i - 1] ?? ''
    const baseIdx = i * rowLen

    for (let j = 1; j <= m; j += 1) {
      if (expectedWord === (transcript[j - 1] ?? '')) {
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

  const map: Array<number | null> = new Array(n).fill(null)
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    const dir = dirs[i * rowLen + j]
    if (dir === 1) {
      map[i - 1] = j - 1
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

function fillTimingGaps(
  expectedWords: string[],
  mapped: Array<{ start: number; end: number } | null>,
  audioEnd: number
): WordTiming[] {
  const filled: WordTiming[] = new Array(expectedWords.length)

  let lastKnown = -1
  for (let i = 0; i < expectedWords.length; i += 1) {
    if (mapped[i]) {
      lastKnown = i
      filled[i] = { word: expectedWords[i], start: mapped[i]!.start, end: mapped[i]!.end }
      continue
    }

    let j = i + 1
    while (j < expectedWords.length && !mapped[j]) j += 1

    const prevEnd = lastKnown >= 0 ? mapped[lastKnown]!.end : 0
    const nextStart = j < expectedWords.length ? mapped[j]!.start : Number.isFinite(audioEnd) ? audioEnd : prevEnd
    const gapSize = j - i
    const window = Math.max(0, nextStart - prevEnd)
    const step = gapSize > 0 && window > 0 ? window / gapSize : 0

    for (let k = 0; k < gapSize; k += 1) {
      const start = prevEnd + step * k
      const end = prevEnd + step * (k + 1)
      filled[i + k] = { word: expectedWords[i + k], start, end }
    }

    i = j - 1
  }

  let prevStart = 0
  for (let i = 0; i < filled.length; i += 1) {
    const next = filled[i]
    const startRaw = Number.isFinite(next.start) ? next.start : prevStart
    const start = Math.max(prevStart, startRaw)
    const endRaw = Number.isFinite(next.end) ? next.end : start
    const end = Math.max(start, endRaw)
    filled[i] = { ...next, start, end }
    prevStart = start
  }

  return filled
}

async function transcribeAudioWithWordTimes(audioBuffer: Buffer, prompt: string, apiKey: string): Promise<WhisperWord[]> {
  const client = new OpenAI({ apiKey })
  const file = await toFile(audioBuffer, 'segment.mp3', { type: 'audio/mpeg' })
  const response: any = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
    temperature: 0,
    language: 'en',
    prompt: prompt.slice(0, 5000),
  })

  if (Array.isArray(response?.words)) {
    return response.words
      .map((w: any) => ({
        word: typeof w?.word === 'string' ? w.word : '',
        start: typeof w?.start === 'number' ? w.start : NaN,
        end: typeof w?.end === 'number' ? w.end : NaN,
      }))
      .filter((w: WhisperWord) => w.word.trim() && Number.isFinite(w.start) && Number.isFinite(w.end))
  }

  const segments = Array.isArray(response?.segments) ? response.segments : []
  const words: WhisperWord[] = []
  for (const segment of segments) {
    if (!Array.isArray(segment?.words)) continue
    for (const w of segment.words) {
      const word = typeof w?.word === 'string' ? w.word : ''
      const start = typeof w?.start === 'number' ? w.start : NaN
      const end = typeof w?.end === 'number' ? w.end : NaN
      if (!word.trim() || !Number.isFinite(start) || !Number.isFinite(end)) continue
      words.push({ word, start, end })
    }
  }
  return words
}

function readAudioFromDisk(audioKey: string): Buffer | null {
  const filePath = path.join(AUDIO_CACHE_DIR, `${audioKey}.${DEFAULT_AUDIO_FORMAT}`)
  try {
    return fs.readFileSync(filePath)
  } catch {
    return null
  }
}

function readAudioFromPublic(audioKey: string): Buffer | null {
  const filePath = path.join(process.cwd(), 'public', 'topic-teacher-audio', 'v1', `${audioKey}.${DEFAULT_AUDIO_FORMAT}`)
  try {
    return fs.readFileSync(filePath)
  } catch {
    return null
  }
}

async function readAudioFromRemote(audioKey: string): Promise<Buffer | null> {
  const base = (process.env.NEXT_PUBLIC_TOPIC_TEACHER_AUDIO_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!base) return null
  if (!/^https?:\/\//i.test(base)) return null

  const url = `${base}/${audioKey}.${DEFAULT_AUDIO_FORMAT}`
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) return null
    const bytes = await response.arrayBuffer()
    return Buffer.from(bytes)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Word timings are not configured (missing OPENAI_API_KEY).' },
      { status: 500 }
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const audioKey = typeof body.audioKey === 'string' ? body.audioKey.trim() : ''
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!audioKey || !/^[a-f0-9]{64}$/i.test(audioKey)) {
    return NextResponse.json({ error: 'audioKey is required.' }, { status: 400 })
  }
  if (!text) {
    return NextResponse.json({ error: 'text is required.' }, { status: 400 })
  }

  const expectedWords = tokenizeNormalizedWords(text)
  const wordsHash = computeWordsHash(expectedWords)

  const diskHit = readCacheFromDisk(audioKey)
  if (diskHit && diskHit.wordsHash === wordsHash && diskHit.timings.length === expectedWords.length) {
    return NextResponse.json(diskHit)
  }

  const r2Key = `${R2_PREFIX}/${audioKey}.words.json`
  const r2HitBuffer = await readObjectFromR2(r2Key)
  if (r2HitBuffer) {
    try {
      const parsed = JSON.parse(r2HitBuffer.toString('utf8')) as CachePayload
      if (parsed?.version === 1 && parsed.audioKey === audioKey && parsed.wordsHash === wordsHash) {
        writeCacheToDisk(parsed)
        return NextResponse.json(parsed)
      }
    } catch {
      // ignore
    }
  }

  const audioBuffer =
    readAudioFromDisk(audioKey) ??
    readAudioFromPublic(audioKey) ??
    (await readAudioFromRemote(audioKey)) ??
    (await readObjectFromR2(`${R2_PREFIX}/${audioKey}.mp3`))
  if (!audioBuffer) {
    return NextResponse.json({ error: 'Audio segment not found.' }, { status: 404 })
  }

  const whisperWordsRaw = await transcribeAudioWithWordTimes(audioBuffer, text, apiKey)
  const expandedWhisperWords: WhisperWord[] = []
  for (const token of whisperWordsRaw) {
    expandedWhisperWords.push(...expandTranscriptToken(token))
  }

  const transcriptWords = expandedWhisperWords.map((w) => w.word)
  const mapping = buildLcsIndexMap(expectedWords, transcriptWords)
  const mappedTimings: Array<{ start: number; end: number } | null> = expectedWords.map(() => null)

  mapping.forEach((transcriptIndex, expectedIndex) => {
    if (transcriptIndex === null || transcriptIndex === undefined) return
    const match = expandedWhisperWords[transcriptIndex]
    if (!match) return
    mappedTimings[expectedIndex] = { start: match.start, end: match.end }
  })

  const audioEnd = expandedWhisperWords.length > 0 ? expandedWhisperWords[expandedWhisperWords.length - 1]!.end : NaN
  const timings = fillTimingGaps(expectedWords, mappedTimings, audioEnd)

  const payload: CachePayload = {
    version: 1,
    audioKey,
    wordsHash,
    words: expectedWords,
    timings,
    createdAt: new Date().toISOString(),
  }

  writeCacheToDisk(payload)
  await writeObjectToR2(r2Key, Buffer.from(JSON.stringify(payload)), 'application/json')

  return NextResponse.json(payload)
}
