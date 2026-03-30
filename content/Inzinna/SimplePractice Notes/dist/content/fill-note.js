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
  var INTAKE_KEY = "spn_intake";
  async function getIntake() {
    const result = await chrome.storage.session.get(INTAKE_KEY);
    return result[INTAKE_KEY] ?? null;
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
      btn.style.bottom = "150px";
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
  function checkCheckboxByLabel(groupName, labelText) {
    if (!labelText) return false;
    const target = labelText.toLowerCase().trim();
    const checkboxes = document.querySelectorAll(`input[name^="${groupName}"][type="checkbox"]`);
    for (const cb of Array.from(checkboxes)) {
      const label = cb.closest("label");
      if (!label) continue;
      const text = label.textContent?.replace(label.querySelector("input")?.value ?? "", "").trim().toLowerCase() ?? "";
      if (text === target || text.includes(target) || target.includes(text)) {
        if (!cb.checked) {
          cb.click();
          cb.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return true;
      }
    }
    return false;
  }
  function selectRadio(name, valueOrLabel) {
    if (!valueOrLabel) return false;
    const target = valueOrLabel.toLowerCase().trim();
    const radios = document.querySelectorAll(`input[name="${name}"][type="radio"]`);
    for (const radio of Array.from(radios)) {
      if (radio.value === valueOrLabel) {
        radio.click();
        radio.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      const label = radio.closest("label");
      const labelText = label?.textContent?.trim().toLowerCase() ?? "";
      if (labelText === target || labelText.includes(target)) {
        radio.click();
        radio.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  }
  function selectYesNo(name, answer) {
    if (!answer) return false;
    const lower = answer.toLowerCase().trim();
    const isYes = /^(yes|true|1|positive|confirmed|endorsed|reported)/.test(lower);
    const isNo = /^(no|false|0|negative|denied|denies|none|n\/a)/.test(lower);
    if (isYes) return selectRadio(name, "1");
    if (isNo) return selectRadio(name, "2");
    return false;
  }
  function fillProseMirrorByLabel(ariaLabel, value) {
    if (!value) return false;
    const el = document.querySelector(`[contenteditable="true"][aria-label="${ariaLabel}"]`);
    return fillContentEditableField(el, value);
  }
  function selectDropdownById(id, text) {
    if (!text) return false;
    const select = document.getElementById(id);
    if (!select) return false;
    const lowerText = text.toLowerCase().trim();
    for (const option of Array.from(select.options)) {
      if (option.text.trim().toLowerCase().includes(lowerText) || option.value.toLowerCase().includes(lowerText)) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  }
  var wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  // src/content/fill-note.ts
  function isNotePage() {
    return /\/appointments\/\d+/.test(window.location.pathname) || /\/clients\/\d+\/(notes|appointments)/.test(window.location.pathname) || /\/clients\/\d+\/treatment_plans/.test(window.location.pathname);
  }
  function fillICEFromIntake(intake) {
    let filled = 0;
    const dateInput = document.querySelector("#date-1");
    if (dateInput && intake.formDate) {
      if (fillTextLikeField(dateInput, intake.formDate)) filled++;
    }
    if (checkCheckboxByLabel("multi-select-5", "Patient")) filled++;
    if (fillProseMirrorByLabel("free-text-6", intake.chiefComplaint)) filled++;
    if (fillProseMirrorByLabel("free-text-7", intake.historyOfPresentIllness || intake.presentingProblems)) filled++;
    filled += fillSymptomChecklistsFromIntake(intake);
    if (selectYesNo("single-select-25", intake.psychiatricHospitalization)) filled++;
    if (selectYesNo("single-select-26", intake.priorTreatment)) filled++;
    if (selectYesNo("single-select-27", intake.suicideAttemptHistory)) filled++;
    if (fillProseMirrorByLabel("free-text-31", intake.medications)) filled++;
    if (fillProseMirrorByLabel("free-text-34", intake.medications)) filled++;
    const hasSubstanceUse = intake.alcoholUse || intake.drugUse || intake.substanceUseHistory;
    if (hasSubstanceUse) {
      const isUsing = /yes|current|daily|weekly|monthly|regular|social|occasional/i.test(
        `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory}`
      );
      if (selectRadio("single-select-35", isUsing ? "1" : "2")) filled++;
      if (isUsing) {
        filled += fillSubstanceCheckboxes(intake);
      }
    }
    if (intake.medicalHistory) {
      const hasMedical = !/none|no|denied|denies/i.test(intake.medicalHistory);
      if (selectRadio("single-select-39", hasMedical ? "1" : "2")) filled++;
    }
    if (intake.physicalSexualAbuseHistory || intake.domesticViolenceHistory) {
      const hasTrauma = !/none|no|denied|denies/i.test(
        `${intake.physicalSexualAbuseHistory} ${intake.domesticViolenceHistory}`
      );
      if (selectRadio("single-select-47", hasTrauma ? "1" : "2")) filled++;
    }
    if (intake.maritalStatus) {
      filled += fillMaritalStatus(intake.maritalStatus);
    }
    if (intake.livingArrangement) {
      filled += fillLivingArrangements(intake.livingArrangement);
    }
    if (intake.occupation) {
      filled += fillEmployment(intake.occupation);
    }
    if (intake.education) {
      filled += fillEducation(intake.education);
    }
    const socialNotes = buildSocialHistoryNotes(intake);
    if (fillProseMirrorByLabel("free-text-53", socialNotes)) filled++;
    if (intake.domesticViolenceHistory) {
      const hasDV = !/none|no|denied|denies/i.test(intake.domesticViolenceHistory);
      if (selectRadio("single-select-56", hasDV ? "1" : "2")) filled++;
    }
    if (intake.familyPsychiatricHistory || intake.familyMentalEmotionalHistory) {
      const hasFamilyMH = !/none|no|denied|denies/i.test(
        `${intake.familyPsychiatricHistory} ${intake.familyMentalEmotionalHistory}`
      );
      if (selectRadio("single-select-57", hasFamilyMH ? "1" : "2")) filled++;
    }
    const familyNotes = [intake.familyPsychiatricHistory, intake.familyMentalEmotionalHistory].filter(Boolean).join("\n");
    if (fillProseMirrorByLabel("free-text-60", familyNotes)) filled++;
    if (intake.suicidalIdeation) {
      if (selectDropdownById("dropdown-86", mapSIToDropdown(intake.suicidalIdeation))) filled++;
    }
    if (intake.homicidalIdeation) {
      if (selectDropdownById("dropdown-87", mapHIToDropdown(intake.homicidalIdeation))) filled++;
    }
    return filled;
  }
  function fillSymptomChecklistsFromIntake(intake) {
    let filled = 0;
    const symptoms = `${intake.recentSymptoms} ${intake.additionalSymptoms}`.toLowerCase();
    if (!symptoms.trim()) return 0;
    const depressionMap = {
      "crying": "Frequent crying",
      "sad": "Feeling sad, empty, or down",
      "energy": "Loss of energy",
      "fatigue": "Fatigue",
      "interest": "Loss of interest",
      "enjoyment": "Loss of enjoyment",
      "hopeless": "Hopelessness",
      "helpless": "Helplessness",
      "worthless": "Worthlessness",
      "concentrat": "Difficulty concentrating",
      "suicid": "Recurrent suicidal ideation",
      "death": "Recurrent thoughts about death/dying",
      "insomnia": "Insomnia",
      "hypersomnia": "Hypersomnia",
      "appetite": "Loss of appetite (without weight loss)",
      "withdrawal": "Social withdrawal, agitation"
    };
    for (const [keyword, label] of Object.entries(depressionMap)) {
      if (symptoms.includes(keyword)) {
        if (checkCheckboxByLabel("multi-select-9", label)) filled++;
      }
    }
    const anxietyMap = {
      "worry": "Excessive worry",
      "distract": "Distractibility",
      "sleep": "Difficulty falling or staying asleep",
      "restless": "Restlessness",
      "edge": "Feeling on edge or tense",
      "tense": "Feeling on edge or tense"
    };
    for (const [keyword, label] of Object.entries(anxietyMap)) {
      if (symptoms.includes(keyword)) {
        if (checkCheckboxByLabel("multi-select-10", label)) filled++;
      }
    }
    if (intake.physicalSexualAbuseHistory) {
      const abuse = intake.physicalSexualAbuseHistory.toLowerCase();
      if (/physical/i.test(abuse)) {
        if (checkCheckboxByLabel("multi-select-20", "Physical")) filled++;
      }
      if (/sexual/i.test(abuse)) {
        if (checkCheckboxByLabel("multi-select-20", "Sexual")) filled++;
      }
      if (/emotional/i.test(abuse)) {
        if (checkCheckboxByLabel("multi-select-20", "Emotional")) filled++;
      }
      if (/neglect/i.test(abuse)) {
        if (checkCheckboxByLabel("multi-select-20", "Neglect")) filled++;
      }
      if (/none|no|denied|denies/i.test(abuse)) {
        if (checkCheckboxByLabel("multi-select-20", "Denies")) filled++;
      }
    }
    if (intake.suicideAttemptHistory && !/no|denied|denies|none/i.test(intake.suicideAttemptHistory)) {
      if (checkCheckboxByLabel("multi-select-21", "History of suicide attempt")) filled++;
    }
    if (intake.substanceUseHistory && !/no|denied|denies|none/i.test(intake.substanceUseHistory)) {
      if (checkCheckboxByLabel("multi-select-21", "History of substance abuse")) filled++;
    }
    if (intake.physicalSexualAbuseHistory && !/no|denied|denies|none/i.test(intake.physicalSexualAbuseHistory)) {
      if (checkCheckboxByLabel("multi-select-21", "History of abuse")) filled++;
    }
    return filled;
  }
  function fillSubstanceCheckboxes(intake) {
    let filled = 0;
    const substance = `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory}`.toLowerCase();
    if (/alcohol/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Alcohol")) filled++;
    }
    if (/tobacco|nicotine|cigarette|vape/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Tobacco")) filled++;
    }
    if (/cannabis|marijuana|weed|thc/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Cannabis")) filled++;
    }
    if (/opioid|heroin|fentanyl|oxy/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Opioids")) filled++;
    }
    if (/cocaine|crack/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Cocaine")) filled++;
    }
    if (/amphetamine|meth|adderall/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Amphetamines")) filled++;
    }
    if (/hallucinogen|lsd|mushroom|psilocybin/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Hallucinogens")) filled++;
    }
    return filled;
  }
  function fillMaritalStatus(status) {
    const lower = status.toLowerCase();
    const map = {
      "married": "1",
      "domestic": "2",
      "divorced": "3",
      "widowed": "4",
      "single": "5"
    };
    for (const [keyword, value] of Object.entries(map)) {
      if (lower.includes(keyword)) {
        return selectRadio("single-select-48", value) ? 1 : 0;
      }
    }
    return selectRadio("single-select-48", "6") ? 1 : 0;
  }
  function fillLivingArrangements(living) {
    let filled = 0;
    const lower = living.toLowerCase();
    if (/alone/i.test(lower)) {
      if (checkCheckboxByLabel("multi-select-49", "Alone")) filled++;
    }
    if (/roommate/i.test(lower)) {
      if (checkCheckboxByLabel("multi-select-49", "With roommate")) filled++;
    }
    if (/family|parent|child|sibling/i.test(lower)) {
      if (checkCheckboxByLabel("multi-select-49", "With family")) filled++;
    }
    if (/spouse|husband|wife|partner/i.test(lower)) {
      if (checkCheckboxByLabel("multi-select-49", "With spouse")) filled++;
    }
    if (/group home/i.test(lower)) {
      if (checkCheckboxByLabel("multi-select-49", "Group home")) filled++;
    }
    return filled;
  }
  function fillEmployment(occupation) {
    let filled = 0;
    const lower = occupation.toLowerCase();
    if (/unemployed|not working|out of work/i.test(lower)) {
      if (checkCheckboxByLabel("multi-select-50", "Currently unemployed")) filled++;
    } else if (occupation.trim()) {
      if (checkCheckboxByLabel("multi-select-50", "Currently employed")) filled++;
    }
    return filled;
  }
  function fillEducation(education) {
    const lower = education.toLowerCase();
    const map = {
      "pre-school": "1",
      "preschool": "1",
      "elementary": "2",
      "middle": "3",
      "high school": "4",
      "hs": "4",
      "ged": "4",
      "associate": "5",
      "2-year": "5",
      "community college": "5",
      "bachelor": "6",
      "4-year": "6",
      "college": "6",
      "university": "6",
      "graduate": "7",
      "master": "7",
      "doctoral": "7",
      "phd": "7",
      "md": "7",
      "jd": "7"
    };
    for (const [keyword, value] of Object.entries(map)) {
      if (lower.includes(keyword)) {
        return selectRadio("single-select-51", value) ? 1 : 0;
      }
    }
    return 0;
  }
  function buildSocialHistoryNotes(intake) {
    const parts = [];
    if (intake.occupation) parts.push(`Occupation: ${intake.occupation}`);
    if (intake.relationshipDescription) parts.push(`Relationship: ${intake.relationshipDescription}`);
    if (intake.livingArrangement) parts.push(`Living arrangement: ${intake.livingArrangement}`);
    if (intake.additionalInfo) parts.push(intake.additionalInfo);
    return parts.join("\n");
  }
  function mapSIToDropdown(si) {
    const lower = si.toLowerCase();
    if (/no|denied|denies|none/i.test(lower)) return "Denies";
    if (/active.*plan.*intent/i.test(lower)) return "Active with plan with intent";
    if (/active.*plan/i.test(lower)) return "Active with plan but without intent";
    if (/passive.*plan/i.test(lower)) return "Passive with plan and without intent";
    if (/passive/i.test(lower)) return "Passive without plan or intent";
    return "Denies";
  }
  function mapHIToDropdown(hi) {
    const lower = hi.toLowerCase();
    if (/no|denied|denies|none/i.test(lower)) return "Denies";
    if (/active.*plan.*intent/i.test(lower)) return "Yes: Active with plan and with intent";
    if (/active.*plan/i.test(lower)) return "Yes: Active with plan but without intent";
    if (/passive.*plan/i.test(lower)) return "Yes: Passive with plan and without intent";
    if (/passive/i.test(lower)) return "Yes: Passive without plan or intent";
    if (/specific/i.test(lower)) return "Yes: Specific person";
    return "Denies";
  }
  async function fillInitialClinicalEval() {
    assertExtensionContext();
    const intake = await getIntake();
    if (!intake) {
      showToast(`No intake data captured. Go to the client's intake form and click "Capture Intake" first.`, "error");
      return;
    }
    await wait(500);
    const filled = fillICEFromIntake(intake);
    if (filled > 0) {
      showToast(`Filled ${filled} fields from intake data for ${intake.fullName || "client"}`, "success");
    } else {
      showToast("Could not fill any fields. Make sure you are on the Initial Clinical Evaluation note.", "error");
    }
    console.log("[SPN] Filled ICE from intake:", { filled, clientName: intake.fullName });
  }
  async function handleFillClick() {
    try {
      await fillInitialClinicalEval();
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
    getIntake().then((intake) => {
      if (!intake) return;
      injectButton("Fill from Intake", handleFillClick, {
        id: "spn-fill-btn",
        position: "bottom-left-high"
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
