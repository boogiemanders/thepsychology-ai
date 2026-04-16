/**
 * Shared date <-> fraction helpers for the 4-month timeline (Apr–Jul 2026).
 * Each month gets equal visual width (1/4 of track).
 * Fraction = (monthIndex + (day-1) / daysInMonth) / 4
 */

export const MONTH_META = [
  { index: 0, num: 4, label: 'Apr', days: 30 },
  { index: 1, num: 5, label: 'May', days: 31 },
  { index: 2, num: 6, label: 'Jun', days: 30 },
  { index: 3, num: 7, label: 'Jul', days: 31 },
] as const

export function fractionToDate(frac: number): { monthNum: number; day: number } {
  const scaled = Math.max(0, Math.min(3.999, frac * 4))
  const mi = Math.floor(scaled)
  const m = MONTH_META[mi]
  const dayFrac = scaled - mi
  const day = Math.max(1, Math.min(m.days, Math.round(dayFrac * m.days) + 1))
  return { monthNum: m.num, day }
}

export function dateToFraction(monthNum: number, day: number): number {
  const m = MONTH_META.find(mm => mm.num === monthNum)
  if (!m) return 0
  return (m.index + (day - 1) / m.days) / 4
}

export function daysInMonth(monthNum: number): number {
  return MONTH_META.find(m => m.num === monthNum)?.days ?? 30
}
