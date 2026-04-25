import {
  CW_COLORS,
  CW_PRACTICE_PER_CONDITION,
  CW_TRIALS_PER_CONDITION,
  type CwColor,
  type CwCondition,
  type CwStimulus,
} from './types'

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

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function deriveConditionSeed(sessionSeed: number, condition: CwCondition): number {
  const bits: Record<CwCondition, number> = {
    'c1-color': 1,
    'c2-word': 2,
    'c3-inhibit': 3,
    'c4-switch': 4,
  }
  return ((sessionSeed >>> 0) ^ ((bits[condition] << 20) | 0x9e3779b9)) >>> 0
}

interface StimulusCore {
  word: CwColor | null
  ink: CwColor | 'neutral'
  askFor: 'ink' | 'word'
  expected: CwColor
  boxed: boolean
}

function buildC1Pool(): StimulusCore[] {
  const pool: StimulusCore[] = []
  for (const ink of CW_COLORS) {
    for (let i = 0; i < 10; i += 1) {
      pool.push({ word: null, ink, askFor: 'ink', expected: ink, boxed: false })
    }
  }
  return pool
}

function buildC2Pool(): StimulusCore[] {
  const pool: StimulusCore[] = []
  for (const word of CW_COLORS) {
    for (let i = 0; i < 10; i += 1) {
      pool.push({ word, ink: 'neutral', askFor: 'word', expected: word, boxed: false })
    }
  }
  return pool
}

function buildC3Pool(): StimulusCore[] {
  const pool: StimulusCore[] = []
  for (const word of CW_COLORS) {
    const inks = CW_COLORS.filter((c) => c !== word)
    for (const ink of inks) {
      for (let i = 0; i < 5; i += 1) {
        pool.push({ word, ink, askFor: 'ink', expected: ink, boxed: false })
      }
    }
  }
  return pool
}

function buildC4Pool(): StimulusCore[] {
  const pool: StimulusCore[] = []
  for (const word of CW_COLORS) {
    const inks = CW_COLORS.filter((c) => c !== word)
    for (const ink of inks) {
      for (let i = 0; i < 5; i += 1) {
        const boxed = i < 2 || (i === 2 && inks.indexOf(ink) === 0)
        pool.push({
          word,
          ink,
          askFor: boxed ? 'word' : 'ink',
          expected: boxed ? word : ink,
          boxed,
        })
      }
    }
  }
  return pool
}

function buildPracticePool(condition: CwCondition): StimulusCore[] {
  const [r, g, b] = CW_COLORS
  switch (condition) {
    case 'c1-color':
      return [
        { word: null, ink: r, askFor: 'ink', expected: r, boxed: false },
        { word: null, ink: g, askFor: 'ink', expected: g, boxed: false },
        { word: null, ink: b, askFor: 'ink', expected: b, boxed: false },
      ]
    case 'c2-word':
      return [
        { word: r, ink: 'neutral', askFor: 'word', expected: r, boxed: false },
        { word: g, ink: 'neutral', askFor: 'word', expected: g, boxed: false },
        { word: b, ink: 'neutral', askFor: 'word', expected: b, boxed: false },
      ]
    case 'c3-inhibit':
      return [
        { word: r, ink: g, askFor: 'ink', expected: g, boxed: false },
        { word: g, ink: b, askFor: 'ink', expected: b, boxed: false },
        { word: b, ink: r, askFor: 'ink', expected: r, boxed: false },
      ]
    case 'c4-switch':
      return [
        { word: r, ink: b, askFor: 'ink', expected: b, boxed: false },
        { word: g, ink: r, askFor: 'word', expected: g, boxed: true },
        { word: b, ink: g, askFor: 'ink', expected: g, boxed: false },
      ]
  }
}

function avoidRepeats(list: StimulusCore[], rng: () => number): StimulusCore[] {
  if (list.length < 3) return list
  const result = list.slice()
  for (let attempt = 0; attempt < 20; attempt += 1) {
    let dirty = false
    for (let i = 2; i < result.length; i += 1) {
      const sameInk =
        result[i].ink === result[i - 1].ink && result[i].ink === result[i - 2].ink
      const sameWord =
        result[i].word !== null &&
        result[i].word === result[i - 1].word &&
        result[i].word === result[i - 2].word
      if (sameInk || sameWord) {
        for (let j = i + 1; j < result.length; j += 1) {
          const inkOk =
            result[j].ink !== result[i - 1].ink || result[j].ink !== result[i - 2].ink
          const wordOk =
            result[j].word !== result[i - 1].word || result[j].word !== result[i - 2].word
          if (inkOk && wordOk) {
            ;[result[i], result[j]] = [result[j], result[i]]
            dirty = true
            break
          }
        }
      }
    }
    if (!dirty) break
    void rng
  }
  return result
}

export function generateStimuli(condition: CwCondition, seed: number): CwStimulus[] {
  const rng = mulberry32(seed)

  const scoredPool = (() => {
    switch (condition) {
      case 'c1-color':
        return buildC1Pool()
      case 'c2-word':
        return buildC2Pool()
      case 'c3-inhibit':
        return buildC3Pool()
      case 'c4-switch':
        return buildC4Pool()
    }
  })()

  if (scoredPool.length !== CW_TRIALS_PER_CONDITION) {
    throw new Error(
      `stimuli pool for ${condition} has ${scoredPool.length} items, expected ${CW_TRIALS_PER_CONDITION}`,
    )
  }

  const scored = avoidRepeats(shuffle(scoredPool, rng), rng)
  const practice = buildPracticePool(condition)

  const all: CwStimulus[] = [
    ...practice.map((core, i) => ({ ...core, condition, index: i, isPractice: true })),
    ...scored.map((core, i) => ({
      ...core,
      condition,
      index: CW_PRACTICE_PER_CONDITION + i,
      isPractice: false,
    })),
  ]

  return all
}
