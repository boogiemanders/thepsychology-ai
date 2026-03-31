// Background service worker for ZocDoc to SimplePractice extension
// Handles extension lifecycle events and PHI auto-cleanup

const CLIENT_STORAGE_KEY = 'capturedClient'
const PENDING_VOB_KEY = 'pendingVobDraft'
const LEGACY_LOCAL_CLIENT_KEY = CLIENT_STORAGE_KEY
const TTL_MS = 60 * 60 * 1000 // 1 hour

async function configureSessionStorageAccess(): Promise<void> {
  await chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  })
}

async function migrateLegacyClientStorage(): Promise<void> {
  const legacyResult = await chrome.storage.local.get(LEGACY_LOCAL_CLIENT_KEY)
  const legacyClient = legacyResult[LEGACY_LOCAL_CLIENT_KEY]
  if (!legacyClient) return

  await chrome.storage.session.set({ [CLIENT_STORAGE_KEY]: legacyClient })
  await chrome.storage.local.remove(LEGACY_LOCAL_CLIENT_KEY)
  console.log('[ZSP] Migrated legacy client data from storage.local to storage.session')
}

/** Remove captured PHI if older than the secure TTL */
async function cleanupExpiredData(): Promise<void> {
  const sessionResult = await chrome.storage.session.get([CLIENT_STORAGE_KEY, PENDING_VOB_KEY])
  const client = sessionResult[CLIENT_STORAGE_KEY]
  const pendingDraft = sessionResult[PENDING_VOB_KEY]

  if (client?.capturedAt) {
    const age = Date.now() - new Date(client.capturedAt).getTime()
    if (age > TTL_MS) {
      await chrome.storage.session.remove(CLIENT_STORAGE_KEY)
      console.log('[ZSP] Auto-cleared expired client data from session storage')
    }
  }

  if (pendingDraft?.createdAt) {
    const age = Date.now() - new Date(pendingDraft.createdAt).getTime()
    if (age > TTL_MS) {
      await chrome.storage.session.remove(PENDING_VOB_KEY)
      console.log('[ZSP] Auto-cleared expired pending VOB draft')
    }
  }
}

async function initializeSecureStorage(): Promise<void> {
  await configureSessionStorageAccess()
  await migrateLegacyClientStorage()
  await cleanupExpiredData()
}

// Run cleanup on install and every time the service worker wakes up
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ZSP] Extension installed')
  initializeSecureStorage()

  // Set up periodic cleanup alarm (every 1 hour)
  chrome.alarms.create('phi-cleanup', { periodInMinutes: 60 })
})

// Also clean up on startup
chrome.runtime.onStartup.addListener(() => {
  initializeSecureStorage()
})

// Alarm-based periodic cleanup
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'phi-cleanup') {
    cleanupExpiredData()
  }
})

void initializeSecureStorage()

// ── Dev hot-reload: polls dist/ for changes every 1s ──
const DEV_RELOAD = true
if (DEV_RELOAD) {
  let lastModified = 0
  const checkForChanges = async () => {
    try {
      const url = chrome.runtime.getURL('content/simplepractice.js')
      const resp = await fetch(url, { cache: 'no-store' })
      const text = await resp.text()
      const hash = text.length
      if (lastModified && hash !== lastModified) {
        console.log('[ZSP] File change detected, reloading...')
        chrome.runtime.reload()
      }
      lastModified = hash
    } catch { /* ignore */ }
  }
  setInterval(checkForChanges, 1000)
}

// Listen for messages from content scripts if needed
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_CLIENT') {
    chrome.storage.session.get(CLIENT_STORAGE_KEY, (result) => {
      sendResponse(result[CLIENT_STORAGE_KEY] ?? null)
    })
    return true // async response
  }
})
