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
  emergencyContact: 'Miguel Rivera (brother) — (917) 555-0188',
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
  firstName: 'Marisol',
  lastName: 'Hernandez',
  sex: 'Female',
  dob: '1991-09-04',
  phone: '(718) 555-0178',
  email: 'marisol.h@example.test',
  address: {
    street: '88 37th Avenue',
    city: 'Jackson Heights',
    state: 'NY',
    zip: '11372',
  },
  insuranceCompany: 'Blue Cross Blue Shield',
  memberId: 'BCBS-309118',
  groupNumber: 'GRP-8124',
  subscriberName: 'Marisol Hernandez',
  subscriberRelationship: 'Self',
  copay: '$35',
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
  to: ['david@sosapartners.com', 'support@sosapartners.com'],
  cc: ['greg@drinzinna.com', 'carlos@drinzinna.com'],
  subject: 'VOB Needed — M.H. — 2026-04-09 9:00 AM',
  body: `Hi team,

Please verify benefits for M.H. before the initial evaluation on 2026-04-09 at 9:00 AM.

Carrier: Blue Cross Blue Shield
Member ID: BCBS-309118
Group #: GRP-8124
Copay shown in Zocdoc: $35

Regards,
Anders`,
  createdAt: '2026-04-08T13:24:00Z',
}

const simplePracticeNotesConfig: LabDetailConfig = {
  slug: 'simplepractice-notes',
  title: 'SimplePractice Notes',
  description:
    'A local-first SimplePractice copilot for intake capture, diagnostic review, transcript-assisted SOAP drafting, and knowledge-backed treatment planning.',
  categoryLabel: 'Psychologist Tools',
  statusLabel: 'Beta Demo',
  accent: 'blue',
  tags: ['Chrome Extension', 'Local AI', 'SOAP Draft', 'Diagnostics', 'Treatment Plan'],
  audience:
    'Psychologists and psychotherapists already documenting care inside SimplePractice.',
  whyItExists:
    'The documentation burden is real. The goal is to reduce repetitive chart work without sending sensitive clinical material to a generic cloud note writer.',
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
    'The extension already spans intake capture, diagnostic review, transcript/session support, SOAP drafting, and knowledge-backed planning. The walkthrough below mirrors that flow with demo data shaped after the current extension types.',
  steps: [
    {
      id: 'intake-capture',
      label: 'Intake Capture',
      title: 'Capture the intake packet already sitting in the chart',
      summary:
        'The extension reads the SimplePractice intake content, preserves raw Q&A, and normalizes it into a structured intake object ready for later note generation.',
      bullets: [
        'Demographics, insurance, symptoms, trauma history, medications, and narrative fields are captured into one intake payload.',
        'Standardized assessment results like GAD-7, PHQ-9, and C-SSRS are preserved alongside the narrative intake.',
        'The same data becomes the source for diagnostic review, SOAP drafting, and later form filling.',
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
      title: 'Work diagnosis in a side panel, not across scattered note fields',
      summary:
        'The diagnostic workspace surfaces ranked diagnoses, lets the clinician pin disorders for review, and records criterion evidence, rule-outs, and overrides before anything is pushed into a note.',
      bullets: [
        'Multiple diagnoses can stay open at once so the clinician can compare rule-outs and differentials.',
        'Evidence and reasoning are stored in structured impressions, not buried in a paragraph.',
        'The clinician remains the decision-maker. The tool suggests, summarizes, and organizes.',
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
      title: 'Blend session notes, transcript capture, and treatment-plan context',
      summary:
        'The current extension can keep manual session notes, transcript entries, and treatment-plan context in one workspace before the SOAP note is generated.',
      bullets: [
        'Transcript capture is used as supporting input, not as an auto-filed note.',
        'Session notes still matter. The clinician’s own shorthand becomes part of the draft pipeline.',
        'Treatment-plan goals and objectives stay visible so the note can document progress instead of rehashing the intake.',
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
      title: 'Generate an editable note draft before touching the chart',
      summary:
        'SOAP generation already has a structured path: intake, session notes, transcript context, diagnoses, treatment plan, and MSE-informed content all feed a draft the clinician can edit before fill.',
      bullets: [
        'The current workflow supports local Ollama as the default generation path, with clinician review before anything is written back.',
        'Each section stays editable instead of becoming a locked AI paragraph.',
        'The output is built for follow-up psychotherapy notes, not generic summarization.',
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
      title: 'Pull formulation and intervention guidance from a bundled knowledge corpus',
      summary:
        'The extension already includes a bundled clinical-knowledge search layer. The side panel uses it to suggest formulation language, goals, interventions, referrals, and next steps tied to the current case picture.',
      bullets: [
        'The knowledge layer is used as clinical support, not as an autonomous treatment planner.',
        'Search results remain inspectable with page/heading context instead of black-box recommendations.',
        'This is where the note workflow starts to feel like a serious clinician tool, not just a text generator.',
      ],
      blocks: [
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
  ],
  proofHeading: 'Concrete Capabilities',
  proofBullets: [
    'Captures intake demographics, history, symptoms, assessments, and raw Q&A from SimplePractice intake material.',
    'Runs a structured diagnostic workspace with pinned diagnoses, criterion review, clinician notes, and rule-outs.',
    'Builds editable SOAP drafts from session notes, transcript context, treatment-plan data, and diagnostic impressions.',
    'Uses bundled clinical-knowledge resources to suggest formulation, interventions, referrals, and next steps.',
  ],
  architectureHeading: 'Privacy + Architecture',
  architectureBullets: [
    'Manifest V3 extension with DOM-based extraction and fill. The MVP does not depend on a vendor API.',
    'The active workflow is local-first. The current extension defaults to local Ollama for SOAP generation, with clinician review before fill.',
    'This lab page is a demo only. It does not connect to SimplePractice, store PHI, or call any model endpoint.',
  ],
  researchHeading: 'Why This Matters',
  researchCards: [
    {
      title: 'Price creep, same core jobs',
      body:
        'The research folder shows repeated therapist frustration with SimplePractice price increases and feature gating. The demo positions this tool as workflow relief, not another monetized add-on.',
    },
    {
      title: 'Reliability still matters during sessions',
      body:
        'Complaints about telehealth issues, freezing, and chart friction point to the same core demand: notes and chart access have to stay dependable while the session is happening.',
    },
    {
      title: 'Clinicians want time back, not feature sprawl',
      body:
        'The most useful pitch is not “more AI.” It is faster documentation, cleaner treatment planning, and a better review surface before anything reaches the clinical record.',
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
        'More live testing against current SimplePractice DOM patterns and appointment flows.',
        'Better caption mapping during active video sessions for transcript capture.',
        'Additional diagnostic coverage packs after the core workflow is stable.',
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
    'A browser-side intake automation flow that captures referral data from ZocDoc and fills SimplePractice demographics, insurance, appointments, and VOB email drafts without retyping.',
  categoryLabel: 'Psychologist Tools',
  statusLabel: 'Building',
  accent: 'emerald',
  tags: ['Chrome Extension', 'No Backend', 'Intake Automation', 'Insurance Fill', 'VOB Email'],
  audience:
    'Therapists and practice staff moving new patient referrals from ZocDoc into SimplePractice.',
  whyItExists:
    'The administrative cost of a single referral is higher than it looks. The tool exists to eliminate double entry, reduce insurance intake friction, and keep front-desk work inside the browser.',
  heroFacts: [
    {
      label: 'Workflow Surface',
      value: 'ZocDoc provider portal capture plus SimplePractice client, insurance, and appointment forms.',
    },
    {
      label: 'Automation Style',
      value: 'Browser-side capture and fill with popup settings, content scripts, and timed cleanup. No backend required.',
    },
    {
      label: 'Lab Demo',
      value: 'Mock referral data only. No live ZocDoc, Gmail, or SimplePractice connection exists on this page.',
    },
  ],
  workflowHeading: 'Interactive Demo',
  workflowIntro:
    'The current extension already covers the full intake handoff: capture from the ZocDoc provider portal, fill the SimplePractice client record, set insurance, create the appointment, and draft the VOB email. The walkthrough below mirrors that sequence with a demo referral.',
  steps: [
    {
      id: 'zocdoc-capture',
      label: 'ZocDoc Capture',
      title: 'Capture the referral once from the provider portal',
      summary:
        'The capture step pulls patient demographics, appointment timing, insurance details, presenting concerns, and card images into a single browser-side client object.',
      bullets: [
        'The extension targets the real ZocDoc provider portal detail view rather than a copy-pasted spreadsheet workflow.',
        'Insurance card images, appointment context, and basic presenting concerns are captured at the same time.',
        'The captured payload becomes the source of truth for every later step in SimplePractice.',
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
      title: 'Populate the SimplePractice client record without typing it twice',
      summary:
        'The demographic fill step targets the real SimplePractice form structure, including billing type, status, office, referred-by, and reminder toggles.',
      bullets: [
        'The form filler uses DOM selectors and SPA-friendly input events so Ember-driven form state updates correctly.',
        'Office selection, referred-by mapping, and reminder toggles are part of the workflow, not afterthoughts.',
        'The same captured client payload keeps all downstream steps consistent.',
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
      title: 'Carry the carrier, member data, and card images into the billing screen',
      summary:
        'The insurance step handles payer typeahead, member identifiers, subscriber fields, copay, and card upload from the previously captured referral object.',
      bullets: [
        'The workflow is built for the actual SimplePractice insurance form, including payer search and file upload behavior.',
        'Insurance-card capture matters because it removes another staff handoff.',
        'This is where the value becomes obvious: the patient already typed this once.',
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
      title: 'Set the evaluation appointment with office and CPT defaults already applied',
      summary:
        'The appointment step fills date, time, office, CPT code, notes, and recurring follow-up setup from stored provider preferences and captured referral data.',
      bullets: [
        'Provider preferences control the default office and CPT values for first visits and follow-ups.',
        'Recurring appointment setup is part of the flow, not a separate manual cleanup step.',
        'Client search, scheduling, and visit note context all stay tied to the captured client.',
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
      title: 'Generate the VOB email draft from the same intake object',
      summary:
        'Once capture is complete, the extension can draft a benefits-verification email with the correct client abbreviations, timing, carrier details, and saved recipient lists.',
      bullets: [
        'The VOB draft keeps the staff workflow inside the browser instead of relying on a separate intake checklist.',
        'Provider preferences carry the default recipients, CCs, and signature block.',
        'The email step is generated from captured data rather than re-keyed from the patient chart.',
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
      label: 'PHI Cleanup',
      title: 'Keep the intake in browser storage only, then clear it on a timer',
      summary:
        'The background service worker enforces timed cleanup so referral PHI does not sit around indefinitely after the handoff is done.',
      bullets: [
        'The current service worker uses a one-hour TTL plus an hourly cleanup alarm.',
        'Status flags make it clear which handoff steps are done and which still need staff action.',
        'The lab demo shows the behavior with mock data only; it does not store anything in the visitor’s browser.',
      ],
      blocks: [
        {
          type: 'metrics',
          items: [
            { label: 'Storage posture', value: 'Browser only' },
            { label: 'TTL', value: '1 hour', tone: 'amber' },
            { label: 'Cleanup trigger', value: 'Hourly alarm' },
            { label: 'Backend', value: 'None', tone: 'emerald' },
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
  proofHeading: 'Concrete Capabilities',
  proofBullets: [
    'Captures patient demographics, appointment timing, insurance details, presenting concerns, and card images from the ZocDoc provider portal.',
    'Fills SimplePractice client demographics, insurance, appointment data, office defaults, referred-by, and reminders through DOM automation.',
    'Builds a VOB email draft from stored provider preferences and captured intake details.',
    'Uses a background service worker plus timed cleanup so captured referral PHI is not left sitting in storage indefinitely.',
  ],
  architectureHeading: 'Privacy + Architecture',
  architectureBullets: [
    'Manifest V3 extension with two content scripts, popup settings, and a background service worker.',
    'The handoff is browser-side and DOM-based. No backend or SimplePractice API integration is required for the current flow.',
    'This lab page is a demo only. It does not connect to ZocDoc, Gmail, or SimplePractice, and it does not persist patient data.',
  ],
  researchHeading: 'Why This Matters',
  researchCards: [
    {
      title: 'Per-booking economics are brutal',
      body:
        'The competitive-pain-points research shows why a bad referral workflow stings: therapists are paying ZocDoc per booking, even when referrals no-show or never convert into ongoing care.',
    },
    {
      title: 'Booking is not matching',
      body:
        'The research also shows the gap between a generic booking layer and a mental-health intake flow. Providers still need the patient properly entered, scheduled, and contextualized in the EHR.',
    },
    {
      title: 'Insurance mismatch creates double work',
      body:
        'When directory insurance data is wrong, staff still have to correct the intake by hand. This tool is aimed at shrinking that correction loop once the referral lands.',
    },
  ],
  statusHeading: 'Current Status',
  statusColumns: [
    {
      title: 'Built Now',
      items: [
        'ZocDoc capture for demographics, appointment details, presenting concerns, and insurance-card images.',
        'SimplePractice client-demographics fill, insurance fill, appointment fill, and VOB email draft.',
        'Popup settings for provider defaults and timed PHI cleanup in the background worker.',
      ],
    },
    {
      title: 'Planned Next',
      items: [
        'More testing against the live ZocDoc provider portal and current SimplePractice DOM.',
        'Verification of payer typeahead matching, insurance-card fallback capture, and recurring appointment behavior.',
        'Mapping any missing selectors discovered during real portal testing.',
      ],
    },
  ],
  note:
    'Demo only. This page uses a mock referral object shaped after the extension types and current implementation notes. No live patient data or third-party account access is involved.',
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
