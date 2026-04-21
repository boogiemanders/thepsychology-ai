import type { NBackBlockKind, NBackLevel } from './types'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface NBackSequence {
  shapes: number[]
  isTarget: boolean[]
  primerCount: number
  level: NBackLevel
}

export interface NBackSequenceOptions {
  level: NBackLevel
  scorableCount: number
  targetCount: number
  shapeCount: number
  seed: number
}

function shuffledIndices(count: number, rng: () => number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function generateNBackSequence(
  opts: NBackSequenceOptions,
): NBackSequence {
  const { level, scorableCount, targetCount, shapeCount, seed } = opts
  const rng = mulberry32(seed)
  const primerCount = level
  const totalLength = primerCount + scorableCount

  const shapes: number[] = []
  for (let i = 0; i < totalLength; i += 1) {
    shapes.push(Math.floor(rng() * shapeCount))
  }

  const isTarget: boolean[] = new Array(totalLength).fill(false)
  const scorablePositions = shuffledIndices(scorableCount, rng).slice(
    0,
    targetCount,
  )
  for (const offset of scorablePositions) {
    isTarget[primerCount + offset] = true
  }

  for (let i = primerCount; i < totalLength; i += 1) {
    const back = shapes[i - level]
    if (isTarget[i]) {
      shapes[i] = back
    } else {
      let guard = 0
      while (shapes[i] === back && guard < 50) {
        shapes[i] = Math.floor(rng() * shapeCount)
        guard += 1
      }
      if (shapes[i] === back) {
        shapes[i] = (back + 1) % shapeCount
      }
    }
  }

  return { shapes, isTarget, primerCount, level }
}

export function deriveBlockSeed(
  sessionSeed: number,
  kind: NBackBlockKind,
): number {
  const kindBits: Record<NBackBlockKind, number> = {
    practice: 0,
    '1back': 1,
    '2back': 2,
    '3back': 3,
  }
  const k = kindBits[kind]
  return ((sessionSeed >>> 0) ^ ((k + 1) * 0x9e3779b1)) >>> 0
}
