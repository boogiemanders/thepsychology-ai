// Background service worker for SimplePractice Notes extension
// Handles extension lifecycle, PHI auto-cleanup, and message routing

const INTAKE_KEY = 'spn_intake'
const NOTE_KEY = 'spn_note'
const DIAGNOSTIC_WORKSPACE_KEY = 'spn_diagnostic_workspace'
const TTL_MS = 60 * 60 * 1000 // 1 hour

async function configureSessionStorageAccess(): Promise<void> {
  await chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  })
}

/** Remove captured PHI if older than the secure TTL */
async function cleanupExpiredData(): Promise<void> {
  const result = await chrome.storage.session.get([INTAKE_KEY, NOTE_KEY, DIAGNOSTIC_WORKSPACE_KEY])

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

  const workspace = result[DIAGNOSTIC_WORKSPACE_KEY]
  if (workspace?.updatedAt) {
    const age = Date.now() - new Date(workspace.updatedAt).getTime()
    if (age > TTL_MS) {
      await chrome.storage.session.remove(DIAGNOSTIC_WORKSPACE_KEY)
      console.log('[SPN] Auto-cleared expired diagnostic workspace')
    }
  }
}

async function initialize(): Promise<void> {
  await configureSessionStorageAccess()
  await cleanupExpiredData()
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForTabComplete(tabId: number, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated)
      reject(new Error(`Timed out waiting for tab ${tabId}`))
    }, timeoutMs)

    const finish = () => {
      clearTimeout(timeout)
      chrome.tabs.onUpdated.removeListener(onUpdated)
      resolve()
    }

    const onUpdated = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        finish()
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated)
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return
      if (tab.status === 'complete') finish()
    })
  })
}

async function sendMessageToTabWithRetries(
  tabId: number,
  message: unknown,
  retries = 8
): Promise<unknown> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message)
      if (response) return response
    } catch {
      // Content script may not be ready yet.
    }
    await wait(500)
  }

  return null
}

async function discoverIntakeNoteUrlsViaTab(clientId: string): Promise<string[]> {
  const url = `https://secure.simplepractice.com/clients/${clientId}/intake_notes`
  const tab = await chrome.tabs.create({ url, active: false })

  if (!tab.id) return []

  try {
    await waitForTabComplete(tab.id)
    await wait(1500)
    const response = await sendMessageToTabWithRetries(tab.id, {
      type: 'SPN_COLLECT_INTAKE_NOTE_URLS',
      clientId,
    }) as { urls?: string[] } | null

    return Array.isArray(response?.urls) ? response.urls : []
  } catch (err) {
    console.warn('[SPN] Background-tab intake-note discovery failed:', err)
    return []
  } finally {
    try {
      await chrome.tabs.remove(tab.id)
    } catch {
      // Ignore tab cleanup errors.
    }
  }
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

  if (message.type === 'GET_DIAGNOSTIC_WORKSPACE') {
    chrome.storage.session.get(DIAGNOSTIC_WORKSPACE_KEY, (result) => {
      sendResponse(result[DIAGNOSTIC_WORKSPACE_KEY] ?? null)
    })
    return true
  }

  if (message.type === 'CLEAR_ALL') {
    chrome.storage.session.remove([INTAKE_KEY, NOTE_KEY, DIAGNOSTIC_WORKSPACE_KEY], () => {
      sendResponse({ ok: true })
    })
    return true
  }

  if (message.type === 'SPN_DISCOVER_INTAKE_NOTE_URLS') {
    discoverIntakeNoteUrlsViaTab(message.clientId)
      .then((urls) => sendResponse({ urls }))
      .catch(() => sendResponse({ urls: [] }))
    return true
  }
})
