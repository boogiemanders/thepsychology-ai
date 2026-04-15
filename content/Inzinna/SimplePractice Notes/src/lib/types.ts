// ── Intake Data (extracted from SimplePractice client profile / intake forms) ──

export interface AssessmentItem {
  number: number
  question: string
  response: string
  score: number
  maxScore: number
  lastResponse?: string
}

export interface AssessmentResult {
  name: string // e.g. "GAD-7", "PHQ-9", "C-SSRS", "DASS-21"
  totalScore: number // scored total or count of endorsed yes/no items
  severity: string // e.g. severity label or assessment summary
  items: AssessmentItem[]
  difficulty: string // functional impairment question or secondary summary
  capturedAt: string
}

export interface IntakeData {
  // Demographics
  fullName: string
  firstName: string
  lastName: string
  sex: string
  genderIdentity: string
  dob: string
  phone: string
  email: string
  address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
    raw: string // full address as captured
  }
  race: string
  ethnicity: string

  // Emergency contact
  emergencyContact: string

  // Insurance
  insuranceCompany: string
  memberId: string
  groupNumber: string

  // Clinical intake
  chiefComplaint: string
  counselingGoals: string
  presentingProblems: string
  historyOfPresentIllness: string
  priorTreatment: string // have you seen a mental health professional before
  medications: string
  prescribingMD: string
  primaryCarePhysician: string
  medicalHistory: string
  allergies: string
  surgeries: string
  troubleSleeping: string
  developmentalHistory: string
  tbiLoc: string

  // Risk assessment
  suicidalIdeation: string
  suicideAttemptHistory: string
  homicidalIdeation: string
  psychiatricHospitalization: string

  // Substance use
  alcoholUse: string
  drugUse: string
  substanceUseHistory: string

  // Family & social
  familyPsychiatricHistory: string
  familyMentalEmotionalHistory: string
  maritalStatus: string
  relationshipDescription: string
  livingArrangement: string
  education: string
  occupation: string

  // Trauma history
  physicalSexualAbuseHistory: string
  domesticViolenceHistory: string

  // Standardized assessments
  gad7: AssessmentResult | null
  phq9: AssessmentResult | null
  cssrs: AssessmentResult | null
  dass21: AssessmentResult | null

  // Symptom checklist
  recentSymptoms: string
  additionalSymptoms: string
  additionalInfo: string
  manualNotes: string
  overviewClinicalNote: string
  spSoapNote: string
  _llmEnrichedHpi?: boolean

  // Form metadata
  formTitle: string
  formDate: string
  signedBy: string
  signedAt: string

  // Raw Q&A (preserves all questions and answers from the form)
  rawQA: Array<{ question: string; answer: string }>

  // Metadata
  capturedAt: string // ISO timestamp
  clientId: string // SP client ID from URL
}

export const EMPTY_INTAKE: IntakeData = {
  fullName: '',
  firstName: '',
  lastName: '',
  sex: '',
  genderIdentity: '',
  dob: '',
  phone: '',
  email: '',
  address: { street: '', city: '', state: '', zip: '', country: '', raw: '' },
  race: '',
  ethnicity: '',
  emergencyContact: '',
  insuranceCompany: '',
  memberId: '',
  groupNumber: '',
  chiefComplaint: '',
  counselingGoals: '',
  presentingProblems: '',
  historyOfPresentIllness: '',
  priorTreatment: '',
  medications: '',
  prescribingMD: '',
  primaryCarePhysician: '',
  medicalHistory: '',
  allergies: '',
  surgeries: '',
  troubleSleeping: '',
  developmentalHistory: '',
  tbiLoc: '',
  suicidalIdeation: '',
  suicideAttemptHistory: '',
  homicidalIdeation: '',
  psychiatricHospitalization: '',
  alcoholUse: '',
  drugUse: '',
  substanceUseHistory: '',
  familyPsychiatricHistory: '',
  familyMentalEmotionalHistory: '',
  maritalStatus: '',
  relationshipDescription: '',
  livingArrangement: '',
  education: '',
  occupation: '',
  physicalSexualAbuseHistory: '',
  domesticViolenceHistory: '',
  gad7: null,
  phq9: null,
  cssrs: null,
  dass21: null,
  recentSymptoms: '',
  additionalSymptoms: '',
  additionalInfo: '',
  manualNotes: '',
  overviewClinicalNote: '',
  spSoapNote: '',
  formTitle: '',
  formDate: '',
  signedBy: '',
  signedAt: '',
  rawQA: [],
  capturedAt: '',
  clientId: '',
}

// ── Progress Note (structured output to fill into SimplePractice) ──

export interface ProgressNote {
  // Header
  clientName: string
  sessionDate: string
  sessionType: string // e.g. "Individual Therapy", "Intake"
  cptCode: string // e.g. "90791", "90837"
  duration: string // e.g. "53 minutes"

  // Note body
  chiefComplaint: string
  presentingComplaint: string
  mentalStatusExam: {
    appearance: string
    behavior: string
    speech: string
    mood: string
    affect: string
    thoughtProcess: string
    thoughtContent: string
    perceptions: string
    cognition: string
    insight: string
    judgment: string
  }
  diagnosticImpressions: DiagnosticImpression[]
  clinicalFormulation: string
  treatmentPlan: {
    goals: string[]
    interventions: string[]
    frequency: string
    referrals: string
  }
  plan: string // next steps / follow-up

  // Metadata
  generatedAt: string
  status: NoteStatus
}

export type CriterionMatchStatus =
  | 'met'
  | 'likely'
  | 'unclear'
  | 'not_assessed'
  | 'not_met'

export type DiagnosticConfidence = 'high' | 'moderate' | 'low'

export type IntakeEvidenceField =
  | keyof IntakeData
  | 'rawQA'
  | 'combinedSymptoms'
  | 'combinedNarrative'

export interface DSM5CriterionDefinition {
  id: string
  letter: string
  number?: number
  text: string
  followUpQuestion: string
  intakeFields: IntakeEvidenceField[]
  keywords?: string[]
  phqItem?: number
  gadItem?: number
}

export interface DSM5RequiredCount {
  criterion: string
  required: number
  total: number
  mustInclude?: string[]
}

export interface DSM5RequiredCountAdjustment {
  minAge?: number
  maxAge?: number
  note?: string
  requiredCounts: DSM5RequiredCount[]
}

export interface DSM5DisorderDefinition {
  id: string
  name: string
  chapter: string
  icd10Codes: string[]
  sourcePages: [number, number]
  criteria: DSM5CriterionDefinition[]
  requiredCounts: DSM5RequiredCount[]
  requiredCountAdjustments?: DSM5RequiredCountAdjustment[]
  durationRequirement?: string
  exclusions: string[]
  specifierOptions: string[]
  ruleOuts: string[]
}

export interface CriterionEvaluation {
  criterionId: string
  status: CriterionMatchStatus
  evidence: string[]
  sources: string[]
  rationale: string
  followUpQuestion: string
}

export interface DiagnosticSuggestion {
  disorderId: string
  disorderName: string
  code: string
  confidence: DiagnosticConfidence
  reason: string
  score: number
  criteria: CriterionEvaluation[]
  metCount: number
  likelyCount: number
  unresolvedCount: number
  requiredCount: number
  suggestedSpecifier?: string
  ruleOuts: string[]
}

export interface ManualCriterionOverride {
  disorderId: string
  criterionId: string
  status: CriterionMatchStatus
  notes: string
  updatedAt: string
}

export interface DisorderNotes {
  disorderId: string
  notes: string
}

export interface DiagnosticImpression {
  disorderId: string
  code: string // ICD-10 / DSM-5 code
  name: string // e.g. "Major Depressive Disorder, Single Episode, Moderate"
  confidence: DiagnosticConfidence
  diagnosticReasoning?: string
  criteriaEvidence: string[] // supporting evidence from session
  criteriaSummary: string[]
  ruleOuts: string[]
  clinicianNotes?: string
}

export interface DiagnosticWorkspaceState {
  pinnedDisorderIds: string[]
  activeDisorderId: string | null
  overrides: ManualCriterionOverride[]
  disorderNotes: DisorderNotes[]
  finalizedImpressions: DiagnosticImpression[]
  updatedAt: string
}

export interface NoteStatus {
  intakeCaptured: boolean
  noteGenerated: boolean
  noteReviewed: boolean
  noteSubmitted: boolean
}

export const DEFAULT_NOTE_STATUS: NoteStatus = {
  intakeCaptured: false,
  noteGenerated: false,
  noteReviewed: false,
  noteSubmitted: false,
}

export const EMPTY_PROGRESS_NOTE: ProgressNote = {
  clientName: '',
  sessionDate: '',
  sessionType: '',
  cptCode: '',
  duration: '',
  chiefComplaint: '',
  presentingComplaint: '',
  mentalStatusExam: {
    appearance: '',
    behavior: '',
    speech: '',
    mood: '',
    affect: '',
    thoughtProcess: '',
    thoughtContent: '',
    perceptions: '',
    cognition: '',
    insight: '',
    judgment: '',
  },
  diagnosticImpressions: [],
  clinicalFormulation: '',
  treatmentPlan: {
    goals: [],
    interventions: [],
    frequency: '',
    referrals: '',
  },
  plan: '',
  generatedAt: '',
  status: { ...DEFAULT_NOTE_STATUS },
}

export const EMPTY_DIAGNOSTIC_WORKSPACE: DiagnosticWorkspaceState = {
  pinnedDisorderIds: [],
  activeDisorderId: null,
  overrides: [],
  disorderNotes: [],
  finalizedImpressions: [],
  updatedAt: '',
}

// ── MSE Checklist (clinician observations during session) ──

export interface MseChecklist {
  appearance: string[]
  behavior: string[]
  speech: string[]
  mood: string
  affect: string[]
  thoughtProcess: string[]
  thoughtContent: string[]
  perceptions: string[]
  cognition: string[]
  insight: string
  judgment: string
  updatedAt: string
}

export const DEFAULT_MSE_CHECKLIST: MseChecklist = {
  appearance: ['well-groomed', 'casually dressed', 'appropriate hygiene'],
  behavior: ['cooperative', 'good eye contact', 'psychomotor normal'],
  speech: ['normal rate', 'normal volume', 'coherent'],
  mood: '',
  affect: ['congruent', 'full range'],
  thoughtProcess: ['linear', 'goal-directed'],
  thoughtContent: ['no SI', 'no HI', 'no delusions'],
  perceptions: ['no hallucinations'],
  cognition: ['alert', 'oriented x4', 'intact memory'],
  insight: 'good',
  judgment: 'good',
  updatedAt: '',
}

// ── Provider Preferences ──

export interface ProviderPreferences {
  providerFirstName: string
  providerLastName: string
  defaultLocation: string
  firstVisitCPT: string
  followUpCPT: string
  llmProvider: 'ollama' | 'openai'
  ollamaModel: string
  ollamaEndpoint: string
  openaiApiKey: string
  openaiModel: string
  autoGenerateOnSessionEnd: boolean
}

// ── Treatment Plan (extracted from SimplePractice treatment plan page) ──

export interface TreatmentPlanGoal {
  goalNumber: number
  goal: string
  estimatedCompletion: string
  status: string
  objectives: Array<{
    id: string // e.g. "1A", "2B"
    objective: string
    estimatedCompletion: string
  }>
}

export interface TreatmentPlanData {
  clientId: string
  diagnoses: Array<{ code: string; description: string }>
  presentingProblem: string
  clientStrengths: string
  clientRisks: string
  goals: TreatmentPlanGoal[]
  interventions: string[]
  treatmentType: string
  estimatedLength: string
  medicalNecessity: string[]
  treatmentFrequency: string
  dateAssigned: string
  capturedAt: string
  sourceUrl: string
}

export const EMPTY_TREATMENT_PLAN: TreatmentPlanData = {
  clientId: '',
  diagnoses: [],
  presentingProblem: '',
  clientStrengths: '',
  clientRisks: '',
  goals: [],
  interventions: [],
  treatmentType: '',
  estimatedLength: '',
  medicalNecessity: [],
  treatmentFrequency: '',
  dateAssigned: '',
  capturedAt: '',
  sourceUrl: '',
}

// ── SOAP Draft + Session Transcript ──

export interface TranscriptEntry {
  speaker: 'clinician' | 'client' | 'unknown'
  text: string
  timestamp: string
}

export interface SessionTranscript {
  apptId: string
  entries: TranscriptEntry[]
  updatedAt: string
}

export interface SoapDraft {
  apptId: string
  clientName: string
  sessionDate: string
  cptCode: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  sessionNotes: string
  transcript: string
  treatmentPlanId: string
  generatedAt: string
  editedAt: string
  status: 'draft' | 'reviewed' | 'submitted'
  generationMethod: 'llm' | 'openai' | 'regex' | ''
}

export const EMPTY_SESSION_TRANSCRIPT: SessionTranscript = {
  apptId: '',
  entries: [],
  updatedAt: '',
}

export const EMPTY_SOAP_DRAFT: SoapDraft = {
  apptId: '',
  clientName: '',
  sessionDate: '',
  cptCode: '90837',
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
  sessionNotes: '',
  transcript: '',
  treatmentPlanId: '',
  generatedAt: '',
  editedAt: '',
  status: 'draft',
  generationMethod: '',
}

// ── Session Notes (live note-taking during video appointments) ──

export interface SessionNotes {
  apptId: string // extracted from /appt-{id}/room URL
  notes: string
  updatedAt: string
}

export const EMPTY_SESSION_NOTES: SessionNotes = {
  apptId: '',
  notes: '',
  updatedAt: '',
}

export const DEFAULT_PREFERENCES: ProviderPreferences = {
  providerFirstName: 'Anders',
  providerLastName: 'Chan',
  defaultLocation: 'Video Office',
  firstVisitCPT: '90791',
  followUpCPT: '90837',
  llmProvider: 'ollama',
  ollamaModel: 'llama3.2:3b',
  ollamaEndpoint: 'http://localhost:11434',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  autoGenerateOnSessionEnd: true,
}
