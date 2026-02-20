/**
 * Podcast POC: Generate a NotebookLM-style two-host podcast from a lesson.
 *
 * This script:
 * 1. Reads a pre-generated conversation script (JSON)
 * 2. Generates Edge TTS audio for each segment with two voices
 * 3. Concatenates segments with FFmpeg into a single MP3
 * 4. (Stretch) Generates a video with title card slides
 *
 * Prerequisites:
 *   - edge-tts: pip install edge-tts
 *   - ffmpeg: brew install ffmpeg
 *
 * Usage:
 *   npx tsx scripts/generate-podcast-poc.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import sharp from 'sharp'

// ── Configuration ──────────────────────────────────────────────────────────

const SCRIPT_PATH = 'podcast-output/3-attitudes-script.json'
const OUTPUT_DIR = 'podcast-output'
const OUTPUT_MP3 = 'podcast-output/3-attitudes.mp3'
const OUTPUT_MP4 = 'podcast-output/3-attitudes.mp4'
const LESSON_MD = 'topic-content-v4/3 Social Psychology/3-attitudes.md'

const VOICES: Record<string, string> = {
  A: 'en-US-GuyNeural',   // Host A: teacher
  B: 'en-US-JennyNeural', // Host B: curious student
}

type Segment = { speaker: 'A' | 'B'; text: string }

// ── Edge TTS ───────────────────────────────────────────────────────────────

function checkEdgeTts(): void {
  try {
    execSync('edge-tts --help', { stdio: 'pipe' })
  } catch {
    console.error('edge-tts not found. Install with: pip install edge-tts')
    process.exit(1)
  }
}

function checkFfmpeg(): void {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' })
  } catch {
    console.error('ffmpeg not found. Install with: brew install ffmpeg')
    process.exit(1)
  }
}

async function generateSegmentAudio(
  text: string,
  voice: string,
  outputPath: string
): Promise<void> {
  // Write text to a temp file to avoid shell escaping issues
  const textTempPath = outputPath.replace(/\.mp3$/, '.txt')
  fs.writeFileSync(textTempPath, text)

  try {
    execSync(
      `edge-tts --voice "${voice}" --file "${textTempPath}" --write-media "${outputPath}"`,
      { stdio: 'pipe', timeout: 120_000 }
    )
  } finally {
    try { fs.unlinkSync(textTempPath) } catch { /* ignore */ }
  }
}

// ── Section headings extraction ────────────────────────────────────────────

function extractSectionHeadings(mdPath: string): string[] {
  const content = fs.readFileSync(mdPath, 'utf8')
  // Remove frontmatter
  const body = content.replace(/^---[\s\S]*?---\n*/, '')
  const headings: string[] = []
  for (const line of body.split('\n')) {
    const match = line.match(/^#{2,3}\s+(.+)$/)
    if (match) headings.push(match[1].trim())
  }
  return headings
}

// ── Video generation ───────────────────────────────────────────────────────

async function generateTitleCardImage(
  text: string,
  outputPath: string,
  width = 1920,
  height = 1080
): Promise<void> {
  // Wrap long text across multiple lines
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (candidate.length > 35 && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = candidate
    }
  }
  if (currentLine) lines.push(currentLine)

  // Escape XML special chars
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const lineHeight = 64
  const startY = (height / 2) - ((lines.length - 1) * lineHeight) / 2

  const tspans = lines
    .map((line, i) => `<tspan x="${width / 2}" dy="${i === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`)
    .join('\n      ')

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a2e"/>
    <text x="${width / 2}" y="${startY}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="48" fill="white" font-weight="bold">
      ${tspans}
    </text>
  </svg>`

  await sharp(Buffer.from(svg)).png().toFile(outputPath)
}

function getAudioDuration(filePath: string): number {
  const output = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
    { encoding: 'utf-8' }
  )
  return parseFloat(output.trim())
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Podcast POC Generator')
  console.log('=====================\n')

  // Verify dependencies
  checkEdgeTts()
  checkFfmpeg()

  // Ensure output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // ── Step 1: Read script ──────────────────────────────────────────────
  const scriptPath = path.join(process.cwd(), SCRIPT_PATH)
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`)
    process.exit(1)
  }

  const segments: Segment[] = JSON.parse(fs.readFileSync(scriptPath, 'utf8'))
  console.log(`Loaded ${segments.length} segments from script\n`)

  // ── Step 2: Generate audio segments ──────────────────────────────────
  const segDir = path.join(process.cwd(), OUTPUT_DIR, 'segments')
  fs.mkdirSync(segDir, { recursive: true })

  const segmentFiles: string[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const voice = VOICES[seg.speaker]
    const segFile = path.join(segDir, `seg-${String(i).padStart(3, '0')}.mp3`)
    segmentFiles.push(segFile)

    if (fs.existsSync(segFile)) {
      console.log(`  [${i + 1}/${segments.length}] Cached: ${path.basename(segFile)}`)
      continue
    }

    console.log(`  [${i + 1}/${segments.length}] Generating ${seg.speaker} (${voice})...`)
    await generateSegmentAudio(seg.text, voice, segFile)
  }

  console.log(`\nAll ${segmentFiles.length} segments generated.\n`)

  // ── Step 3: Concatenate with FFmpeg ──────────────────────────────────
  console.log('Concatenating segments into final MP3...')

  // Write FFmpeg concat list
  const concatListPath = path.join(segDir, 'concat.txt')
  const concatContent = segmentFiles
    .map((f) => `file '${f}'`)
    .join('\n')
  fs.writeFileSync(concatListPath, concatContent)

  const outputMp3 = path.join(process.cwd(), OUTPUT_MP3)
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -codec:a libmp3lame -qscale:a 2 "${outputMp3}"`,
    { stdio: 'pipe', timeout: 300_000 }
  )

  const totalDuration = getAudioDuration(outputMp3)
  const minutes = Math.floor(totalDuration / 60)
  const seconds = Math.round(totalDuration % 60)
  console.log(`\nPodcast audio: ${outputMp3}`)
  console.log(`Duration: ${minutes}m ${seconds}s\n`)

  // ── Step 4: Generate video (stretch goal) ────────────────────────────
  console.log('Generating video with title cards...\n')

  const lessonPath = path.join(process.cwd(), LESSON_MD)
  const headings = fs.existsSync(lessonPath) ? extractSectionHeadings(lessonPath) : []

  if (headings.length === 0) {
    console.log('No headings found, skipping video generation.')
    return
  }

  // Generate title card images
  const cardDir = path.join(process.cwd(), OUTPUT_DIR, 'cards')
  fs.mkdirSync(cardDir, { recursive: true })

  const cardPaths: string[] = []
  for (let i = 0; i < headings.length; i++) {
    const cardPath = path.join(cardDir, `card-${String(i).padStart(3, '0')}.png`)
    console.log(`  Card ${i + 1}: "${headings[i]}"`)
    await generateTitleCardImage(headings[i], cardPath)
    cardPaths.push(cardPath)
  }

  // Create video: each title card shown for an equal portion of the audio
  const cardDuration = totalDuration / headings.length

  // Build FFmpeg slideshow from images
  // Write a concat file with durations
  const videoInputPath = path.join(cardDir, 'slideshow.txt')
  const videoInputContent = cardPaths
    .map((p) => `file '${p}'\nduration ${cardDuration.toFixed(2)}`)
    .join('\n')
    // FFmpeg concat demuxer needs the last file repeated without duration
    + `\nfile '${cardPaths[cardPaths.length - 1]}'`
  fs.writeFileSync(videoInputPath, videoInputContent)

  const outputMp4 = path.join(process.cwd(), OUTPUT_MP4)
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${videoInputPath}" -i "${outputMp3}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outputMp4}"`,
    { stdio: 'pipe', timeout: 600_000 }
  )

  console.log(`\nVideo: ${outputMp4}`)
  console.log('\nDone!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
