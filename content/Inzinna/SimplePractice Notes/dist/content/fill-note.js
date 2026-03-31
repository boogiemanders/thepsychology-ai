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
  var EMPTY_DIAGNOSTIC_WORKSPACE = {
    pinnedDisorderIds: [],
    activeDisorderId: null,
    overrides: [],
    disorderNotes: [],
    finalizedImpressions: [],
    updatedAt: ""
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
      followUpCPT: prefs?.followUpCPT?.trim() || DEFAULT_PREFERENCES.followUpCPT
    };
  }
  async function getPreferences() {
    const result = await chrome.storage.local.get(PREFS_KEY);
    return normalizePreferences(result[PREFS_KEY]);
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
  function isVideoRoom() {
    return /\/appt-[a-f0-9]+\/room/.test(window.location.pathname);
  }
  function getVideoApptId() {
    const match = window.location.pathname.match(/\/appt-([a-f0-9]+)\/room/);
    return match ? match[1] : "";
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
  function injectVideoNotePanel() {
    if (!isVideoRoom()) return;
    if (document.getElementById("spn-video-notes")) return;
    const apptId = getVideoApptId();
    if (!apptId) return;
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
    <div class="spn-video-notes-body" id="spn-notes-body">
      <textarea
        id="spn-session-textarea"
        class="spn-video-notes-textarea"
        placeholder="Type session notes here..."
        spellcheck="true"
      ></textarea>
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
  function formatImpressionsList(impressions) {
    if (!impressions.length) return "";
    return impressions.map((imp, i) => {
      const code = imp.code ? ` (${imp.code})` : "";
      const lines = [`${i + 1}. ${imp.name}${code}`];
      if (imp.diagnosticReasoning) {
        lines.push(imp.diagnosticReasoning);
      }
      if (imp.criteriaEvidence.length) {
        lines.push(`Supporting evidence: ${imp.criteriaEvidence.join("; ")}.`);
      }
      if (imp.criteriaSummary.length) {
        lines.push(imp.criteriaSummary.join(" "));
      }
      if (imp.ruleOuts.length) {
        lines.push(`Rule out: ${imp.ruleOuts.join(", ")}.`);
      }
      return lines.join("\n");
    }).join("\n\n");
  }
  function formatStrengthsWeaknesses(intake) {
    const strengths = [];
    const weaknesses = [];
    if (intake.counselingGoals.trim()) strengths.push(`Treatment motivation: ${intake.counselingGoals.trim()}`);
    if (intake.priorTreatment.trim() && !/none|no|denied|denies/i.test(intake.priorTreatment))
      strengths.push(`Prior treatment engagement: ${intake.priorTreatment.trim()}`);
    if (intake.livingArrangement.trim() && !/alone/i.test(intake.livingArrangement))
      strengths.push(`Social support: ${intake.livingArrangement.trim()}`);
    if (intake.primaryCarePhysician.trim())
      strengths.push(`Established medical care: PCP ${intake.primaryCarePhysician.trim()}`);
    if (intake.occupation.trim() && !/unemployed|not working/i.test(intake.occupation))
      strengths.push(`Employment: ${intake.occupation.trim()}`);
    if (intake.suicidalIdeation.trim() && !/no|denied|denies|none/i.test(intake.suicidalIdeation))
      weaknesses.push(`Suicidal ideation: ${intake.suicidalIdeation.trim()}`);
    if (intake.suicideAttemptHistory.trim() && !/no|denied|denies|none/i.test(intake.suicideAttemptHistory))
      weaknesses.push(`History of suicide attempts: ${intake.suicideAttemptHistory.trim()}`);
    if (intake.homicidalIdeation.trim() && !/no|denied|denies|none/i.test(intake.homicidalIdeation))
      weaknesses.push(`Homicidal ideation: ${intake.homicidalIdeation.trim()}`);
    if (intake.psychiatricHospitalization.trim() && !/no|denied|denies|none/i.test(intake.psychiatricHospitalization))
      weaknesses.push(`Psychiatric hospitalization: ${intake.psychiatricHospitalization.trim()}`);
    if (intake.physicalSexualAbuseHistory.trim() && !/no|denied|denies|none/i.test(intake.physicalSexualAbuseHistory))
      weaknesses.push(`Abuse history: ${intake.physicalSexualAbuseHistory.trim()}`);
    if (intake.domesticViolenceHistory.trim() && !/no|denied|denies|none/i.test(intake.domesticViolenceHistory))
      weaknesses.push(`DV history: ${intake.domesticViolenceHistory.trim()}`);
    const substanceText = [intake.alcoholUse, intake.drugUse, intake.substanceUseHistory].filter((v) => v.trim() && !/no|denied|denies|none/i.test(v)).join("; ");
    if (substanceText) weaknesses.push(`Substance use: ${substanceText}`);
    const parts = [];
    if (strengths.length) parts.push(`Strengths/Protective Factors:
${strengths.map((s) => `\u2022 ${s}`).join("\n")}`);
    if (weaknesses.length) parts.push(`Risk Factors/Weaknesses:
${weaknesses.map((w) => `\u2022 ${w}`).join("\n")}`);
    return parts.join("\n\n");
  }
  function formatTreatmentRecommendations(interventions, modalities) {
    const parts = [];
    if (modalities.length) {
      parts.push(`Recommended modalities: ${modalities.join(", ")}.`);
    }
    if (interventions) {
      parts.push(interventions);
    }
    return parts.join("\n\n");
  }
  function formatFollowUp(frequency, plan) {
    return [frequency, plan].filter(Boolean).join("\n\n");
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
    const guidance = await buildClinicalGuidance(intake, impressions);
    const formulation = guidance.formulation || note.clinicalFormulation;
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
  async function fillInitialClinicalEval() {
    assertExtensionContext();
    const intake = await getIntake();
    if (!intake) {
      showToast(`No intake data captured. Go to the client's intake form and click "Capture Intake" first.`, "error");
      return;
    }
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
      setTimeout(injectVideoNotePanel, 500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(injectFillButton, 500);
      setTimeout(injectVideoNotePanel, 500);
    });
  } else {
    setTimeout(injectFillButton, 500);
    setTimeout(injectVideoNotePanel, 500);
  }
  registerFloatingButtonsController(() => {
    setTimeout(injectFillButton, 0);
  });
})();
//# sourceMappingURL=fill-note.js.map
