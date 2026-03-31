// Usage tracking for SimplePractice Notes extension.
// Stores monthly action counts in chrome.storage.local — no PHI, only counts + timestamps.

const USAGE_KEY = 'spn_usage'

export type ActionKey = 'captureIntake' | 'fillNote'

const MINUTES_SAVED: Record<ActionKey, number> = {
  captureIntake: 10,
  fillNote: 8,
}

interface UsageStats {
  month: string // "YYYY-MM"
  actions: Record<ActionKey, number>
}

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function emptyStats(): UsageStats {
  return { month: currentMonth(), actions: { captureIntake: 0, fillNote: 0 } }
}

async function loadStats(): Promise<UsageStats> {
  const result = await chrome.storage.local.get(USAGE_KEY)
  const stored = result[USAGE_KEY] as UsageStats | undefined
  if (!stored || stored.month !== currentMonth()) {
    return emptyStats()
  }
  return stored
}

export async function trackAction(action: ActionKey): Promise<void> {
  const stats = await loadStats()
  stats.actions[action] = (stats.actions[action] ?? 0) + 1
  await chrome.storage.local.set({ [USAGE_KEY]: stats })
}

export async function getTotalMinutesSaved(): Promise<number> {
  const stats = await loadStats()
  return (Object.keys(MINUTES_SAVED) as ActionKey[]).reduce(
    (total, action) => total + (stats.actions[action] ?? 0) * MINUTES_SAVED[action],
    0
  )
}

export function formatTimeSaved(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`
}
