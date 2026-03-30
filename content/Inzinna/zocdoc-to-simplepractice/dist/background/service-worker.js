"use strict";
(() => {
  // src/background/service-worker.ts
  var CLIENT_STORAGE_KEY = "capturedClient";
  var PENDING_VOB_KEY = "pendingVobDraft";
  var LEGACY_LOCAL_CLIENT_KEY = CLIENT_STORAGE_KEY;
  var TTL_MS = 60 * 60 * 1e3;
  async function configureSessionStorageAccess() {
    await chrome.storage.session.setAccessLevel({
      accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"
    });
  }
  async function migrateLegacyClientStorage() {
    const legacyResult = await chrome.storage.local.get(LEGACY_LOCAL_CLIENT_KEY);
    const legacyClient = legacyResult[LEGACY_LOCAL_CLIENT_KEY];
    if (!legacyClient) return;
    await chrome.storage.session.set({ [CLIENT_STORAGE_KEY]: legacyClient });
    await chrome.storage.local.remove(LEGACY_LOCAL_CLIENT_KEY);
    console.log("[ZSP] Migrated legacy client data from storage.local to storage.session");
  }
  async function cleanupExpiredData() {
    const sessionResult = await chrome.storage.session.get([CLIENT_STORAGE_KEY, PENDING_VOB_KEY]);
    const client = sessionResult[CLIENT_STORAGE_KEY];
    const pendingDraft = sessionResult[PENDING_VOB_KEY];
    if (client?.capturedAt) {
      const age = Date.now() - new Date(client.capturedAt).getTime();
      if (age > TTL_MS) {
        await chrome.storage.session.remove(CLIENT_STORAGE_KEY);
        console.log("[ZSP] Auto-cleared expired client data from session storage");
      }
    }
    if (pendingDraft?.createdAt) {
      const age = Date.now() - new Date(pendingDraft.createdAt).getTime();
      if (age > TTL_MS) {
        await chrome.storage.session.remove(PENDING_VOB_KEY);
        console.log("[ZSP] Auto-cleared expired pending VOB draft");
      }
    }
  }
  async function initializeSecureStorage() {
    await configureSessionStorageAccess();
    await migrateLegacyClientStorage();
    await cleanupExpiredData();
  }
  chrome.runtime.onInstalled.addListener(() => {
    console.log("[ZSP] Extension installed");
    initializeSecureStorage();
    chrome.alarms.create("phi-cleanup", { periodInMinutes: 60 });
  });
  chrome.runtime.onStartup.addListener(() => {
    initializeSecureStorage();
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "phi-cleanup") {
      cleanupExpiredData();
    }
  });
  void initializeSecureStorage();
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_CLIENT") {
      chrome.storage.session.get(CLIENT_STORAGE_KEY, (result) => {
        sendResponse(result[CLIENT_STORAGE_KEY] ?? null);
      });
      return true;
    }
  });
})();
//# sourceMappingURL=service-worker.js.map
