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
  var SOAP_DRAFT_KEY = "spn_soap_draft";
  var TRANSCRIPT_KEY = "spn_transcript";
  var MSE_CHECKLIST_KEY = "spn_mse_checklist";
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
  async function getStoredIntake() {
    const result = await chrome.storage.session.get(INTAKE_KEY);
    const intake = result[INTAKE_KEY];
    return intake ? normalizeIntake(intake) : null;
  }
  async function getIntake() {
    const intake = await getStoredIntake();
    return intake ? augmentIntakeWithManualNotes(intake) : null;
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
  async function saveSoapDraft(draft) {
    await chrome.storage.session.set({ [SOAP_DRAFT_KEY]: normalizeSoapDraft(draft) });
  }
  async function getSoapDraft() {
    const result = await chrome.storage.session.get(SOAP_DRAFT_KEY);
    const draft = result[SOAP_DRAFT_KEY];
    return draft ? normalizeSoapDraft(draft) : null;
  }
  async function clearSoapDraft() {
    await chrome.storage.session.remove(SOAP_DRAFT_KEY);
  }
  async function saveTranscript(transcript) {
    await chrome.storage.session.set({ [TRANSCRIPT_KEY]: normalizeTranscript(transcript) });
  }
  async function getTranscript(apptId) {
    const result = await chrome.storage.session.get(TRANSCRIPT_KEY);
    const transcript = result[TRANSCRIPT_KEY];
    if (!transcript || transcript.apptId !== apptId) return null;
    return normalizeTranscript(transcript);
  }
  async function appendTranscriptEntry(apptId, entry) {
    const existing = await getTranscript(apptId);
    const next = normalizeTranscript({
      ...existing ?? EMPTY_SESSION_TRANSCRIPT,
      apptId,
      entries: [...existing?.entries ?? [], normalizeTranscriptEntry(entry)],
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await saveTranscript(next);
    return next;
  }
  async function clearTranscript() {
    await chrome.storage.session.remove(TRANSCRIPT_KEY);
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
  async function saveMseChecklist(checklist) {
    await chrome.storage.session.set({
      [MSE_CHECKLIST_KEY]: { ...DEFAULT_MSE_CHECKLIST, ...checklist, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
    });
  }
  async function getMseChecklist() {
    const result = await chrome.storage.session.get(MSE_CHECKLIST_KEY);
    const checklist = result[MSE_CHECKLIST_KEY];
    return checklist ? { ...DEFAULT_MSE_CHECKLIST, ...checklist } : null;
  }
  async function clearMseChecklist() {
    await chrome.storage.session.remove(MSE_CHECKLIST_KEY);
  }
  var REFERENCE_LIBRARY_KEY = "spn_reference_library";
  async function getReferenceLibrary() {
    const result = await chrome.storage.local.get(REFERENCE_LIBRARY_KEY);
    const files = result[REFERENCE_LIBRARY_KEY];
    return Array.isArray(files) ? files : [];
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
- If a detail is not in the data, leave it out entirely \u2014 do not pad with boilerplate.`;
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
  var LOW_SIGNAL_LINES = /* @__PURE__ */ new Set([
    "common sense",
    "straight",
    "least homophobic",
    "tiktok"
  ]);
  function normalizeWhitespace2(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  function splitLines2(value) {
    return value.replace(/\r\n/g, "\n").split(/\n+/).map((line) => sanitizeLine(line)).filter(Boolean);
  }
  function sanitizeLine(value) {
    return normalizeWhitespace2(value).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\b(\d+)x\s*\/?\s*week\b/gi, "$1 times per week").replace(/\b(\d+)x\b/gi, "$1 times").replace(/\b2x\b/gi, "twice").replace(/\b3x\b/gi, "3 times").replace(/\b4x\b/gi, "4 times").replace(/\b5x\b/gi, "5 times").replace(/\b6x\b/gi, "6 times").replace(/\bstriipper\b/gi, "stripper").replace(/\broofied\b/gi, "was drugged").replace(/\bAldo\b/g, "Also");
  }
  function unique2(values) {
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
  function firstNonEmpty(...values) {
    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
    return "";
  }
  function sentence(value) {
    const trimmed = normalizeWhitespace2(value).replace(/[.]+$/, "");
    return trimmed ? `${trimmed}.` : "";
  }
  function joinSentences(values) {
    return values.map((value) => sentence(value)).filter(Boolean).join(" ");
  }
  function formatList(values, conjunction = "and") {
    const cleaned = unique2(values.map((value) => normalizeWhitespace2(value)).filter(Boolean));
    if (!cleaned.length) return "";
    if (cleaned.length === 1) return cleaned[0];
    if (cleaned.length === 2) return `${cleaned[0]} ${conjunction} ${cleaned[1]}`;
    return `${cleaned.slice(0, -1).join(", ")}, ${conjunction} ${cleaned[cleaned.length - 1]}`;
  }
  function buildTranscriptText(transcript) {
    if (!transcript?.entries.length) return "";
    return transcript.entries.map((entry) => `${entry.speaker}: ${entry.text}`).join("\n");
  }
  function includesPattern(lines, pattern) {
    return lines.some((line) => pattern.test(line));
  }
  function extractQuotedPhrases(lines) {
    const phrases = [];
    for (const line of lines) {
      const matches = line.matchAll(/"([^"]{3,})"/g);
      for (const match of matches) {
        const phrase = normalizeWhitespace2(match[1]);
        if (phrase) phrases.push(phrase);
      }
    }
    return unique2(phrases);
  }
  function extractMoneySpent(lines) {
    for (const line of lines) {
      if (!/\bspent\b/i.test(line)) continue;
      const match = line.match(/\$?\s?(\d[\d,]*)/);
      if (!match) continue;
      const digits = match[1].replace(/,/g, "");
      const amount = Number.parseInt(digits, 10);
      if (!Number.isFinite(amount)) continue;
      return `$${amount.toLocaleString("en-US")}`;
    }
    return "";
  }
  function extractAbortionsCount(lines) {
    for (const line of lines) {
      const match = line.match(/\b(\d+)\s+abortions?\b/i);
      if (match) return match[1];
    }
    return "";
  }
  function lowerFirst(value) {
    if (!value) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
  }
  function formatGoalLabel(goal) {
    const raw = normalizeWhitespace2(goal.goal).replace(/[.]+$/, "");
    const simplified = raw.replace(/^reduce frequency and intensity of\s+/i, "reduce ").replace(/\bweekly\s+/i, "").replace(/^increase insight into how\s+/i, "increase insight into how ");
    return `Goal to ${lowerFirst(simplified)}`;
  }
  function formatAssessmentStatus(value) {
    const normalized = value.trim().toLowerCase();
    if (normalized === "limited progress noted") return "Limited progress";
    if (normalized === "some progress noted") return "Some progress";
    if (normalized === "good progress noted") return "Good progress";
    if (normalized === "progress remains under review") return "Progress remains under review";
    return value.trim() || "Progress remains under review";
  }
  function summarizeInterventions(interventions) {
    const cleaned = interventions.map((item) => item.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!cleaned.length) return "";
    const short = cleaned.map((item) => item.match(/\(([^)]+)\)/)?.[1]?.trim() ?? "");
    if (short.every(Boolean)) {
      return formatList(short);
    }
    return formatList(cleaned);
  }
  function hasClinicalKeyword(line) {
    return /\b(anxiety|anxious|anger|angry|fight|fights|argument|arguing|yell|yelled|yelling|job|partner|girlfriend|boyfriend|relationship|conflict|drink|drinking|alcohol|cannabis|marijuana|weed|roofied|drugged|bar|breathe|breathing|lifting|cycling|exercise|anger management|session|mse|affect|speech|thought|oriented|guilt|sad|miss|panic|fear|trigger)\b/i.test(line);
  }
  function isLowSignalLine(line) {
    const normalized = normalizeWhitespace2(line).toLowerCase();
    if (!normalized) return true;
    if (LOW_SIGNAL_LINES.has(normalized)) return true;
    if (/^[a-z]+(?:\s+[a-z]+)?$/i.test(normalized) && normalized.split(" ").length <= 2 && !hasClinicalKeyword(normalized)) {
      return true;
    }
    return normalized.split(" ").length < 3 && !hasClinicalKeyword(normalized);
  }
  function analyzeSessionNotes(lines) {
    const signals = {
      relationshipConflict: [],
      anxiety: [],
      substance: [],
      coping: [],
      support: [],
      objective: [],
      directQuotes: [],
      attachment: []
    };
    for (const rawLine of lines) {
      const line = sanitizeLine(rawLine);
      if (!line || isLowSignalLine(line)) continue;
      if ((line.match(/"/g) ?? []).length >= 2) {
        signals.directQuotes.push(line);
      }
      if (/\b(yell(?:ed|ing)?|fight|fights|argument|arguing|called? .*job|job .*times|meeting up|guy|girlfriend|boyfriend|partner|relationship|conflict|guilty|loser|dirty snake)\b/i.test(line)) {
        signals.relationshipConflict.push(line);
      }
      if (/\b(anxiety|anxious|panic|fear|trigger|spiky|distress|worry)\b/i.test(line)) {
        signals.anxiety.push(line);
      }
      if (/\b(drink|drinking|alcohol|bar|drugged|cannabis|marijuana|weed|joint|substance)\b/i.test(line)) {
        signals.substance.push(line);
      }
      if (/\b(breathe|breathing|cycling|lifting|exercise|class|anger management|track|log|journal|pause)\b/i.test(line)) {
        signals.coping.push(line);
      }
      if (/\b(contact|referral|Andrea|Grimshaw)\b/i.test(line)) {
        signals.support.push(line);
      }
      if (/\b(mse|appearance|affect|speech|behavior|thought|oriented|a&o|observed|presented|engaged|tearful|guarded|calm)\b/i.test(line)) {
        signals.objective.push(line);
      }
      if (/\b(miss her|miss him|miss them|birthday|valentine|tatted|tattoo|abortions?)\b/i.test(line)) {
        signals.attachment.push(line);
      }
    }
    return {
      relationshipConflict: unique2(signals.relationshipConflict),
      anxiety: unique2(signals.anxiety),
      substance: unique2(signals.substance),
      coping: unique2(signals.coping),
      support: unique2(signals.support),
      objective: unique2(signals.objective),
      directQuotes: unique2(signals.directQuotes),
      attachment: unique2(signals.attachment)
    };
  }
  function extractFrequency(lines) {
    for (const line of lines) {
      const match = line.match(/\b(twice|\d+\s+times?)\s+per\s+week\b/i);
      if (match) {
        const raw = match[0].toLowerCase();
        if (raw === "1 time per week" || raw === "1 times per week") return "once per week";
        if (raw === "2 times per week") return "twice per week";
        return raw;
      }
    }
    for (const line of lines) {
      const match = line.match(/\b(\d+)\s+times?\b/i);
      if (match) return `${match[1]} times`;
    }
    return "";
  }
  function extractCallCount(lines) {
    for (const line of lines) {
      const match = line.match(/\bcalled?.*job\s+(\d+)\s+times\b/i) ?? line.match(/\bcalled?.*job.*?(\d+)\s+times\b/i);
      if (match) return match[1];
    }
    return "";
  }
  function summarizeSubjective(lines, signals, transcript, intake) {
    const sentences = [];
    const clientTranscriptLines = transcript?.entries.filter((entry) => entry.speaker === "client").map((entry) => sanitizeLine(entry.text)).filter((line) => line && !isLowSignalLine(line)) ?? [];
    const conflictSource = unique2([
      ...signals.relationshipConflict,
      ...clientTranscriptLines.filter((line) => /\b(fight|argument|partner|girlfriend|boyfriend|relationship|job)\b/i.test(line))
    ]);
    const quotedPhrases = extractQuotedPhrases(lines);
    const moneySpent = extractMoneySpent(lines);
    const abortionsCount = extractAbortionsCount(lines);
    const hasTattooHistory = includesPattern(lines, /\b(tatted|tattoo)\b/i);
    const hasHazyMemory = includesPattern(lines, /\b(hazy memory|blurred memory|don't remember|memory)\b/i);
    const hasBasement = includesPattern(lines, /\bbasement\b/i);
    const hasSeparatedFromFriends = includesPattern(lines, /\bseparated from (his |her |their )?friends|away from (his |her |their )?friends\b/i);
    const hasTouching = includesPattern(lines, /\b(man touching|guy touching|someone touching|touched him|touched me)\b/i);
    const hasVideoFear = includesPattern(lines, /\bvideo\b/i);
    const hasOthersKnowFear = includesPattern(lines, /\bothers know|people know|know about this|people saw\b/i);
    const wantsToMoveForward = includesPattern(lines, /\bmove forward|moving forward|move on\b/i);
    const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i);
    const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i);
    const keepMouthShut = includesPattern(lines, /\bkeep (my|his) mouth shut|shut your mouth\b/i);
    if (conflictSource.length) {
      const frequency = extractFrequency(conflictSource);
      if (frequency && signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
        sentences.push(`Client reported ongoing conflict with partner, including yelling or arguments about ${frequency} and repeated calls to partner's workplace while upset`);
      } else if (frequency) {
        sentences.push(`Client reported ongoing conflict with partner, including yelling or arguments about ${frequency}`);
      } else {
        sentences.push("Client reported ongoing conflict and strain in the relationship");
      }
      if (keepMouthShut) {
        sentences.push("Client stated that even when he plans to keep his mouth shut, he often loses control, then yells, criticizes, and becomes defensive");
      } else if (signals.directQuotes.length) {
        sentences.push("Client described repeated criticism, accusations, and hurtful exchanges during arguments with partner");
      }
      if (quotedPhrases.length) {
        const quotedPreview = quotedPhrases.slice(0, 5).map((phrase) => `"${phrase}"`).join(", ");
        sentences.push(`Client identified triggers including statements such as ${quotedPreview}`);
      }
    }
    if (signals.anxiety.length) {
      if (signals.relationshipConflict.some((line) => /\bguy|meeting up\b/i.test(line))) {
        sentences.push("Client described strong anxiety and jealousy related to partner contact with another man");
      } else {
        sentences.push("Client described high anxiety during the week");
      }
    }
    if (moneySpent) {
      sentences.push(`Client shared that he spent ${moneySpent} on Valentine's Day and did not feel that the effort was reciprocated`);
    }
    if (hasTattooHistory || abortionsCount) {
      const historyParts = [];
      if (hasTattooHistory) historyParts.push("he has her name tattooed multiple times on his body");
      if (abortionsCount) historyParts.push(`they had ${abortionsCount} abortions together`);
      sentences.push(`Client also shared that ${formatList(historyParts)}`);
    }
    if (signals.substance.length) {
      if (signals.substance.some((line) => /\bdrugged|bar\b/i.test(line))) {
        if (hasHazyMemory || hasBasement || hasSeparatedFromFriends || hasTouching) {
          const incidentParts = [];
          if (hasHazyMemory) incidentParts.push("about 20 minutes of hazy memory");
          if (hasBasement) incidentParts.push("being in a basement");
          if (hasSeparatedFromFriends) incidentParts.push("being separated from friends");
          if (hasTouching) incidentParts.push("a man touching him");
          sentences.push(`Client also reported a recent incident in which he believes he was drugged at a bar, with ${formatList(incidentParts)}`);
        } else {
          sentences.push("Client also reported a recent incident in which he believes he was drugged at a bar");
        }
        if (hasVideoFear || hasOthersKnowFear) {
          sentences.push("Client shared anxiety that there may be a video of the incident or that others may know about it");
        }
      } else {
        sentences.push("Client also discussed ongoing alcohol and substance-use concerns");
      }
    }
    if (signals.attachment.length) {
      sentences.push("Client expressed ongoing hurt, attachment, and difficulty letting go of the relationship");
    }
    if (wantsToMoveForward || wantsLessDrinking || wantsExercise) {
      const changeGoals = [];
      if (wantsToMoveForward) changeGoals.push("move forward");
      if (wantsLessDrinking) changeGoals.push("drink less");
      if (wantsExercise) changeGoals.push("focus more on cycling and lifting weights");
      if (changeGoals.length) {
        sentences.push(`Client also stated that he wants to ${formatList(changeGoals)}`);
      }
    }
    if (!sentences.length) {
      const fallback = [
        firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems),
        intake?.historyOfPresentIllness ?? ""
      ].map((value) => sentence(value)).filter(Boolean);
      return fallback.join(" ") || "Client discussed current symptoms and stressors during session.";
    }
    return joinSentences(sentences);
  }
  function summarizeObjective(lines, signals, intake) {
    const sentences = [];
    const hasAttachmentMarkers = signals.attachment.length > 0 || includesPattern(lines, /\b(tatted|tattoo|abortions?|valentine)\b/i);
    const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i);
    const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i);
    if (signals.objective.length) {
      sentences.push(...signals.objective.slice(0, 2));
    } else {
      const reflectedThemes = [];
      if (signals.anxiety.length) reflectedThemes.push("anxiety");
      if (signals.relationshipConflict.length) {
        reflectedThemes.push("anger");
        reflectedThemes.push("jealousy");
        reflectedThemes.push("relationship stress");
      }
      if (hasAttachmentMarkers) reflectedThemes.push("attachment");
      if (signals.substance.length) reflectedThemes.push("alcohol-related risk");
      if (reflectedThemes.length) {
        sentences.push(`Session focused on ${formatList(reflectedThemes)}`);
      } else {
        sentences.push("Session focused on current symptoms and recent stressors");
      }
    }
    if (signals.coping.length) {
      const copingLabels = [];
      if (signals.coping.some((line) => /\bcycling|lifting|exercise|class\b/i.test(line))) {
        copingLabels.push("exercise");
      }
      if (signals.coping.some((line) => /\bbreathe|breathing\b/i.test(line))) {
        copingLabels.push("breathing skills");
      }
      if (signals.coping.some((line) => /\banger management\b/i.test(line))) {
        copingLabels.push("anger-management work");
      }
      if (copingLabels.length) {
        sentences.push(`Client identified ${formatList(copingLabels)} as coping efforts`);
      }
    }
    if (signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
      sentences.push("Session notes suggest poor impulse control during relationship distress");
    }
    if (wantsLessDrinking || wantsExercise) {
      if (wantsLessDrinking && wantsExercise) {
        sentences.push("Clinician reflected client's stated desire to drink less and increase exercise");
      } else if (wantsLessDrinking) {
        sentences.push("Clinician reflected client's stated desire to drink less");
      } else if (wantsExercise) {
        sentences.push("Clinician reflected client's stated desire to increase exercise");
      }
    }
    if (signals.objective.length === 0) {
      sentences.push("No formal MSE findings or rating scales were documented in the session notes");
    }
    const measurementLines = [];
    if (signals.objective.some((line) => /\bphq\b/i.test(line)) && intake?.phq9) {
      measurementLines.push(`PHQ-9 previously captured at ${intake.phq9.totalScore}/27 (${intake.phq9.severity})`);
    }
    if (signals.objective.some((line) => /\bgad\b/i.test(line)) && intake?.gad7) {
      measurementLines.push(`GAD-7 previously captured at ${intake.gad7.totalScore}/21 (${intake.gad7.severity})`);
    }
    return joinSentences([...sentences, ...measurementLines]);
  }
  function inferGoalFocus(goal) {
    const text = `${goal.goal} ${goal.objectives.map((objective) => objective.objective).join(" ")}`.toLowerCase();
    if (/\b(alcohol|cannabis|marijuana|weed|substance|impulsivity)\b/.test(text)) return "substance";
    if (/\b(verbal|fight|argument|conflict|partner|communication|anger)\b/.test(text)) return "conflict";
    if (/\b(anxiety|panic|fear|worry)\b/.test(text)) return "anxiety";
    if (/\b(mood|depression|sadness|irritability)\b/.test(text)) return "mood";
    return "general";
  }
  function statusFromGoal(goal, focus, signals) {
    const improvementSource = [
      ...signals.relationshipConflict,
      ...signals.anxiety,
      ...signals.substance,
      ...signals.coping
    ].join(" ").toLowerCase();
    if (/\b(better|improved|less|fewer|calmer|stopped|reduced)\b/.test(improvementSource)) {
      return "Some progress noted";
    }
    if (focus === "conflict" && signals.relationshipConflict.length) return "Limited progress noted";
    if (focus === "substance" && (signals.substance.length || signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line)))) {
      return "Limited progress noted";
    }
    if ((focus === "anxiety" || focus === "mood") && signals.anxiety.length) return "Limited progress noted";
    const existing = goal.status.trim().toLowerCase();
    if (existing === "no improvement") return "Limited progress noted";
    if (existing === "some improvement") return "Some progress noted";
    if (existing === "significant improvement") return "Good progress noted";
    if (goal.status.trim()) return sentence(goal.status).replace(/[.]$/, "");
    return "Progress remains under review";
  }
  function evidenceForGoal(goal, focus, signals) {
    switch (focus) {
      case "conflict":
        if (signals.relationshipConflict.length) {
          const frequency = extractFrequency(signals.relationshipConflict);
          const callCount = extractCallCount(signals.relationshipConflict);
          if (frequency && callCount) {
            return `Client continues to report yelling or verbal conflict about ${frequency}, along with repeated calls to partner's workplace (${callCount} times) while upset`;
          }
          if (frequency) {
            return `Client continues to report yelling or verbal conflict about ${frequency}`;
          }
          return "Client continues to report jealousy, arguments, and difficulty slowing down during relationship stress";
        }
        return "Relationship stress remains a focus of treatment";
      case "substance":
        if (signals.substance.length) {
          const mentionsStoppingAlcohol = signals.substance.some((line) => /\bstop drinking\b/i.test(line));
          const barRisk = signals.substance.some((line) => /\bdrugged|bar\b/i.test(line));
          const impulsiveConflict = signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line));
          if (barRisk && impulsiveConflict) {
            return "Session included alcohol-related risk and ongoing impulsive behavior during conflict; insight into how substance use may worsen mood and reactions remains limited";
          }
          if (signals.substance.some((line) => /\bdrugged|bar\b/i.test(line))) {
            return mentionsStoppingAlcohol ? "Session included alcohol-related risk, including being drugged at a bar, and the need to reduce drinking remained part of the discussion" : "Session included alcohol-related risk, including discussion of being drugged while at a bar";
          }
          return "The link between alcohol or cannabis use, mood, and conflict still needs more work";
        }
        if (signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
          return "Ongoing impulsive behavior during conflict suggests that insight into triggers and worsening factors is still limited";
        }
        if (/\b(alcohol|cannabis|marijuana|weed|substance)\b/i.test(goal.goal)) {
          return "No clear update on alcohol or cannabis tracking was documented this session, and this treatment need remains active";
        }
        return "The link between substance use, mood, and conflict continues to need review";
      case "anxiety":
        if (signals.anxiety.length) {
          return "Anxiety remains elevated in the context of current stressors";
        }
        return "Anxiety symptoms continue to need monitoring";
      case "mood":
        if (signals.anxiety.length || signals.relationshipConflict.length) {
          return "Mood symptoms remain tied to ongoing relationship stress and emotional reactivity";
        }
        return "Mood symptoms continue to need monitoring";
      default:
        return "Current session content was reviewed in relation to this treatment goal";
    }
  }
  function summarizeAssessment(lines, signals, treatmentPlan, diagnosticImpressions, intake) {
    const parts = [];
    const wantsToMoveForward = includesPattern(lines, /\bmove forward|moving forward|move on\b/i);
    const hasNoAttachmentStatement = includesPattern(lines, /\bno attachment|have no attachment\b/i);
    const hasGoodManIdentity = includesPattern(lines, /\bgood man\b/i) && includesPattern(lines, /\bpoint of view\b/i);
    const hasAttachmentHistory = signals.attachment.length > 0 || includesPattern(lines, /\b(tatted|tattoo|abortions?|valentine)\b/i);
    const hasFrustrationMarkers = includesPattern(lines, /\b(frustrat|angry|hurt|got nothing)\b/i) || Boolean(extractMoneySpent(lines));
    const hasBarRisk = includesPattern(lines, /\bdrugged|bar\b/i);
    const hasBarAnxiety = includesPattern(lines, /\bvideo\b/i) || includesPattern(lines, /\bothers know|people know|know about this|people saw\b/i);
    const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i);
    const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i);
    if (treatmentPlan?.goals.length) {
      for (const goal of treatmentPlan.goals) {
        const focus = inferGoalFocus(goal);
        const status = statusFromGoal(goal, focus, signals);
        const goalParts = [`${formatGoalLabel(goal)}: ${formatAssessmentStatus(status)}.`];
        if (focus === "conflict") {
          if (signals.relationshipConflict.length) {
            goalParts.push("Client continues to report frequent conflict, emotional reactivity, and repeated contact attempts during distress.");
          } else {
            goalParts.push(`${sentence(evidenceForGoal(goal, focus, signals))}`);
          }
          if ((wantsToMoveForward || hasNoAttachmentStatement) && signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
            goalParts.push("Clinician reflected client's frustration and highlighted the mismatch between client's stated wish to move on and have no attachment and his current behavior, including repeated calls, anger about partner seeing another man, and ongoing preoccupation with the relationship.");
          } else if (hasFrustrationMarkers) {
            goalParts.push("Clinician reflected client's frustration with the ongoing relationship dynamic.");
          }
          if (hasGoodManIdentity) {
            goalParts.push(`Clinician also reflected that client's identity as a "good man" appears strongly tied to her point of view, which may be reinforcing reactivity and difficulty disengaging.`);
          }
          if (hasAttachmentHistory) {
            goalParts.push("Clinician validated the difficulty of breaking away from the relationship given the attachment and shared history.");
          }
        } else if (focus === "substance") {
          if (hasBarRisk && hasBarAnxiety) {
            goalParts.push("Session included alcohol-related risk and anxiety related to the recent bar incident.");
          } else if (hasBarRisk) {
            goalParts.push("Session included alcohol-related risk.");
          } else {
            goalParts.push(`${sentence(evidenceForGoal(goal, focus, signals))}`);
          }
          let insightSentence = "Insight into how alcohol use may worsen judgment, impulsivity, emotional reactivity, and vulnerability remains limited";
          if (wantsLessDrinking || wantsExercise) {
            const selfCareParts = [];
            if (wantsLessDrinking) selfCareParts.push("reduce drinking");
            if (wantsExercise) selfCareParts.push("improve self-care through exercise");
            insightSentence += `, though client did express desire to ${formatList(selfCareParts)}`;
          }
          goalParts.push(sentence(insightSentence));
        } else {
          goalParts.push(sentence(evidenceForGoal(goal, focus, signals)));
        }
        parts.push(goalParts.join(" "));
      }
    }
    const diagnosisSummary = diagnosticImpressions.length ? diagnosticImpressions.map((impression) => `${impression.name}${impression.code ? ` (${impression.code})` : ""}`).join(", ") : treatmentPlan?.diagnoses.length ? treatmentPlan.diagnoses.map((diagnosis) => `${diagnosis.description}${diagnosis.code ? ` (${diagnosis.code})` : ""}`).join(", ") : "";
    if (diagnosisSummary) {
      parts.push(`Current presentation remains consistent with working diagnoses of ${diagnosisSummary}.`);
    } else if (firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems)) {
      parts.push(`Clinical focus remains on ${firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems)}.`);
    }
    return parts.join("\n\n") || "Assessment should be updated in relation to the treatment plan and current session themes.";
  }
  function summarizePlan(lines, signals, treatmentPlan) {
    const planItems = [];
    const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i);
    const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i);
    if (treatmentPlan?.treatmentFrequency) {
      planItems.push(`Continue ${treatmentPlan.treatmentFrequency} psychotherapy`);
    } else {
      planItems.push("Continue psychotherapy as scheduled");
    }
    const objectiveText = treatmentPlan?.goals.flatMap((goal) => goal.objectives).map((objective) => objective.objective.toLowerCase()) ?? [];
    if (objectiveText.some((text) => /chain analysis/.test(text)) || signals.relationshipConflict.length) {
      planItems.push("Review recent conflicts with chain analysis");
    }
    if (objectiveText.some((text) => /distress tolerance|practice/.test(text)) || signals.coping.length) {
      if (signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
        planItems.push("Practice pause, breathing, and distress-tolerance skills before calling or confronting partner when upset");
      } else {
        planItems.push("Practice pause, breathing, and distress-tolerance skills during conflict");
      }
    }
    if (objectiveText.some((text) => /track|log|cannabis|alcohol/.test(text)) || signals.substance.length) {
      planItems.push("Track alcohol and cannabis use, mood, irritability, and conflict episodes between sessions");
    }
    if (wantsLessDrinking || wantsExercise) {
      const healthierCoping = [];
      if (includesPattern(lines, /\bcycle|cycling\b/i)) healthierCoping.push("cycling");
      if (includesPattern(lines, /\blift|lifting|weights?\b/i)) healthierCoping.push("lifting");
      if (wantsLessDrinking && healthierCoping.length) {
        planItems.push(`Support reduction in alcohol use and reinforce ${formatList(healthierCoping)} as healthier coping strategies`);
      } else if (wantsLessDrinking) {
        planItems.push("Support reduction in alcohol use as a treatment goal");
      } else if (healthierCoping.length) {
        planItems.push(`Reinforce ${formatList(healthierCoping)} as healthier coping strategies`);
      }
    }
    if (signals.coping.some((line) => /\banger management\b/i.test(line))) {
      planItems.push("Continue anger-management work");
    }
    if (signals.support.length) {
      planItems.push("Review referral or support contact options as clinically indicated");
    }
    if (treatmentPlan?.interventions.length) {
      const summarizedInterventions = summarizeInterventions(treatmentPlan.interventions);
      if (summarizedInterventions) {
        planItems.push(`Continue ${summarizedInterventions} interventions`);
      }
    }
    return joinSentences(unique2(planItems));
  }
  function extractTreatmentPlanId(treatmentPlan) {
    const sourceUrl = treatmentPlan?.sourceUrl ?? "";
    const match = sourceUrl.match(/diagnosis_treatment_plans\/([^/?#]+)/);
    return match?.[1] ?? "";
  }
  function buildSoapDraft(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, prefs, meta = {}) {
    const sessionLines = splitLines2(sessionNotes);
    const transcriptLines = transcript?.entries.map((entry) => sanitizeLine(entry.text)).filter((line) => line && !isLowSignalLine(line)) ?? [];
    const allLines = [...sessionLines, ...transcriptLines];
    const signals = analyzeSessionNotes(allLines);
    const transcriptText = buildTranscriptText(transcript);
    const clientName = firstNonEmpty(
      meta.clientName,
      intake?.fullName,
      `${intake?.firstName ?? ""} ${intake?.lastName ?? ""}`.trim(),
      "Client"
    );
    const sessionDate = firstNonEmpty(
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
      subjective: summarizeSubjective(allLines, signals, transcript, intake),
      objective: summarizeObjective(allLines, signals, intake),
      assessment: summarizeAssessment(allLines, signals, treatmentPlan, diagnosticImpressions, intake),
      plan: summarizePlan(allLines, signals, treatmentPlan),
      sessionNotes: sessionNotes.trim(),
      transcript: transcriptText,
      treatmentPlanId: extractTreatmentPlanId(treatmentPlan),
      generatedAt: now,
      editedAt: now,
      status: "draft"
    };
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
    const { system, user } = buildSoapPrompt(transcript, sessionNotes, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs);
    const { sanitized: sanitizedUser, mapping: userMapping } = deidentify(user, intake);
    const { sanitized: sanitizedSystem, mapping: systemMapping } = deidentify(system, intake);
    const fullMapping = { ...systemMapping, ...userMapping };
    await saveDeidentifyMapping(fullMapping);
    console.log("[SPN] Generating SOAP with OpenAI (de-identified)...", {
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
  function firstNonEmpty2(...values) {
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
  function unique3(items) {
    return Array.from(
      new Set(
        items.map((item) => item.trim()).filter(Boolean)
      )
    );
  }
  function splitGoals(raw) {
    return unique3(
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
    return unique3(parts).slice(0, 2).join("; ");
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
      diagnoses: unique3(diagnosticImpressions.map((impression) => impression.name)).slice(0, 3),
      primaryConcern: clip(
        firstNonEmpty2(
          intake.chiefComplaint,
          intake.presentingProblems,
          intake.historyOfPresentIllness,
          intake.manualNotes,
          intake.additionalSymptoms
        ),
        150
      ),
      patientGoals: splitGoals(intake.counselingGoals).slice(0, 3),
      predisposingFactors: unique3([
        ...pickFactors([intake.familyPsychiatricHistory, intake.familyMentalEmotionalHistory], 2),
        ...pickFactors([intake.physicalSexualAbuseHistory, intake.domesticViolenceHistory], 1),
        ...pickFactors([intake.developmentalHistory, intake.medicalHistory], 1)
      ]).slice(0, 4),
      precipitatingFactors: unique3([
        ...pickFactors([intake.chiefComplaint, intake.presentingProblems, intake.historyOfPresentIllness], 2),
        ...pickFactors([intake.recentSymptoms, intake.additionalSymptoms], 1)
      ]).slice(0, 4),
      perpetuatingFactors: unique3([
        ...pickFactors([intake.troubleSleeping], 1),
        ...pickFactors([intake.alcoholUse, intake.drugUse, intake.substanceUseHistory], 1),
        ...pickFactors([intake.relationshipDescription, intake.occupation], 1),
        ...pickFactors([
          intake.phq9?.difficulty ? `Depression-related impairment: ${intake.phq9.difficulty}` : "",
          intake.gad7?.difficulty ? `Anxiety-related impairment: ${intake.gad7.difficulty}` : ""
        ], 1)
      ]).slice(0, 4),
      protectiveFactors: unique3([
        ...pickFactors([intake.counselingGoals ? `Stated treatment goals: ${intake.counselingGoals}` : ""], 1),
        ...pickFactors([intake.livingArrangement, intake.relationshipDescription], 1),
        ...pickFactors([intake.priorTreatment ? `Prior treatment engagement: ${intake.priorTreatment}` : ""], 1),
        ...pickFactors([
          needsMedicalCoordination ? `Existing medical contacts: ${firstNonEmpty2(intake.primaryCarePhysician, intake.prescribingMD, intake.medications)}` : ""
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
      clientName: firstNonEmpty2(intake.firstName, intake.fullName) || "Patient",
      age,
      genderLabel: normalizeGenderLabel(firstNonEmpty2(intake.genderIdentity, intake.sex)),
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
    const queries = unique3([
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
    return unique3(queries).slice(0, 5);
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
    return unique3(modalities).slice(0, 4);
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
    return unique3(problems).slice(0, 5);
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
    for (const g of unique3(goals).slice(0, 6)) {
      lines.push(`  ${g}`);
    }
    lines.push("");
    lines.push("Objectives:");
    for (const o of unique3(objectives).slice(0, 6)) {
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
      const medicalContact = firstNonEmpty2(intake.primaryCarePhysician, intake.prescribingMD);
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
    for (const g of unique3(goals).slice(0, 6)) {
      lines.push(`  ${g}`);
    }
    lines.push("");
    lines.push("Objectives:");
    for (const o of unique3(objectives).slice(0, 6)) {
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
  function firstNonEmpty3(...values) {
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
      firstNonEmpty3(intake.chiefComplaint, intake.presentingProblems),
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
    const chiefComplaint = firstNonEmpty3(
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
    const clientName = firstNonEmpty3(
      intake.fullName,
      `${intake.firstName} ${intake.lastName}`.trim()
    );
    const goals = splitGoals2(intake.counselingGoals);
    const sessionDate = firstNonEmpty3(
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
      chiefComplaint: firstNonEmpty3(
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
  var pendingBooleanSyncOperations = [];
  async function flushBooleanSyncOperations() {
    if (pendingBooleanSyncOperations.length === 0) return;
    const operations = pendingBooleanSyncOperations.splice(0, pendingBooleanSyncOperations.length);
    try {
      const response = await chrome.runtime.sendMessage({
        type: "SPN_SYNC_BOOLEAN_FIELDS",
        operations
      });
      if (!response?.ok) {
        console.warn("[SPN] Boolean field sync was not acknowledged:", response?.error ?? "unknown error");
      }
    } catch (error) {
      console.warn("[SPN] Failed to sync boolean fields in the page world:", error);
    }
  }
  function checkCheckboxByLabel(groupName, labelText) {
    if (!labelText) return false;
    const target = labelText.toLowerCase().trim();
    const checkboxes = document.querySelectorAll(`input[name^="${groupName}-"][type="checkbox"]`);
    for (const cb of Array.from(checkboxes)) {
      const label = cb.closest("label");
      if (!label) continue;
      const text = label.textContent?.replace(label.querySelector("input")?.value ?? "", "").trim().toLowerCase() ?? "";
      if (text === target || text.includes(target) || target.includes(text)) {
        if (!cb.checked) {
          cb.click();
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
        if (!radio.checked) {
          radio.click();
        }
        return true;
      }
      const label = radio.closest("label");
      const labelText = label?.textContent?.trim().toLowerCase() ?? "";
      if (labelText === target || labelText.includes(target)) {
        if (!radio.checked) {
          radio.click();
        }
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
  function isAppointmentPage() {
    return /\/appointments\/\d+/.test(window.location.pathname);
  }
  function isVideoRoom() {
    return /\/appt-[a-f0-9]+\/room/.test(window.location.pathname);
  }
  function getVideoApptId() {
    const match = window.location.pathname.match(/\/appt-([a-f0-9]+)\/room/);
    return match ? match[1] : "";
  }
  function detectSoapForm() {
    const labels = ["free-text-1", "free-text-2", "free-text-3", "free-text-4"];
    const hasSoapFields = !!document.querySelector(".progress-individual-note-container") && labels.every((label) => !!document.querySelector(`[contenteditable="true"][aria-label="${label}"]`));
    if (!hasSoapFields) return false;
    const totalFreeText = document.querySelectorAll('[contenteditable="true"][aria-label^="free-text-"]').length;
    return totalFreeText <= 5;
  }
  function fillSoapNote(draft) {
    let filled = 0;
    if (fillProseMirrorByLabel("free-text-1", draft.subjective)) filled++;
    if (fillProseMirrorByLabel("free-text-2", draft.objective)) filled++;
    if (fillProseMirrorByLabel("free-text-3", draft.assessment)) filled++;
    if (fillProseMirrorByLabel("free-text-4", draft.plan)) filled++;
    return filled;
  }
  async function fillSavedSoapDraft(providedDraft) {
    const draft = providedDraft ?? await getSoapDraft();
    if (!draft) {
      return { ok: false, error: "No saved SOAP draft found. Save notes for SOAP first." };
    }
    if (!detectSoapForm()) {
      return { ok: false, error: "SOAP progress note form is not open on this page." };
    }
    await wait(300);
    const filled = fillSoapNote(draft);
    if (filled === 0) {
      return { ok: false, error: "SOAP fields were found, but no draft content could be filled." };
    }
    return { ok: true, filled };
  }
  var saveTimeout = null;
  function handleSessionNotesInput(textarea) {
    const apptId = getVideoApptId();
    if (!apptId) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveSessionNotes({
        apptId,
        notes: textarea.value,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }).catch(() => {
      });
    }, 500);
  }
  var videoRoomInitApptId = "";
  function injectVideoNotePanel() {
    if (!isVideoRoom()) return;
    if (document.getElementById("spn-video-notes")) return;
    const apptId = getVideoApptId();
    if (!apptId) return;
    if (apptId !== videoRoomInitApptId) {
      videoRoomInitApptId = apptId;
      clearSoapDraft().catch(() => {
      });
      clearMseChecklist().catch(() => {
      });
      clearTranscript().catch(() => {
      });
      captionCount = 0;
      stopIncrementalGeneration();
      if (captionObserver) {
        captionObserver.disconnect();
        captionObserver = null;
      }
      console.log("[SPN] Cleared stale session data for new appointment", apptId);
    }
    const panel = document.createElement("div");
    panel.id = "spn-video-notes";
    panel.innerHTML = `
    <div class="spn-video-notes-header">
      <span class="spn-video-notes-title">Session Notes</span>
      <div class="spn-video-notes-actions">
        <span class="spn-video-notes-status" id="spn-notes-status"></span>
        <button class="spn-video-notes-toggle" id="spn-notes-toggle" title="Minimize">\u2212</button>
      </div>
    </div>
    <div class="spn-video-notes-caption-status" id="spn-caption-status" title="Live caption capture status"></div>
    <div class="spn-video-notes-body" id="spn-notes-body">
      <textarea
        id="spn-session-textarea"
        class="spn-video-notes-textarea"
        placeholder="Type session notes here..."
        spellcheck="true"
      ></textarea>
      <div class="spn-mse-section">
        <button class="spn-mse-toggle" id="spn-mse-toggle">MSE Quick Check \u25B8</button>
        <div class="spn-mse-body" id="spn-mse-body" style="display:none">
          <div class="spn-mse-row" data-field="appearance">
            <span class="spn-mse-label">Appearance</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="well-groomed">well-groomed</button>
              <button class="spn-mse-pill active" data-value="casually dressed">casual dress</button>
              <button class="spn-mse-pill active" data-value="appropriate hygiene">good hygiene</button>
              <button class="spn-mse-pill" data-value="disheveled">disheveled</button>
              <button class="spn-mse-pill" data-value="unkempt">unkempt</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="behavior">
            <span class="spn-mse-label">Behavior</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="cooperative">cooperative</button>
              <button class="spn-mse-pill active" data-value="good eye contact">good eye contact</button>
              <button class="spn-mse-pill active" data-value="psychomotor normal">psychomotor normal</button>
              <button class="spn-mse-pill" data-value="guarded">guarded</button>
              <button class="spn-mse-pill" data-value="poor eye contact">poor eye contact</button>
              <button class="spn-mse-pill" data-value="agitated">agitated</button>
              <button class="spn-mse-pill" data-value="psychomotor retarded">retarded</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="speech">
            <span class="spn-mse-label">Speech</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="normal rate">normal rate</button>
              <button class="spn-mse-pill active" data-value="normal volume">normal volume</button>
              <button class="spn-mse-pill active" data-value="coherent">coherent</button>
              <button class="spn-mse-pill" data-value="pressured">pressured</button>
              <button class="spn-mse-pill" data-value="slow">slow</button>
              <button class="spn-mse-pill" data-value="soft">soft</button>
              <button class="spn-mse-pill" data-value="loud">loud</button>
              <button class="spn-mse-pill" data-value="monotone">monotone</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="mood">
            <span class="spn-mse-label">Mood</span>
            <input type="text" class="spn-mse-input" id="spn-mse-mood" placeholder="Client's words (e.g. anxious, good, frustrated)" />
          </div>
          <div class="spn-mse-row" data-field="affect">
            <span class="spn-mse-label">Affect</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="congruent">congruent</button>
              <button class="spn-mse-pill active" data-value="full range">full range</button>
              <button class="spn-mse-pill" data-value="flat">flat</button>
              <button class="spn-mse-pill" data-value="blunted">blunted</button>
              <button class="spn-mse-pill" data-value="labile">labile</button>
              <button class="spn-mse-pill" data-value="constricted">constricted</button>
              <button class="spn-mse-pill" data-value="incongruent">incongruent</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="thoughtProcess">
            <span class="spn-mse-label">Thought Process</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="linear">linear</button>
              <button class="spn-mse-pill active" data-value="goal-directed">goal-directed</button>
              <button class="spn-mse-pill" data-value="tangential">tangential</button>
              <button class="spn-mse-pill" data-value="circumstantial">circumstantial</button>
              <button class="spn-mse-pill" data-value="disorganized">disorganized</button>
              <button class="spn-mse-pill" data-value="flight of ideas">flight of ideas</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="thoughtContent">
            <span class="spn-mse-label">Thought Content</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="no SI">no SI</button>
              <button class="spn-mse-pill active" data-value="no HI">no HI</button>
              <button class="spn-mse-pill active" data-value="no delusions">no delusions</button>
              <button class="spn-mse-pill" data-value="SI endorsed">SI endorsed</button>
              <button class="spn-mse-pill" data-value="HI endorsed">HI endorsed</button>
              <button class="spn-mse-pill" data-value="paranoid ideation">paranoid ideation</button>
              <button class="spn-mse-pill" data-value="obsessions">obsessions</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="perceptions">
            <span class="spn-mse-label">Perceptions</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="no hallucinations">no hallucinations</button>
              <button class="spn-mse-pill" data-value="AH">AH</button>
              <button class="spn-mse-pill" data-value="VH">VH</button>
              <button class="spn-mse-pill" data-value="illusions">illusions</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="cognition">
            <span class="spn-mse-label">Cognition</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="alert">alert</button>
              <button class="spn-mse-pill active" data-value="oriented x4">oriented x4</button>
              <button class="spn-mse-pill active" data-value="intact memory">intact memory</button>
              <button class="spn-mse-pill" data-value="oriented x3">oriented x3</button>
              <button class="spn-mse-pill" data-value="impaired concentration">impaired concentration</button>
              <button class="spn-mse-pill" data-value="impaired memory">impaired memory</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="insight">
            <span class="spn-mse-label">Insight</span>
            <select class="spn-mse-select" id="spn-mse-insight">
              <option value="good" selected>Good</option>
              <option value="fair">Fair</option>
              <option value="limited">Limited</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div class="spn-mse-row" data-field="judgment">
            <span class="spn-mse-label">Judgment</span>
            <select class="spn-mse-select" id="spn-mse-judgment">
              <option value="good" selected>Good</option>
              <option value="fair">Fair</option>
              <option value="impaired">Impaired</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(panel);
    const textarea = document.getElementById("spn-session-textarea");
    const toggle = document.getElementById("spn-notes-toggle");
    const body = document.getElementById("spn-notes-body");
    const status = document.getElementById("spn-notes-status");
    getSessionNotes(apptId).then((existing) => {
      if (existing?.notes) {
        textarea.value = existing.notes;
      }
    }).catch(() => {
    });
    textarea.addEventListener("input", () => {
      status.textContent = "Saving...";
      handleSessionNotesInput(textarea);
      setTimeout(() => {
        status.textContent = "Saved";
      }, 600);
      setTimeout(() => {
        status.textContent = "";
      }, 2e3);
    });
    chrome.storage.onChanged.addListener((changes) => {
      if (!changes["spn_session_notes"]) return;
      const updated = changes["spn_session_notes"].newValue;
      if (!updated || updated.apptId !== apptId) return;
      if (document.activeElement !== textarea) {
        textarea.value = updated.notes;
      }
    });
    let minimized = false;
    toggle.addEventListener("click", () => {
      minimized = !minimized;
      body.style.display = minimized ? "none" : "block";
      toggle.textContent = minimized ? "+" : "\u2212";
      toggle.title = minimized ? "Expand" : "Minimize";
      panel.classList.toggle("spn-video-notes-minimized", minimized);
    });
    initMseChecklist(apptId);
  }
  function initMseChecklist(apptId) {
    const mseToggle = document.getElementById("spn-mse-toggle");
    const mseBody = document.getElementById("spn-mse-body");
    if (!mseToggle || !mseBody) return;
    let mseOpen = false;
    mseToggle.addEventListener("click", () => {
      mseOpen = !mseOpen;
      mseBody.style.display = mseOpen ? "block" : "none";
      mseToggle.textContent = mseOpen ? "MSE Quick Check \u25BE" : "MSE Quick Check \u25B8";
    });
    getMseChecklist().then((saved) => {
      if (!saved) return;
      restoreMseChecklist(saved);
    }).catch(() => {
    });
    let saveTimer = null;
    const debouncedSave = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveMseChecklist(collectMseChecklist()), 500);
    };
    mseBody.addEventListener("click", (e) => {
      const pill = e.target.closest(".spn-mse-pill");
      if (!pill) return;
      pill.classList.toggle("active");
      debouncedSave();
    });
    const moodInput = document.getElementById("spn-mse-mood");
    moodInput?.addEventListener("input", debouncedSave);
    const insightSelect = document.getElementById("spn-mse-insight");
    const judgmentSelect = document.getElementById("spn-mse-judgment");
    insightSelect?.addEventListener("change", debouncedSave);
    judgmentSelect?.addEventListener("change", debouncedSave);
  }
  function collectMseChecklist() {
    const getActivePills = (field) => {
      const row = document.querySelector(`.spn-mse-row[data-field="${field}"]`);
      if (!row) return [];
      return Array.from(row.querySelectorAll(".spn-mse-pill.active")).map((el) => el.getAttribute("data-value") || "");
    };
    return {
      appearance: getActivePills("appearance"),
      behavior: getActivePills("behavior"),
      speech: getActivePills("speech"),
      mood: document.getElementById("spn-mse-mood")?.value ?? "",
      affect: getActivePills("affect"),
      thoughtProcess: getActivePills("thoughtProcess"),
      thoughtContent: getActivePills("thoughtContent"),
      perceptions: getActivePills("perceptions"),
      cognition: getActivePills("cognition"),
      insight: document.getElementById("spn-mse-insight")?.value ?? "good",
      judgment: document.getElementById("spn-mse-judgment")?.value ?? "good",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function restoreMseChecklist(checklist) {
    const restorePills = (field, values) => {
      const row = document.querySelector(`.spn-mse-row[data-field="${field}"]`);
      if (!row) return;
      const valueSet = new Set(values);
      for (const pill of Array.from(row.querySelectorAll(".spn-mse-pill"))) {
        const value = pill.getAttribute("data-value") || "";
        pill.classList.toggle("active", valueSet.has(value));
      }
    };
    restorePills("appearance", checklist.appearance);
    restorePills("behavior", checklist.behavior);
    restorePills("speech", checklist.speech);
    restorePills("affect", checklist.affect);
    restorePills("thoughtProcess", checklist.thoughtProcess);
    restorePills("thoughtContent", checklist.thoughtContent);
    restorePills("perceptions", checklist.perceptions);
    restorePills("cognition", checklist.cognition);
    const moodInput = document.getElementById("spn-mse-mood");
    if (moodInput && checklist.mood) moodInput.value = checklist.mood;
    const insightSelect = document.getElementById("spn-mse-insight");
    if (insightSelect && checklist.insight) insightSelect.value = checklist.insight;
    const judgmentSelect = document.getElementById("spn-mse-judgment");
    if (judgmentSelect && checklist.judgment) judgmentSelect.value = checklist.judgment;
  }
  var lastVideoRoomUrl = "";
  var lastCaptionTimestamp = 0;
  var sessionEndTimer = null;
  var sessionEndTriggered = false;
  function startSessionEndDetection() {
    if (!isVideoRoom()) return;
    lastVideoRoomUrl = location.href;
    sessionEndTriggered = false;
    sessionEndTimer = setInterval(() => {
      if (sessionEndTriggered) return;
      if (lastCaptionTimestamp > 0 && Date.now() - lastCaptionTimestamp > 6e4) {
        console.log("[SPN] Caption stream inactive for 60s \u2014 session may have ended");
      }
    }, 1e4);
  }
  function checkSessionEndOnUrlChange(newUrl) {
    if (sessionEndTriggered) return;
    const wasVideoRoom = /\/appt-[a-f0-9]+\/room/.test(lastVideoRoomUrl);
    const isStillVideoRoom = /\/appt-[a-f0-9]+\/room/.test(newUrl);
    if (wasVideoRoom && !isStillVideoRoom) {
      sessionEndTriggered = true;
      stopIncrementalGeneration();
      if (sessionEndTimer) {
        clearInterval(sessionEndTimer);
        sessionEndTimer = null;
      }
      const apptMatch = lastVideoRoomUrl.match(/\/appt-([a-f0-9]+)\/room/);
      const apptId = apptMatch?.[1] ?? "";
      if (apptId) {
        handleSessionEnd(apptId);
      }
    }
    lastVideoRoomUrl = newUrl;
  }
  async function handleSessionEnd(apptId) {
    console.log("[SPN] Session ended for appointment", apptId);
    try {
      const prefs = await getPreferences();
      if (!prefs.autoGenerateOnSessionEnd) {
        console.log("[SPN] Auto-generation disabled in preferences");
        return;
      }
      showToast("Generating SOAP draft...", "info");
      const [sessionNotesData, transcript, intake, workspace, mseChecklist] = await Promise.all([
        getSessionNotes(apptId),
        getTranscript(apptId),
        getIntake(),
        getDiagnosticWorkspace(),
        getMseChecklist()
      ]);
      const sessionNotes = sessionNotesData?.notes ?? "";
      const diagnosticImpressions = workspace?.finalizedImpressions ?? [];
      const tpResult = await chrome.storage.session.get("spn_treatment_plan");
      const treatmentPlan = tpResult["spn_treatment_plan"] ?? null;
      const clientName = intake ? [intake.firstName, intake.lastName].filter(Boolean).join(" ") || intake.fullName : "";
      const draft = await generateSoapDraft(
        sessionNotes,
        transcript,
        treatmentPlan,
        intake,
        diagnosticImpressions,
        mseChecklist,
        prefs,
        { apptId, clientName, sessionDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US") }
      );
      await chrome.storage.session.set({ spn_soap_draft: draft });
      const method = draft.generationMethod === "llm" ? "AI-generated" : "Template-generated";
      showToast(`SOAP draft ready (${method}) \u2014 open popup to review`, "success");
      console.log("[SPN] Auto-generated SOAP draft:", draft.generationMethod);
    } catch (err) {
      console.error("[SPN] Failed to auto-generate SOAP draft:", err);
      showToast("SOAP auto-generation failed \u2014 generate manually from popup", "error");
    }
  }
  var captionObserver = null;
  var captionCount = 0;
  function updateCaptionStatus() {
    const el = document.getElementById("spn-caption-status");
    if (!el) return;
    if (captionCount === 0) {
      el.textContent = "Captions: waiting for captions...";
      el.className = "spn-video-notes-caption-status waiting";
    } else {
      el.textContent = `Captions: ${captionCount} captured`;
      el.className = "spn-video-notes-caption-status active";
    }
  }
  function inferSpeakerRole(name) {
    if (/\b(PsyD|PhD|LMFT|LCSW|LMHC|LPCC|LPC|MSW|MD|DO|NP|RN)\b/i.test(name)) {
      return "clinician";
    }
    return "client";
  }
  function findCaptionContainer() {
    return document.querySelector(".room-captions") ?? document.querySelector('[class*="room-captions"]');
  }
  function extractCaptionLines(container) {
    const results = [];
    let lines = container.querySelectorAll(".line");
    if (lines.length) {
      for (const line of lines) {
        const name = (line.querySelector(".name") ?? line.querySelector('[class*="name"]'))?.textContent?.trim() ?? "";
        const text = (line.querySelector(".text") ?? line.querySelector('[class*="text"]'))?.textContent?.trim() ?? "";
        if (text) results.push({ name, text });
      }
      return results;
    }
    lines = container.querySelectorAll('[class*="line"], [class*="caption"]');
    if (lines.length) {
      for (const line of lines) {
        const children = line.children;
        if (children.length >= 2) {
          const name = children[0].textContent?.trim() ?? "";
          const text = children[1].textContent?.trim() ?? "";
          if (text) results.push({ name, text });
        } else if (children.length === 1 || line.textContent) {
          const text = line.textContent?.trim() ?? "";
          if (text) results.push({ name: "", text });
        }
      }
      return results;
    }
    const body = container.querySelector('.body, [class*="body"]') ?? container;
    const childDivs = body.querySelectorAll(":scope > div, :scope > p, :scope > span");
    for (const el of childDivs) {
      const text = el.textContent?.trim() ?? "";
      if (text && text.length > 2) results.push({ name: "", text });
    }
    return results;
  }
  function startCaptionObserver() {
    if (!isVideoRoom()) return;
    if (captionObserver) return;
    const apptId = getVideoApptId();
    if (!apptId) return;
    const seenTexts = /* @__PURE__ */ new Set();
    let debounceTimer = null;
    function processCaptions() {
      const container = findCaptionContainer();
      if (!container) return;
      const lines = extractCaptionLines(container);
      if (!lines.length) return;
      for (const { name, text } of lines) {
        if (seenTexts.has(text)) continue;
        seenTexts.add(text);
        const speaker = inferSpeakerRole(name);
        captionCount++;
        lastCaptionTimestamp = Date.now();
        updateCaptionStatus();
        appendTranscriptEntry(apptId, {
          speaker,
          text,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }).catch(() => {
        });
      }
    }
    function attachObserver(target) {
      captionObserver?.disconnect();
      captionObserver = new MutationObserver(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processCaptions, 300);
      });
      captionObserver.observe(target, { childList: true, subtree: true, characterData: true });
      console.log("[SPN] Caption observer attached to", target.className);
    }
    updateCaptionStatus();
    const existing = findCaptionContainer();
    if (existing) {
      attachObserver(existing);
      console.log("[SPN] Caption observer started for appointment", apptId);
      return;
    }
    console.log("[SPN] Waiting for caption container to appear...");
    const waitForCaptions = new MutationObserver(() => {
      const container = findCaptionContainer();
      if (container) {
        waitForCaptions.disconnect();
        attachObserver(container);
        console.log("[SPN] Caption observer started for appointment", apptId);
      }
    });
    waitForCaptions.observe(document.body, { childList: true, subtree: true });
  }
  var incrementalGenTimer = null;
  var lastIncrementalCaptionCount = 0;
  var incrementalGenerating = false;
  function startIncrementalGeneration() {
    if (!isVideoRoom()) return;
    if (incrementalGenTimer) return;
    const apptId = getVideoApptId();
    if (!apptId) return;
    incrementalGenTimer = setInterval(async () => {
      if (incrementalGenerating) return;
      if (captionCount <= lastIncrementalCaptionCount) return;
      if (captionCount - lastIncrementalCaptionCount < 10) return;
      incrementalGenerating = true;
      lastIncrementalCaptionCount = captionCount;
      try {
        const prefs = await getPreferences();
        const [sessionNotesData, transcript, intake, workspace, mseChecklist] = await Promise.all([
          getSessionNotes(apptId),
          getTranscript(apptId),
          getIntake(),
          getDiagnosticWorkspace(),
          getMseChecklist()
        ]);
        if (!transcript?.entries.length) return;
        const sessionNotes = sessionNotesData?.notes ?? "";
        const diagnosticImpressions = workspace?.finalizedImpressions ?? [];
        const treatmentPlan = await chrome.storage.session.get("spn_treatment_plan").then((r) => r["spn_treatment_plan"] ?? null);
        const clientName = intake ? [intake.firstName, intake.lastName].filter(Boolean).join(" ") || intake.fullName : "";
        console.log("[SPN] Incremental SOAP generation...", { captionCount, transcriptEntries: transcript.entries.length });
        const draft = await generateSoapDraft(
          sessionNotes,
          transcript,
          treatmentPlan,
          intake,
          diagnosticImpressions,
          mseChecklist,
          prefs,
          { apptId, clientName, sessionDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US") }
        );
        await saveSoapDraft(draft);
        console.log("[SPN] Incremental SOAP draft updated:", draft.generationMethod);
      } catch (err) {
        console.warn("[SPN] Incremental SOAP generation failed:", err);
      } finally {
        incrementalGenerating = false;
      }
    }, 9e4);
    console.log("[SPN] Incremental SOAP generation started for", apptId);
  }
  function stopIncrementalGeneration() {
    if (incrementalGenTimer) {
      clearInterval(incrementalGenTimer);
      incrementalGenTimer = null;
    }
    lastIncrementalCaptionCount = 0;
    incrementalGenerating = false;
  }
  function capitalize(value) {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  function normalizeWhitespace3(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  function unique4(values) {
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
  function joinList2(items) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  }
  function lowerCaseFirst(value) {
    if (!value) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
  }
  function hasAnyPattern(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
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
    return age ? `${age}-year-old` : "";
  }
  function getManualAgeLabel(notes) {
    const match = notes.match(/\b(\d{1,3})\s*(?:yo|y\/o|year old)\b/i);
    return match ? `${match[1]}-year-old` : "";
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
      if (/multiple races/i.test(race)) {
        ethnicityOrRace = "multiracial Hispanic/Latino";
      } else {
        ethnicityOrRace = race ? `${race} Hispanic/Latino` : "Hispanic/Latino";
      }
    } else if (/^no$/i.test(ethnicity)) {
      ethnicityOrRace = /multiple races/i.test(race) ? "multiracial" : race;
    } else {
      ethnicityOrRace = ethnicity || (/multiple races/i.test(race) ? "multiracial" : race);
    }
    return [ethnicityOrRace, gender].filter(Boolean).join(" ");
  }
  function inferPronounForms(intake) {
    const genderText = `${intake.genderIdentity} ${intake.sex}`.toLowerCase();
    if (/\b(male|man|boy|he|him)\b/.test(genderText)) {
      return { subject: "he", object: "him", possessive: "his", reflexive: "himself" };
    }
    if (/\b(female|woman|girl|she|her)\b/.test(genderText)) {
      return { subject: "she", object: "her", possessive: "her", reflexive: "herself" };
    }
    return { subject: "they", object: "them", possessive: "their", reflexive: "themselves" };
  }
  var ANXIETY_PATTERNS = [/\banxiety\b/i, /\banxious\b/i, /\bworry\b/i, /\bpanic\b/i, /\bon edge\b/i, /\bjealous\b/i];
  var DEPRESSION_PATTERNS = [/\bdepress/i, /\bsad\b/i, /\bdown\b/i, /\bhopeless/i, /\bcry(?:ing)?\b/i, /\bgrief\b/i, /\bloss\b/i];
  var ANGER_PATTERNS = [/\banger\b/i, /\bangry\b/i, /\byell(?:ed|ing)?\b/i, /\bfight(?:ing|s)?\b/i, /\birritab/i, /\bdefensive\b/i, /\blose control\b/i];
  var RELATIONSHIP_PATTERNS = [/\bgirlfriend\b/i, /\bboyfriend\b/i, /\bpartner\b/i, /\bspouse\b/i, /\bex\b/i, /\brelationship\b/i, /\battachment\b/i, /\bmarriage\b/i, /\bengage(?:d|ment)?\b/i];
  var TRAUMA_PATTERNS = [/\btrauma\b/i, /\bassault\b/i, /\babuse\b/i, /\bviolence\b/i, /\broofied\b/i, /\bdrugged\b/i, /\btouch(?:ed|ing)\b/i, /\baccident\b/i, /\bcrash\b/i];
  var ABUSE_PATTERNS = [/\babuse\b/i, /\bassault\b/i, /\broofied\b/i, /\bdrugged\b/i, /\btouch(?:ed|ing)\b/i, /\bslap(?:ped)?\b/i, /\bpush(?:ed)?\b/i, /\bviolence\b/i];
  var SUBSTANCE_PATTERNS = [/\balcohol\b/i, /\bdrink(?:ing)?\b/i, /\bdrank\b/i, /\bbeer\b/i, /\bwine\b/i, /\bliquor\b/i, /\bpatron\b/i, /\bsoju\b/i, /\bweed\b/i, /\bmarijuana\b/i, /\bcannabis\b/i, /\bjoint\b/i, /\bblunt\b/i, /\bthc\b/i, /\bvape\b/i, /\bnicotine\b/i, /\bcigarette\b/i, /\bcocaine\b/i, /\bcrack\b/i, /\bmeth\b/i, /\badderall\b/i, /\bxanax\b/i, /\bopioid\b/i, /\bshroom/i, /\bmushroom/i, /\blsd\b/i];
  var SLEEP_PATTERNS = [/\bsleep\b/i, /\binsomnia\b/i, /\bnightmare/i];
  var CONCENTRATION_PATTERNS = [/\bfoggy\b/i, /\bfogginess\b/i, /\bconcentrat/i, /\bfocus\b/i, /\bhazy memory\b/i];
  var EXERCISE_PATTERNS = [/\bcycling\b/i, /\bcycle\b/i, /\blifting\b/i, /\bweights?\b/i, /\bgym\b/i, /\bexercise\b/i];
  var BREATHING_PATTERNS = [/\bbreathe\b/i, /\bbreathing\b/i, /\bgrounding\b/i];
  var SPIRITUAL_PATTERNS = [/\bgod\b/i, /\bchurch\b/i, /\bfaith\b/i, /\bpray/i, /\bspiritual/i];
  var ANGER_MANAGEMENT_PATTERNS = [/\banger management\b/i];
  function normalizeLivingArrangement(livingArrangement, pronouns) {
    const trimmed = livingArrangement.trim();
    if (!trimmed) return "";
    if (/alone|live alone/i.test(trimmed)) return "alone";
    let cleaned = trimmed.replace(/^i\s+live\s+/i, "").replace(/^i\s+love\s+/i, "").replace(/^live\s+/i, "").replace(/^love\s+/i, "").trim();
    if (!cleaned) return "";
    cleaned = cleaned.replace(/\bmy mom\b/gi, `${pronouns.possessive} mother`).replace(/\bmy dad\b/gi, `${pronouns.possessive} father`).replace(/\bmy parents\b/gi, `${pronouns.possessive} parents`).replace(/\bmy grandma\b/gi, `${pronouns.possessive} grandmother`).replace(/\bmy grandpa\b/gi, `${pronouns.possessive} grandfather`).replace(/\bmy sister\b/gi, `${pronouns.possessive} sister`).replace(/\bmy brother\b/gi, `${pronouns.possessive} brother`).replace(/\bmy family\b/gi, `${pronouns.possessive} family`).replace(/\bmy\b/gi, pronouns.possessive);
    const lower = cleaned.toLowerCase();
    if (/^with\s+/i.test(lower)) return lower;
    return `with ${lower}`;
  }
  function normalizeOccupation(occupation) {
    const trimmed = occupation.trim();
    if (!trimmed) return "";
    if (/unemployed|not working|out of work/i.test(trimmed)) return "currently unemployed";
    const yearsMatch = trimmed.match(/^(.*?)[,\s-]+(\d+\s+years?)$/i);
    if (yearsMatch) {
      const role = yearsMatch[1].trim().replace(/[,\s-]+$/, "").replace(/^(a|an)\s+/i, "").toLowerCase();
      const duration = yearsMatch[2].trim().toLowerCase();
      return role ? `a ${role} for ${duration}` : "";
    }
    const cleaned = trimmed.replace(/^(a|an)\s+/i, "").toLowerCase();
    return cleaned ? `a ${cleaned}` : "";
  }
  function normalizeEducationForNarrative(education) {
    const trimmed = education.trim();
    if (!trimmed) return "";
    const cleaned = trimmed.replace(/^education[:\s-]*/i, "").replace(/^i\s+(?:am|have|completed|finished|earned)\s+/i, "").replace(/[.]+$/, "").trim().toLowerCase();
    if (!cleaned) return "";
    if (/^high$/i.test(cleaned)) return "completed high school";
    if (/^bachelor/.test(cleaned)) return `completed a ${cleaned}`;
    if (/^master/.test(cleaned)) return `completed a ${cleaned}`;
    if (/^associate/.test(cleaned)) return `completed an ${cleaned}`;
    return `completed ${cleaned}`;
  }
  function normalizeClause(value) {
    return lowerCaseFirst(value.trim().replace(/[.]+$/, ""));
  }
  function rewriteClientPerspective(value, pronouns) {
    return normalizeWhitespace3(value).replace(/\bmyself\b/gi, pronouns.reflexive).replace(/\bmine\b/gi, `${pronouns.possessive} own`).replace(/\bmy\b/gi, pronouns.possessive).replace(/\bme\b/gi, pronouns.object).replace(/\bourselves\b/gi, pronouns.reflexive).replace(/\bours\b/gi, `${pronouns.possessive} own`).replace(/\bour\b/gi, pronouns.possessive).replace(/\bus\b/gi, pronouns.object);
  }
  function smoothClinicalPhrase(value, pronouns) {
    let cleaned = rewriteClientPerspective(value, pronouns);
    cleaned = cleaned.replace(
      /\bwork on\s+(?:his|her|their)\s+communicating\s+(?:his|her|their)\s+emotions\s+and\s+understanding\s+them\s+for\s+the\s+relationships\s+around\s+(?:him|her|them)\b/i,
      `improve how ${pronouns.subject} communicates and understands ${pronouns.possessive} emotions in close relationships`
    ).replace(
      /\bwork on\s+(?:his|her|their)\s+communicating\s+(?:his|her|their)\s+emotions\b/i,
      `improve how ${pronouns.subject} communicates ${pronouns.possessive} emotions`
    ).replace(/\bfor the relationships around (?:him|her|them)\b/i, "in close relationships").replace(/\bunderstanding them for the relationships around (?:him|her|them)\b/i, `understanding them in ${pronouns.possessive} close relationships`).replace(/\s+,/g, ",");
    return normalizeWhitespace3(cleaned);
  }
  function splitComplaintParts(value) {
    return value.split(/[\n,;]+/).map((part) => normalizeClause(part)).filter(Boolean);
  }
  function buildChiefComplaintSentences(chiefComplaint, pronoun, pronouns) {
    const parts = splitComplaintParts(chiefComplaint);
    if (parts.length === 0) return [];
    const hasAirplaneAccident = parts.some((part) => /air\s*plane|airplane|plane accident|plane crash/.test(part));
    const otherParts = parts.filter((part) => !/air\s*plane|airplane|plane accident|plane crash/.test(part));
    if (hasAirplaneAccident) {
      const hasAnxiety = otherParts.some((part) => /\banxiety\b/.test(part));
      const remaining = otherParts.filter((part) => !/\banxiety\b/.test(part));
      let sentence2 = `${pronoun} recently was in an airplane accident`;
      if (hasAnxiety) sentence2 += " and reported anxiety";
      if (remaining.length) sentence2 += ` and reported ${remaining.join(", ")}`;
      return [`${sentence2}.`];
    }
    return parts.map((part) => {
      if (/^i\s+want\s+to\b/i.test(part)) {
        const normalized = smoothClinicalPhrase(part.replace(/^i\s+want\s+to\b/i, "").trim(), pronouns);
        return `${pronoun} presented for therapy to ${normalized}.`;
      }
      if (/^want\s+to\b/i.test(part)) {
        const normalized = smoothClinicalPhrase(part.replace(/^want\s+to\b/i, "").trim(), pronouns);
        return `${pronoun} presented for therapy to ${normalized}.`;
      }
      if (/^i\s+need\s+to\b/i.test(part)) {
        const normalized = smoothClinicalPhrase(part.replace(/^i\s+need\s+to\b/i, "").trim(), pronouns);
        return `${pronoun} reported needing to ${normalized}.`;
      }
      if (/^i\s+feel\b/i.test(part)) {
        const normalized = smoothClinicalPhrase(part.replace(/^i\s+feel\b/i, "").trim(), pronouns);
        return `${pronoun} reported feeling ${normalized}.`;
      }
      if (/\btherap(y|ist)\b|\bcounseling\b|\btreatment\b/i.test(part)) {
        return `${pronoun} presented for ${smoothClinicalPhrase(part, pronouns)}.`;
      }
      return `${pronoun} reported ${smoothClinicalPhrase(part, pronouns)}.`;
    });
  }
  function toReportedSpeech(value, pronouns) {
    const trimmed = smoothClinicalPhrase(value, pronouns).replace(/[.]+$/, "");
    if (!trimmed) return "";
    const replacements = [
      [/^i want to\b/i, `${capitalize(pronouns.subject)} wants to`],
      [/^i would like to\b/i, `${capitalize(pronouns.subject)} would like to`],
      [/^i need to\b/i, `${capitalize(pronouns.subject)} needs to`],
      [/^i am\b/i, `${capitalize(pronouns.subject)} is`],
      [/^i'm\b/i, `${capitalize(pronouns.subject)} is`],
      [/^i have\b/i, `${capitalize(pronouns.subject)} has`],
      [/^i feel\b/i, `${capitalize(pronouns.subject)} feels`],
      [/^i live\b/i, `${capitalize(pronouns.subject)} lives`],
      [/^my\b/i, `${capitalize(pronouns.possessive)}`]
    ];
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(trimmed)) {
        return `${trimmed.replace(pattern, replacement)}.`;
      }
    }
    return `${capitalize(pronouns.subject)} reported ${lowerCaseFirst(trimmed)}.`;
  }
  function buildManualThemePhrases(notes) {
    const lower = notes.toLowerCase();
    const phrases = [];
    if (hasAnyPattern(lower, ANXIETY_PATTERNS)) phrases.push("anxiety and worry");
    if (hasAnyPattern(lower, ANGER_PATTERNS)) phrases.push("anger and emotional reactivity");
    if (hasAnyPattern(lower, RELATIONSHIP_PATTERNS)) phrases.push("relationship stress and attachment difficulties");
    if (hasAnyPattern(lower, TRAUMA_PATTERNS)) phrases.push("distress related to a recent unsafe event");
    if (hasAnyPattern(lower, DEPRESSION_PATTERNS)) phrases.push("low mood or loss-related distress");
    if (hasAnyPattern(lower, SLEEP_PATTERNS)) phrases.push("sleep disturbance");
    if (hasAnyPattern(lower, CONCENTRATION_PATTERNS)) phrases.push("difficulty concentrating");
    if (hasAnyPattern(lower, SUBSTANCE_PATTERNS)) phrases.push("substance use concerns");
    return unique4(phrases).slice(0, 4);
  }
  function buildManualGoalPhrases(notes) {
    const lower = notes.toLowerCase();
    const phrases = [];
    if (/\bstop drinking\b|\bdrink less\b|\breduce drinking\b|\bsober\b/.test(lower)) {
      phrases.push("reducing alcohol use");
    }
    if (hasAnyPattern(lower, EXERCISE_PATTERNS)) {
      phrases.push("using exercise as a coping skill");
    }
    if (hasAnyPattern(lower, BREATHING_PATTERNS)) {
      phrases.push("using breathing skills");
    }
    if (hasAnyPattern(lower, ANGER_MANAGEMENT_PATTERNS)) {
      phrases.push("strengthening anger-management skills");
    }
    return unique4(phrases).slice(0, 3);
  }
  function buildManualChiefComplaintSentences(intake) {
    const notes = intake.manualNotes.trim();
    if (!notes) return [];
    const themePhrases = buildManualThemePhrases(notes);
    const goalPhrases = buildManualGoalPhrases(notes);
    const sentences = [];
    if (themePhrases.length) {
      sentences.push(`Additional concerns include ${joinList2(themePhrases)}.`);
    }
    if (goalPhrases.length) {
      sentences.push(`The client expressed interest in ${joinList2(goalPhrases)}.`);
    }
    return sentences;
  }
  function buildManualHPISentences(intake) {
    const notes = intake.manualNotes.trim();
    if (!notes) return [];
    const lower = notes.toLowerCase();
    const sentences = [];
    if (hasAnyPattern(lower, RELATIONSHIP_PATTERNS) && hasAnyPattern(lower, ANGER_PATTERNS)) {
      sentences.push("Current stress appears closely tied to relationship conflict and difficulty managing strong emotions.");
    } else {
      const themePhrases = buildManualThemePhrases(notes);
      if (themePhrases.length) {
        sentences.push(`The client also reported ${joinList2(themePhrases)}.`);
      }
    }
    if (hasAnyPattern(lower, TRAUMA_PATTERNS)) {
      if (/\bvideo\b|\bothers know\b|\bperceived by others\b/.test(lower)) {
        sentences.push("The client also described distress related to a recent unsafe event and worry about how others may perceive the situation.");
      } else {
        sentences.push("The client also described distress related to a recent unsafe event.");
      }
    }
    const goalPhrases = buildManualGoalPhrases(notes);
    if (goalPhrases.length) {
      sentences.push(`The client described efforts toward ${joinList2(goalPhrases)}.`);
    }
    return unique4(sentences);
  }
  function buildManualSubstanceDetails(notes) {
    const lower = notes.toLowerCase();
    const details = [];
    if (!hasAnyPattern(lower, SUBSTANCE_PATTERNS)) return details;
    if (/\balcohol\b|\bdrink(?:ing)?\b|\bdrank\b|\bbeer\b|\bwine\b|\bliquor\b|\bpatron\b|\bsoju\b/.test(lower)) {
      if (/\bstop drinking\b|\bdrink less\b|\breduce drinking\b/.test(lower)) {
        details.push("Alcohol use was discussed, and the client expressed interest in drinking less");
      } else {
        details.push("Alcohol use was discussed in clinician notes");
      }
    }
    if (/\bweed\b|\bmarijuana\b|\bcannabis\b|\bjoint\b|\bblunt\b|\bthc\b/.test(lower)) {
      details.push("Cannabis use was discussed in clinician notes");
    }
    if (/\bvape\b|\bnicotine\b|\bcigarette\b/.test(lower)) {
      details.push("Nicotine use was discussed in clinician notes");
    }
    if (/\bcocaine\b|\bcrack\b|\bmeth\b|\badderall\b|\bxanax\b|\bopioid\b|\bshroom/i.test(lower)) {
      details.push("Other substance use was discussed in clinician notes");
    }
    return unique4(details);
  }
  function buildManualSocialHistorySentences(intake) {
    const notes = intake.manualNotes.trim();
    if (!notes) return [];
    const lower = notes.toLowerCase();
    const sentences = [];
    if (hasAnyPattern(lower, RELATIONSHIP_PATTERNS) && !intake.relationshipDescription.trim()) {
      sentences.push("The client reported significant relationship stress.");
    }
    if (hasAnyPattern(lower, EXERCISE_PATTERNS)) {
      sentences.push("The client engages in exercise, such as cycling or weight lifting, as part of a coping routine.");
    }
    if (hasAnyPattern(lower, SPIRITUAL_PATTERNS)) {
      sentences.push("Faith or spiritual involvement was identified as part of the client's support system.");
    }
    if (hasAnyPattern(lower, ANGER_MANAGEMENT_PATTERNS)) {
      sentences.push("The client is currently engaged in anger-management work.");
    }
    return unique4(sentences);
  }
  function extractClinicalFromOverviewNote(note, clientName, pronouns) {
    const clean = note.replace(/^overview note \d+:\s*/gim, "").replace(/^\d+ min (?:phone )?consultation\s*/gim, "").trim();
    if (!clean) return { introParagraph: "", clinicalParagraphs: [] };
    const paragraphs = clean.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const subject = capitalize(pronouns.subject);
    const cleanName = clientName.replace(/\s*\(.*?\)/g, "").replace(/\s+/g, " ").trim();
    const skipSentence = (s) => {
      const t = s.trim();
      return /^plan\b/i.test(t) || /sliding scale/i.test(t) || /per session/i.test(t) || /paneled with/i.test(t) || /will look into/i.test(t) || /^psychoeducation was provided/i.test(t) || /^discussed introduction of/i.test(t) || /agreement for/i.test(t) || /until clinician/i.test(t) || /shared agreement/i.test(t);
    };
    const filterParagraph = (p) => {
      const sentences = p.split(/(?<=\.)\s+/);
      return sentences.filter((s) => !skipSentence(s)).join(" ").trim();
    };
    const introRaw = paragraphs[0] ? filterParagraph(paragraphs[0]) : "";
    const introParagraph = introRaw.replace(/\bClient's\b/g, `${cleanName}'s`).replace(/\bClient\b/g, cleanName);
    const clinicalParagraphs = paragraphs.slice(1).map(filterParagraph).filter(Boolean).map(
      (p) => p.replace(/\bClient's\b/g, capitalize(pronouns.possessive)).replace(/\bClient\b/g, subject)
    );
    return { introParagraph, clinicalParagraphs };
  }
  function buildChiefComplaintNarrative(intake) {
    const rawName = intake.fullName || [intake.firstName, intake.lastName].filter(Boolean).join(" ") || intake.firstName || "Patient";
    const name = rawName.replace(/\s*\(.*?\)/g, "").replace(/\s+/g, " ").trim();
    const age = calculateAge(intake.dob) || getManualAgeLabel(intake.manualNotes);
    const identity = buildIdentityDescriptor(intake);
    const pronouns = inferPronounForms(intake);
    const livingArrangement = normalizeLivingArrangement(intake.livingArrangement, pronouns);
    const occupation = normalizeOccupation(intake.occupation);
    const education = normalizeEducationForNarrative(intake.education);
    const subject = capitalize(pronouns.subject);
    const introBits = [];
    const ageIdentity = age && identity ? `${age} ${identity}` : [age, identity].filter(Boolean).join(" ");
    if (ageIdentity) {
      introBits.push(`${name} is a ${ageIdentity}`);
    } else {
      introBits.push(name);
    }
    const whoClause = [];
    if (education) whoClause.push(education);
    if (livingArrangement) whoClause.push(`lives ${livingArrangement}`);
    if (occupation) whoClause.push(`works as ${occupation.replace(/\s+for\s+(\d+\s+years?)$/i, "")}`);
    if (whoClause.length === 1) {
      introBits.push(`who ${whoClause[0]}`);
    } else if (whoClause.length === 2) {
      introBits.push(`who ${whoClause[0]} and ${whoClause[1]}`);
    } else if (whoClause.length >= 3) {
      introBits.push(`who ${whoClause.slice(0, -1).join(", ")}, and ${whoClause[whoClause.length - 1]}`);
    }
    let intro = introBits.join(" ");
    intro += ".";
    const sentences = [intro];
    if (intake.chiefComplaint) {
      sentences.push(...buildChiefComplaintSentences(intake.chiefComplaint, subject, pronouns));
    }
    sentences.push(...buildManualChiefComplaintSentences(intake));
    if (intake.counselingGoals) {
      const goal = smoothClinicalPhrase(intake.counselingGoals.replace(/^to\s+/i, "").trim(), pronouns);
      if (goal) {
        sentences.push(`${subject} stated that ${pronouns.possessive} goal was to ${lowerCaseFirst(goal).replace(/[.]+$/, "")}.`);
      }
    }
    if (sentences.length === 1 && intake.overviewClinicalNote?.trim()) {
      const { introParagraph, clinicalParagraphs } = extractClinicalFromOverviewNote(
        intake.overviewClinicalNote,
        name,
        pronouns
      );
      if (introParagraph) sentences[0] = introParagraph;
      if (clinicalParagraphs.length) sentences.push(...clinicalParagraphs);
    }
    return sentences.join(" ");
  }
  function buildHistoryOfPresentIllnessText(intake) {
    const pronouns = inferPronounForms(intake);
    const hpi = intake.historyOfPresentIllness.trim();
    if (intake._llmEnrichedHpi && hpi) {
      const result2 = [hpi, ...buildManualHPISentences(intake)];
      return unique4(result2).join(" ");
    }
    const hpiLower = hpi.toLowerCase();
    const isRedundant = (value) => {
      if (!hpi || hpi.length < 200) return false;
      const words = value.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 4);
      if (words.length < 3) return false;
      const matchCount = words.filter((w) => hpiLower.includes(w)).length;
      return matchCount / words.length > 0.6;
    };
    const candidateSources = [
      intake.presentingProblems.trim(),
      intake.chiefComplaint.trim(),
      intake.counselingGoals ? `Goal: ${intake.counselingGoals}`.trim() : ""
    ].filter((value) => Boolean(value) && !isRedundant(value));
    const sources = [hpi, ...candidateSources].filter(Boolean);
    const subject = capitalize(pronouns.subject);
    const sentences = unique4(
      sources.map((value) => {
        if (/^goal:\s*/i.test(value)) {
          const goalText = smoothClinicalPhrase(value.replace(/^goal:\s*/i, "").replace(/^to\s+/i, "").trim(), pronouns);
          return goalText ? `${subject} stated that ${pronouns.subject} wants to ${lowerCaseFirst(goalText).replace(/[.]+$/, "")}.` : "";
        }
        if (/^i want to\b/i.test(value)) {
          const normalized = smoothClinicalPhrase(value.replace(/^i want to\b/i, "").trim(), pronouns);
          return `${subject} reported wanting to ${normalized.replace(/[.]+$/, "")}.`;
        }
        if (/\bclient\b/i.test(value)) {
          return value.replace(/\bclient's\b/gi, capitalize(pronouns.possessive)).replace(/\bclient\b/gi, subject);
        }
        return toReportedSpeech(value, pronouns);
      }).filter(Boolean)
    );
    const hasStructuredSources = sources.length > 0;
    const result = unique4([...sentences, ...buildManualHPISentences(intake)]);
    console.log("[SPN] HPI fallback check:", { hasStructuredSources, overviewNoteLength: intake.overviewClinicalNote?.length ?? 0, resultSoFar: result.length });
    if (!hasStructuredSources && intake.overviewClinicalNote?.trim()) {
      const name = intake.fullName || [intake.firstName, intake.lastName].filter(Boolean).join(" ") || "Patient";
      const { clinicalParagraphs } = extractClinicalFromOverviewNote(
        intake.overviewClinicalNote,
        name,
        pronouns
      );
      if (clinicalParagraphs.length) result.push(...clinicalParagraphs);
    }
    return result.join(" ");
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
    return Array.from(/* @__PURE__ */ new Set([...parts, ...buildManualSubstanceDetails(intake.manualNotes)])).join("; ");
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
    const substanceDetails = buildSubstanceDetails(intake);
    const hasSubstanceUse = intake.alcoholUse || intake.drugUse || intake.substanceUseHistory || substanceDetails;
    if (hasSubstanceUse) {
      const isUsing = /yes|current|daily|weekly|monthly|regular|social|occasional/i.test(
        `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory} ${substanceDetails}`
      ) || hasAnyPattern(`${substanceDetails}`.toLowerCase(), SUBSTANCE_PATTERNS);
      if (selectRadio("single-select-35", isUsing ? "1" : "2")) filled++;
      if (isUsing) {
        filled += fillSubstanceCheckboxes(intake);
        filled += fillLabeledField("If yes, please specify", substanceDetails);
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
    const symptoms = buildIntakeAnswerCorpus(intake);
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
    const symptoms = buildIntakeAnswerCorpus(intake);
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
      { label: "Nausea or abdominal distress", patterns: [/nausea|nauseous|queasy|queasiness|abdominal distress|stomach distress|upset stomach/] },
      { label: "Abdominal pain or discomfort", patterns: [/abdominal pain|abdominal discomfort|stomach pain|stomach pains|stomach ache|stomach discomfort/] },
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
    if (!intake.physicalSexualAbuseHistory && hasAnyPattern(corpus, ABUSE_PATTERNS)) {
      if (/roofied|drugged|touched|sexual assault|sexual/i.test(corpus)) {
        if (checkCheckboxByLabel("multi-select-20", "Sexual")) filled++;
      }
      if (/slap|push|physical|violence/i.test(corpus)) {
        if (checkCheckboxByLabel("multi-select-20", "Physical")) filled++;
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
    if (intake.substanceUseHistory && !/no|denied|denies|none/i.test(intake.substanceUseHistory) || hasAnyPattern(corpus, SUBSTANCE_PATTERNS)) {
      if (checkCheckboxByLabel("multi-select-21", "History of substance abuse")) filled++;
    }
    if (intake.physicalSexualAbuseHistory && !/no|denied|denies|none/i.test(intake.physicalSexualAbuseHistory) || hasAnyPattern(corpus, ABUSE_PATTERNS)) {
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
    const substance = `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory} ${buildSubstanceDetails(intake)}`.toLowerCase();
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
    const sentences = [];
    const pronouns = inferPronounForms(intake);
    const livingArrangement = normalizeLivingArrangement(intake.livingArrangement, pronouns);
    const occupation = normalizeOccupation(intake.occupation);
    const education = normalizeEducationForNarrative(intake.education);
    if (occupation) {
      sentences.push(`Client works as ${occupation.replace(/[.]+$/, "")}.`);
    }
    if (education) {
      sentences.push(`Client ${education}.`);
    }
    if (livingArrangement) {
      sentences.push(`Client lives ${livingArrangement}.`);
    }
    if (intake.relationshipDescription) {
      sentences.push(`Relationship history includes ${lowerCaseFirst(smoothClinicalPhrase(intake.relationshipDescription.replace(/[.]+$/, ""), pronouns))}.`);
    }
    if (intake.additionalInfo) {
      sentences.push(ensureSentence(smoothClinicalPhrase(intake.additionalInfo, pronouns)));
    }
    sentences.push(...buildManualSocialHistorySentences(intake));
    return unique4(sentences).join(" ");
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
  function ensureSentence(value) {
    const trimmed = normalizeWhitespace3(value);
    if (!trimmed) return "";
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  }
  function cleanDiagnosticReasoning(value) {
    return normalizeWhitespace3(
      value.replace(/\s*Most direct supporting sentence:\s.+$/i, "").trim()
    );
  }
  function formatDiagnosisLabel(impression) {
    return impression.code ? `${impression.name} (${impression.code})` : impression.name;
  }
  function buildPresentingConcernPhrases(intake) {
    const corpus = buildIntakeAnswerCorpus(intake);
    const phrases = [];
    if ((intake.gad7?.totalScore ?? 0) >= 10 || hasAnyPattern(corpus, ANXIETY_PATTERNS)) {
      phrases.push("anxiety and worry");
    }
    if ((intake.phq9?.totalScore ?? 0) >= 10 || hasAnyPattern(corpus, DEPRESSION_PATTERNS)) {
      phrases.push("low mood or depressive symptoms");
    }
    if (hasAnyPattern(corpus, ANGER_PATTERNS)) {
      phrases.push("anger and emotional reactivity");
    }
    if (hasAnyPattern(corpus, RELATIONSHIP_PATTERNS)) {
      phrases.push("relationship stress");
    }
    if (hasAnyPattern(corpus, TRAUMA_PATTERNS)) {
      phrases.push("trauma-related distress");
    }
    if (hasAnyPattern(corpus, SUBSTANCE_PATTERNS)) {
      phrases.push("substance use concerns");
    }
    if (hasAnyPattern(corpus, SLEEP_PATTERNS)) {
      phrases.push("sleep disturbance");
    }
    if (hasAnyPattern(corpus, CONCENTRATION_PATTERNS)) {
      phrases.push("difficulty concentrating");
    }
    return unique4(phrases).slice(0, 5);
  }
  function buildRelevantHistoryPhrases(intake) {
    const phrases = [];
    if (intake.priorTreatment.trim() && !/^(no|none|denied|denies)$/i.test(intake.priorTreatment.trim())) {
      phrases.push(`prior treatment history (${intake.priorTreatment.trim()})`);
    }
    if (intake.medications.trim() && !/^(no|none|denied|denies)$/i.test(intake.medications.trim())) {
      phrases.push(`medication history (${intake.medications.trim()})`);
    }
    if (intake.medicalHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.medicalHistory.trim())) {
      phrases.push(`medical history (${intake.medicalHistory.trim()})`);
    }
    if (intake.surgeries.trim()) {
      phrases.push(`reported surgeries (${intake.surgeries.trim()})`);
    }
    if (intake.physicalSexualAbuseHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.physicalSexualAbuseHistory.trim()) || intake.domesticViolenceHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.domesticViolenceHistory.trim())) {
      phrases.push("trauma or abuse history");
    }
    if (intake.familyPsychiatricHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.familyPsychiatricHistory.trim()) || intake.familyMentalEmotionalHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.familyMentalEmotionalHistory.trim())) {
      phrases.push("family mental health history");
    }
    return unique4(phrases).slice(0, 4);
  }
  function buildMaintainingFactorPhrases(intake) {
    const corpus = buildIntakeAnswerCorpus(intake);
    const factors = [];
    if (hasAnyPattern(corpus, RELATIONSHIP_PATTERNS)) {
      factors.push("ongoing relationship stress");
    }
    if (hasAnyPattern(corpus, ANGER_PATTERNS)) {
      factors.push("difficulty managing strong emotions during conflict");
    }
    if (hasAnyPattern(corpus, SUBSTANCE_PATTERNS)) {
      factors.push("substance use as a coping pattern");
    }
    if (hasAnyPattern(corpus, SLEEP_PATTERNS)) {
      factors.push("sleep disruption");
    }
    if (hasAnyPattern(corpus, TRAUMA_PATTERNS)) {
      factors.push("distress related to reminders of unsafe events");
    }
    return unique4(factors).slice(0, 4);
  }
  function buildProtectiveFactorPhrases(intake) {
    const corpus = intake.manualNotes.toLowerCase();
    const factors = [];
    if (intake.counselingGoals.trim()) {
      factors.push("stated motivation for treatment");
    }
    if (intake.livingArrangement.trim() && !/alone/i.test(intake.livingArrangement)) {
      factors.push("some social support in the home");
    }
    if (intake.occupation.trim() && !/unemployed|not working/i.test(intake.occupation)) {
      factors.push("current employment");
    }
    if (hasAnyPattern(corpus, EXERCISE_PATTERNS)) {
      factors.push("exercise as a coping skill");
    }
    if (hasAnyPattern(corpus, SPIRITUAL_PATTERNS)) {
      factors.push("faith or spiritual support");
    }
    return unique4(factors).slice(0, 4);
  }
  function buildIceFormulationText(intake, note, guidance, impressions) {
    const concerns = buildPresentingConcernPhrases(intake);
    const history = buildRelevantHistoryPhrases(intake);
    const maintaining = buildMaintainingFactorPhrases(intake);
    const strengths = buildProtectiveFactorPhrases(intake);
    const diagnosisLabels = (impressions.length ? impressions : note.diagnosticImpressions).map(formatDiagnosisLabel).slice(0, 3);
    const modalities = unique4(guidance.modalities.map((item) => item.toLowerCase())).slice(0, 4);
    const parts = [];
    if (concerns.length) {
      parts.push(`Client presents with ${joinList2(concerns)}.`);
    }
    if (diagnosisLabels.length) {
      parts.push(`Current presentation is consistent with ${joinList2(diagnosisLabels)}.`);
    }
    if (history.length) {
      parts.push(`Relevant history includes ${joinList2(history)}.`);
    }
    if (maintaining.length) {
      parts.push(`Current problems appear to be maintained by ${joinList2(maintaining)}.`);
    }
    if (strengths.length) {
      parts.push(`Protective factors include ${joinList2(strengths)}.`);
    }
    if (modalities.length) {
      parts.push(`Initial treatment can focus on ${joinList2(modalities)}.`);
    }
    return parts.join(" ") || guidance.formulation || note.clinicalFormulation;
  }
  function extractStructuredItems(text) {
    return unique4(
      text.split("\n").map((line) => line.trim()).filter(Boolean).filter((line) => !/^[A-Za-z ]+:$/.test(line)).filter((line) => !/^\d+\.\s+[A-Z]/.test(line)).map((line) => line.replace(/^[•\-]\s*/, "").replace(/^\d+\.\s*/, "").trim()).filter(Boolean)
    );
  }
  function parseFrequencySections(text) {
    const sections = {
      frequency: [],
      monitoring: [],
      reassessment: [],
      referral: [],
      safety: []
    };
    let current = "frequency";
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      const headingMatch = line.match(/^(Frequency|Monitoring|Reassessment|Referral|Safety):\s*(.*)$/i);
      if (headingMatch) {
        current = headingMatch[1].toLowerCase();
        const remainder = headingMatch[2].trim();
        if (remainder) sections[current].push(remainder);
        continue;
      }
      sections[current].push(line.replace(/^[•\-]\s*/, "").trim());
    }
    return sections;
  }
  function formatImpressionsList(impressions) {
    if (!impressions.length) return "";
    return impressions.map((imp, i) => {
      const lines = [`${i + 1}. ${ensureSentence(formatDiagnosisLabel(imp))}`];
      const reasoning = cleanDiagnosticReasoning(imp.diagnosticReasoning);
      if (reasoning) {
        lines.push(ensureSentence(reasoning));
      }
      if (imp.criteriaEvidence.length) {
        lines.push(`Supporting evidence includes ${joinList2(imp.criteriaEvidence.slice(0, 4))}.`);
      }
      if (imp.ruleOuts.length) {
        lines.push(`Rule-outs to monitor include ${joinList2(imp.ruleOuts.slice(0, 3))}.`);
      }
      return lines.join(" ");
    }).join("\n\n");
  }
  function formatStrengthsWeaknesses(intake) {
    const pronouns = inferPronounForms(intake);
    const strengths = [];
    const weaknesses = [];
    if (intake.counselingGoals.trim()) {
      const goal = smoothClinicalPhrase(intake.counselingGoals.trim(), pronouns).replace(/[.]+$/, "");
      strengths.push(`treatment motivation (${lowerCaseFirst(goal)})`);
    }
    if (intake.priorTreatment.trim() && !/none|no|denied|denies/i.test(intake.priorTreatment))
      strengths.push(`prior treatment engagement`);
    if (intake.livingArrangement.trim() && !/alone/i.test(intake.livingArrangement)) {
      const arrangement = normalizeLivingArrangement(intake.livingArrangement, pronouns);
      strengths.push(`social support (lives ${arrangement})`);
    }
    if (intake.primaryCarePhysician.trim())
      strengths.push(`established medical care`);
    if (intake.occupation.trim() && !/unemployed|not working/i.test(intake.occupation))
      strengths.push(`current employment`);
    if (intake.suicidalIdeation.trim() && !/no|denied|denies|none/i.test(intake.suicidalIdeation))
      weaknesses.push("reported suicidal ideation");
    if (intake.suicideAttemptHistory.trim() && !/no|denied|denies|none/i.test(intake.suicideAttemptHistory))
      weaknesses.push("history of suicide attempt(s)");
    if (intake.homicidalIdeation.trim() && !/no|denied|denies|none/i.test(intake.homicidalIdeation))
      weaknesses.push("reported homicidal ideation");
    if (intake.psychiatricHospitalization.trim() && !/no|denied|denies|none/i.test(intake.psychiatricHospitalization))
      weaknesses.push("history of psychiatric hospitalization");
    if (intake.physicalSexualAbuseHistory.trim() && !/no|denied|denies|none/i.test(intake.physicalSexualAbuseHistory))
      weaknesses.push("reported abuse history");
    if (intake.domesticViolenceHistory.trim() && !/no|denied|denies|none/i.test(intake.domesticViolenceHistory))
      weaknesses.push("reported domestic violence history");
    const hasSubstanceConcern = [intake.alcoholUse, intake.drugUse, intake.substanceUseHistory].some((v) => v.trim() && !/no|denied|denies|none/i.test(v));
    if (hasSubstanceConcern) weaknesses.push("substance use concerns");
    const parts = [];
    if (strengths.length) parts.push(`Strengths and protective factors include ${joinList2(strengths)}.`);
    if (weaknesses.length) parts.push(`Clinical vulnerabilities include ${joinList2(weaknesses)}.`);
    return parts.join(" ");
  }
  function formatTreatmentRecommendations(interventions, modalities) {
    const parts = [];
    if (modalities.length) {
      parts.push(`Recommended treatment modalities include ${joinList2(modalities.map((item) => item.toLowerCase()))}.`);
    }
    const items = extractStructuredItems(interventions).slice(0, 6);
    if (items.length) {
      parts.push(`Initial treatment focus should include ${joinList2(items)}.`);
    }
    return parts.join(" ");
  }
  function formatFollowUp(frequency, plan) {
    const parts = [];
    const sections = parseFrequencySections(frequency);
    if (sections.frequency.length) {
      parts.push(ensureSentence(sections.frequency[0]));
    }
    if (sections.monitoring.length) {
      parts.push(`Monitoring will include ${joinList2(sections.monitoring)}.`);
    }
    if (sections.reassessment.length) {
      parts.push(`Reassessment will include ${joinList2(sections.reassessment)}.`);
    }
    if (sections.referral.length) {
      parts.push(`Referral plan: ${joinList2(sections.referral)}.`);
    }
    if (sections.safety.length) {
      parts.push(`Safety plan: ${joinList2(sections.safety)}.`);
    }
    if (plan) {
      parts.push(ensureSentence(plan));
    }
    return parts.join(" ");
  }
  async function fillAssessmentSection(intake) {
    let filled = 0;
    const workspace = await getDiagnosticWorkspace();
    const impressions = workspace?.finalizedImpressions ?? [];
    let note = await getNote();
    if (!note) {
      const prefs = await getPreferences();
      note = await buildDraftNote(intake, prefs, impressions);
    }
    let guidance = {
      modalities: [],
      formulation: "",
      goals: "",
      interventions: "",
      frequency: "",
      referrals: "",
      plan: "",
      references: [],
      queries: []
    };
    try {
      guidance = await buildClinicalGuidance(intake, impressions);
    } catch (err) {
      console.warn("[SPN] Clinical guidance unavailable during ICE fill; using draft-note fallback only:", err);
    }
    const formulation = buildIceFormulationText(intake, note, guidance, impressions);
    if (formulation && fillProseMirrorByLabel("free-text-106", formulation)) filled++;
    const diagSource = impressions.length ? impressions : note.diagnosticImpressions;
    const diagText = formatImpressionsList(diagSource);
    if (diagText && fillProseMirrorByLabel("free-text-107", diagText)) filled++;
    const strengthsText = formatStrengthsWeaknesses(intake);
    if (strengthsText && fillProseMirrorByLabel("free-text-108", strengthsText)) filled++;
    const interventionsText = guidance.interventions || note.treatmentPlan.interventions.map((i) => `\u2022 ${i}`).join("\n");
    const txRecsText = formatTreatmentRecommendations(
      interventionsText,
      guidance.modalities
    );
    if (txRecsText && fillProseMirrorByLabel("free-text-109", txRecsText)) filled++;
    const followUpText = formatFollowUp(
      guidance.frequency || note.treatmentPlan.frequency,
      guidance.plan || note.plan
    );
    if (followUpText && fillProseMirrorByLabel("free-text-111", followUpText)) filled++;
    return filled;
  }
  var ICE_ENRICHMENT_SYSTEM = `You are a clinical documentation assistant. You will receive sections from a therapy session note, and optionally prior intake/overview data that was already collected.

Your job: extract and rewrite the clinical content into structured fields for an Initial Clinical Evaluation (ICE) form. Merge ALL sources \u2014 the AI note sections AND any prior data provided. Each field serves a different purpose \u2014 route the right information to the right field, don't dump everything into one place.

WRITING STYLE:
- Write in simple, clear clinical prose \u2014 early-teen reading level
- Use short sentences. Avoid jargon when a plain word works
- Keep third-person perspective ("He reported..." not "Client reported...")
- Use the patient's pronouns (provided in the prompt)
- Be specific \u2014 include durations, frequencies, and concrete details
- Don't pad with filler or repeat yourself across fields

IMPORTANT \u2014 DON'T DROP DETAILS:
- Weight changes (gain or loss) belong in hpiNarrative AND medicalHistory
- Medical workups (urologist, endocrinologist, lab results, testosterone panels) belong in hpiNarrative
- Relationship dynamics (partner's reactions, expressed dissatisfaction) count as presenting problems
- Medication dependence/secret use counts as a substance concern in presentingProblems
- If the prior data mentions something the AI note doesn't, still include it

OUTPUT: Return ONLY a valid JSON object with these string keys:
{
  "chiefComplaint": "1-2 sentence summary of why the patient is seeking treatment. Include duration and main concern.",
  "hpiNarrative": "3-5 sentence paragraph covering: what's happening, how long, what makes it worse/better, functional impact, medical workup results (e.g. 'urologist found no physical cause', normal testosterone), medications, and physical health changes (weight loss/gain). Written as a narrative, not a list.",
  "medicalHistory": "Relevant medical conditions, medications, physical health details, and recent health changes (weight, lab results). Only what's clinically relevant.",
  "socialContext": "Living situation, occupation, relationship status, cultural factors. Brief.",
  "presentingProblems": "Complete list of ALL clinical problems. Include: primary complaints, co-occurring issues, relationship dynamics (partner distress, expressed dissatisfaction), substance/medication concerns, trauma history, contributing factors, and relevant history. Be thorough \u2014 err on the side of listing too many rather than too few. Never drop items that appeared in the prior data. Comma-separated.",
  "mse": "Mental status exam findings. Look in the Objective section for a Mental Status Exam block. Include all MSE categories found (Appearance, Behavior, Speech, Mood/Affect, Thoughts, Cognition, Insight/Judgment). If no MSE data exists anywhere in the note, return empty string."
}

Do NOT wrap in markdown fences. Return ONLY the raw JSON.`;
  function buildIceEnrichmentPrompt(sections, pronouns, clientName, intake) {
    const parts = [];
    parts.push(`Patient: ${clientName}`);
    parts.push(`Pronouns: ${pronouns.subject}/${pronouns.object}/${pronouns.possessive}`);
    parts.push("");
    const priorContext = [];
    if (intake.historyOfPresentIllness) priorContext.push(`Prior HPI: ${intake.historyOfPresentIllness}`);
    if (intake.medicalHistory) priorContext.push(`Prior Medical History: ${intake.medicalHistory}`);
    if (intake.chiefComplaint) priorContext.push(`Prior Chief Complaint: ${intake.chiefComplaint}`);
    if (intake.presentingProblems.length) priorContext.push(`Prior Presenting Problems: ${intake.presentingProblems.join(", ")}`);
    if (priorContext.length) {
      parts.push("=== PRIOR INTAKE DATA (from overview/phone consult) ===");
      parts.push(priorContext.join("\n"));
      parts.push("");
    }
    for (const [title, content] of sections) {
      if (content) parts.push(`=== ${title.toUpperCase()} ===
${content}`);
    }
    parts.push("");
    parts.push(`Merge the prior data with the AI note sections above. Use the patient's pronouns, not "Client." Keep language simple and direct.`);
    return parts.join("\n");
  }
  async function enrichIntakeWithLLM(sections, intake, pronouns) {
    const prefs = await getPreferences();
    const clientName = intake.fullName || [intake.firstName, intake.lastName].filter(Boolean).join(" ") || "Patient";
    const userPrompt = buildIceEnrichmentPrompt(sections, pronouns, clientName, intake);
    if (!prefs.openaiApiKey) {
      console.info("[SPN] No OpenAI API key configured \u2014 skipping LLM ICE enrichment");
      return null;
    }
    const healthy = await checkOpenAIHealth(prefs.openaiApiKey);
    if (!healthy) {
      console.info("[SPN] OpenAI not reachable \u2014 skipping LLM ICE enrichment");
      return null;
    }
    let raw = null;
    try {
      const { sanitized, mapping } = deidentify(userPrompt, intake);
      console.log("[SPN] Sending de-identified AI note to OpenAI for ICE enrichment...");
      const response = await generateOpenAICompletion(sanitized, ICE_ENRICHMENT_SYSTEM, prefs.openaiModel || "gpt-4o-mini", prefs.openaiApiKey);
      raw = reidentify(response, mapping);
    } catch (err) {
      console.info("[SPN] OpenAI ICE enrichment failed:", err);
      return null;
    }
    if (!raw) return null;
    const jsonStr = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed.hpiNarrative !== "string") return null;
      console.log("[SPN] LLM ICE enrichment succeeded:", Object.keys(parsed));
      return parsed;
    } catch {
      console.warn("[SPN] Failed to parse LLM ICE enrichment response:", jsonStr.slice(0, 200));
      return null;
    }
  }
  async function enrichIntakeFromSoapCopyArea(intake) {
    const aiContent = document.querySelector(".ai-note-content");
    if (!aiContent) return;
    const sections = /* @__PURE__ */ new Map();
    const headers = aiContent.querySelectorAll("h3.section-title");
    for (const h3 of headers) {
      const title = h3.textContent?.trim().toLowerCase() ?? "";
      const copyArea = h3.nextElementSibling;
      if (copyArea?.classList.contains("copy-area")) {
        sections.set(title, copyArea.textContent?.replace(/\s*Copy\s*$/, "").trim() ?? "");
      }
    }
    if (sections.size === 0) return;
    console.log("[SPN] Found SimplePractice AI note sections:", [...sections.keys()]);
    intake.spSoapNote = [...sections.entries()].map(([k, v]) => `${k}:
${v}`).join("\n\n");
    const pronouns = inferPronounForms(intake);
    const llmResult = await enrichIntakeWithLLM(sections, intake, pronouns);
    if (llmResult) {
      console.log("[SPN] Using LLM-enriched ICE fields");
      if (llmResult.hpiNarrative && llmResult.hpiNarrative.length > intake.historyOfPresentIllness.length) {
        intake.historyOfPresentIllness = llmResult.hpiNarrative;
      }
      if (llmResult.medicalHistory && llmResult.medicalHistory.length > intake.medicalHistory.length) {
        intake.medicalHistory = llmResult.medicalHistory;
      }
      if (llmResult.presentingProblems && intake.presentingProblems.length < llmResult.presentingProblems.length) {
        intake.presentingProblems = llmResult.presentingProblems;
      }
      if (llmResult.socialContext) {
        if (!intake.livingArrangement.trim() || intake.livingArrangement.length < 10) {
          intake.livingArrangement = llmResult.socialContext;
        }
      }
      if (llmResult.mse) {
        intake.additionalInfo = [intake.additionalInfo, llmResult.mse].filter(Boolean).join("\n\n");
      }
      intake._llmEnrichedHpi = true;
      return;
    }
    console.log("[SPN] LLM unavailable, using regex enrichment");
    const bpsText = sections.get("biopsychosocial assessment") ?? "";
    const objective = sections.get("objective") ?? "";
    const assessment = sections.get("assessment") ?? "";
    const bioMatch = bpsText.match(/Biological:\s*([\s\S]*?)(?=Psychological:|Social:|$)/i);
    const socialMatch = bpsText.match(/Social:\s*([\s\S]*?)(?=Biological:|Psychological:|$)/i);
    const bio = bioMatch?.[1]?.trim() ?? "";
    const social = socialMatch?.[1]?.trim() ?? "";
    const hpiCandidate = [assessment, bio].filter(Boolean).join(" ");
    let usedAssessmentForHpi = false;
    if (hpiCandidate && intake.historyOfPresentIllness.length < hpiCandidate.length) {
      intake.historyOfPresentIllness = hpiCandidate;
      usedAssessmentForHpi = true;
    }
    if (bio && intake.medicalHistory.length < bio.length) {
      intake.medicalHistory = bio;
    }
    if (social) {
      if (!intake.livingArrangement.trim() || intake.livingArrangement.length < 10) {
        const livingMatch = social.match(/living\s+(?:with|alone|independently)[\s\S]*?[.]/i);
        if (livingMatch) intake.livingArrangement = livingMatch[0].replace(/[.]+$/, "");
      }
      if (!intake.relationshipDescription.trim()) {
        const relMatch = social.match(/(?:girlfriend|boyfriend|partner|spouse|wife|husband|married|dating|relationship)[\s\S]*?[.]/i);
        if (relMatch) intake.relationshipDescription = relMatch[0];
      }
    }
    if (assessment && !usedAssessmentForHpi && intake.presentingProblems.length < assessment.length) {
      intake.presentingProblems = assessment;
    }
    const mseMatch = objective.match(/Mental Status Exam:\s*([\s\S]*?)$/i);
    if (mseMatch) {
      intake.additionalInfo = [intake.additionalInfo, mseMatch[1].trim()].filter(Boolean).join("\n\n");
    }
  }
  async function fillInitialClinicalEval() {
    assertExtensionContext();
    const intake = await getIntake();
    if (!intake) {
      showToast(`No intake data captured. Go to the client's intake form and click "Capture Intake" first.`, "error");
      return;
    }
    if (!document.querySelector(".ai-note-content")) {
      const noteTakerBtn = document.querySelector("button.note-taker");
      if (noteTakerBtn) {
        noteTakerBtn.click();
        const deadline = Date.now() + 5e3;
        while (!document.querySelector(".ai-note-content") && Date.now() < deadline) {
          await wait(300);
        }
      }
    }
    await enrichIntakeFromSoapCopyArea(intake);
    await wait(500);
    let filled = fillICEFromIntake(intake);
    await flushBooleanSyncOperations();
    await wait(200);
    try {
      filled += await fillAssessmentSection(intake);
    } catch (err) {
      console.warn("[SPN] Assessment section fill failed:", err);
    }
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
    if (!isNotePage()) {
      document.getElementById("spn-fill-btn")?.remove();
      return;
    }
    if (detectSoapForm()) {
      document.getElementById("spn-fill-btn")?.remove();
      return;
    }
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
  async function handleFillSoapClick() {
    try {
      const result = await fillSavedSoapDraft();
      if (!result.ok) {
        showToast(result.error ?? "Failed to fill SOAP note.", "error");
        return;
      }
      showToast(`Filled ${result.filled ?? 0} SOAP fields from saved session notes`, "success");
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        showToast("Extension reloaded \u2014 please refresh this page.", "error");
      } else {
        console.error("[SPN] Fill SOAP error:", err);
        showToast("Failed to fill SOAP note.", "error");
      }
    }
  }
  function injectFillSoapButton() {
    if (!isAppointmentPage()) {
      document.getElementById("spn-fill-soap-btn")?.remove();
      return;
    }
    if (!detectSoapForm()) {
      document.getElementById("spn-fill-soap-btn")?.remove();
      return;
    }
    if (document.getElementById("spn-fill-soap-btn")) return;
    injectButton("Fill SOAP from Notes", handleFillSoapClick, {
      id: "spn-fill-soap-btn",
      position: "bottom-left-high"
    });
  }
  var lastUrl = window.location.href;
  var observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      const newUrl = window.location.href;
      checkSessionEndOnUrlChange(newUrl);
      lastUrl = newUrl;
      setTimeout(injectFillButton, 500);
      setTimeout(injectFillSoapButton, 500);
      setTimeout(injectVideoNotePanel, 500);
      setTimeout(startCaptionObserver, 1e3);
      setTimeout(startSessionEndDetection, 1e3);
      setTimeout(startIncrementalGeneration, 2e3);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(injectFillButton, 500);
      setTimeout(injectFillSoapButton, 500);
      setTimeout(injectVideoNotePanel, 500);
      setTimeout(startCaptionObserver, 1e3);
      setTimeout(startSessionEndDetection, 1e3);
      setTimeout(startIncrementalGeneration, 2e3);
    });
  } else {
    setTimeout(injectFillButton, 500);
    setTimeout(injectFillSoapButton, 500);
    setTimeout(injectVideoNotePanel, 500);
    setTimeout(startCaptionObserver, 1e3);
    setTimeout(startSessionEndDetection, 1e3);
  }
  registerFloatingButtonsController(() => {
    setTimeout(injectFillButton, 0);
    setTimeout(injectFillSoapButton, 0);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "session") return;
    if (changes["spn_soap_draft"]) {
      setTimeout(injectFillSoapButton, 0);
    }
  });
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "SPN_FILL_SOAP_DRAFT") {
      void (async () => {
        const result = await fillSavedSoapDraft(msg.draft ?? null);
        if (result.ok) {
          showToast(`Filled ${result.filled ?? 0} SOAP fields from saved session notes`, "success");
        }
        sendResponse(result);
      })();
      return true;
    }
  });
})();
//# sourceMappingURL=fill-note.js.map
