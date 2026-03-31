// Usage tracking for ZocDoc to SimplePractice extension.
// Stores monthly action counts in chrome.storage.local — no PHI, only counts + timestamps.

const USAGE_KEY = 'zsp_usage'

export type ActionKey = 'captureClient' | 'fillDemographics' | 'fillInsurance' | 'fillAppointment' | 'sendVob'

const MINUTES_SAVED: Record<ActionKey, number> = {
  captureClient: 5,
  fillDemographics: 5,
  fillInsurance: 4,
  fillAppointment: 3,
  sendVob: 5,
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
  return {
    month: currentMonth(),
    actions: { captureClient: 0, fillDemographics: 0, fillInsurance: 0, fillAppointment: 0, sendVob: 0 },
  }
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
