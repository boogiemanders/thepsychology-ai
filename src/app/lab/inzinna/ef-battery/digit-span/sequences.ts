import type { DigitSpanCondition } from './types'

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

export function generateDigitSequence(length: number, seed: number): number[] {
  const rng = mulberry32(seed)
  const out: number[] = []
  let guard = 0
  while (out.length < length && guard < 1000) {
    guard += 1
    const next = 1 + Math.floor(rng() * 9)
    if (out.length > 0 && out[out.length - 1] === next) continue
    out.push(next)
  }
  return out
}

export function expectedResponse(
  sequence: number[],
  condition: DigitSpanCondition,
): number[] {
  return condition === 'forward' ? sequence.slice() : sequence.slice().reverse()
}

export function deriveTrialSeed(
  sessionSeed: number,
  condition: DigitSpanCondition,
  length: number,
  trialIndex: 1 | 2,
): number {
  const conditionBit = condition === 'forward' ? 0 : 1
  return ((sessionSeed >>> 0) ^ ((length << 8) + (trialIndex << 4) + conditionBit)) >>> 0
}
