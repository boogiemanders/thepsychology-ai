"use strict";
(() => {
  // src/background/service-worker.ts
  var SP_ORIGIN = "https://secure.simplepractice.com";
  function openApp() {
    chrome.tabs.create({ url: chrome.runtime.getURL("app/app.html") });
  }
  if (chrome.action?.onClicked) {
    chrome.action.onClicked.addListener(openApp);
  }
  async function fetchCsvsInPage(urls) {
    const out = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        const text = await res.text();
        out.push({ ok: res.ok, text, finalUrl: res.url });
      } catch (e) {
        out.push({ ok: false, text: String(e), finalUrl: url });
      }
    }
    return out;
  }
  function looksLikeLogin(r) {
    return r.finalUrl.includes("sign_in") || /^\s*<!doctype html|^\s*<html/i.test(r.text);
  }
  async function waitForTabComplete(tabId, timeoutMs) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "complete") return;
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, timeoutMs);
      function listener(id, info) {
        if (id === tabId && info.status === "complete") {
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }
      chrome.tabs.onUpdated.addListener(listener);
    });
  }
  async function fetchReports(urls) {
    let [tab] = await chrome.tabs.query({ url: `${SP_ORIGIN}/*` });
    let createdTabId = null;
    if (!tab) {
      tab = await chrome.tabs.create({ url: `${SP_ORIGIN}/`, active: false });
      createdTabId = tab.id;
      await waitForTabComplete(tab.id, 2e4);
    }
    const tabId = tab.id;
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: fetchCsvsInPage,
        args: [urls]
      });
      const reports = result?.result ?? [];
      if (reports.length !== urls.length || reports.some((r) => !r.ok || looksLikeLogin(r))) {
        await chrome.tabs.update(tabId, { active: true });
        return { ok: false, error: "LOGIN_REQUIRED" };
      }
      if (createdTabId !== null) {
        chrome.tabs.remove(createdTabId).catch(() => {
        });
      }
      return { ok: true, reports: reports.map((r) => r.text) };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "FETCH_REPORTS") {
      fetchReports(msg.urls).then(sendResponse);
      return true;
    }
  });
})();
//# sourceMappingURL=service-worker.js.map
