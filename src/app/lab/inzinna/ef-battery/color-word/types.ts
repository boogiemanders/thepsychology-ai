export type CwColor = 'red' | 'blue' | 'yellow'

export type CwCondition = 'c1-color' | 'c2-word' | 'c3-inhibit' | 'c4-switch'

export type CwAskFor = 'ink' | 'word'

export interface CwStimulus {
  index: number
  condition: CwCondition
  word: CwColor | null
  ink: CwColor | 'neutral'
  askFor: CwAskFor
  expected: CwColor
  boxed: boolean
  isPractice: boolean
}

export interface CwKinematicFrame {
  t: number
  x: number
  y: number
}

export type CwResponseSource = 'mouse' | 'keyboard' | 'timeout'

export interface CwTrialResult {
  stimulus: CwStimulus
  stimulusShownAt: number
  response: CwColor | null
  responseSource: CwResponseSource
  rtMs: number | null
  correct: boolean
  kinematics: CwKinematicFrame[]
  pathLength: number
  timeToMovementOnsetMs: number | null
}

export interface CwConditionResult {
  condition: CwCondition
  seed: number
  trials: CwTrialResult[]
  scoredTrials: CwTrialResult[]
  totalTimeMs: number
  scoredResponseTimeMs: number
  errors: number
  medianRtMs: number | null
  accuracy: number
  startedAt: number
  completedAt: number
}

export interface CwSessionResult {
  sessionId: string
  sessionSeed: number
  startedAt: number
  completedAt: number
  c1: CwConditionResult
  c2: CwConditionResult
  c3: CwConditionResult
  c4: CwConditionResult
  interferenceMs: number
  switchingCostMs: number
}

export type CwPhase =
  | 'intro-c1'
  | 'running-c1'
  | 'intro-c2'
  | 'running-c2'
  | 'intro-c3'
  | 'running-c3'
  | 'intro-c4'
  | 'running-c4'
  | 'results'

export const CW_COLORS: readonly CwColor[] = ['red', 'blue', 'yellow'] as const

export const CW_COLOR_HEX: Record<CwColor, string> = {
  red: '#D62728',
  blue: '#0072B2',
  yellow: '#D4A017',
}

export const CW_TRIALS_PER_CONDITION = 30
export const CW_PRACTICE_PER_CONDITION = 3
export const CW_TIMEOUT_MS = 3000
export const CW_ITI_MS = 400
export const CW_FEEDBACK_MS = 600
