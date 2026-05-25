import type {
  VfScoredWord,
  VfTrial,
  VfTranscribedWord,
  VfTypedKeystroke,
} from './types'

const FILLERS = new Set([
  'um',
  'uh',
  'uhh',
  'umm',
  'mm',
  'mmm',
  'hmm',
  'hm',
  'er',
  'ah',
  'ahh',
  'eh',
  'oh',
  'ok',
  'okay',
  'like',
])

const WORD_REGEX = /[a-zA-Z][a-zA-Z'-]*/g

export function normalizeWord(raw: string): string {
  let w = raw.toLowerCase().trim()
  w = w.replace(/^[^a-z]+|[^a-z]+$/g, '')
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) {
    w = w.slice(0, -1)
  }
  if (w.length > 4 && (w.endsWith('es') || w.endsWith('ed'))) {
    w = w.slice(0, -2)
  }
  if (w.length > 4 && w.endsWith('ing')) {
    w = w.slice(0, -3)
  }
  return w
}

function validateToken(
  raw: string,
  trial: VfTrial,
  prompt: string,
  seen: Set<string>,
): VfScoredWord {
  const normalized = normalizeWord(raw)

  const base: VfScoredWord = {
    raw,
    normalized,
    tMs: null,
    valid: false,
    repetition: false,
    intrusion: false,
  }

  if (!normalized || normalized.length < 2) {
    return { ...base, intrusion: true, intrusionReason: 'too-short' }
  }

  if (FILLERS.has(normalized)) {
    return { ...base, intrusion: true, intrusionReason: 'filler' }
  }

  if (trial === 'letter') {
    const letter = prompt.toLowerCase()
    if (!normalized.startsWith(letter)) {
      return { ...base, intrusion: true, intrusionReason: 'letter-mismatch' }
    }
  }

  if (seen.has(normalized)) {
    return { ...base, repetition: true }
  }

  seen.add(normalized)
  return { ...base, valid: true }
}

export interface ScoreSummary {
  totalValid: number
  repetitions: number
  intrusions: number
}

export function summarize(words: VfScoredWord[]): ScoreSummary {
  let totalValid = 0
  let repetitions = 0
  let intrusions = 0
  for (const w of words) {
    if (w.valid) totalValid += 1
    if (w.repetition) repetitions += 1
    if (w.intrusion) intrusions += 1
  }
  return { totalValid, repetitions, intrusions }
}

export function scoreFromWhisper(
  whisperWords: VfTranscribedWord[],
  trial: VfTrial,
  prompt: string,
): VfScoredWord[] {
  const seen = new Set<string>()
  const out: VfScoredWord[] = []
  for (const w of whisperWords) {
    const scored = validateToken(w.word, trial, prompt, seen)
    scored.tMs = Math.round(w.start * 1000)
    out.push(scored)
  }
  return out
}

export interface TypedScoringInput {
  text: string
  keystrokes: VfTypedKeystroke[]
}

export function scoreFromTyped(
  input: TypedScoringInput,
  trial: VfTrial,
  prompt: string,
): VfScoredWord[] {
  const seen = new Set<string>()
  const out: VfScoredWord[] = []

  const matches = Array.from(input.text.matchAll(WORD_REGEX))
  let searchStart = 0

  for (const match of matches) {
    const raw = match[0]
    const scored = validateToken(raw, trial, prompt, seen)

    const matchIdx = match.index ?? input.text.indexOf(raw, searchStart)
    searchStart = matchIdx + raw.length

    let runningLen = 0
    let tMs: number | null = null
    for (const ks of input.keystrokes) {
      if (ks.kind === 'char') runningLen += 1
      else if (ks.kind === 'backspace') runningLen = Math.max(0, runningLen - 1)
      else if (ks.kind === 'space' || ks.kind === 'enter') runningLen += 1
      if (runningLen >= matchIdx + 1) {
        tMs = ks.t
        break
      }
    }
    scored.tMs = tMs
    out.push(scored)
  }

  return out
}
