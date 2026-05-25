export type VfTrial = 'letter' | 'category'

export type VfInputMode = 'voice' | 'typed'

export type VfPhase =
  | 'intro-letter'
  | 'running-letter'
  | 'intro-category'
  | 'running-category'
  | 'transcribing'
  | 'results'

export interface VfAmplitudeFrame {
  t: number
  level: number
}

export interface VfTranscribedWord {
  word: string
  start: number
  end: number
}

export interface VfTypedKeystroke {
  t: number
  char: string
  kind: 'char' | 'backspace' | 'enter' | 'space'
}

export type VfIntrusionReason = 'letter-mismatch' | 'too-short' | 'filler'

export interface VfScoredWord {
  raw: string
  normalized: string
  tMs: number | null
  valid: boolean
  repetition: boolean
  intrusion: boolean
  intrusionReason?: VfIntrusionReason
}

export interface VfTrialResult {
  trial: VfTrial
  prompt: string
  input: VfInputMode
  startedAt: number
  completedAt: number
  durationMs: number
  audio?: { mimeType: string; base64: string }
  amplitude?: VfAmplitudeFrame[]
  whisperWords?: VfTranscribedWord[]
  keystrokes?: VfTypedKeystroke[]
  transcript: string
  words: VfScoredWord[]
  totalValid: number
  repetitions: number
  intrusions: number
}

export interface VfRecordingPayload {
  input: VfInputMode
  startedAt: number
  completedAt: number
  durationMs: number
  audio?: { mimeType: string; base64: string; blob: Blob }
  amplitude?: VfAmplitudeFrame[]
  keystrokes?: VfTypedKeystroke[]
  typedText?: string
}

export interface VfSessionResult {
  sessionId: string
  startedAt: number
  completedAt: number
  letter: VfTrialResult
  category: VfTrialResult
}
