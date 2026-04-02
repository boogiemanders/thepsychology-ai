import {
  IntakeData,
  EMPTY_INTAKE,
  ProgressNote,
  DiagnosticImpression,
  DiagnosticWorkspaceState,
  EMPTY_DIAGNOSTIC_WORKSPACE,
  EMPTY_PROGRESS_NOTE,
  ProviderPreferences,
  DEFAULT_PREFERENCES,
  SessionNotes,
  EMPTY_SESSION_NOTES,
  TreatmentPlanData,
  EMPTY_TREATMENT_PLAN,
  SoapDraft,
  EMPTY_SOAP_DRAFT,
  SessionTranscript,
  EMPTY_SESSION_TRANSCRIPT,
  TranscriptEntry,
  MseChecklist,
  DEFAULT_MSE_CHECKLIST,
} from './types'
import { augmentIntakeWithManualNotes } from './intake-augmentation'

const INTAKE_KEY = 'spn_intake'
const NOTE_KEY = 'spn_note'
const DIAGNOSTIC_WORKSPACE_KEY = 'spn_diagnostic_workspace'
const PREFS_KEY = 'spn_preferences'
const SESSION_NOTES_KEY = 'spn_session_notes'
const TREATMENT_PLAN_KEY = 'spn_treatment_plan'
const SOAP_DRAFT_KEY = 'spn_soap_draft'
const TRANSCRIPT_KEY = 'spn_transcript'
const MSE_CHECKLIST_KEY = 'spn_mse_checklist'

// ── Intake Data (session storage — PHI with TTL) ──

function normalizeIntake(
  intake: Partial<IntakeData> | undefined
): IntakeData {
  return {
    ...EMPTY_INTAKE,
    ...intake,
    address: {
      ...EMPTY_INTAKE.address,
      ...(intake?.address ?? {}),
    },
    rawQA: Array.isArray(intake?.rawQA) ? intake.rawQA : [],
    gad7: intake?.gad7 ?? null,
    phq9: intake?.phq9 ?? null,
    cssrs: intake?.cssrs ?? null,
  }
}

function normalizeDiagnosticImpression(
  impression: Partial<DiagnosticImpression> | undefined
): DiagnosticImpression {
  return {
    disorderId: impression?.disorderId ?? '',
    code: impression?.code ?? '',
    name: impression?.name ?? '',
    confidence: impression?.confidence ?? 'low',
    diagnosticReasoning: impression?.diagnosticReasoning?.trim() ?? '',
    criteriaEvidence: Array.isArray(impression?.criteriaEvidence) ? impression.criteriaEvidence : [],
    criteriaSummary: Array.isArray(impression?.criteriaSummary) ? impression.criteriaSummary : [],
    ruleOuts: Array.isArray(impression?.ruleOuts) ? impression.ruleOuts : [],
    clinicianNotes: impression?.clinicianNotes?.trim() ?? '',
  }
}

function normalizeNote(
  note: Partial<ProgressNote> | undefined
): ProgressNote {
  const treatmentPlan = note?.treatmentPlan
  return {
    ...EMPTY_PROGRESS_NOTE,
    ...note,
    mentalStatusExam: {
      ...EMPTY_PROGRESS_NOTE.mentalStatusExam,
      ...(note?.mentalStatusExam ?? {}),
    },
    treatmentPlan: {
      ...EMPTY_PROGRESS_NOTE.treatmentPlan,
      ...(treatmentPlan ?? {}),
      goals: Array.isArray(treatmentPlan?.goals) ? treatmentPlan.goals : [],
      interventions: Array.isArray(treatmentPlan?.interventions) ? treatmentPlan.interventions : [],
    },
    diagnosticImpressions: Array.isArray(note?.diagnosticImpressions)
      ? note.diagnosticImpressions.map((impression) => normalizeDiagnosticImpression(impression))
      : [],
    status: {
      ...EMPTY_PROGRESS_NOTE.status,
      ...(note?.status ?? {}),
    },
  }
}

function normalizeDiagnosticWorkspace(
  workspace: Partial<DiagnosticWorkspaceState> | undefined
): DiagnosticWorkspaceState {
  return {
    ...EMPTY_DIAGNOSTIC_WORKSPACE,
    ...workspace,
    pinnedDisorderIds: Array.isArray(workspace?.pinnedDisorderIds) ? workspace.pinnedDisorderIds : [],
    activeDisorderId: workspace?.activeDisorderId ?? null,
    overrides: Array.isArray(workspace?.overrides)
      ? workspace.overrides.map((override) => ({
          disorderId: override?.disorderId ?? '',
          criterionId: override?.criterionId ?? '',
          status: override?.status ?? 'not_assessed',
          notes: override?.notes?.trim() ?? '',
          updatedAt: override?.updatedAt ?? '',
        }))
      : [],
    disorderNotes: Array.isArray(workspace?.disorderNotes)
      ? workspace.disorderNotes.map((entry) => ({
          disorderId: entry?.disorderId ?? '',
          notes: entry?.notes?.trim() ?? '',
        }))
      : [],
    finalizedImpressions: Array.isArray(workspace?.finalizedImpressions)
      ? workspace.finalizedImpressions.map((impression) => normalizeDiagnosticImpression(impression))
      : [],
  }
}

function normalizeSoapDraft(
  draft: Partial<SoapDraft> | undefined
): SoapDraft {
  return {
    ...EMPTY_SOAP_DRAFT,
    ...draft,
    sessionNotes: draft?.sessionNotes?.trim() ?? '',
    transcript: draft?.transcript?.trim() ?? '',
    subjective: draft?.subjective?.trim() ?? '',
    objective: draft?.objective?.trim() ?? '',
    assessment: draft?.assessment?.trim() ?? '',
    plan: draft?.plan?.trim() ?? '',
    generatedAt: draft?.generatedAt ?? '',
    editedAt: draft?.editedAt ?? draft?.generatedAt ?? '',
    status: draft?.status ?? 'draft',
  }
}

function normalizeTranscriptEntry(
  entry: Partial<TranscriptEntry> | undefined
): TranscriptEntry {
  return {
    speaker: entry?.speaker ?? 'unknown',
    text: entry?.text?.trim() ?? '',
    timestamp: entry?.timestamp ?? '',
  }
}

function normalizeTranscript(
  transcript: Partial<SessionTranscript> | undefined
): SessionTranscript {
  return {
    ...EMPTY_SESSION_TRANSCRIPT,
    ...transcript,
    entries: Array.isArray(transcript?.entries)
      ? transcript.entries
          .map((entry) => normalizeTranscriptEntry(entry))
          .filter((entry) => entry.text)
      : [],
  }
}

export async function saveIntake(intake: IntakeData): Promise<void> {
  await chrome.storage.session.set({ [INTAKE_KEY]: normalizeIntake(intake) })
}

async function getStoredIntake(): Promise<IntakeData | null> {
  const result = await chrome.storage.session.get(INTAKE_KEY)
  const intake = result[INTAKE_KEY] as Partial<IntakeData> | undefined
  return intake ? normalizeIntake(intake) : null
}

export async function getIntake(): Promise<IntakeData | null> {
  const intake = await getStoredIntake()
  return intake ? augmentIntakeWithManualNotes(intake) : null
}

export async function clearIntake(): Promise<void> {
  await chrome.storage.session.remove(INTAKE_KEY)
}

export async function mergeIntake(partial: Partial<IntakeData>): Promise<void> {
  const existing = await getStoredIntake()
  await saveIntake({
    ...(existing ?? EMPTY_INTAKE),
    ...partial,
    address: {
      ...(existing?.address ?? EMPTY_INTAKE.address),
      ...(partial.address ?? {}),
    },
    rawQA: partial.rawQA ?? existing?.rawQA ?? EMPTY_INTAKE.rawQA,
    gad7: partial.gad7 ?? existing?.gad7 ?? null,
    phq9: partial.phq9 ?? existing?.phq9 ?? null,
    cssrs: partial.cssrs ?? existing?.cssrs ?? null,
  })
}

// ── Progress Note (session storage — PHI with TTL) ──

export async function saveNote(note: ProgressNote): Promise<void> {
  await chrome.storage.session.set({ [NOTE_KEY]: normalizeNote(note) })
}

export async function getNote(): Promise<ProgressNote | null> {
  const result = await chrome.storage.session.get(NOTE_KEY)
  const note = result[NOTE_KEY] as Partial<ProgressNote> | undefined
  return note ? normalizeNote(note) : null
}

export async function clearNote(): Promise<void> {
  await chrome.storage.session.remove(NOTE_KEY)
}

export async function updateNoteStatus(
  updates: Partial<ProgressNote['status']>
): Promise<void> {
  const note = await getNote()
  if (!note) return
  note.status = { ...note.status, ...updates }
  await saveNote(note)
}

// ── Diagnostic Workspace (session storage — PHI with TTL) ──

export async function saveDiagnosticWorkspace(workspace: DiagnosticWorkspaceState): Promise<void> {
  await chrome.storage.session.set({
    [DIAGNOSTIC_WORKSPACE_KEY]: normalizeDiagnosticWorkspace(workspace),
  })
}

export async function getDiagnosticWorkspace(): Promise<DiagnosticWorkspaceState | null> {
  const result = await chrome.storage.session.get(DIAGNOSTIC_WORKSPACE_KEY)
  const workspace = result[DIAGNOSTIC_WORKSPACE_KEY] as Partial<DiagnosticWorkspaceState> | undefined
  return workspace ? normalizeDiagnosticWorkspace(workspace) : null
}

export async function clearDiagnosticWorkspace(): Promise<void> {
  await chrome.storage.session.remove(DIAGNOSTIC_WORKSPACE_KEY)
}

export async function updateDiagnosticWorkspace(
  updates: Partial<DiagnosticWorkspaceState>
): Promise<DiagnosticWorkspaceState> {
  const existing = await getDiagnosticWorkspace()
  const next = normalizeDiagnosticWorkspace({
    ...(existing ?? EMPTY_DIAGNOSTIC_WORKSPACE),
    ...updates,
    pinnedDisorderIds: updates.pinnedDisorderIds ?? existing?.pinnedDisorderIds ?? [],
    overrides: updates.overrides ?? existing?.overrides ?? [],
    disorderNotes: updates.disorderNotes ?? existing?.disorderNotes ?? [],
    finalizedImpressions: updates.finalizedImpressions ?? existing?.finalizedImpressions ?? [],
    updatedAt: updates.updatedAt ?? new Date().toISOString(),
  })
  await saveDiagnosticWorkspace(next)
  return next
}

// ── Provider Preferences (local storage — not PHI) ──

function normalizePreferences(
  prefs: Partial<ProviderPreferences> | undefined
): ProviderPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    providerFirstName: prefs?.providerFirstName?.trim() || DEFAULT_PREFERENCES.providerFirstName,
    providerLastName: prefs?.providerLastName?.trim() || DEFAULT_PREFERENCES.providerLastName,
    defaultLocation: prefs?.defaultLocation?.trim() || DEFAULT_PREFERENCES.defaultLocation,
    firstVisitCPT: prefs?.firstVisitCPT?.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
    followUpCPT: prefs?.followUpCPT?.trim() || DEFAULT_PREFERENCES.followUpCPT,
  }
}

export async function getPreferences(): Promise<ProviderPreferences> {
  const result = await chrome.storage.local.get(PREFS_KEY)
  return normalizePreferences(result[PREFS_KEY] as Partial<ProviderPreferences> | undefined)
}

export async function savePreferences(prefs: ProviderPreferences): Promise<void> {
  await chrome.storage.local.set({ [PREFS_KEY]: normalizePreferences(prefs) })
}

export async function hasPreferences(): Promise<boolean> {
  const result = await chrome.storage.local.get(PREFS_KEY)
  return !!result[PREFS_KEY]
}

// ── Treatment Plan (session storage — PHI with TTL) ──

export async function saveTreatmentPlan(plan: TreatmentPlanData): Promise<void> {
  await chrome.storage.session.set({ [TREATMENT_PLAN_KEY]: plan })
}

export async function getTreatmentPlan(): Promise<TreatmentPlanData | null> {
  const result = await chrome.storage.session.get(TREATMENT_PLAN_KEY)
  const plan = result[TREATMENT_PLAN_KEY] as TreatmentPlanData | undefined
  return plan ? { ...EMPTY_TREATMENT_PLAN, ...plan } : null
}

export async function clearTreatmentPlan(): Promise<void> {
  await chrome.storage.session.remove(TREATMENT_PLAN_KEY)
}

// ── SOAP Draft (session storage — PHI with TTL) ──

export async function saveSoapDraft(draft: SoapDraft): Promise<void> {
  await chrome.storage.session.set({ [SOAP_DRAFT_KEY]: normalizeSoapDraft(draft) })
}

export async function getSoapDraft(): Promise<SoapDraft | null> {
  const result = await chrome.storage.session.get(SOAP_DRAFT_KEY)
  const draft = result[SOAP_DRAFT_KEY] as Partial<SoapDraft> | undefined
  return draft ? normalizeSoapDraft(draft) : null
}

export async function clearSoapDraft(): Promise<void> {
  await chrome.storage.session.remove(SOAP_DRAFT_KEY)
}

// ── Session Transcript (session storage — PHI with TTL) ──

export async function saveTranscript(transcript: SessionTranscript): Promise<void> {
  await chrome.storage.session.set({ [TRANSCRIPT_KEY]: normalizeTranscript(transcript) })
}

export async function getTranscript(apptId: string): Promise<SessionTranscript | null> {
  const result = await chrome.storage.session.get(TRANSCRIPT_KEY)
  const transcript = result[TRANSCRIPT_KEY] as Partial<SessionTranscript> | undefined
  if (!transcript || transcript.apptId !== apptId) return null
  return normalizeTranscript(transcript)
}

export async function appendTranscriptEntry(
  apptId: string,
  entry: TranscriptEntry
): Promise<SessionTranscript> {
  const existing = await getTranscript(apptId)
  const next = normalizeTranscript({
    ...(existing ?? EMPTY_SESSION_TRANSCRIPT),
    apptId,
    entries: [...(existing?.entries ?? []), normalizeTranscriptEntry(entry)],
    updatedAt: new Date().toISOString(),
  })
  await saveTranscript(next)
  return next
}

export async function clearTranscript(): Promise<void> {
  await chrome.storage.session.remove(TRANSCRIPT_KEY)
}

// ── Session Notes (live note-taking during video appointments) ──

export async function getSessionNotes(apptId: string): Promise<SessionNotes | null> {
  const result = await chrome.storage.session.get(SESSION_NOTES_KEY)
  const notes = result[SESSION_NOTES_KEY] as SessionNotes | undefined
  if (!notes || notes.apptId !== apptId) return null
  return { ...EMPTY_SESSION_NOTES, ...notes }
}

export async function saveSessionNotes(notes: SessionNotes): Promise<void> {
  await chrome.storage.session.set({ [SESSION_NOTES_KEY]: notes })
}

// ── MSE Checklist (session storage — clinician observations during video) ──

export async function saveMseChecklist(checklist: MseChecklist): Promise<void> {
  await chrome.storage.session.set({
    [MSE_CHECKLIST_KEY]: { ...DEFAULT_MSE_CHECKLIST, ...checklist, updatedAt: new Date().toISOString() },
  })
}

export async function getMseChecklist(): Promise<MseChecklist | null> {
  const result = await chrome.storage.session.get(MSE_CHECKLIST_KEY)
  const checklist = result[MSE_CHECKLIST_KEY] as Partial<MseChecklist> | undefined
  return checklist ? { ...DEFAULT_MSE_CHECKLIST, ...checklist } : null
}

export async function clearMseChecklist(): Promise<void> {
  await chrome.storage.session.remove(MSE_CHECKLIST_KEY)
}

// ── Cleanup ──

export async function clearAll(): Promise<void> {
  await chrome.storage.session.remove([
    INTAKE_KEY,
    NOTE_KEY,
    DIAGNOSTIC_WORKSPACE_KEY,
    SESSION_NOTES_KEY,
    TREATMENT_PLAN_KEY,
    SOAP_DRAFT_KEY,
    TRANSCRIPT_KEY,
    MSE_CHECKLIST_KEY,
  ])
}
