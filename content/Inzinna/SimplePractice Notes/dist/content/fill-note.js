"use strict";
(() => {
  // src/lib/types.ts
  var DEFAULT_NOTE_STATUS = {
    intakeCaptured: false,
    noteGenerated: false,
    noteReviewed: false,
    noteSubmitted: false
  };
  var EMPTY_PROGRESS_NOTE = {
    clientName: "",
    sessionDate: "",
    sessionType: "",
    cptCode: "",
    duration: "",
    chiefComplaint: "",
    presentingComplaint: "",
    mentalStatusExam: {
      appearance: "",
      behavior: "",
      speech: "",
      mood: "",
      affect: "",
      thoughtProcess: "",
      thoughtContent: "",
      perceptions: "",
      cognition: "",
      insight: "",
      judgment: ""
    },
    diagnosticImpressions: [],
    clinicalFormulation: "",
    treatmentPlan: {
      goals: [],
      interventions: [],
      frequency: "",
      referrals: ""
    },
    plan: "",
    generatedAt: "",
    status: { ...DEFAULT_NOTE_STATUS }
  };

  // src/lib/storage.ts
  var NOTE_KEY = "spn_note";
  async function saveNote(note) {
    await chrome.storage.session.set({ [NOTE_KEY]: note });
  }
  async function getNote() {
    const result = await chrome.storage.session.get(NOTE_KEY);
    return result[NOTE_KEY] ?? null;
  }
  async function updateNoteStatus(updates) {
    const note = await getNote();
    if (!note) return;
    note.status = { ...note.status, ...updates };
    await saveNote(note);
  }

  // src/content/shared.ts
  function injectButton(label, onClick, options) {
    const id = options?.id ?? "spn-action-btn";
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const btn = document.createElement("button");
    btn.id = id;
    btn.textContent = label;
    btn.className = "spn-floating-btn";
    if (options?.position === "bottom-right-high") {
      btn.style.bottom = "90px";
    } else if (options?.position === "bottom-left") {
      btn.style.right = "auto";
      btn.style.left = "20px";
    } else if (options?.position === "bottom-left-high") {
      btn.style.right = "auto";
      btn.style.left = "20px";
      btn.style.bottom = "70px";
    }
    btn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
    }, true);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      onClick();
    }, true);
    document.body.appendChild(btn);
    return btn;
  }
  function showToast(message, type = "success") {
    const existing = document.getElementById("spn-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "spn-toast";
    toast.className = `spn-toast spn-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("spn-toast-hide");
      setTimeout(() => toast.remove(), 300);
    }, 3e3);
  }
  function assertExtensionContext() {
    if (typeof chrome === "undefined" || !chrome.runtime?.id || !chrome.storage || !chrome.storage.session && !chrome.storage.local) {
      throw new Error("Extension context invalidated.");
    }
  }
  function isExtensionContextInvalidatedError(err) {
    if (!(err instanceof Error)) return false;
    return /Extension context invalidated|Cannot read properties of undefined/i.test(err.message);
  }
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
  function selectOptionByText(selector, text, root = document) {
    const select = root.querySelector(selector);
    if (!select || !text) return false;
    const lowerText = text.toLowerCase();
    for (const option of Array.from(select.options)) {
      if (option.text.toLowerCase().includes(lowerText)) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  }
  function normalizedText(value) {
    return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function isVisible(el) {
    return !(el instanceof HTMLElement) || el.offsetParent !== null || el.getClientRects().length > 0;
  }
  function findFieldContainer(labelText) {
    const target = normalizedText(labelText);
    const labels = document.querySelectorAll('label, .form-label, .field-label, .spds-label, [class*="label"]');
    for (const label of Array.from(labels)) {
      if (!normalizedText(label.textContent).includes(target)) continue;
      const container = label.closest('.form-group, .field-wrapper, [class*="field"], [class*="row"], [class*="group"]') ?? label.parentElement ?? label.nextElementSibling?.parentElement;
      if (container instanceof HTMLElement) {
        return container;
      }
    }
    return null;
  }

  // src/content/fill-note.ts
  function isNotePage() {
    return /\/clients\/\d+\/(notes|appointments)/.test(window.location.pathname) || /\/clients\/\d+\/treatment_plans/.test(window.location.pathname);
  }
  function fillByLabel(labelText, value) {
    if (!value) return false;
    const container = findFieldContainer(labelText);
    if (!container) return false;
    const input = container.querySelector('input:not([type="checkbox"]):not([type="radio"]), textarea');
    if (input && isVisible(input)) {
      return fillTextLikeField(input, value);
    }
    const editable = container.querySelector('[contenteditable="true"]');
    if (editable && isVisible(editable)) {
      return fillContentEditableField(editable, value);
    }
    return false;
  }
  function fillRichTextField(selectors, value) {
    if (!value) return false;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el || !isVisible(el)) continue;
      if (el.getAttribute("contenteditable") === "true") {
        return fillContentEditableField(el, value);
      }
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        return fillTextLikeField(el, value);
      }
    }
    return false;
  }
  function formatMSE(mse) {
    const parts = [];
    if (mse.appearance) parts.push(`Appearance: ${mse.appearance}`);
    if (mse.behavior) parts.push(`Behavior: ${mse.behavior}`);
    if (mse.speech) parts.push(`Speech: ${mse.speech}`);
    if (mse.mood) parts.push(`Mood: ${mse.mood}`);
    if (mse.affect) parts.push(`Affect: ${mse.affect}`);
    if (mse.thoughtProcess) parts.push(`Thought Process: ${mse.thoughtProcess}`);
    if (mse.thoughtContent) parts.push(`Thought Content: ${mse.thoughtContent}`);
    if (mse.perceptions) parts.push(`Perceptions: ${mse.perceptions}`);
    if (mse.cognition) parts.push(`Cognition: ${mse.cognition}`);
    if (mse.insight) parts.push(`Insight: ${mse.insight}`);
    if (mse.judgment) parts.push(`Judgment: ${mse.judgment}`);
    return parts.join("\n");
  }
  function formatDiagnosticImpressions(impressions) {
    if (!impressions.length) return "";
    return impressions.map((dx, i) => {
      const lines = [`${i + 1}. ${dx.name} (${dx.code})`];
      if (dx.criteriaEvidence.length) {
        lines.push(`   Evidence: ${dx.criteriaEvidence.join("; ")}`);
      }
      if (dx.ruleOuts.length) {
        lines.push(`   Rule-outs: ${dx.ruleOuts.join(", ")}`);
      }
      return lines.join("\n");
    }).join("\n\n");
  }
  function formatTreatmentPlan(plan) {
    const parts = [];
    if (plan.goals.length) {
      parts.push("Goals:");
      plan.goals.forEach((g, i) => parts.push(`  ${i + 1}. ${g}`));
    }
    if (plan.interventions.length) {
      parts.push("Interventions:");
      plan.interventions.forEach((iv, i) => parts.push(`  ${i + 1}. ${iv}`));
    }
    if (plan.frequency) parts.push(`Frequency: ${plan.frequency}`);
    if (plan.referrals) parts.push(`Referrals: ${plan.referrals}`);
    return parts.join("\n");
  }
  function buildFullNoteText(note) {
    const sections = [];
    sections.push(`CLIENT: ${note.clientName}`);
    sections.push(`DATE: ${note.sessionDate}`);
    sections.push(`SESSION TYPE: ${note.sessionType}`);
    if (note.cptCode) sections.push(`CPT: ${note.cptCode}`);
    if (note.duration) sections.push(`DURATION: ${note.duration}`);
    sections.push("");
    if (note.chiefComplaint) {
      sections.push("CHIEF COMPLAINT");
      sections.push(note.chiefComplaint);
      sections.push("");
    }
    if (note.presentingComplaint) {
      sections.push("PRESENTING COMPLAINT");
      sections.push(note.presentingComplaint);
      sections.push("");
    }
    const mseText = formatMSE(note.mentalStatusExam);
    if (mseText) {
      sections.push("MENTAL STATUS EXAM");
      sections.push(mseText);
      sections.push("");
    }
    const dxText = formatDiagnosticImpressions(note.diagnosticImpressions);
    if (dxText) {
      sections.push("DIAGNOSTIC IMPRESSIONS");
      sections.push(dxText);
      sections.push("");
    }
    if (note.clinicalFormulation) {
      sections.push("CLINICAL FORMULATION");
      sections.push(note.clinicalFormulation);
      sections.push("");
    }
    const txPlan = formatTreatmentPlan(note.treatmentPlan);
    if (txPlan) {
      sections.push("TREATMENT PLAN");
      sections.push(txPlan);
      sections.push("");
    }
    if (note.plan) {
      sections.push("PLAN / NEXT STEPS");
      sections.push(note.plan);
    }
    return sections.join("\n");
  }
  async function fillProgressNote() {
    assertExtensionContext();
    const note = await getNote();
    if (!note) {
      showToast("No note data available. Generate a note first.", "error");
      return;
    }
    let filled = 0;
    if (fillByLabel("chief complaint", note.chiefComplaint)) filled++;
    if (fillByLabel("presenting complaint", note.presentingComplaint) || fillByLabel("presenting problem", note.presentingComplaint)) filled++;
    const mse = note.mentalStatusExam;
    if (fillByLabel("appearance", mse.appearance)) filled++;
    if (fillByLabel("behavior", mse.behavior)) filled++;
    if (fillByLabel("speech", mse.speech)) filled++;
    if (fillByLabel("mood", mse.mood)) filled++;
    if (fillByLabel("affect", mse.affect)) filled++;
    if (fillByLabel("thought process", mse.thoughtProcess)) filled++;
    if (fillByLabel("thought content", mse.thoughtContent)) filled++;
    if (fillByLabel("perceptions", mse.perceptions)) filled++;
    if (fillByLabel("cognition", mse.cognition)) filled++;
    if (fillByLabel("insight", mse.insight)) filled++;
    if (fillByLabel("judgment", mse.judgment)) filled++;
    if (filled === 0) {
      const mseText = formatMSE(mse);
      if (fillByLabel("mental status", mseText) || fillByLabel("mental status exam", mseText) || fillByLabel("mse", mseText)) {
        filled++;
      }
    }
    const dxText = formatDiagnosticImpressions(note.diagnosticImpressions);
    if (fillByLabel("diagnostic impressions", dxText) || fillByLabel("diagnosis", dxText) || fillByLabel("assessment", dxText)) {
      filled++;
    }
    for (const dx of note.diagnosticImpressions) {
      if (fillByLabel("diagnosis code", dx.code) || fillByLabel("icd-10", dx.code) || fillByLabel("icd code", dx.code)) {
        filled++;
      }
    }
    if (fillByLabel("clinical formulation", note.clinicalFormulation) || fillByLabel("formulation", note.clinicalFormulation) || fillByLabel("case conceptualization", note.clinicalFormulation)) {
      filled++;
    }
    const txText = formatTreatmentPlan(note.treatmentPlan);
    if (fillByLabel("treatment plan", txText) || fillByLabel("plan", txText)) {
      filled++;
    }
    if (fillByLabel("plan", note.plan) || fillByLabel("next steps", note.plan) || fillByLabel("follow-up", note.plan) || fillByLabel("follow up", note.plan)) {
      filled++;
    }
    if (note.cptCode) {
      if (selectOptionByText('select[name*="cpt" i]', note.cptCode) || fillByLabel("cpt code", note.cptCode) || fillByLabel("service code", note.cptCode)) {
        filled++;
      }
    }
    if (note.duration) {
      if (fillByLabel("duration", note.duration) || fillByLabel("session length", note.duration)) {
        filled++;
      }
    }
    if (filled < 3) {
      const fullText = buildFullNoteText(note);
      const bodyFilled = fillRichTextField([
        '[contenteditable="true"].note-body',
        '[contenteditable="true"].ql-editor',
        '.note-content [contenteditable="true"]',
        'textarea[name*="note" i]',
        'textarea[name*="body" i]',
        'textarea[name*="content" i]',
        ".progress-note-body textarea",
        '[contenteditable="true"]'
      ], fullText);
      if (bodyFilled) filled += 10;
    }
    if (filled > 0) {
      await updateNoteStatus({ noteSubmitted: true });
      showToast(`Filled ${filled} note sections for ${note.clientName}`, "success");
    } else {
      showToast("Could not find note fields on this page. Make sure you are on a note editing page.", "error");
    }
    console.log("[SPN] Filled progress note:", { filled, clientName: note.clientName });
  }
  async function handleFillClick() {
    try {
      await fillProgressNote();
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        showToast("Extension reloaded \u2014 please refresh this page.", "error");
      } else {
        console.error("[SPN] Fill note error:", err);
        showToast("Failed to fill note.", "error");
      }
    }
  }
  function injectFillButton() {
    if (!isNotePage()) return;
    if (document.getElementById("spn-fill-btn")) return;
    getNote().then((note) => {
      if (!note) return;
      injectButton("Fill Note", handleFillClick, {
        id: "spn-fill-btn",
        position: "bottom-left"
      });
    }).catch(() => {
    });
  }
  var lastUrl = window.location.href;
  var observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(injectFillButton, 500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(injectFillButton, 500));
  } else {
    setTimeout(injectFillButton, 500);
  }
})();
//# sourceMappingURL=fill-note.js.map
