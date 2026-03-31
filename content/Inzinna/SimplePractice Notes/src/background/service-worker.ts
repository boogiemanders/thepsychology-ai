// Background service worker for SimplePractice Notes extension
// Handles extension lifecycle, PHI auto-cleanup, and message routing

const INTAKE_KEY = 'spn_intake'
const NOTE_KEY = 'spn_note'
const TTL_MS = 60 * 60 * 1000 // 1 hour

async function configureSessionStorageAccess(): Promise<void> {
  await chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  })
}

/** Remove captured PHI if older than the secure TTL */
async function cleanupExpiredData(): Promise<void> {
  const result = await chrome.storage.session.get([INTAKE_KEY, NOTE_KEY])

  const intake = result[INTAKE_KEY]
  if (intake?.capturedAt) {
    const age = Date.now() - new Date(intake.capturedAt).getTime()
    if (age > TTL_MS) {
      await chrome.storage.session.remove(INTAKE_KEY)
      console.log('[SPN] Auto-cleared expired intake data')
    }
  }

  const note = result[NOTE_KEY]
  if (note?.generatedAt) {
    const age = Date.now() - new Date(note.generatedAt).getTime()
    if (age > TTL_MS) {
      await chrome.storage.session.remove(NOTE_KEY)
      console.log('[SPN] Auto-cleared expired note data')
    }
  }
}

async function initialize(): Promise<void> {
  await configureSessionStorageAccess()
  await cleanupExpiredData()
}

// Run on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[SPN] SimplePractice Notes extension installed')
  initialize()
  chrome.alarms.create('phi-cleanup', { periodInMinutes: 60 })
})

// Run on startup
chrome.runtime.onStartup.addListener(() => {
  initialize()
})

// Periodic cleanup
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'phi-cleanup') {
    cleanupExpiredData()
  }
})

// Initialize immediately
void initialize()

// ── Dev hot-reload: polls dist/ for changes every 1s ──
const DEV_RELOAD = true
if (DEV_RELOAD) {
  let lastModified = 0
  const checkForChanges = async () => {
    try {
      const url = chrome.runtime.getURL('content/fill-note.js')
      const resp = await fetch(url, { cache: 'no-store' })
      const text = await resp.text()
      const hash = text.length // simple size-based change detection
      if (lastModified && hash !== lastModified) {
        console.log('[SPN] File change detected, reloading...')
        chrome.runtime.reload()
      }
      lastModified = hash
    } catch { /* ignore */ }
  }
  setInterval(checkForChanges, 1000)
}

// Message routing
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_INTAKE') {
    chrome.storage.session.get(INTAKE_KEY, (result) => {
      sendResponse(result[INTAKE_KEY] ?? null)
    })
    return true
  }

  if (message.type === 'GET_NOTE') {
    chrome.storage.session.get(NOTE_KEY, (result) => {
      sendResponse(result[NOTE_KEY] ?? null)
    })
    return true
  }

  if (message.type === 'CLEAR_ALL') {
    chrome.storage.session.remove([INTAKE_KEY, NOTE_KEY], () => {
      sendResponse({ ok: true })
    })
    return true
  }
})
