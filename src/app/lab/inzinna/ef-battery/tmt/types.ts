export type TmtTrial = 'A' | 'B'

export interface TmtNode {
  id: string
  label: string
  order: number
  x: number
  y: number
}

export interface TmtClick {
  t: number
  nodeId: string | null
  correct: boolean
  expectedOrder: number
  x: number
  y: number
}

export interface TmtKinematicFrame {
  t: number
  x: number
  y: number
}

export interface TmtTrialResult {
  trial: TmtTrial
  seed: number
  nodes: TmtNode[]
  clicks: TmtClick[]
  kinematics: TmtKinematicFrame[]
  startedAt: number
  completedAt: number
  durationMs: number
  errors: number
  pathLength: number
}

export type TmtPhase =
  | 'intro-a'
  | 'running-a'
  | 'intro-b'
  | 'running-b'
  | 'results'

export interface TmtSessionResult {
  sessionId: string
  startedAt: number
  completedAt: number
  a: TmtTrialResult
  b: TmtTrialResult
}
