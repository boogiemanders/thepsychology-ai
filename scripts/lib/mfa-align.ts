/**
 * Montreal Forced Aligner (MFA) integration for word-level audio alignment.
 *
 * MFA is a tool for aligning audio recordings with transcripts to get
 * precise word and phone-level timing information.
 *
 * Prerequisites:
 *   conda create -n mfa -c conda-forge montreal-forced-aligner
 *   conda activate mfa
 *   mfa model download acoustic english_mfa
 *   mfa model download dictionary english_mfa
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename } from 'path'

export type WordTiming = {
  word: string
  start: number // seconds
  end: number // seconds
}

export type PhoneTiming = {
  phone: string
  start: number
  end: number
}

export type AlignmentResult = {
  words: WordTiming[]
  phones?: PhoneTiming[]
  duration: number
}

/**
 * Run MFA batch alignment on a corpus directory.
 *
 * @param corpusDir Directory containing WAV files and matching TXT files
 * @param outputDir Directory to write TextGrid output files
 * @param options Additional MFA options
 */
export function runMFABatch(
  corpusDir: string,
  outputDir: string,
  options: {
    acousticModel?: string
    dictionary?: string
    clean?: boolean
    numJobs?: number
    singleSpeaker?: boolean
  } = {}
): void {
  const {
    acousticModel = 'english_mfa',
    dictionary = 'english_mfa',
    clean = true,
    numJobs = 4,
    singleSpeaker = true,
  } = options

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true })

  // Build MFA command
  const args = [
    'mfa',
    'align',
    `"${corpusDir}"`,
    dictionary,
    acousticModel,
    `"${outputDir}"`,
  ]

  if (clean) {
    args.push('--clean')
  }

  if (numJobs > 1) {
    args.push('--num_jobs', numJobs.toString())
  }

  if (singleSpeaker) {
    args.push('--single_speaker')
  }

  const cmd = args.join(' ')
  console.log(`Running MFA: ${cmd}`)

  try {
    execSync(cmd, {
      stdio: 'inherit',
      encoding: 'utf-8',
      shell: '/bin/bash',
    })
  } catch (error) {
    // MFA returns non-zero exit codes even on success sometimes
    // Check if output files were created
    const expectedOutput = join(outputDir, `${basename(corpusDir)}.TextGrid`)
    if (!existsSync(expectedOutput)) {
      throw new Error(`MFA alignment failed: ${error}`)
    }
  }
}

/**
 * Run MFA alignment on a single audio/text pair.
 *
 * @param wavPath Path to WAV file
 * @param txtPath Path to transcript TXT file
 * @param outputDir Directory to write TextGrid output
 * @returns Path to the generated TextGrid file
 */
export function runMFASingle(
  wavPath: string,
  txtPath: string,
  outputDir: string,
  options: {
    acousticModel?: string
    dictionary?: string
  } = {}
): string {
  const { acousticModel = 'english_mfa', dictionary = 'english_mfa' } = options

  // MFA expects a directory structure, so create a temp corpus
  const baseName = basename(wavPath, '.wav')
  const corpusDir = join(outputDir, 'temp_corpus')
  const speakerDir = join(corpusDir, 'speaker')

  mkdirSync(speakerDir, { recursive: true })

  // Copy files to corpus structure
  const wavDest = join(speakerDir, `${baseName}.wav`)
  const txtDest = join(speakerDir, `${baseName}.txt`)

  // Link or copy files (use copy for simplicity)
  const wavContent = readFileSync(wavPath)
  writeFileSync(wavDest, wavContent)
  const txtContent = readFileSync(txtPath, 'utf-8')
  writeFileSync(txtDest, txtContent)

  // Run MFA
  const alignedDir = join(outputDir, 'aligned')
  runMFABatch(corpusDir, alignedDir, {
    acousticModel,
    dictionary,
    clean: true,
    singleSpeaker: true,
  })

  return join(alignedDir, 'speaker', `${baseName}.TextGrid`)
}

/**
 * Parse a Praat TextGrid file to extract word timings.
 *
 * TextGrid format reference:
 * https://www.fon.hum.uva.nl/praat/manual/TextGrid_file_formats.html
 *
 * @param textGridPath Path to the TextGrid file
 * @returns Alignment result with word timings
 */
export function parseTextGrid(textGridPath: string): AlignmentResult {
  const content = readFileSync(textGridPath, 'utf-8')
  const words: WordTiming[] = []
  const phones: PhoneTiming[] = []

  // Find all tiers
  const lines = content.split('\n')
  let currentTier: 'words' | 'phones' | null = null
  let inIntervals = false
  let duration = 0

  // Track interval parsing state
  let intervalXmin: number | null = null
  let intervalXmax: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detect tier type
    if (line.includes('name = "words"')) {
      currentTier = 'words'
      inIntervals = false
      continue
    }
    if (line.includes('name = "phones"')) {
      currentTier = 'phones'
      inIntervals = false
      continue
    }

    // Detect intervals section
    if (line.startsWith('intervals')) {
      inIntervals = true
      continue
    }

    // Reset tier when we hit a new item class
    if (line.includes('class = "IntervalTier"') && inIntervals) {
      // New tier starting
      currentTier = null
      inIntervals = false
      continue
    }

    // Parse interval bounds
    const xminMatch = line.match(/xmin\s*=\s*([\d.]+)/)
    if (xminMatch) {
      intervalXmin = parseFloat(xminMatch[1])
      continue
    }

    const xmaxMatch = line.match(/xmax\s*=\s*([\d.]+)/)
    if (xmaxMatch) {
      intervalXmax = parseFloat(xmaxMatch[1])
      if (intervalXmax > duration) {
        duration = intervalXmax
      }
      continue
    }

    // Parse text content
    const textMatch = line.match(/text\s*=\s*"([^"]*)"/)
    if (textMatch && intervalXmin !== null && intervalXmax !== null) {
      const text = textMatch[1].trim()

      if (text && text !== '' && text !== '<sil>' && text !== 'sp' && text !== 'spn') {
        const timing = {
          start: intervalXmin,
          end: intervalXmax,
        }

        if (currentTier === 'words') {
          words.push({ word: text, ...timing })
        } else if (currentTier === 'phones') {
          phones.push({ phone: text, ...timing })
        }
      }

      // Reset for next interval
      intervalXmin = null
      intervalXmax = null
    }
  }

  return { words, phones: phones.length > 0 ? phones : undefined, duration }
}

/**
 * Alternative TextGrid parser using regex for simpler format.
 * Some TextGrid files use a more compact format.
 */
export function parseTextGridSimple(textGridPath: string): AlignmentResult {
  const content = readFileSync(textGridPath, 'utf-8')
  const words: WordTiming[] = []
  let duration = 0

  // Find the words tier section
  const wordsTierMatch = content.match(/name\s*=\s*"words"[\s\S]*?(?=name\s*=|$)/i)
  if (!wordsTierMatch) {
    // Try alternative name
    const altMatch = content.match(/name\s*=\s*"word"[\s\S]*?(?=name\s*=|$)/i)
    if (!altMatch) {
      return { words: [], duration: 0 }
    }
  }

  const tierContent = wordsTierMatch?.[0] || ''

  // Parse intervals within the tier
  // Format: xmin = 0.0 \n xmax = 0.5 \n text = "word"
  const intervalPattern = /xmin\s*=\s*([\d.]+)\s*xmax\s*=\s*([\d.]+)\s*text\s*=\s*"([^"]*)"/g
  let match: RegExpExecArray | null

  while ((match = intervalPattern.exec(tierContent)) !== null) {
    const start = parseFloat(match[1])
    const end = parseFloat(match[2])
    const word = match[3].trim()

    if (end > duration) {
      duration = end
    }

    // Skip empty segments and silence markers
    if (word && word !== '' && word !== '<sil>' && word !== 'sp' && word !== 'spn') {
      words.push({ word, start, end })
    }
  }

  return { words, duration }
}

/**
 * Write a transcript file in the format expected by MFA.
 * MFA expects plain text, one utterance per line.
 */
export function writeTranscript(txtPath: string, text: string): void {
  // MFA works best with normalized text
  const normalized = text
    .replace(/\n+/g, ' ') // Remove newlines
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()

  writeFileSync(txtPath, normalized, 'utf-8')
}

/**
 * Check if MFA is installed and available.
 */
export function checkMFAInstalled(): boolean {
  try {
    execSync('mfa version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Check if required MFA models are downloaded.
 */
export function checkMFAModels(): { acoustic: boolean; dictionary: boolean } {
  let acoustic = false
  let dictionary = false

  try {
    const models = execSync('mfa model list acoustic', { encoding: 'utf-8' })
    acoustic = models.includes('english_mfa')
  } catch {
    // Ignore
  }

  try {
    const dicts = execSync('mfa model list dictionary', { encoding: 'utf-8' })
    dictionary = dicts.includes('english_mfa')
  } catch {
    // Ignore
  }

  return { acoustic, dictionary }
}
