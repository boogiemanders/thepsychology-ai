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
    followUpCPT: "90837"
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
  var NOTE_KEY = "spn_note";
  var DIAGNOSTIC_WORKSPACE_KEY = "spn_diagnostic_workspace";
  var PREFS_KEY = "spn_preferences";
  var SESSION_NOTES_KEY = "spn_session_notes";
  var TREATMENT_PLAN_KEY = "spn_treatment_plan";
  var SOAP_DRAFT_KEY = "spn_soap_draft";
  var TRANSCRIPT_KEY = "spn_transcript";
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
      phq9: partial.phq9 ?? existing?.phq9 ?? null
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
  function normalizePreferences(prefs) {
    return {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      providerFirstName: prefs?.providerFirstName?.trim() || DEFAULT_PREFERENCES.providerFirstName,
      providerLastName: prefs?.providerLastName?.trim() || DEFAULT_PREFERENCES.providerLastName,
      defaultLocation: prefs?.defaultLocation?.trim() || DEFAULT_PREFERENCES.defaultLocation,
      firstVisitCPT: prefs?.firstVisitCPT?.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
      followUpCPT: prefs?.followUpCPT?.trim() || DEFAULT_PREFERENCES.followUpCPT
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
  async function getSessionNotes(apptId) {
    const result = await chrome.storage.session.get(SESSION_NOTES_KEY);
    const notes = result[SESSION_NOTES_KEY];
    if (!notes || notes.apptId !== apptId) return null;
    return { ...EMPTY_SESSION_NOTES, ...notes };
  }
  async function saveSessionNotes(notes) {
    await chrome.storage.session.set({ [SESSION_NOTES_KEY]: notes });
  }
  async function clearAll() {
    await chrome.storage.session.remove([
      INTAKE_KEY,
      NOTE_KEY,
      DIAGNOSTIC_WORKSPACE_KEY,
      SESSION_NOTES_KEY,
      TREATMENT_PLAN_KEY,
      SOAP_DRAFT_KEY,
      TRANSCRIPT_KEY
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
  async function searchClinicalKnowledge(query, options = {}) {
    const index = await loadClinicalKnowledgeIndex();
    const tokens = tokenize(query);
    if (!tokens.length) return [];
    const resourceIds = options.resourceIds?.length ? options.resourceIds : null;
    const results = [];
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
    if (view === "settings") {
      emptyState.style.display = "none";
      intakeInfo.style.display = "none";
      manualNotesSection.style.display = "none";
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
  async function populateSettingsForm() {
    const prefs = await getPreferences();
    document.getElementById("pref-firstName").value = prefs.providerFirstName;
    document.getElementById("pref-lastName").value = prefs.providerLastName;
    document.getElementById("pref-location").value = prefs.defaultLocation;
    document.getElementById("pref-firstCPT").value = prefs.firstVisitCPT;
    document.getElementById("pref-followUpCPT").value = prefs.followUpCPT;
  }
  function readSettingsForm() {
    return {
      providerFirstName: document.getElementById("pref-firstName").value.trim(),
      providerLastName: document.getElementById("pref-lastName").value.trim(),
      defaultLocation: document.getElementById("pref-location").value,
      firstVisitCPT: document.getElementById("pref-firstCPT").value.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
      followUpCPT: document.getElementById("pref-followUpCPT").value.trim() || DEFAULT_PREFERENCES.followUpCPT
    };
  }
  async function render() {
    const intake = await getIntake();
    const note = await getNote();
    const prefs = await getPreferences();
    const apptCtx = await detectApptContext();
    const draftBtn = document.getElementById("btn-generate-draft");
    const manualNotesInput = document.getElementById("manual-notes-input");
    const manualNotesHint = document.getElementById("manual-notes-hint");
    const soapBtn = document.getElementById("btn-save-session-notes");
    document.getElementById("provider-badge").textContent = `Provider: ${prefs.providerFirstName} ${prefs.providerLastName}`;
    const emptyState = document.getElementById("empty-state");
    const intakeInfo = document.getElementById("intake-info");
    if (soapBtn) soapBtn.style.display = apptCtx.isAppt ? "block" : "none";
    if (apptCtx.isAppt && manualNotesInput) {
      const sessionNotes = await getSessionNotes(apptCtx.apptId);
      if (sessionNotes?.notes && !manualNotesInput.dataset.userEdited) {
        manualNotesInput.value = sessionNotes.notes;
      }
      if (manualNotesHint) {
        manualNotesHint.textContent = "Session notes for SOAP progress note (90837). Also saves to intake if needed.";
      }
    }
    if (!intake) {
      emptyState.style.display = "block";
      intakeInfo.style.display = "none";
      if (!apptCtx.isAppt && manualNotesInput) manualNotesInput.value = "";
      if (!apptCtx.isAppt && manualNotesHint) {
        manualNotesHint.textContent = "Paste your own notes here to create a manual intake when SimplePractice intake data is not available.";
      }
      if (draftBtn) draftBtn.textContent = "Generate Draft";
      return;
    }
    emptyState.style.display = "none";
    intakeInfo.style.display = "flex";
    if (manualNotesHint) {
      manualNotesHint.textContent = "Paste your own notes here to augment the captured intake, diagnostics, and draft note.";
    }
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
    if (manualNotesInput) manualNotesInput.value = intake.manualNotes;
    if (draftBtn) draftBtn.textContent = note ? "Regenerate Draft" : "Generate Draft";
    const notePreview = document.getElementById("note-preview");
    const noteContent = document.getElementById("note-content");
    if (note) {
      notePreview.style.display = "block";
      noteContent.textContent = buildNotePreview(note) || "Draft generated from intake data.";
    } else {
      notePreview.style.display = "none";
    }
  }
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
    render();
  });
  document.getElementById("btn-save-session-notes")?.addEventListener("click", async () => {
    const ctx = await detectApptContext();
    if (!ctx.isAppt) return;
    const input = document.getElementById("manual-notes-input");
    const notes = input?.value.replace(/\r\n/g, "\n").trim() ?? "";
    if (!notes) return;
    await saveSessionNotes({ apptId: ctx.apptId, notes, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  });
  document.getElementById("btn-open-diagnostics")?.addEventListener("click", async () => {
    const tab = await getActiveTab();
    if (!tab?.id || !chrome.sidePanel) return;
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: "sidepanel/sidepanel.html",
      enabled: true
    });
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  });
  document.getElementById("btn-generate-draft")?.addEventListener("click", async () => {
    const intake = await getIntake();
    if (!intake) {
      render();
      return;
    }
    const prefs = await getPreferences();
    const existingNote = await getNote();
    const note = await buildDraftNote(intake, prefs, existingNote?.diagnosticImpressions ?? []);
    await saveNote(note);
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
