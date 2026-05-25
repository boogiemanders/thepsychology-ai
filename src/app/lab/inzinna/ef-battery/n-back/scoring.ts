import type {
  NBackBlockKind,
  NBackBlockResult,
  NBackLevel,
  NBackTrial,
} from './types'

const SQRT2 = Math.SQRT2

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * ax)
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax)
  return sign * y
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / SQRT2))
}

export function inverseNormalCdf(p: number): number {
  if (p <= 0 || p >= 1) {
    if (p <= 0) return -Infinity
    return Infinity
  }
  let lo = -8
  let hi = 8
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2
    if (normalCdf(mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function dPrime(
  hits: number,
  targets: number,
  falseAlarms: number,
  foils: number,
): { dPrime: number; hitRate: number; faRate: number } {
  const hitRate = (hits + 0.5) / (targets + 1)
  const faRate = (falseAlarms + 0.5) / (foils + 1)
  return {
    dPrime: inverseNormalCdf(hitRate) - inverseNormalCdf(faRate),
    hitRate,
    faRate,
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  let sum = 0
  for (const v of values) sum += v
  return sum / values.length
}

export function summarizeBlock(args: {
  kind: NBackBlockKind
  level: NBackLevel
  seed: number
  trials: NBackTrial[]
  startedAt: number
  completedAt: number
}): NBackBlockResult {
  const { kind, level, seed, trials, startedAt, completedAt } = args

  let hits = 0
  let misses = 0
  let falseAlarms = 0
  let correctRejections = 0
  let targets = 0
  let foils = 0
  const hitRts: number[] = []

  for (const t of trials) {
    if (t.isPrimer) continue
    if (t.isTarget) {
      targets += 1
      if (t.outcome === 'hit') {
        hits += 1
        if (t.rtMs !== null) hitRts.push(t.rtMs)
      } else {
        misses += 1
      }
    } else {
      foils += 1
      if (t.outcome === 'falseAlarm') falseAlarms += 1
      else correctRejections += 1
    }
  }

  const { dPrime: dp, hitRate, faRate } = dPrime(hits, targets, falseAlarms, foils)
  const total = targets + foils
  const accuracy = total > 0 ? (hits + correctRejections) / total : 0

  return {
    kind,
    level,
    seed,
    trials,
    targets,
    foils,
    hits,
    misses,
    falseAlarms,
    correctRejections,
    hitRate,
    faRate,
    dPrime: dp,
    accuracy,
    meanRtHitMs: hitRts.length > 0 ? mean(hitRts) : null,
    medianRtHitMs: hitRts.length > 0 ? median(hitRts) : null,
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
  }
}
