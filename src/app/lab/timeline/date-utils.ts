/**
 * Shared date <-> fraction helpers for the personal timeline (Apr-Dec 2026).
 * Each month gets equal visual width (1/N of track where N = MONTH_META.length).
 * Fraction = (monthIndex + (day-1) / daysInMonth) / MONTH_META.length
 */

export const MONTH_META = [
  { index: 0, num: 4,  label: 'Apr', days: 30 },
  { index: 1, num: 5,  label: 'May', days: 31 },
  { index: 2, num: 6,  label: 'Jun', days: 30 },
  { index: 3, num: 7,  label: 'Jul', days: 31 },
  { index: 4, num: 8,  label: 'Aug', days: 31 },
  { index: 5, num: 9,  label: 'Sep', days: 30 },
  { index: 6, num: 10, label: 'Oct', days: 31 },
  { index: 7, num: 11, label: 'Nov', days: 30 },
  { index: 8, num: 12, label: 'Dec', days: 31 },
] as const

const N = MONTH_META.length

export function fractionToDate(frac: number): { monthNum: number; day: number } {
  const scaled = Math.max(0, Math.min(N - 0.001, frac * N))
  const mi = Math.floor(scaled)
  const m = MONTH_META[mi]
  const dayFrac = scaled - mi
  const day = Math.max(1, Math.min(m.days, Math.round(dayFrac * m.days) + 1))
  return { monthNum: m.num, day }
}

export function dateToFraction(monthNum: number, day: number): number {
  const m = MONTH_META.find(mm => mm.num === monthNum)
  if (!m) return 0
  return (m.index + (day - 1) / m.days) / N
}

export function daysInMonth(monthNum: number): number {
  return MONTH_META.find(m => m.num === monthNum)?.days ?? 30
}
