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
  var EMPTY_DIAGNOSTIC_WORKSPACE = {
    pinnedDisorderIds: [],
    activeDisorderId: null,
    overrides: [],
    disorderNotes: [],
    finalizedImpressions: [],
    updatedAt: ""
  };
  var DEFAULT_MSE_CHECKLIST = {
    appearance: ["well-groomed", "casually dressed", "appropriate hygiene"],
    behavior: ["cooperative", "good eye contact", "psychomotor normal"],
    speech: ["normal rate", "normal volume", "coherent"],
    mood: "",
    affect: ["congruent", "full range"],
    thoughtProcess: ["linear", "goal-directed"],
    thoughtContent: ["no SI", "no HI", "no delusions"],
    perceptions: ["no hallucinations"],
    cognition: ["alert", "oriented x4", "intact memory"],
    insight: "good",
    judgment: "good",
    updatedAt: ""
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
  var EMPTY_SESSION_TRANSCRIPT = {
    apptId: "",
    entries: [],
    updatedAt: ""
  };
  var EMPTY_SOAP_DRAFT = {
    apptId: "",
    clientName: "",
    sessionDate: "",
    cptCode: "90837",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    sessionNotes: "",
    transcript: "",
    treatmentPlanId: "",
    generatedAt: "",
    editedAt: "",
    status: "draft",
    generationMethod: ""
  };
  var EMPTY_SESSION_NOTES = {
    apptId: "",
    notes: "",
    updatedAt: ""
  };
  var DEFAULT_PREFERENCES = {
    providerFirstName: "Anders",
    providerLastName: "Chan",
    defaultLocation: "Video Office",
    firstVisitCPT: "90791",
    followUpCPT: "90837",
    llmProvider: "ollama",
    ollamaModel: "llama3.2:3b",
    ollamaEndpoint: "http://localhost:11434",
    openaiApiKey: "",
    openaiModel: "gpt-4o-mini",
    autoGenerateOnSessionEnd: true
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
  function collectTopicLines(lines, patterns, limit = 4) {
    return unique(
      lines.filter((line) => patterns.some((pattern) => pattern.test(line)))
    ).slice(0, limit);
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
      collectMatchingLines(
        lines,
        /\b(surger(?:y|ies)|appendectomy|tonsillectomy|c-section|cesarean|acl|labrum|meniscus|rotator cuff|shoulder surgery|knee surgery|back surgery|hip surgery)\b/i,
        4
      )
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
      collectMatchingLines(lines, /\b(want to|want better|meet regularly|more actionable|cope|cbt|dynamic|act|drink less|stop drinking|move forward|anger management|exercise|breathe|breathing)\b/i, 6)
    );
    return counselingGoals ? { counselingGoals } : {};
  }
  function extractRecentSymptoms(lines) {
    const recentSymptoms = joinLines(
      collectMatchingLines(
        lines,
        /\b(anxious|anxiety|insomnia|stomach pain|queasy|nausea|flashback|dissociation|foggy|fogginess|trouble concentrating|sleep disturbance|hopelessness|shock|anger|angry|irritable|yell(?:ed|ing)?|jealous|defensive|relationship stress|attachment)\b/i,
        10
      )
    );
    return recentSymptoms ? { recentSymptoms } : {};
  }
  function extractRelationshipDescription(lines) {
    const relationshipDescription = joinLines(
      collectTopicLines(
        lines,
        [
          /\b(girlfriend|boyfriend|partner|wife|husband|spouse|ex\b|relationship|dating|marriage|engage(?:d|ment)?|breakup|divorce|attachment|jealous)\b/i
        ],
        5
      )
    );
    return relationshipDescription ? { relationshipDescription } : {};
  }
  function extractSubstanceUse(lines) {
    const alcoholLines = collectTopicLines(
      lines,
      [
        /\b(alcohol|drink(?:ing)?|drank|beer|wine|liquor|vodka|tequila|patron|soju)\b/i,
        /\bstop drinking\b/i,
        /\bdrink less\b/i
      ],
      4
    );
    const drugLines = collectTopicLines(
      lines,
      [
        /\b(weed|marijuana|cannabis|joint|blunt|thc|vape|nicotine|cigarette|cocaine|crack|meth|adderall|xanax|opioid|pill|mushroom|mushrooms|shroom|lsd)\b/i
      ],
      4
    );
    const substanceUseHistory = joinLines([...alcoholLines, ...drugLines]);
    return {
      alcoholUse: joinLines(alcoholLines),
      drugUse: joinLines(drugLines),
      substanceUseHistory
    };
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
      ...extractRecentSymptoms(lines),
      ...extractRelationshipDescription(lines),
      ...extractSubstanceUse(lines)
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
      recentSymptoms: pickString(intake.recentSymptoms, derived.recentSymptoms),
      relationshipDescription: pickString(intake.relationshipDescription, derived.relationshipDescription),
      alcoholUse: pickString(intake.alcoholUse, derived.alcoholUse),
      drugUse: pickString(intake.drugUse, derived.drugUse),
      substanceUseHistory: pickString(intake.substanceUseHistory, derived.substanceUseHistory)
    };
  }

  // src/lib/storage.ts
  var INTAKE_KEY = "spn_intake";
  var NOTE_KEY = "spn_note";
  var DIAGNOSTIC_WORKSPACE_KEY = "spn_diagnostic_workspace";
  var PREFS_KEY = "spn_preferences";
  var SESSION_NOTES_KEY = "spn_session_notes";
  var TREATMENT_PLAN_KEY = "spn_treatment_plan";
  var SOAP_DRAFT_KEY = "spn_soap_draft";
  var TRANSCRIPT_KEY = "spn_transcript";
  var MSE_CHECKLIST_KEY = "spn_mse_checklist";
  var DEID_MAPPING_KEY = "spn_deid_mapping";
  var SUPERVISION_PREP_KEY = "spn_supervision_prep";
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
  function normalizeDiagnosticImpression(impression) {
    return {
      disorderId: impression?.disorderId ?? "",
      code: impression?.code ?? "",
      name: impression?.name ?? "",
      confidence: impression?.confidence ?? "low",
      diagnosticReasoning: impression?.diagnosticReasoning?.trim() ?? "",
      criteriaEvidence: Array.isArray(impression?.criteriaEvidence) ? impression.criteriaEvidence : [],
      criteriaSummary: Array.isArray(impression?.criteriaSummary) ? impression.criteriaSummary : [],
      ruleOuts: Array.isArray(impression?.ruleOuts) ? impression.ruleOuts : [],
      clinicianNotes: impression?.clinicianNotes?.trim() ?? ""
    };
  }
  function normalizeNote(note) {
    const treatmentPlan = note?.treatmentPlan;
    return {
      ...EMPTY_PROGRESS_NOTE,
      ...note,
      mentalStatusExam: {
        ...EMPTY_PROGRESS_NOTE.mentalStatusExam,
        ...note?.mentalStatusExam ?? {}
      },
      treatmentPlan: {
        ...EMPTY_PROGRESS_NOTE.treatmentPlan,
        ...treatmentPlan ?? {},
        goals: Array.isArray(treatmentPlan?.goals) ? treatmentPlan.goals : [],
        interventions: Array.isArray(treatmentPlan?.interventions) ? treatmentPlan.interventions : []
      },
      diagnosticImpressions: Array.isArray(note?.diagnosticImpressions) ? note.diagnosticImpressions.map((impression) => normalizeDiagnosticImpression(impression)) : [],
      status: {
        ...EMPTY_PROGRESS_NOTE.status,
        ...note?.status ?? {}
      }
    };
  }
  function normalizeDiagnosticWorkspace(workspace) {
    return {
      ...EMPTY_DIAGNOSTIC_WORKSPACE,
      ...workspace,
      pinnedDisorderIds: Array.isArray(workspace?.pinnedDisorderIds) ? workspace.pinnedDisorderIds : [],
      activeDisorderId: workspace?.activeDisorderId ?? null,
      overrides: Array.isArray(workspace?.overrides) ? workspace.overrides.map((override) => ({
        disorderId: override?.disorderId ?? "",
        criterionId: override?.criterionId ?? "",
        status: override?.status ?? "not_assessed",
        notes: override?.notes?.trim() ?? "",
        updatedAt: override?.updatedAt ?? ""
      })) : [],
      disorderNotes: Array.isArray(workspace?.disorderNotes) ? workspace.disorderNotes.map((entry) => ({
        disorderId: entry?.disorderId ?? "",
        notes: entry?.notes?.trim() ?? ""
      })) : [],
      finalizedImpressions: Array.isArray(workspace?.finalizedImpressions) ? workspace.finalizedImpressions.map((impression) => normalizeDiagnosticImpression(impression)) : []
    };
  }
  function normalizeSoapDraft(draft) {
    return {
      ...EMPTY_SOAP_DRAFT,
      ...draft,
      sessionNotes: draft?.sessionNotes?.trim() ?? "",
      transcript: draft?.transcript?.trim() ?? "",
      subjective: draft?.subjective?.trim() ?? "",
      objective: draft?.objective?.trim() ?? "",
      assessment: draft?.assessment?.trim() ?? "",
      plan: draft?.plan?.trim() ?? "",
      generatedAt: draft?.generatedAt ?? "",
      editedAt: draft?.editedAt ?? draft?.generatedAt ?? "",
      status: draft?.status ?? "draft"
    };
  }
  function normalizeTranscriptEntry(entry) {
    return {
      speaker: entry?.speaker ?? "unknown",
      text: entry?.text?.trim() ?? "",
      timestamp: entry?.timestamp ?? ""
    };
  }
  function normalizeTranscript(transcript) {
    return {
      ...EMPTY_SESSION_TRANSCRIPT,
      ...transcript,
      entries: Array.isArray(transcript?.entries) ? transcript.entries.map((entry) => normalizeTranscriptEntry(entry)).filter((entry) => entry.text) : []
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
  async function getIntake() {
    const intake = await getStoredIntake();
    return intake ? augmentIntakeWithManualNotes(intake) : null;
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
  async function saveNote(note) {
    await chrome.storage.session.set({ [NOTE_KEY]: normalizeNote(note) });
  }
  async function getNote() {
    const result = await chrome.storage.session.get(NOTE_KEY);
    const note = result[NOTE_KEY];
    return note ? normalizeNote(note) : null;
  }
  async function getDiagnosticWorkspace() {
    const result = await chrome.storage.session.get(DIAGNOSTIC_WORKSPACE_KEY);
    const workspace = result[DIAGNOSTIC_WORKSPACE_KEY];
    return workspace ? normalizeDiagnosticWorkspace(workspace) : null;
  }
  function normalizePreferences(prefs) {
    return {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      providerFirstName: prefs?.providerFirstName?.trim() || DEFAULT_PREFERENCES.providerFirstName,
      providerLastName: prefs?.providerLastName?.trim() || DEFAULT_PREFERENCES.providerLastName,
      defaultLocation: prefs?.defaultLocation?.trim() || DEFAULT_PREFERENCES.defaultLocation,
      firstVisitCPT: prefs?.firstVisitCPT?.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
      followUpCPT: prefs?.followUpCPT?.trim() || DEFAULT_PREFERENCES.followUpCPT,
      llmProvider: prefs?.llmProvider || DEFAULT_PREFERENCES.llmProvider,
      openaiApiKey: prefs?.openaiApiKey?.trim() || "",
      openaiModel: prefs?.openaiModel?.trim() || DEFAULT_PREFERENCES.openaiModel
    };
  }
  async function getPreferences() {
    const result = await chrome.storage.local.get(PREFS_KEY);
    return normalizePreferences(result[PREFS_KEY]);
  }
  async function savePreferences(prefs) {
    await chrome.storage.local.set({ [PREFS_KEY]: normalizePreferences(prefs) });
  }
  async function hasPreferences() {
    const result = await chrome.storage.local.get(PREFS_KEY);
    return !!result[PREFS_KEY];
  }
  async function getTreatmentPlan() {
    const result = await chrome.storage.session.get(TREATMENT_PLAN_KEY);
    const plan = result[TREATMENT_PLAN_KEY];
    return plan ? { ...EMPTY_TREATMENT_PLAN, ...plan } : null;
  }
  async function saveSoapDraft(draft) {
    await chrome.storage.session.set({ [SOAP_DRAFT_KEY]: normalizeSoapDraft(draft) });
  }
  async function getSoapDraft() {
    const result = await chrome.storage.session.get(SOAP_DRAFT_KEY);
    const draft = result[SOAP_DRAFT_KEY];
    return draft ? normalizeSoapDraft(draft) : null;
  }
  async function getTranscript(apptId) {
    const result = await chrome.storage.session.get(TRANSCRIPT_KEY);
    const transcript = result[TRANSCRIPT_KEY];
    if (!transcript || transcript.apptId !== apptId) return null;
    return normalizeTranscript(transcript);
  }
  async function getSessionNotes(apptId) {
    const result = await chrome.storage.session.get(SESSION_NOTES_KEY);
    const notes = result[SESSION_NOTES_KEY];
    if (!notes || notes.apptId !== apptId) return null;
    return { ...EMPTY_SESSION_NOTES, ...notes };
  }
  async function saveSessionNotes(notes) {
    await chrome.storage.session.set({ [SESSION_NOTES_KEY]: notes });
  }
  async function getMseChecklist() {
    const result = await chrome.storage.session.get(MSE_CHECKLIST_KEY);
    const checklist = result[MSE_CHECKLIST_KEY];
    return checklist ? { ...DEFAULT_MSE_CHECKLIST, ...checklist } : null;
  }
  var REFERENCE_LIBRARY_KEY = "spn_reference_library";
  async function getReferenceLibrary() {
    const result = await chrome.storage.local.get(REFERENCE_LIBRARY_KEY);
    const files = result[REFERENCE_LIBRARY_KEY];
    return Array.isArray(files) ? files : [];
  }
  async function addReferenceFile(file) {
    const existing = await getReferenceLibrary();
    const filtered = existing.filter((f) => f.id !== file.id);
    filtered.push(file);
    await chrome.storage.local.set({ [REFERENCE_LIBRARY_KEY]: filtered });
  }
  async function removeReferenceFile(id) {
    const existing = await getReferenceLibrary();
    await chrome.storage.local.set({
      [REFERENCE_LIBRARY_KEY]: existing.filter((f) => f.id !== id)
    });
  }
  async function clearAll() {
    await chrome.storage.session.remove([
      INTAKE_KEY,
      NOTE_KEY,
      DIAGNOSTIC_WORKSPACE_KEY,
      SESSION_NOTES_KEY,
      TREATMENT_PLAN_KEY,
      SOAP_DRAFT_KEY,
      TRANSCRIPT_KEY,
      MSE_CHECKLIST_KEY,
      DEID_MAPPING_KEY,
      SUPERVISION_PREP_KEY
    ]);
  }

  // src/lib/clinical-knowledge.ts
  var INDEX_PATH = "assets/clinical-knowledge/index.json";
  var manifestCache = {};
  var indexCache = {};
  var resourceCache = /* @__PURE__ */ new Map();
  function normalizeTerm(term) {
    return term.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  }
  function tokenize(query) {
    return normalizeTerm(query).split(" ").filter((term) => term.length >= 3);
  }
  async function loadJson(path) {
    if (!chrome.runtime?.id) {
      delete manifestCache.promise;
      delete indexCache.promise;
      resourceCache.clear();
      throw new Error("Extension context invalidated \u2014 reload the page to retry");
    }
    const url = chrome.runtime.getURL(path);
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      throw new Error(`Failed to load ${path}: ${resp.status}`);
    }
    return resp.json();
  }
  function loadClinicalKnowledgeIndex() {
    indexCache.promise ??= loadJson(INDEX_PATH);
    return indexCache.promise;
  }
  function scoreChunk(tokens, chunk) {
    if (!tokens.length) return 0;
    const haystack = normalizeTerm(
      [chunk.heading, chunk.preview, chunk.tags.join(" "), chunk.text.slice(0, 1500)].join(" ")
    );
    let score = 0;
    for (const token of tokens) {
      if (!haystack.includes(token)) continue;
      score += 1;
      if (chunk.heading && normalizeTerm(chunk.heading).includes(token)) score += 2;
      if (chunk.tags.some((tag) => normalizeTerm(tag).includes(token))) score += 2;
      if (normalizeTerm(chunk.preview).includes(token)) score += 1;
    }
    return score;
  }
  function scoreIndexEntry(tokens, entry) {
    const chunkScore = scoreChunk(tokens, { ...entry.chunk, text: "" });
    const resourceHaystack = normalizeTerm(
      `${entry.resourceTitle} ${entry.resourceModality}`
    );
    let score = chunkScore;
    for (const token of tokens) {
      if (resourceHaystack.includes(token)) score += 2;
    }
    return score;
  }
  function chunkMarkdown(file) {
    const lines = file.content.split("\n");
    const entries = [];
    let currentHeading = file.filename.replace(/\.[^.]+$/, "");
    let currentText = [];
    let chunkIndex = 0;
    function flushChunk() {
      const text = currentText.join("\n").trim();
      if (!text) return;
      const preview = text.slice(0, 200);
      const tags = normalizeTerm(currentHeading).split(" ").filter((w) => w.length >= 3);
      entries.push({
        resourceId: file.id,
        resourceTitle: file.filename,
        resourceModality: "user-upload",
        chunk: {
          id: `${file.id}-c${chunkIndex}`,
          pageStart: chunkIndex,
          pageEnd: chunkIndex,
          heading: currentHeading,
          preview,
          tags,
          estimatedTokens: Math.ceil(text.length / 4)
        }
      });
      chunkIndex++;
    }
    for (const line of lines) {
      const headingMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headingMatch) {
        flushChunk();
        currentHeading = headingMatch[1].trim();
        currentText = [];
      } else {
        currentText.push(line);
      }
    }
    flushChunk();
    return entries;
  }
  async function getUserUploadEntries() {
    try {
      const files = await getReferenceLibrary();
      return files.flatMap((file) => chunkMarkdown(file));
    } catch {
      return [];
    }
  }
  async function searchClinicalKnowledge(query, options = {}) {
    const tokens = tokenize(query);
    if (!tokens.length) return [];
    const resourceIds = options.resourceIds?.length ? options.resourceIds : null;
    const results = [];
    try {
      const index = await loadClinicalKnowledgeIndex();
      for (const entry of index.entries) {
        if (resourceIds && !resourceIds.includes(entry.resourceId)) continue;
        const chunk = { ...entry.chunk, text: "" };
        const score = scoreIndexEntry(tokens, entry);
        if (score <= 0) continue;
        results.push({
          resourceId: entry.resourceId,
          resourceTitle: entry.resourceTitle,
          chunk,
          score
        });
      }
    } catch {
    }
    const userEntries = await getUserUploadEntries();
    for (const entry of userEntries) {
      if (resourceIds && !resourceIds.includes(entry.resourceId)) continue;
      const chunk = { ...entry.chunk, text: "" };
      const score = scoreIndexEntry(tokens, entry);
      if (score <= 0) continue;
      results.push({
        resourceId: entry.resourceId,
        resourceTitle: entry.resourceTitle,
        chunk,
        score
      });
    }
    return results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.chunk.pageStart - b.chunk.pageStart;
    }).slice(0, options.limit ?? 8);
  }

  // src/lib/clinical-guidance.ts
  var guidanceCache = /* @__PURE__ */ new Map();
  var RESOURCE_IDS = {
    caseFormulationCbt: "case-formulation-approach-cbt",
    behavioralCbt: "behavioral-interventions-cbt-2e",
    dbtAdult: "dbt-skills-training-handouts-worksheets-2e",
    dbtAdolescent: "dbt-skills-manual-adolescents",
    mi: "motivational-interviewing-helping-people-change-and-grow",
    psychoanalytic: "psychoanalytic-case-formulation",
    pdm: "psychodynamic-diagnostic-manual-pdm-3",
    asam: "asam-principles-of-addiction-medicine-7e"
  };
  function normalizeText(value) {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
  }
  function clip(value, max = 120) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length <= max) return normalized;
    return `${normalized.slice(0, max - 1).trimEnd()}...`;
  }
  function firstNonEmpty(...values) {
    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
    return "";
  }
  function joinList(items) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  }
  function unique2(items) {
    return Array.from(
      new Set(
        items.map((item) => item.trim()).filter(Boolean)
      )
    );
  }
  function splitGoals(raw) {
    return unique2(
      raw.split(/\n|;|•/).map((part) => part.trim().replace(/^[\d\-*,.\s]+/, "")).filter(Boolean)
    );
  }
  function parseAge(dob) {
    if (!dob.trim()) return null;
    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) return null;
    const now = /* @__PURE__ */ new Date();
    let age = now.getFullYear() - date.getFullYear();
    const birthdayPassed = now.getMonth() > date.getMonth() || now.getMonth() === date.getMonth() && now.getDate() >= date.getDate();
    if (!birthdayPassed) age -= 1;
    return age >= 0 ? age : null;
  }
  function hasAny(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
  }
  function pickFactors(values, max = 3) {
    return values.map((value) => clip(value ?? "")).filter(Boolean).slice(0, max);
  }
  function normalizeGenderLabel(raw) {
    const lower = raw.trim().toLowerCase();
    if (/\b(male|man|boy)\b/.test(lower)) return "male";
    if (/\b(female|woman|girl)\b/.test(lower)) return "female";
    if (/\b(non-?binary|genderqueer|genderfluid)\b/.test(lower)) return "non-binary";
    return "";
  }
  function buildEthnicityLabel(ethnicity, race) {
    const eth = ethnicity.trim();
    const r = race.trim();
    if (/^yes$/i.test(eth)) return r ? `${r} Hispanic/Latino` : "Hispanic/Latino";
    if (/^no$/i.test(eth)) return r;
    return eth || r;
  }
  function buildOccupationContext(occupation) {
    const trimmed = occupation.trim();
    if (!trimmed) return "";
    if (/unemployed|not working|out of work/i.test(trimmed)) return "currently unemployed";
    const cleaned = trimmed.replace(/^(a|an)\s+/i, "").replace(/[.]+$/, "").trim();
    if (cleaned.length > 3 && cleaned.length < 60) return `with stable employment as a ${cleaned.toLowerCase()}`;
    return "with stable employment";
  }
  function buildSubstanceContext(alcohol, drug, history) {
    const negative = /^(no|none|n\/a|na|denied|denies|negative)$/i;
    const parts = [alcohol, drug, history].map((v) => v.trim()).filter((v) => v && !negative.test(v));
    if (!parts.length) return "";
    return unique2(parts).slice(0, 2).join("; ");
  }
  function buildProfile(intake, diagnosticImpressions) {
    const diagnosisText = normalizeText(
      diagnosticImpressions.map((impression) => `${impression.name} ${impression.disorderId}`).join(" ")
    );
    const narrativeText = normalizeText(
      [
        intake.chiefComplaint,
        intake.presentingProblems,
        intake.historyOfPresentIllness,
        intake.recentSymptoms,
        intake.additionalSymptoms,
        intake.additionalInfo,
        intake.manualNotes,
        intake.suicidalIdeation,
        intake.suicideAttemptHistory,
        intake.alcoholUse,
        intake.drugUse,
        intake.substanceUseHistory,
        intake.physicalSexualAbuseHistory,
        intake.domesticViolenceHistory,
        intake.troubleSleeping,
        intake.relationshipDescription
      ].join(" ")
    );
    const age = parseAge(intake.dob);
    const hasDepression = /depress|mdd|persistent depressive/.test(diagnosisText) || /depress|hopeless|sad|anhedonia|low mood/.test(narrativeText) || (intake.phq9?.totalScore ?? 0) >= 10;
    const hasAnxiety = /anxiety|gad|panic|ocd|ptsd|stress/.test(diagnosisText) || /anxious|worry|panic|obsess|compuls|on edge|stress/.test(narrativeText) || (intake.gad7?.totalScore ?? 0) >= 10;
    const hasTrauma = /ptsd|acute stress|trauma/.test(diagnosisText) || hasAny(narrativeText, [/trauma/, /abuse/, /assault/, /violence/, /sexual assault/]);
    const hasSubstance = /alcohol|cannabis|substance|addict|opioid|use disorder/.test(diagnosisText) || hasAny(narrativeText, [/alcohol/, /drug/, /substance/, /cannabis/, /opioid/, /craving/, /withdrawal/]);
    const hasPersonality = /personality|borderline|narciss|avoidant|dependent|ocpd|antisocial/.test(diagnosisText);
    const hasSelfHarmRisk = hasAny(narrativeText, [/suicid/, /self-harm/, /cutting/, /overdose/]) || /borderline/.test(diagnosisText);
    const hasEmotionDysregulation = hasSelfHarmRisk || /emotion regulation|mood swings|labile|anger|impulsive/.test(narrativeText);
    const hasInterpersonalStrain = hasAny(narrativeText, [/relationship/, /conflict/, /attachment/, /interpersonal/]);
    const hasSleepIssue = /sleep|insomnia|hypersomnia/.test(normalizeText(`${intake.troubleSleeping} ${intake.additionalSymptoms}`));
    const hasSexualHealthConcern = /sexual dysfunction|erectile|sex therap|libido|orgasm|premature ejaculation|vaginismus|dyspareunia/.test(narrativeText) || /sexual dysfunction|erectile|sex therap/.test(diagnosisText);
    const severeSymptoms = (intake.phq9?.totalScore ?? 0) >= 15 || (intake.gad7?.totalScore ?? 0) >= 15;
    const needsMedicalCoordination = Boolean(
      intake.primaryCarePhysician.trim() || intake.prescribingMD.trim() || intake.medications.trim()
    );
    return {
      diagnoses: unique2(diagnosticImpressions.map((impression) => impression.name)).slice(0, 3),
      primaryConcern: clip(
        firstNonEmpty(
          intake.chiefComplaint,
          intake.presentingProblems,
          intake.historyOfPresentIllness,
          intake.manualNotes,
          intake.additionalSymptoms
        ),
        150
      ),
      patientGoals: splitGoals(intake.counselingGoals).slice(0, 3),
      predisposingFactors: unique2([
        ...pickFactors([intake.familyPsychiatricHistory, intake.familyMentalEmotionalHistory], 2),
        ...pickFactors([intake.physicalSexualAbuseHistory, intake.domesticViolenceHistory], 1),
        ...pickFactors([intake.developmentalHistory, intake.medicalHistory], 1)
      ]).slice(0, 4),
      precipitatingFactors: unique2([
        ...pickFactors([intake.chiefComplaint, intake.presentingProblems, intake.historyOfPresentIllness], 2),
        ...pickFactors([intake.recentSymptoms, intake.additionalSymptoms], 1)
      ]).slice(0, 4),
      perpetuatingFactors: unique2([
        ...pickFactors([intake.troubleSleeping], 1),
        ...pickFactors([intake.alcoholUse, intake.drugUse, intake.substanceUseHistory], 1),
        ...pickFactors([intake.relationshipDescription, intake.occupation], 1),
        ...pickFactors([
          intake.phq9?.difficulty ? `Depression-related impairment: ${intake.phq9.difficulty}` : "",
          intake.gad7?.difficulty ? `Anxiety-related impairment: ${intake.gad7.difficulty}` : ""
        ], 1)
      ]).slice(0, 4),
      protectiveFactors: unique2([
        ...pickFactors([intake.counselingGoals ? `Stated treatment goals: ${intake.counselingGoals}` : ""], 1),
        ...pickFactors([intake.livingArrangement, intake.relationshipDescription], 1),
        ...pickFactors([intake.priorTreatment ? `Prior treatment engagement: ${intake.priorTreatment}` : ""], 1),
        ...pickFactors([
          needsMedicalCoordination ? `Existing medical contacts: ${firstNonEmpty(intake.primaryCarePhysician, intake.prescribingMD, intake.medications)}` : ""
        ], 1)
      ]).slice(0, 4),
      severeSymptoms,
      hasDepression,
      hasAnxiety,
      hasTrauma,
      hasSubstance,
      hasPersonality,
      hasSelfHarmRisk,
      hasEmotionDysregulation,
      hasInterpersonalStrain,
      hasSleepIssue,
      hasSexualHealthConcern,
      hasAdolescentPresentation: age !== null && age <= 19,
      needsMedicalCoordination,
      // Demographics for biopsychosocial narrative
      clientName: firstNonEmpty(intake.firstName, intake.fullName) || "Patient",
      age,
      genderLabel: normalizeGenderLabel(firstNonEmpty(intake.genderIdentity, intake.sex)),
      ethnicityLabel: buildEthnicityLabel(intake.ethnicity, intake.race),
      occupationContext: buildOccupationContext(intake.occupation),
      relationshipContext: clip(intake.relationshipDescription.trim(), 80),
      livingContext: intake.livingArrangement.trim().toLowerCase(),
      hasMedicalIssues: Boolean(
        intake.medicalHistory.trim() && !/^(none|no|denied|denies|n\/a|na)$/i.test(intake.medicalHistory.trim())
      ),
      medicationContext: intake.medications.trim() && !/^(none|no|denied|denies|n\/a|na)$/i.test(intake.medications.trim()) ? clip(intake.medications.trim(), 80) : "",
      substanceContext: buildSubstanceContext(intake.alcoholUse, intake.drugUse, intake.substanceUseHistory),
      phq9Score: intake.phq9?.totalScore ?? null,
      gad7Score: intake.gad7?.totalScore ?? null
    };
  }
  function selectResourceIds(profile) {
    const ids = /* @__PURE__ */ new Set([
      RESOURCE_IDS.caseFormulationCbt,
      RESOURCE_IDS.behavioralCbt
    ]);
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk || profile.hasAdolescentPresentation) {
      ids.add(RESOURCE_IDS.dbtAdult);
      ids.add(RESOURCE_IDS.dbtAdolescent);
    }
    if (profile.hasSubstance) {
      ids.add(RESOURCE_IDS.mi);
      ids.add(RESOURCE_IDS.asam);
    }
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      ids.add(RESOURCE_IDS.psychoanalytic);
      ids.add(RESOURCE_IDS.pdm);
    }
    return Array.from(ids);
  }
  function buildQueries(profile) {
    const diagnosisClause = profile.diagnoses.length ? profile.diagnoses.join(" ") : [profile.hasDepression ? "depression" : "", profile.hasAnxiety ? "anxiety" : "", profile.hasSubstance ? "substance use" : ""].filter(Boolean).join(" ");
    const queries = unique2([
      `treatment plan interventions ${diagnosisClause} ${profile.patientGoals.join(" ")}`.trim(),
      profile.hasSubstance ? "motivational interviewing relapse prevention ambivalence substance use" : "",
      profile.hasEmotionDysregulation || profile.hasSelfHarmRisk ? "dbt distress tolerance emotion regulation chain analysis safety planning" : "",
      profile.hasTrauma || profile.hasPersonality || profile.hasInterpersonalStrain ? "psychodynamic formulation attachment personality functioning relationship patterns" : ""
    ]);
    return queries.slice(0, 5);
  }
  function buildFormulationQueries(profile, diagnosticImpressions) {
    const diagnosisClause = diagnosticImpressions.length ? diagnosticImpressions.map((impression) => impression.name).join(" ") : profile.diagnoses.join(" ");
    const queries = [
      `case formulation ${diagnosisClause} mechanisms precipitants origins treatment planning`.trim(),
      "elements of a case formulation symptoms problems mechanisms precipitants origins",
      "using the formulation to develop a treatment plan diagnosis goals"
    ];
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      queries.push("psychodynamic formulation attachment defenses personality functioning relationship patterns");
      queries.push("case formulation psychodynamic trauma personality disrupted safety defenses coping");
    }
    return unique2(queries).slice(0, 5);
  }
  function selectFormulationResourceIds(profile) {
    const ids = [RESOURCE_IDS.caseFormulationCbt];
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      ids.push(RESOURCE_IDS.psychoanalytic);
      ids.push(RESOURCE_IDS.pdm);
    }
    return ids;
  }
  function dedupeReferences(results) {
    const seen = /* @__PURE__ */ new Set();
    const references = [];
    for (const result of results) {
      const key = `${result.resourceId}:${result.chunk.pageStart}`;
      if (seen.has(key)) continue;
      seen.add(key);
      references.push({
        resourceId: result.resourceId,
        resourceTitle: result.resourceTitle,
        pageStart: result.chunk.pageStart,
        heading: result.chunk.heading,
        preview: result.chunk.preview,
        score: result.score
      });
      if (references.length >= 5) break;
    }
    return references;
  }
  function recommendModalities(profile) {
    const modalities = ["CBT case formulation"];
    if (profile.hasDepression || profile.hasAnxiety) {
      modalities.push("Behavioral CBT");
    }
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk || profile.hasAdolescentPresentation) {
      modalities.push("DBT skills");
    }
    if (profile.hasSubstance) {
      modalities.push("Motivational interviewing");
      modalities.push("ASAM-informed addiction planning");
    }
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      modalities.push("Psychodynamic formulation");
    }
    if (profile.hasSexualHealthConcern) {
      modalities.push("Sex therapy (sensate focus, psychoeducation)");
    }
    return unique2(modalities).slice(0, 4);
  }
  function buildProblemList(profile) {
    const problems = [];
    if (profile.hasDepression) problems.push("depressed mood and reduced interest/pleasure");
    if (profile.hasAnxiety) problems.push("anxiety, worry, and physiological tension");
    if (profile.hasTrauma) problems.push("trauma-related symptoms and cue sensitivity");
    if (profile.hasSleepIssue) problems.push("sleep disruption");
    if (profile.hasInterpersonalStrain) problems.push("interpersonal strain");
    if (profile.hasSubstance) problems.push("substance-related coping or harm");
    if (profile.primaryConcern) problems.push(profile.primaryConcern.replace(/[.]+$/, ""));
    return unique2(problems).slice(0, 5);
  }
  function inferPronoun(genderLabel) {
    if (genderLabel === "male") return { subject: "he", possessive: "his" };
    if (genderLabel === "female") return { subject: "she", possessive: "her" };
    return { subject: "they", possessive: "their" };
  }
  function summarizePresentingConcern(profile) {
    const symptoms = [];
    if (profile.hasAnxiety) symptoms.push("anxiety");
    if (profile.hasDepression) symptoms.push("depression");
    if (profile.hasTrauma) symptoms.push("trauma-related distress");
    if (profile.hasSubstance) symptoms.push("substance use concerns");
    if (profile.hasEmotionDysregulation) symptoms.push("difficulty managing emotions");
    if (!symptoms.length && profile.primaryConcern) {
      return profile.primaryConcern.replace(/[.]+$/, "").toLowerCase();
    }
    return symptoms.length ? `symptoms of ${joinList(symptoms)}` : "presenting concerns";
  }
  function normalizeRelationshipForNarrative(raw) {
    if (!raw) return "";
    return raw.replace(/^(Girlfriend|Boyfriend|Partner|Spouse|Wife|Husband)/i, (m) => m.toLowerCase()).replace(/,\s*/, " of ").trim();
  }
  function buildOpeningSentence(profile) {
    const parts = [profile.clientName];
    parts.push("is a");
    const descriptors = [];
    if (profile.age) descriptors.push(`${profile.age}-year-old`);
    if (profile.ethnicityLabel) descriptors.push(profile.ethnicityLabel);
    if (profile.genderLabel) descriptors.push(profile.genderLabel);
    if (descriptors.length) {
      parts.push(descriptors.join(" "));
    } else {
      parts.push("patient");
    }
    const context = [];
    if (profile.occupationContext) context.push(profile.occupationContext);
    const relNarrative = normalizeRelationshipForNarrative(profile.relationshipContext);
    if (relNarrative) context.push(`${relNarrative}`);
    if (context.length) parts.push(context.join(" and "));
    const concern = summarizePresentingConcern(profile);
    const precipitant = profile.primaryConcern.match(/(?:following|after|relating to|due to)\s+(.+)/i)?.[1]?.replace(/[.]+$/, "");
    if (precipitant) {
      parts.push(`who presents with ${concern} relating to ${precipitant.toLowerCase()}`);
    } else if (profile.precipitatingFactors.length) {
      parts.push(`who presents with ${concern} relating to ${clip(profile.precipitatingFactors[0], 80).toLowerCase().replace(/[.]+$/, "")}`);
    } else {
      parts.push(`who presents with ${concern}`);
    }
    return `${parts.join(" ")}.`;
  }
  function buildBiologicalParagraph(profile) {
    const { possessive } = inferPronoun(profile.genderLabel);
    const capPossessive = possessive.charAt(0).toUpperCase() + possessive.slice(1);
    const lines = [];
    if (profile.hasMedicalIssues) {
      lines.push(`${profile.clientName} has a history of medical issues that may be playing a role.`);
    } else {
      lines.push(`${profile.clientName} has no major medical issues reported.`);
    }
    if (profile.medicationContext) {
      lines.push(`Current medications include ${profile.medicationContext}.`);
    }
    const somatic = [];
    if (profile.hasSleepIssue) somatic.push("trouble sleeping");
    if (profile.hasDepression) somatic.push("low energy");
    if (profile.hasAnxiety) somatic.push("physical tension");
    if (somatic.length) {
      lines.push(`${capPossessive} body is showing signs of stress: ${joinList(somatic)}.`);
    }
    return lines.join(" ");
  }
  function buildPsychologicalParagraphs(profile, diagnosticImpressions) {
    const { subject } = inferPronoun(profile.genderLabel);
    const capSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
    const paragraphs = [];
    const problemList = buildProblemList(profile);
    if (problemList.length) {
      const scores = [];
      if (profile.phq9Score !== null) scores.push(`PHQ-9: ${profile.phq9Score}`);
      if (profile.gad7Score !== null) scores.push(`GAD-7: ${profile.gad7Score}`);
      const scoreNote = scores.length ? ` (in clinical interview, ${scores.join(", and ")})` : "";
      paragraphs.push(`${capSubject} reported ${joinList(problemList)}${scoreNote}.`);
    }
    if (profile.hasDepression && profile.hasAnxiety) {
      paragraphs.push("From a CBT lens, catastrophic interpretations and somatic vigilance may be maintaining anxiety, while behavioral withdrawal reinforces low mood.");
    } else if (profile.hasDepression) {
      paragraphs.push("From a CBT lens, doing less and pulling away from daily routines reinforces the low mood over time.");
    } else if (profile.hasAnxiety) {
      paragraphs.push("From a CBT lens, avoiding the things that cause worry gives short-term relief but makes the anxiety stronger over time.");
    } else {
      paragraphs.push("From a CBT lens, avoidance and withdrawal patterns may be keeping the current problems in place.");
    }
    if (profile.hasTrauma) {
      const traumaLines = [
        "From a trauma-focused view, avoiding reminders of what happened may feel safer in the short term but keeps the fear response active."
      ];
      if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
        traumaLines.push(`${capSubject} may also struggle to handle strong feelings, which can lead to risky or impulsive ways of coping when stress gets too high.`);
      }
      paragraphs.push(traumaLines.join(" "));
    } else if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      paragraphs.push(`${capSubject} may also struggle to handle strong feelings, which can lead to risky or impulsive ways of coping when stress gets too high.`);
    }
    if (profile.hasTrauma && (profile.hasPersonality || profile.hasInterpersonalStrain)) {
      paragraphs.push(`From a psychodynamic view, the trauma can change ${profile.clientName}'s earlier sense of safety and control, overwhelming coping strategies that used to work. Relationship patterns may reflect old ways of protecting against feeling helpless or unsafe.`);
    } else if (profile.hasTrauma) {
      paragraphs.push(`From a psychodynamic view, the trauma can change ${profile.clientName}'s earlier sense of safety and control, overwhelming coping strategies that used to work.`);
    } else if (profile.hasPersonality || profile.hasInterpersonalStrain) {
      paragraphs.push(`From a psychodynamic view, repeating patterns in relationships, like expecting rejection or needing constant reassurance, may trace back to earlier experiences that shaped how ${subject} relates to others.`);
    }
    return paragraphs;
  }
  function buildSocialParagraph(profile) {
    const lines = [];
    const strengths = [];
    if (profile.occupationContext && profile.occupationContext !== "currently unemployed") {
      strengths.push("employment");
    }
    const relNarrative = normalizeRelationshipForNarrative(profile.relationshipContext);
    if (relNarrative) strengths.push(`a relationship (${relNarrative})`);
    if (profile.livingContext && !/alone/i.test(profile.livingContext)) {
      strengths.push(`housing (${profile.livingContext})`);
    }
    if (strengths.length) {
      lines.push(`On the social side, ${profile.clientName} has some important supports in place: ${joinList(strengths)}.`);
    } else {
      lines.push(`Social supports are limited and should be explored more in follow-up.`);
    }
    if (profile.hasDepression || profile.hasInterpersonalStrain) {
      lines.push(`However, pulling away from people and activities is a concern that could weaken these supports over time.`);
    }
    return lines.join(" ");
  }
  function buildFormulation(profile, modalities, diagnosticImpressions) {
    const paragraphs = [];
    paragraphs.push(buildOpeningSentence(profile));
    paragraphs.push(buildBiologicalParagraph(profile));
    paragraphs.push(...buildPsychologicalParagraphs(profile, diagnosticImpressions));
    paragraphs.push(buildSocialParagraph(profile));
    if (profile.hasSubstance && profile.substanceContext) {
      const isVague = /^(yes|y)$/i.test(profile.substanceContext.trim());
      if (isVague) {
        paragraphs.push(`${profile.clientName} reported substance use in the intake form, which could be a way of coping with distress and raise the risk that symptoms stick around longer. More assessment for type of substances is needed.`);
      } else {
        paragraphs.push(`${profile.clientName} reported substance use (${profile.substanceContext}), which could be a way of coping with distress and raise the risk that symptoms stick around longer.`);
      }
    } else if (profile.hasSubstance) {
      paragraphs.push(`${profile.clientName} reported substance use in the intake form, which could be a way of coping with distress and raise the risk that symptoms stick around longer. More assessment for type of substances is needed.`);
    }
    paragraphs.push(`Treatment can start with ${joinList(modalities)}.`);
    return paragraphs.join("\n\n");
  }
  function buildGoals(profile) {
    const goals = [];
    const objectives = [];
    if (profile.hasTrauma && profile.hasAnxiety) {
      goals.push("Reduce anxiety symptoms related to trauma");
    } else if (profile.hasAnxiety) {
      goals.push("Reduce anxiety symptoms and worry");
    } else if (profile.hasTrauma) {
      goals.push("Process trauma-related distress and restore safety");
    }
    if (profile.hasDepression) {
      goals.push("Improve mood and energy");
    }
    if (profile.hasAnxiety || profile.hasTrauma) {
      goals.push("Decrease avoidance and increase functioning");
    }
    if (profile.hasSubstance) {
      goals.push("Address substance use as coping");
    }
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      goals.push("Strengthen distress tolerance and reduce self-harm risk");
    }
    if (profile.hasInterpersonalStrain || profile.hasPersonality) {
      goals.push("Improve relational stability and reflective capacity");
    }
    for (const g of profile.patientGoals) {
      if (!goals.some((existing) => existing.toLowerCase().includes(g.toLowerCase().slice(0, 20)))) {
        goals.push(g);
      }
    }
    if (!goals.length) {
      goals.push("Clarify the symptom pattern and restore baseline functioning");
    }
    goals.push("Restore baseline functioning");
    objectives.push("Identify and track triggers (week 1-2)");
    if (profile.hasDepression) {
      objectives.push("Increase 2-3 pleasurable or meaningful activities weekly");
    }
    if (profile.hasAnxiety || profile.hasTrauma) {
      objectives.push("Learn 2 grounding skills");
    }
    if (profile.hasAnxiety || profile.hasDepression) {
      objectives.push("Begin cognitive restructuring of unhelpful thought patterns");
    }
    if (profile.hasSubstance) {
      objectives.push("Explore substance use patterns and motivation for change");
    }
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      objectives.push("Practice one distress tolerance skill between sessions");
    }
    if (profile.hasInterpersonalStrain || profile.hasPersonality) {
      objectives.push("Identify one recurring relational pattern to explore");
    }
    objectives.push("Finalize measurable treatment goals (session 2-3)");
    const lines = [];
    lines.push("Goals:");
    for (const g of unique2(goals).slice(0, 6)) {
      lines.push(`  ${g}`);
    }
    lines.push("");
    lines.push("Objectives:");
    for (const o of unique2(objectives).slice(0, 6)) {
      lines.push(`  ${o}`);
    }
    return lines.join("\n");
  }
  function buildInterventions(profile) {
    const domains = [];
    let domainNum = 0;
    if (profile.hasTrauma) {
      const items = [];
      items.push("Trauma-focused CBT");
      items.push("Psychoeducation on trauma response");
      items.push("Gradual exposure to trauma-related cues (as appropriate)");
      if (profile.hasAnxiety) {
        items.push("Grounding and stabilization before deeper processing");
      }
      domains.push({ title: "Trauma + Anxiety Focus", items });
    }
    if (profile.hasDepression) {
      const items = [];
      items.push("Behavioral activation (increase engagement, reduce withdrawal)");
      items.push("Monitor sleep and appetite");
      if (profile.hasSleepIssue) {
        items.push("Behavioral sleep-routine interventions");
      }
      domains.push({ title: "Depression Interventions", items });
    }
    if (profile.hasAnxiety) {
      const items = [];
      items.push("CBT for anxiety (cognitive restructuring, interoceptive awareness)");
      items.push("Teach grounding and distress tolerance (DBT-informed skills)");
      domains.push({ title: "Anxiety / Somatic Symptoms", items });
    }
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      const items = [];
      items.push("DBT distress-tolerance and emotion-regulation skills");
      items.push("Chain analysis for high-risk behaviors");
      if (profile.hasSelfHarmRisk) {
        items.push("Safety planning and crisis resource review");
      }
      domains.push({ title: "Emotion Regulation / Safety", items });
    }
    if (profile.hasSubstance) {
      const items = [];
      items.push("Motivational Interviewing to explore ambivalence and function of use");
      items.push("Harm reduction vs abstinence planning based on readiness");
      items.push("Review ASAM dimensions for level of care adjustment");
      domains.push({ title: "Substance Use", items });
    }
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      const items = [];
      if (profile.hasTrauma) {
        items.push("Explore meaning of trauma (control, vulnerability)");
      }
      items.push("Assess emotional avoidance patterns");
      if (profile.hasInterpersonalStrain || profile.hasPersonality) {
        items.push("Track recurrent relational patterns and attachment themes");
      }
      domains.push({ title: "Psychodynamic / Insight Work", items });
    }
    if (profile.hasSexualHealthConcern) {
      const items = [];
      items.push("Comprehensive sexual health assessment (medical, psychological, relational factors)");
      items.push("Psychoeducation on sexual response cycle and contributing factors");
      items.push("Sensate focus exercises to reduce performance anxiety");
      items.push("Cognitive restructuring of maladaptive beliefs about sexual performance");
      if (profile.hasAnxiety) {
        items.push("Address performance anxiety and anticipatory avoidance");
      }
      if (profile.hasInterpersonalStrain) {
        items.push("Couples communication skills around intimacy");
      }
      items.push("Coordinate with medical provider to rule out physiological contributors");
      domains.push({ title: "Sexual Health", items });
    }
    if (profile.needsMedicalCoordination || profile.severeSymptoms) {
      const items = [];
      items.push("Consider consulting with a psychiatrist if symptoms persist or worsen");
      if (profile.hasSleepIssue) {
        items.push("Sleep support if insomnia emerges");
      }
      if (profile.hasSubstance) {
        items.push("Medication evaluation for co-occurring substance use");
      }
      domains.push({ title: "Medication Evaluation", items });
    }
    if (!domains.length) {
      domains.push({
        title: "Assessment and Monitoring",
        items: [
          "Complete diagnostic clarification and timeline review",
          "Measurement-based monitoring at follow-up visits"
        ]
      });
    }
    const lines = [];
    for (const domain of domains) {
      domainNum++;
      lines.push(`${domainNum}. ${domain.title}`);
      for (const item of domain.items) {
        lines.push(`   ${item}`);
      }
      lines.push("");
    }
    return lines.join("\n").trim();
  }
  function buildFrequency(profile) {
    const lines = [];
    if (profile.hasSelfHarmRisk || profile.severeSymptoms) {
      lines.push("Frequency: Weekly outpatient therapy (consider twice weekly if risk escalates)");
    } else {
      lines.push("Frequency: Weekly outpatient therapy");
    }
    lines.push("");
    lines.push("Monitoring:");
    const monitors = [];
    if (profile.hasDepression || profile.hasAnxiety) {
      monitors.push("PHQ-9 / GAD-7 every 2-4 weeks");
    }
    if (profile.hasSubstance) {
      monitors.push("Substance use tracking");
    }
    if (profile.hasSelfHarmRisk) {
      monitors.push("Safety plan review each session");
    }
    if (!monitors.length) {
      monitors.push("Symptom and functioning check-in each session");
    }
    for (const m of monitors) {
      lines.push(`  ${m}`);
    }
    lines.push("");
    lines.push("Reassessment:");
    const reassess = [];
    if (profile.hasTrauma) {
      reassess.push("Evaluate PTSD criteria next session and after 1 month");
    }
    if (profile.hasSubstance) {
      reassess.push("Reassess ASAM dimensions for level of care adjustment");
    }
    if (profile.diagnoses.length) {
      const dxList = profile.diagnoses.slice(0, 3).join(", ");
      reassess.push(`Review diagnostic accuracy for ${dxList} after 4-6 sessions`);
    }
    if (!reassess.length) {
      reassess.push("Re-evaluate diagnostic impressions after 4-6 sessions");
    }
    for (const r of reassess) {
      lines.push(`  ${r}`);
    }
    lines.push("");
    lines.push("Referral:");
    if (profile.needsMedicalCoordination || profile.severeSymptoms) {
      lines.push("  Psychiatry if symptoms persist or escalate");
    } else {
      lines.push("  Psychiatry if symptoms escalate");
    }
    if (profile.hasSubstance) {
      lines.push("  SUD specialty services if relapse severity warrants");
    }
    lines.push("");
    lines.push("Safety:");
    if (profile.hasSelfHarmRisk) {
      lines.push("  Continue monitoring SI/HI each session: update safety plan as needed");
    } else {
      lines.push("  Continue monitoring SI (currently denied)");
    }
    return lines.join("\n");
  }
  function buildReferrals(intake, profile) {
    const referrals = [];
    if (profile.needsMedicalCoordination) {
      const medicalContact = firstNonEmpty(intake.primaryCarePhysician, intake.prescribingMD);
      referrals.push(
        medicalContact ? `Coordinate with existing medical prescriber/PCP: ${medicalContact}.` : "Coordinate with PCP and any current prescriber as clinically indicated."
      );
    }
    if (profile.hasSubstance) {
      referrals.push("Consider SUD specialty services, medication evaluation, or higher level of care if withdrawal risk or relapse severity warrants.");
    }
    if (profile.hasSelfHarmRisk) {
      referrals.push("Escalate to crisis resources, safety planning, or higher level of care if suicidal risk increases.");
    }
    return referrals.join(" ");
  }
  function buildPlan(profile) {
    const goals = [];
    const objectives = [];
    if (profile.hasTrauma && profile.hasAnxiety) {
      goals.push("Reduce anxiety symptoms related to trauma");
    } else if (profile.hasAnxiety) {
      goals.push("Reduce anxiety and worry");
    }
    if (profile.hasDepression) {
      goals.push("Improve mood and energy");
    }
    if (profile.hasAnxiety || profile.hasTrauma) {
      goals.push("Decrease avoidance and increase functioning");
    }
    if (profile.hasSubstance) {
      goals.push("Address substance use as coping");
    }
    if (profile.hasSelfHarmRisk || profile.hasEmotionDysregulation) {
      goals.push("Strengthen distress tolerance and safety");
    }
    if (!goals.length) {
      goals.push("Clarify symptom pattern and restore functioning");
    }
    goals.push("Restore baseline functioning");
    objectives.push("Review diagnostic timeline and current impairment (session 1-2)");
    if (profile.hasSelfHarmRisk) {
      objectives.push("Update safety plan (each session)");
    }
    if (profile.hasSubstance) {
      objectives.push("Assess motivation, use pattern, and relapse risk (session 1-2)");
    }
    if (profile.hasEmotionDysregulation) {
      objectives.push("Introduce one DBT coping skill for between-session use (session 2)");
    }
    if (profile.hasDepression || profile.hasAnxiety) {
      objectives.push("Assign one behavioral practice or symptom-monitoring task (session 2)");
    }
    objectives.push("Finalize measurable treatment goals (session 2-3)");
    const lines = [];
    lines.push("Goals:");
    for (const g of unique2(goals).slice(0, 6)) {
      lines.push(`  ${g}`);
    }
    lines.push("");
    lines.push("Objectives:");
    for (const o of unique2(objectives).slice(0, 6)) {
      lines.push(`  ${o}`);
    }
    return lines.join("\n");
  }
  async function computeGuidance(intake, diagnosticImpressions) {
    const profile = buildProfile(intake, diagnosticImpressions);
    const resourceIds = selectResourceIds(profile);
    const treatmentQueries = buildQueries(profile);
    const formulationQueries = buildFormulationQueries(profile, diagnosticImpressions);
    const [formulationResults, treatmentResults] = await Promise.all([
      Promise.all(
        formulationQueries.map(
          (query) => searchClinicalKnowledge(query, {
            limit: 3,
            resourceIds: selectFormulationResourceIds(profile)
          })
        )
      ).then((results) => results.flat()),
      Promise.all(
        treatmentQueries.map(
          (query) => searchClinicalKnowledge(query, {
            limit: 4,
            resourceIds
          })
        )
      ).then((results) => results.flat())
    ]);
    const searchResults = [...formulationResults, ...treatmentResults].sort((a, b) => b.score - a.score);
    const modalities = recommendModalities(profile);
    return {
      modalities,
      formulation: buildFormulation(profile, modalities, diagnosticImpressions),
      goals: buildGoals(profile),
      interventions: buildInterventions(profile),
      frequency: buildFrequency(profile),
      referrals: buildReferrals(intake, profile),
      plan: buildPlan(profile),
      references: dedupeReferences(searchResults),
      queries: [...formulationQueries, ...treatmentQueries]
    };
  }
  function buildCacheKey(intake, diagnosticImpressions) {
    return JSON.stringify({
      clientId: intake.clientId,
      capturedAt: intake.capturedAt,
      chiefComplaint: intake.chiefComplaint,
      presentingProblems: intake.presentingProblems,
      counselingGoals: intake.counselingGoals,
      manualNotes: intake.manualNotes,
      phq9: intake.phq9?.totalScore ?? null,
      gad7: intake.gad7?.totalScore ?? null,
      diagnoses: diagnosticImpressions.map((impression) => ({
        id: impression.disorderId,
        name: impression.name,
        confidence: impression.confidence,
        reasoning: impression.diagnosticReasoning ?? "",
        evidence: impression.criteriaEvidence,
        notes: impression.clinicianNotes ?? ""
      }))
    });
  }
  async function buildClinicalGuidance(intake, diagnosticImpressions = []) {
    const key = buildCacheKey(intake, diagnosticImpressions);
    if (!guidanceCache.has(key)) {
      guidanceCache.set(key, computeGuidance(intake, diagnosticImpressions));
    }
    return guidanceCache.get(key);
  }

  // src/lib/note-draft.ts
  function firstNonEmpty2(...values) {
    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
    return "";
  }
  function splitGoals2(raw) {
    return raw.split(/\n|;|•/).map((part) => part.trim().replace(/^[\d\-*,.\s]+/, "")).filter(Boolean);
  }
  function summarizeAssessments(intake) {
    const parts = [];
    if (intake.phq9) {
      parts.push(`PHQ-9 ${intake.phq9.totalScore}/27 (${intake.phq9.severity || "severity not parsed"})`);
    }
    if (intake.gad7) {
      parts.push(`GAD-7 ${intake.gad7.totalScore}/21 (${intake.gad7.severity || "severity not parsed"})`);
    }
    if (intake.cssrs) {
      parts.push(`C-SSRS ${intake.cssrs.totalScore} yes (${intake.cssrs.severity || "summary not parsed"})`);
    }
    if (intake.dass21) {
      parts.push(`DASS-21 ${intake.dass21.totalScore} (${intake.dass21.severity || "summary not parsed"})`);
    }
    return parts;
  }
  function summarizeRisk(intake) {
    const parts = [];
    if (intake.suicidalIdeation.trim()) parts.push(`SI: ${intake.suicidalIdeation.trim()}`);
    if (intake.homicidalIdeation.trim()) parts.push(`HI: ${intake.homicidalIdeation.trim()}`);
    if (intake.suicideAttemptHistory.trim()) parts.push(`Suicide attempt history: ${intake.suicideAttemptHistory.trim()}`);
    if (intake.psychiatricHospitalization.trim()) parts.push(`Psych hospitalization: ${intake.psychiatricHospitalization.trim()}`);
    return parts;
  }
  function buildPresentingComplaint(intake) {
    const sections = [
      firstNonEmpty2(intake.chiefComplaint, intake.presentingProblems),
      intake.historyOfPresentIllness.trim(),
      intake.overviewClinicalNote.trim(),
      intake.manualNotes.trim(),
      intake.additionalSymptoms.trim(),
      intake.recentSymptoms.trim()
    ].filter(Boolean);
    const assessmentSummary = summarizeAssessments(intake);
    if (assessmentSummary.length) {
      sections.push(`Screening results: ${assessmentSummary.join("; ")}.`);
    }
    return sections.join("\n\n");
  }
  function buildFallbackClinicalFormulation(intake) {
    const parts = [];
    const chiefComplaint = firstNonEmpty2(
      intake.chiefComplaint,
      intake.presentingProblems,
      intake.historyOfPresentIllness,
      intake.overviewClinicalNote,
      intake.manualNotes
    );
    if (chiefComplaint) {
      parts.push(`Patient presents for intake reporting ${chiefComplaint.replace(/[.]+$/, "")}.`);
    }
    const history = [];
    if (intake.priorTreatment.trim()) history.push(`prior treatment: ${intake.priorTreatment.trim()}`);
    if (intake.medications.trim()) history.push(`medications: ${intake.medications.trim()}`);
    if (intake.medicalHistory.trim()) history.push(`medical history: ${intake.medicalHistory.trim()}`);
    if (intake.familyPsychiatricHistory.trim()) history.push(`family psychiatric history: ${intake.familyPsychiatricHistory.trim()}`);
    if (intake.physicalSexualAbuseHistory.trim()) history.push(`trauma history: ${intake.physicalSexualAbuseHistory.trim()}`);
    if (intake.domesticViolenceHistory.trim()) history.push(`domestic violence history: ${intake.domesticViolenceHistory.trim()}`);
    if (history.length) {
      parts.push(`Relevant history includes ${history.join("; ")}.`);
    }
    const riskSummary = summarizeRisk(intake);
    if (riskSummary.length) {
      parts.push(`Risk-related intake responses: ${riskSummary.join("; ")}.`);
    }
    const contextualFactors = [];
    if (intake.livingArrangement.trim()) contextualFactors.push(`living situation: ${intake.livingArrangement.trim()}`);
    if (intake.relationshipDescription.trim()) contextualFactors.push(`relationship context: ${intake.relationshipDescription.trim()}`);
    if (intake.occupation.trim()) contextualFactors.push(`occupation: ${intake.occupation.trim()}`);
    if (intake.counselingGoals.trim()) contextualFactors.push(`treatment goals: ${intake.counselingGoals.trim()}`);
    if (contextualFactors.length) {
      parts.push(`Contextual factors include ${contextualFactors.join("; ")}.`);
    }
    return parts.join(" ");
  }
  function buildInterventions2(intake) {
    const interventions = [
      "Complete diagnostic assessment and clarify symptom timeline.",
      "Review risk, protective factors, and prior treatment response."
    ];
    if (intake.phq9) {
      interventions.push("Track depressive symptoms with PHQ-9 over follow-up visits.");
    }
    if (intake.gad7) {
      interventions.push("Track anxiety symptoms with GAD-7 over follow-up visits.");
    }
    if (intake.counselingGoals.trim()) {
      interventions.push("Align treatment planning with the patient-stated counseling goals.");
    }
    return interventions;
  }
  async function buildDraftNote(intake, prefs, diagnosticImpressions = []) {
    const clientName = firstNonEmpty2(
      intake.fullName,
      `${intake.firstName} ${intake.lastName}`.trim()
    );
    const goals = splitGoals2(intake.counselingGoals);
    const sessionDate = firstNonEmpty2(
      intake.formDate,
      intake.capturedAt ? new Date(intake.capturedAt).toLocaleDateString("en-US") : ""
    );
    const guidance = await buildClinicalGuidance(intake, diagnosticImpressions);
    const guidanceGoalLines = guidance.goals.split("\n").map((l) => l.trim()).filter((l) => l && !l.endsWith(":"));
    const mergedGoals = Array.from(
      /* @__PURE__ */ new Set([
        ...goals.length ? goals : ["Clarify presenting concerns and establish treatment goals."],
        ...guidanceGoalLines
      ])
    ).slice(0, 5);
    const guidanceInterventionLines = guidance.interventions.split("\n").map((l) => l.replace(/^\d+\.\s*/, "").trim()).filter((l) => l && !l.endsWith(":"));
    const mergedInterventions = Array.from(
      /* @__PURE__ */ new Set([
        ...buildInterventions2(intake),
        ...guidanceInterventionLines
      ])
    ).slice(0, 6);
    return {
      ...EMPTY_PROGRESS_NOTE,
      clientName,
      sessionDate,
      sessionType: "Initial Clinical Evaluation",
      cptCode: prefs.firstVisitCPT,
      chiefComplaint: firstNonEmpty2(
        intake.chiefComplaint,
        intake.presentingProblems,
        intake.historyOfPresentIllness,
        intake.overviewClinicalNote,
        intake.manualNotes
      ),
      presentingComplaint: buildPresentingComplaint(intake),
      diagnosticImpressions,
      clinicalFormulation: guidance.formulation || buildFallbackClinicalFormulation(intake),
      treatmentPlan: {
        goals: mergedGoals,
        interventions: mergedInterventions,
        frequency: guidance.frequency || "To be determined after intake evaluation.",
        referrals: guidance.referrals || (intake.primaryCarePhysician.trim() ? `Coordinate with PCP as needed: ${intake.primaryCarePhysician.trim()}.` : "")
      },
      plan: guidance.plan || "Complete the intake evaluation, finalize diagnostic impressions, and establish the initial treatment plan.",
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: {
        intakeCaptured: true,
        noteGenerated: true,
        noteReviewed: false,
        noteSubmitted: false
      }
    };
  }

  // src/lib/ollama-client.ts
  var DEFAULT_ENDPOINT = "http://localhost:11434";
  var GENERATE_TIMEOUT_MS = 3e5;
  function buildOllamaErrorMessage(status, endpoint, details = "") {
    if (status === 403) {
      return [
        `Ollama blocked this Chrome extension at ${endpoint}.`,
        "Allow browser-extension origins by setting",
        "OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*,safari-web-extension://*",
        "and restart Ollama."
      ].join(" ");
    }
    if (status === null) {
      return `Could not reach Ollama at ${endpoint}. Make sure Ollama is running and listening on that URL.`;
    }
    const suffix = details ? ` ${details}` : "";
    return `Ollama returned ${status} at ${endpoint}.${suffix}`.trim();
  }
  async function diagnoseOllamaEndpoint(endpoint = DEFAULT_ENDPOINT) {
    try {
      const res = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(5e3) });
      if (res.ok) {
        return { ok: true, status: res.status };
      }
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        error: buildOllamaErrorMessage(res.status, endpoint, text.slice(0, 200))
      };
    } catch {
      return {
        ok: false,
        status: null,
        error: buildOllamaErrorMessage(null, endpoint)
      };
    }
  }
  async function checkOllamaHealth(endpoint = DEFAULT_ENDPOINT) {
    const diagnostic = await diagnoseOllamaEndpoint(endpoint);
    return diagnostic.ok;
  }
  async function generateCompletion(prompt, system, model, endpoint = DEFAULT_ENDPOINT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);
    try {
      const res = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          system,
          stream: true,
          options: {
            temperature: 0.2,
            num_predict: 4096,
            num_ctx: 16384
          }
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(buildOllamaErrorMessage(res.status, endpoint, text.slice(0, 200)));
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body from Ollama");
      const decoder = new TextDecoder();
      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            fullResponse += chunk.response;
            if (chunk.done) return fullResponse;
          } catch {
          }
        }
      }
      return fullResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // src/lib/openai-client.ts
  var OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
  var GENERATE_TIMEOUT_MS2 = 12e4;
  async function checkOpenAIHealth(apiKey) {
    if (!apiKey) return false;
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5e3)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  async function generateOpenAICompletion(prompt, system, model, apiKey) {
    const messages = [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS2);
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 4096,
          stream: true
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`OpenAI returned ${res.status}: ${text.slice(0, 200)}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body from OpenAI");
      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") return fullResponse;
          try {
            const chunk = JSON.parse(data);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) fullResponse += content;
          } catch {
          }
        }
      }
      return fullResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  async function generateOpenAICompletionSync(prompt, system, model, apiKey) {
    const messages = [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ];
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 4096
      }),
      signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS2)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenAI returned ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty response");
    if (data.usage) {
      console.log("[SPN] OpenAI usage:", data.usage);
    }
    return content;
  }

  // src/lib/deidentify.ts
  function buildPhiPatterns(intake) {
    const patterns = [];
    let dateCounter = 0;
    function addIfPresent(value, token) {
      const trimmed = value?.trim();
      if (!trimmed || trimmed.length < 2) return;
      if (/^(no|none|n\/a|na|denied|denies|negative|yes|y)$/i.test(trimmed)) return;
      patterns.push({ pattern: trimmed, token });
    }
    const fullName = [intake.firstName, intake.lastName].filter(Boolean).join(" ").trim();
    if (fullName) addIfPresent(fullName, "[CLIENT_1]");
    if (intake.fullName && intake.fullName !== fullName) addIfPresent(intake.fullName, "[CLIENT_1]");
    if (intake.firstName && intake.firstName.length >= 2) addIfPresent(intake.firstName, "[CLIENT_FIRST]");
    if (intake.lastName && intake.lastName.length >= 2) addIfPresent(intake.lastName, "[CLIENT_LAST]");
    if (intake.dob) {
      addIfPresent(intake.dob, "[DOB_1]");
      const dobDate = new Date(intake.dob);
      if (!Number.isNaN(dobDate.getTime())) {
        const isoDate = dobDate.toISOString().split("T")[0];
        addIfPresent(isoDate, "[DOB_1]");
        const mmddyyyy = `${String(dobDate.getMonth() + 1).padStart(2, "0")}/${String(dobDate.getDate()).padStart(2, "0")}/${dobDate.getFullYear()}`;
        addIfPresent(mmddyyyy, "[DOB_1]");
      }
    }
    if (intake.address.raw) addIfPresent(intake.address.raw, "[LOCATION_1]");
    if (intake.address.street) addIfPresent(intake.address.street, "[LOCATION_STREET]");
    if (intake.address.city && intake.address.city.length >= 3) addIfPresent(intake.address.city, "[LOCATION_CITY]");
    if (intake.address.zip) addIfPresent(intake.address.zip, "[LOCATION_ZIP]");
    if (intake.phone) addIfPresent(intake.phone, "[PHONE_STRIPPED]");
    if (intake.email) addIfPresent(intake.email, "[EMAIL_STRIPPED]");
    if (intake.emergencyContact) addIfPresent(intake.emergencyContact, "[EMERGENCY_CONTACT_STRIPPED]");
    if (intake.insuranceCompany) addIfPresent(intake.insuranceCompany, "[INSURANCE_STRIPPED]");
    if (intake.memberId) addIfPresent(intake.memberId, "[MRN_STRIPPED]");
    if (intake.groupNumber) addIfPresent(intake.groupNumber, "[GROUP_STRIPPED]");
    if (intake.occupation && intake.occupation.length > 20) {
      addIfPresent(intake.occupation, "[EMPLOYER_1]");
    }
    if (intake.signedBy) addIfPresent(intake.signedBy, "[PROVIDER_1]");
    if (intake.formDate) {
      dateCounter++;
      addIfPresent(intake.formDate, `[DATE_${dateCounter}]`);
    }
    if (intake.signedAt) {
      dateCounter++;
      addIfPresent(intake.signedAt, `[DATE_${dateCounter}]`);
    }
    if (intake.clientId) addIfPresent(intake.clientId, "[CLIENT_ID_STRIPPED]");
    if (intake.prescribingMD) addIfPresent(intake.prescribingMD, "[PROVIDER_MD]");
    if (intake.primaryCarePhysician) addIfPresent(intake.primaryCarePhysician, "[PROVIDER_PCP]");
    patterns.sort((a, b) => b.pattern.length - a.pattern.length);
    return patterns;
  }
  var DATE_PATTERN = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|\w+ \d{1,2},?\s*\d{4})\b/g;
  var PHONE_PATTERN = /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g;
  var EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  var SSN_PATTERN = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g;
  function deidentify(text, intake) {
    if (!text) return { sanitized: "", mapping: {} };
    const mapping = {};
    let sanitized = text;
    if (intake) {
      const patterns = buildPhiPatterns(intake);
      for (const { pattern, token } of patterns) {
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "gi");
        if (regex.test(sanitized)) {
          if (!token.includes("STRIPPED")) {
            mapping[token] = pattern;
          }
          sanitized = sanitized.replace(regex, token);
        }
      }
    }
    let dateCounter = Object.keys(mapping).filter((k) => k.startsWith("[DATE_")).length;
    sanitized = sanitized.replace(DATE_PATTERN, (match) => {
      if (match.startsWith("[")) return match;
      dateCounter++;
      const token = `[DATE_${dateCounter}]`;
      mapping[token] = match;
      return token;
    });
    sanitized = sanitized.replace(PHONE_PATTERN, "[PHONE_STRIPPED]");
    sanitized = sanitized.replace(EMAIL_PATTERN, "[EMAIL_STRIPPED]");
    sanitized = sanitized.replace(SSN_PATTERN, "[SSN_STRIPPED]");
    sanitized = sanitized.replace(/\[PHONE_STRIPPED\]/g, "").replace(/\[EMAIL_STRIPPED\]/g, "").replace(/\[SSN_STRIPPED\]/g, "").replace(/\[MRN_STRIPPED\]/g, "").replace(/\[GROUP_STRIPPED\]/g, "").replace(/\[INSURANCE_STRIPPED\]/g, "").replace(/\[EMERGENCY_CONTACT_STRIPPED\]/g, "").replace(/\[CLIENT_ID_STRIPPED\]/g, "").replace(/\s{2,}/g, " ").trim();
    return { sanitized, mapping };
  }
  function reidentify(text, mapping) {
    if (!text || !Object.keys(mapping).length) return text;
    let result = text;
    const tokens = Object.keys(mapping).sort((a, b) => b.length - a.length);
    for (const token of tokens) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(escaped, "g"), mapping[token]);
    }
    return result;
  }
  async function saveDeidentifyMapping(mapping) {
    await chrome.storage.session.set({ spn_deid_mapping: mapping });
  }

  // src/lib/soap-prompt.ts
  var MAX_TRANSCRIPT_WORDS = 4e3;
  var MAX_TOTAL_PROMPT_CHARS = 36e3;
  var SYSTEM_PROMPT = `You are a clinical documentation assistant for a licensed psychologist. Your task is to generate a SOAP progress note from a session transcript and clinical context.

OUTPUT FORMAT: Return a valid JSON object with exactly four string keys:
{"subjective":"...","objective":"...","assessment":"...","plan":"..."}

Do NOT wrap the JSON in markdown code fences. Return ONLY the raw JSON object.
Do NOT include leading labels like "Subjective:" or "Plan:" inside the string values. The app already labels each section.

STYLE TARGET:
- Write like an insurance-ready SimplePractice follow-up note: dense, concrete, clinically grounded, and easy to skim.
- Use paragraph prose, not bullets.
- Group content by theme, not by transcript order.
- Prefer "Client reported," "Client described," "Client expressed," "Clinician provided," and "Client responded" style sentences.
- Pack in useful details, but keep every sentence anchored to material actually present in the transcript, session notes, intake, MSE checklist, diagnoses, or treatment plan.
- Keep the tone clinical and practical, not literary, not robotic, and not overly polished.

HOW TO EXTRACT FROM A TRANSCRIPT:
1. Read the entire transcript and identify the KEY THEMES discussed (e.g., anxiety, parenting stress, work conflict, trauma history). Do NOT retell the conversation chronologically.
2. For each theme, extract: (a) what the client reported, (b) specific details and numbers (scores, frequencies, dates), (c) notable quotes that capture the client's experience.
3. Note what the clinician assessed or screened for (e.g., "clinician conducted PTSD criteria screening" or "clinician explored substance use history").
4. Identify trajectory: did the client report improvement, worsening, or no change on any symptoms?
5. Extract any scheduling, homework, or next-step decisions made during the session.
6. Convert raw client language to clinical prose: "my stomach hurts when I'm worried" \u2192 "Client reports somatic manifestation of anxiety (GI distress)."
7. When the session includes dreams, family stories, political stress, body symptoms, or other indirect material, document both the content and the connection the client or clinician made to current stressors.
8. When the clinician taught or reviewed a skill, name it clearly and note how the client engaged with it.

DOCUMENTATION STANDARDS:
- Use third-person clinical prose (e.g., "Client reported..." not "I said...")
- Use DSM-5 terminology for diagnoses and symptoms
- Use plain, direct language at about an early-teen reading level when possible
- Prefer simple words over formal or academic wording (e.g., "worry" over "apprehension," "got worse" over "exacerbated")
- Keep the note sounding clinical, but not polished or overly literary
- Reference specific content from the session \u2014 do not write generic filler
- Only include information explicitly stated in the transcript or session notes
- Do NOT fabricate quotes, symptoms, or clinical observations not present in the data
- Write for insurance/medical necessity \u2014 be specific about functional impairment and treatment rationale
- Organize by theme, not chronologically
- If a detail is missing, leave it out or use a cautious neutral statement based on supplied checklist data. Do not invent.

SECTION REQUIREMENTS:

SUBJECTIVE: What the client reported. Organize by THEME, not chronology:
- Primary concerns discussed this session (group related topics together)
- Symptom changes since last session (better, worse, same) \u2014 quantify when possible
- Relevant life events or stressors mentioned (with dates/details from transcript)
- Mood self-report if stated (use client's words)
- Risk factors: SI/HI denial or endorsement (ALWAYS document \u2014 write "denied SI/HI" if not discussed)
- Substance use updates if discussed (quantify: frequency, amount)
- Include functional details when relevant: work strain, family stress, sleep disruption, appetite changes, social avoidance, exercise changes, or deadline pressure
- If dream content or imagery was discussed, document the dream details briefly and link them to waking stressors only if the transcript supports that link
- Keep it concise, but not skeletal \u2014 this should read like a real therapy note, not a shorthand fragment

OBJECTIVE: What the clinician observed and assessed. Include:
- Diagnostic assessment activities conducted this session (e.g., "Clinician assessed for PTSD criteria; client does not meet full criteria at this time")
- Clinical data points extracted during the interview: substance use quantified, injury/medical history, self-report scales or ratings
- Behavioral observations during session (engagement, emotional responses, coping demonstrated)
- Interventions or psychoeducation delivered this session and the client's response to them
- End the Objective section with an embedded Mental Status Exam block using exactly this layout:
  Mental Status Exam:
  Appearance: ...
  Behavior: ...
  Speech: ...
  Mood/Affect: ...
  Thoughts: ...
  Cognition: ...
  Insight/Judgment: ...
- Screening scores if administered (PHQ-9, GAD-7, C-SSRS)

ASSESSMENT: Clinical synthesis (NOT a summary \u2014 this is your ANALYSIS):
- Current symptom presentation and severity \u2014 note what improved vs worsened
- Diagnostic formulation: does the presentation fit the active diagnoses? Any rule-outs explored?
- Historical patterns identified (e.g., "long-standing performance anxiety with somatic manifestations predates current stressors")
- Functional impact on daily life, work, relationships \u2014 be specific
- Protective factors (support system, insight, motivation) and risk factors
- How the client's treatment preferences/style should inform the approach
- Statement of medical necessity for continued treatment
- If the session revealed family-of-origin, intergenerational, or longstanding coping patterns, include that synthesis here
- If the client prefers logic/problem-solving, structure, or a certain treatment style, note how that should shape treatment

PLAN: Actionable next steps (3-5 bullet points max):
- Treatment frequency, modality, and scheduling changes (include specific day/time if discussed)
- Specific focus for next session based on this session's content
- Interventions to use or continue (name specific techniques: CBT, exposure, MI, etc.)
- Between-session assignments or skills to practice
- Any referrals, medication coordination, or safety planning
- Next appointment date/time if mentioned
- Each bullet should reference a specific data point from the session, not generic advice
- If the clinician introduced a specific skill in session, carry that into the plan as practice between sessions when supported by the transcript

CONCISENESS RULES (apply to ALL sections):
- Each section should be 3-5 dense sentences or bullet points. Not 1-2, not 8-10.
- Every sentence must be anchored to something specific from the session data.
- Do NOT write generic filler like "Consider exploring the client's feelings about..." or "Continue to monitor..."
- Do NOT repeat the same observation across sections.
- Prefer concrete details (scores, dates, quotes, specific behaviors) over vague descriptors.
- If a detail is not in the data, leave it out entirely \u2014 do not pad with boilerplate.

EXAMPLE OUTPUT (synthetic, for STYLE/DEPTH reference only \u2014 do NOT copy any content from this example into real notes):
{"subjective":"Client reported increased work stress and ongoing anxiety since last session. He has applied behavioral experiments from previous session, reducing overwork by approximately 1% weekly and increasing enjoyable activities including tennis and gym. Client resumed physical exercise for first time since recent medical event, noting 30-minute cardio session improved mood. He described morning anxiety with intrusive work-related thoughts upon waking, possibly dream-related. Client wrote a full-page private journal entry when overwhelmed this morning, then used behavioral activation via midday walk. He reported feeling urges to scream and tear up during work interactions due to repeated direct messages from a former supervisor. Client advocated for himself by speaking candidly with current supervisor, presenting concerns about project pressure and productivity impact. He connected former supervisor's communication style to early family anxiety patterns, identifying a deja vu response. Client expressed values conflict between financial optimization and meaningful work aligned with his morals, noting comparison with peers and industry growth contributes to self-esteem strain and affects relationship with partner. Client denied SI/HI.","objective":"Client was cooperative and engaged throughout session. He demonstrated self-advocacy by writing down overwhelming thoughts and communicating professionally with his supervisor despite emotional distress. Client showed insight connecting workplace dynamics to family-of-origin anxiety patterns. He problem-solved actively by using physical activity and expressive writing as coping strategies. Client read portions of journal entry aloud, demonstrating trust. He showed values clarity around integrity and working with passionate colleagues versus purely financial optimization.

Mental Status Exam:
Appearance: Casually dressed, appropriate grooming
Behavior: Cooperative, engaged, emotionally expressive
Speech: Normal rate and volume
Mood/Affect: Anxious and frustrated initially, more balanced by session end
Thoughts: Linear and goal-directed, no SI/HI, preoccupied with work pressure and peer comparisons
Cognition: Alert, oriented x3, strong abstract reasoning
Insight/Judgment: Excellent insight into anxiety triggers and values conflicts; judgment intact","assessment":"Client presents with generalized anxiety with somatic features including morning anxiety, intrusive work-related thoughts on waking, and urges to cry or scream under pressure, consistent with active GAD diagnosis. He demonstrates adaptive coping via behavioral activation, expressive writing, and professional self-advocacy, indicating good engagement with prior interventions. Anxiety is triggered by former supervisor's communication pattern, which the client identified as mirroring family-of-origin anxiety patterns \u2014 a significant insight gain. Client shows a values conflict between financial optimization and meaningful work, with comparison-driven self-esteem concerns affecting his romantic relationship. Client's strong self-awareness, willingness to advocate for needs, and ability to distinguish emotion from professional behavior support a positive prognosis. Continued treatment is medically necessary to address anxiety symptoms, values clarification, self-esteem concerns tied to financial comparisons, and further emotion-regulation skill building.","plan":"Continue weekly individual therapy. Validated client's self-advocacy with current supervisor as a wise-mind application. Provided psychoeducation on anxiety as a physical information system using an ancestral fight-or-flight frame. Offered a visualization technique of imagining frustrating work problems under bike pedals during exercise. Encouraged continued expressive writing and behavioral activation via gym and tennis. Client will continue the 1% behavioral experiment, prioritizing enjoyable activities over overwork. Discussed bringing a notebook to work for in-the-moment journaling. Next session will explore self-esteem concerns related to financial comparisons and values conflicts."}

Note how the example: (a) organizes Subjective by THEME (stress \u2192 coping \u2192 advocacy \u2192 family link \u2192 values/FOMO \u2192 SI denial), not chronology; (b) embeds the Mental Status Exam at the end of Objective with the exact labeled layout; (c) ties Assessment to specific session content AND names medical necessity; (d) makes every Plan item concrete and session-specific. Match this depth and structure \u2014 but with the current session's actual content, not this example's content.`;
  function buildSoapPrompt(transcript, sessionNotes, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs) {
    const sections = [];
    if (intake) {
      const contextLines = [];
      const name = [intake.firstName, intake.lastName].filter(Boolean).join(" ") || intake.fullName || "Client";
      contextLines.push(`Client: ${name}`);
      if (intake.dob) contextLines.push(`DOB: ${intake.dob}`);
      if (intake.sex) contextLines.push(`Sex: ${intake.sex}`);
      if (intake.genderIdentity) contextLines.push(`Gender identity: ${intake.genderIdentity}`);
      if (intake.race || intake.ethnicity) contextLines.push(`Race/ethnicity: ${[intake.race, intake.ethnicity].filter(Boolean).join(", ")}`);
      if (intake.occupation) contextLines.push(`Occupation: ${intake.occupation}`);
      if (intake.livingArrangement) contextLines.push(`Living arrangement: ${intake.livingArrangement}`);
      if (intake.maritalStatus) contextLines.push(`Marital status: ${intake.maritalStatus}`);
      if (intake.medications) contextLines.push(`Current medications: ${intake.medications}`);
      if (intake.chiefComplaint) contextLines.push(`Chief complaint (from intake): ${intake.chiefComplaint}`);
      if (intake.suicidalIdeation) contextLines.push(`SI history: ${intake.suicidalIdeation}`);
      if (intake.homicidalIdeation) contextLines.push(`HI history: ${intake.homicidalIdeation}`);
      if (intake.substanceUseHistory) contextLines.push(`Substance use: ${intake.substanceUseHistory}`);
      if (intake.medicalHistory) contextLines.push(`Medical history: ${intake.medicalHistory}`);
      if (intake.surgeries) contextLines.push(`Surgeries: ${intake.surgeries}`);
      if (intake.tbiLoc) contextLines.push(`TBI/LOC: ${intake.tbiLoc}`);
      if (contextLines.length > 1) {
        sections.push(`=== PATIENT CONTEXT ===
${contextLines.join("\n")}`);
      }
    }
    if (diagnosticImpressions.length > 0) {
      const diagLines = diagnosticImpressions.map((d) => {
        const parts = [`${d.code} ${d.name} (${d.confidence} confidence)`];
        if (d.diagnosticReasoning) parts.push(`  Reasoning: ${d.diagnosticReasoning}`);
        return parts.join("\n");
      });
      sections.push(`=== ACTIVE DIAGNOSES ===
${diagLines.join("\n")}`);
    }
    if (treatmentPlan && treatmentPlan.goals.length > 0) {
      const tpLines = [];
      if (treatmentPlan.treatmentFrequency) tpLines.push(`Frequency: ${treatmentPlan.treatmentFrequency}`);
      if (treatmentPlan.treatmentType) tpLines.push(`Type: ${treatmentPlan.treatmentType}`);
      for (const goal of treatmentPlan.goals) {
        tpLines.push(`Goal ${goal.goalNumber}: ${goal.goal} (Status: ${goal.status || "active"})`);
        for (const obj of goal.objectives) {
          tpLines.push(`  ${obj.id}: ${obj.objective}`);
        }
      }
      if (treatmentPlan.interventions.length > 0) {
        tpLines.push(`Interventions: ${treatmentPlan.interventions.join("; ")}`);
      }
      sections.push(`=== TREATMENT PLAN ===
${tpLines.join("\n")}`);
    }
    const assessments = [];
    const formatAssessment = (a, label) => {
      if (!a) return;
      assessments.push(`${label}: ${a.totalScore} \u2014 ${a.severity}`);
    };
    if (intake) {
      formatAssessment(intake.phq9, "PHQ-9");
      formatAssessment(intake.gad7, "GAD-7");
      formatAssessment(intake.cssrs, "C-SSRS");
      formatAssessment(intake.dass21, "DASS-21");
    }
    if (assessments.length > 0) {
      sections.push(`=== PRIOR ASSESSMENTS ===
${assessments.join("\n")}`);
    }
    if (intake?.overviewClinicalNote.trim()) {
      sections.push(`=== RECENT CLINICAL NOTE FROM PROFILE OVERVIEW ===
${intake.overviewClinicalNote.trim()}`);
    }
    if (mseChecklist) {
      const mseLines = [];
      const fmt = (label, values) => {
        if (values.length > 0) mseLines.push(`${label}: ${values.join(", ")}`);
      };
      fmt("Appearance", mseChecklist.appearance);
      fmt("Behavior", mseChecklist.behavior);
      fmt("Speech", mseChecklist.speech);
      if (mseChecklist.mood) mseLines.push(`Mood (client's words): "${mseChecklist.mood}"`);
      fmt("Affect", mseChecklist.affect);
      fmt("Thought process", mseChecklist.thoughtProcess);
      fmt("Thought content", mseChecklist.thoughtContent);
      fmt("Perceptions", mseChecklist.perceptions);
      fmt("Cognition", mseChecklist.cognition);
      if (mseChecklist.insight) mseLines.push(`Insight: ${mseChecklist.insight}`);
      if (mseChecklist.judgment) mseLines.push(`Judgment: ${mseChecklist.judgment}`);
      sections.push(`=== MSE CHECKLIST (clinician observations) ===
${mseLines.join("\n")}`);
    }
    const trimmedNotes = sessionNotes.trim();
    if (trimmedNotes) {
      sections.push(`=== CLINICIAN SESSION NOTES ===
${trimmedNotes}`);
    }
    if (transcript && transcript.entries.length > 0) {
      const transcriptText = formatTranscript(transcript, prefs);
      sections.push(`=== SESSION TRANSCRIPT ===
${transcriptText}`);
    }
    const providerName = [prefs.providerFirstName, prefs.providerLastName].filter(Boolean).join(" ") || "Clinician";
    sections.push(
      `=== INSTRUCTIONS ===
Generate a SOAP progress note for this session. The treating clinician is ${providerName}. Use the MSE checklist data for the Objective section's Mental Status Exam. Use the transcript and session notes to populate the Subjective, Assessment, and Plan sections. Aim for a dense, insurance-ready SimplePractice follow-up note rather than brief SOAP fragments. Objective should include both session interventions/observations and the exact "Mental Status Exam:" block. Assessment should explicitly state why continued treatment is medically necessary when the data supports that. Reference treatment plan goals in the Assessment section when relevant. Write in plain, simple clinical language rather than formal or academic language. Return ONLY valid JSON with keys: subjective, objective, assessment, plan.`
    );
    let userPrompt = sections.join("\n\n");
    if (userPrompt.length > MAX_TOTAL_PROMPT_CHARS) {
      const transcriptIdx = sections.findIndex((s) => s.startsWith("=== SESSION TRANSCRIPT"));
      if (transcriptIdx >= 0) {
        sections[transcriptIdx] = "=== SESSION TRANSCRIPT ===\n[Transcript omitted \u2014 too large for context window. SOAP generated from session notes, MSE, and clinical context only.]";
        userPrompt = sections.join("\n\n");
      }
    }
    return {
      system: SYSTEM_PROMPT,
      user: userPrompt
    };
  }
  function formatTranscript(transcript, prefs) {
    const providerName = [prefs.providerFirstName, prefs.providerLastName].filter(Boolean).join(" ") || "Clinician";
    const allLines = transcript.entries.map((entry) => {
      const speaker = entry.speaker === "clinician" ? providerName : "Client";
      return `${speaker}: ${entry.text}`;
    });
    const totalWords = allLines.reduce((sum, line) => sum + line.split(/\s+/).length, 0);
    if (totalWords <= MAX_TRANSCRIPT_WORDS) {
      return allLines.join("\n");
    }
    const keepStart = Math.floor(allLines.length * 0.2);
    const keepEnd = Math.floor(allLines.length * 0.3);
    const startLines = allLines.slice(0, keepStart);
    const endLines = allLines.slice(-keepEnd);
    const skipped = allLines.length - keepStart - keepEnd;
    return [
      ...startLines,
      `
[... ${skipped} transcript lines omitted for length \u2014 focus on opening context above and session content below ...]
`,
      ...endLines
    ].join("\n");
  }

  // src/lib/soap-builder.ts
  function normalizeWhitespace2(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  function firstNonEmpty3(...values) {
    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
    return "";
  }
  function buildTranscriptText(transcript) {
    if (!transcript?.entries.length) return "";
    return transcript.entries.map((entry) => `${entry.speaker}: ${entry.text}`).join("\n");
  }
  function extractTreatmentPlanId(treatmentPlan) {
    const sourceUrl = treatmentPlan?.sourceUrl ?? "";
    const match = sourceUrl.match(/diagnosis_treatment_plans\/([^/?#]+)/);
    return match?.[1] ?? "";
  }
  var FALLBACK_NOTICE = "[LLM unavailable \u2014 this is a skeleton draft. Edit manually before submitting.]";
  function buildSubjective(sessionNotes, intake) {
    const parts = [FALLBACK_NOTICE];
    const notes = sessionNotes.trim();
    if (notes) {
      parts.push(`Clinician session notes (verbatim):
${notes}`);
    }
    const chief = firstNonEmpty3(intake?.chiefComplaint, intake?.presentingProblems);
    if (chief) {
      parts.push(`Chief complaint (from intake): ${normalizeWhitespace2(chief)}.`);
    }
    if (!notes && !chief) {
      parts.push("No session notes or intake chief complaint captured. Add manually.");
    }
    return parts.join("\n\n");
  }
  function buildObjective(transcript, intake) {
    const parts = [];
    const transcriptLineCount = transcript?.entries.length ?? 0;
    if (transcriptLineCount > 0) {
      parts.push(
        `Session transcript captured (${transcriptLineCount} caption lines). LLM synthesis unavailable \u2014 review transcript manually.`
      );
    } else {
      parts.push("No session transcript or formal MSE documented. Add manually.");
    }
    const measurementLines = [];
    if (intake?.phq9) {
      measurementLines.push(`PHQ-9 (intake): ${intake.phq9.totalScore}/27 \u2014 ${intake.phq9.severity}`);
    }
    if (intake?.gad7) {
      measurementLines.push(`GAD-7 (intake): ${intake.gad7.totalScore}/21 \u2014 ${intake.gad7.severity}`);
    }
    if (measurementLines.length) {
      parts.push(measurementLines.join("\n"));
    }
    parts.push(
      "Mental Status Exam:\nAppearance: \nBehavior: \nSpeech: \nMood/Affect: \nThoughts: \nCognition: \nInsight/Judgment: "
    );
    return parts.join("\n\n");
  }
  function buildAssessment(treatmentPlan, diagnosticImpressions, intake) {
    const parts = [];
    const diagnosisList = diagnosticImpressions.length ? diagnosticImpressions.map((d) => `${d.name}${d.code ? ` (${d.code})` : ""}`).join(", ") : (treatmentPlan?.diagnoses ?? []).map((d) => `${d.description}${d.code ? ` (${d.code})` : ""}`).join(", ");
    if (diagnosisList) {
      parts.push(`Active diagnoses: ${diagnosisList}.`);
    }
    if (treatmentPlan?.goals?.length) {
      const goalLines = treatmentPlan.goals.map(
        (goal) => `- Goal ${goal.goalNumber}: ${normalizeWhitespace2(goal.goal)} (status: ${goal.status || "active"})`
      );
      parts.push(`Treatment plan goals under review:
${goalLines.join("\n")}`);
    }
    const chief = firstNonEmpty3(intake?.chiefComplaint, intake?.presentingProblems);
    if (chief && !diagnosisList) {
      parts.push(`Clinical focus: ${normalizeWhitespace2(chief)}.`);
    }
    parts.push(
      "Clinical synthesis, symptom trajectory, medical necessity, and protective/risk factors need manual completion."
    );
    return parts.join("\n\n");
  }
  function buildPlan2(treatmentPlan) {
    const items = [];
    if (treatmentPlan?.treatmentFrequency) {
      items.push(`Continue ${treatmentPlan.treatmentFrequency} psychotherapy.`);
    } else {
      items.push("Continue psychotherapy as scheduled.");
    }
    if (treatmentPlan?.interventions?.length) {
      const summary = treatmentPlan.interventions.map((x) => normalizeWhitespace2(x)).filter(Boolean).join("; ");
      if (summary) items.push(`Continue interventions: ${summary}.`);
    }
    items.push("Add session-specific focus, homework, and next appointment manually.");
    return items.join(" ");
  }
  function buildSoapDraft(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, prefs, meta = {}) {
    const transcriptText = buildTranscriptText(transcript);
    const clientName = firstNonEmpty3(
      meta.clientName,
      intake?.fullName,
      `${intake?.firstName ?? ""} ${intake?.lastName ?? ""}`.trim(),
      "Client"
    );
    const sessionDate = firstNonEmpty3(
      meta.sessionDate,
      intake?.formDate,
      (/* @__PURE__ */ new Date()).toLocaleDateString("en-US")
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      ...EMPTY_SOAP_DRAFT,
      apptId: meta.apptId ?? "",
      clientName,
      sessionDate,
      cptCode: prefs.followUpCPT || "90837",
      subjective: buildSubjective(sessionNotes, intake),
      objective: buildObjective(transcript, intake),
      assessment: buildAssessment(treatmentPlan, diagnosticImpressions, intake),
      plan: buildPlan2(treatmentPlan),
      sessionNotes: sessionNotes.trim(),
      transcript: transcriptText,
      treatmentPlanId: extractTreatmentPlanId(treatmentPlan),
      generatedAt: now,
      editedAt: now,
      status: "draft"
    };
  }

  // src/lib/soap-llm.ts
  var DEFAULT_MODEL = "gpt-4o-mini";
  var THEMES_SYSTEM = `You are a clinical documentation assistant helping a licensed psychologist prepare a SOAP note.

You will receive:
1. The clinician's raw loose notes from this session (may be fragmentary bullet points).
2. A session transcript (captions from the video visit).

Your job: identify the 4-8 most clinically meaningful THEMES discussed this session. For each theme, return 1-3 short supporting quotes taken verbatim from the transcript (or from the clinician notes when nothing in the transcript matches), and tag which SOAP sections the theme is most relevant to.

Return STRICT JSON only. No markdown. No prose before or after the JSON.

{
  "themes": [
    {
      "theme": "<short label, e.g. 'work stress', 'values conflict', 'FOMO about peer growth'>",
      "supportingQuotes": ["<verbatim quote 1>", "<verbatim quote 2>"],
      "relevantSections": ["subjective", "assessment"]
    }
  ]
}

Rules:
- Prefer themes that the CLINICIAN'S LOOSE NOTES flag, even if the transcript mentions them only briefly.
- Do NOT invent themes or quotes. Every quote must appear in the inputs.
- Cap at 8 themes. Prefer fewer strong themes over many weak ones.
- "relevantSections" values must be from this exact set: "subjective", "objective", "assessment", "plan".
- Quotes should be <= 160 characters. Trim with an ellipsis if needed.
- Skip small talk, scheduling, and filler (e.g. "hi, how are you", "see you next week").`;
  function extractJson(raw) {
    const stripped = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
    try {
      return JSON.parse(stripped);
    } catch {
      const match = stripped.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
  }
  function sanitizeThemes(raw) {
    const parsed = raw;
    if (!parsed?.themes || !Array.isArray(parsed.themes)) return [];
    const validSections = [
      "subjective",
      "objective",
      "assessment",
      "plan"
    ];
    return parsed.themes.map((t) => {
      const theme = typeof t?.theme === "string" ? t.theme.trim() : "";
      if (!theme) return null;
      const quotes = Array.isArray(t.supportingQuotes) ? t.supportingQuotes.filter((q) => typeof q === "string").map((q) => q.trim()).filter(Boolean).slice(0, 3) : [];
      const sections = Array.isArray(t.relevantSections) ? t.relevantSections.filter(
        (s) => validSections.includes(s)
      ).filter((s, i, arr) => arr.indexOf(s) === i) : [];
      return {
        theme,
        supportingQuotes: quotes,
        relevantSections: sections.length ? sections : ["subjective"]
      };
    }).filter((x) => x !== null).slice(0, 8);
  }
  function formatTranscriptForThemes(transcript, prefs) {
    if (!transcript?.entries.length) return "[No transcript captured.]";
    const providerName = [prefs.providerFirstName, prefs.providerLastName].filter(Boolean).join(" ") || "Clinician";
    return transcript.entries.map((e) => `${e.speaker === "clinician" ? providerName : "Client"}: ${e.text}`).join("\n");
  }
  function renderThemesBlock(themes) {
    if (!themes.length) return "";
    const lines = themes.map((t, i) => {
      const sections = t.relevantSections.join(", ");
      const quotes = t.supportingQuotes.map((q) => `    \u2022 "${q}"`).join("\n");
      return `${i + 1}. ${t.theme} [sections: ${sections}]${quotes ? `
${quotes}` : ""}`;
    });
    return `=== SESSION THEMES (from pass 1 \u2014 USE ALL OF THESE) ===
${lines.join("\n")}`;
  }
  function parseSoapJson(raw) {
    const json = extractJson(raw);
    if (!json) return null;
    const { subjective, objective, assessment, plan } = json;
    if (typeof subjective === "string" && typeof objective === "string" && typeof assessment === "string" && typeof plan === "string") {
      return { subjective, objective, assessment, plan };
    }
    return null;
  }
  async function generateSoapTwoPass(sessionNotes, transcript, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs, opts) {
    if (!opts.apiKey) throw new Error("OpenAI API key is required");
    const model = opts.model || DEFAULT_MODEL;
    const progress = opts.onProgress ?? (() => {
    });
    const rawTranscript = formatTranscriptForThemes(transcript, prefs);
    const combinedForDeid = `=== CLINICIAN LOOSE NOTES ===
${sessionNotes.trim() || "[none]"}

=== TRANSCRIPT ===
${rawTranscript}`;
    const { sanitized: sanitizedCombined, mapping } = deidentify(combinedForDeid, intake);
    await saveDeidentifyMapping(mapping);
    progress("Pass 1: extracting session themes...");
    const themesUser = `${sanitizedCombined}

Extract the 4-8 most clinically meaningful themes and return strict JSON.`;
    const themesRaw = await generateOpenAICompletionSync(themesUser, THEMES_SYSTEM, model, opts.apiKey);
    const themes = sanitizeThemes(extractJson(themesRaw));
    if (!themes.length) {
      throw new Error(`Pass 1 returned no themes. Raw output: ${themesRaw.slice(0, 300)}`);
    }
    progress(`Pass 2: synthesizing SOAP (${themes.length} themes)...`);
    const { system, user } = buildSoapPrompt(
      transcript,
      sessionNotes,
      intake,
      diagnosticImpressions,
      treatmentPlan,
      mseChecklist,
      prefs
    );
    const themesBlock = renderThemesBlock(themes);
    const { sanitized: sanitizedUser, mapping: userMapping } = deidentify(user, intake);
    const { sanitized: sanitizedSystem, mapping: systemMapping } = deidentify(system, intake);
    const fullMapping = { ...systemMapping, ...userMapping, ...mapping };
    await saveDeidentifyMapping(fullMapping);
    const augmentedUser = `${themesBlock}

${sanitizedUser}

=== THEME COVERAGE REQUIREMENT ===
Every theme above MUST be reflected in at least one SOAP section matching its "sections" tag. Do not drop themes. Do not invent themes beyond the list.`;
    const soapRaw = await generateOpenAICompletion(augmentedUser, sanitizedSystem, model, opts.apiKey);
    const reidentified = reidentify(soapRaw, fullMapping);
    const parsed = parseSoapJson(reidentified);
    if (!parsed) {
      throw new Error(`Pass 2 returned unparseable SOAP JSON. Raw output: ${reidentified.slice(0, 300)}`);
    }
    return { themes, soap: parsed };
  }

  // src/lib/soap-generator.ts
  function getErrorMessage(err) {
    if (err instanceof Error) return err.message;
    return String(err);
  }
  async function generateSoapDraft(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, meta = {}) {
    const provider = prefs.llmProvider || "ollama";
    if (provider === "openai" && prefs.openaiApiKey) {
      const healthy2 = await checkOpenAIHealth(prefs.openaiApiKey);
      if (healthy2) {
        try {
          const draft = await generateWithOpenAI(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, meta);
          if (draft) return draft;
        } catch (err) {
          console.info("[SPN] OpenAI generation failed, falling back:", getErrorMessage(err));
        }
      }
    }
    const endpoint = prefs.ollamaEndpoint || "http://localhost:11434";
    const model = prefs.ollamaModel || "llama3.1:8b";
    const healthy = await checkOllamaHealth(endpoint);
    if (healthy) {
      try {
        const draft = await generateWithLLM(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, meta, model, endpoint);
        if (draft) return draft;
      } catch (err) {
        const message = getErrorMessage(err);
        if (!message.includes("Ollama blocked this Chrome extension")) {
          console.info("[SPN] Ollama generation fell back to regex:", message);
        }
      }
    }
    const regexDraft = buildSoapDraft(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, prefs, meta);
    return { ...regexDraft, generationMethod: "regex" };
  }
  async function generateWithOpenAI(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, meta) {
    const model = prefs.openaiModel || "gpt-4o-mini";
    if (transcript?.entries.length && sessionNotes.trim()) {
      try {
        console.log("[SPN] Generating SOAP with OpenAI two-pass (de-identified)...", { model });
        const result = await generateSoapTwoPass(
          sessionNotes,
          transcript,
          intake,
          diagnosticImpressions,
          treatmentPlan,
          mseChecklist,
          prefs,
          {
            apiKey: prefs.openaiApiKey,
            model,
            onProgress: (msg) => console.log(`[SPN] ${msg}`)
          }
        );
        console.log(`[SPN] Two-pass produced ${result.themes.length} themes:`, result.themes.map((t) => t.theme).join(", "));
        return buildDraftFromSections(result.soap, sessionNotes, transcript, prefs, meta, "openai");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.info("[SPN] Two-pass failed, falling through to single-pass:", msg);
      }
    }
    const { system, user } = buildSoapPrompt(transcript, sessionNotes, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs);
    const { sanitized: sanitizedUser, mapping: userMapping } = deidentify(user, intake);
    const { sanitized: sanitizedSystem, mapping: systemMapping } = deidentify(system, intake);
    const fullMapping = { ...systemMapping, ...userMapping };
    await saveDeidentifyMapping(fullMapping);
    console.log("[SPN] Generating SOAP with OpenAI single-pass (de-identified)...", {
      model,
      originalLength: user.length,
      sanitizedLength: sanitizedUser.length,
      tokensReplaced: Object.keys(fullMapping).length
    });
    const raw = await generateOpenAICompletion(sanitizedUser, sanitizedSystem, model, prefs.openaiApiKey);
    const reidentified = reidentify(raw, fullMapping);
    const parsed = parseJsonResponse(reidentified);
    if (!parsed) {
      console.warn("[SPN] Failed to parse OpenAI response as JSON, attempting section extraction");
      const extracted = extractSections(reidentified);
      if (!extracted) return null;
      return buildDraftFromSections(extracted, sessionNotes, transcript, prefs, meta, "openai");
    }
    return buildDraftFromSections(parsed, sessionNotes, transcript, prefs, meta, "openai");
  }
  async function generateWithLLM(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, meta, model, endpoint) {
    const { system, user } = buildSoapPrompt(transcript, sessionNotes, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs);
    console.log("[SPN] Generating SOAP with Ollama...", { model, promptLength: user.length });
    const raw = await generateCompletion(user, system, model, endpoint);
    const parsed = parseJsonResponse(raw);
    if (!parsed) {
      console.warn("[SPN] Failed to parse LLM response as JSON, attempting section extraction");
      const extracted = extractSections(raw);
      if (!extracted) return null;
      return buildDraftFromSections(extracted, sessionNotes, transcript, prefs, meta);
    }
    return buildDraftFromSections(parsed, sessionNotes, transcript, prefs, meta);
  }
  function parseJsonResponse(raw) {
    try {
      const obj = JSON.parse(raw);
      if (obj.subjective && obj.objective && obj.assessment && obj.plan) {
        return obj;
      }
    } catch {
    }
    const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      try {
        const obj = JSON.parse(fenceMatch[1]);
        if (obj.subjective && obj.objective && obj.assessment && obj.plan) {
          return obj;
        }
      } catch {
      }
    }
    return null;
  }
  function extractSections(raw) {
    const subMatch = raw.match(/(?:^|\n)\s*(?:Subjective|SUBJECTIVE)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Objective|OBJECTIVE)[:\s]|\n\s*$)/i);
    const objMatch = raw.match(/(?:^|\n)\s*(?:Objective|OBJECTIVE)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Assessment|ASSESSMENT)[:\s]|\n\s*$)/i);
    const assMatch = raw.match(/(?:^|\n)\s*(?:Assessment|ASSESSMENT)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Plan|PLAN)[:\s]|\n\s*$)/i);
    const planMatch = raw.match(/(?:^|\n)\s*(?:Plan|PLAN)[:\s]*\n?([\s\S]*?)$/i);
    if (subMatch && objMatch && assMatch && planMatch) {
      return {
        subjective: subMatch[1].trim(),
        objective: objMatch[1].trim(),
        assessment: assMatch[1].trim(),
        plan: planMatch[1].trim()
      };
    }
    return null;
  }
  function buildDraftFromSections(sections, sessionNotes, transcript, prefs, meta, method = "llm") {
    const clientName = meta.clientName || "Client";
    const sessionDate = meta.sessionDate || (/* @__PURE__ */ new Date()).toLocaleDateString("en-US");
    const transcriptText = transcript?.entries.map((e) => `${e.speaker === "clinician" ? "Clinician" : "Client"}: ${e.text}`).join("\n") ?? "";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      ...EMPTY_SOAP_DRAFT,
      apptId: meta.apptId ?? "",
      clientName,
      sessionDate,
      cptCode: prefs.followUpCPT || "90837",
      subjective: sections.subjective,
      objective: sections.objective,
      assessment: sections.assessment,
      plan: sections.plan,
      sessionNotes: sessionNotes.trim(),
      transcript: transcriptText,
      treatmentPlanId: "",
      generatedAt: now,
      editedAt: now,
      status: "draft",
      generationMethod: method
    };
  }

  // src/popup/popup.ts
  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }
  function setToggleButtonState(visible) {
    const toggleBtn2 = document.getElementById("btn-toggle-btns");
    toggleBtn2.textContent = visible ? "\u{1F441}" : "\u{1F6AB}";
    toggleBtn2.title = visible ? "Hide page buttons" : "Show page buttons";
  }
  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ?? null;
  }
  async function getActiveTabId() {
    const tab = await getActiveTab();
    return tab?.id ?? null;
  }
  function sendTabMessage(tabId, message) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(response ?? null);
      });
    });
  }
  async function detectApptContext() {
    const tab = await getActiveTab();
    if (!tab?.url) return { isAppt: false, apptId: "" };
    try {
      const url = new URL(tab.url);
      const videoMatch = url.pathname.match(/\/appt-([a-f0-9]+)\/room/);
      if (videoMatch) return { isAppt: true, apptId: videoMatch[1] };
      const apptMatch = url.pathname.match(/\/appointments\/(\d+)/);
      if (apptMatch) return { isAppt: true, apptId: apptMatch[1] };
    } catch {
    }
    return { isAppt: false, apptId: "" };
  }
  async function syncToggleButtonState() {
    const tabId = await getActiveTabId();
    if (!tabId) {
      setToggleButtonState(true);
      return;
    }
    const response = await sendTabMessage(tabId, {
      type: "get-floating-buttons-visibility"
    });
    setToggleButtonState(response?.visible ?? true);
  }
  function updateCheckItem(id, done) {
    const el = document.getElementById(id);
    if (!el) return;
    const icon = el.querySelector(".check-icon");
    if (done) {
      el.classList.add("done");
      if (icon) icon.textContent = "\u2713";
    } else {
      el.classList.remove("done");
      if (icon) icon.textContent = "\u25CB";
    }
  }
  function showView(view) {
    const emptyState = document.getElementById("empty-state");
    const intakeInfo = document.getElementById("intake-info");
    const manualNotesSection = document.getElementById("manual-notes-section");
    const settingsPanel = document.getElementById("settings-panel");
    const popupStatus = document.getElementById("popup-status");
    const treatmentPlanSection = document.getElementById("treatment-plan-section");
    const soapPreviewSection = document.getElementById("soap-preview-section");
    if (view === "settings") {
      emptyState.style.display = "none";
      intakeInfo.style.display = "none";
      manualNotesSection.style.display = "none";
      if (popupStatus) popupStatus.style.display = "none";
      if (treatmentPlanSection) treatmentPlanSection.style.display = "none";
      if (soapPreviewSection) soapPreviewSection.style.display = "none";
      settingsPanel.style.display = "flex";
    } else {
      settingsPanel.style.display = "none";
      manualNotesSection.style.display = "block";
    }
  }
  function renderIntakeFields(intake) {
    const container = document.getElementById("intake-fields");
    container.innerHTML = "";
    const fields = [
      ["Name", intake.fullName || `${intake.firstName} ${intake.lastName}`.trim()],
      ["DOB", intake.dob],
      ["Sex", intake.sex],
      ["Gender", intake.genderIdentity],
      ["Phone", intake.phone],
      ["Address", intake.address.raw || [intake.address.street, intake.address.city, intake.address.state, intake.address.zip].filter(Boolean).join(", ")],
      ["Race", intake.race],
      ["Emergency Contact", intake.emergencyContact],
      ["Chief Complaint", intake.chiefComplaint],
      ["Goals", intake.counselingGoals],
      ["Prior Treatment", intake.priorTreatment],
      ["Medications", intake.medications],
      ["Prescribing MD", intake.prescribingMD],
      ["PCP", intake.primaryCarePhysician],
      ["Alcohol", intake.alcoholUse],
      ["Drugs", intake.drugUse],
      ["DASS-21", intake.dass21?.severity ?? ""],
      ["C-SSRS", intake.cssrs?.severity ?? ""],
      ["SI", intake.suicidalIdeation],
      ["Suicide Attempts", intake.suicideAttemptHistory],
      ["HI", intake.homicidalIdeation],
      ["Psych Hospitalization", intake.psychiatricHospitalization],
      ["Family MH Hx", intake.familyPsychiatricHistory],
      ["Marital Status", intake.maritalStatus],
      ["Relationship", intake.relationshipDescription],
      ["Living Situation", intake.livingArrangement],
      ["Education", intake.education],
      ["Occupation", intake.occupation],
      ["Abuse Hx", intake.physicalSexualAbuseHistory],
      ["DV Hx", intake.domesticViolenceHistory],
      ["Recent Symptoms", intake.recentSymptoms],
      ["Additional Info", intake.additionalInfo],
      ["Overview Clinical Note", intake.overviewClinicalNote],
      ["Clinician Notes", intake.manualNotes]
    ];
    for (const [label, value] of fields) {
      const item = document.createElement("div");
      item.className = "field-item";
      const labelEl = document.createElement("span");
      labelEl.className = "field-label";
      labelEl.textContent = label;
      const valueEl = document.createElement("span");
      valueEl.className = value ? "field-value" : "field-value empty";
      valueEl.textContent = value || "(not captured)";
      if (value && value.length > 80) {
        valueEl.textContent = value.substring(0, 80) + "...";
        valueEl.title = value;
      }
      item.appendChild(labelEl);
      item.appendChild(valueEl);
      container.appendChild(item);
    }
  }
  function buildNotePreview(note) {
    if (!note) return "";
    const lines = [];
    if (note.sessionType || note.cptCode) {
      lines.push(
        ["Session", [note.sessionType, note.cptCode && `CPT ${note.cptCode}`].filter(Boolean).join(" - ")].filter(Boolean).join(": ")
      );
    }
    if (note.chiefComplaint) lines.push(`CC: ${note.chiefComplaint}`);
    if (note.diagnosticImpressions.length) {
      lines.push(`Dx: ${note.diagnosticImpressions.map((d) => `${d.name} (${d.code})`).join(", ")}`);
    }
    if (note.presentingComplaint) lines.push(`Presenting: ${note.presentingComplaint}`);
    if (note.clinicalFormulation) lines.push(`Formulation: ${note.clinicalFormulation}`);
    if (note.treatmentPlan.goals.length) lines.push(`Goals: ${note.treatmentPlan.goals.join("; ")}`);
    if (note.treatmentPlan.interventions.length) lines.push(`Interventions: ${note.treatmentPlan.interventions.join("; ")}`);
    if (note.plan) lines.push(`Plan: ${note.plan}`);
    return lines.join("\n\n");
  }
  function buildTreatmentPlanPreview(plan) {
    if (!plan) {
      return 'No treatment plan captured yet. Open the client treatment plan page and click "Capture Treatment Plan" first.';
    }
    const lines = [];
    if (plan.diagnoses.length) {
      lines.push(`Dx: ${plan.diagnoses.map((entry) => `${entry.description}${entry.code ? ` (${entry.code})` : ""}`).join(", ")}`);
    }
    if (plan.presentingProblem) lines.push(`Problem: ${plan.presentingProblem}`);
    if (plan.goals.length) {
      lines.push(`Goals:
${plan.goals.map((goal) => `- Goal ${goal.goalNumber}: ${goal.goal}`).join("\n")}`);
    }
    if (plan.interventions.length) {
      lines.push(`Interventions: ${plan.interventions.join(", ")}`);
    }
    if (plan.treatmentFrequency) {
      lines.push(`Frequency: ${plan.treatmentFrequency}`);
    }
    return lines.join("\n\n");
  }
  function buildSoapPreview(draft) {
    if (!draft) return "";
    return [
      `S: ${draft.subjective}`,
      `O: ${draft.objective}`,
      `A: ${draft.assessment}`,
      `P: ${draft.plan}`
    ].join("\n\n");
  }
  function setStatus(message, type = "neutral") {
    const el = document.getElementById("popup-status");
    if (!el) return;
    if (!message.trim()) {
      el.textContent = "";
      el.style.display = "none";
      el.className = "status-banner";
      return;
    }
    el.textContent = message;
    el.style.display = "block";
    el.className = `status-banner${type === "neutral" ? "" : ` ${type}`}`;
  }
  async function generateSoapDraftForAppointment(apptId, sessionNotes) {
    const treatmentPlan = await getTreatmentPlan();
    const intake = await getIntake();
    if (intake?.clientId && treatmentPlan?.clientId && intake.clientId !== treatmentPlan.clientId) {
      return {
        draft: null,
        error: "The captured treatment plan appears to belong to a different client. Re-capture the correct treatment plan first."
      };
    }
    const prefs = await getPreferences();
    const note = await getNote();
    const workspace = await getDiagnosticWorkspace();
    const transcript = await getTranscript(apptId);
    const mseChecklist = await getMseChecklist();
    const diagnosticImpressions = workspace?.finalizedImpressions?.length ? workspace.finalizedImpressions : note?.diagnosticImpressions ?? [];
    const clientName = intake ? [intake.firstName, intake.lastName].filter(Boolean).join(" ") || intake.fullName : "";
    const draft = await generateSoapDraft(
      sessionNotes,
      transcript,
      treatmentPlan,
      intake,
      diagnosticImpressions,
      mseChecklist,
      prefs,
      { apptId, clientName }
    );
    await saveSoapDraft(draft);
    const warnings = [];
    if (!treatmentPlan) warnings.push("No treatment plan captured \u2014 Assessment section will be limited.");
    if (draft.generationMethod === "regex") {
      if (prefs.llmProvider === "openai" && prefs.openaiApiKey) {
        warnings.push("OpenAI and Ollama unavailable \u2014 fell back to template-based generation.");
      } else {
        const diagnostic = await diagnoseOllamaEndpoint(prefs.ollamaEndpoint || DEFAULT_PREFERENCES.ollamaEndpoint);
        warnings.push(diagnostic.error ?? "AI SOAP generation fell back to template-based generation.");
      }
    }
    return { draft, error: warnings.join(" ") || void 0 };
  }
  function toggleProviderSettings(provider) {
    const openaiEl = document.getElementById("openai-settings");
    const ollamaEl = document.getElementById("ollama-settings");
    if (openaiEl) openaiEl.style.display = provider === "openai" ? "" : "none";
    if (ollamaEl) ollamaEl.style.display = provider === "ollama" ? "" : "none";
  }
  async function populateSettingsForm() {
    const prefs = await getPreferences();
    document.getElementById("pref-firstName").value = prefs.providerFirstName;
    document.getElementById("pref-lastName").value = prefs.providerLastName;
    document.getElementById("pref-location").value = prefs.defaultLocation;
    document.getElementById("pref-firstCPT").value = prefs.firstVisitCPT;
    document.getElementById("pref-followUpCPT").value = prefs.followUpCPT;
    document.getElementById("pref-llmProvider").value = prefs.llmProvider || DEFAULT_PREFERENCES.llmProvider;
    document.getElementById("pref-openaiApiKey").value = prefs.openaiApiKey || "";
    document.getElementById("pref-openaiModel").value = prefs.openaiModel || DEFAULT_PREFERENCES.openaiModel;
    document.getElementById("pref-ollamaEndpoint").value = prefs.ollamaEndpoint || DEFAULT_PREFERENCES.ollamaEndpoint;
    document.getElementById("pref-ollamaModel").value = prefs.ollamaModel || DEFAULT_PREFERENCES.ollamaModel;
    toggleProviderSettings(prefs.llmProvider || DEFAULT_PREFERENCES.llmProvider);
    document.getElementById("pref-llmProvider")?.addEventListener("change", (e) => {
      toggleProviderSettings(e.target.value);
    });
    await renderReferenceLibrary();
    setupReferenceUpload();
  }
  async function renderReferenceLibrary() {
    const list = document.getElementById("ref-file-list");
    if (!list) return;
    const files = await getReferenceLibrary();
    if (!files.length) {
      list.innerHTML = '<div style="font-size:11px;color:#999;">No files uploaded yet.</div>';
      return;
    }
    list.innerHTML = files.map(
      (f) => `<div class="ref-file-item">
          <span class="ref-file-name" title="${f.filename}">${f.filename}</span>
          <button class="ref-file-delete" data-ref-id="${f.id}">remove</button>
        </div>`
    ).join("");
    list.querySelectorAll(".ref-file-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.refId;
        if (!id) return;
        await removeReferenceFile(id);
        await renderReferenceLibrary();
      });
    });
  }
  function setupReferenceUpload() {
    const input = document.getElementById("ref-file-input");
    if (!input) return;
    input.addEventListener("change", async () => {
      const files = input.files;
      if (!files?.length) return;
      for (const file of Array.from(files)) {
        const content = await file.text();
        const id = file.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        await addReferenceFile({
          id,
          filename: file.name,
          content,
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      input.value = "";
      await renderReferenceLibrary();
    });
  }
  function readSettingsForm() {
    return {
      providerFirstName: document.getElementById("pref-firstName").value.trim(),
      providerLastName: document.getElementById("pref-lastName").value.trim(),
      defaultLocation: document.getElementById("pref-location").value,
      firstVisitCPT: document.getElementById("pref-firstCPT").value.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
      followUpCPT: document.getElementById("pref-followUpCPT").value.trim() || DEFAULT_PREFERENCES.followUpCPT,
      llmProvider: document.getElementById("pref-llmProvider").value,
      openaiApiKey: document.getElementById("pref-openaiApiKey").value.trim(),
      openaiModel: document.getElementById("pref-openaiModel").value.trim() || DEFAULT_PREFERENCES.openaiModel,
      ollamaEndpoint: document.getElementById("pref-ollamaEndpoint").value.trim() || DEFAULT_PREFERENCES.ollamaEndpoint,
      ollamaModel: document.getElementById("pref-ollamaModel").value.trim() || DEFAULT_PREFERENCES.ollamaModel,
      autoGenerateOnSessionEnd: true
    };
  }
  async function render() {
    const intake = await getIntake();
    const note = await getNote();
    const soapDraft = await getSoapDraft();
    const treatmentPlan = await getTreatmentPlan();
    const prefs = await getPreferences();
    const apptCtx = await detectApptContext();
    const isSessionMode = apptCtx.isAppt;
    const draftBtn = document.getElementById("btn-generate-draft");
    const manualNotesInput = document.getElementById("manual-notes-input");
    const manualNotesHint = document.getElementById("manual-notes-hint");
    const soapBtn = document.getElementById("btn-save-session-notes");
    const saveManualBtn = document.getElementById("btn-save-manual-notes");
    const treatmentPlanSection = document.getElementById("treatment-plan-section");
    const treatmentPlanContent = document.getElementById("treatment-plan-content");
    const soapPreviewSection = document.getElementById("soap-preview-section");
    const soapPreviewContent = document.getElementById("soap-preview-content");
    document.getElementById("provider-badge").textContent = `Provider: ${prefs.providerFirstName} ${prefs.providerLastName}`;
    const emptyState = document.getElementById("empty-state");
    const intakeInfo = document.getElementById("intake-info");
    if (saveManualBtn) saveManualBtn.style.display = isSessionMode ? "none" : "block";
    if (soapBtn) soapBtn.style.display = isSessionMode ? "block" : "none";
    const diagSessionBtn = document.getElementById("btn-open-diagnostics-session");
    if (diagSessionBtn) diagSessionBtn.style.display = "block";
    if (draftBtn) {
      draftBtn.textContent = isSessionMode ? soapDraft ? "Regenerate SOAP Draft" : "Generate SOAP Draft" : note ? "Regenerate Draft" : "Generate Draft";
    }
    if (treatmentPlanSection && treatmentPlanContent) {
      treatmentPlanSection.style.display = isSessionMode ? "block" : "none";
      treatmentPlanContent.textContent = isSessionMode ? buildTreatmentPlanPreview(treatmentPlan) : "";
    }
    if (soapPreviewSection && soapPreviewContent) {
      const showSoapPreview = isSessionMode && !!soapDraft;
      soapPreviewSection.style.display = showSoapPreview ? "block" : "none";
      soapPreviewContent.textContent = showSoapPreview ? buildSoapPreview(soapDraft) : "";
    }
    if (isSessionMode && manualNotesInput) {
      const sessionNotes = await getSessionNotes(apptCtx.apptId);
      if (sessionNotes?.notes && !manualNotesInput.dataset.userEdited) {
        manualNotesInput.value = sessionNotes.notes;
      } else if (soapDraft?.sessionNotes && !manualNotesInput.dataset.userEdited) {
        manualNotesInput.value = soapDraft.sessionNotes;
      }
      if (manualNotesHint) {
        manualNotesHint.textContent = 'Paste follow-up session notes here. "Save Notes for SOAP" will save them, generate a SOAP draft from the captured treatment plan, and auto-fill the SOAP form if it is open.';
      }
    } else if (manualNotesHint) {
      manualNotesHint.textContent = intake ? "Paste your own notes here to augment the captured intake, diagnostics, and draft note." : "Paste your own notes here to create a manual intake when SimplePractice intake data is not available.";
    }
    if (!intake && !isSessionMode) {
      emptyState.style.display = "block";
      intakeInfo.style.display = "none";
      if (manualNotesInput && !manualNotesInput.dataset.userEdited) {
        manualNotesInput.value = "";
      }
      return;
    }
    emptyState.style.display = "none";
    if (isSessionMode && !intake) {
      intakeInfo.style.display = "none";
      return;
    }
    emptyState.style.display = "none";
    intakeInfo.style.display = "flex";
    document.getElementById("client-name").textContent = `${intake.firstName} ${intake.lastName}`.trim() || "Client";
    const metaParts = [];
    if (intake.insuranceCompany) metaParts.push(intake.insuranceCompany);
    if (intake.capturedAt) {
      const formattedCapturedAt = formatDate(intake.capturedAt);
      if (formattedCapturedAt) metaParts.push(`Captured ${formattedCapturedAt}`);
    }
    document.getElementById("client-meta").textContent = metaParts.join(" \xB7 ");
    updateCheckItem("check-intake", true);
    updateCheckItem("check-note-gen", note?.status?.noteGenerated ?? false);
    updateCheckItem("check-note-review", note?.status?.noteReviewed ?? false);
    updateCheckItem("check-note-submit", note?.status?.noteSubmitted ?? false);
    renderIntakeFields(intake);
    if (!isSessionMode && manualNotesInput && !manualNotesInput.dataset.userEdited) {
      manualNotesInput.value = intake.manualNotes;
    }
    const notePreview = document.getElementById("note-preview");
    const noteContent = document.getElementById("note-content");
    if (!isSessionMode && note) {
      notePreview.style.display = "block";
      noteContent.textContent = buildNotePreview(note) || "Draft generated from intake data.";
    } else {
      notePreview.style.display = "none";
    }
  }
  document.getElementById("manual-notes-input")?.addEventListener("input", (event) => {
    const target = event.currentTarget;
    if (!target) return;
    target.dataset.userEdited = "1";
  });
  var toggleBtn = document.getElementById("btn-toggle-btns");
  toggleBtn.addEventListener("click", async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return;
    const response = await sendTabMessage(tabId, {
      type: "toggle-floating-buttons"
    });
    setToggleButtonState(response?.visible ?? true);
  });
  document.getElementById("btn-settings")?.addEventListener("click", async () => {
    await populateSettingsForm();
    showView("settings");
  });
  document.getElementById("btn-save-prefs")?.addEventListener("click", async () => {
    const prefs = readSettingsForm();
    await savePreferences(prefs);
    showView("main");
    render();
  });
  document.getElementById("btn-cancel-prefs")?.addEventListener("click", () => {
    showView("main");
    render();
  });
  document.getElementById("btn-clear")?.addEventListener("click", async () => {
    await clearAll();
    setStatus("", "neutral");
    render();
  });
  document.getElementById("btn-new-patient")?.addEventListener("click", async () => {
    if (!confirm("Clear all captured data (intake, notes, transcript, SOAP draft, diagnostics) for a new patient?")) return;
    await clearAll();
    const input = document.getElementById("manual-notes-input");
    if (input) {
      input.value = "";
      delete input.dataset.userEdited;
    }
    setStatus("Ready for new patient.", "success");
    render();
  });
  document.getElementById("btn-save-manual-notes")?.addEventListener("click", async () => {
    const intake = await getIntake();
    const input = document.getElementById("manual-notes-input");
    const manualNotes = input?.value.replace(/\r\n/g, "\n").trim() ?? "";
    if (!intake && !manualNotes) return;
    await mergeIntake({
      manualNotes,
      capturedAt: intake?.capturedAt || (/* @__PURE__ */ new Date()).toISOString()
    });
    if (input) delete input.dataset.userEdited;
    setStatus("Intake notes saved.", "success");
    render();
  });
  document.getElementById("btn-save-session-notes")?.addEventListener("click", async () => {
    const ctx = await detectApptContext();
    if (!ctx.isAppt) {
      setStatus("Open an appointment page first.", "error");
      return;
    }
    const input = document.getElementById("manual-notes-input");
    const notes = input?.value.replace(/\r\n/g, "\n").trim() ?? "";
    const transcript = await getTranscript(ctx.apptId);
    if (!notes && !transcript?.entries.length) {
      setStatus("Type session notes or enable captions first.", "error");
      return;
    }
    if (notes) {
      await saveSessionNotes({ apptId: ctx.apptId, notes, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    const { draft, error } = await generateSoapDraftForAppointment(ctx.apptId, notes);
    if (!draft) {
      if (input) delete input.dataset.userEdited;
      setStatus(`Session notes saved. ${error ?? "Failed to generate SOAP draft."}`, "error");
      await render();
      return;
    }
    const tabId = await getActiveTabId();
    const fillResponse = tabId ? await sendTabMessage(tabId, {
      type: "SPN_FILL_SOAP_DRAFT",
      draft
    }) : null;
    if (input) delete input.dataset.userEdited;
    const suffix = error ?? "";
    if (fillResponse?.ok) {
      setStatus(`Session notes saved, SOAP draft generated, and SOAP fields filled.${suffix}`, "success");
    } else if (fillResponse?.error) {
      setStatus(`Session notes saved and SOAP draft generated. ${fillResponse.error}${suffix}`, "neutral");
    } else {
      setStatus(`Session notes saved and SOAP draft generated. Open the SOAP progress note form to fill automatically.${suffix}`, "neutral");
    }
    await render();
  });
  async function openDiagnosticsSidePanel() {
    const tab = await getActiveTab();
    if (!tab?.id || !chrome.sidePanel) return;
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: "sidepanel/sidepanel.html",
      enabled: true
    });
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  }
  document.getElementById("btn-open-diagnostics")?.addEventListener("click", openDiagnosticsSidePanel);
  document.getElementById("btn-open-diagnostics-session")?.addEventListener("click", openDiagnosticsSidePanel);
  document.getElementById("btn-generate-draft")?.addEventListener("click", async () => {
    const apptCtx = await detectApptContext();
    if (apptCtx.isAppt) {
      const input = document.getElementById("manual-notes-input");
      const notes = input?.value.replace(/\r\n/g, "\n").trim() ?? "";
      const transcript = await getTranscript(apptCtx.apptId);
      if (!notes && !transcript?.entries.length) {
        setStatus("Type session notes or enable captions first.", "error");
        return;
      }
      if (notes) {
        await saveSessionNotes({ apptId: apptCtx.apptId, notes, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      }
      const { draft, error } = await generateSoapDraftForAppointment(apptCtx.apptId, notes);
      if (!draft) {
        setStatus(error ?? "Failed to generate SOAP draft.", "error");
        return;
      }
      if (input) delete input.dataset.userEdited;
      setStatus("SOAP draft generated. Open the side panel to review and edit it.", "success");
      await render();
      return;
    }
    const intake = await getIntake();
    if (!intake) {
      render();
      return;
    }
    const prefs = await getPreferences();
    const existingNote = await getNote();
    const note = await buildDraftNote(intake, prefs, existingNote?.diagnosticImpressions ?? []);
    await saveNote(note);
    setStatus("Intake draft generated.", "success");
    render();
  });
  chrome.storage.onChanged.addListener(() => render());
  async function init() {
    const hasPrefs = await hasPreferences();
    await syncToggleButtonState();
    if (!hasPrefs) {
      await populateSettingsForm();
      showView("settings");
    } else {
      render();
    }
  }
  init();
})();
//# sourceMappingURL=popup.js.map
