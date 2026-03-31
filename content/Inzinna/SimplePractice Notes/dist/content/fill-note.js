"use strict";
(() => {
  // src/lib/types.ts
  var EMPTY_INTAKE = {
    fullName: "",
    firstName: "",
    lastName: "",
    sex: "",
    genderIdentity: "",
    dob: "",
    phone: "",
    email: "",
    address: { street: "", city: "", state: "", zip: "", country: "", raw: "" },
    race: "",
    ethnicity: "",
    emergencyContact: "",
    insuranceCompany: "",
    memberId: "",
    groupNumber: "",
    chiefComplaint: "",
    counselingGoals: "",
    presentingProblems: "",
    historyOfPresentIllness: "",
    priorTreatment: "",
    medications: "",
    prescribingMD: "",
    primaryCarePhysician: "",
    medicalHistory: "",
    allergies: "",
    surgeries: "",
    troubleSleeping: "",
    developmentalHistory: "",
    tbiLoc: "",
    suicidalIdeation: "",
    suicideAttemptHistory: "",
    homicidalIdeation: "",
    psychiatricHospitalization: "",
    alcoholUse: "",
    drugUse: "",
    substanceUseHistory: "",
    familyPsychiatricHistory: "",
    familyMentalEmotionalHistory: "",
    maritalStatus: "",
    relationshipDescription: "",
    livingArrangement: "",
    education: "",
    occupation: "",
    physicalSexualAbuseHistory: "",
    domesticViolenceHistory: "",
    gad7: null,
    phq9: null,
    recentSymptoms: "",
    additionalSymptoms: "",
    additionalInfo: "",
    manualNotes: "",
    formTitle: "",
    formDate: "",
    signedBy: "",
    signedAt: "",
    rawQA: [],
    capturedAt: "",
    clientId: ""
  };
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

  // src/lib/intake-augmentation.ts
  var OCCUPATION_PATTERN = /\b(software engineer|engineer|developer|teacher|student|manager|analyst|nurse|doctor|physician|therapist|consultant|designer|lawyer|attorney|accountant|entrepreneur|founder|product manager|project manager)\b/i;
  function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  function splitLines(notes) {
    return notes.split(/\n+/).map((line) => normalizeWhitespace(line)).filter(Boolean);
  }
  function unique(values) {
    const seen = /* @__PURE__ */ new Set();
    const output = [];
    for (const value of values) {
      const key = value.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      output.push(value);
    }
    return output;
  }
  function collectMatchingLines(lines, pattern, limit = 4) {
    return unique(lines.filter((line) => pattern.test(line))).slice(0, limit);
  }
  function joinLines(lines) {
    return unique(lines).join("\n");
  }
  function extractHeaderName(lines) {
    for (const line of lines.slice(0, 4)) {
      const match = line.match(/^(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})$/);
      if (!match) continue;
      const fullName = match[1].trim();
      const [firstName, ...rest] = fullName.split(/\s+/);
      return {
        fullName,
        firstName,
        lastName: rest.join(" ")
      };
    }
    return {};
  }
  function extractSex(notes) {
    const match = notes.match(/\b(?:\d{1,2}\s*(?:yo|year old)[-\s]*)?(male|female|man|woman)\b/i);
    if (!match) return {};
    const normalized = /female|woman/i.test(match[1]) ? "female" : "male";
    return {
      sex: normalized,
      genderIdentity: normalized
    };
  }
  function extractOccupation(lines) {
    const lineMatch = lines.find((line) => OCCUPATION_PATTERN.test(line));
    if (!lineMatch) return {};
    const phraseMatch = lineMatch.match(OCCUPATION_PATTERN);
    const occupation = normalizeWhitespace(phraseMatch?.[1] ?? lineMatch).replace(/[.]+$/, "");
    return occupation ? { occupation } : {};
  }
  function extractSurgeries(lines) {
    const surgeries = joinLines(
      collectMatchingLines(lines, /\b(surger(?:y|ies)|acl|labrum|meniscus|rotator cuff)\b/i, 3)
    );
    return surgeries ? { surgeries } : {};
  }
  function extractMedicalHistory(lines) {
    const medicalHistory = joinLines(
      collectMatchingLines(
        lines,
        /\b(ankle|snowboard|foot|walk|pain|injur|stomach|nausea|queasy|abdominal|head|foggy|fogginess|acl|labrum)\b/i,
        6
      )
    );
    return medicalHistory ? { medicalHistory } : {};
  }
  function extractSleep(lines) {
    const troubleSleeping = joinLines(
      collectMatchingLines(lines, /\b(insomnia|trouble falling asleep|hard to fall asleep|sleep disturbance|sleep was fine|nightmares?)\b/i, 4)
    );
    return troubleSleeping ? { troubleSleeping } : {};
  }
  function extractTbi(lines) {
    const tbiLoc = joinLines(
      collectMatchingLines(lines, /\b(head|loc|loss of consciousness|concussion|conscious the whole time|didn.?t hit head|foggy|fogginess)\b/i, 4)
    );
    return tbiLoc ? { tbiLoc } : {};
  }
  function extractPriorTreatment(lines) {
    const priorTreatment = joinLines(
      collectMatchingLines(lines, /\b(took med|medication|therap|coaching|2018)\b/i, 4)
    );
    return priorTreatment ? { priorTreatment } : {};
  }
  function extractCounselingGoals(lines) {
    const counselingGoals = joinLines(
      collectMatchingLines(lines, /\b(want to|want better|meet regularly|more actionable|cope|cbt|dynamic|act)\b/i, 6)
    );
    return counselingGoals ? { counselingGoals } : {};
  }
  function extractRecentSymptoms(lines) {
    const recentSymptoms = joinLines(
      collectMatchingLines(
        lines,
        /\b(anxious|anxiety|insomnia|stomach pain|queasy|nausea|flashback|dissociation|foggy|fogginess|trouble concentrating|sleep disturbance|hopelessness|shock)\b/i,
        8
      )
    );
    return recentSymptoms ? { recentSymptoms } : {};
  }
  function extractChiefComplaint(notes) {
    const parts = [];
    if (/\b(plane|airplane|flight).*(crash|accident)|hit fire truck|emergency exit\b/i.test(notes)) {
      parts.push("Trauma-related anxiety after airplane accident");
    } else if (/\b(accident|trauma)\b/i.test(notes)) {
      parts.push("Trauma-related symptoms after recent accident");
    }
    if (/\b(anxiety|anxious|overwhelmed|uneasiness|worry)\b/i.test(notes)) {
      parts.push("Anxiety and excessive worry");
    }
    if (/\b(insomnia|trouble falling asleep|sleep disturbance)\b/i.test(notes)) {
      parts.push("Sleep disturbance");
    }
    if (/\b(nausea|queasy|stomach pain|abdominal)\b/i.test(notes)) {
      parts.push("Nausea and stomach discomfort");
    }
    if (/\b(dissociation|foggy|fogginess|trouble concentrating|concentrating)\b/i.test(notes)) {
      parts.push("Concentration problems and fogginess");
    }
    if (/\b(hopelessness|hopeless)\b/i.test(notes)) {
      parts.push("Hopelessness");
    }
    const chiefComplaint = parts.join("; ");
    return chiefComplaint ? { chiefComplaint } : {};
  }
  function deriveIntakeFromManualNotes(notes) {
    const trimmedNotes = notes.trim();
    if (!trimmedNotes) return {};
    const lines = splitLines(trimmedNotes);
    return {
      ...extractHeaderName(lines),
      ...extractSex(trimmedNotes),
      ...extractOccupation(lines),
      ...extractChiefComplaint(trimmedNotes),
      ...extractSurgeries(lines),
      ...extractMedicalHistory(lines),
      ...extractSleep(lines),
      ...extractTbi(lines),
      ...extractPriorTreatment(lines),
      ...extractCounselingGoals(lines),
      ...extractRecentSymptoms(lines)
    };
  }
  function pickString(primary, fallback) {
    return primary.trim() || fallback?.trim() || "";
  }
  function augmentIntakeWithManualNotes(intake) {
    if (!intake.manualNotes.trim()) return intake;
    const derived = deriveIntakeFromManualNotes(intake.manualNotes);
    return {
      ...intake,
      fullName: pickString(intake.fullName, derived.fullName),
      firstName: pickString(intake.firstName, derived.firstName),
      lastName: pickString(intake.lastName, derived.lastName),
      sex: pickString(intake.sex, derived.sex),
      genderIdentity: pickString(intake.genderIdentity, derived.genderIdentity),
      chiefComplaint: pickString(intake.chiefComplaint, derived.chiefComplaint),
      counselingGoals: pickString(intake.counselingGoals, derived.counselingGoals),
      priorTreatment: pickString(intake.priorTreatment, derived.priorTreatment),
      medicalHistory: pickString(intake.medicalHistory, derived.medicalHistory),
      surgeries: pickString(intake.surgeries, derived.surgeries),
      troubleSleeping: pickString(intake.troubleSleeping, derived.troubleSleeping),
      tbiLoc: pickString(intake.tbiLoc, derived.tbiLoc),
      occupation: pickString(intake.occupation, derived.occupation),
      recentSymptoms: pickString(intake.recentSymptoms, derived.recentSymptoms)
    };
  }

  // src/lib/storage.ts
  var INTAKE_KEY = "spn_intake";
  function normalizeIntake(intake) {
    return {
      ...EMPTY_INTAKE,
      ...intake,
      address: {
        ...EMPTY_INTAKE.address,
        ...intake?.address ?? {}
      },
      rawQA: Array.isArray(intake?.rawQA) ? intake.rawQA : [],
      gad7: intake?.gad7 ?? null,
      phq9: intake?.phq9 ?? null
    };
  }
  async function getStoredIntake() {
    const result = await chrome.storage.session.get(INTAKE_KEY);
    const intake = result[INTAKE_KEY];
    return intake ? normalizeIntake(intake) : null;
  }
  async function getIntake() {
    const intake = await getStoredIntake();
    return intake ? augmentIntakeWithManualNotes(intake) : null;
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
    btn.style.display = areFloatingButtonsVisible() ? "" : "none";
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
  function normalizedText(value) {
    return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  var wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
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
  function findFieldElement(labelText, selector) {
    const container = findFieldContainer(labelText);
    if (!container) return null;
    return container.querySelector(selector);
  }
  function floatingButtonsState() {
    return window;
  }
  function areFloatingButtonsVisible() {
    const state = floatingButtonsState();
    if (typeof state.__spnFloatingButtonsVisible !== "boolean") {
      state.__spnFloatingButtonsVisible = true;
    }
    return state.__spnFloatingButtonsVisible;
  }
  function setFloatingButtonsVisible(visible) {
    const state = floatingButtonsState();
    state.__spnFloatingButtonsVisible = visible;
    const buttons = document.querySelectorAll(".spn-floating-btn, .zsp-floating-btn");
    buttons.forEach((button) => {
      button.style.display = visible ? "" : "none";
    });
    if (visible) {
      for (const callback of state.__spnFloatingButtonsOnShow ?? []) {
        callback();
      }
    }
    return visible;
  }
  function registerFloatingButtonsController(onShow) {
    const state = floatingButtonsState();
    if (onShow) {
      state.__spnFloatingButtonsOnShow ??= [];
      state.__spnFloatingButtonsOnShow.push(onShow);
    }
    if (state.__spnFloatingButtonsListenerRegistered) return;
    state.__spnFloatingButtonsListenerRegistered = true;
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === "get-floating-buttons-visibility") {
        sendResponse({ visible: areFloatingButtonsVisible() });
        return true;
      }
      if (msg?.type === "toggle-floating-buttons") {
        sendResponse({ visible: setFloatingButtonsVisible(!areFloatingButtonsVisible()) });
        return true;
      }
    });
  }

  // src/content/fill-note.ts
  function isNotePage() {
    return /\/appointments\/\d+/.test(window.location.pathname) || /\/clients\/\d+\/(notes|appointments)/.test(window.location.pathname) || /\/clients\/\d+\/treatment_plans/.test(window.location.pathname);
  }
  function capitalize(value) {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  function lowerCaseFirst(value) {
    if (!value) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
  }
  function parseDate(value) {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const direct = new Date(trimmed);
    if (!Number.isNaN(direct.getTime())) return direct;
    const mmddyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!mmddyyyy) return null;
    const [, month, day, year] = mmddyyyy;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  function calculateAge(dob) {
    const age = getAgeYears(dob);
    return age ? `${age} yo` : "";
  }
  function getManualAgeLabel(notes) {
    const match = notes.match(/\b(\d{1,3})\s*(?:yo|y\/o|year old)\b/i);
    return match ? `${match[1]} yo` : "";
  }
  function getAgeYears(dob) {
    const birthDate = parseDate(dob);
    if (!birthDate) return null;
    const today = /* @__PURE__ */ new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const hadBirthday = today.getMonth() > birthDate.getMonth() || today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate();
    if (!hadBirthday) age -= 1;
    return age > 0 ? age : null;
  }
  function buildIdentityDescriptor(intake) {
    const ethnicity = intake.ethnicity.trim();
    const race = intake.race.trim();
    const gender = (intake.genderIdentity || intake.sex).trim().toLowerCase();
    let ethnicityOrRace = "";
    if (/^yes$/i.test(ethnicity)) {
      ethnicityOrRace = race ? `${race} Hispanic/Latino` : "Hispanic/Latino";
    } else if (/^no$/i.test(ethnicity)) {
      ethnicityOrRace = race;
    } else {
      ethnicityOrRace = ethnicity || race;
    }
    return [ethnicityOrRace, gender].filter(Boolean).join(", ");
  }
  function normalizeLivingArrangement(livingArrangement) {
    const trimmed = livingArrangement.trim();
    if (!trimmed) return "";
    if (/alone|live alone/i.test(trimmed)) return "alone";
    const cleaned = trimmed.replace(/^i\s+live\s+/i, "").replace(/^live\s+/i, "").trim();
    if (!cleaned) return "";
    const lower = cleaned.toLowerCase();
    if (/^with\s+/i.test(lower)) return lower;
    return `with ${lower}`;
  }
  function normalizeOccupation(occupation) {
    const trimmed = occupation.trim();
    if (!trimmed) return "";
    if (/unemployed|not working|out of work/i.test(trimmed)) return "currently unemployed";
    const yearsMatch = trimmed.match(/^(.*?)(\d+\s+years?)$/i);
    if (yearsMatch) {
      const role = yearsMatch[1].trim().replace(/^(a|an)\s+/i, "").toLowerCase();
      const duration = yearsMatch[2].trim().toLowerCase();
      return role ? `a ${role} for ${duration}` : "";
    }
    const cleaned = trimmed.replace(/^(a|an)\s+/i, "").toLowerCase();
    return cleaned ? `a ${cleaned}` : "";
  }
  function normalizeEducationForNarrative(education) {
    const trimmed = education.trim();
    if (!trimmed) return "";
    return trimmed.replace(/^education[:\s-]*/i, "").replace(/^i\s+(?:am|have|completed|finished|earned)\s+/i, "").replace(/[.]+$/, "").trim().toLowerCase();
  }
  function inferSubjectPronoun(intake) {
    const genderText = `${intake.genderIdentity} ${intake.sex}`.toLowerCase();
    if (/\b(male|man|boy|he|him)\b/.test(genderText)) return "he";
    if (/\b(female|woman|girl|she|her)\b/.test(genderText)) return "she";
    return "they";
  }
  function normalizeClause(value) {
    return lowerCaseFirst(value.trim().replace(/[.]+$/, ""));
  }
  function splitComplaintParts(value) {
    return value.split(/[\n,;]+/).map((part) => normalizeClause(part)).filter(Boolean);
  }
  function buildChiefComplaintSentences(chiefComplaint, pronoun) {
    const parts = splitComplaintParts(chiefComplaint);
    if (parts.length === 0) return [];
    const hasAirplaneAccident = parts.some((part) => /air\s*plane|airplane|plane accident|plane crash/.test(part));
    const otherParts = parts.filter((part) => !/air\s*plane|airplane|plane accident|plane crash/.test(part));
    if (hasAirplaneAccident) {
      const hasAnxiety = otherParts.some((part) => /\banxiety\b/.test(part));
      const remaining = otherParts.filter((part) => !/\banxiety\b/.test(part));
      let sentence = `${pronoun} recently was in an airplane accident`;
      if (hasAnxiety) sentence += " and reported anxiety";
      if (remaining.length) sentence += ` and reported ${remaining.join(", ")}`;
      return [`${sentence}.`];
    }
    return parts.map((part) => `${pronoun} presented with ${part}.`);
  }
  function buildChiefComplaintNarrative(intake) {
    const name = intake.firstName || intake.fullName || [intake.firstName, intake.lastName].filter(Boolean).join(" ") || "Patient";
    const age = calculateAge(intake.dob) || getManualAgeLabel(intake.manualNotes);
    const identity = buildIdentityDescriptor(intake);
    const livingArrangement = normalizeLivingArrangement(intake.livingArrangement);
    const education = normalizeEducationForNarrative(intake.education);
    const occupation = normalizeOccupation(intake.occupation);
    const pronoun = capitalize(inferSubjectPronoun(intake));
    const descriptor = [age, identity].filter(Boolean).join(", ");
    let intro = descriptor ? `${name} is a ${descriptor}` : `${name} is a patient`;
    const contextualClauses = [];
    if (livingArrangement) contextualClauses.push(`living ${livingArrangement}`);
    if (education) contextualClauses.push(`with education history of ${education}`);
    if (occupation) contextualClauses.push(`working as ${occupation}`);
    if (contextualClauses.length) {
      intro += ` ${contextualClauses.join(", ")}`;
    }
    intro += ".";
    const sentences = [intro];
    if (intake.counselingGoals) {
      const goal = intake.counselingGoals.replace(/^to\s+/i, "").trim();
      if (goal) {
        const quotedGoal = normalizeClause(goal).replace(/[.]+$/, "");
        sentences.push(`${pronoun} shared goals to "${quotedGoal}."`);
      }
    }
    if (intake.chiefComplaint) {
      sentences.push(...buildChiefComplaintSentences(intake.chiefComplaint, pronoun));
    }
    return sentences.join(" ");
  }
  function buildHistoryOfPresentIllnessText(intake) {
    return [
      intake.historyOfPresentIllness,
      intake.presentingProblems,
      intake.manualNotes,
      intake.chiefComplaint
    ].map((value) => value.trim()).filter(Boolean).join("\n\n");
  }
  function buildIntakeAnswerCorpus(intake) {
    return [
      intake.chiefComplaint,
      intake.counselingGoals,
      intake.presentingProblems,
      intake.historyOfPresentIllness,
      intake.priorTreatment,
      intake.medicalHistory,
      intake.suicidalIdeation,
      intake.suicideAttemptHistory,
      intake.homicidalIdeation,
      intake.psychiatricHospitalization,
      intake.alcoholUse,
      intake.drugUse,
      intake.substanceUseHistory,
      intake.familyPsychiatricHistory,
      intake.familyMentalEmotionalHistory,
      intake.relationshipDescription,
      intake.livingArrangement,
      intake.occupation,
      intake.physicalSexualAbuseHistory,
      intake.domesticViolenceHistory,
      intake.recentSymptoms,
      intake.additionalSymptoms,
      intake.additionalInfo,
      intake.manualNotes,
      ...intake.rawQA.map((pair) => pair.answer),
      ...intake.phq9?.items.map((item) => `${item.question} ${item.response}`) ?? [],
      ...intake.gad7?.items.map((item) => `${item.question} ${item.response}`) ?? []
    ].filter(Boolean).join("\n").toLowerCase();
  }
  function fillKeywordChecklist(groupName, corpus, rules) {
    let filled = 0;
    const checked = /* @__PURE__ */ new Set();
    for (const rule of rules) {
      if (checked.has(rule.label)) continue;
      if (!rule.patterns.some((pattern) => pattern.test(corpus))) continue;
      if (checkCheckboxByLabel(groupName, rule.label)) {
        checked.add(rule.label);
        filled++;
      }
    }
    return filled;
  }
  function isNegativeAnswer(value) {
    return /^(no|none|n\/a|na|denied|denies|negative|false)$/i.test(value.trim());
  }
  function selectPresenceByFieldLabel(labelText, details) {
    const value = details.trim();
    if (!value) return 0;
    const radio = findFieldElement(labelText, 'input[type="radio"]');
    if (!radio?.name) return 0;
    return selectRadio(radio.name, isNegativeAnswer(value) ? "2" : "1") ? 1 : 0;
  }
  function selectYesNoByFieldLabel(labelText, answer) {
    const value = answer.trim();
    if (!value) return 0;
    const radio = findFieldElement(labelText, 'input[type="radio"]');
    if (!radio?.name) return 0;
    return selectYesNo(radio.name, value) ? 1 : 0;
  }
  function fillLabeledField(labelText, value) {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const field = findFieldElement(
      labelText,
      '[contenteditable="true"], textarea, input[type="text"], input:not([type])'
    );
    if (!field) return 0;
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      return fillTextLikeField(field, trimmed) ? 1 : 0;
    }
    return fillContentEditableField(field, trimmed) ? 1 : 0;
  }
  function buildSubstanceDetails(intake) {
    const genericOnly = /^(yes|no|none|n\/a|na)$/i;
    const parts = [intake.alcoholUse, intake.drugUse, intake.substanceUseHistory].map((value) => value.trim()).filter((value) => value && !genericOnly.test(value));
    return Array.from(new Set(parts)).join("; ");
  }
  function fillICEFromIntake(intake) {
    let filled = 0;
    const dateInput = document.querySelector("#date-1");
    if (dateInput && intake.formDate) {
      if (fillTextLikeField(dateInput, intake.formDate)) filled++;
    }
    const timeSpan = document.querySelector(".start-end-time");
    if (timeSpan) {
      const timeParts = timeSpan.textContent?.trim().split(/\s*-\s*/);
      if (timeParts && timeParts.length === 2) {
        const startInput = document.querySelector("#short-answer-3");
        const endInput = document.querySelector("#short-answer-4");
        if (fillTextLikeField(startInput, timeParts[0].trim())) filled++;
        if (fillTextLikeField(endInput, timeParts[1].trim())) filled++;
      }
    }
    if (checkCheckboxByLabel("multi-select-5", "Patient")) filled++;
    const chiefComplaintNarrative = buildChiefComplaintNarrative(intake);
    const historyOfPresentIllness = buildHistoryOfPresentIllnessText(intake);
    if (fillProseMirrorByLabel("free-text-6", chiefComplaintNarrative)) filled++;
    if (fillProseMirrorByLabel("free-text-7", historyOfPresentIllness)) filled++;
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
        filled += fillLabeledField("If yes, please specify", buildSubstanceDetails(intake));
      }
    }
    if (intake.medicalHistory) {
      const hasMedical = !/none|no|denied|denies/i.test(intake.medicalHistory);
      if (selectRadio("single-select-39", hasMedical ? "1" : "2")) filled++;
    }
    filled += selectPresenceByFieldLabel("Allergies", intake.allergies);
    filled += selectYesNoByFieldLabel("Developmental history reported to be within normal limits", intake.developmentalHistory);
    filled += fillLabeledField("Surgeries", intake.surgeries);
    filled += selectPresenceByFieldLabel("History of trouble sleeping", intake.troubleSleeping);
    filled += fillLabeledField("TBI/LOC", intake.tbiLoc);
    filled += fillLabeledField("TBL/LOC", intake.tbiLoc);
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
    if (intake.occupation || intake.additionalInfo || intake.rawQA.length > 0) {
      filled += fillEmployment(intake.occupation, buildIntakeAnswerCorpus(intake));
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
    if (intake.phq9) {
      const phqText = `PHQ-9: ${intake.phq9.totalScore}/27 \u2014 ${intake.phq9.severity}. Functional difficulty: ${intake.phq9.difficulty || "N/A"}`;
      if (fillProseMirrorByLabel("free-text-90", phqText)) filled++;
    }
    if (intake.gad7) {
      const gadText = `GAD-7: ${intake.gad7.totalScore}/21 \u2014 ${intake.gad7.severity}. Functional difficulty: ${intake.gad7.difficulty || "N/A"}`;
      if (fillProseMirrorByLabel("free-text-91", gadText)) filled++;
    }
    if (intake.suicidalIdeation) {
      if (selectDropdownById("dropdown-86", mapSIToDropdown(intake.suicidalIdeation))) filled++;
    }
    if (intake.homicidalIdeation) {
      if (selectDropdownById("dropdown-87", mapHIToDropdown(intake.homicidalIdeation))) filled++;
    }
    return filled;
  }
  function fillDepressionFromPHQ9(phq9) {
    let filled = 0;
    const endorsed = phq9.items.filter((i) => i.score > 0);
    if (endorsed.length === 0) {
      if (checkCheckboxByLabel("multi-select-9", "Denies")) filled++;
      return filled;
    }
    const phqToDepression = {
      1: ["Loss of interest", "Loss of enjoyment"],
      2: ["Feeling sad, empty, or down", "Hopelessness"],
      3: ["Insomnia"],
      // "sleeping too much" → Hypersomnia handled below
      4: ["Loss of energy", "Fatigue"],
      5: ["Loss of appetite (without weight loss)"],
      // overeating handled below
      6: ["Worthlessness"],
      7: ["Difficulty concentrating"],
      8: ["Social withdrawal, agitation"],
      9: ["Recurrent suicidal ideation", "Recurrent thoughts about death/dying"]
    };
    for (const item of endorsed) {
      const labels = phqToDepression[item.number];
      if (!labels) continue;
      for (const label of labels) {
        if (checkCheckboxByLabel("multi-select-9", label)) filled++;
      }
      if (item.number === 3 && /too much|hypersomnia/i.test(item.response)) {
        if (checkCheckboxByLabel("multi-select-9", "Hypersomnia")) filled++;
      }
      if (item.number === 5 && /overeat/i.test(item.response)) {
        if (checkCheckboxByLabel("multi-select-9", "Increased appetite (without weight gain)")) filled++;
      }
    }
    return filled;
  }
  function fillDepressionFromKeywords(intake) {
    let filled = 0;
    const symptoms = `${intake.recentSymptoms} ${intake.additionalSymptoms}`.toLowerCase();
    if (!symptoms.trim()) return 0;
    const map = {
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
    for (const [keyword, label] of Object.entries(map)) {
      if (symptoms.includes(keyword)) {
        if (checkCheckboxByLabel("multi-select-9", label)) filled++;
      }
    }
    return filled;
  }
  function fillAnxietyFromGAD7(gad7) {
    let filled = 0;
    const endorsed = gad7.items.filter((i) => i.score > 0);
    if (endorsed.length === 0) {
      if (checkCheckboxByLabel("multi-select-10", "Denies")) filled++;
      return filled;
    }
    const gadToAnxiety = {
      1: ["Feeling on edge or tense"],
      2: ["Difficulty controlling worry, difficulty concentrating"],
      3: ["Excessive worry"],
      4: ["Feeling on edge or tense"],
      5: ["Restlessness"],
      6: ["Feeling on edge or tense"],
      7: ["Excessive worry"]
    };
    const checked = /* @__PURE__ */ new Set();
    for (const item of endorsed) {
      const labels = gadToAnxiety[item.number];
      if (!labels) continue;
      for (const label of labels) {
        if (checked.has(label)) continue;
        if (checkCheckboxByLabel("multi-select-10", label)) {
          filled++;
          checked.add(label);
        }
      }
    }
    const sleepItem = gad7.items.find((i) => i.number === 4 || i.number === 5);
    if (sleepItem && sleepItem.score > 0) {
      if (!checked.has("Difficulty falling or staying asleep")) {
        if (checkCheckboxByLabel("multi-select-10", "Difficulty falling or staying asleep")) filled++;
      }
    }
    return filled;
  }
  function fillAnxietyFromKeywords(intake) {
    let filled = 0;
    const symptoms = `${intake.recentSymptoms} ${intake.additionalSymptoms}`.toLowerCase();
    if (!symptoms.trim()) return 0;
    const map = {
      "worry": "Excessive worry",
      "distract": "Distractibility",
      "sleep": "Difficulty falling or staying asleep",
      "restless": "Restlessness",
      "edge": "Feeling on edge or tense",
      "tense": "Feeling on edge or tense"
    };
    for (const [keyword, label] of Object.entries(map)) {
      if (symptoms.includes(keyword)) {
        if (checkCheckboxByLabel("multi-select-10", label)) filled++;
      }
    }
    return filled;
  }
  function fillSymptomChecklistsFromIntake(intake) {
    let filled = 0;
    const corpus = buildIntakeAnswerCorpus(intake);
    if (intake.phq9 && intake.phq9.items.length > 0) {
      filled += fillDepressionFromPHQ9(intake.phq9);
    } else {
      filled += fillDepressionFromKeywords(intake);
    }
    if (intake.gad7 && intake.gad7.items.length > 0) {
      filled += fillAnxietyFromGAD7(intake.gad7);
    } else {
      filled += fillAnxietyFromKeywords(intake);
    }
    filled += fillKeywordChecklist("multi-select-11", corpus, [
      { label: "Pounding heart", patterns: [/pounding heart|heart pounding|heart racing/] },
      { label: "Heart palpitations", patterns: [/palpitations?|heart palpitations?/] },
      { label: "Sweating", patterns: [/sweating|sweaty/] },
      { label: "Shortness of breath", patterns: [/shortness of breath|breathless/] },
      { label: "Difficulty breathing", patterns: [/difficulty breathing|cannot breathe|can't breathe/] },
      { label: "Sensation of choking", patterns: [/sensation of choking|choking/] },
      { label: "Trembling or shaking", patterns: [/trembling|shaking|shaky/] },
      { label: "Chest pain or discomfort", patterns: [/chest pain|chest discomfort/] },
      { label: "Nausea or abdominal distress", patterns: [/nausea|abdominal distress|stomach distress/] },
      { label: "Abdominal pain or discomfort", patterns: [/abdominal pain|abdominal discomfort|stomach pain/] },
      { label: "Feeling dizzy, unsteady, lightheaded, or faint", patterns: [/dizzy|unsteady|lightheaded|faint/] },
      { label: "Chills or heat sensations", patterns: [/chills|heat sensations?|hot flashes?/] },
      { label: "Paresthesias", patterns: [/paresthesia|tingling|numbness/] },
      { label: "Derealization", patterns: [/derealization|things feel unreal|world feels unreal/] },
      { label: "Depersonalization", patterns: [/depersonalization|detached from myself|outside my body/] },
      { label: 'Fear of losing control or "going crazy"', patterns: [/losing control|going crazy/] },
      { label: "Fear of dying", patterns: [/fear of dying|thought i was dying|felt like i was dying/] },
      { label: "Persistent concern or worry about additional panic attacks or their consequences", patterns: [/worry about another panic|concern about additional panic|fear of another panic/] },
      { label: "Significant, maladaptive change in behavior related to the attacks", patterns: [/changed behavior.*panic|avoid.*panic|maladaptive change.*panic/] },
      { label: "Feeling on edge or tense", patterns: [/on edge|tense/] }
    ]);
    filled += fillKeywordChecklist("multi-select-12", corpus, [
      { label: "Repeated or extreme exposure to aversive details of the traumatic event(s)", patterns: [/repeated exposure|extreme exposure|aversive details/] },
      { label: "Recurrent, involuntary, and intrusive distressing memories of the event(s)", patterns: [/intrusive memories|distressing memories|unwanted memories/] },
      { label: "Repetitive play involving aspects of the traumatic event(s)", patterns: [/repetitive play/] },
      { label: "Recurrent distressing dreams related to the event(s)", patterns: [/nightmares?|distressing dreams?/] },
      { label: "Recurrent distressing dreams related the the event(s), dissociative reactions (e.g. flashbacks, re-enactment of trauma)", patterns: [/flashbacks?|dissociative reactions?|re-?enactment/] },
      { label: "Intense or prolonged psychological distress at exposure to internal or external cues", patterns: [/psychological distress.*cue|distress.*reminders?|triggered by reminders?/] },
      { label: "Marked physiological reactions to internal or external cues", patterns: [/physiological reactions?.*cue|physical reactions?.*reminders?/] },
      { label: "Persistent avoidance of stimuli associated with the event(s)", patterns: [/avoidance|avoiding reminders?|persistent avoidance/] },
      { label: "Behaviors, difficulty falling or staying asleep", patterns: [/difficulty falling asleep|difficulty staying asleep|insomnia/] },
      { label: "Negative alterations in cognition and mood (e.g. memory)", patterns: [/memory problems?|negative alterations?|detachment|guilt|shame/] },
      { label: "Direct experience, witnessing, or learning of a traumatic event(s)", patterns: [/trauma|accident|assault|abuse|violence|crash|plane accident|air ?plane accident|witnessed/] }
    ]);
    filled += fillKeywordChecklist("multi-select-13", corpus, [
      { label: "Persistently elevated mood", patterns: [/elevated mood|euphoric/] },
      { label: "Persistently expansive mood", patterns: [/expansive mood/] },
      { label: "Increased energy", patterns: [/increased energy|high energy/] },
      { label: "Inflated self-esteem", patterns: [/inflated self-esteem/] },
      { label: "Grandiosity", patterns: [/grandios|grandiosity/] },
      { label: "Decreased need for sleep", patterns: [/decreased need for sleep|sleeping very little|little sleep/] },
      { label: "More talkative than usual", patterns: [/more talkative than usual|talkative/] },
      { label: "Rapid speech", patterns: [/rapid speech/] },
      { label: "Pressured speech", patterns: [/pressured speech/] },
      { label: "Flight of ideas", patterns: [/flight of ideas/] },
      { label: "Racing thoughts", patterns: [/racing thoughts/] },
      { label: "Distractibility", patterns: [/distractibility|easily distracted/] },
      { label: "Increase in goal-directed activity", patterns: [/goal-directed activity|more projects|more productive/] },
      { label: "Psychomotor agitation", patterns: [/psychomotor agitation|agitated/] },
      { label: "Increased involvement in activities that have a high potential for painful consequences", patterns: [/risky behavior|spending spree|dangerous behavior/] },
      { label: "Diminished judgment", patterns: [/poor judgment|diminished judgment/] },
      { label: "Diminished insight", patterns: [/poor insight|diminished insight/] },
      { label: "Persistently irritable mood", patterns: [/persistently irritable|irritable mood/] }
    ]);
    filled += fillKeywordChecklist("multi-select-14", corpus, [
      { label: "Command", patterns: [/command hallucinations?|voices telling me/] },
      { label: "Visual (simple)", patterns: [/visual hallucinations? simple/] },
      { label: "Visual (complex)", patterns: [/visual hallucinations?|seeing things/] },
      { label: "Tactile", patterns: [/tactile hallucinations?|bugs crawling|things crawling/] },
      { label: "Olfactory", patterns: [/olfactory hallucinations?|smelling things that aren't there/] },
      { label: "Gustatory", patterns: [/gustatory hallucinations?|tasting things that aren't there/] },
      { label: "Auditory", patterns: [/auditory hallucinations?|hearing voices|hearing things that aren't there/] }
    ]);
    filled += fillKeywordChecklist("multi-select-15", corpus, [
      { label: "Of grandeur", patterns: [/delusions? of grandeur/] },
      { label: "Of guilt or sin", patterns: [/delusions? of guilt|delusions? of sin/] },
      { label: "Of reference", patterns: [/delusions? of reference/] },
      { label: "Of persecution", patterns: [/delusions? of persecution|paranoid delusions?/] },
      { label: "Of grandiosity", patterns: [/grandiose delusions?|delusions? of grandiosity/] },
      { label: "Of love (erotic)", patterns: [/erotomanic|delusions? of love/] },
      { label: "Of jealousy", patterns: [/delusions? of jealousy/] },
      { label: "Somatic", patterns: [/somatic delusions?/] },
      { label: "Thought broadcasting", patterns: [/thought broadcasting/] },
      { label: "Thought insertion", patterns: [/thought insertion/] },
      { label: "Bizarre", patterns: [/bizarre delusions?/] },
      { label: "Mood-congruent", patterns: [/mood-congruent/] },
      { label: "Mood-incongruent", patterns: [/mood-incongruent/] },
      { label: "Mood-neutral", patterns: [/mood-neutral/] },
      { label: "Flat affect", patterns: [/flat affect/] },
      { label: "Disorganized speech", patterns: [/disorganized speech/] },
      { label: "Disorganized behavior", patterns: [/disorganized behavior/] },
      { label: "Of control", patterns: [/delusions? of control/] }
    ]);
    filled += fillKeywordChecklist("multi-select-16", corpus, [
      { label: "Distractibility", patterns: [/distractibility|easily distracted/] },
      { label: "Hyperactivity and impulsivity", patterns: [/hyperactivity|hyperactive|impulsivity|impulsive/] },
      { label: "Inattention", patterns: [/inattention|attention problems?|difficulty paying attention/] }
    ]);
    filled += fillKeywordChecklist("multi-select-17", corpus, [
      { label: "Burning skin", patterns: [/burning skin|burn self|burning myself/] },
      { label: "Pinching or picking skin", patterns: [/skin picking|picking skin|pinching skin/] },
      { label: "Pulling out hair", patterns: [/pulling out hair|hair pulling|trichotillomania/] },
      { label: "Hitting head", patterns: [/hitting head|hit head/] },
      { label: "Banging head", patterns: [/banging head|bang head/] },
      { label: "Cutting or excoriating skin", patterns: [/cutting|cut self|excoriating skin|excoriation/] }
    ]);
    filled += fillKeywordChecklist("multi-select-18", corpus, [
      { label: "In vagina", patterns: [/insert.*vagina|in vagina/] },
      { label: "In anus", patterns: [/insert.*anus|in anus/] },
      { label: "Swallowing", patterns: [/swallowing objects?|ingesting objects?/] },
      { label: "Under skin", patterns: [/under skin|insert.*skin/] }
    ]);
    filled += fillKeywordChecklist("multi-select-19", corpus, [
      { label: "Binging", patterns: [/binge|binging/] },
      { label: "Purging", patterns: [/purge|purging|self-induced vomiting/] },
      { label: "Excessive exercise", patterns: [/excessive exercise|overexercise|compulsive exercise/] },
      { label: "Use of diuretics or laxatives", patterns: [/diuretics?|laxatives?/] },
      { label: "Use of appetite suppressants", patterns: [/appetite suppressants?/] },
      { label: "Restricting", patterns: [/restricting|food restriction|restrict food/] }
    ]);
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
      if (/household dysfunction|family dysfunction|chaotic home/i.test(abuse)) {
        if (checkCheckboxByLabel("multi-select-20", "Household dysfunction")) filled++;
      }
      if (/neglect/i.test(abuse)) {
        if (checkCheckboxByLabel("multi-select-20", "Neglect")) filled++;
      }
      if (/none|no|denied|denies/i.test(abuse)) {
        if (checkCheckboxByLabel("multi-select-20", "Denies")) filled++;
      }
    }
    const ageYears = getAgeYears(intake.dob);
    if (ageYears !== null && (ageYears <= 25 || ageYears >= 65)) {
      if (checkCheckboxByLabel("multi-select-21", "Adolescent, young adult, or elderly age")) filled++;
    }
    if (/(single|divorced|widowed)/i.test(intake.maritalStatus)) {
      if (checkCheckboxByLabel("multi-select-21", "Single, divorced or widowed")) filled++;
    }
    if (intake.suicideAttemptHistory && !/no|denied|denies|none/i.test(intake.suicideAttemptHistory)) {
      if (checkCheckboxByLabel("multi-select-21", "History of suicide attempt")) filled++;
    }
    if (/firearm|firearms|gun|guns|weapon|weapons/i.test(corpus)) {
      if (checkCheckboxByLabel("multi-select-21", "Access to firearms")) filled++;
    }
    if (/recent discharge.*psych|discharged.*psych|recently discharged.*hospital/i.test(corpus)) {
      if (checkCheckboxByLabel("multi-select-21", "Recent discharge from psych hospital")) filled++;
    }
    if (/recent loss|grief|bereavement|passed away|death of|lost my|loss of|breakup|divorce/i.test(corpus)) {
      if (checkCheckboxByLabel("multi-select-21", "Recent loss")) filled++;
    }
    if (/suicide.*family member|family member.*suicide|close friend.*suicide|friend.*died by suicide/i.test(corpus)) {
      if (checkCheckboxByLabel("multi-select-21", "Suicide by family member or close friend")) filled++;
    }
    if (intake.substanceUseHistory && !/no|denied|denies|none/i.test(intake.substanceUseHistory)) {
      if (checkCheckboxByLabel("multi-select-21", "History of substance abuse")) filled++;
    }
    if (intake.physicalSexualAbuseHistory && !/no|denied|denies|none/i.test(intake.physicalSexualAbuseHistory)) {
      if (checkCheckboxByLabel("multi-select-21", "History of abuse")) filled++;
    }
    if (/\b(male|man)\b/i.test(`${intake.sex} ${intake.genderIdentity}`)) {
      if (checkCheckboxByLabel("multi-select-21", "Male")) filled++;
    }
    if (/spiritual|religious|religion|faith|church|god|pray/i.test(corpus)) {
      if (checkCheckboxByLabel("multi-select-22", "Spiritual/religious beliefs")) filled++;
    }
    if (/supportive family|supportive friends|good support|social support|family support|partner support/i.test(corpus) || /(with family|with spouse|with partner|with roommate)/i.test(intake.livingArrangement)) {
      if (checkCheckboxByLabel("multi-select-22", "Perceived social support")) filled++;
    }
    if (/(child|children|kids|family|spouse|partner)/i.test(intake.livingArrangement) || /responsibility to family|responsibility to friends|take care of my family/i.test(corpus)) {
      if (checkCheckboxByLabel("multi-select-22", "Responsibility to family or friends")) filled++;
    }
    return filled;
  }
  function fillSubstanceCheckboxes(intake) {
    let filled = 0;
    const substance = `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory}`.toLowerCase();
    let matchedSpecific = false;
    if (/alcohol/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Alcohol")) {
        filled++;
        matchedSpecific = true;
      }
    }
    if (/tobacco|nicotine|cigarette|vape/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Tobacco")) {
        filled++;
        matchedSpecific = true;
      }
    }
    if (/cannabis|marijuana|weed|thc/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Cannabis")) {
        filled++;
        matchedSpecific = true;
      }
    }
    if (/opioid|heroin|fentanyl|oxy/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Opioids")) {
        filled++;
        matchedSpecific = true;
      }
    }
    if (/cocaine|crack/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Cocaine")) {
        filled++;
        matchedSpecific = true;
      }
    }
    if (/amphetamine|meth|adderall/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Amphetamines")) {
        filled++;
        matchedSpecific = true;
      }
    }
    if (/hallucinogen|lsd|mushroom|psilocybin/i.test(substance)) {
      if (checkCheckboxByLabel("multi-select-36", "Hallucinogens")) {
        filled++;
        matchedSpecific = true;
      }
    }
    if (!matchedSpecific && buildSubstanceDetails(intake)) {
      if (checkCheckboxByLabel("multi-select-36", "Other")) filled++;
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
  function fillEmployment(occupation, corpus = "") {
    let filled = 0;
    const lower = occupation.toLowerCase();
    if (/unemployed|not working|out of work/i.test(lower)) {
      if (checkCheckboxByLabel("multi-select-50", "Currently unemployed")) filled++;
    } else if (occupation.trim()) {
      if (checkCheckboxByLabel("multi-select-50", "Currently employed")) filled++;
    }
    if (/history of unemployment|periods of unemployment|laid off|layoff|out of work/i.test(corpus)) {
      if (checkCheckboxByLabel("multi-select-50", "History of unemployment")) filled++;
    }
    if (/work misconduct|misconduct at work|terminated for cause|fired for cause|disciplinary action/i.test(corpus)) {
      if (checkCheckboxByLabel("multi-select-50", "History of work misconduct")) filled++;
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
  registerFloatingButtonsController(() => {
    setTimeout(injectFillButton, 0);
  });
})();
//# sourceMappingURL=fill-note.js.map
