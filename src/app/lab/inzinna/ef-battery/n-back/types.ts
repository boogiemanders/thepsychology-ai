export type NBackLevel = 1 | 2 | 3

export type NBackBlockKind = 'practice' | '1back' | '2back' | '3back'

export type NBackOutcome =
  | 'hit'
  | 'miss'
  | 'falseAlarm'
  | 'correctRejection'
  | 'primer'

export interface NBackTrial {
  index: number
  isPrimer: boolean
  isTarget: boolean
  shapeIndex: number
  stimulusOnsetPerf: number
  stimulusOnsetWall: number
  responsePerf: number | null
  responseSource: 'key' | 'button' | null
  rtMs: number | null
  outcome: NBackOutcome
}

export interface NBackBlockResult {
  kind: NBackBlockKind
  level: NBackLevel
  seed: number
  trials: NBackTrial[]
  targets: number
  foils: number
  hits: number
  misses: number
  falseAlarms: number
  correctRejections: number
  hitRate: number
  faRate: number
  dPrime: number
  accuracy: number
  meanRtHitMs: number | null
  medianRtHitMs: number | null
  startedAt: number
  completedAt: number
  durationMs: number
}

export interface NBackSessionResult {
  sessionId: string
  sessionSeed: number
  startedAt: number
  completedAt: number
  shapeCount: number
  stimulusMs: number
  isiMs: number
  scorableCount: number
  targetCount: number
  practice: NBackBlockResult
  oneBack: NBackBlockResult
  twoBack: NBackBlockResult
  threeBack: NBackBlockResult
}

export type NBackPhase =
  | 'intro'
  | 'practice'
  | 'intro-1back'
  | 'running-1back'
  | 'intro-2back'
  | 'running-2back'
  | 'intro-3back'
  | 'running-3back'
  | 'results'
