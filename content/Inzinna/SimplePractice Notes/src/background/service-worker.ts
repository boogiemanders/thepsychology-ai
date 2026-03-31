// Background service worker for SimplePractice Notes extension
// Handles extension lifecycle, PHI auto-cleanup, and message routing

const INTAKE_KEY = 'spn_intake'
const NOTE_KEY = 'spn_note'
const DIAGNOSTIC_WORKSPACE_KEY = 'spn_diagnostic_workspace'
const SESSION_NOTES_KEY = 'spn_session_notes'
const TREATMENT_PLAN_KEY = 'spn_treatment_plan'
const SOAP_DRAFT_KEY = 'spn_soap_draft'
const TRANSCRIPT_KEY = 'spn_transcript'
const TTL_MS = 60 * 60 * 1000 // 1 hour

type BooleanFieldSyncOperation =
  | { kind: 'checkbox'; name: string }
  | { kind: 'radio'; name: string; value: string }

async function configureSessionStorageAccess(): Promise<void> {
  await chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  })
}

/** Remove captured PHI if older than the secure TTL */
async function cleanupExpiredData(): Promise<void> {
  const result = await chrome.storage.session.get([
    INTAKE_KEY,
    NOTE_KEY,
    DIAGNOSTIC_WORKSPACE_KEY,
    SESSION_NOTES_KEY,
    TREATMENT_PLAN_KEY,
    SOAP_DRAFT_KEY,
    TRANSCRIPT_KEY,
  ])

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

  const sessionNotes = result[SESSION_NOTES_KEY]
  if (sessionNotes?.updatedAt) {
    const age = Date.now() - new Date(sessionNotes.updatedAt).getTime()
    if (age > TTL_MS) {
      await chrome.storage.session.remove(SESSION_NOTES_KEY)
      console.log('[SPN] Auto-cleared expired session notes')
    }
  }

  const treatmentPlan = result[TREATMENT_PLAN_KEY]
  if (treatmentPlan?.capturedAt) {
    const age = Date.now() - new Date(treatmentPlan.capturedAt).getTime()
    if (age > TTL_MS) {
      await chrome.storage.session.remove(TREATMENT_PLAN_KEY)
      console.log('[SPN] Auto-cleared expired treatment plan')
    }
  }

  const soapDraft = result[SOAP_DRAFT_KEY]
  if (soapDraft?.generatedAt) {
    const age = Date.now() - new Date(soapDraft.generatedAt).getTime()
    if (age > TTL_MS) {
      await chrome.storage.session.remove(SOAP_DRAFT_KEY)
      console.log('[SPN] Auto-cleared expired SOAP draft')
    }
  }

  const transcript = result[TRANSCRIPT_KEY]
  if (transcript?.updatedAt) {
    const age = Date.now() - new Date(transcript.updatedAt).getTime()
    if (age > TTL_MS) {
      await chrome.storage.session.remove(TRANSCRIPT_KEY)
      console.log('[SPN] Auto-cleared expired transcript')
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

async function syncBooleanFieldsInPageWorld(
  tabId: number,
  operations: BooleanFieldSyncOperation[]
): Promise<{ applied: number }> {
  if (operations.length === 0) {
    return { applied: 0 }
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    args: [operations],
    func: async (ops: BooleanFieldSyncOperation[]) => {
      const waitFor = (ms: number): Promise<void> =>
        new Promise((resolve) => window.setTimeout(resolve, ms))

      const setCheckedState = (input: HTMLInputElement, checked: boolean): void => {
        const nativeCheckedSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'checked'
        )?.set

        if (nativeCheckedSetter) {
          nativeCheckedSetter.call(input, checked)
          return
        }

        input.checked = checked
      }

      const dispatchBooleanEvents = (input: HTMLInputElement): void => {
        input.focus()

        if ('PointerEvent' in window) {
          input.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0,
            buttons: 1,
          }))
        }

        input.dispatchEvent(new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          composed: true,
          button: 0,
          buttons: 1,
          view: window,
        }))

        if ('PointerEvent' in window) {
          input.dispatchEvent(new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0,
            buttons: 0,
          }))
        }

        input.dispatchEvent(new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          composed: true,
          button: 0,
          buttons: 0,
          view: window,
        }))

        input.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          composed: true,
          button: 0,
          buttons: 0,
          view: window,
        }))

        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
        input.dispatchEvent(new FocusEvent('blur', { composed: true }))
        input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }))
      }

      const findCheckbox = (name: string): HTMLInputElement | null => {
        for (const input of Array.from(document.querySelectorAll('input[type="checkbox"]'))) {
          if (input instanceof HTMLInputElement && input.name === name) {
            return input
          }
        }
        return null
      }

      const findRadio = (name: string, value: string): HTMLInputElement | null => {
        for (const input of Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`))) {
          if (input instanceof HTMLInputElement && input.value === value) {
            return input
          }
        }
        return null
      }

      let applied = 0

      for (const operation of ops) {
        const input = operation.kind === 'checkbox'
          ? findCheckbox(operation.name)
          : findRadio(operation.name, operation.value)

        if (!input) continue

        setCheckedState(input, true)
        dispatchBooleanEvents(input)

        if (input.checked) {
          applied += 1
        }

        await waitFor(20)
      }

      return { applied }
    },
  })

  return { applied: result?.result?.applied ?? 0 }
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
const DEV_RELOAD = false
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    chrome.storage.session.remove([
      INTAKE_KEY,
      NOTE_KEY,
      DIAGNOSTIC_WORKSPACE_KEY,
      SESSION_NOTES_KEY,
      TREATMENT_PLAN_KEY,
      SOAP_DRAFT_KEY,
      TRANSCRIPT_KEY,
    ], () => {
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

  if (message.type === 'SPN_SYNC_BOOLEAN_FIELDS') {
    const tabId = sender.tab?.id
    const operations = Array.isArray(message.operations)
      ? message.operations as BooleanFieldSyncOperation[]
      : []

    if (!tabId) {
      sendResponse({ ok: false, error: 'No sender tab available for boolean sync.' })
      return false
    }

    syncBooleanFieldsInPageWorld(tabId, operations)
      .then(({ applied }) => sendResponse({ ok: true, applied }))
      .catch((error) => {
        const messageText = error instanceof Error ? error.message : String(error)
        console.warn('[SPN] Boolean field sync failed:', error)
        sendResponse({ ok: false, error: messageText })
      })
    return true
  }
})
