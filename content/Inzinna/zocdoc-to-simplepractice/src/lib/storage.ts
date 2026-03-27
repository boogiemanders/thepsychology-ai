import { CapturedClient, ProviderPreferences, DEFAULT_PREFERENCES } from './types'

const STORAGE_KEY = 'capturedClient'
const PREFS_KEY = 'providerPreferences'

export async function saveClient(client: CapturedClient): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: client })
}

export async function getClient(): Promise<CapturedClient | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return result[STORAGE_KEY] ?? null
}

export async function clearClient(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY)
}

export async function updateStatus(
  updates: Partial<CapturedClient['status']>
): Promise<void> {
  const client = await getClient()
  if (!client) return
  client.status = { ...client.status, ...updates }
  await saveClient(client)
}

export async function getPreferences(): Promise<ProviderPreferences> {
  const result = await chrome.storage.local.get(PREFS_KEY)
  return result[PREFS_KEY] ?? { ...DEFAULT_PREFERENCES }
}

export async function savePreferences(prefs: ProviderPreferences): Promise<void> {
  await chrome.storage.local.set({ [PREFS_KEY]: prefs })
}

export async function hasPreferences(): Promise<boolean> {
  const result = await chrome.storage.local.get(PREFS_KEY)
  return !!result[PREFS_KEY]
}
