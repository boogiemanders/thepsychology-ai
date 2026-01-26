/**
 * Pre-generate Topic Teacher audio with MFA (Montreal Forced Aligner) for perfect word synchronization.
 *
 * This script:
 * 1. Loads v4 topic lesson files
 * 2. Parses them into stable/metaphor chunks
 * 3. Generates TTS audio (WAV format for MFA)
 * 4. Runs MFA batch alignment on the corpus
 * 5. Parses TextGrid outputs for word timings
 * 6. Converts WAV to MP3
 * 7. Uploads to R2: audio, timings, and manifests
 *
 * Prerequisites:
 *   - MFA installed: conda create -n mfa -c conda-forge montreal-forced-aligner
 *   - MFA models: mfa model download acoustic english_mfa && mfa model download dictionary english_mfa
 *   - ffmpeg installed: brew install ffmpeg
 *   - OpenAI API key in .env.local
 *   - Cloudflare R2 credentials in .env.local
 *
 * Usage:
 *   npx tsx scripts/pregen-topic-audio.ts --run
 *   npx tsx scripts/pregen-topic-audio.ts --lessonId="3-social/persuasion" --run
 *   npx tsx scripts/pregen-topic-audio.ts --dry-run
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { execSync } from 'child_process'

import { parseChunks, stripMetaphorTags, type ParsedChunk } from './lib/chunk-parser'
import { normalizeForTTS, markdownToSpeakableText, prepareTextForTts, chunkTextForTts } from './lib/normalize-tts'
import { computeChunkHash, computeContentHash, TIMING_SCHEMA_VERSION } from './lib/chunk-hash'
import { runMFABatch, parseTextGrid, writeTranscript, checkMFAInstalled, checkMFAModels } from './lib/mfa-align'

// Configuration
const DEFAULT_CONTENT_ROOT = 'topic-content-v4'
const DEFAULT_TTS_MODEL = 'gpt-4o-mini-tts'
const FALLBACK_TTS_MODEL = 'tts-1'
const DEFAULT_VOICE = 'alloy'
const DEFAULT_SPEED = 1
const DEFAULT_MAX_CHARS_PER_SEGMENT = 1400
const DEFAULT_REQUEST_TIMEOUT_MS = 10 * 60 * 1000
const DEFAULT_CONCURRENCY = 3
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 1200

// ElevenLabs configuration
const ELEVENLABS_DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Bella - clear, professional
const ELEVENLABS_VOICES: Record<string, string> = {
  bella: 'EXAVITQu4vr4xnSDxMaL',
  rachel: '21m00Tcm4TlvDq8ikWAM',
  adam: 'pNInz6obpgDQGcFmaJgB',
  josh: 'TxGEqnHWrfWFTfGW9XjX',
  elli: 'MF3mGyEYCl7XYWbV9V6O',
  sam: 'yoZ06aMxZJJ28mfd3POQ',
}

type TtsProvider = 'openai' | 'elevenlabs'

const R2_PREFIX = 'topic-teacher-audio/v2'

// Types
type ManifestChunk = {
  chunkId: string
  type: 'stable' | 'metaphor'
  // Section navigation info
  sectionIdx: number // Which section (0-indexed)
  sectionTitle: string // Header text
  sectionStart: boolean // True if first chunk in section
  // For stable chunks:
  text?: string
  audioKey?: string
  timingsKey?: string
  duration?: number
  // For metaphor chunks with multiple variants
  defaultVariant?: string
  variants?: Record<
    string,
    {
      text: string
      audioKey: string
      timingsKey: string
      duration: number
    }
  >
}

type ManifestSection = {
  idx: number
  title: string
  startChunkIdx: number // Index of first chunk in this section
}

type LessonManifest = {
  lessonId: string
  version: number
  schemaVersion: number
  createdAt: string
  contentHash: string
  sections: ManifestSection[] // Section list for navigation
  chunks: ManifestChunk[]
  totalDuration: number
}

type CliArgs = {
  contentRoot: string
  lessonId: string | null
  ttsProvider: TtsProvider
  model: string
  fallbackModel: string
  voice: string
  speed: number
  maxCharsPerSegment: number
  requestTimeoutMs: number
  concurrency: number
  maxRetries: number
  retryDelayMs: number
  run: boolean
  skipMfa: boolean
  skipUpload: boolean
  limit: number
}

// Parse CLI arguments
function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    contentRoot: DEFAULT_CONTENT_ROOT,
    lessonId: null,
    ttsProvider: 'openai',
    model: DEFAULT_TTS_MODEL,
    fallbackModel: FALLBACK_TTS_MODEL,
    voice: DEFAULT_VOICE,
    speed: DEFAULT_SPEED,
    maxCharsPerSegment: DEFAULT_MAX_CHARS_PER_SEGMENT,
    requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    concurrency: DEFAULT_CONCURRENCY,
    maxRetries: DEFAULT_MAX_RETRIES,
    retryDelayMs: DEFAULT_RETRY_DELAY_MS,
    run: false,
    skipMfa: false,
    skipUpload: false,
    limit: Infinity,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--run') args.run = true
    else if (arg === '--dry-run') args.run = false
    else if (arg === '--skip-mfa') args.skipMfa = true
    else if (arg === '--skip-upload') args.skipUpload = true
    else if (arg === '--elevenlabs') args.ttsProvider = 'elevenlabs'
    else if (arg === '--openai') args.ttsProvider = 'openai'
    else if (arg === '--tts-provider') {
      const provider = argv[++i]?.toLowerCase()
      if (provider === 'elevenlabs' || provider === 'openai') {
        args.ttsProvider = provider
      }
    }
    else if (arg === '--content-root') args.contentRoot = argv[++i] ?? args.contentRoot
    else if (arg === '--lessonId' || arg === '--lesson-id') args.lessonId = argv[++i] ?? null
    else if (arg === '--model') args.model = argv[++i] ?? args.model
    else if (arg === '--voice') args.voice = argv[++i] ?? args.voice
    else if (arg === '--speed') args.speed = Number.parseFloat(argv[++i] ?? `${args.speed}`)
    else if (arg === '--limit') args.limit = Number.parseInt(argv[++i] ?? '', 10)
    else if (arg === '--concurrency') args.concurrency = Number.parseInt(argv[++i] ?? '', 10)
  }

  return args
}

// Environment utilities
function sanitizeOpenAIApiKey(raw: string | undefined): string | null {
  if (!raw) return null
  let value = String(raw).trim()
  if (!value) return null
  value = value.replace(/[\u200B-\u200D\uFEFF]/g, '')
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1).trim()
  }
  if (value.includes('#')) {
    value = value.split('#')[0].trim()
  }
  value = value.split(/\s+/)[0]?.trim() ?? ''
  value = value.replace(/[^\x21-\x7E]/g, '')
  return value || null
}

function readDotenvLocalValue(key: string): string | null {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const text = fs.readFileSync(envPath, 'utf8')
    const line = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith('#') && l.startsWith(`${key}=`))
    if (!line) return null
    let value = line.slice(key.length + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    return value.trim() || null
  } catch {
    return null
  }
}

function getOpenAIApiKey(): string | null {
  const fromProcess = sanitizeOpenAIApiKey(process.env.OPENAI_API_KEY)
  if (process.env.NODE_ENV === 'production') return fromProcess
  const fromEnvLocal = sanitizeOpenAIApiKey(readDotenvLocalValue('OPENAI_API_KEY'))
  return fromEnvLocal ?? fromProcess
}

function getElevenLabsApiKey(): string | null {
  const fromProcess = (process.env.ELEVENLABS_API_KEY || '').trim()
  if (process.env.NODE_ENV === 'production') return fromProcess || null
  const fromEnvLocal = readDotenvLocalValue('ELEVENLABS_API_KEY')
  return fromEnvLocal ?? (fromProcess || null)
}

function getElevenLabsVoiceId(voice: string): string {
  // Check if it's already a voice ID (looks like a long alphanumeric string)
  if (/^[A-Za-z0-9]{20,}$/.test(voice)) {
    return voice
  }
  // Check if it's a known voice name
  const lowerVoice = voice.toLowerCase()
  if (ELEVENLABS_VOICES[lowerVoice]) {
    return ELEVENLABS_VOICES[lowerVoice]
  }
  // Default to Bella
  return ELEVENLABS_DEFAULT_VOICE_ID
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// File utilities
function listMarkdownFiles(rootDir: string): string[] {
  const out: string[] = []
  const queue = [rootDir]

  while (queue.length > 0) {
    const dir = queue.pop()!
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        queue.push(full)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        out.push(full)
      }
    }
  }

  return out.sort()
}

function parseFrontmatter(markdown: string): { metadata: Record<string, string>; content: string } {
  const fm = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = markdown.match(fm)
  if (!match) return { metadata: {}, content: markdown.trim() }

  const [, frontmatterText, body] = match
  const metadata: Record<string, string> = {}
  for (const line of frontmatterText.split('\n')) {
    const [key, ...rest] = line.split(': ')
    if (!key) continue
    const value = rest.join(': ').trim()
    if (!value) continue
    metadata[key.trim()] = value.replace(/^["']|["']$/g, '')
  }
  return { metadata, content: body.trim() }
}

function getLessonIdFromPath(filePath: string, contentRoot: string): string {
  const relative = path.relative(contentRoot, filePath)
  const withoutExt = relative.replace(/\.md$/, '')
  // Convert "3 Social Psychology/3-persuasion" to "3-social/persuasion"
  return withoutExt
    .split(path.sep)
    .map((part) => {
      // Remove leading numbers and spaces from directory names
      return part.replace(/^\d+\s+/, '').toLowerCase().replace(/\s+/g, '-')
    })
    .join('/')
}

// TTS request (WAV format for MFA)
async function requestSpeechWav(options: {
  apiKey: string
  model: string
  voice: string
  speed: number
  text: string
  timeoutMs: number
}): Promise<{ ok: boolean; status: number; buffer: Buffer | null; errorText: string | null }> {
  const { apiKey, model, voice, speed, text, timeoutMs } = options

  const payload = JSON.stringify({
    model,
    voice,
    input: text,
    response_format: 'wav', // WAV for MFA compatibility
    speed,
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        hostname: 'api.openai.com',
        path: '/v1/audio/speech',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const status = res.statusCode ?? 0
        const chunks: Buffer[] = []

        res.setTimeout(timeoutMs, () => {
          res.destroy(new Error(`OpenAI response timed out after ${timeoutMs}ms`))
        })

        res.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        })
        res.on('end', () => {
          const buffer = Buffer.concat(chunks)
          if (status >= 200 && status < 300) {
            resolve({ ok: true, status, buffer, errorText: null })
            return
          }
          resolve({ ok: false, status, buffer: null, errorText: buffer.toString('utf8') })
        })
        res.on('error', reject)
      }
    )

    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`OpenAI request timed out after ${timeoutMs}ms`))
    })
    req.write(payload)
    req.end()
  })
}

async function requestSpeechWithRetry(options: {
  apiKey: string
  model: string
  voice: string
  speed: number
  text: string
  maxRetries: number
  retryDelayMs: number
  timeoutMs: number
}): Promise<{ ok: boolean; status: number; buffer: Buffer | null; errorText: string | null }> {
  const { maxRetries, retryDelayMs, ...requestOptions } = options
  let attempt = 0

  while (true) {
    let resp
    try {
      resp = await requestSpeechWav(requestOptions)
    } catch (err) {
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * Math.pow(2, attempt))
        attempt += 1
        continue
      }
      return { ok: false, status: 0, buffer: null, errorText: (err as Error)?.message ?? String(err) }
    }

    if (resp.ok) return resp

    if (resp.status === 401 || resp.status === 403) {
      throw new Error(`OpenAI auth error (${resp.status}): ${resp.errorText ?? ''}`)
    }

    const retryable = resp.status === 429 || resp.status >= 500
    if (!retryable || attempt >= maxRetries) return resp

    await sleep(retryDelayMs * Math.pow(2, attempt))
    attempt += 1
  }
}

// ElevenLabs TTS request (returns MP3 by default, we'll convert to WAV for MFA)
async function requestElevenLabsSpeech(options: {
  apiKey: string
  voiceId: string
  text: string
  timeoutMs: number
}): Promise<{ ok: boolean; status: number; buffer: Buffer | null; errorText: string | null }> {
  const { apiKey, voiceId, text, timeoutMs } = options

  const payload = JSON.stringify({
    text,
    model_id: 'eleven_turbo_v2_5', // Latest model, available on free tier
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${voiceId}?output_format=pcm_22050`, // PCM for MFA compatibility
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const status = res.statusCode ?? 0
        const chunks: Buffer[] = []

        res.setTimeout(timeoutMs, () => {
          res.destroy(new Error(`ElevenLabs response timed out after ${timeoutMs}ms`))
        })

        res.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        })
        res.on('end', () => {
          const buffer = Buffer.concat(chunks)
          if (status >= 200 && status < 300) {
            resolve({ ok: true, status, buffer, errorText: null })
            return
          }
          resolve({ ok: false, status, buffer: null, errorText: buffer.toString('utf8') })
        })
        res.on('error', reject)
      }
    )

    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`ElevenLabs request timed out after ${timeoutMs}ms`))
    })
    req.write(payload)
    req.end()
  })
}

async function requestElevenLabsWithRetry(options: {
  apiKey: string
  voiceId: string
  text: string
  maxRetries: number
  retryDelayMs: number
  timeoutMs: number
}): Promise<{ ok: boolean; status: number; buffer: Buffer | null; errorText: string | null }> {
  const { maxRetries, retryDelayMs, ...requestOptions } = options
  let attempt = 0

  while (true) {
    let resp
    try {
      resp = await requestElevenLabsSpeech(requestOptions)
    } catch (err) {
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * Math.pow(2, attempt))
        attempt += 1
        continue
      }
      return { ok: false, status: 0, buffer: null, errorText: (err as Error)?.message ?? String(err) }
    }

    if (resp.ok) return resp

    if (resp.status === 401 || resp.status === 403) {
      throw new Error(`ElevenLabs auth error (${resp.status}): ${resp.errorText ?? ''}`)
    }

    const retryable = resp.status === 429 || resp.status >= 500
    if (!retryable || attempt >= maxRetries) return resp

    await sleep(retryDelayMs * Math.pow(2, attempt))
    attempt += 1
  }
}

// Convert PCM to WAV (add WAV header to raw PCM data)
function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 22050, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = pcmBuffer.length
  const headerSize = 44
  const fileSize = headerSize + dataSize - 8

  const header = Buffer.alloc(headerSize)
  let offset = 0

  // RIFF chunk
  header.write('RIFF', offset); offset += 4
  header.writeUInt32LE(fileSize, offset); offset += 4
  header.write('WAVE', offset); offset += 4

  // fmt sub-chunk
  header.write('fmt ', offset); offset += 4
  header.writeUInt32LE(16, offset); offset += 4 // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, offset); offset += 2 // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, offset); offset += 2
  header.writeUInt32LE(sampleRate, offset); offset += 4
  header.writeUInt32LE(byteRate, offset); offset += 4
  header.writeUInt16LE(blockAlign, offset); offset += 2
  header.writeUInt16LE(bitsPerSample, offset); offset += 2

  // data sub-chunk
  header.write('data', offset); offset += 4
  header.writeUInt32LE(dataSize, offset)

  return Buffer.concat([header, pcmBuffer])
}

// Convert WAV to MP3 using ffmpeg
function convertWavToMp3(wavPath: string, mp3Path: string): void {
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -qscale:a 2 "${mp3Path}"`, {
    stdio: 'pipe',
  })
}

// Get audio duration using ffprobe
function getAudioDuration(audioPath: string): number {
  try {
    const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`, {
      encoding: 'utf-8',
    })
    return parseFloat(output.trim())
  } catch {
    return 0
  }
}

// Main processing function
async function processLesson(options: {
  filePath: string
  contentRoot: string
  workDir: string
  apiKey: string
  args: CliArgs
}): Promise<LessonManifest | null> {
  const { filePath, contentRoot, workDir, apiKey, args } = options

  // Read and parse lesson
  let raw: string
  try {
    raw = fs.readFileSync(filePath, 'utf8')
  } catch (err) {
    console.warn(`  Failed to read: ${(err as Error)?.message ?? err}`)
    return null
  }

  const { metadata, content } = parseFrontmatter(raw)
  const lessonId = getLessonIdFromPath(filePath, path.join(process.cwd(), contentRoot))

  // Strip metaphor markers and get base content
  const baseContent = content.replace(/\n*## \{\{PERSONALIZED_EXAMPLES\}\}[\s\S]*?(?=##|$)/, '').trim()
  const { text: strippedContent, ranges: metaphorRanges } = stripMetaphorTags(baseContent)

  console.log(`\nProcessing: ${lessonId}`)
  console.log(`  Metaphors: ${metaphorRanges.length}`)

  // Parse into chunks (now section-aware)
  const chunks = parseChunks(baseContent)
  const uniqueSections = new Set(chunks.map(c => c.sectionIdx))
  console.log(`  Sections: ${uniqueSections.size}`)
  console.log(`  Chunks: ${chunks.length}`)

  if (chunks.length === 0) {
    console.warn(`  No chunks found, skipping`)
    return null
  }

  // Create working directories
  const lessonDir = path.join(workDir, lessonId.replace(/\//g, '_'))
  const corpusDir = path.join(lessonDir, 'corpus')
  const alignedDir = path.join(lessonDir, 'aligned')
  const audioDir = path.join(lessonDir, 'audio')

  fs.mkdirSync(corpusDir, { recursive: true })
  fs.mkdirSync(alignedDir, { recursive: true })
  fs.mkdirSync(audioDir, { recursive: true })

  // Process each chunk
  const manifestChunks: ManifestChunk[] = []
  let totalDuration = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`  Chunk ${i + 1}/${chunks.length}: ${chunk.type} (${chunk.text.length} chars)`)

    // Convert markdown to speakable text
    const speakable = prepareTextForTts(markdownToSpeakableText(chunk.text))
    if (!speakable.trim()) {
      console.log(`    Skipping empty chunk`)
      continue
    }

    // Normalize for TTS
    const normalized = normalizeForTTS(speakable)

    // Compute hash for caching
    const chunkHash = computeChunkHash({
      text: normalized,
      voice: args.voice,
      speed: args.speed,
      ttsModel: args.model,
    })

    const wavPath = path.join(corpusDir, `${chunkHash}.wav`)
    const txtPath = path.join(corpusDir, `${chunkHash}.txt`)
    const mp3Path = path.join(audioDir, `${chunkHash}.mp3`)

    // Generate TTS if not exists
    if (!fs.existsSync(wavPath)) {
      if (!args.run) {
        console.log(`    DRY: would generate ${chunkHash}.wav`)
        continue
      }

      console.log(`    Generating TTS via ${args.ttsProvider}...`)

      let result: { ok: boolean; status: number; buffer: Buffer | null; errorText: string | null }

      if (args.ttsProvider === 'elevenlabs') {
        const elevenLabsKey = getElevenLabsApiKey()
        if (!elevenLabsKey) {
          console.warn(`    ElevenLabs API key not found`)
          continue
        }
        const voiceId = getElevenLabsVoiceId(args.voice)
        result = await requestElevenLabsWithRetry({
          apiKey: elevenLabsKey,
          voiceId,
          text: normalized,
          maxRetries: args.maxRetries,
          retryDelayMs: args.retryDelayMs,
          timeoutMs: args.requestTimeoutMs,
        })

        // Convert PCM to WAV if successful
        if (result.ok && result.buffer) {
          result.buffer = pcmToWav(result.buffer, 22050, 1, 16)
        }
      } else {
        // OpenAI
        result = await requestSpeechWithRetry({
          apiKey,
          model: args.model,
          voice: args.voice,
          speed: args.speed,
          text: normalized,
          maxRetries: args.maxRetries,
          retryDelayMs: args.retryDelayMs,
          timeoutMs: args.requestTimeoutMs,
        })
      }

      if (!result.ok || !result.buffer) {
        console.warn(`    TTS failed: ${result.errorText ?? 'unknown error'}`)
        continue
      }

      fs.writeFileSync(wavPath, result.buffer)
      console.log(`    Wrote ${wavPath}`)
    }

    // Write transcript for MFA
    if (!fs.existsSync(txtPath)) {
      writeTranscript(txtPath, normalized)
    }

    // Convert to MP3
    if (!fs.existsSync(mp3Path) && fs.existsSync(wavPath)) {
      console.log(`    Converting to MP3...`)
      try {
        convertWavToMp3(wavPath, mp3Path)
      } catch (err) {
        console.warn(`    MP3 conversion failed: ${(err as Error)?.message ?? err}`)
      }
    }

    // Get duration
    const duration = fs.existsSync(wavPath) ? getAudioDuration(wavPath) : 0
    totalDuration += duration

    // Build manifest chunk with section info
    const manifestChunk: ManifestChunk = {
      chunkId: chunk.id,
      type: chunk.type,
      sectionIdx: chunk.sectionIdx,
      sectionTitle: chunk.sectionTitle,
      sectionStart: chunk.sectionStart,
    }

    if (chunk.type === 'stable') {
      manifestChunk.text = speakable
      manifestChunk.audioKey = chunkHash
      manifestChunk.timingsKey = chunkHash
      manifestChunk.duration = duration
    } else {
      // Metaphor chunk - for now, just the default variant
      // Future: generate variants for different hobbies
      manifestChunk.defaultVariant = 'default'
      manifestChunk.variants = {
        default: {
          text: speakable,
          audioKey: chunkHash,
          timingsKey: chunkHash,
          duration,
        },
      }
    }

    manifestChunks.push(manifestChunk)
  }

  // Run MFA alignment if not skipping
  if (args.run && !args.skipMfa) {
    console.log(`\n  Running MFA alignment...`)

    // Check MFA is installed
    if (!checkMFAInstalled()) {
      console.warn(`  MFA not installed, skipping alignment`)
    } else {
      const models = checkMFAModels()
      if (!models.acoustic || !models.dictionary) {
        console.warn(`  MFA models not installed (acoustic: ${models.acoustic}, dictionary: ${models.dictionary})`)
      } else {
        try {
          runMFABatch(corpusDir, alignedDir, {
            clean: true,
            singleSpeaker: true,
          })

          // Parse TextGrid files and save timings
          const textGridFiles = fs.readdirSync(alignedDir).filter((f) => f.endsWith('.TextGrid'))
          console.log(`  Found ${textGridFiles.length} TextGrid files`)

          for (const tgFile of textGridFiles) {
            const hash = tgFile.replace('.TextGrid', '')
            const tgPath = path.join(alignedDir, tgFile)
            const timingsPath = path.join(audioDir, `${hash}.words.json`)

            try {
              const alignment = parseTextGrid(tgPath)
              fs.writeFileSync(timingsPath, JSON.stringify(alignment, null, 2))
              console.log(`    Parsed ${tgFile}: ${alignment.words.length} words`)
            } catch (err) {
              console.warn(`    Failed to parse ${tgFile}: ${(err as Error)?.message ?? err}`)
            }
          }
        } catch (err) {
          console.warn(`  MFA alignment failed: ${(err as Error)?.message ?? err}`)
        }
      }
    }
  }

  // Build sections array from manifest chunks
  const sectionsMap = new Map<number, ManifestSection>()
  manifestChunks.forEach((chunk, idx) => {
    if (!sectionsMap.has(chunk.sectionIdx)) {
      sectionsMap.set(chunk.sectionIdx, {
        idx: chunk.sectionIdx,
        title: chunk.sectionTitle,
        startChunkIdx: idx,
      })
    }
  })
  const sections = Array.from(sectionsMap.values()).sort((a, b) => a.idx - b.idx)

  // Build manifest
  const manifest: LessonManifest = {
    lessonId,
    version: 1,
    schemaVersion: TIMING_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    contentHash: computeContentHash(content),
    sections,
    chunks: manifestChunks,
    totalDuration,
  }

  // Save manifest
  const manifestPath = path.join(lessonDir, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`\n  Manifest: ${manifestPath}`)
  console.log(`  Total duration: ${totalDuration.toFixed(2)}s`)

  return manifest
}

// Main entry point
async function main() {
  const args = parseArgs(process.argv.slice(2))

  // Validate API key based on provider
  let apiKey: string | null = null
  if (args.ttsProvider === 'elevenlabs') {
    apiKey = getElevenLabsApiKey()
    if (!apiKey) {
      console.error('Missing ELEVENLABS_API_KEY (set in env or .env.local).')
      console.error('Get your API key at: https://elevenlabs.io/app/settings/api-keys')
      process.exit(1)
    }
  } else {
    apiKey = getOpenAIApiKey()
    if (!apiKey) {
      console.error('Missing OPENAI_API_KEY (set in env or .env.local).')
      process.exit(1)
    }
  }

  console.log('MFA Audio Pre-Generation')
  console.log('========================')
  console.log(`Content root: ${args.contentRoot}`)
  console.log(`TTS Provider: ${args.ttsProvider}`)
  if (args.ttsProvider === 'elevenlabs') {
    const voiceId = getElevenLabsVoiceId(args.voice)
    console.log(`Voice: ${args.voice} (${voiceId})`)
  } else {
    console.log(`Model: ${args.model}`)
    console.log(`Voice: ${args.voice}`)
    console.log(`Speed: ${args.speed}`)
  }
  console.log(`Mode: ${args.run ? 'RUN' : 'DRY RUN'}`)
  console.log(`Skip MFA: ${args.skipMfa}`)
  console.log(`Skip Upload: ${args.skipUpload}`)

  // Check MFA installation
  if (!args.skipMfa) {
    console.log('\nChecking MFA installation...')
    if (!checkMFAInstalled()) {
      console.warn('  MFA not found. Install with:')
      console.warn('    conda create -n mfa -c conda-forge montreal-forced-aligner')
      console.warn('    conda activate mfa')
      console.warn('    mfa model download acoustic english_mfa')
      console.warn('    mfa model download dictionary english_mfa')
      if (args.run) {
        console.error('\n  Cannot run without MFA. Use --skip-mfa to skip alignment.')
        process.exit(1)
      }
    } else {
      const models = checkMFAModels()
      console.log(`  Acoustic model: ${models.acoustic ? 'OK' : 'MISSING'}`)
      console.log(`  Dictionary: ${models.dictionary ? 'OK' : 'MISSING'}`)
    }
  }

  // Create work directory
  const workDir = path.join(process.cwd(), '.mfa-work')
  fs.mkdirSync(workDir, { recursive: true })
  console.log(`\nWork directory: ${workDir}`)

  // Find lesson files
  const contentRootAbs = path.join(process.cwd(), args.contentRoot)
  let markdownFiles = listMarkdownFiles(contentRootAbs)

  // Filter by lessonId if specified
  if (args.lessonId) {
    markdownFiles = markdownFiles.filter((f) => {
      const id = getLessonIdFromPath(f, contentRootAbs)
      return id.includes(args.lessonId!) || f.includes(args.lessonId!)
    })
  }

  // Apply limit
  if (args.limit < markdownFiles.length) {
    markdownFiles = markdownFiles.slice(0, args.limit)
  }

  console.log(`\nFound ${markdownFiles.length} lesson files`)

  // Process each lesson
  const manifests: LessonManifest[] = []
  let processed = 0
  let failed = 0

  for (const filePath of markdownFiles) {
    try {
      const manifest = await processLesson({
        filePath,
        contentRoot: args.contentRoot,
        workDir,
        apiKey,
        args,
      })

      if (manifest) {
        manifests.push(manifest)
        processed++
      } else {
        failed++
      }
    } catch (err) {
      console.error(`Error processing ${filePath}: ${(err as Error)?.message ?? err}`)
      failed++
    }
  }

  console.log('\n========================')
  console.log('Summary')
  console.log('========================')
  console.log(`Processed: ${processed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total manifests: ${manifests.length}`)

  // TODO: Upload to R2 if --run and not --skip-upload
  if (args.run && !args.skipUpload) {
    console.log('\nR2 upload not yet implemented. Use upload-topic-teacher-audio-to-r2.mjs for now.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
