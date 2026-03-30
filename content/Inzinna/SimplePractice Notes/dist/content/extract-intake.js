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
    recentSymptoms: "",
    additionalSymptoms: "",
    additionalInfo: "",
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

  // src/lib/storage.ts
  var INTAKE_KEY = "spn_intake";
  async function saveIntake(intake) {
    await chrome.storage.session.set({ [INTAKE_KEY]: intake });
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
  function normalizedText(value) {
    return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  // src/content/extract-intake.ts
  function getClientIdFromUrl() {
    const match = window.location.pathname.match(/\/clients\/(\d+)/);
    return match?.[1] ?? "";
  }
  function isClientPage() {
    return /\/clients\/\d+/.test(window.location.pathname);
  }
  function parseIntakeQA() {
    const container = document.querySelector(".markdown.intake-answers");
    if (!container) return [];
    const pairs = [];
    const children = Array.from(container.children);
    let currentQuestion = "";
    let answerParts = [];
    for (const child of children) {
      if (child.tagName === "H3") {
        if (currentQuestion) {
          pairs.push({
            question: currentQuestion,
            answer: answerParts.join("\n").trim()
          });
        }
        currentQuestion = child.textContent?.trim() ?? "";
        answerParts = [];
      } else if (currentQuestion) {
        if (child.classList.contains("signature-header") || child.classList.contains("signature-content") || child.classList.contains("signature-info") || child.classList.contains("signature-ip")) {
          continue;
        }
        if (child.tagName === "P") {
          const text = child.textContent?.trim() ?? "";
          if (text.startsWith("Signed by") || text.startsWith("IP address:")) continue;
          if (text && text !== "No answer given.") {
            answerParts.push(text);
          }
        } else if (child.tagName === "UL") {
          const items = Array.from(child.querySelectorAll("li")).map((li) => li.textContent?.trim() ?? "").filter(Boolean);
          answerParts.push(...items);
        }
      }
    }
    if (currentQuestion) {
      pairs.push({
        question: currentQuestion,
        answer: answerParts.join("\n").trim()
      });
    }
    return pairs;
  }
  function findAnswer(pairs, ...searchTerms) {
    for (const term of searchTerms) {
      const target = normalizedText(term);
      const match = pairs.find((p) => normalizedText(p.question).includes(target));
      if (match?.answer) return match.answer;
    }
    return "";
  }
  function extractFormMetadata() {
    const titleItem = document.querySelector(".title-item h3");
    const title = titleItem?.childNodes?.[0]?.textContent?.trim() ?? "";
    const dateText = document.querySelector(".title-item .subtext")?.textContent?.trim() ?? "";
    const signatureContent = document.querySelector(".signature-content")?.textContent?.trim() ?? "";
    const signatureInfo = Array.from(document.querySelectorAll(".signature-info")).map((el) => el.textContent?.trim() ?? "").filter(Boolean);
    const signedBy = signatureInfo.find((s) => s.startsWith("Signed by"))?.replace("Signed by ", "") ?? signatureContent;
    const signedAt = signatureInfo.find((s) => !s.startsWith("Signed by")) ?? "";
    return { title, date: dateText, signedBy, signedAt };
  }
  function parseAddress(raw) {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const addr = { street: "", city: "", state: "", zip: "", country: "", raw };
    if (lines.length === 0) return addr;
    addr.street = lines[0] ?? "";
    if (lines.length >= 2) {
      const cityLine = lines[1];
      const match = cityLine.match(/^(.+?)[,\s]+([A-Z]{2})\s*(\d{5})?/);
      if (match) {
        addr.city = match[1].trim();
        addr.state = match[2];
        if (match[3]) addr.zip = match[3];
      } else {
        addr.city = cityLine;
      }
    }
    if (lines.length >= 3) {
      const zipLine = lines[2];
      if (/^\d{5}(-\d{4})?$/.test(zipLine)) {
        addr.zip = zipLine;
      } else if (!addr.zip) {
        addr.zip = zipLine;
      }
    }
    if (lines.length >= 4) {
      addr.country = lines[3];
    }
    return addr;
  }
  function parseName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" ")
    };
  }
  function extractIntakeData() {
    const intake = {
      ...EMPTY_INTAKE,
      address: { ...EMPTY_INTAKE.address },
      rawQA: []
    };
    intake.clientId = getClientIdFromUrl();
    intake.capturedAt = (/* @__PURE__ */ new Date()).toISOString();
    const meta = extractFormMetadata();
    intake.formTitle = meta.title;
    intake.formDate = meta.date;
    intake.signedBy = meta.signedBy;
    intake.signedAt = meta.signedAt;
    const pairs = parseIntakeQA();
    intake.rawQA = pairs.map((p) => ({ question: p.question, answer: p.answer }));
    if (pairs.length === 0) return intake;
    intake.dob = findAnswer(pairs, "date of birth");
    intake.fullName = findAnswer(pairs, "full legal name", "full name", "name");
    const { firstName, lastName } = parseName(intake.fullName);
    intake.firstName = firstName;
    intake.lastName = lastName;
    intake.phone = findAnswer(pairs, "phone number");
    intake.sex = findAnswer(pairs, "what is your sex");
    intake.genderIdentity = findAnswer(pairs, "gender identity");
    intake.race = findAnswer(pairs, "indicate your race", "race");
    intake.ethnicity = findAnswer(pairs, "latino or hispanic", "ethnicity");
    const rawAddress = findAnswer(pairs, "home address", "address");
    if (rawAddress) {
      intake.address = parseAddress(rawAddress);
    }
    intake.emergencyContact = findAnswer(pairs, "emergency contact");
    intake.chiefComplaint = findAnswer(
      pairs,
      "what brings you to counseling",
      "what brings you to therapy",
      "what brings you",
      "reason for seeking",
      "chief complaint"
    );
    intake.counselingGoals = findAnswer(
      pairs,
      "goals for counseling",
      "goals for therapy",
      "goals for treatment"
    );
    intake.priorTreatment = findAnswer(
      pairs,
      "seen a mental health professional before",
      "previous mental health",
      "prior treatment"
    );
    intake.medications = findAnswer(
      pairs,
      "medications and supplements",
      "medications",
      "currently taking"
    );
    intake.prescribingMD = findAnswer(
      pairs,
      "prescribing md",
      "prescribing doctor",
      "prescribing physician"
    );
    intake.primaryCarePhysician = findAnswer(
      pairs,
      "primary care physician",
      "primary care doctor",
      "pcp"
    );
    intake.alcoholUse = findAnswer(pairs, "drink alcohol");
    intake.drugUse = findAnswer(pairs, "recreational drugs", "drug use");
    intake.suicidalIdeation = findAnswer(pairs, "suicidal thoughts", "suicidal ideation");
    intake.suicideAttemptHistory = findAnswer(pairs, "attempted suicide", "suicide attempt");
    intake.homicidalIdeation = findAnswer(pairs, "thoughts or urges to harm others", "homicidal");
    intake.psychiatricHospitalization = findAnswer(pairs, "hospitalized for a psychiatric", "psychiatric hospitalization");
    intake.familyPsychiatricHistory = findAnswer(pairs, "history of mental illness in your family");
    intake.familyMentalEmotionalHistory = findAnswer(
      pairs,
      "family history of mental/emotional",
      "family history of mental",
      "emotional disturbance"
    );
    intake.maritalStatus = findAnswer(pairs, "marital status");
    intake.relationshipDescription = findAnswer(
      pairs,
      "describe the nature of the relationship",
      "relationship"
    );
    intake.livingArrangement = findAnswer(
      pairs,
      "current living situation",
      "living situation",
      "live alone"
    );
    intake.education = findAnswer(
      pairs,
      "level of education",
      "highest grade",
      "education"
    );
    intake.occupation = findAnswer(
      pairs,
      "current occupation",
      "occupation"
    );
    intake.physicalSexualAbuseHistory = findAnswer(pairs, "physical/sexual abuse", "physical abuse", "sexual abuse");
    intake.domesticViolenceHistory = findAnswer(pairs, "domestic violence");
    intake.recentSymptoms = findAnswer(pairs, "experienced in the past six months", "past six months");
    intake.additionalSymptoms = findAnswer(pairs, "following that apply");
    intake.additionalInfo = findAnswer(pairs, "what else would you like me to know", "anything else");
    return intake;
  }
  function countCapturedFields(intake) {
    let count = 0;
    const skip = /* @__PURE__ */ new Set(["capturedAt", "clientId", "address", "rawQA", "formTitle", "formDate", "signedBy", "signedAt"]);
    for (const [key, value] of Object.entries(intake)) {
      if (skip.has(key)) continue;
      if (typeof value === "string" && value.trim()) count++;
    }
    if (intake.address.raw) count++;
    return count;
  }
  async function handleCaptureClick() {
    try {
      assertExtensionContext();
      showToast("Capturing intake data...", "success");
      const intake = extractIntakeData();
      const fieldCount = countCapturedFields(intake);
      if (fieldCount === 0) {
        showToast("No intake data found. Make sure you are viewing an intake form.", "error");
        return;
      }
      await saveIntake(intake);
      const name = `${intake.firstName} ${intake.lastName}`.trim() || "client";
      showToast(`Captured ${fieldCount} fields for ${name} (${intake.rawQA.length} Q&A pairs)`, "success");
      console.log("[SPN] Captured intake data:", {
        fieldCount,
        qaCount: intake.rawQA.length,
        clientId: intake.clientId,
        name
      });
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        showToast("Extension reloaded \u2014 please refresh this page.", "error");
      } else {
        console.error("[SPN] Capture error:", err);
        showToast("Failed to capture intake data.", "error");
      }
    }
  }
  function hasIntakeForm() {
    return !!document.querySelector(".markdown.intake-answers");
  }
  function injectCaptureButton() {
    if (!isClientPage()) return;
    if (document.getElementById("spn-capture-btn")) return;
    if (!hasIntakeForm()) return;
    injectButton("Capture Intake", handleCaptureClick, {
      id: "spn-capture-btn",
      position: "bottom-right"
    });
  }
  var lastUrl = window.location.href;
  var retryCount = 0;
  var MAX_RETRIES = 10;
  var observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      retryCount = 0;
      setTimeout(injectCaptureButton, 500);
    }
    if (isClientPage() && !document.getElementById("spn-capture-btn") && retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(injectCaptureButton, 1e3);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(injectCaptureButton, 500));
  } else {
    setTimeout(injectCaptureButton, 500);
  }
})();
//# sourceMappingURL=extract-intake.js.map
