import type {
  AssessmentResult,
  DiagnosticImpression,
  IntakeData,
  SessionTranscript,
  SoapDraft,
  TreatmentPlanData,
} from '../../../../content/Inzinna/SimplePractice Notes/src/lib/types'
import type {
  CapturedClient,
  PendingVobDraft,
} from '../../../../content/Inzinna/zocdoc-to-simplepractice/src/lib/types'
import type { LabDetailConfig } from './lab-detail-types'

interface DemoClinicalGuidanceReference {
  resourceId: string
  resourceTitle: string
  pageStart: number
  heading: string
  preview: string
  score: number
}

interface DemoClinicalGuidance {
  modalities: string[]
  formulation: string
  goals: string
  interventions: string
  frequency: string
  referrals: string
  plan: string
  references: DemoClinicalGuidanceReference[]
  queries: string[]
}

function createAssessmentResult(
  name: string,
  totalScore: number,
  severity: string,
  difficulty: string,
  responses: Array<{ response: string; score: number }>
): AssessmentResult {
  return {
    name,
    totalScore,
    severity,
    difficulty,
    capturedAt: '2026-04-02T15:22:00Z',
    items: responses.map((item, index) => ({
      number: index + 1,
      question: `${name} item ${index + 1}`,
      response: item.response,
      score: item.score,
      maxScore: 3,
    })),
  }
}

function createBaseIntake(): IntakeData {
  return {
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
    formTitle: '',
    formDate: '',
    signedBy: '',
    signedAt: '',
    rawQA: [],
    capturedAt: '',
    clientId: '',
  }
}

const demoSimplePracticeIntake: IntakeData = {
  ...createBaseIntake(),
  fullName: 'Alicia Rivera',
  firstName: 'Alicia',
  lastName: 'Rivera',
  sex: 'Female',
  genderIdentity: 'Woman',
  dob: '1994-06-12',
  phone: '(917) 555-0142',
  email: 'alicia.r@example.test',
  address: {
    street: '214 Dean Street',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11217',
    country: 'USA',
    raw: '214 Dean Street, Brooklyn, NY 11217',
  },
  race: 'White',
  ethnicity: 'No',
  emergencyContact: 'Miguel Rivera (brother), (917) 555-0188',
  insuranceCompany: 'Aetna',
  memberId: 'AET-441902',
  groupNumber: 'G-39018',
  chiefComplaint: 'Anxiety, panic before work presentations, and depressed mood after a breakup.',
  counselingGoals: 'Reduce panic symptoms; improve sleep; return to steady work performance.',
  presentingProblems: 'Reports rumination, avoidance of team meetings, fatigue, and withdrawal from friends.',
  historyOfPresentIllness:
    'Symptoms escalated over the past 3 months after a breakup and a heavier presentation schedule at work.',
  priorTreatment: 'Brief therapy in college; no inpatient or IOP history.',
  medications: 'Sertraline 50 mg daily',
  prescribingMD: 'Dr. Patel',
  primaryCarePhysician: 'Dr. Monroe',
  medicalHistory: 'Migraines. No major medical conditions reported.',
  allergies: 'No known drug allergies.',
  surgeries: 'None reported.',
  troubleSleeping: 'Difficulty falling asleep 4 nights per week.',
  developmentalHistory: 'No developmental delays reported.',
  tbiLoc: 'Denied TBI or loss of consciousness.',
  suicidalIdeation: 'Denies current suicidal ideation.',
  suicideAttemptHistory: 'No history of suicide attempts.',
  homicidalIdeation: 'Denies homicidal ideation.',
  psychiatricHospitalization: 'None reported.',
  alcoholUse: '1-2 glasses of wine on weekends.',
  drugUse: 'Denies recreational drug use.',
  substanceUseHistory: 'No substance use disorder history.',
  familyPsychiatricHistory: 'Mother with anxiety; maternal aunt with depression.',
  familyMentalEmotionalHistory: 'Family described as emotionally avoidant and conflict-averse.',
  maritalStatus: 'Single',
  relationshipDescription: 'Recent breakup; ongoing tension with parents.',
  livingArrangement: 'Lives alone in Brooklyn apartment.',
  education: "Master's degree",
  occupation: 'Project manager at a marketing agency',
  physicalSexualAbuseHistory: 'Denied.',
  domesticViolenceHistory: 'Denied.',
  gad7: createAssessmentResult('GAD-7', 15, 'Moderately severe anxiety', 'Very difficult', [
    { response: 'More than half the days', score: 2 },
    { response: 'Nearly every day', score: 3 },
    { response: 'Nearly every day', score: 3 },
    { response: 'More than half the days', score: 2 },
    { response: 'More than half the days', score: 2 },
    { response: 'More than half the days', score: 2 },
    { response: 'Several days', score: 1 },
  ]),
  phq9: createAssessmentResult('PHQ-9', 12, 'Moderate depression', 'Somewhat difficult', [
    { response: 'Several days', score: 1 },
    { response: 'More than half the days', score: 2 },
    { response: 'More than half the days', score: 2 },
    { response: 'Several days', score: 1 },
    { response: 'More than half the days', score: 2 },
    { response: 'Several days', score: 1 },
    { response: 'More than half the days', score: 2 },
    { response: 'Several days', score: 1 },
    { response: 'Not at all', score: 0 },
  ]),
  cssrs: createAssessmentResult('C-SSRS', 0, 'No current suicide risk endorsed', 'Not difficult', [
    { response: 'No', score: 0 },
    { response: 'No', score: 0 },
    { response: 'No', score: 0 },
  ]),
  recentSymptoms:
    'Restlessness, chest tightness before meetings, low motivation, social withdrawal, and insomnia.',
  additionalSymptoms: 'Perfectionism, rumination, irritability, and crying after presentations.',
  additionalInfo: 'Symptoms worsen under deadline pressure and after conflict with family.',
  manualNotes: 'Therapist noted high self-criticism, fear of disappointing others, and strong avoidance habits.',
  overviewClinicalNote:
    'Adult outpatient intake notable for panic symptoms, generalized worry, sleep disruption, and depressed mood affecting occupational functioning.',
  formTitle: 'Adult Intake Packet',
  formDate: '2026-04-02',
  signedBy: 'Alicia Rivera',
  signedAt: '2026-04-02T15:20:00Z',
  rawQA: [
    {
      question: 'What brings you to therapy now?',
      answer: 'I am avoiding meetings at work because I feel like I will freeze and embarrass myself.',
    },
    {
      question: 'What do you want help with?',
      answer: 'I want to stop spiraling before presentations and sleep through the night again.',
    },
    {
      question: 'Any past treatment?',
      answer: 'I saw a therapist in graduate school for anxiety but stopped after moving.',
    },
  ],
  capturedAt: '2026-04-02T15:25:00Z',
  clientId: 'sp-24871',
}

const demoSimplePracticeImpressions: DiagnosticImpression[] = [
  {
    disorderId: 'gad',
    code: 'F41.1',
    name: 'Generalized Anxiety Disorder',
    confidence: 'high',
    diagnosticReasoning:
      'The intake and session evidence show chronic worry, somatic tension, sleep disruption, and avoidance across work and family domains.',
    criteriaEvidence: [
      'Client reports daily anticipatory worry before team meetings.',
      'Restlessness, chest tightness, and difficulty sleeping occur multiple times per week.',
      'Symptoms have persisted for several months and impair work performance.',
    ],
    criteriaSummary: [
      'Excessive worry present across occupational and interpersonal settings.',
      'Restlessness, fatigue, irritability, and sleep disturbance documented.',
      'Impairment clear in presentation avoidance and social withdrawal.',
    ],
    ruleOuts: ['Panic Disorder', 'Social Anxiety Disorder', 'Adjustment Disorder'],
    clinicianNotes: 'Monitor whether panic spikes remain cued by evaluation situations only.',
  },
  {
    disorderId: 'adjustment_disorder_mixed_anxiety_depressed_mood',
    code: 'F43.23',
    name: 'Adjustment Disorder with Mixed Anxiety and Depressed Mood',
    confidence: 'moderate',
    diagnosticReasoning:
      'Recent breakup and increased workload appear temporally tied to symptom escalation, though baseline anxiety may predate the current stressors.',
    criteriaEvidence: [
      'Breakup and workload increase preceded the sharp symptom escalation.',
      'Low mood and withdrawal intensified over the past three months.',
    ],
    criteriaSummary: [
      'Clear stressor-linked worsening documented.',
      'Mood symptoms present but may overlap with broader anxiety pattern.',
    ],
    ruleOuts: ['Major Depressive Disorder', 'Generalized Anxiety Disorder'],
    clinicianNotes: 'Keep as differential while longitudinal course becomes clearer.',
  },
]

const demoSimplePracticeTranscript: SessionTranscript = {
  apptId: 'appt-9031',
  updatedAt: '2026-04-07T18:14:00Z',
  entries: [
    {
      speaker: 'client',
      timestamp: '2026-04-07T18:02:00Z',
      text: 'Every time I know I have to present, I can feel my chest tighten before I even open my laptop.',
    },
    {
      speaker: 'clinician',
      timestamp: '2026-04-07T18:05:00Z',
      text: 'When that happens, what do you notice in your body and what do you end up doing next?',
    },
    {
      speaker: 'client',
      timestamp: '2026-04-07T18:06:00Z',
      text: 'I usually tell myself I am going to mess it up, then I ask someone else to cover if I can.',
    },
    {
      speaker: 'client',
      timestamp: '2026-04-07T18:10:00Z',
      text: 'I am exhausted afterwards, and then I stay up replaying everything at night.',
    },
  ],
}

const demoSimplePracticeTreatmentPlan: TreatmentPlanData = {
  clientId: 'sp-24871',
  diagnoses: [
    { code: 'F41.1', description: 'Generalized Anxiety Disorder' },
    {
      code: 'F43.23',
      description: 'Adjustment Disorder with Mixed Anxiety and Depressed Mood',
    },
  ],
  presentingProblem:
    'Client experiences anxiety, panic-like arousal, insomnia, and depressive withdrawal that interfere with work presentations and social functioning.',
  clientStrengths: 'Insightful, motivated for therapy, employed, and open to skills practice.',
  clientRisks: 'Sleep disruption, avoidance, high self-criticism, and escalating occupational stress.',
  goals: [
    {
      goalNumber: 1,
      goal: 'Reduce anticipatory panic and presentation avoidance.',
      estimatedCompletion: '2026-07-15',
      status: 'Some improvement',
      objectives: [
        {
          id: '1A',
          objective: 'Use exposure hierarchy before team meetings.',
          estimatedCompletion: '2026-05-01',
        },
        {
          id: '1B',
          objective: 'Track panic intensity and recovery after presentations.',
          estimatedCompletion: '2026-05-15',
        },
      ],
    },
    {
      goalNumber: 2,
      goal: 'Restore more stable sleep and daily functioning.',
      estimatedCompletion: '2026-07-30',
      status: 'No improvement',
      objectives: [
        {
          id: '2A',
          objective: 'Establish consistent wind-down routine 5 nights per week.',
          estimatedCompletion: '2026-05-10',
        },
      ],
    },
  ],
  interventions: ['CBT', 'Exposure', 'Behavioral activation', 'Sleep routine coaching'],
  treatmentType: 'Individual psychotherapy',
  estimatedLength: '16 weeks',
  medicalNecessity: [
    'Symptoms impair occupational performance and sleep.',
    'Avoidance and functional decline remain clinically significant.',
  ],
  treatmentFrequency: 'Weekly 53-minute sessions',
  dateAssigned: '2026-04-05',
  capturedAt: '2026-04-05T14:32:00Z',
  sourceUrl: 'https://secure.simplepractice.com/clients/sp-24871/diagnosis_treatment_plans/tp-104',
}

const demoSimplePracticeSoap: SoapDraft = {
  apptId: 'appt-9031',
  clientName: 'Alicia Rivera',
  sessionDate: '2026-04-07',
  cptCode: '90837',
  subjective:
    'Client reported marked anxiety before work presentations, chest tightness, and persistent replaying of perceived mistakes at night. She described increased avoidance of meetings, low energy after social effort, and worry that she will disappoint others.',
  objective:
    'Client appeared tired but engaged. Affect was anxious and congruent. Speech was coherent and normal in rate. Thought process remained linear and goal-directed. No SI/HI reported. Therapist reviewed panic cycle and avoidance sequence.',
  assessment:
    'Presentation remains consistent with generalized anxiety with panic-like surges in evaluative situations. Avoidance continues to maintain fear and disrupt occupational functioning. Sleep disruption and post-event rumination are reinforcing the cycle. Client shows insight and motivation for exposure-based work.',
  plan:
    'Continue weekly CBT-oriented therapy. Assign one graded exposure before next session, with brief panic tracking before and after the meeting. Reinforce sleep wind-down routine and behavioral activation after work. Reassess depressive symptoms if withdrawal worsens.',
  sessionNotes:
    'Theme: panic before presentations, perfectionism, sleep loss. Intervention: mapped panic cycle, introduced graded exposure, normalized post-event rumination, assigned short exposure + sleep routine tracking.',
  transcript:
    'Every time I know I have to present, I can feel my chest tighten before I even open my laptop. I usually tell myself I am going to mess it up. I stay up replaying everything at night.',
  treatmentPlanId: 'tp-104',
  generatedAt: '2026-04-07T18:15:00Z',
  editedAt: '2026-04-07T18:21:00Z',
  status: 'draft',
  generationMethod: 'llm',
}

const demoSimplePracticeGuidance: DemoClinicalGuidance = {
  modalities: ['CBT', 'Exposure', 'Behavioral activation', 'MI-informed'],
  formulation:
    'Current anxiety appears maintained by anticipatory threat appraisal, self-critical beliefs, and avoidance of evaluative situations. Sleep disruption and recent relationship loss are amplifying emotional reactivity and recovery time.',
  goals:
    '1. Reduce avoidance of presentations and meetings.\n2. Improve sleep consistency and next-day functioning.\n3. Strengthen tolerance for post-event shame and rumination.',
  interventions:
    'Map the panic cycle, build a graded exposure ladder for presentations, use behavioral experiments around feared mistakes, reinforce values-based action after work, and tighten the evening wind-down routine.',
  frequency: 'Weekly 53-minute psychotherapy sessions.',
  referrals: 'Coordinate with PCP if insomnia worsens or medication side effects emerge.',
  plan:
    'Move from insight gathering into consistent exposure practice while monitoring whether depressive symptoms remain secondary to anxiety-related avoidance.',
  references: [
    {
      resourceId: 'case-formulation-approach-cbt',
      resourceTitle: 'Case Formulation Approach to CBT',
      pageStart: 41,
      heading: 'Maintaining cycles in anxiety presentations',
      preview:
        'Use a concise maintaining-cycle map to connect trigger, prediction, bodily arousal, safety behavior, and short-term relief.',
      score: 12,
    },
    {
      resourceId: 'behavioral-interventions-cbt-2e',
      resourceTitle: 'Behavioral Interventions in CBT',
      pageStart: 88,
      heading: 'Graduated exposure planning',
      preview:
        'Exposure is most useful when it targets the avoided task directly and pairs repetition with clear before-and-after monitoring.',
      score: 10,
    },
  ],
  queries: ['panic before presentations', 'sleep disruption in anxiety', 'behavioral activation for withdrawal'],
}

const demoZocdocClient: CapturedClient = {
  firstName: 'Sample',
  lastName: 'Patient',
  sex: 'Female',
  dob: '1990-01-01',
  phone: '(555) 555-0100',
  email: 'sample.patient@example.test',
  address: {
    street: '123 Example Street',
    city: 'Anytown',
    state: 'NY',
    zip: '10001',
  },
  insuranceCompany: 'Sample Insurance Co.',
  memberId: 'DEMO-000000',
  groupNumber: 'GRP-0000',
  subscriberName: 'Sample Patient',
  subscriberRelationship: 'Self',
  copay: '$0',
  insuranceCardFront: 'data:image/png;base64,front-card-demo',
  insuranceCardBack: 'data:image/png;base64,back-card-demo',
  appointmentDate: '2026-04-09',
  appointmentTime: '9:00 AM',
  serviceType: 'Initial evaluation',
  reasonForVisit: 'Anxiety and sleep issues',
  presentingConcerns:
    'Reports panic symptoms before medical appointments and ongoing insomnia related to stress.',
  medications: 'Hydroxyzine as needed',
  priorTreatment: 'Saw a therapist in 2021 for six months.',
  capturedAt: '2026-04-08T13:18:00Z',
  status: {
    clientCreated: true,
    appointmentSet: true,
    insuranceAdded: true,
    vobEmailSent: false,
  },
}

const demoVobDraft: PendingVobDraft = {
  to: ['billing@example.test'],
  cc: ['provider@example.test'],
  subject: 'VOB Needed: S.P. 2026-04-09 9:00 AM',
  body: `Hi team,

Please verify benefits for S.P. before the initial evaluation on 2026-04-09 at 9:00 AM.

Carrier: Sample Insurance Co.
Member ID: DEMO-000000
Group #: GRP-0000
Copay shown in Zocdoc: $0

Regards,
Provider`,
  createdAt: '2026-04-08T13:24:00Z',
}

const simplePracticeNotesConfig: LabDetailConfig = {
  slug: 'simplepractice-notes',
  title: 'SimplePractice Notes',
  description:
    'Chart work takes too long. This Chrome extension captures intakes, reviews diagnoses, drafts SOAP notes, and preps for supervision. Patient data stays on your machine.',
  categoryLabel: 'Psychologist Tools',
  statusLabel: 'Beta Demo',
  accent: 'blue',
  tags: ['Chrome Extension', 'Local AI', 'SOAP Draft', 'Diagnostics', 'Treatment Plan', 'De-Identification', 'Supervision Prep', 'OpenAI Hybrid'],
  audience:
    'Psychologists and psychotherapists already documenting care inside SimplePractice.',
  whyItExists:
    'Clinicians spend hours on notes that could take minutes. This tool handles the repetitive parts without sending patient data to a generic cloud writer.',
  heroFacts: [
    {
      label: 'Workflow Surface',
      value: 'SimplePractice intake pages, appointment notes, treatment plans, and a clinician-facing side panel.',
    },
    {
      label: 'Automation Style',
      value: 'DOM-based extraction and fill. MVP does not require a SimplePractice API integration.',
    },
    {
      label: 'Lab Demo',
      value: 'Mock data only. No live PHI, no auth, and no model calls happen on this page.',
    },
  ],
  workflowHeading: 'Interactive Demo',
  workflowIntro:
    'Six steps from intake to supervision prep. The walkthrough below uses mock data shaped after the real extension.',
  steps: [
    {
      id: 'intake-capture',
      label: 'Intake Capture',
      title: 'Pull the intake packet straight from the chart',
      summary:
        'One click captures the full intake: demographics, assessments, history, medications. Everything downstream reads from this single source.',
      bullets: [
        'Demographics, insurance, symptoms, trauma history, medications, and narrative fields in one grab.',
        'GAD-7, PHQ-9, C-SSRS scores preserved alongside the narrative intake.',
        'Same data feeds diagnostic review, SOAP drafting, and form filling. No re-entry.',
      ],
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Client ID', value: demoSimplePracticeIntake.clientId },
            { label: 'Captured At', value: 'Apr 2, 2026 · 3:25 PM' },
            { label: 'Form', value: demoSimplePracticeIntake.formTitle },
            { label: 'Insurance', value: demoSimplePracticeIntake.insuranceCompany },
          ],
        },
        {
          type: 'fields',
          title: 'Structured Intake Snapshot',
          items: [
            { label: 'Client', value: demoSimplePracticeIntake.fullName, state: 'complete' },
            { label: 'Chief complaint', value: demoSimplePracticeIntake.chiefComplaint, state: 'complete' },
            { label: 'Presenting problems', value: demoSimplePracticeIntake.presentingProblems, state: 'complete' },
            { label: 'Medications', value: demoSimplePracticeIntake.medications, state: 'complete' },
            { label: 'Risk', value: demoSimplePracticeIntake.suicidalIdeation, state: 'complete' },
          ],
        },
        {
          type: 'pills',
          title: 'Assessments Found',
          items: [
            `${demoSimplePracticeIntake.gad7?.name} · ${demoSimplePracticeIntake.gad7?.totalScore}`,
            `${demoSimplePracticeIntake.phq9?.name} · ${demoSimplePracticeIntake.phq9?.totalScore}`,
            `${demoSimplePracticeIntake.cssrs?.name} · No current risk`,
          ],
        },
      ],
    },
    {
      id: 'diagnostic-review',
      label: 'Diagnostic Review',
      title: 'Work diagnosis in a side panel, not scattered note fields',
      summary:
        'Pin diagnoses, review criteria, record evidence and rule-outs. All in one place before anything hits the note.',
      bullets: [
        'Multiple diagnoses open at once for comparing rule-outs and differentials.',
        'Evidence and reasoning live in structured impressions, not buried in a paragraph.',
        'You stay the decision-maker. The tool suggests, summarizes, and organizes.',
      ],
      blocks: [
        {
          type: 'pills',
          title: 'Pinned Diagnoses',
          items: demoSimplePracticeImpressions.map(
            impression => `${impression.name} · ${impression.code}`
          ),
        },
        {
          type: 'fields',
          title: 'Criteria Review Snapshot',
          items: [
            { label: 'Chronic worry across settings', value: 'Present in work and family contexts', state: 'complete' },
            { label: 'Somatic arousal', value: 'Chest tightness and restlessness before presentations', state: 'complete' },
            { label: 'Sleep disturbance', value: 'Difficulty falling asleep 4 nights/week', state: 'complete' },
            { label: 'Mood disorder differential', value: 'Monitor if low mood persists independent of anxiety spikes', state: 'watch' },
          ],
        },
        {
          type: 'sections',
          items: demoSimplePracticeImpressions.map(impression => ({
            label: impression.name,
            body: `${impression.diagnosticReasoning ?? ''}\n\nRule-outs: ${impression.ruleOuts.join(', ')}`,
          })),
        },
      ],
    },
    {
      id: 'transcript-session',
      label: 'Transcript + Notes',
      title: 'Session notes, transcript, and treatment plan in one view',
      summary:
        'Your shorthand, transcript excerpts, and active treatment goals sit together before the SOAP draft runs.',
      bullets: [
        'Transcript capture feeds the draft as supporting context, not an auto-filed note.',
        'Your own session shorthand stays in the pipeline. The AI adds to it, not over it.',
        'Treatment goals stay visible so the note documents progress, not a rehash of the intake.',
      ],
      blocks: [
        {
          type: 'transcript',
          title: 'Transcript Excerpts',
          items: demoSimplePracticeTranscript.entries.map(entry => ({
            speaker: entry.speaker === 'unknown' ? 'system' : entry.speaker,
            time: new Date(entry.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }),
            text: entry.text,
          })),
        },
        {
          type: 'text',
          title: 'Clinician Session Notes',
          body: demoSimplePracticeSoap.sessionNotes,
        },
        {
          type: 'fields',
          title: 'Treatment Plan Context',
          items: [
            {
              label: 'Goal 1',
              value: demoSimplePracticeTreatmentPlan.goals[0]?.goal ?? '',
              state: 'active',
            },
            {
              label: 'Objective 1A',
              value: demoSimplePracticeTreatmentPlan.goals[0]?.objectives[0]?.objective ?? '',
              state: 'active',
            },
            {
              label: 'Frequency',
              value: demoSimplePracticeTreatmentPlan.treatmentFrequency,
              state: 'complete',
            },
          ],
        },
      ],
    },
    {
      id: 'soap-draft',
      label: 'SOAP Draft',
      title: 'Draft the SOAP note before touching the chart',
      summary:
        'Intake, session notes, transcript, diagnoses, and treatment plan all feed one editable draft. You review it before anything gets written back.',
      bullets: [
        'Runs locally by default. Nothing leaves your machine unless you configure a cloud model.',
        'Every section stays editable. No locked AI paragraphs.',
        'Built for follow-up psychotherapy notes, not generic summarization.',
      ],
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'CPT', value: demoSimplePracticeSoap.cptCode },
            { label: 'Generation', value: 'Local LLM draft' },
            { label: 'Status', value: 'Review required', tone: 'amber' },
            { label: 'Session date', value: demoSimplePracticeSoap.sessionDate },
          ],
        },
        {
          type: 'sections',
          title: 'SOAP Draft Preview',
          items: [
            { label: 'S', body: demoSimplePracticeSoap.subjective },
            { label: 'O', body: demoSimplePracticeSoap.objective },
            { label: 'A', body: demoSimplePracticeSoap.assessment },
            { label: 'P', body: demoSimplePracticeSoap.plan },
          ],
        },
      ],
    },
    {
      id: 'guidance',
      label: 'Formulation Support',
      title: 'Better treatment suggestions without exposing patient data',
      summary:
        'Ollama strips identifiers locally. OpenAI reasons on anonymized data. Ollama puts the names back. Patient info never leaves your machine.',
      bullets: [
        'Names, dates, locations, and contact info get replaced with tokens before any cloud call. The mapping lives in session-only browser storage.',
        'GPT-4o-mini handles clinical reasoning for pennies per month. Way better than a 3B local model for treatment planning.',
        'No API key? No internet? Ollama-only fallback still works. You pick the path.',
      ],
      blocks: [
        {
          type: 'sections',
          title: 'De-Identification Pipeline',
          items: [
            {
              label: 'Step 1 · Ollama (local)',
              body: 'Scans for PHI: names, DOB, dates, locations, contact info, employer, MRN. Replaces them with tokens like [CLIENT_1], [DATE_1]. The mapping stays in your browser.',
            },
            {
              label: 'Step 2 · OpenAI (cloud)',
              body: 'Receives only anonymized data: age range, diagnoses, symptoms, modalities, assessment scores, session themes. Does the clinical reasoning a 3B local model cannot.',
            },
            {
              label: 'Step 3 · Ollama (local)',
              body: 'Swaps tokens back with real values from the local mapping. Full clinical context restored. Nothing identifiable ever left the device.',
            },
          ],
        },
        {
          type: 'pills',
          title: 'Suggested Modalities',
          items: demoSimplePracticeGuidance.modalities,
        },
        {
          type: 'sections',
          items: [
            { label: 'Formulation', body: demoSimplePracticeGuidance.formulation },
            { label: 'Goals', body: demoSimplePracticeGuidance.goals },
            { label: 'Interventions', body: demoSimplePracticeGuidance.interventions },
            { label: 'Plan', body: `${demoSimplePracticeGuidance.frequency}\n\n${demoSimplePracticeGuidance.plan}` },
          ],
        },
        {
          type: 'references',
          title: 'Knowledge Matches',
          items: demoSimplePracticeGuidance.references.map(reference => ({
            title: reference.resourceTitle,
            meta: `p. ${reference.pageStart} · ${reference.heading}`,
            preview: reference.preview,
          })),
        },
      ],
    },
    {
      id: 'supervision-prep',
      label: 'Supervision Prep',
      title: 'Walk into supervision with a prepared agenda',
      summary:
        'Discussion questions, blind-spot flags, and modality prompts pulled from your actual session data. Private to you. Not a supervisor dashboard.',
      bullets: [
        'Nothing is shared unless you copy and share it. Your supervisor never sees this unless you choose.',
        'Asks questions, not recommendations. Avoids the ethics issues flagged in recent AI supervision research.',
        'Every question and flag cites a specific session observation. No generic templates.',
        'On-demand only. You click a button, it generates. Stored in session-only browser storage.',
      ],
      blocks: [
        {
          type: 'sections',
          title: 'Supervision Agenda Preview',
          items: [
            {
              label: 'Case Summary',
              body: '31-year-old woman presenting with generalized anxiety (GAD-7: 15), panic-like surges in evaluative work situations, and adjustment-related depressive symptoms (PHQ-9: 12) following a recent breakup. Current treatment: weekly CBT-oriented psychotherapy with graded exposure. Medications: Sertraline 50 mg daily. No current suicide risk endorsed.',
            },
            {
              label: 'Discussion Questions',
              body: '1. Client\'s avoidance of team meetings has persisted despite insight into the panic cycle. What exposure pacing would balance therapeutic challenge with session retention?\n\n2. Post-event rumination and replay at night appear to reinforce the avoidance loop independently of the panic itself. Should rumination-focused work (e.g., metacognitive strategies) be introduced alongside exposure, or would that dilute the current focus?\n\n3. The breakup appears temporally tied to symptom escalation, but client minimizes its impact in session. How directly should grief and relationship loss be explored given the current anxiety-first treatment frame?\n\n4. Sertraline 50 mg has been stable. At what point should coordination with the prescriber be initiated if sleep disruption and panic intensity do not improve with behavioral intervention?',
            },
            {
              label: 'Blind-Spot Flags',
              body: '• Perfectionism and fear of disappointing others may be maintaining avoidance independently of panic symptoms. Consider whether schema-level work is needed beyond exposure.\n\n• Family described as "emotionally avoidant and conflict-averse." Client\'s avoidance pattern may have relational roots that exposure alone will not reach.\n\n• Sleep disruption is tracked as a symptom but not yet targeted with a structured intervention. 4 nights/week of difficulty falling asleep may warrant dedicated sleep-focused work.',
            },
            {
              label: 'Modality Prompts',
              body: 'CBT: Is the current maintaining-cycle formulation capturing the role of self-critical cognitions, or is it over-indexing on the panic-avoidance loop?\n\nExposure: The graded hierarchy targets presentations. Should social situations outside work (e.g., friend gatherings the client has been avoiding) be added to generalize gains?\n\nBehavioral Activation: Post-work withdrawal is documented but not yet on the activation schedule. What low-effort valued activities could counter the evening shutdown pattern?',
            },
          ],
        },
        {
          type: 'pills',
          title: 'Privacy Safeguards',
          items: [
            'Session-only storage (auto-deleted on browser close)',
            'On-demand generation only',
            'No telemetry or logging',
            'No sharing mechanism beyond clipboard',
            'De-identified before any cloud call',
            'Cleared on New Patient',
          ],
        },
      ],
    },
  ],
  proofHeading: 'Concrete Capabilities',
  proofBullets: [
    'Captures demographics, history, symptoms, assessments, and raw Q&A from SimplePractice intakes.',
    'Diagnostic workspace with pinned diagnoses, criterion review, clinician notes, and rule-outs.',
    'Editable SOAP drafts built from session notes, transcript, treatment plan, and diagnostic impressions.',
    'Patient identifiers stripped locally before any cloud call. Names, dates, and locations never leave the browser.',
    'Treatment suggestions grounded in a bundled clinical knowledge corpus and cloud reasoning.',
    'Supervision agendas with discussion questions, blind-spot flags, and modality prompts from real session data.',
  ],
  architectureHeading: 'Privacy + Architecture',
  architectureBullets: [
    'Manifest V3 Chrome extension. DOM-based extraction and fill. No vendor API required.',
    'Ollama strips identifiers locally, OpenAI reasons on anonymized data, Ollama re-identifies the output. Patient info never leaves the device.',
    'Works fully offline with Ollama only. Cloud path is optional and clinician-controlled.',
    'This lab page is a demo. No SimplePractice connection, no stored PHI, no model calls.',
  ],
  researchHeading: 'Why This Matters',
  researchCards: [
    {
      title: 'Price creep, same core jobs',
      body:
        'Therapists keep paying more for SimplePractice while the core documentation work stays the same. This tool is workflow relief, not another add-on.',
    },
    {
      title: 'Reliability during sessions',
      body:
        'Chart friction, telehealth bugs, freezing. Notes and chart access have to stay dependable while the session is happening.',
    },
    {
      title: 'Clinicians want time back, not features',
      body:
        'The pitch is not "more AI." It is faster notes, cleaner treatment planning, and a better review surface before anything hits the record.',
    },
    {
      title: 'No one builds clinician-facing supervision prep',
      body:
        'Eleos, Lyssn, and Upheal give supervisors dashboards. No competitor generates a supervision agenda for the clinician. You walk in prepared, not observed.',
    },
  ],
  statusHeading: 'Current Status',
  statusColumns: [
    {
      title: 'Built Now',
      items: [
        'Intake capture from SimplePractice intake materials, including assessments and raw Q&A.',
        'Diagnostic side panel with pinned diagnoses, criterion review, summaries, and guidance support.',
        'Treatment-plan capture plus transcript/session-note inputs for SOAP generation.',
        'Editable SOAP draft workflow with clinician review before fill.',
      ],
    },
    {
      title: 'Planned Next',
      items: [
        'Local de-identification pipeline: Ollama strips PHI, OpenAI reasons on anonymized data, Ollama re-identifies. Better treatment suggestions, same privacy.',
        'Supervision Prep tab: case summary, discussion questions, blind-spot flags, modality prompts.',
        'OpenAI API key configuration in popup settings with per-key usage tracking.',
        'Tighter treatment planning output. 3-5 specific bullets per section, no filler.',
      ],
    },
  ],
  note:
    'Demo only. This page uses mock data shaped after the current extension types and planning docs. No real PHI, SimplePractice session, or LLM request is used here.',
}

const zocdocSimplePracticeConfig: LabDetailConfig = {
  slug: 'zocdoc-simplepractice',
  title: 'ZocDoc to SimplePractice',
  description:
    'Capture a new referral on ZocDoc once. The extension fills SimplePractice: demographics, insurance, appointment, VOB email. No retyping.',
  categoryLabel: 'Psychologist Tools',
  statusLabel: 'Building',
  accent: 'amber',
  brandLogos: [
    { src: '/lab/zocdoc.png', alt: 'ZocDoc logo', label: 'ZocDoc' },
    { src: '/lab/simplepractice.png', alt: 'SimplePractice logo', label: 'SimplePractice' },
  ],
  tags: ['Chrome Extension', 'No Backend', 'Intake Automation', 'Insurance Fill', 'VOB Email'],
  audience: 'Therapists and front-desk staff moving new referrals from ZocDoc into SimplePractice.',
  whyItExists:
    'A single referral gets retyped three or four times before it becomes a chart. This takes it down to zero.',
  heroFacts: [
    {
      label: 'Workflow Surface',
      value: 'ZocDoc provider portal → SimplePractice client, insurance, and scheduling forms.',
    },
    {
      label: 'Automation Style',
      value: 'Content scripts and a background worker. No backend, no API keys, no data leaves the browser.',
    },
    {
      label: 'Lab Demo',
      value: 'Mock data only. Nothing on this page touches a real chart.',
    },
  ],
  workflowHeading: 'Interactive Demo',
  workflowIntro:
    'One capture on ZocDoc feeds every downstream form: demographics, insurance, appointment, VOB email. Same object throughout.',
  steps: [
    {
      id: 'zocdoc-capture',
      label: 'ZocDoc Capture',
      title: 'Capture the referral once',
      summary:
        'Demographics, appointment timing, insurance, presenting concerns, and both card images, all in one click.',
      bullets: [
        'Runs against the real ZocDoc provider portal, not a spreadsheet copy-paste.',
        'Card images, appointment context, and presenting concerns come along in the same grab.',
        'This payload becomes the source of truth for every step that follows.',
      ],
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Appointment', value: `${demoZocdocClient.appointmentDate} · ${demoZocdocClient.appointmentTime}` },
            { label: 'Service', value: demoZocdocClient.serviceType },
            { label: 'Carrier', value: demoZocdocClient.insuranceCompany },
            { label: 'Cards', value: 'Front + back captured' },
          ],
        },
        {
          type: 'fields',
          title: 'Captured Referral Payload',
          items: [
            { label: 'Client', value: `${demoZocdocClient.firstName} ${demoZocdocClient.lastName}`, state: 'complete' },
            { label: 'DOB', value: demoZocdocClient.dob, state: 'complete' },
            { label: 'Phone', value: demoZocdocClient.phone, state: 'complete' },
            { label: 'Reason for visit', value: demoZocdocClient.reasonForVisit, state: 'complete' },
            { label: 'Prior treatment', value: demoZocdocClient.priorTreatment, state: 'complete' },
          ],
        },
      ],
    },
    {
      id: 'sp-demographics',
      label: 'Demographics Fill',
      title: 'Autofill the SimplePractice client record',
      summary: '',
      bullets: [
        'SPA-safe input events so Ember-driven form state actually updates.',
        'Office, referred-by, and reminders are part of the flow, not a manual cleanup pass.',
        'Same captured payload feeds every downstream step, so nothing drifts.',
      ],
      blocks: [
        {
          type: 'fields',
          title: 'SimplePractice Client Form',
          items: [
            { label: 'First name', value: demoZocdocClient.firstName, state: 'complete' },
            { label: 'Last name', value: demoZocdocClient.lastName, state: 'complete' },
            { label: 'DOB', value: demoZocdocClient.dob, state: 'complete' },
            { label: 'Billing type', value: 'Insurance', state: 'complete' },
            { label: 'Status', value: 'Active', state: 'complete' },
            { label: 'Office', value: 'Video Office', state: 'complete' },
            { label: 'Referred by', value: 'Zoc Doc', state: 'complete' },
          ],
        },
        {
          type: 'pills',
          title: 'Form Extras',
          items: ['Email', 'Phone', 'Address', 'Reminders enabled', 'Office preset'],
        },
      ],
    },
    {
      id: 'insurance-fill',
      label: 'Insurance Fill',
      title: 'Autofill insurance into SimplePractice',
      summary: '',
      bullets: [
        'Built for the real SimplePractice insurance form, including payer search and card upload.',
        'Card images auto-attach, removing another handoff between clinician and front desk.',
        'The patient already typed this once. Nobody should type it again.',
      ],
      blocks: [
        {
          type: 'fields',
          title: 'Insurance Record',
          items: [
            { label: 'Carrier', value: demoZocdocClient.insuranceCompany, state: 'complete' },
            { label: 'Member ID', value: demoZocdocClient.memberId, state: 'complete' },
            { label: 'Group #', value: demoZocdocClient.groupNumber, state: 'complete' },
            { label: 'Subscriber', value: demoZocdocClient.subscriberName, state: 'complete' },
            { label: 'Relationship', value: demoZocdocClient.subscriberRelationship, state: 'complete' },
            { label: 'Copay', value: demoZocdocClient.copay, state: 'complete' },
          ],
        },
        {
          type: 'pills',
          title: 'Uploads',
          items: ['Front insurance card', 'Back insurance card', 'Payer typeahead match'],
        },
      ],
    },
    {
      id: 'appointment-fill',
      label: 'Appointment Fill',
      title: 'Autofill the appointment into SimplePractice',
      summary: '',
      bullets: [
        'Provider defaults drive office and CPT picks for initials and follow-ups.',
        'Recurring follow-ups happen in the same pass. No second trip to the calendar.',
        'Client search, scheduling, and visit notes all stay tied to one captured client.',
      ],
      blocks: [
        {
          type: 'fields',
          title: 'Appointment Setup',
          items: [
            { label: 'Client search', value: `${demoZocdocClient.lastName} selected`, state: 'complete' },
            { label: 'Date', value: demoZocdocClient.appointmentDate, state: 'complete' },
            { label: 'Time', value: demoZocdocClient.appointmentTime, state: 'complete' },
            { label: 'Office', value: 'Video Office', state: 'complete' },
            { label: 'Initial CPT', value: '90791', state: 'complete' },
            { label: 'Follow-up CPT', value: '90837 recurring weekly', state: 'active' },
          ],
        },
        {
          type: 'text',
          title: 'Appointment Notes',
          body: `${demoZocdocClient.reasonForVisit}\n\nPresenting concerns: ${demoZocdocClient.presentingConcerns}`,
        },
      ],
    },
    {
      id: 'vob-email',
      label: 'VOB Draft',
      title: 'Draft the VOB email from the same intake',
      summary: '',
      bullets: [
        'Keeps VOB inside the browser instead of a separate intake checklist.',
        'Provider prefs carry default recipients, CCs, and signature block.',
        'Generated from captured data, not re-keyed from the chart.',
      ],
      blocks: [
        {
          type: 'fields',
          title: 'Recipients',
          items: [
            { label: 'To', value: demoVobDraft.to.join(', '), state: 'complete' },
            { label: 'CC', value: demoVobDraft.cc.join(', '), state: 'complete' },
            { label: 'Subject', value: demoVobDraft.subject, state: 'active' },
          ],
        },
        {
          type: 'text',
          title: 'Email Draft',
          body: demoVobDraft.body,
          monospace: true,
        },
      ],
    },
    {
      id: 'phi-cleanup',
      label: 'Data Cleanup',
      title: 'Patient data stays local and clears itself',
      summary:
        'Nothing leaves the browser. Referral data is automatically wiped after one hour so sensitive information never lingers.',
      bullets: [
        'All data lives in the browser only. No server, no cloud, no external calls.',
        'An automatic timer wipes everything after one hour.',
        'Status flags track which steps are done so nothing gets missed before cleanup.',
      ],
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Where data lives', value: 'Your browser only' },
            { label: 'Auto-clears after', value: '1 hour', tone: 'amber' },
            { label: 'How it clears', value: 'Background timer' },
            { label: 'Server or cloud', value: 'None', tone: 'emerald' },
          ],
        },
        {
          type: 'fields',
          title: 'Captured Client Status',
          items: [
            {
              label: 'Client created',
              value: demoZocdocClient.status.clientCreated ? 'Yes' : 'No',
              state: demoZocdocClient.status.clientCreated ? 'complete' : 'pending',
            },
            {
              label: 'Insurance added',
              value: demoZocdocClient.status.insuranceAdded ? 'Yes' : 'No',
              state: demoZocdocClient.status.insuranceAdded ? 'complete' : 'pending',
            },
            {
              label: 'Appointment set',
              value: demoZocdocClient.status.appointmentSet ? 'Yes' : 'No',
              state: demoZocdocClient.status.appointmentSet ? 'complete' : 'pending',
            },
            {
              label: 'VOB email sent',
              value: demoZocdocClient.status.vobEmailSent ? 'Sent' : 'Draft pending',
              state: demoZocdocClient.status.vobEmailSent ? 'complete' : 'watch',
            },
          ],
        },
      ],
    },
  ],
  proofHeading: 'What It Does',
  proofBullets: [
    'Captures demographics, timing, insurance, presenting concerns, and card images from the ZocDoc portal.',
    'Fills SimplePractice client, insurance, appointment, and office defaults through the live DOM.',
    'Drafts the VOB email from provider preferences and captured intake. No retyping.',
    'One-hour TTL plus hourly cleanup keeps referral PHI from sitting in storage.',
  ],
  architectureHeading: 'Privacy + Architecture',
  architectureBullets: [
    'Manifest V3 extension: two content scripts, popup settings, background service worker.',
    'Browser-side DOM automation. No backend, no SimplePractice API integration.',
    'This page is a demo. It does not connect to ZocDoc, Gmail, or SimplePractice, and it stores nothing.',
  ],
  researchHeading: 'Why This Matters',
  researchCards: [
    {
      title: 'Per-booking math hurts',
      body:
        'ZocDoc charges per booking. No-shows and non-converters still cost money. A slow intake makes every referral more expensive.',
    },
    {
      title: 'Booking is not matching',
      body:
        'A generic booking layer does not hand you a chart. The patient still needs to be entered, scheduled, and contextualized in the EHR.',
    },
    {
      title: 'Wrong insurance creates double work',
      body:
        'Directory carrier data is often wrong. Staff fix it by hand after the fact. This tool shrinks that correction loop.',
    },
  ],
  statusHeading: 'Current Status',
  statusColumns: [
    {
      title: 'Built Now',
      items: [
        'ZocDoc capture for demographics, timing, presenting concerns, and card images.',
        'SimplePractice fill for client, insurance, appointments, and the VOB email draft.',
        'Popup settings for provider defaults and timed PHI cleanup in the background worker.',
      ],
    },
    {
      title: 'Planned Next',
      items: [
        'More testing against the live ZocDoc portal and the current SimplePractice DOM.',
        'Payer typeahead matching, card fallback capture, and recurring-appointment verification.',
        'Mapping selectors exposed by real portal testing.',
      ],
    },
  ],
  note:
    'Demo only. Mock referral data shaped after the real extension types. No live patient data or third-party access on this page.',
}

const configs = {
  'simplepractice-notes': simplePracticeNotesConfig,
  'zocdoc-simplepractice': zocdocSimplePracticeConfig,
} satisfies Record<LabDetailConfig['slug'], LabDetailConfig>

export function getInzinnaDemoConfig(
  slug: LabDetailConfig['slug']
): LabDetailConfig {
  return configs[slug]
}
