// Opens the app page on icon click and fetches report CSVs from a
// SimplePractice tab (page context = session cookies always attached).

import { toCsv } from '../lib/csv'
import { mergeReports, RATER8_HEADER } from '../lib/merge'
import {
  RATER8_ORIGIN,
  RATER8_TENANT_ID,
  RATER8_POLLING_FOLDER_ID,
  RATER8_POLLING_FOLDER_NAME,
  UploadStep,
  evaluateUpload,
  owedWindow,
  isoDate,
  reportUrls,
  csvFilename,
  filterUnsent,
  pruneSentLog,
} from '../lib/rater8-upload'

const SP_ORIGIN = 'https://secure.simplepractice.com'

function openApp() {
  chrome.tabs.create({ url: chrome.runtime.getURL('app/app.html') })
}

// Guard so a missing chrome.action (stale load / odd boot) can't throw at the
// top of the worker and stop the FETCH_REPORTS listener below from registering.
if (chrome.action?.onClicked) {
  chrome.action.onClicked.addListener(openApp)
}

interface FetchReportsRequest {
  type: 'FETCH_REPORTS'
  urls: string[]
}

interface FetchedReport {
  ok: boolean
  text: string
  finalUrl: string
}

// Runs inside the SimplePractice page. Must be self-contained.
async function fetchCsvsInPage(urls: string[]): Promise<FetchedReport[]> {
  const out: FetchedReport[] = []
  for (const url of urls) {
    try {
      const res = await fetch(url, { credentials: 'same-origin' })
      const text = await res.text()
      out.push({ ok: res.ok, text, finalUrl: res.url })
    } catch (e) {
      out.push({ ok: false, text: String(e), finalUrl: url })
    }
  }
  return out
}

function looksLikeLogin(r: FetchedReport): boolean {
  return (
    r.finalUrl.includes('sign_in') ||
    /^\s*<!doctype html|^\s*<html/i.test(r.text)
  )
}

async function waitForTabComplete(tabId: number, timeoutMs: number): Promise<void> {
  const tab = await chrome.tabs.get(tabId)
  if (tab.status === 'complete') return
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      resolve()
    }, timeoutMs)
    function listener(id: number, info: chrome.tabs.TabChangeInfo) {
      if (id === tabId && info.status === 'complete') {
        clearTimeout(timer)
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }
    chrome.tabs.onUpdated.addListener(listener)
  })
}

async function fetchReports(urls: string[], surfaceLoginTab = true) {
  let [tab] = await chrome.tabs.query({ url: `${SP_ORIGIN}/*` })
  let createdTabId: number | null = null
  if (!tab) {
    tab = await chrome.tabs.create({ url: `${SP_ORIGIN}/`, active: false })
    createdTabId = tab.id!
    await waitForTabComplete(tab.id!, 20000)
  }
  const tabId = tab.id!
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: fetchCsvsInPage,
      args: [urls],
    })
    const reports = (result?.result ?? []) as FetchedReport[]
    if (reports.length !== urls.length || reports.some((r) => !r.ok || looksLikeLogin(r))) {
      // surface the SP tab so the user can log in (manual runs only), keep it open
      if (surfaceLoginTab) await chrome.tabs.update(tabId, { active: true })
      return { ok: false, error: 'LOGIN_REQUIRED' }
    }
    if (createdTabId !== null) {
      chrome.tabs.remove(createdTabId).catch(() => {})
    }
    return { ok: true, reports: reports.map((r) => r.text) }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// Runs inside the rave.rater8.com page. Must be self-contained.
// Step 'store' delivers the CSV bytes; the server's reply names the stored
// file, which step 'process' then submits for review-request processing.
async function uploadCsvInPage(
  csvText: string,
  filename: string,
  tenantId: number,
  pollingFolderId: string,
  pollingFolderName: string
): Promise<{ step: string; status: number; body: string }[]> {
  const out: { step: string; status: number; body: string }[] = []
  try {
    const fd = new FormData()
    fd.append(filename, new File([csvText], filename, { type: 'text/csv' }), filename)
    fd.append('uploadername', 'C:\\fakepath\\' + filename)
    fd.append('tenantId', String(tenantId))
    fd.append('pollingFolderId', pollingFolderId)
    const res1 = await fetch('/Integration/UploadFiles', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    })
    const body1 = await res1.text()
    out.push({ step: 'store', status: res1.status, body: body1 })
    let stored: string[] | null = null
    try {
      const j = JSON.parse(body1)
      if (j?.success && Array.isArray(j?.result?.fileName)) stored = j.result.fileName
    } catch {
      // not JSON (login page); evaluateUpload will classify it
    }
    if (!stored || !stored.length) return out
    const res2 = await fetch('/api/services/app/integrationUploadFile/UploadIntegrationFiles', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fileList: stored,
        tenantId,
        pollingFolderId,
        pollingFolderName,
        processLocationCodes: false,
        processAppointmentCodes: false,
        processDepartmentCodes: false,
        processEmployeeCodes: false,
      }),
    })
    out.push({ step: 'process', status: res2.status, body: await res2.text() })
  } catch (e) {
    out.push({ step: 'error', status: 0, body: String(e) })
  }
  return out
}

async function uploadToRater8(
  csvText: string,
  filename: string,
  surfaceLoginTab: boolean
): Promise<{ steps: UploadStep[]; loggedOutBeforeUpload?: boolean }> {
  let [tab] = await chrome.tabs.query({ url: `${RATER8_ORIGIN}/*` })
  let createdTabId: number | null = null
  if (!tab) {
    tab = await chrome.tabs.create({ url: `${RATER8_ORIGIN}/`, active: false })
    createdTabId = tab.id!
    await waitForTabComplete(tab.id!, 20000)
    tab = await chrome.tabs.get(tab.id!)
  }
  const tabId = tab.id!
  if (!tab.url?.startsWith(RATER8_ORIGIN)) {
    // bounced to an off-origin login: signing in is the fix, keep the tab for that
    if (surfaceLoginTab) await chrome.tabs.update(tabId, { active: true })
    return { steps: [], loggedOutBeforeUpload: true }
  }
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: uploadCsvInPage,
      args: [csvText, filename, RATER8_TENANT_ID, RATER8_POLLING_FOLDER_ID, RATER8_POLLING_FOLDER_NAME],
    })
    const steps = (result?.result ?? []) as UploadStep[]
    const verdict = evaluateUpload(steps)
    if (verdict.ok && createdTabId !== null) {
      chrome.tabs.remove(createdTabId).catch(() => {})
    }
    if (verdict.loggedOut && surfaceLoginTab) await chrome.tabs.update(tabId, { active: true })
    return { steps }
  } catch (e) {
    return { steps: [{ step: 'error', status: 0, body: String(e) }] }
  }
}

// ---------- rater8 auto-upload pipeline ----------
// Triggers (alarm, ride-along, manual button) all funnel here. Single-flight:
// concurrent triggers are dropped, repeat triggers after success are no-ops
// because owedWindow returns null.

interface RunOutcome {
  ok: boolean
  detail: string
}

let runInFlight = false

async function runAutoUpload(trigger: 'alarm' | 'ridealong' | 'manual'): Promise<RunOutcome> {
  if (runInFlight) return { ok: false, detail: 'a run is already in progress' }
  runInFlight = true
  try {
    return await doRun(trigger)
  } catch (e) {
    return { ok: false, detail: String(e) }
  } finally {
    runInFlight = false
  }
}

async function doRun(trigger: 'alarm' | 'ridealong' | 'manual'): Promise<RunOutcome> {
  const settings = await chrome.storage.sync.get(['autoUploadEnabled', 'slackWebhookUrl'])
  if (trigger !== 'manual' && !settings.autoUploadEnabled) {
    return { ok: false, detail: 'auto-upload is switched off' }
  }
  const store = await chrome.storage.local.get(['lastUploadedThrough', 'sentLog', 'lastAttemptAt'])
  const now = new Date()
  const window = owedWindow(store.lastUploadedThrough ?? null, now)
  if (!window) return { ok: true, detail: 'nothing owed, already up to date' }
  // ride-along fires on every SP page load; don't hammer a failing pipeline
  if (trigger === 'ridealong' && store.lastAttemptAt && Date.now() - store.lastAttemptAt < 3 * 60 * 1000) {
    return { ok: false, detail: 'tried a few minutes ago' }
  }
  await chrome.storage.local.set({ lastAttemptAt: Date.now() })
  const surface = trigger === 'manual'
  const range = window.start === window.end ? window.end : `${window.start} to ${window.end}`

  const sp = await fetchReports(reportUrls(window.start, window.end), surface)
  if (!sp.ok) {
    if (sp.error === 'LOGIN_REQUIRED') {
      // signing in IS the fix; clear the debounce so the post-login
      // ride-along run is never blocked
      await chrome.storage.local.remove('lastAttemptAt')
      await setFailBadge(true)
      await recordRun(false, `waiting for a SimplePractice sign-in (${range})`)
      if (trigger !== 'manual') await nudgeOnce(settings.slackWebhookUrl, now, 'SimplePractice')
      return { ok: false, detail: 'sign into SimplePractice first' }
    }
    await setFailBadge(true)
    await recordRun(false, `SimplePractice pull failed: ${sp.error} (${range})`)
    if (trigger !== 'manual') {
      await postSlack(
        settings.slackWebhookUrl,
        `rater8 upload FAILED: SimplePractice pull error (${sp.error}). Open the extension and click "Upload to rater8 now" to retry.`
      )
    }
    return { ok: false, detail: `SimplePractice pull failed: ${sp.error}` }
  }

  const [attendance, details] = sp.reports as string[]
  const merged = mergeReports(attendance, details)
  const sentLog = pruneSentLog((store.sentLog ?? {}) as Record<string, string>, now)
  const { fresh, hashes } = await filterUnsent(merged.rater8, sentLog)

  if (!fresh.length) {
    await chrome.storage.local.set({ sentLog, lastUploadedThrough: window.end })
    await recordRun(true, `0 new visits (${range})`)
    await setFailBadge(false)
    if (trigger !== 'manual') {
      await successOnce(settings.slackWebhookUrl, now, `rater8: 0 new visits to upload (${range}).`)
    }
    return { ok: true, detail: `0 new visits (${range})` }
  }

  const up = await uploadToRater8(toCsv(RATER8_HEADER, fresh), csvFilename(window.start, window.end), surface)
  const verdict = evaluateUpload(up.steps)
  if (up.loggedOutBeforeUpload || verdict.loggedOut) {
    await chrome.storage.local.remove('lastAttemptAt')
    await setFailBadge(true)
    await recordRun(false, `waiting for a rater8 sign-in (${range})`)
    if (trigger !== 'manual') await nudgeOnce(settings.slackWebhookUrl, now, 'rater8')
    return { ok: false, detail: 'sign into rater8 first' }
  }
  if (!verdict.ok) {
    await setFailBadge(true)
    await recordRun(false, `${verdict.detail} (${range})`)
    if (trigger !== 'manual') {
      await postSlack(
        settings.slackWebhookUrl,
        `rater8 upload FAILED: ${verdict.detail}. Open the extension and click "Upload to rater8 now" to retry.`
      )
    }
    return { ok: false, detail: verdict.detail }
  }

  for (const h of hashes) sentLog[h] = window.end
  await chrome.storage.local.set({ sentLog, lastUploadedThrough: window.end })
  await recordRun(true, `uploaded ${fresh.length} visits (${range})`)
  await setFailBadge(false)
  if (trigger !== 'manual') {
    await successOnce(settings.slackWebhookUrl, now, `rater8: uploaded ${fresh.length} visits (${range}).`)
  }
  return { ok: true, detail: `uploaded ${fresh.length} visits (${range})` }
}

async function recordRun(ok: boolean, detail: string) {
  await chrome.storage.local.set({ lastRunResult: { when: Date.now(), ok, detail } })
}

async function postSlack(webhook: string | undefined, text: string) {
  if (!webhook) return
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    // Slack being down must not break the run
  }
}

// one nudge and one success message per day, max
async function nudgeOnce(webhook: string | undefined, now: Date, site: 'SimplePractice' | 'rater8') {
  const today = isoDate(now)
  const { lastNudgeDate } = await chrome.storage.local.get('lastNudgeDate')
  if (lastNudgeDate === today) return
  await chrome.storage.local.set({ lastNudgeDate: today })
  await postSlack(webhook, `rater8 upload waiting: sign into ${site} and I'll do the rest.`)
}

async function successOnce(webhook: string | undefined, now: Date, text: string) {
  const today = isoDate(now)
  const { lastSuccessDate } = await chrome.storage.local.get('lastSuccessDate')
  if (lastSuccessDate === today) return
  await chrome.storage.local.set({ lastSuccessDate: today })
  await postSlack(webhook, text)
}

async function setFailBadge(on: boolean) {
  await chrome.action.setBadgeText({ text: on ? '!' : '' })
  if (on) await chrome.action.setBadgeBackgroundColor({ color: '#d93025' })
}

// ---------- triggers ----------

const ALARM_NAME = 'rater8-daily'

function msUntilNext7am(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

function armAlarm() {
  chrome.alarms.create(ALARM_NAME, {
    when: Date.now() + msUntilNext7am(new Date()),
    periodInMinutes: 1440,
  })
}

// startup/install: re-arm the alarm and quietly catch up missed days
chrome.runtime.onInstalled.addListener(() => {
  armAlarm()
  void runAutoUpload('ridealong')
})
chrome.runtime.onStartup.addListener(() => {
  armAlarm()
  void runAutoUpload('ridealong')
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) void runAutoUpload('alarm')
})

// ride-along: a signed-in SP or rater8 page load finishes any owed work.
// Cheap when nothing is owed; single-flight blocks the loads our own
// background tabs generate mid-run.
chrome.tabs.onUpdated.addListener((_tabId, info, tab) => {
  if (info.status !== 'complete' || !tab.url) return
  const watched = tab.url.startsWith(`${SP_ORIGIN}/`) || tab.url.startsWith(`${RATER8_ORIGIN}/`)
  if (!watched || /sign_in|login/i.test(tab.url)) return
  void runAutoUpload('ridealong')
})

interface RunUploadRequest {
  type: 'RUN_RATER8_UPLOAD'
}

chrome.runtime.onMessage.addListener(
  (msg: FetchReportsRequest | RunUploadRequest, _sender, sendResponse) => {
    if (msg?.type === 'FETCH_REPORTS') {
      fetchReports(msg.urls).then(sendResponse)
      return true // async response
    }
    if (msg?.type === 'RUN_RATER8_UPLOAD') {
      runAutoUpload('manual').then(sendResponse)
      return true // async response
    }
  }
)
