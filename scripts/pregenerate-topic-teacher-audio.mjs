import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const DEFAULT_CONTENT_ROOT = 'topic-content-v3-test'
const DEFAULT_OUT_DIR = path.join('public', 'topic-teacher-audio', 'v1')

const DEFAULT_MODEL = 'gpt-4o-mini-tts'
const FALLBACK_MODEL = 'tts-1'
const DEFAULT_VOICE = 'alloy'
const DEFAULT_FORMAT = 'mp3'
const DEFAULT_SPEED = 1
const DEFAULT_MAX_CHARS_PER_SEGMENT = 1400
const DEFAULT_SECTION_SPLIT_LEVEL = 2
const DEFAULT_CONCURRENCY = 3
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 1200
const DEFAULT_PROGRESS_INTERVAL_MS = 5000

function parseArgs(argv) {
  const args = {
    contentRoot: DEFAULT_CONTENT_ROOT,
    outDir: DEFAULT_OUT_DIR,
    model: DEFAULT_MODEL,
    fallbackModel: FALLBACK_MODEL,
    voice: DEFAULT_VOICE,
    format: DEFAULT_FORMAT,
    speed: DEFAULT_SPEED,
    maxCharsPerSegment: DEFAULT_MAX_CHARS_PER_SEGMENT,
    sectionSplitLevel: DEFAULT_SECTION_SPLIT_LEVEL,
    limit: Infinity,
    concurrency: DEFAULT_CONCURRENCY,
    maxRetries: DEFAULT_MAX_RETRIES,
    retryDelayMs: DEFAULT_RETRY_DELAY_MS,
    progressIntervalMs: DEFAULT_PROGRESS_INTERVAL_MS,
    run: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--run') args.run = true
    else if (arg === '--dry-run') args.run = false
    else if (arg === '--content-root') args.contentRoot = argv[++i] ?? args.contentRoot
    else if (arg === '--out-dir') args.outDir = argv[++i] ?? args.outDir
    else if (arg === '--voice') args.voice = argv[++i] ?? args.voice
    else if (arg === '--model') args.model = argv[++i] ?? args.model
    else if (arg === '--fallback-model') args.fallbackModel = argv[++i] ?? args.fallbackModel
    else if (arg === '--speed') args.speed = Number.parseFloat(argv[++i] ?? `${args.speed}`)
    else if (arg === '--max-chars-per-segment') {
      args.maxCharsPerSegment = Number.parseInt(argv[++i] ?? '', 10)
    } else if (arg === '--section-split-level') {
      args.sectionSplitLevel = Number.parseInt(argv[++i] ?? '', 10)
    }
    else if (arg === '--limit') args.limit = Number.parseInt(argv[++i] ?? '', 10)
    else if (arg === '--concurrency') args.concurrency = Number.parseInt(argv[++i] ?? '', 10)
    else if (arg === '--max-retries') args.maxRetries = Number.parseInt(argv[++i] ?? '', 10)
    else if (arg === '--retry-delay-ms') args.retryDelayMs = Number.parseInt(argv[++i] ?? '', 10)
    else if (arg === '--progress-interval-ms') args.progressIntervalMs = Number.parseInt(argv[++i] ?? '', 10)
  }

  if (!Number.isFinite(args.speed)) args.speed = DEFAULT_SPEED
  if (!Number.isFinite(args.limit)) args.limit = Infinity
  if (!Number.isFinite(args.maxCharsPerSegment) || args.maxCharsPerSegment <= 0) {
    args.maxCharsPerSegment = DEFAULT_MAX_CHARS_PER_SEGMENT
  }
  if (
    !Number.isFinite(args.sectionSplitLevel) ||
    args.sectionSplitLevel < 1 ||
    args.sectionSplitLevel > 6
  ) {
    args.sectionSplitLevel = DEFAULT_SECTION_SPLIT_LEVEL
  }
  if (!Number.isFinite(args.concurrency) || args.concurrency <= 0) args.concurrency = DEFAULT_CONCURRENCY
  if (!Number.isFinite(args.maxRetries) || args.maxRetries < 0) args.maxRetries = DEFAULT_MAX_RETRIES
  if (!Number.isFinite(args.retryDelayMs) || args.retryDelayMs <= 0) args.retryDelayMs = DEFAULT_RETRY_DELAY_MS
  if (!Number.isFinite(args.progressIntervalMs) || args.progressIntervalMs <= 0) {
    args.progressIntervalMs = DEFAULT_PROGRESS_INTERVAL_MS
  }
  return args
}

function sanitizeOpenAIApiKey(raw) {
  if (!raw) return null
  let value = String(raw).trim()
  if (!value) return null
  value = value.replace(/[\u200B-\u200D\uFEFF]/g, '')

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }

  if (value.includes('#')) {
    value = value.split('#')[0].trim()
  }

  value = value.split(/\s+/)[0]?.trim() ?? ''
  value = value.replace(/[^\x21-\x7E]/g, '')
  return value || null
}

function readDotenvLocalValue(key) {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const text = fs.readFileSync(envPath, 'utf8')
    const line = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith('#') && l.startsWith(`${key}=`))
    if (!line) return null
    let value = line.slice(key.length + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return value.trim() || null
  } catch {
    return null
  }
}

function getOpenAIApiKey() {
  const fromProcess = sanitizeOpenAIApiKey(process.env.OPENAI_API_KEY)
  if (process.env.NODE_ENV === 'production') return fromProcess
  const fromEnvLocal = sanitizeOpenAIApiKey(readDotenvLocalValue('OPENAI_API_KEY'))
  return fromEnvLocal ?? fromProcess
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function computeCacheKey({ model, voice, format, speed, text }) {
  const fingerprint = ['topic-teacher-audio-v1', model, voice, format, speed.toString(), text].join('|')
  return sha256Hex(fingerprint)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function listMarkdownFiles(rootDir) {
  const out = []
  const queue = [rootDir]

  while (queue.length > 0) {
    const dir = queue.pop()
    let entries
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

function parseFrontmatter(markdown) {
  const fm = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = markdown.match(fm)
  if (!match) return { metadata: {}, content: markdown.trim() }

  const [, frontmatterText, body] = match
  const metadata = {}
  for (const line of frontmatterText.split('\n')) {
    const [key, ...rest] = line.split(': ')
    if (!key) continue
    const value = rest.join(': ').trim()
    if (!value) continue
    metadata[key.trim()] = value.replace(/^["']|["']$/g, '')
  }
  return { metadata, content: body.trim() }
}

function stripMetaphorMarkersWithRanges(content) {
  const ranges = []
  let out = ''
  let cursor = 0
  const regex = /\{\{M\}\}([\s\S]*?)\{\{\/M\}\}/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const before = content.slice(cursor, match.index)
    out += before
    const inner = match[1] ?? ''
    const start = out.length
    out += inner
    const end = out.length
    ranges.push({ start, end })
    cursor = match.index + match[0].length
  }

  out += content.slice(cursor)
  out = out.replace(/\{\{\/?M\}\}/g, '')
  return { content: out, ranges }
}

function markdownToSpeakableText(markdown) {
  const input = typeof markdown === 'string' ? markdown : ''
  if (!input.trim()) return ''

  let text = input
  text = text.replace(/```[\s\S]*?```/g, '')
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/^\s*---+\s*$/gm, '')
  text = text.replace(/^\s*>\s?/gm, '')
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  text = text.replace(/`([^`]+)`/g, '$1')
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/_([^_]+)_/g, '$1')
  text = text.replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, '')
  text = text.replace(/^\s*\|(.+)\|\s*$/gm, (_match, row) => {
    const cells = row
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean)
    return cells.join(', ')
  })
  text = text.replace(/^\s*[-*+]\s+/gm, '')
  text = text.replace(/^\s*\d+\.\s+/gm, '')
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

function prepareTextForTts(text) {
  const input = typeof text === 'string' ? text : ''
  if (!input.trim()) return ''
  return input.replace(/\bE\.?P\.?P\.?P\.?\b/gi, 'E triple P').trim()
}

function splitMarkdownIntoSections(markdown, splitLevel) {
  const input = typeof markdown === 'string' ? markdown : ''
  if (!input.trim()) return []

  const sections = []
  const lines = input.split('\n')
  let inFence = false

  let currentStart = 0
  let currentTitle = null
  let currentLevel = 0

  let offset = 0

  const flush = (end) => {
    if (end <= currentStart) return
    const slice = input.slice(currentStart, end)
    if (!slice.trim()) return
    sections.push({
      title: currentTitle ?? 'Intro',
      level: currentLevel,
      start: currentStart,
      end,
      markdown: slice,
    })
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const lineStart = offset
    const hasNewline = i < lines.length - 1
    offset += line.length + (hasNewline ? 1 : 0)

    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (!match) continue
    const level = match[1]?.length ?? 0
    const title = match[2]?.trim() ?? ''
    if (!title) continue
    if (level !== splitLevel) continue

    flush(lineStart)
    currentStart = lineStart
    currentTitle = title
    currentLevel = level
  }

  flush(input.length)
  return sections
}

function splitLongTextBySentences(text, maxChars) {
  const sentenceMatches = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)
  const sentences = sentenceMatches?.map((s) => s.trim()).filter(Boolean) ?? [text]

  const parts = []
  let current = ''

  for (const sentence of sentences) {
    if (!current) {
      if (sentence.length <= maxChars) {
        current = sentence
        continue
      }
      for (let i = 0; i < sentence.length; i += maxChars) {
        parts.push(sentence.slice(i, i + maxChars).trim())
      }
      continue
    }

    const candidate = `${current} ${sentence}`.trim()
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }

    parts.push(current.trim())
    if (sentence.length <= maxChars) {
      current = sentence
      continue
    }

    for (let i = 0; i < sentence.length; i += maxChars) {
      const slice = sentence.slice(i, i + maxChars).trim()
      if (slice) parts.push(slice)
    }
    current = ''
  }

  if (current.trim()) parts.push(current.trim())
  return parts.filter(Boolean)
}

function chunkTextForTts(text, maxChars) {
  const input = typeof text === 'string' ? text.trim() : ''
  if (!input) return []
  if (maxChars <= 0) return [input]

  const paragraphs = input
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  const chunks = []
  let current = ''

  for (const paragraph of paragraphs) {
    if (!current) {
      if (paragraph.length <= maxChars) {
        current = paragraph
      } else {
        chunks.push(...splitLongTextBySentences(paragraph, maxChars))
      }
      continue
    }

    const candidate = `${current}\n\n${paragraph}`.trim()
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }

    chunks.push(current.trim())
    if (paragraph.length <= maxChars) {
      current = paragraph
    } else {
      chunks.push(...splitLongTextBySentences(paragraph, maxChars))
      current = ''
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks.filter(Boolean)
}

function buildStaticPartsFromRanges(baseMarkdown, ranges) {
  const staticParts = []
  let cursor = 0
  for (const range of ranges) {
    staticParts.push(baseMarkdown.slice(cursor, range.start))
    cursor = range.end
  }
  staticParts.push(baseMarkdown.slice(cursor))
  return staticParts
}

function buildSegmentsFromContent(baseContentStripped, metaphorRanges, options) {
  const maxCharsPerSegment = options?.maxCharsPerSegment ?? DEFAULT_MAX_CHARS_PER_SEGMENT
  const sectionSplitLevel = options?.sectionSplitLevel ?? DEFAULT_SECTION_SPLIT_LEVEL

  const segments = []
  const sections = splitMarkdownIntoSections(baseContentStripped, sectionSplitLevel)

  for (const section of sections) {
    const sectionRanges = []
    for (const range of metaphorRanges) {
      if (range.start < section.start || range.end > section.end) continue
      sectionRanges.push({
        start: range.start - section.start,
        end: range.end - section.start,
      })
    }

    if (sectionRanges.length === 0) {
      const speakable = prepareTextForTts(markdownToSpeakableText(section.markdown))
      for (const chunk of chunkTextForTts(speakable, maxCharsPerSegment)) {
        if (chunk.trim()) segments.push(chunk)
      }
      continue
    }

    const sectionMarkdown = baseContentStripped.slice(section.start, section.end)
    const staticParts = buildStaticPartsFromRanges(sectionMarkdown, sectionRanges)

    for (let partIndex = 0; partIndex < staticParts.length; partIndex += 1) {
      const staticMarkdown = staticParts[partIndex]
      if (staticMarkdown.trim()) {
        const speakable = prepareTextForTts(markdownToSpeakableText(staticMarkdown))
        for (const chunk of chunkTextForTts(speakable, maxCharsPerSegment)) {
          if (chunk.trim()) segments.push(chunk)
        }
      }

      if (partIndex < sectionRanges.length) {
        const range = sectionRanges[partIndex]
        const metaphorMarkdown = sectionMarkdown.slice(range.start, range.end)
        if (metaphorMarkdown.trim()) {
          const speakable = prepareTextForTts(markdownToSpeakableText(metaphorMarkdown))
          for (const chunk of chunkTextForTts(speakable, maxCharsPerSegment)) {
            if (chunk.trim()) segments.push(chunk)
          }
        }
      }
    }
  }

  return segments
}

function buildSegmentsFromLegacyContent(baseContentStripped, metaphorRanges, maxCharsPerSegment) {
  const segments = []
  let cursor = 0
  for (let i = 0; i < metaphorRanges.length; i++) {
    const range = metaphorRanges[i]
    const staticMarkdown = baseContentStripped.slice(cursor, range.start)
    const metaphorMarkdown = baseContentStripped.slice(range.start, range.end)

    for (const chunk of chunkTextForTts(prepareTextForTts(markdownToSpeakableText(staticMarkdown)), maxCharsPerSegment)) {
      if (chunk.trim()) segments.push(chunk)
    }
    for (const chunk of chunkTextForTts(prepareTextForTts(markdownToSpeakableText(metaphorMarkdown)), maxCharsPerSegment)) {
      if (chunk.trim()) segments.push(chunk)
    }
    cursor = range.end
  }

  const tail = baseContentStripped.slice(cursor)
  for (const chunk of chunkTextForTts(prepareTextForTts(markdownToSpeakableText(tail)), maxCharsPerSegment)) {
    if (chunk.trim()) segments.push(chunk)
  }

  return segments
}

async function requestSpeech({ apiKey, model, voice, format, speed, text }) {
  return fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: format,
      speed,
    }),
  })
}

async function requestSpeechWithRetry({ apiKey, model, voice, format, speed, text, maxRetries, retryDelayMs }) {
  let attempt = 0

  while (true) {
    const resp = await requestSpeech({ apiKey, model, voice, format, speed, text })
    if (resp.ok) return { resp, errorText: null }

    if (resp.status === 401 || resp.status === 403) {
      const errText = await resp.text().catch(() => '')
      throw new Error(`OpenAI auth error (${resp.status}): ${errText}`)
    }

    const retryable = resp.status === 429 || resp.status >= 500
    if (!retryable || attempt >= maxRetries) {
      const errText = await resp.text().catch(() => '')
      return { resp, errorText: errText }
    }

    await sleep(retryDelayMs * Math.pow(2, attempt))
    attempt += 1
  }
}

async function processSegments({
  segments,
  outDirAbs,
  args,
  apiKey,
}) {
  let processed = 0
  let generated = 0
  let skipped = 0
  let failed = 0
  let fatalError = null

  const total = segments.length
  let nextIndex = 0
  let lastLog = Date.now()

  const maybeLog = () => {
    const now = Date.now()
    if (processed >= total || now - lastLog >= args.progressIntervalMs) {
      console.log(
        `  Progress: ${processed}/${total} (generated ${generated}, skipped ${skipped}, failed ${failed})`
      )
      lastLog = now
    }
  }

  const worker = async () => {
    while (true) {
      const idx = nextIndex++
      if (idx >= total) break
      if (fatalError) break

      const text = segments[idx]
      const cacheKey = computeCacheKey({
        model: args.model,
        voice: args.voice,
        format: args.format,
        speed: args.speed,
        text,
      })
      const outPath = path.join(outDirAbs, `${cacheKey}.${args.format}`)

      if (fs.existsSync(outPath)) {
        skipped += 1
        processed += 1
        maybeLog()
        continue
      }

      if (!args.run) {
        processed += 1
        if (processed === 1 || processed === total) {
          console.log(`  DRY: would write ${path.relative(process.cwd(), outPath)}`)
        }
        maybeLog()
        continue
      }

      try {
        let modelUsed = args.model
        let { resp, errorText } = await requestSpeechWithRetry({
          apiKey,
          model: modelUsed,
          voice: args.voice,
          format: args.format,
          speed: args.speed,
          text,
          maxRetries: args.maxRetries,
          retryDelayMs: args.retryDelayMs,
        })

        if (!resp.ok && modelUsed === args.model) {
          const lower = (errorText || '').toLowerCase()
          const looksLikeModelError = lower.includes('model') || lower.includes('not found') || resp.status === 404
          if (looksLikeModelError) {
            modelUsed = args.fallbackModel
            const retryResult = await requestSpeechWithRetry({
              apiKey,
              model: modelUsed,
              voice: args.voice,
              format: args.format,
              speed: args.speed,
              text,
              maxRetries: args.maxRetries,
              retryDelayMs: args.retryDelayMs,
            })
            resp = retryResult.resp
            errorText = retryResult.errorText
          } else if (errorText) {
            console.warn(`  ⚠️  OpenAI error (${resp.status}): ${errorText.slice(0, 200)}`)
          }
        }

        if (!resp.ok) {
          const errText = errorText ?? (await resp.text().catch(() => ''))
          console.warn(`  ⚠️  OpenAI error (${resp.status}): ${errText.slice(0, 200)}`)
          failed += 1
          processed += 1
          maybeLog()
          continue
        }

        const buffer = Buffer.from(await resp.arrayBuffer())
        fs.writeFileSync(outPath, buffer)
        generated += 1
        processed += 1
        maybeLog()
      } catch (err) {
        fatalError = err
      }
    }
  }

  const workers = Array.from({ length: args.concurrency }, () => worker())
  await Promise.all(workers)

  if (fatalError) {
    throw fatalError
  }

  return { processed, generated, skipped, failed }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY (set in env or .env.local).')
    process.exit(1)
  }

  const contentRootAbs = path.join(process.cwd(), args.contentRoot)
  const outDirAbs = path.join(process.cwd(), args.outDir)

  const markdownFiles = listMarkdownFiles(contentRootAbs).slice(0, args.limit)
  console.log(`Found ${markdownFiles.length} markdown files under ${args.contentRoot}`)
  console.log(`Output dir: ${args.outDir}`)
  console.log(`Model: ${args.model} (fallback: ${args.fallbackModel})`)
  console.log(`Voice: ${args.voice}, format: ${args.format}, speed: ${args.speed}`)
  console.log(`Max chars per segment: ${args.maxCharsPerSegment}`)
  console.log(`Section split level: H${args.sectionSplitLevel}`)
  console.log(`Concurrency: ${args.concurrency}, retries: ${args.maxRetries}`)
  console.log(args.run ? 'Mode: RUN (will call OpenAI)' : 'Mode: DRY RUN (no API calls)')

  fs.mkdirSync(outDirAbs, { recursive: true })

  let totalSegments = 0
  let generated = 0
  let skipped = 0
  let failed = 0

  for (const [fileIndex, filePath] of markdownFiles.entries()) {
    const rel = path.relative(process.cwd(), filePath)
    console.log(`\n[${fileIndex + 1}/${markdownFiles.length}] ${rel}`)

    let raw
    try {
      raw = fs.readFileSync(filePath, 'utf8')
    } catch (err) {
      console.warn(`  ⚠️  Failed to read: ${err?.message ?? err}`)
      continue
    }

    const { content } = parseFrontmatter(raw)
    const baseContent = content.replace(/\n*## {{PERSONALIZED_EXAMPLES}}.*?(?=##|$)/s, '').trim()
    const { content: stripped, ranges } = stripMetaphorMarkersWithRanges(baseContent)
    const segments = buildSegmentsFromContent(stripped, ranges, {
      maxCharsPerSegment: args.maxCharsPerSegment,
      sectionSplitLevel: args.sectionSplitLevel,
    })
    const fallbackLegacy = buildSegmentsFromLegacyContent(stripped, ranges, args.maxCharsPerSegment)
    if (segments.length === 0 && fallbackLegacy.length > 0) {
      segments.push(...fallbackLegacy)
    }

    console.log(`  Segments: ${segments.length}`)
    totalSegments += segments.length
    const result = await processSegments({
      segments,
      outDirAbs,
      args,
      apiKey,
    })

    generated += result.generated
    skipped += result.skipped
    failed += result.failed
  }

  console.log('\nDone.')
  console.log(`Segments total: ${totalSegments}`)
  console.log(`Generated: ${generated}`)
  console.log(`Skipped (already existed): ${skipped}`)
  console.log(`Failed: ${failed}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
