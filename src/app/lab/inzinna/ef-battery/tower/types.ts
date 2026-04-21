export type PegIndex = 0 | 1 | 2

export interface TowerState {
  pegs: [number[], number[], number[]]
}

export type TowerViolationReason =
  | 'larger-on-smaller'
  | 'source-empty'
  | 'same-peg'

export interface TowerMove {
  t: number
  discSize: number
  fromPeg: PegIndex
  toPeg: PegIndex
  valid: boolean
  violationReason?: TowerViolationReason
  resultingState: TowerState
}

export interface TowerKinematicFrame {
  t: number
  x: number
  y: number
}

export interface TowerDrag {
  discSize: number
  fromPeg: PegIndex
  toPeg: PegIndex | null
  startT: number
  endT: number
  frames: TowerKinematicFrame[]
  completed: boolean
}

export interface TowerPuzzleSpec {
  id: string
  index: number
  discCount: number
  initial: TowerState
  goal: TowerState
  optimalMoves: number
}

export interface TowerPuzzleResult {
  puzzleId: string
  discCount: number
  initial: TowerState
  goal: TowerState
  optimalMoves: number
  moves: TowerMove[]
  drags: TowerDrag[]
  startedAt: number
  completedAt: number
  durationMs: number
  firstMoveLatencyMs: number | null
  totalMoves: number
  validMoves: number
  violations: number
  excessMoves: number
  solved: boolean
}

export type TowerPhase =
  | 'intro'
  | 'running'
  | 'between'
  | 'results'

export interface TowerSessionResult {
  sessionId: string
  startedAt: number
  completedAt: number
  puzzles: TowerPuzzleResult[]
}
