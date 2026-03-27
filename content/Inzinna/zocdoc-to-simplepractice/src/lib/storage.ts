import { CapturedClient } from './types'

const STORAGE_KEY = 'capturedClient'

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
