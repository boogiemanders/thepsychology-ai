"use strict";
(() => {
  // src/background/service-worker.ts
  var INTAKE_KEY = "spn_intake";
  var NOTE_KEY = "spn_note";
  var DIAGNOSTIC_WORKSPACE_KEY = "spn_diagnostic_workspace";
  var SESSION_NOTES_KEY = "spn_session_notes";
  var TREATMENT_PLAN_KEY = "spn_treatment_plan";
  var SOAP_DRAFT_KEY = "spn_soap_draft";
  var TRANSCRIPT_KEY = "spn_transcript";
  var TTL_MS = 60 * 60 * 1e3;
  var runtimeApi = globalThis.chrome?.runtime;
  var alarmsApi = globalThis.chrome?.alarms;
  var sessionStorageApi = globalThis.chrome?.storage?.session;
  function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
  }
  function isTransientSessionStorageError(error) {
    const message = getErrorMessage(error);
    return /\bNo SW\b|Extension context invalidated/i.test(message);
  }
  async function configureSessionStorageAccess() {
    if (!sessionStorageApi?.setAccessLevel) return;
    try {
      await sessionStorageApi.setAccessLevel({
        accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"
      });
    } catch (error) {
      if (isTransientSessionStorageError(error)) {
        console.info("[SPN] Skipping session storage access-level setup during transient worker startup:", getErrorMessage(error));
        return;
      }
      throw error;
    }
  }
  async function cleanupExpiredData() {
    if (!sessionStorageApi) return;
    try {
      const result = await sessionStorageApi.get([
        INTAKE_KEY,
        NOTE_KEY,
        DIAGNOSTIC_WORKSPACE_KEY,
        SESSION_NOTES_KEY,
        TREATMENT_PLAN_KEY,
        SOAP_DRAFT_KEY,
        TRANSCRIPT_KEY
      ]);
      const intake = result[INTAKE_KEY];
      if (intake?.capturedAt) {
        const age = Date.now() - new Date(intake.capturedAt).getTime();
        if (age > TTL_MS) {
          await sessionStorageApi.remove(INTAKE_KEY);
          console.log("[SPN] Auto-cleared expired intake data");
        }
      }
      const note = result[NOTE_KEY];
      if (note?.generatedAt) {
        const age = Date.now() - new Date(note.generatedAt).getTime();
        if (age > TTL_MS) {
          await sessionStorageApi.remove(NOTE_KEY);
          console.log("[SPN] Auto-cleared expired note data");
        }
      }
      const workspace = result[DIAGNOSTIC_WORKSPACE_KEY];
      if (workspace?.updatedAt) {
        const age = Date.now() - new Date(workspace.updatedAt).getTime();
        if (age > TTL_MS) {
          await sessionStorageApi.remove(DIAGNOSTIC_WORKSPACE_KEY);
          console.log("[SPN] Auto-cleared expired diagnostic workspace");
        }
      }
      const sessionNotes = result[SESSION_NOTES_KEY];
      if (sessionNotes?.updatedAt) {
        const age = Date.now() - new Date(sessionNotes.updatedAt).getTime();
        if (age > TTL_MS) {
          await sessionStorageApi.remove(SESSION_NOTES_KEY);
          console.log("[SPN] Auto-cleared expired session notes");
        }
      }
      const treatmentPlan = result[TREATMENT_PLAN_KEY];
      if (treatmentPlan?.capturedAt) {
        const age = Date.now() - new Date(treatmentPlan.capturedAt).getTime();
        if (age > TTL_MS) {
          await sessionStorageApi.remove(TREATMENT_PLAN_KEY);
          console.log("[SPN] Auto-cleared expired treatment plan");
        }
      }
      const soapDraft = result[SOAP_DRAFT_KEY];
      if (soapDraft?.generatedAt) {
        const age = Date.now() - new Date(soapDraft.generatedAt).getTime();
        if (age > TTL_MS) {
          await sessionStorageApi.remove(SOAP_DRAFT_KEY);
          console.log("[SPN] Auto-cleared expired SOAP draft");
        }
      }
      const transcript = result[TRANSCRIPT_KEY];
      if (transcript?.updatedAt) {
        const age = Date.now() - new Date(transcript.updatedAt).getTime();
        if (age > TTL_MS) {
          await sessionStorageApi.remove(TRANSCRIPT_KEY);
          console.log("[SPN] Auto-cleared expired transcript");
        }
      }
    } catch (error) {
      if (isTransientSessionStorageError(error)) {
        console.info("[SPN] Skipping startup PHI cleanup during transient worker startup:", getErrorMessage(error));
        return;
      }
      throw error;
    }
  }
  async function initialize() {
    try {
      await configureSessionStorageAccess();
      await cleanupExpiredData();
    } catch (error) {
      if (isTransientSessionStorageError(error)) {
        console.info("[SPN] Initialization skipped \u2014 service worker not fully ready:", getErrorMessage(error));
        return;
      }
      console.error("[SPN] Initialization failed:", error);
    }
  }
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function waitForTabComplete(tabId, timeoutMs = 15e3) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        reject(new Error(`Timed out waiting for tab ${tabId}`));
      }, timeoutMs);
      const finish = () => {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      };
      const onUpdated = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
          finish();
        }
      };
      chrome.tabs.onUpdated.addListener(onUpdated);
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) return;
        if (tab.status === "complete") finish();
      });
    });
  }
  async function sendMessageToTabWithRetries(tabId, message, retries = 8) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, message);
        if (response) return response;
      } catch {
      }
      await wait(500);
    }
    return null;
  }
  async function discoverIntakeNoteUrlsViaTab(clientId) {
    const url = `https://secure.simplepractice.com/clients/${clientId}/intake_notes`;
    const tab = await chrome.tabs.create({ url, active: false });
    if (!tab.id) return [];
    try {
      await waitForTabComplete(tab.id);
      await wait(1500);
      const response = await sendMessageToTabWithRetries(tab.id, {
        type: "SPN_COLLECT_INTAKE_NOTE_URLS",
        clientId
      });
      return Array.isArray(response?.urls) ? response.urls : [];
    } catch (err) {
      console.warn("[SPN] Background-tab intake-note discovery failed:", err);
      return [];
    } finally {
      try {
        await chrome.tabs.remove(tab.id);
      } catch {
      }
    }
  }
  async function fetchIntakeViaTab(url) {
    const tab = await chrome.tabs.create({ url, active: false });
    if (!tab.id) return { intake: null };
    try {
      await waitForTabComplete(tab.id);
      const deadline = Date.now() + 15e3;
      while (Date.now() < deadline) {
        const response = await sendMessageToTabWithRetries(tab.id, {
          type: "SPN_EXTRACT_INTAKE"
        }, 3);
        if (response?.intake) {
          return response;
        }
        await wait(750);
      }
      console.log("[SPN] Timed out waiting for rendered intake form in background tab:", url);
      return { intake: null };
    } catch (err) {
      console.warn("[SPN] Background-tab intake extraction failed:", err);
      return { intake: null };
    } finally {
      try {
        await chrome.tabs.remove(tab.id);
      } catch {
      }
    }
  }
  async function fetchAssessmentViaTab(url) {
    const tab = await chrome.tabs.create({ url, active: false });
    if (!tab.id) return { type: null, assessment: null };
    try {
      await waitForTabComplete(tab.id);
      const deadline = Date.now() + 15e3;
      while (Date.now() < deadline) {
        const response = await sendMessageToTabWithRetries(tab.id, {
          type: "SPN_EXTRACT_ASSESSMENT"
        }, 3);
        if (response?.type && response.assessment) {
          return response;
        }
        await wait(750);
      }
      console.log("[SPN] Timed out waiting for rendered assessment in background tab:", url);
      return { type: null, assessment: null };
    } catch (err) {
      console.warn("[SPN] Background-tab assessment extraction failed:", err);
      return { type: null, assessment: null };
    } finally {
      try {
        await chrome.tabs.remove(tab.id);
      } catch {
      }
    }
  }
  async function syncBooleanFieldsInPageWorld(tabId, operations) {
    if (operations.length === 0) {
      return { applied: 0 };
    }
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      args: [operations],
      func: async (ops) => {
        const waitFor = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
        const setCheckedState = (input, checked) => {
          const nativeCheckedSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "checked"
          )?.set;
          if (nativeCheckedSetter) {
            nativeCheckedSetter.call(input, checked);
            return;
          }
          input.checked = checked;
        };
        const dispatchBooleanEvents = (input) => {
          input.focus();
          if ("PointerEvent" in window) {
            input.dispatchEvent(new PointerEvent("pointerdown", {
              bubbles: true,
              cancelable: true,
              composed: true,
              pointerId: 1,
              pointerType: "mouse",
              isPrimary: true,
              button: 0,
              buttons: 1
            }));
          }
          input.dispatchEvent(new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            composed: true,
            button: 0,
            buttons: 1,
            view: window
          }));
          if ("PointerEvent" in window) {
            input.dispatchEvent(new PointerEvent("pointerup", {
              bubbles: true,
              cancelable: true,
              composed: true,
              pointerId: 1,
              pointerType: "mouse",
              isPrimary: true,
              button: 0,
              buttons: 0
            }));
          }
          input.dispatchEvent(new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            composed: true,
            button: 0,
            buttons: 0,
            view: window
          }));
          input.dispatchEvent(new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            composed: true,
            button: 0,
            buttons: 0,
            view: window
          }));
          input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
          input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
          input.dispatchEvent(new FocusEvent("blur", { composed: true }));
          input.dispatchEvent(new FocusEvent("focusout", { bubbles: true, composed: true }));
        };
        const findCheckbox = (name) => {
          for (const input of Array.from(document.querySelectorAll('input[type="checkbox"]'))) {
            if (input instanceof HTMLInputElement && input.name === name) {
              return input;
            }
          }
          return null;
        };
        const findRadio = (name, value) => {
          for (const input of Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`))) {
            if (input instanceof HTMLInputElement && input.value === value) {
              return input;
            }
          }
          return null;
        };
        let applied = 0;
        for (const operation of ops) {
          const input = operation.kind === "checkbox" ? findCheckbox(operation.name) : findRadio(operation.name, operation.value);
          if (!input) continue;
          setCheckedState(input, true);
          dispatchBooleanEvents(input);
          if (input.checked) {
            applied += 1;
          }
          await waitFor(20);
        }
        return { applied };
      }
    });
    return { applied: result?.result?.applied ?? 0 };
  }
  runtimeApi?.onInstalled?.addListener(() => {
    console.log("[SPN] SimplePractice Notes extension installed");
    void initialize();
    alarmsApi?.create?.("phi-cleanup", { periodInMinutes: 60 });
  });
  runtimeApi?.onStartup?.addListener(() => {
    void initialize();
  });
  alarmsApi?.onAlarm?.addListener((alarm) => {
    if (alarm.name === "phi-cleanup") {
      void cleanupExpiredData();
    }
  });
  if (sessionStorageApi) {
    void initialize();
  }
  var DEV_RELOAD = false;
  if (DEV_RELOAD) {
    let lastModified = 0;
    const checkForChanges = async () => {
      try {
        const url = chrome.runtime.getURL("content/fill-note.js");
        const resp = await fetch(url, { cache: "no-store" });
        const text = await resp.text();
        const hash = text.length;
        if (lastModified && hash !== lastModified) {
          console.log("[SPN] File change detected, reloading...");
          chrome.runtime.reload();
        }
        lastModified = hash;
      } catch {
      }
    };
    setInterval(checkForChanges, 1e3);
  }
  runtimeApi?.onMessage?.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_INTAKE") {
      chrome.storage.session.get(INTAKE_KEY, (result) => {
        sendResponse(result[INTAKE_KEY] ?? null);
      });
      return true;
    }
    if (message.type === "GET_NOTE") {
      chrome.storage.session.get(NOTE_KEY, (result) => {
        sendResponse(result[NOTE_KEY] ?? null);
      });
      return true;
    }
    if (message.type === "GET_DIAGNOSTIC_WORKSPACE") {
      chrome.storage.session.get(DIAGNOSTIC_WORKSPACE_KEY, (result) => {
        sendResponse(result[DIAGNOSTIC_WORKSPACE_KEY] ?? null);
      });
      return true;
    }
    if (message.type === "CLEAR_ALL") {
      chrome.storage.session.remove([
        INTAKE_KEY,
        NOTE_KEY,
        DIAGNOSTIC_WORKSPACE_KEY,
        SESSION_NOTES_KEY,
        TREATMENT_PLAN_KEY,
        SOAP_DRAFT_KEY,
        TRANSCRIPT_KEY
      ], () => {
        sendResponse({ ok: true });
      });
      return true;
    }
    if (message.type === "SPN_FETCH_INTAKE_VIA_TAB") {
      fetchIntakeViaTab(message.url).then((result) => sendResponse(result)).catch(() => sendResponse({ intake: null }));
      return true;
    }
    if (message.type === "SPN_FETCH_ASSESSMENT_VIA_TAB") {
      fetchAssessmentViaTab(message.url).then((result) => sendResponse(result)).catch(() => sendResponse({ type: null, assessment: null }));
      return true;
    }
    if (message.type === "SPN_DISCOVER_INTAKE_NOTE_URLS") {
      discoverIntakeNoteUrlsViaTab(message.clientId).then((urls) => sendResponse({ urls })).catch(() => sendResponse({ urls: [] }));
      return true;
    }
    if (message.type === "SPN_SYNC_BOOLEAN_FIELDS") {
      const tabId = sender.tab?.id;
      const operations = Array.isArray(message.operations) ? message.operations : [];
      if (!tabId) {
        sendResponse({ ok: false, error: "No sender tab available for boolean sync." });
        return false;
      }
      syncBooleanFieldsInPageWorld(tabId, operations).then(({ applied }) => sendResponse({ ok: true, applied })).catch((error) => {
        const messageText = error instanceof Error ? error.message : String(error);
        console.warn("[SPN] Boolean field sync failed:", error);
        sendResponse({ ok: false, error: messageText });
      });
      return true;
    }
  });
})();
//# sourceMappingURL=service-worker.js.map
