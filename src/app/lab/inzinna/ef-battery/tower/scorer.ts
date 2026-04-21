import type { PegIndex, TowerState, TowerPuzzleSpec } from './types'

const PEGS: PegIndex[] = [0, 1, 2]

export function stateKey(state: TowerState): string {
  return `${state.pegs[0].join(',')}|${state.pegs[1].join(',')}|${state.pegs[2].join(',')}`
}

export function cloneState(state: TowerState): TowerState {
  return {
    pegs: [state.pegs[0].slice(), state.pegs[1].slice(), state.pegs[2].slice()],
  }
}

export function statesEqual(a: TowerState, b: TowerState): boolean {
  return stateKey(a) === stateKey(b)
}

export function topOf(peg: readonly number[]): number | null {
  return peg.length === 0 ? null : peg[peg.length - 1]
}

export function isLegalMove(
  state: TowerState,
  from: PegIndex,
  to: PegIndex,
): boolean {
  if (from === to) return false
  const src = state.pegs[from]
  const srcTop = topOf(src)
  if (srcTop === null) return false
  const dstTop = topOf(state.pegs[to])
  if (dstTop === null) return true
  return dstTop > srcTop
}

export function applyMove(
  state: TowerState,
  from: PegIndex,
  to: PegIndex,
): TowerState {
  const next = cloneState(state)
  const disc = next.pegs[from].pop()
  if (disc === undefined) {
    throw new Error(`applyMove: source peg ${from} is empty`)
  }
  next.pegs[to].push(disc)
  return next
}

/**
 * Shortest number of legal moves between two Tower of Hanoi states.
 * BFS over the full state graph. For N discs the graph has 3^N states,
 * so this is fine up to ~10 discs. Returns Infinity if unreachable.
 */
export function optimalPathLength(
  initial: TowerState,
  goal: TowerState,
): number {
  if (statesEqual(initial, goal)) return 0
  const visited = new Set<string>()
  visited.add(stateKey(initial))

  type Node = { state: TowerState; depth: number }
  const queue: Node[] = [{ state: initial, depth: 0 }]
  let head = 0

  while (head < queue.length) {
    const { state, depth } = queue[head]
    head += 1
    for (const from of PEGS) {
      for (const to of PEGS) {
        if (!isLegalMove(state, from, to)) continue
        const next = applyMove(state, from, to)
        const key = stateKey(next)
        if (visited.has(key)) continue
        if (statesEqual(next, goal)) return depth + 1
        visited.add(key)
        queue.push({ state: next, depth: depth + 1 })
      }
    }
  }
  return Infinity
}

/**
 * Classic start: all N discs stacked on peg 0, largest at bottom.
 * Disc sizes are 1..N (smaller number = smaller disc).
 */
export function classicInitial(discCount: number): TowerState {
  const stack = Array.from({ length: discCount }, (_, i) => discCount - i)
  return { pegs: [stack, [], []] }
}

/**
 * Classic goal: all N discs stacked on peg 2.
 */
export function classicGoal(discCount: number): TowerState {
  const stack = Array.from({ length: discCount }, (_, i) => discCount - i)
  return { pegs: [[], [], stack] }
}

/**
 * Build the battery's ordered puzzle sequence: 3, 4, 5, 6, 7 discs,
 * classic start → classic goal on peg 2.
 * Optimal for classic N-disc tower is 2^N - 1, confirmed via BFS.
 */
export function buildBatteryPuzzles(): TowerPuzzleSpec[] {
  const discCounts = [3, 4, 5, 6, 7]
  return discCounts.map((discCount, index) => {
    const initial = classicInitial(discCount)
    const goal = classicGoal(discCount)
    return {
      id: `tower-${discCount}`,
      index: index + 1,
      discCount,
      initial,
      goal,
      optimalMoves: optimalPathLength(initial, goal),
    }
  })
}
