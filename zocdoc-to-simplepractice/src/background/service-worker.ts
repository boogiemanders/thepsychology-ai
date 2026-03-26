// Background service worker for ZocDoc to SimplePractice extension
// Handles extension lifecycle events and PHI auto-cleanup

const STORAGE_KEY = 'capturedClient'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/** Remove captured client data if older than 24 hours */
async function cleanupExpiredData(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const client = result[STORAGE_KEY]
  if (!client?.capturedAt) return

  const age = Date.now() - new Date(client.capturedAt).getTime()
  if (age > TTL_MS) {
    await chrome.storage.local.remove(STORAGE_KEY)
    console.log('[ZSP] Auto-cleared expired client data (>24h)')
  }
}

// Run cleanup on install and every time the service worker wakes up
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ZSP] Extension installed')
  cleanupExpiredData()

  // Set up periodic cleanup alarm (every 1 hour)
  chrome.alarms.create('phi-cleanup', { periodInMinutes: 60 })
})

// Also clean up on startup
chrome.runtime.onStartup.addListener(() => {
  cleanupExpiredData()
})

// Alarm-based periodic cleanup
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'phi-cleanup') {
    cleanupExpiredData()
  }
})

// Listen for messages from content scripts if needed
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_CLIENT') {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      sendResponse(result[STORAGE_KEY] ?? null)
    })
    return true // async response
  }
})
