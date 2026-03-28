// ── Intake Data (extracted from SimplePractice client profile / intake forms) ──

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

  // Symptom checklist
  recentSymptoms: string
  additionalSymptoms: string
  additionalInfo: string

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
  recentSymptoms: '',
  additionalSymptoms: '',
  additionalInfo: '',
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

export interface DiagnosticImpression {
  code: string // ICD-10 / DSM-5 code
  name: string // e.g. "Major Depressive Disorder, Single Episode, Moderate"
  criteriaEvidence: string[] // supporting evidence from session
  ruleOuts: string[]
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

// ── Provider Preferences ──

export interface ProviderPreferences {
  providerFirstName: string
  providerLastName: string
  defaultLocation: string
  firstVisitCPT: string
  followUpCPT: string
}

export const DEFAULT_PREFERENCES: ProviderPreferences = {
  providerFirstName: 'Anders',
  providerLastName: 'Chan',
  defaultLocation: 'Video Office',
  firstVisitCPT: '90791',
  followUpCPT: '90837',
}
