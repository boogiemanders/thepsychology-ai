import {
  IntakeData,
  ProgressNote,
  ProviderPreferences,
  DEFAULT_PREFERENCES,
} from './types'

const INTAKE_KEY = 'spn_intake'
const NOTE_KEY = 'spn_note'
const PREFS_KEY = 'spn_preferences'

// ── Intake Data (session storage — PHI with TTL) ──

export async function saveIntake(intake: IntakeData): Promise<void> {
  await chrome.storage.session.set({ [INTAKE_KEY]: intake })
}

export async function getIntake(): Promise<IntakeData | null> {
  const result = await chrome.storage.session.get(INTAKE_KEY)
  return (result[INTAKE_KEY] as IntakeData | undefined) ?? null
}

export async function clearIntake(): Promise<void> {
  await chrome.storage.session.remove(INTAKE_KEY)
}

export async function mergeIntake(partial: Partial<IntakeData>): Promise<void> {
  const existing = await getIntake()
  if (existing) {
    await saveIntake({ ...existing, ...partial })
  } else {
    await saveIntake({ ...({} as IntakeData), ...partial })
  }
}

// ── Progress Note (session storage — PHI with TTL) ──

export async function saveNote(note: ProgressNote): Promise<void> {
  await chrome.storage.session.set({ [NOTE_KEY]: note })
}

export async function getNote(): Promise<ProgressNote | null> {
  const result = await chrome.storage.session.get(NOTE_KEY)
  return (result[NOTE_KEY] as ProgressNote | undefined) ?? null
}

export async function clearNote(): Promise<void> {
  await chrome.storage.session.remove(NOTE_KEY)
}

export async function updateNoteStatus(
  updates: Partial<ProgressNote['status']>
): Promise<void> {
  const note = await getNote()
  if (!note) return
  note.status = { ...note.status, ...updates }
  await saveNote(note)
}

// ── Provider Preferences (local storage — not PHI) ──

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
  }
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

// ── Cleanup ──

export async function clearAll(): Promise<void> {
  await chrome.storage.session.remove([INTAKE_KEY, NOTE_KEY])
}
