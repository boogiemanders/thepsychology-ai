// License validation and feedback submission for SimplePractice Notes extension
// No PHI is ever sent to the license server — only the license key itself.

const API_BASE = 'https://thepsychology.ai'
const EXTENSION_ID = 'spn'
const LICENSE_KEY_STORAGE = 'inzinna_license_key'
const LICENSE_STATUS_STORAGE = 'inzinna_license_status'
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000  // 24 hours
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface LicenseStatus {
  valid: boolean
  tier: string | null
  expiresAt: string | null
  checkedAt: string
}

export async function getLicenseKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(LICENSE_KEY_STORAGE)
  return result[LICENSE_KEY_STORAGE] ?? null
}

export async function saveLicenseKey(key: string): Promise<void> {
  await chrome.storage.local.set({ [LICENSE_KEY_STORAGE]: key.trim() })
}

async function getCachedStatus(): Promise<LicenseStatus | null> {
  const result = await chrome.storage.local.get(LICENSE_STATUS_STORAGE)
  return result[LICENSE_STATUS_STORAGE] ?? null
}

async function saveCachedStatus(status: LicenseStatus): Promise<void> {
  await chrome.storage.local.set({ [LICENSE_STATUS_STORAGE]: status })
}

async function fetchLicenseStatus(key: string): Promise<LicenseStatus> {
  const res = await fetch(`${API_BASE}/api/extension/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey: key, extensionId: EXTENSION_ID }),
  })

  if (!res.ok) {
    throw new Error(`License server returned ${res.status}`)
  }

  const data = await res.json() as { valid?: boolean; tier?: string; expiresAt?: string }
  return {
    valid: Boolean(data.valid),
    tier: data.tier ?? null,
    expiresAt: data.expiresAt ?? null,
    checkedAt: new Date().toISOString(),
  }
}

/**
 * Returns true if the stored license key is valid.
 * Uses cached result if fresh (< 24 hrs), attempts a recheck if stale,
 * and applies a 7-day grace period if the server is unreachable.
 */
export async function isLicenseValid(): Promise<boolean> {
  const key = await getLicenseKey()
  if (!key) return false

  const cached = await getCachedStatus()
  if (!cached) {
    // No cache yet — try a live check
    try {
      const status = await fetchLicenseStatus(key)
      await saveCachedStatus(status)
      return status.valid
    } catch {
      return false
    }
  }

  const ageMs = Date.now() - new Date(cached.checkedAt).getTime()

  // Cache is still fresh
  if (ageMs < CHECK_INTERVAL_MS) {
    return cached.valid
  }

  // Cache is stale — attempt a fresh check
  try {
    const fresh = await fetchLicenseStatus(key)
    await saveCachedStatus(fresh)
    return fresh.valid
  } catch {
    // Server unreachable: extend grace period up to 7 days for valid licenses
    if (cached.valid && ageMs < GRACE_PERIOD_MS) {
      return true
    }
    return false
  }
}

/**
 * Validates a license key against the server and saves it if valid.
 * Returns { valid, error? }.
 */
export async function validateAndSaveLicense(
  key: string
): Promise<{ valid: boolean; error?: string }> {
  const trimmed = key.trim()
  if (!trimmed) {
    return { valid: false, error: 'Please enter a license key.' }
  }

  try {
    const status = await fetchLicenseStatus(trimmed)
    if (status.valid) {
      await saveLicenseKey(trimmed)
      await saveCachedStatus(status)
      return { valid: true }
    }
    return { valid: false, error: 'License key not found or subscription inactive.' }
  } catch {
    return { valid: false, error: 'Could not reach the license server. Check your connection.' }
  }
}

/**
 * Silently refreshes the cached license status.
 * Called from the service worker on a daily alarm.
 */
export async function refreshLicenseInBackground(): Promise<void> {
  const key = await getLicenseKey()
  if (!key) return

  try {
    const status = await fetchLicenseStatus(key)
    await saveCachedStatus(status)
  } catch {
    // Silently ignore — grace period logic handles offline scenarios
  }
}

/**
 * Submits feedback to the backend Slack channel.
 * No PHI is sent — only the license key (for attribution), extension metadata, and the message.
 */
export async function submitFeedback(
  extensionName: string,
  extensionVersion: string,
  category: string,
  message: string
): Promise<void> {
  const key = await getLicenseKey()

  const res = await fetch(`${API_BASE}/api/extension/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      licenseKey: key ?? null,
      extensionName,
      extensionVersion,
      category,
      message,
    }),
  })

  if (!res.ok) {
    throw new Error(`Feedback submission failed: ${res.status}`)
  }
}
