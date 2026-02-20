export const WORD_REGEX = /[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g
export const PLAYBACK_RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const

const VOWEL_GROUP_REGEX = /[aeiouy]+/gi

export function estimateSyllables(word: string): number {
  const matches = word.toLowerCase().match(VOWEL_GROUP_REGEX)
  return matches ? Math.max(1, matches.length) : 1
}

export function computeWordProgressMap(text: string): number[] {
  const matches = Array.from(text.matchAll(WORD_REGEX))
  if (matches.length === 0) return []

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const tableLike =
    lines.length >= 2 &&
    lines.filter((line) => line.includes(',')).length / lines.length >= 0.6 &&
    lines.some((line) => /\d/.test(line))
  const tableLineWordCounts = tableLike
    ? lines
        .map((line) => (line.match(WORD_REGEX) || []).length)
        .filter((count) => count > 0)
    : []
  const avgWordsPerTableLine =
    tableLineWordCounts.length > 0
      ? tableLineWordCounts.reduce((sum, count) => sum + count, 0) / tableLineWordCounts.length
      : 0
  const tableRowPauseBoost = tableLike
    ? Math.min(3.5, Math.max(1.4, avgWordsPerTableLine * 0.5))
    : 0
  const tableCommaBoost = tableLike ? 0.9 : 0
  const tableWordMultiplier = tableLike ? 1.35 : 1

  const weights: number[] = []
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i]
    const word = match[0] ?? ''
    const start = (match.index ?? 0) + word.length
    const nextIndex = matches[i + 1]?.index ?? text.length
    const gap = text.slice(start, nextIndex)

    const syllables = estimateSyllables(word) * tableWordMultiplier
    let pauseWeight = 0

    if (gap.includes('\n\n')) {
      pauseWeight += 1.2 + tableRowPauseBoost
    } else if (gap.includes('\n')) {
      pauseWeight += 0.8 + tableRowPauseBoost
    }
    if (/[.!?]/.test(gap)) pauseWeight += 0.9
    if (/[,:;]/.test(gap)) pauseWeight += 0.5 + (tableLike && /,/.test(gap) ? tableCommaBoost : 0)
    if (/(?:--|\u2014|\u2013)/.test(gap)) pauseWeight += 0.3

    weights.push(Math.max(0.9, syllables) + pauseWeight)
  }

  const total = weights.reduce((acc, w) => acc + w, 0)
  if (!Number.isFinite(total) || total <= 0) return []

  let cumulative = 0
  return weights.map((w) => {
    cumulative += w
    return Math.min(1, cumulative / total)
  })
}

export function findWordIndexForRatio(progressMap: number[], ratio: number): number {
  if (progressMap.length === 0) return 0
  if (ratio <= progressMap[0]) return 0
  const lastIndex = progressMap.length - 1
  if (ratio >= progressMap[lastIndex]) return lastIndex

  let lo = 0
  let hi = lastIndex
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (progressMap[mid] < ratio) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return Math.min(Math.max(lo, 0), lastIndex)
}

export function findWordIndexForEndTimes(endTimes: number[], seconds: number): number {
  if (endTimes.length === 0) return 0
  if (!Number.isFinite(seconds) || seconds <= 0) return 0

  const lastIndex = endTimes.length - 1
  if (seconds >= (endTimes[lastIndex] ?? 0)) return lastIndex

  let lo = 0
  let hi = lastIndex
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const end = endTimes[mid] ?? 0
    if (end < seconds) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return Math.min(Math.max(lo, 0), lastIndex)
}

export function countWords(text: string): number {
  const matches = text.match(WORD_REGEX)
  return matches ? matches.length : 0
}

export function getEffectiveDurationSeconds(audio: HTMLAudioElement): number {
  const direct = audio.duration
  if (Number.isFinite(direct) && direct > 0) return direct

  const seekable = audio.seekable
  if (seekable && seekable.length > 0) {
    try {
      const end = seekable.end(seekable.length - 1)
      if (Number.isFinite(end) && end > 0) return end
    } catch {
      // ignore
    }
  }

  return NaN
}
