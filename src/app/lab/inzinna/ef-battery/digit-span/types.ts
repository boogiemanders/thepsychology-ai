export type DigitSpanCondition = 'forward' | 'backward'

export interface DigitSpanKeystroke {
  t: number
  digit: number
  source: 'keyboard' | 'pad'
}

export interface DigitSpanTrialResult {
  condition: DigitSpanCondition
  spanLength: number
  trialIndexAtLength: 1 | 2
  sequence: number[]
  expectedResponse: number[]
  response: number[]
  keystrokes: DigitSpanKeystroke[]
  audioStartedAt: number
  audioEndedAt: number
  responseCompletedAt: number
  firstKeyLatencyMs: number | null
  totalResponseMs: number
  correct: boolean
}

export interface DigitSpanConditionResult {
  condition: DigitSpanCondition
  seed: number
  trials: DigitSpanTrialResult[]
  longestCorrectSpan: number
  totalCorrect: number
  stoppedAtLength: number | null
  startedAt: number
  completedAt: number
  durationMs: number
}

export interface DigitSpanSessionResult {
  sessionId: string
  startedAt: number
  completedAt: number
  forward: DigitSpanConditionResult
  backward: DigitSpanConditionResult
}

export type DigitSpanPhase =
  | 'intro-forward'
  | 'running-forward'
  | 'intro-backward'
  | 'running-backward'
  | 'results'
