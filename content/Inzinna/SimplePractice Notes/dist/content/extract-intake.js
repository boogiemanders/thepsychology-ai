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
  async function saveIntake(intake) {
    await chrome.storage.session.set({ [INTAKE_KEY]: normalizeIntake(intake) });
  }
  async function getStoredIntake() {
    const result = await chrome.storage.session.get(INTAKE_KEY);
    const intake = result[INTAKE_KEY];
    return intake ? normalizeIntake(intake) : null;
  }
  async function mergeIntake(partial) {
    const existing = await getStoredIntake();
    await saveIntake({
      ...existing ?? EMPTY_INTAKE,
      ...partial,
      address: {
        ...existing?.address ?? EMPTY_INTAKE.address,
        ...partial.address ?? {}
      },
      rawQA: partial.rawQA ?? existing?.rawQA ?? EMPTY_INTAKE.rawQA,
      gad7: partial.gad7 ?? existing?.gad7 ?? null,
      phq9: partial.phq9 ?? existing?.phq9 ?? null
    });
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
  function normalizedText(value) {
    return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
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

  // src/content/extract-intake.ts
  var CLIENT_PATH_RE = /\/clients\/([^/]+)/;
  function getClientIdFromUrl() {
    const match = window.location.pathname.match(CLIENT_PATH_RE);
    return match?.[1] ?? "";
  }
  function isClientPage() {
    return CLIENT_PATH_RE.test(window.location.pathname);
  }
  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function toAbsoluteUrl(value) {
    try {
      return new URL(value, window.location.origin).href;
    } catch {
      return "";
    }
  }
  function isSameClientUrl(url, clientId = getClientIdFromUrl()) {
    if (!clientId) return false;
    try {
      const parsed = new URL(url);
      return parsed.origin === window.location.origin && parsed.pathname.startsWith(`/clients/${clientId}`);
    } catch {
      return false;
    }
  }
  function extractIntakeNoteUrlsFromText(text, clientId = getClientIdFromUrl()) {
    const pattern = clientId ? new RegExp(`/clients/${escapeRegExp(clientId)}/intake_notes/\\d+`, "g") : /\/clients\/[^/]+\/intake_notes\/\d+/g;
    const normalizedTextCandidates = [
      text,
      text.replace(/\\\//g, "/")
    ];
    return Array.from(new Set(
      normalizedTextCandidates.flatMap((candidate) => candidate.match(pattern) ?? []).map((match) => toAbsoluteUrl(match)).filter(Boolean)
    ));
  }
  function extractSameClientPageUrlsFromRoot(root, clientId = getClientIdFromUrl()) {
    const urls = /* @__PURE__ */ new Set();
    for (const link of Array.from(root.querySelectorAll("a[href]"))) {
      const href = link.getAttribute("href") ?? "";
      const url = toAbsoluteUrl(href);
      if (!url) continue;
      if (!isSameClientUrl(url, clientId)) continue;
      urls.add(url);
    }
    return Array.from(urls);
  }
  function collectRenderedIntakeNoteUrls(clientId = getClientIdFromUrl()) {
    return Array.from(/* @__PURE__ */ new Set([
      ...extractIntakeNoteUrlsFromText(document.documentElement.outerHTML, clientId),
      ...extractSameClientPageUrlsFromRoot(document, clientId).filter((url) => url.includes("/intake_notes/"))
    ]));
  }
  async function discoverIntakeNoteUrlsViaBackground(clientId) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "SPN_DISCOVER_INTAKE_NOTE_URLS",
        clientId
      });
      return Array.isArray(response?.urls) ? response.urls : [];
    } catch (err) {
      console.warn("[SPN] Background intake-note discovery failed:", err);
      return [];
    }
  }
  async function discoverIntakeNoteUrls() {
    const noteUrls = /* @__PURE__ */ new Set();
    const clientId = getClientIdFromUrl();
    const candidatePages = /* @__PURE__ */ new Set();
    const addNoteUrls = (urls) => {
      for (const url of urls) {
        if (!clientId || isSameClientUrl(url, clientId)) {
          noteUrls.add(url);
        }
      }
    };
    addNoteUrls(collectRenderedIntakeNoteUrls(clientId));
    if (clientId) {
      candidatePages.add(toAbsoluteUrl(`/clients/${clientId}/intake_notes`));
    }
    const parser = new DOMParser();
    for (const url of candidatePages) {
      try {
        const resp = await fetch(url, { credentials: "include" });
        if (!resp.ok) {
          console.log(`[SPN] Intake-notes index returned ${resp.status} for ${url}`);
          continue;
        }
        const html = await resp.text();
        addNoteUrls(extractIntakeNoteUrlsFromText(html, clientId));
        const doc = parser.parseFromString(html, "text/html");
        addNoteUrls(extractSameClientPageUrlsFromRoot(doc, clientId).filter((candidate) => candidate.includes("/intake_notes/")));
      } catch (err) {
        console.warn(`[SPN] Failed to inspect intake-notes index ${url}:`, err);
      }
    }
    if (noteUrls.size === 0 && clientId) {
      console.log("[SPN] Falling back to background-tab intake-note discovery");
      addNoteUrls(await discoverIntakeNoteUrlsViaBackground(clientId));
    }
    return Array.from(noteUrls);
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
    intake.medicalHistory = findAnswer(
      pairs,
      "medical conditions",
      "medical history",
      "current medical conditions",
      "current health conditions"
    );
    intake.allergies = findAnswer(
      pairs,
      "allergies",
      "allergy"
    );
    intake.surgeries = findAnswer(
      pairs,
      "surgeries",
      "surgery history",
      "surgical history"
    );
    intake.troubleSleeping = findAnswer(
      pairs,
      "trouble sleeping",
      "sleep problems",
      "sleep issues",
      "difficulty sleeping"
    );
    intake.developmentalHistory = findAnswer(
      pairs,
      "developmental history",
      "within normal limits"
    );
    intake.tbiLoc = findAnswer(
      pairs,
      "tbi",
      "traumatic brain injury",
      "loss of consciousness",
      "loc"
    );
    intake.alcoholUse = findAnswer(pairs, "drink alcohol");
    intake.drugUse = findAnswer(pairs, "recreational drugs", "drug use");
    intake.substanceUseHistory = findAnswer(
      pairs,
      "using or abusing substances",
      "substance use",
      "substance abuse"
    );
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
  function detectAssessmentTypeFromQuestions(root = document) {
    const questionTexts = Array.from(root.querySelectorAll("tbody tr.et-tr td:first-child")).map((cell) => normalizedText(cell.textContent)).filter(Boolean);
    const combined = questionTexts.join(" ");
    if (/nervous anxious or on edge|unable to stop or control worrying|worrying too much about different things/.test(combined)) {
      return "GAD-7";
    }
    if (/little interest or pleasure in doing things|feeling down depressed or hopeless|poor appetite or overeating/.test(combined)) {
      return "PHQ-9";
    }
    const numberedQuestions = root.querySelectorAll("tbody tr.et-tr .question-number").length;
    if (numberedQuestions === 7) return "GAD-7";
    if (numberedQuestions === 9) return "PHQ-9";
    return null;
  }
  function detectAssessmentType(root = document) {
    const docTitle = root instanceof Document ? root.title : root.ownerDocument?.title ?? "";
    const title = normalizedText([
      root.querySelector(".title-item h3")?.textContent ?? "",
      root.querySelector("h1")?.textContent ?? "",
      docTitle
    ].join(" "));
    if (title.includes("gad 7")) return "GAD-7";
    if (title.includes("phq 9")) return "PHQ-9";
    return detectAssessmentTypeFromQuestions(root);
  }
  function extractAssessmentFromRoot(name, root = document) {
    const items = [];
    let difficulty = "";
    const scoringEl = root.querySelector(".scoring-description");
    const severityMatch = scoringEl?.textContent?.match(/indicate\s+(.+)/i);
    const severity = severityMatch?.[1]?.replace(/\.$/, "").trim() ?? "";
    const rows = root.querySelectorAll("tbody tr.et-tr");
    for (const row of Array.from(rows)) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 3) continue;
      const firstCell = cells[0];
      const questionNumEl = firstCell.querySelector(".question-number");
      if (questionNumEl) {
        const num = parseInt(questionNumEl.textContent?.replace(".", "") ?? "0", 10);
        const questionText = firstCell.querySelector(".question-number + div p")?.textContent?.trim() ?? "";
        const response = cells[1]?.querySelector(".cell-container p")?.textContent?.trim() ?? "";
        const scoreText = cells[2]?.querySelector(".cell-container p")?.textContent?.trim() ?? "";
        const scoreParts = scoreText.match(/^(\d+)\/(\d+)$/);
        items.push({
          number: num,
          question: questionText,
          response,
          score: scoreParts ? parseInt(scoreParts[1], 10) : 0,
          maxScore: scoreParts ? parseInt(scoreParts[2], 10) : 3
        });
      } else if (!firstCell.querySelector(".intro-row") && firstCell.textContent?.includes("difficult")) {
        difficulty = cells[1]?.querySelector(".cell-container p")?.textContent?.trim() ?? "";
      }
    }
    const allRows = root.querySelectorAll("tbody tr.et-tr:not(.intro-row)");
    for (const row of Array.from(allRows)) {
      const firstCell = row.querySelector("td");
      if (!firstCell?.querySelector(".question-number") && firstCell?.textContent?.includes("difficult")) {
        const cells = row.querySelectorAll("td");
        difficulty = cells[1]?.querySelector(".cell-container p")?.textContent?.trim() ?? "";
      }
    }
    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return { name, totalScore, severity, items, difficulty, capturedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  async function fetchAssessmentsFromLinks() {
    const result = { gad7: null, phq9: null };
    const uniqueLinks = await discoverIntakeNoteUrls();
    if (uniqueLinks.length === 0) {
      console.log("[SPN] Auto-capture found no sibling intake-note URLs on this page");
      return result;
    }
    console.log("[SPN] Auto-capture candidate intake-note URLs:", uniqueLinks);
    for (const url of uniqueLinks) {
      try {
        const resp = await fetch(url, { credentials: "include" });
        if (!resp.ok) continue;
        const html = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const type = detectAssessmentType(doc);
        if (!type) {
          console.log(`[SPN] Skipping non-assessment intake note ${url}`);
          continue;
        }
        const assessment = extractAssessmentFromRoot(type, doc);
        if (assessment.items.length > 0) {
          if (type === "GAD-7") result.gad7 = assessment;
          else result.phq9 = assessment;
          console.log(`[SPN] Auto-captured ${type} from ${url}: score ${assessment.totalScore}`);
        }
        if (result.gad7 && result.phq9) break;
      } catch (err) {
        console.warn(`[SPN] Failed to fetch linked intake note ${url}:`, err);
      }
    }
    if (!result.gad7 || !result.phq9) {
      console.log("[SPN] Auto-capture missing assessments after sibling-note scan:", {
        missing: [
          !result.gad7 ? "GAD-7" : "",
          !result.phq9 ? "PHQ-9" : ""
        ].filter(Boolean)
      });
    }
    return result;
  }
  function hasAssessmentTable() {
    return !!document.querySelector("tbody tr.et-tr") && !!detectAssessmentType();
  }
  async function handleAssessmentCapture() {
    try {
      assertExtensionContext();
      const type = detectAssessmentType();
      if (!type) {
        showToast("Not a recognized assessment page.", "error");
        return;
      }
      const result = extractAssessmentFromRoot(type);
      const key = type === "GAD-7" ? "gad7" : "phq9";
      await mergeIntake({ [key]: result });
      showToast(`Captured ${type}: score ${result.totalScore} (${result.severity})`, "success");
      console.log(`[SPN] Captured ${type}:`, result);
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        showToast("Extension reloaded \u2014 please refresh this page.", "error");
      } else {
        console.error("[SPN] Assessment capture error:", err);
        showToast("Failed to capture assessment.", "error");
      }
    }
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
      const assessments = await fetchAssessmentsFromLinks();
      if (assessments.gad7) intake.gad7 = assessments.gad7;
      if (assessments.phq9) intake.phq9 = assessments.phq9;
      await mergeIntake(intake);
      const extras = [];
      if (assessments.gad7) extras.push(`GAD-7: ${assessments.gad7.totalScore}`);
      if (assessments.phq9) extras.push(`PHQ-9: ${assessments.phq9.totalScore}`);
      const extraText = extras.length ? ` + ${extras.join(", ")}` : "";
      const name = `${intake.firstName} ${intake.lastName}`.trim() || "client";
      showToast(`Captured ${fieldCount} fields for ${name}${extraText}`, "success");
      console.groupCollapsed(`[SPN] Captured intake data for ${name} (${fieldCount} fields, ${intake.rawQA.length} Q&A)`);
      console.log("[SPN] Intake summary:", {
        fieldCount,
        qaCount: intake.rawQA.length,
        clientId: intake.clientId,
        name
      });
      console.log("[SPN] Full intake object:", intake);
      console.log("[SPN] rawQA:", intake.rawQA);
      console.groupEnd();
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
    if (hasAssessmentTable()) {
      if (document.getElementById("spn-assessment-btn")) return;
      const type = detectAssessmentType();
      injectButton(`Capture ${type}`, handleAssessmentCapture, {
        id: "spn-assessment-btn",
        position: "bottom-right"
      });
      return;
    }
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
  registerFloatingButtonsController(() => {
    setTimeout(injectCaptureButton, 0);
  });
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "SPN_COLLECT_INTAKE_NOTE_URLS") {
      sendResponse({ urls: collectRenderedIntakeNoteUrls(msg.clientId || getClientIdFromUrl()) });
      return true;
    }
  });
})();
//# sourceMappingURL=extract-intake.js.map
