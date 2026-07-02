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

chrome.runtime.onMessage.addListener((msg: FetchReportsRequest, _sender, sendResponse) => {
  if (msg?.type === 'FETCH_REPORTS') {
    fetchReports(msg.urls).then(sendResponse)
    return true // async response
  }
})
