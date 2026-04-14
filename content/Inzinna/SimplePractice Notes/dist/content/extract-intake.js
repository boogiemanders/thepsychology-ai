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
    cssrs: null,
    dass21: null,
    recentSymptoms: "",
    additionalSymptoms: "",
    additionalInfo: "",
    manualNotes: "",
    overviewClinicalNote: "",
    spSoapNote: "",
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
  var EMPTY_TREATMENT_PLAN = {
    clientId: "",
    diagnoses: [],
    presentingProblem: "",
    clientStrengths: "",
    clientRisks: "",
    goals: [],
    interventions: [],
    treatmentType: "",
    estimatedLength: "",
    medicalNecessity: [],
    treatmentFrequency: "",
    dateAssigned: "",
    capturedAt: "",
    sourceUrl: ""
  };

  // src/lib/storage.ts
  var INTAKE_KEY = "spn_intake";
  var TREATMENT_PLAN_KEY = "spn_treatment_plan";
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
      phq9: intake?.phq9 ?? null,
      cssrs: intake?.cssrs ?? null,
      dass21: intake?.dass21 ?? null
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
      phq9: partial.phq9 ?? existing?.phq9 ?? null,
      cssrs: partial.cssrs ?? existing?.cssrs ?? null,
      dass21: partial.dass21 ?? existing?.dass21 ?? null
    });
  }
  async function saveTreatmentPlan(plan) {
    await chrome.storage.session.set({ [TREATMENT_PLAN_KEY]: plan });
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
  function isVisible(el) {
    return !(el instanceof HTMLElement) || el.offsetParent !== null || el.getClientRects().length > 0;
  }
  var wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
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
  function isClientOverviewPage() {
    return /\/clients\/[^/]+\/overview(?:$|[/?#])/.test(window.location.pathname);
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
  function extractClientNameFromPage() {
    const name = [
      document.querySelector("h1.name")?.textContent?.trim() ?? "",
      document.querySelector("h1[data-test-client-name]")?.textContent?.trim() ?? "",
      document.querySelector("main h1")?.textContent?.trim() ?? ""
    ].find(Boolean) ?? "";
    if (!name) return {};
    const [firstName, ...rest] = name.split(/\s+/);
    return {
      fullName: name,
      firstName,
      lastName: rest.join(" ")
    };
  }
  function extractDobFromPage() {
    const candidates = Array.from(document.querySelectorAll('.item, [class*="item"], [class*="meta"], [class*="demographic"]')).map((el) => el.textContent?.trim() ?? "").filter(Boolean);
    const dobText = candidates.find((text) => /\bDOB\b/i.test(text)) ?? "";
    const match = dobText.match(/\bDOB\b[:\s-]*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    return match?.[1]?.trim() ?? "";
  }
  function formatReadMoreParagraph(paragraph) {
    const strong = paragraph.querySelector("strong");
    const raw = paragraph.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!raw) return "";
    if (!strong?.textContent) return raw;
    const label = strong.textContent.replace(/:\s*$/, "").trim();
    const remainder = raw.replace(strong.textContent, "").replace(/^:\s*/, "").trim();
    return remainder ? `${label}: ${remainder}` : label;
  }
  function formatReadMoreBlock(block) {
    const lines = [];
    for (const child of Array.from(block.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === "p") {
        const line = formatReadMoreParagraph(child);
        if (line) lines.push(line);
        continue;
      }
      if (tag === "ul" || tag === "ol") {
        const items = Array.from(child.querySelectorAll("li")).map((item) => item.textContent?.replace(/\s+/g, " ").trim() ?? "").filter(Boolean);
        if (items.length) lines.push(...items.map((item) => `- ${item}`));
        continue;
      }
      const text = child.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (text) lines.push(text);
    }
    return lines.join("\n").trim();
  }
  async function expandReadMoreSections() {
    const toggles = Array.from(document.querySelectorAll("[data-readmore-toggle]")).filter((toggle) => isVisible(toggle)).filter((toggle) => /read more/i.test(toggle.textContent ?? "") || toggle.getAttribute("aria-expanded") === "false");
    let clicked = 0;
    for (const toggle of toggles) {
      toggle.click();
      clicked++;
      await wait(60);
    }
    if (clicked > 0) {
      await wait(120);
    }
    return clicked;
  }
  function collectOverviewClinicalNotes() {
    const blocks = Array.from(document.querySelectorAll("[data-test-shared-read-more], [data-readmore].markdown")).map((block) => formatReadMoreBlock(block)).filter((text) => text.length >= 40);
    const uniqueBlocks = Array.from(new Set(blocks));
    return uniqueBlocks.slice(0, 3).map((text, index) => `Overview note ${index + 1}:
${text}`).join("\n\n");
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
    if (/wished you were dead|thoughts of killing yourself|prepared to do anything to end your life/.test(combined)) {
      return "C-SSRS";
    }
    if (/hard to wind down|dryness of my mouth|close to panic|could not seem to experience any positive feeling/.test(combined)) {
      return "DASS-21";
    }
    const numberedQuestions = root.querySelectorAll("tbody tr.et-tr .question-number").length;
    if (numberedQuestions === 7) return "GAD-7";
    if (numberedQuestions === 9) return "PHQ-9";
    if (numberedQuestions === 6 && /kill yourself|end your life|wished you were dead/.test(combined)) {
      return "C-SSRS";
    }
    if (numberedQuestions === 21 && /stress|panic|wind down|positive feeling/.test(combined)) {
      return "DASS-21";
    }
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
    if (title.includes("c-ssrs") || title.includes("cssrs") || title.includes("columbia-suicide severity rating scale") || title.includes("columbia suicide severity rating scale")) {
      return "C-SSRS";
    }
    if (title.includes("dass 21") || title.includes("dass-21") || title.includes("depression anxiety stress scales")) {
      return "DASS-21";
    }
    return detectAssessmentTypeFromQuestions(root);
  }
  function isAffirmativeAssessmentResponse(value) {
    return /^(yes|y|true)$/i.test(value.trim());
  }
  function summarizeCssrs(items) {
    const yesItems = items.filter((item) => isAffirmativeAssessmentResponse(item.response));
    const yesNumbers = new Set(yesItems.map((item) => item.number));
    const totalScore = yesItems.length;
    const highestIdeationLevel = [5, 4, 3, 2, 1].find((number) => yesNumbers.has(number)) ?? 0;
    const suicidalBehavior = yesNumbers.has(6);
    let severity = "No recent suicidal ideation or behavior endorsed";
    if (highestIdeationLevel === 1) severity = "Passive wish to be dead endorsed";
    if (highestIdeationLevel === 2) severity = "Active suicidal ideation endorsed";
    if (highestIdeationLevel === 3) severity = "Suicidal ideation with method endorsed";
    if (highestIdeationLevel === 4) severity = "Suicidal ideation with intent endorsed";
    if (highestIdeationLevel === 5) severity = "Suicidal ideation with plan and intent endorsed";
    if (suicidalBehavior) {
      severity = highestIdeationLevel > 0 ? `${severity}; suicidal behavior/preparation also endorsed` : "Suicidal behavior/preparation endorsed without current ideation items";
    }
    const difficulty = [
      `Highest recent ideation level: ${highestIdeationLevel}/5`,
      suicidalBehavior ? "Behavior item 6: Yes" : "Behavior item 6: No"
    ].join(" \xB7 ");
    return { totalScore, severity, difficulty };
  }
  function extractCssrsFromRoot(root = document) {
    const items = [];
    const rows = root.querySelectorAll("tbody tr.et-tr");
    for (const row of Array.from(rows)) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 3) continue;
      const firstCell = cells[0];
      const questionNumEl = firstCell.querySelector(".question-number");
      if (!questionNumEl) continue;
      const number = parseInt(questionNumEl.textContent?.replace(".", "") ?? "0", 10);
      if (!number) continue;
      const questionText = firstCell.querySelector(".question-number + div p")?.textContent?.trim() ?? "";
      const response = cells[1]?.querySelector(".cell-container p")?.textContent?.trim() ?? "";
      const lastResponse = cells[2]?.querySelector(".cell-container p")?.textContent?.trim() ?? "";
      items.push({
        number,
        question: questionText,
        response,
        score: isAffirmativeAssessmentResponse(response) ? 1 : 0,
        maxScore: 1,
        lastResponse: lastResponse === "--" ? "" : lastResponse
      });
    }
    const summary = summarizeCssrs(items);
    return {
      name: "C-SSRS",
      totalScore: summary.totalScore,
      severity: summary.severity,
      items,
      difficulty: summary.difficulty,
      capturedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function classifyDassSeverity(score, thresholds) {
    if (score <= thresholds[0]) return "normal";
    if (score <= thresholds[1]) return "mild";
    if (score <= thresholds[2]) return "moderate";
    if (score <= thresholds[3]) return "severe";
    return "extremely severe";
  }
  function summarizeDass21(items) {
    const groups = {
      Depression: [3, 5, 10, 13, 16, 17, 21],
      Anxiety: [2, 4, 7, 9, 15, 19, 20],
      Stress: [1, 6, 8, 11, 12, 14, 18]
    };
    const totals = Object.entries(groups).map(([label, itemNumbers]) => {
      const raw = items.filter((item) => itemNumbers.includes(item.number)).reduce((sum, item) => sum + item.score, 0);
      const scaled = raw * 2;
      const severity = label === "Depression" ? classifyDassSeverity(scaled, [9, 13, 20, 27]) : label === "Anxiety" ? classifyDassSeverity(scaled, [7, 9, 14, 19]) : classifyDassSeverity(scaled, [14, 18, 25, 33]);
      return { label, raw, scaled, severity };
    });
    return {
      totalScore: items.reduce((sum, item) => sum + item.score, 0),
      severity: totals.map((entry) => `${entry.label} ${entry.severity}`).join(" \xB7 "),
      difficulty: totals.map((entry) => `${entry.label}: ${entry.scaled}`).join(" \xB7 ")
    };
  }
  function extractAssessmentFromRoot(name, root = document) {
    if (name === "C-SSRS") {
      return extractCssrsFromRoot(root);
    }
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
    if (name === "DASS-21") {
      const summary = summarizeDass21(items);
      return {
        name,
        totalScore: summary.totalScore,
        severity: summary.severity,
        items,
        difficulty: summary.difficulty,
        capturedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    return { name, totalScore, severity, items, difficulty, capturedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  async function fetchAssessmentsFromLinks() {
    const result = {
      gad7: null,
      phq9: null,
      cssrs: null,
      dass21: null
    };
    const uniqueLinks = await discoverIntakeNoteUrls();
    if (uniqueLinks.length === 0) {
      console.log("[SPN] Auto-capture found no sibling intake-note URLs on this page");
      return result;
    }
    console.log("[SPN] Auto-capture candidate intake-note URLs:", uniqueLinks);
    for (const url of uniqueLinks) {
      if (result.gad7 && result.phq9 && result.cssrs && result.dass21) break;
      try {
        const absUrl = toAbsoluteUrl(url);
        if (!absUrl) continue;
        console.log(`[SPN] Opening background tab for assessment: ${absUrl}`);
        const response = await chrome.runtime.sendMessage({
          type: "SPN_FETCH_ASSESSMENT_VIA_TAB",
          url: absUrl
        });
        if (!response?.type || !response.assessment) {
          console.log(`[SPN] No assessment found in background tab for ${url}`);
          continue;
        }
        const { type, assessment } = response;
        if (type === "GAD-7" && !result.gad7) result.gad7 = assessment;
        else if (type === "PHQ-9" && !result.phq9) result.phq9 = assessment;
        else if (type === "DASS-21" && !result.dass21) result.dass21 = assessment;
        else if (type === "C-SSRS" && !result.cssrs) result.cssrs = assessment;
        const detail = type === "C-SSRS" ? assessment.severity : `score ${assessment.totalScore}`;
        console.log(`[SPN] Captured ${type} from background tab: ${detail}`);
      } catch (err) {
        console.warn(`[SPN] Background-tab assessment extraction failed for ${url}:`, err);
      }
    }
    if (!result.gad7 || !result.phq9 || !result.cssrs || !result.dass21) {
      console.log("[SPN] Auto-capture missing assessments:", {
        missing: [
          !result.gad7 ? "GAD-7" : "",
          !result.phq9 ? "PHQ-9" : "",
          !result.dass21 ? "DASS-21" : "",
          !result.cssrs ? "C-SSRS" : ""
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
      const updates = type === "GAD-7" ? { gad7: result } : type === "PHQ-9" ? { phq9: result } : type === "DASS-21" ? { dass21: result } : { cssrs: result };
      await mergeIntake(updates);
      const message = type === "C-SSRS" ? `Captured ${type}: ${result.severity}` : `Captured ${type}: score ${result.totalScore} (${result.severity})`;
      showToast(message, "success");
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
  function isTreatmentPlanPage() {
    return /\/clients\/[^/]+\/diagnosis_treatment_plans\//.test(window.location.pathname);
  }
  function extractTreatmentPlanData() {
    const plan = { ...EMPTY_TREATMENT_PLAN };
    plan.clientId = getClientIdFromUrl();
    plan.sourceUrl = window.location.href;
    const diagEls = document.querySelectorAll("ul.diagnoses li div");
    plan.diagnoses = Array.from(diagEls).map((el) => {
      const text = (el.textContent ?? "").trim();
      const match = text.match(/^([A-Z]\d[\d.]*)\s*-\s*(.+)$/);
      return match ? { code: match[1], description: match[2].trim() } : { code: "", description: text };
    }).filter((d) => d.description);
    const markdown = document.querySelector(".markdown");
    if (markdown) {
      const sections = parseTreatmentPlanMarkdown(markdown);
      plan.presentingProblem = sections.presentingProblem;
      plan.clientStrengths = sections.clientStrengths;
      plan.clientRisks = sections.clientRisks;
      plan.goals = sections.goals;
      plan.interventions = sections.interventions;
      plan.treatmentType = sections.treatmentType;
      plan.estimatedLength = sections.estimatedLength;
      plan.medicalNecessity = sections.medicalNecessity;
    }
    const freqEl = document.querySelector(".treatment-frequency .field span");
    plan.treatmentFrequency = freqEl?.textContent?.trim() ?? "";
    const dateEl = document.querySelector(".date-time span");
    plan.dateAssigned = dateEl?.textContent?.trim() ?? "";
    plan.capturedAt = (/* @__PURE__ */ new Date()).toISOString();
    return plan;
  }
  function parseTreatmentPlanMarkdown(container) {
    const result = {
      presentingProblem: "",
      clientStrengths: "",
      clientRisks: "",
      goals: [],
      interventions: [],
      treatmentType: "",
      estimatedLength: "",
      medicalNecessity: []
    };
    const children = Array.from(container.children);
    let currentSection = "";
    let currentGoal = null;
    let currentObjectiveId = "";
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent ?? "").trim();
      const id = el.id || "";
      if (tag === "h3" || tag === "h2") {
        const lower = text.toLowerCase().replace(/:$/, "");
        if (lower.includes("presenting problem")) {
          currentSection = "presenting-problem";
          continue;
        }
        if (lower.includes("client strengths")) {
          currentSection = "strengths";
          continue;
        }
        if (lower.includes("client risks")) {
          currentSection = "risks";
          continue;
        }
        if (lower.includes("interventions")) {
          currentSection = "interventions";
          continue;
        }
        if (lower.includes("treatment approach")) {
          currentSection = "treatment-approach";
          continue;
        }
        if (lower.includes("medical necessity")) {
          currentSection = "medical-necessity";
          continue;
        }
        const goalMatch = lower.match(/^goal\s*(\d+)/);
        if (goalMatch) {
          if (currentGoal) result.goals.push(currentGoal);
          currentGoal = {
            goalNumber: parseInt(goalMatch[1]),
            goal: "",
            estimatedCompletion: "",
            status: "",
            objectives: []
          };
          currentSection = "goal";
          continue;
        }
        const objMatch = lower.match(/^objective\s*(\d+[a-z])/);
        if (objMatch) {
          currentObjectiveId = objMatch[1].toUpperCase();
          currentSection = "objective";
          continue;
        }
        if (lower.includes("goals and objectives")) {
          currentSection = "goals-header";
          continue;
        }
      }
      if (tag === "p") {
        const pText = text;
        const labelMatch = pText.match(/^(.+?):\s*(.+)$/);
        if (labelMatch) {
          const label = labelMatch[1].toLowerCase();
          const value = labelMatch[2].trim();
          if (currentSection === "goal" && currentGoal) {
            if (label === "goal") currentGoal.goal = value;
            else if (label.includes("estimated")) currentGoal.estimatedCompletion = value;
            else if (label === "status") currentGoal.status = value;
            continue;
          }
          if (currentSection === "objective" && currentGoal) {
            if (label === "objective") {
              currentGoal.objectives.push({
                id: currentObjectiveId,
                objective: value,
                estimatedCompletion: ""
              });
            } else if (label.includes("estimated") && currentGoal.objectives.length > 0) {
              currentGoal.objectives[currentGoal.objectives.length - 1].estimatedCompletion = value;
            }
            continue;
          }
          if (currentSection === "treatment-approach") {
            if (label.includes("treatment type")) result.treatmentType = value;
            else if (label.includes("estimated length")) result.estimatedLength = value;
            continue;
          }
        }
        if (currentSection === "presenting-problem") {
          result.presentingProblem += (result.presentingProblem ? "\n" : "") + pText;
        }
      }
      if (tag === "ul") {
        const items = Array.from(el.querySelectorAll("li")).map((li) => (li.textContent ?? "").trim()).filter(Boolean);
        if (currentSection === "strengths") {
          result.clientStrengths = items.join("\n");
        } else if (currentSection === "risks") {
          result.clientRisks = items.join("\n");
        } else if (currentSection === "interventions") {
          result.interventions = items.map((item) => {
            return item.split("\n")[0].trim();
          });
        } else if (currentSection === "medical-necessity") {
          result.medicalNecessity = items;
        }
      }
    }
    if (currentGoal) result.goals.push(currentGoal);
    return result;
  }
  async function handleCaptureTreatmentPlan() {
    try {
      assertExtensionContext();
      showToast("Capturing treatment plan...", "success");
      const plan = extractTreatmentPlanData();
      const diagCount = plan.diagnoses.length;
      const goalCount = plan.goals.length;
      if (diagCount === 0 && goalCount === 0 && !plan.presentingProblem) {
        showToast("No treatment plan data found on this page.", "error");
        return;
      }
      await saveTreatmentPlan(plan);
      const parts = [];
      if (diagCount) parts.push(`${diagCount} diagnoses`);
      if (goalCount) parts.push(`${goalCount} goals`);
      if (plan.interventions.length) parts.push(`${plan.interventions.length} interventions`);
      showToast(`Captured treatment plan: ${parts.join(", ")}`, "success");
      console.groupCollapsed(`[SPN] Captured treatment plan (${parts.join(", ")})`);
      console.log("[SPN] Treatment plan:", plan);
      console.groupEnd();
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        showToast("Extension reloaded \u2014 please refresh this page.", "error");
      } else {
        console.error("[SPN] Treatment plan capture error:", err);
        showToast("Failed to capture treatment plan.", "error");
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
      if (assessments.cssrs) intake.cssrs = assessments.cssrs;
      if (assessments.dass21) intake.dass21 = assessments.dass21;
      await mergeIntake(intake);
      const extras = [];
      if (assessments.gad7) extras.push(`GAD-7: ${assessments.gad7.totalScore}`);
      if (assessments.phq9) extras.push(`PHQ-9: ${assessments.phq9.totalScore}`);
      if (assessments.dass21) extras.push(`DASS-21: ${assessments.dass21.totalScore}`);
      if (assessments.cssrs) extras.push(`C-SSRS: ${assessments.cssrs.totalScore} yes`);
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
  async function handleOverviewCaptureClick() {
    try {
      assertExtensionContext();
      showToast("Capturing overview, intake form, and assessments...", "success");
      const clicked = await expandReadMoreSections();
      const overviewClinicalNote = collectOverviewClinicalNotes();
      const intakeNoteUrls = await discoverIntakeNoteUrls();
      const [assessments, intakeFromTab] = await Promise.all([
        fetchAssessmentsFromLinks(),
        fetchIntakeFormViaTab(intakeNoteUrls)
      ]);
      const overviewName = extractClientNameFromPage();
      const overviewDob = extractDobFromPage();
      const partial = {
        ...intakeFromTab ?? {},
        clientId: getClientIdFromUrl(),
        capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
        overviewClinicalNote
      };
      if (!partial.fullName && overviewName.fullName) partial.fullName = overviewName.fullName;
      if (!partial.firstName && overviewName.firstName) partial.firstName = overviewName.firstName;
      if (!partial.lastName && overviewName.lastName) partial.lastName = overviewName.lastName;
      if (!partial.dob && overviewDob) partial.dob = overviewDob;
      if (assessments.gad7) partial.gad7 = assessments.gad7;
      if (assessments.phq9) partial.phq9 = assessments.phq9;
      if (assessments.cssrs) partial.cssrs = assessments.cssrs;
      if (assessments.dass21) partial.dass21 = assessments.dass21;
      const hasProfileData = !!partial.fullName || !!partial.firstName || !!partial.dob || !!overviewClinicalNote || !!intakeFromTab || !!assessments.gad7 || !!assessments.phq9 || !!assessments.dass21 || !!assessments.cssrs;
      if (!hasProfileData) {
        showToast("No overview note or assessment data found on this page.", "error");
        return;
      }
      await mergeIntake(partial);
      const extras = [];
      if (intakeFromTab) extras.push(`intake form (${intakeFromTab.rawQA?.length ?? 0} Q&A)`);
      if (overviewClinicalNote) extras.push(`${overviewClinicalNote.split(/\n\n+/).length} note block(s)`);
      if (assessments.gad7) extras.push(`GAD-7 ${assessments.gad7.totalScore}`);
      if (assessments.phq9) extras.push(`PHQ-9 ${assessments.phq9.totalScore}`);
      if (assessments.dass21) extras.push(`DASS-21 ${assessments.dass21.totalScore}`);
      if (assessments.cssrs) extras.push(`C-SSRS ${assessments.cssrs.totalScore} yes`);
      if (clicked) extras.push(`expanded ${clicked} "Read More" section(s)`);
      const name = partial.fullName || [partial.firstName, partial.lastName].filter(Boolean).join(" ") || "client";
      showToast(`Captured overview prep for ${name}${extras.length ? `: ${extras.join(", ")}` : ""}`, "success");
      console.groupCollapsed(`[SPN] Captured overview prep for ${name}`);
      console.log("[SPN] Overview partial:", partial);
      console.log("[SPN] Overview clinical note:", overviewClinicalNote);
      console.log("[SPN] Intake from background tab:", intakeFromTab);
      console.log("[SPN] Assessments:", assessments);
      console.groupEnd();
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        showToast("Extension reloaded \u2014 please refresh this page.", "error");
      } else {
        console.error("[SPN] Overview capture error:", err);
        showToast("Failed to capture overview prep.", "error");
      }
    }
  }
  async function fetchIntakeFormViaTab(intakeNoteUrls) {
    let best = null;
    let bestQACount = 0;
    for (const url of intakeNoteUrls) {
      try {
        const absUrl = toAbsoluteUrl(url);
        if (!absUrl) continue;
        console.log(`[SPN] Trying to extract intake form from background tab: ${absUrl}`);
        const response = await chrome.runtime.sendMessage({
          type: "SPN_FETCH_INTAKE_VIA_TAB",
          url: absUrl
        });
        if (response?.intake) {
          const qaCount = response.intake.rawQA?.length ?? 0;
          console.log(`[SPN] Got intake form data from ${absUrl}: ${qaCount} Q&A pairs`);
          if (qaCount > bestQACount) {
            best = response.intake;
            bestQACount = qaCount;
          }
        }
      } catch (err) {
        console.warn(`[SPN] Background-tab intake extraction failed for ${url}:`, err);
      }
    }
    if (best) {
      console.log(`[SPN] Selected intake form with ${bestQACount} Q&A pairs`);
    }
    return best;
  }
  function hasIntakeForm() {
    return !!document.querySelector(".markdown.intake-answers");
  }
  function hasOverviewReadMoreContent() {
    return isClientOverviewPage() && !!document.querySelector("[data-readmore-toggle], [data-test-shared-read-more], [data-readmore].markdown");
  }
  var CAPTURE_BUTTON_IDS = [
    "spn-capture-btn",
    "spn-treatment-plan-btn",
    "spn-assessment-btn",
    "spn-overview-btn"
  ];
  function removeCaptureButtons(exceptId = "") {
    for (const id of CAPTURE_BUTTON_IDS) {
      if (id === exceptId) continue;
      document.getElementById(id)?.remove();
    }
  }
  function injectCaptureButton() {
    if (!isClientPage()) {
      removeCaptureButtons();
      return;
    }
    if (hasAssessmentTable()) {
      removeCaptureButtons("spn-assessment-btn");
      if (document.getElementById("spn-assessment-btn")) return;
      const type = detectAssessmentType();
      injectButton(`Capture ${type}`, handleAssessmentCapture, {
        id: "spn-assessment-btn",
        position: "bottom-right"
      });
      return;
    }
    if (isTreatmentPlanPage()) {
      removeCaptureButtons("spn-treatment-plan-btn");
      if (document.getElementById("spn-treatment-plan-btn")) return;
      injectButton("Capture Treatment Plan", handleCaptureTreatmentPlan, {
        id: "spn-treatment-plan-btn",
        position: "bottom-right"
      });
      return;
    }
    if (hasOverviewReadMoreContent()) {
      removeCaptureButtons("spn-overview-btn");
      if (document.getElementById("spn-overview-btn")) return;
      injectButton("Capture Overview Prep", handleOverviewCaptureClick, {
        id: "spn-overview-btn",
        position: "bottom-right"
      });
      return;
    }
    removeCaptureButtons("spn-capture-btn");
    if (document.getElementById("spn-capture-btn")) return;
    if (!hasIntakeForm()) {
      removeCaptureButtons();
      return;
    }
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
    const hasAnyCaptureButton = !!document.getElementById("spn-capture-btn") || !!document.getElementById("spn-treatment-plan-btn") || !!document.getElementById("spn-assessment-btn") || !!document.getElementById("spn-overview-btn");
    if (isClientPage() && !hasAnyCaptureButton && retryCount < MAX_RETRIES) {
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
    if (msg?.type === "SPN_EXTRACT_ASSESSMENT") {
      const type = detectAssessmentType();
      if (!type) {
        sendResponse({ type: null, assessment: null });
        return true;
      }
      const assessment = extractAssessmentFromRoot(type);
      sendResponse({ type, assessment: assessment.items.length > 0 ? assessment : null });
      return true;
    }
    if (msg?.type === "SPN_EXTRACT_INTAKE") {
      if (!hasIntakeForm()) {
        sendResponse({ intake: null });
        return true;
      }
      const intake = extractIntakeData();
      const fieldCount = countCapturedFields(intake);
      sendResponse({ intake: fieldCount > 0 ? intake : null });
      return true;
    }
  });
})();
//# sourceMappingURL=extract-intake.js.map
