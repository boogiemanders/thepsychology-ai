import {
  CapturedClient,
  ProviderPreferences,
  DEFAULT_PREFERENCES,
  PendingVobDraft,
} from './types'

const CLIENT_STORAGE_KEY = 'capturedClient'
const PENDING_VOB_KEY = 'pendingVobDraft'
const PREFS_KEY = 'providerPreferences'
const LEGACY_LOCAL_CLIENT_KEY = CLIENT_STORAGE_KEY

function normalizePreferences(
  prefs: Partial<ProviderPreferences> | undefined
): ProviderPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    providerFirstName: prefs?.providerFirstName?.trim() || DEFAULT_PREFERENCES.providerFirstName,
    providerLastName: prefs?.providerLastName?.trim() || DEFAULT_PREFERENCES.providerLastName,
    defaultLocation: prefs?.defaultLocation?.trim() || DEFAULT_PREFERENCES.defaultLocation,
    firstVisitCPT: prefs?.firstVisitCPT?.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
    followUpCPT: prefs?.followUpCPT?.trim() || DEFAULT_PREFERENCES.followUpCPT,
    vobTo: prefs?.vobTo?.length ? prefs.vobTo : DEFAULT_PREFERENCES.vobTo,
    vobCc: prefs?.vobCc?.length ? prefs.vobCc : DEFAULT_PREFERENCES.vobCc,
    vobSignature: prefs?.vobSignature?.trim() || DEFAULT_PREFERENCES.vobSignature,
  }
}

async function migrateLegacyClientIfPresent(): Promise<CapturedClient | null> {
  const legacyResult = await chrome.storage.local.get(LEGACY_LOCAL_CLIENT_KEY)
  const legacyClient = legacyResult[LEGACY_LOCAL_CLIENT_KEY] as CapturedClient | undefined
  if (!legacyClient) return null

  await chrome.storage.session.set({ [CLIENT_STORAGE_KEY]: legacyClient })
  await chrome.storage.local.remove(LEGACY_LOCAL_CLIENT_KEY)
  return legacyClient
}

export async function saveClient(client: CapturedClient): Promise<void> {
  await chrome.storage.session.set({ [CLIENT_STORAGE_KEY]: client })
}

export async function getClient(): Promise<CapturedClient | null> {
  const result = await chrome.storage.session.get(CLIENT_STORAGE_KEY)
  if (result[CLIENT_STORAGE_KEY]) {
    return result[CLIENT_STORAGE_KEY] as CapturedClient
  }

  return migrateLegacyClientIfPresent()
}

export async function clearClient(): Promise<void> {
  await chrome.storage.session.remove(CLIENT_STORAGE_KEY)
  await chrome.storage.session.remove(PENDING_VOB_KEY)
  await chrome.storage.local.remove(LEGACY_LOCAL_CLIENT_KEY)
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
  return normalizePreferences(result[PREFS_KEY] as Partial<ProviderPreferences> | undefined)
}

export async function savePreferences(prefs: ProviderPreferences): Promise<void> {
  await chrome.storage.local.set({ [PREFS_KEY]: normalizePreferences(prefs) })
}

export async function hasPreferences(): Promise<boolean> {
  const result = await chrome.storage.local.get(PREFS_KEY)
  return !!result[PREFS_KEY]
}

export async function savePendingVobDraft(draft: PendingVobDraft): Promise<void> {
  await chrome.storage.session.set({ [PENDING_VOB_KEY]: draft })
}

export async function getPendingVobDraft(): Promise<PendingVobDraft | null> {
  const result = await chrome.storage.session.get(PENDING_VOB_KEY)
  return (result[PENDING_VOB_KEY] as PendingVobDraft | undefined) ?? null
}

export async function clearPendingVobDraft(): Promise<void> {
  await chrome.storage.session.remove(PENDING_VOB_KEY)
}
