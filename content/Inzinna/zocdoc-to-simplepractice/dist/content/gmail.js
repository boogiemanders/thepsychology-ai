"use strict";
(() => {
  // src/lib/storage.ts
  var PENDING_VOB_KEY = "pendingVobDraft";
  async function getPendingVobDraft() {
    const result = await chrome.storage.session.get(PENDING_VOB_KEY);
    return result[PENDING_VOB_KEY] ?? null;
  }
  async function clearPendingVobDraft() {
    await chrome.storage.session.remove(PENDING_VOB_KEY);
  }

  // src/content/shared.ts
  function fillTextLikeField(el, value) {
    if (!el || !value) return false;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    const setter = el instanceof HTMLTextAreaElement ? nativeTextAreaValueSetter : nativeInputValueSetter;
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }
  function fillContentEditableField(el, value) {
    if (!el || !value) return false;
    el.focus();
    el.innerHTML = "";
    const lines = value.replace(/\r\n/g, "\n").split("\n");
    for (const line of lines) {
      const block = document.createElement("div");
      if (line.length === 0) {
        block.appendChild(document.createElement("br"));
      } else {
        block.textContent = line;
      }
      el.appendChild(block);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }

  // src/content/gmail.ts
  function isVisible(el) {
    return !(el instanceof HTMLElement) || el.offsetParent !== null || el.getClientRects().length > 0;
  }
  function getVisibleElement(selector) {
    const visible = Array.from(document.querySelectorAll(selector)).find(isVisible);
    return visible ?? document.querySelector(selector);
  }
  var applyingDraft = false;
  var appliedDraftAt = "";
  async function applyPendingDraft() {
    if (applyingDraft) return;
    applyingDraft = true;
    try {
      const draft = await getPendingVobDraft();
      if (!draft || draft.createdAt === appliedDraftAt) return;
      const subjectInput = getVisibleElement('input[name="subjectbox"]');
      const bodyField = getVisibleElement(
        'div[aria-label="Message Body"][contenteditable="true"], div[role="textbox"][aria-label="Message Body"][contenteditable="true"]'
      );
      if (!subjectInput || !bodyField) return;
      const subjectFilled = fillTextLikeField(subjectInput, draft.subject);
      const bodyFilled = fillContentEditableField(bodyField, draft.body);
      if (!subjectFilled || !bodyFilled) return;
      appliedDraftAt = draft.createdAt;
      await clearPendingVobDraft();
      console.log("[ZSP] Filled Gmail compose from pending VOB draft");
    } finally {
      applyingDraft = false;
    }
  }
  function watchForCompose() {
    const observer = new MutationObserver(() => {
      void applyPendingDraft();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        void applyPendingDraft();
        watchForCompose();
      });
    } else {
      void applyPendingDraft();
      watchForCompose();
    }
  }
  init();
})();
//# sourceMappingURL=gmail.js.map
