// Opens the app page on icon click and fetches report CSVs from a
// SimplePractice tab (page context = session cookies always attached).

const SP_ORIGIN = 'https://secure.simplepractice.com'

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('app/app.html') })
})

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

async function fetchReports(urls: string[]) {
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
      // surface the SP tab so the user can log in, keep it open
      await chrome.tabs.update(tabId, { active: true })
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

chrome.runtime.onMessage.addListener((msg: FetchReportsRequest, _sender, sendResponse) => {
  if (msg?.type === 'FETCH_REPORTS') {
    fetchReports(msg.urls).then(sendResponse)
    return true // async response
  }
})
