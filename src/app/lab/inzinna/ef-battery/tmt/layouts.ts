import type { TmtNode, TmtTrial } from './types'

const VIEWBOX_W = 1000
const VIEWBOX_H = 640
const EDGE_PAD = 55
const INITIAL_MIN_DIST = 115
const MIN_MIN_DIST = 90

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

function tryPlace(
  count: number,
  seed: number,
  minDist: number,
): { x: number; y: number }[] | null {
  const rng = mulberry32(seed)
  const placed: { x: number; y: number }[] = []
  const maxAttempts = 15000
  let attempts = 0

  while (placed.length < count && attempts < maxAttempts) {
    attempts += 1
    const x = EDGE_PAD + rng() * (VIEWBOX_W - EDGE_PAD * 2)
    const y = EDGE_PAD + rng() * (VIEWBOX_H - EDGE_PAD * 2)
    const tooClose = placed.some((p) => {
      const dx = p.x - x
      const dy = p.y - y
      return Math.hypot(dx, dy) < minDist
    })
    if (!tooClose) placed.push({ x, y })
  }

  return placed.length === count ? placed : null
}

function placeNodes(count: number, seed: number): { x: number; y: number }[] {
  for (let minDist = INITIAL_MIN_DIST; minDist >= MIN_MIN_DIST; minDist -= 5) {
    const placed = tryPlace(count, seed, minDist)
    if (placed) return placed
  }
  throw new Error(
    `TMT layout: unable to place ${count} nodes (seed ${seed}) even at min distance ${MIN_MIN_DIST}`,
  )
}

const TRIAL_A_LABELS = Array.from({ length: 25 }, (_, i) => String(i + 1))

const TRIAL_B_LABELS: string[] = (() => {
  const nums = Array.from({ length: 13 }, (_, i) => String(i + 1))
  const letters = 'ABCDEFGHIJKL'.split('')
  const out: string[] = []
  for (let i = 0; i < 13; i += 1) {
    out.push(nums[i])
    if (letters[i]) out.push(letters[i])
  }
  return out
})()

export function generateLayout(trial: TmtTrial, seed: number): TmtNode[] {
  const labels = trial === 'A' ? TRIAL_A_LABELS : TRIAL_B_LABELS
  const positions = placeNodes(labels.length, seed)
  return labels.map((label, index) => ({
    id: `${trial}-${index}`,
    label,
    order: index,
    x: positions[index].x,
    y: positions[index].y,
  }))
}

export const TMT_VIEWBOX = { width: VIEWBOX_W, height: VIEWBOX_H }
