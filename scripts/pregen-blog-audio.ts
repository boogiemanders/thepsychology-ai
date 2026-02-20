/**
 * Pre-generate blog post audio with MFA (Montreal Forced Aligner) for perfect word synchronization.
 *
 * Adapted from pregen-topic-audio.ts but simplified for blog posts (no metaphor tags).
 *
 * This script:
 * 1. Loads blog post .md files from blog-content/
 * 2. Converts markdown to speakable text, chunks it
 * 3. Generates TTS audio (WAV format for MFA)
 * 4. Runs MFA batch alignment on the corpus
 * 5. Parses TextGrid outputs for word timings
 * 6. Converts WAV to MP3
 * 7. Outputs manifests for upload to R2
 *
 * Usage:
 *   npx tsx scripts/pregen-blog-audio.ts --edge --run
 *   npx tsx scripts/pregen-blog-audio.ts --edge --slug how-to-pass-the-eppp-first-try --run
 *   npx tsx scripts/pregen-blog-audio.ts --dry-run
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

import { normalizeForTTS, markdownToSpeakableText, prepareTextForTts, chunkTextForTts } from './lib/normalize-tts'
import { computeChunkHash, computeContentHash, TIMING_SCHEMA_VERSION } from './lib/chunk-hash'
import { runMFABatch, parseTextGrid, writeTranscript, checkMFAInstalled, checkMFAModels } from './lib/mfa-align'

// Configuration
const BLOG_CONTENT_DIR = 'blog-content'
const DEFAULT_MAX_CHARS_PER_CHUNK = 1400

// Edge TTS configuration
const EDGE_DEFAULT_VOICE = 'en-US-AriaNeural'
const EDGE_VOICES: Record<string, string> = {
  'aria': 'en-US-AriaNeural',
  'jenny': 'en-US-JennyNeural',
  'guy': 'en-US-GuyNeural',
  'davis': 'en-US-DavisNeural',
}

const R2_PREFIX = 'blog-audio/v1'

// Types
type BlogManifestChunk = {
  chunkId: string
  text: string
  audioKey: string
  timingsKey: string
  duration: number
  sectionIdx: number
  sectionTitle: string
}

type BlogManifest = {
  slug: string
  version: number
  schemaVersion: number
  createdAt: string
  contentHash: string
  chunks: BlogManifestChunk[]
  totalDuration: number
}

type CliArgs = {
  slug: string | null
  voice: string
  ttsModel: string
  speed: number
  maxCharsPerChunk: number
  run: boolean
  skipMfa: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    slug: null,
    voice: EDGE_DEFAULT_VOICE,
    ttsModel: 'edge',
    speed: 1,
    maxCharsPerChunk: DEFAULT_MAX_CHARS_PER_CHUNK,
    run: false,
    skipMfa: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--run') args.run = true
    else if (arg === '--dry-run') args.run = false
    else if (arg === '--skip-mfa') args.skipMfa = true
    else if (arg === '--edge') args.ttsModel = 'edge'
    else if (arg === '--slug') args.slug = argv[++i] ?? null
    else if (arg?.startsWith('--slug=')) args.slug = arg.slice('--slug='.length)
    else if (arg === '--voice') args.voice = argv[++i] ?? args.voice
    else if (arg?.startsWith('--voice=')) args.voice = arg.slice('--voice='.length)
  }

  return args
}

function getEdgeVoice(voice: string): string {
  if (voice.includes('Neural')) return voice
  const lowerVoice = voice.toLowerCase()
  if (EDGE_VOICES[lowerVoice]) return EDGE_VOICES[lowerVoice]
  return EDGE_DEFAULT_VOICE
}

function checkEdgeTtsInstalled(): boolean {
  try {
    execSync('edge-tts --help', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

async function requestEdgeSpeech(options: {
  text: string
  voice: string
  outputPath: string
}): Promise<{ ok: boolean; errorText: string | null }> {
  const { text, voice, outputPath } = options
  const edgeVoice = getEdgeVoice(voice)
  const mp3TempPath = outputPath.replace(/\.wav$/, '.edge-temp.mp3')

  try {
    const textTempPath = outputPath.replace(/\.wav$/, '.edge-temp.txt')
    fs.writeFileSync(textTempPath, text)

    execSync(`edge-tts --voice "${edgeVoice}" --file "${textTempPath}" --write-media "${mp3TempPath}"`, {
      stdio: 'pipe',
      timeout: 120000,
    })

    execSync(`ffmpeg -y -i "${mp3TempPath}" -ar 22050 -ac 1 "${outputPath}"`, {
      stdio: 'pipe',
      timeout: 60000,
    })

    try {
      fs.unlinkSync(mp3TempPath)
      fs.unlinkSync(textTempPath)
    } catch {}

    return { ok: true, errorText: null }
  } catch (err) {
    try {
      if (fs.existsSync(mp3TempPath)) fs.unlinkSync(mp3TempPath)
    } catch {}
    return { ok: false, errorText: (err as Error)?.message ?? String(err) }
  }
}

function convertWavToMp3(wavPath: string, mp3Path: string): void {
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -qscale:a 2 "${mp3Path}"`, {
    stdio: 'pipe',
  })
}

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

/**
 * Split markdown content into sections at each h1/h2/h3 heading.
 * Each section includes its heading line(s) so the audio clip starts with the heading.
 * Within a section, chunkTextForTts splits further if the text is too long.
 */
function splitIntoSections(
  content: string
): Array<{ title: string; speakable: string }> {
  const lines = content.split('\n')
  const sections: Array<{ title: string; speakable: string }> = []
  let currentTitle = 'Introduction'
  let currentLines: string[] = []

  const flush = () => {
    const raw = currentLines.join('\n').trim()
    if (!raw) return
    const speakable = prepareTextForTts(markdownToSpeakableText(raw))
    if (speakable.trim()) sections.push({ title: currentTitle, speakable })
  }

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/)
    if (headingMatch) {
      flush()
      currentTitle = headingMatch[1].trim()
      currentLines = [line] // heading line goes into the NEW section
    } else {
      currentLines.push(line)
    }
  }
  flush()

  return sections
}

async function processBlogPost(options: {
  filePath: string
  workDir: string
  args: CliArgs
}): Promise<BlogManifest | null> {
  const { filePath, workDir, args } = options

  let raw: string
  try {
    raw = fs.readFileSync(filePath, 'utf8')
  } catch (err) {
    console.warn(`  Failed to read: ${(err as Error)?.message ?? err}`)
    return null
  }

  const { metadata, content } = parseFrontmatter(raw)
  const slug = metadata.slug || path.basename(filePath, '.md')

  console.log(`\nProcessing: ${slug}`)

  // Split into sections (each section starts with its heading).
  // Then chunk each section independently so every audio clip starts at a heading.
  const sections = splitIntoSections(content)
  if (sections.length === 0) {
    console.warn(`  No speakable content found, skipping`)
    return null
  }

  // Build flat chunk list with section metadata
  type ChunkWithSection = { text: string; sectionTitle: string; sectionIdx: number }
  const chunksWithSection: ChunkWithSection[] = []
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx]
    const sectionChunks = chunkTextForTts(section.speakable, args.maxCharsPerChunk)
    for (const chunkText of sectionChunks) {
      chunksWithSection.push({ text: chunkText, sectionTitle: section.title, sectionIdx: sIdx })
    }
  }

  const chunks = chunksWithSection.map((c) => c.text)
  console.log(`  Sections: ${sections.length}, Chunks: ${chunks.length}`)

  // Create working directories
  const postDir = path.join(workDir, 'blog', slug)
  const corpusDir = path.join(postDir, 'corpus')
  const alignedDir = path.join(postDir, 'aligned')
  const audioDir = path.join(postDir, 'audio')

  fs.mkdirSync(corpusDir, { recursive: true })
  fs.mkdirSync(alignedDir, { recursive: true })
  fs.mkdirSync(audioDir, { recursive: true })

  // Process each chunk
  const manifestChunks: BlogManifestChunk[] = []
  let totalDuration = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i]
    const { sectionTitle, sectionIdx } = chunksWithSection[i]!
    console.log(`  Chunk ${i + 1}/${chunks.length} [${sectionTitle}]: ${chunkText.length} chars`)

    // Normalize for TTS
    const normalized = normalizeForTTS(chunkText)

    // Compute hash for caching
    const chunkHash = computeChunkHash({
      text: normalized,
      voice: args.voice,
      speed: args.speed,
      ttsModel: args.ttsModel,
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

      console.log(`    Generating TTS via Edge...`)
      const edgeResult = await requestEdgeSpeech({
        text: normalized,
        voice: args.voice,
        outputPath: wavPath,
      })

      if (!edgeResult.ok) {
        console.warn(`    TTS failed: ${edgeResult.errorText ?? 'unknown error'}`)
        continue
      }

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

    manifestChunks.push({
      chunkId: `blog-${slug}-${i}`,
      text: chunkText,
      audioKey: chunkHash,
      timingsKey: chunkHash,
      duration,
      sectionIdx,
      sectionTitle,
    })
  }

  // Run MFA alignment
  if (args.run && !args.skipMfa) {
    console.log(`\n  Running MFA alignment...`)

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

  // Build manifest
  const manifest: BlogManifest = {
    slug,
    version: 1,
    schemaVersion: TIMING_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    contentHash: computeContentHash(content),
    chunks: manifestChunks,
    totalDuration,
  }

  // Save manifest
  const manifestPath = path.join(postDir, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`\n  Manifest: ${manifestPath}`)
  console.log(`  Total duration: ${totalDuration.toFixed(2)}s`)

  return manifest
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!checkEdgeTtsInstalled()) {
    console.error('Edge TTS not found. Install with:')
    console.error('  pip install edge-tts')
    process.exit(1)
  }

  const edgeVoice = getEdgeVoice(args.voice)
  console.log('Blog Audio Pre-Generation')
  console.log('=========================')
  console.log(`Voice: ${edgeVoice}`)
  console.log(`Mode: ${args.run ? 'RUN' : 'DRY RUN'}`)
  console.log(`Skip MFA: ${args.skipMfa}`)

  if (!args.skipMfa) {
    console.log('\nChecking MFA installation...')
    if (!checkMFAInstalled()) {
      console.warn('  MFA not found. Install with:')
      console.warn('    conda create -n mfa -c conda-forge montreal-forced-aligner')
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

  const workDir = path.join(process.cwd(), '.mfa-work')
  fs.mkdirSync(workDir, { recursive: true })

  const blogDir = path.join(process.cwd(), BLOG_CONTENT_DIR)
  let files = fs.readdirSync(blogDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(blogDir, f))
    .sort()

  // Filter by slug if specified
  if (args.slug) {
    files = files.filter((f) => path.basename(f, '.md') === args.slug)
  }

  console.log(`\nFound ${files.length} blog posts`)

  const manifests: BlogManifest[] = []
  let processed = 0
  let failed = 0

  for (const filePath of files) {
    try {
      const manifest = await processBlogPost({ filePath, workDir, args })
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

  console.log('\n=========================')
  console.log('Summary')
  console.log('=========================')
  console.log(`Processed: ${processed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total manifests: ${manifests.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
