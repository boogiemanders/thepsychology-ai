import {
  DSM5CriterionDefinition,
  DSM5DisorderDefinition,
  IntakeEvidenceField,
} from '../lib/types'

const NARRATIVE_FIELDS: IntakeEvidenceField[] = [
  'chiefComplaint',
  'presentingProblems',
  'historyOfPresentIllness',
  'recentSymptoms',
  'additionalSymptoms',
  'additionalInfo',
  'manualNotes',
  'rawQA',
]

const TRAUMA_FIELDS: IntakeEvidenceField[] = [
  ...NARRATIVE_FIELDS,
  'physicalSexualAbuseHistory',
  'domesticViolenceHistory',
]

const SUBSTANCE_FIELDS: IntakeEvidenceField[] = [
  'alcoholUse',
  'drugUse',
  'substanceUseHistory',
  'additionalInfo',
  'rawQA',
]

const FAMILY_AND_HISTORY_FIELDS: IntakeEvidenceField[] = [
  'familyPsychiatricHistory',
  'familyMentalEmotionalHistory',
  'priorTreatment',
  'psychiatricHospitalization',
  'additionalInfo',
  'rawQA',
]

const SOCIAL_FIELDS: IntakeEvidenceField[] = [
  'relationshipDescription',
  'livingArrangement',
  'maritalStatus',
  'additionalInfo',
  'rawQA',
]

type CriterionOptions = {
  number?: number
  intakeFields?: IntakeEvidenceField[]
  keywords?: string[]
  phqItem?: number
  gadItem?: number
}

function criterion(
  id: string,
  letter: string,
  text: string,
  followUpQuestion: string,
  options: CriterionOptions = {}
): DSM5CriterionDefinition {
  return {
    id,
    letter,
    number: options.number,
    text,
    followUpQuestion,
    intakeFields: options.intakeFields ?? NARRATIVE_FIELDS,
    keywords: options.keywords,
    phqItem: options.phqItem,
    gadItem: options.gadItem,
  }
}

export const DSM5_DISORDERS: DSM5DisorderDefinition[] = [
  {
    id: 'mdd',
    name: 'Major Depressive Disorder',
    chapter: 'Depressive Disorders',
    icd10Codes: ['F32.0', 'F32.1', 'F32.2', 'F32.3', 'F32.4', 'F32.5', 'F32.9', 'F33.0', 'F33.1', 'F33.2', 'F33.3', 'F33.9'],
    sourcePages: [308, 317],
    criteria: [
      criterion('mdd.A.1', 'A', 'Depressed mood most of the day, nearly every day.', 'Have they felt down, empty, or hopeless most days for at least two weeks?', {
        number: 1,
        phqItem: 2,
        keywords: ['depressed', 'sad', 'down', 'hopeless', 'empty'],
      }),
      criterion('mdd.A.2', 'A', 'Markedly diminished interest or pleasure in most activities.', 'Have they lost interest or pleasure in activities they usually enjoy?', {
        number: 2,
        phqItem: 1,
        keywords: ['anhedonia', 'loss of interest', 'nothing feels fun', 'no motivation', 'loss of enjoyment'],
      }),
      criterion('mdd.A.3', 'A', 'Significant appetite or weight change, or a clear decrease/increase in appetite.', 'Any meaningful appetite or weight change during the same period?', {
        number: 3,
        phqItem: 5,
        keywords: ['appetite', 'weight loss', 'weight gain', 'overeating', 'not eating'],
      }),
      criterion('mdd.A.4', 'A', 'Insomnia or hypersomnia nearly every day.', 'Has sleep changed substantially, including difficulty sleeping or sleeping too much?', {
        number: 4,
        phqItem: 3,
        keywords: ['insomnia', 'hypersomnia', 'sleeping too much', 'sleep disturbance'],
      }),
      criterion('mdd.A.5', 'A', 'Psychomotor agitation or retardation observable by others.', 'Has anyone noticed they are moving or speaking much faster or slower than usual?', {
        number: 5,
        phqItem: 8,
        keywords: ['psychomotor', 'slowed down', 'restless', 'agitated'],
      }),
      criterion('mdd.A.6', 'A', 'Fatigue or loss of energy nearly every day.', 'Have they been tired or low-energy most days during the episode?', {
        number: 6,
        phqItem: 4,
        keywords: ['fatigue', 'low energy', 'exhausted', 'tired all the time'],
      }),
      criterion('mdd.A.7', 'A', 'Feelings of worthlessness or excessive/inappropriate guilt.', 'Are guilt, shame, or worthlessness part of the presentation?', {
        number: 7,
        phqItem: 6,
        keywords: ['worthless', 'guilt', 'shame', 'failure'],
      }),
      criterion('mdd.A.8', 'A', 'Diminished ability to think, concentrate, or make decisions.', 'Have concentration or decision-making become noticeably harder?', {
        number: 8,
        phqItem: 7,
        keywords: ['concentration', 'can', ', ', ', '],
      }),
      criterion('mdd.A.9', 'A', 'Recurrent thoughts of death or suicidal ideation/behavior.', 'Have there been recurrent thoughts of death, suicidal thoughts, or suicidal behavior?', {
        number: 9,
        phqItem: 9,
        intakeFields: ['suicidalIdeation', 'suicideAttemptHistory', 'additionalInfo', 'rawQA'],
        keywords: ['suicidal', 'wish i were dead', 'thoughts of death', 'kill myself'],
      }),
      criterion('mdd.B', 'B', 'Symptoms cause clinically significant distress or impairment.', 'How much are the symptoms affecting work, school, relationships, or daily functioning?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
        keywords: ['can', ', ', ', ', ', ', ', '],
      }),
      criterion('mdd.C', 'C', 'Episode is not better explained by substances or another medical condition.', 'Could substances or a medical condition better account for the depressive symptoms?', {
        intakeFields: ['medicalHistory', 'alcoholUse', 'drugUse', 'substanceUseHistory', 'rawQA'],
      }),
      criterion('mdd.D', 'D', 'The episode is not better explained by a schizophrenia-spectrum or other psychotic disorder.', 'Are psychotic-spectrum symptoms or disorders a better explanation for this presentation?', {
        intakeFields: ['additionalSymptoms', 'additionalInfo', 'rawQA'],
      }),
      criterion('mdd.E', 'E', 'There has never been a manic or hypomanic episode.', 'Has there ever been a period of abnormally elevated mood, very low sleep, and unusually increased energy?', {
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['manic', 'hypomanic', 'euphoric', 'decreased need for sleep', 'grandiose'],
      }),
    ],
    requiredCounts: [
      { criterion: 'A', required: 5, total: 9, mustInclude: ['mdd.A.1', 'mdd.A.2'] },
    ],
    durationRequirement: 'Same 2-week period',
    exclusions: [
      'Not attributable to substances or another medical condition.',
      'Not better explained by a schizophrenia-spectrum or other psychotic disorder.',
      'No history of mania or hypomania.',
    ],
    specifierOptions: ['Single episode', 'Recurrent', 'Mild', 'Moderate', 'Severe', 'With anxious distress', 'In partial remission', 'In full remission'],
    ruleOuts: ['Bipolar I disorder', 'Bipolar II disorder', 'Persistent depressive disorder', 'Adjustment disorder'],
  },
  {
    id: 'persistent_depressive_disorder',
    name: 'Persistent Depressive Disorder',
    chapter: 'Depressive Disorders',
    icd10Codes: ['F34.1'],
    sourcePages: [319, 322],
    criteria: [
      criterion('pdd.A', 'A', 'Depressed mood for most of the day, more days than not, for at least 2 years (1 year in youth).', 'Has the low mood been present more days than not for at least two years?', {
        keywords: ['for years', 'for a long time', 'chronic depression', 'always down', 'most days'],
      }),
      criterion('pdd.B.1', 'B', 'Poor appetite or overeating.', 'Is appetite chronically low or elevated during the depressed periods?', {
        number: 1,
        keywords: ['poor appetite', 'overeating', 'not eating', 'eating too much'],
      }),
      criterion('pdd.B.2', 'B', 'Insomnia or hypersomnia.', 'Is chronic sleep disturbance part of the picture?', {
        number: 2,
        keywords: ['insomnia', 'hypersomnia', 'sleep disturbance'],
      }),
      criterion('pdd.B.3', 'B', 'Low energy or fatigue.', 'Has low energy been part of the chronic depressed state?', {
        number: 3,
        keywords: ['low energy', 'fatigue', 'exhausted'],
      }),
      criterion('pdd.B.4', 'B', 'Low self-esteem.', 'Do they describe persistently low self-worth or low self-esteem?', {
        number: 4,
        keywords: ['low self-esteem', 'worthless', 'not good enough'],
      }),
      criterion('pdd.B.5', 'B', 'Poor concentration or difficulty making decisions.', 'Is concentration or decision-making chronically impaired?', {
        number: 5,
        keywords: ['poor concentration', 'difficulty deciding', 'indecisive'],
      }),
      criterion('pdd.B.6', 'B', 'Feelings of hopelessness.', 'Is hopelessness a chronic feature?', {
        number: 6,
        keywords: ['hopeless', 'nothing will change'],
      }),
      criterion('pdd.C', 'C', 'Symptoms have not been absent for more than 2 months at a time during the disturbance.', 'Have there been any symptom-free stretches longer than two months?', {
        keywords: ['constant', 'never really lifts', 'always there'],
      }),
      criterion('pdd.D', 'D', 'Major depressive episode criteria may be continuously present for 2 years.', 'Have there also been stretches where the symptoms met full major depressive episode intensity?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('pdd.E', 'E', 'There has never been a manic or hypomanic episode, and cyclothymic disorder criteria have never been met.', 'Any history of mania, hypomania, or cycling periods of elevated mood?', {
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['manic', 'hypomanic', 'euphoric', 'decreased need for sleep'],
      }),
      criterion('pdd.F', 'F', 'The disturbance is not better explained by a schizophrenia-spectrum or other psychotic disorder.', 'Could a psychotic-spectrum condition better explain the chronic symptoms?', {
        intakeFields: ['additionalSymptoms', 'additionalInfo', 'rawQA'],
      }),
      criterion('pdd.G', 'G', 'The symptoms are not attributable to substances or another medical condition.', 'Could substances or a medical condition better account for the chronic mood symptoms?', {
        intakeFields: ['medicalHistory', 'alcoholUse', 'drugUse', 'substanceUseHistory', 'rawQA'],
      }),
      criterion('pdd.H', 'H', 'Symptoms cause clinically significant distress or impairment.', 'How much have the chronic symptoms affected daily functioning over time?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
    ],
    requiredCounts: [
      { criterion: 'B', required: 2, total: 6 },
    ],
    durationRequirement: 'At least 2 years in adults',
    exclusions: [
      'No history of mania or hypomania.',
      'Not attributable to substances or another medical condition.',
      'Not better explained by psychotic-spectrum disorders.',
    ],
    specifierOptions: ['With pure dysthymic syndrome', 'With persistent major depressive episode', 'With intermittent major depressive episodes', 'Early onset', 'Late onset'],
    ruleOuts: ['Major depressive disorder', 'Cyclothymic disorder', 'Bipolar II disorder'],
  },
  {
    id: 'gad',
    name: 'Generalized Anxiety Disorder',
    chapter: 'Anxiety Disorders',
    icd10Codes: ['F41.1'],
    sourcePages: [392, 395],
    criteria: [
      criterion('gad.A', 'A', 'Excessive anxiety and worry, occurring more days than not for at least 6 months, about multiple activities or events.', 'Has the worry been excessive and present more days than not for at least six months across several life areas?', {
        keywords: ['excessive worry', 'worry all the time', 'always anxious', 'constant worry'],
      }),
      criterion('gad.B', 'B', 'The person finds it difficult to control the worry.', 'Can they turn the worry off, or does it feel hard to control?', {
        gadItem: 2,
        keywords: ['can', ', ', ', '],
      }),
      criterion('gad.C.1', 'C', 'Restlessness or feeling keyed up/on edge.', 'Do they feel on edge, restless, or keyed up much of the time?', {
        number: 1,
        gadItem: 1,
        keywords: ['on edge', 'keyed up', 'restless'],
      }),
      criterion('gad.C.2', 'C', 'Being easily fatigued.', 'Do they become tired easily from the anxiety or worrying?', {
        number: 2,
        keywords: ['fatigued', 'tired', 'drained'],
      }),
      criterion('gad.C.3', 'C', 'Difficulty concentrating or mind going blank.', 'Does worry interfere with concentration or make the mind go blank?', {
        number: 3,
        keywords: ['concentration', 'mind going blank', 'can\u2019t focus'],
      }),
      criterion('gad.C.4', 'C', 'Irritability.', 'Has the person been more irritable because of the anxiety?', {
        number: 4,
        gadItem: 6, // GAD-7 item 6: "Becoming easily annoyed or irritable"
        keywords: ['irritable', 'snappy'],
      }),
      criterion('gad.C.5', 'C', 'Muscle tension.', 'Is muscle tension, tightness, or physical tension part of the anxiety?', {
        number: 5,
        keywords: ['muscle tension', 'tense', 'tight shoulders', 'tight jaw'],
      }),
      criterion('gad.C.6', 'C', 'Sleep disturbance.', 'Has the anxiety affected sleep?', {
        number: 6,
        keywords: ['sleep', 'can\u2019t sleep', 'trouble sleeping'],
      }),
      criterion('gad.D', 'D', 'Symptoms cause clinically significant distress or impairment.', 'How much does the anxiety interfere with daily responsibilities or relationships?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('gad.E', 'E', 'The disturbance is not attributable to substances or another medical condition.', 'Could substances, medication, or a medical condition better explain the anxiety?', {
        intakeFields: ['medicalHistory', 'alcoholUse', 'drugUse', 'substanceUseHistory', 'rawQA'],
      }),
      criterion('gad.F', 'F', 'The disturbance is not better explained by another mental disorder.', 'Is the worry better accounted for by panic, social anxiety, OCD, PTSD, or another disorder?', {
        intakeFields: ['chiefComplaint', 'presentingProblems', 'additionalSymptoms', 'rawQA'],
      }),
    ],
    requiredCounts: [
      { criterion: 'C', required: 3, total: 6 },
    ],
    durationRequirement: 'At least 6 months',
    exclusions: [
      'Not attributable to substances or another medical condition.',
      'Not better explained by another mental disorder.',
    ],
    specifierOptions: ['No formal DSM severity specifier', 'Consider anxious distress if depressive disorder is also present'],
    ruleOuts: ['Social anxiety disorder', 'Panic disorder', 'Obsessive-compulsive disorder', 'Posttraumatic stress disorder'],
  },
  {
    id: 'social_anxiety_disorder',
    name: 'Social Anxiety Disorder',
    chapter: 'Anxiety Disorders',
    icd10Codes: ['F40.10'],
    sourcePages: [366, 371],
    criteria: [
      criterion('social_anxiety.A', 'A', 'Marked fear or anxiety about one or more social situations involving possible scrutiny.', 'Which social situations trigger fear or anxiety, such as meeting people, being observed, or performing?', {
        keywords: ['social anxiety', 'people judging me', 'public speaking', 'meeting people', 'being watched'],
      }),
      criterion('social_anxiety.B', 'B', 'Fear of acting in a way or showing anxiety symptoms that will be negatively evaluated.', 'What do they fear will happen if they appear anxious in social settings?', {
        keywords: ['embarrassed', 'humiliated', 'judge me', 'negative evaluation'],
      }),
      criterion('social_anxiety.C', 'C', 'Social situations almost always provoke fear or anxiety.', 'Do the feared social situations consistently trigger anxiety?', {
        keywords: ['always happens', 'every time', 'nearly always'],
      }),
      criterion('social_anxiety.D', 'D', 'Social situations are avoided or endured with intense fear or anxiety.', 'Are the situations avoided, or endured with strong fear?', {
        keywords: ['avoid people', 'avoid social situations', 'endure', 'cancel plans'],
      }),
      criterion('social_anxiety.E', 'E', 'The fear or anxiety is out of proportion to the actual threat and sociocultural context.', 'Does the reaction seem clearly stronger than the actual social risk?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('social_anxiety.F', 'F', 'The fear, anxiety, or avoidance is persistent, typically lasting 6 months or more.', 'How long has the social fear or avoidance been going on?', {
        keywords: ['for years', 'for months', 'since school', 'longstanding'],
      }),
      criterion('social_anxiety.G', 'G', 'The fear, anxiety, or avoidance causes clinically significant distress or impairment.', 'How has the social anxiety affected work, school, friendships, or dating?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('social_anxiety.H', 'H', 'The symptoms are not attributable to substances or another medical condition.', 'Could substances or a medical condition better explain the social anxiety?', {
        intakeFields: ['medicalHistory', 'alcoholUse', 'drugUse', 'substanceUseHistory', 'rawQA'],
      }),
      criterion('social_anxiety.I', 'I', 'The fear, anxiety, or avoidance is not better explained by another mental disorder.', 'Could panic, body-image concerns, autism, or another disorder better explain the presentation?', {
        intakeFields: ['chiefComplaint', 'presentingProblems', 'additionalSymptoms', 'rawQA'],
      }),
      criterion('social_anxiety.J', 'J', 'If another medical condition is present, the social fear is clearly unrelated or excessive.', 'If there is a medical condition, is the social fear clearly excessive beyond that condition?', {
        intakeFields: ['medicalHistory', 'additionalInfo', 'rawQA'],
      }),
    ],
    requiredCounts: [],
    durationRequirement: 'Typically 6 months or more',
    exclusions: [
      'Not attributable to substances or another medical condition.',
      'Not better explained by another mental disorder.',
    ],
    specifierOptions: ['Performance only'],
    ruleOuts: ['Generalized anxiety disorder', 'Panic disorder', 'Body dysmorphic disorder', 'Autism spectrum disorder'],
  },
  {
    id: 'panic_disorder',
    name: 'Panic Disorder',
    chapter: 'Anxiety Disorders',
    icd10Codes: ['F41.0'],
    sourcePages: [373, 379],
    criteria: [
      criterion('panic.A.1', 'A', 'Palpitations, pounding heart, or accelerated heart rate during an abrupt surge of fear.', 'Do panic episodes include palpitations or a racing heart?', {
        number: 1,
        keywords: ['panic attack', 'heart racing', 'palpitations', 'pounding heart'],
      }),
      criterion('panic.A.2', 'A', 'Sweating.', 'Do panic episodes include sweating?', {
        number: 2,
        keywords: ['sweating', 'sweaty'],
      }),
      criterion('panic.A.3', 'A', 'Trembling or shaking.', 'Do panic episodes include shaking or trembling?', {
        number: 3,
        keywords: ['shaking', 'trembling', 'shaky'],
      }),
      criterion('panic.A.4', 'A', 'Shortness of breath or smothering sensations.', 'Do panic episodes include feeling short of breath or smothered?', {
        number: 4,
        keywords: ['shortness of breath', 'can', ', '],
      }),
      criterion('panic.A.5', 'A', 'Feelings of choking.', 'Do panic episodes include a choking sensation?', {
        number: 5,
        keywords: ['choking'],
      }),
      criterion('panic.A.6', 'A', 'Chest pain or discomfort.', 'Do panic episodes include chest pain or chest tightness?', {
        number: 6,
        keywords: ['chest pain', 'chest tightness'],
      }),
      criterion('panic.A.7', 'A', 'Nausea or abdominal distress.', 'Do panic episodes include nausea or stomach distress?', {
        number: 7,
        keywords: ['nausea', 'stomach distress', 'abdominal distress'],
      }),
      criterion('panic.A.8', 'A', 'Dizziness, unsteadiness, light-headedness, or faintness.', 'Do panic episodes include dizziness or lightheadedness?', {
        number: 8,
        keywords: ['dizzy', 'lightheaded', 'faint'],
      }),
      criterion('panic.A.9', 'A', 'Chills or heat sensations.', 'Do panic episodes include chills or hot flashes?', {
        number: 9,
        keywords: ['chills', 'hot flashes', 'heat sensation'],
      }),
      criterion('panic.A.10', 'A', 'Paresthesias.', 'Do panic episodes include numbness or tingling?', {
        number: 10,
        keywords: ['tingling', 'numbness', 'paresthesia'],
      }),
      criterion('panic.A.11', 'A', 'Derealization or depersonalization.', 'Do panic episodes include feeling unreal, detached, or outside oneself?', {
        number: 11,
        keywords: ['derealization', 'depersonalization', 'unreal', 'outside my body'],
      }),
      criterion('panic.A.12', 'A', 'Fear of losing control or going crazy.', 'During panic, do they fear losing control or going crazy?', {
        number: 12,
        keywords: ['losing control', 'going crazy'],
      }),
      criterion('panic.A.13', 'A', 'Fear of dying.', 'During panic, do they fear they might die?', {
        number: 13,
        keywords: ['fear of dying', 'thought i was dying'],
      }),
      criterion('panic.B.1', 'B', 'At least one attack has been followed by persistent concern or worry about additional attacks or their consequences.', 'After attacks, do they worry for at least a month about more attacks or their consequences?', {
        number: 1,
        keywords: ['worried about another panic attack', 'fear of another attack'],
      }),
      criterion('panic.B.2', 'B', 'At least one attack has been followed by a significant maladaptive change in behavior related to the attacks.', 'Have they changed behavior, routines, or places because of panic attacks?', {
        number: 2,
        keywords: ['avoid driving', 'avoid leaving home', 'changed behavior because of panic', 'avoid exercise because of panic'],
      }),
      criterion('panic.C', 'C', 'The disturbance is not attributable to substances or another medical condition.', 'Could substances or a medical condition better explain the panic symptoms?', {
        intakeFields: ['medicalHistory', 'alcoholUse', 'drugUse', 'substanceUseHistory', 'rawQA'],
      }),
      criterion('panic.D', 'D', 'The disturbance is not better explained by another mental disorder.', 'Could the panic be better explained by social anxiety, OCD, PTSD, or separation anxiety?', {
        intakeFields: ['chiefComplaint', 'presentingProblems', 'additionalSymptoms', 'rawQA'],
      }),
    ],
    requiredCounts: [
      { criterion: 'A', required: 4, total: 13 },
      { criterion: 'B', required: 1, total: 2 },
    ],
    durationRequirement: 'At least 1 month of concern or behavior change after an attack',
    exclusions: [
      'Not attributable to substances or another medical condition.',
      'Not better explained by another mental disorder.',
    ],
    specifierOptions: ['No formal DSM specifier'],
    ruleOuts: ['Panic attacks as a specifier in other disorders', 'Social anxiety disorder', 'Posttraumatic stress disorder'],
  },
  {
    id: 'ptsd',
    name: 'Posttraumatic Stress Disorder',
    chapter: 'Trauma- and Stressor-Related Disorders',
    icd10Codes: ['F43.10'],
    sourcePages: [454, 467],
    criteria: [
      criterion('ptsd.A', 'A', 'Exposure to actual or threatened death, serious injury, or sexual violence.', 'What trauma exposure occurred: direct experience, witnessing, learning it happened to a close other, or repeated exposure to details?', {
        intakeFields: TRAUMA_FIELDS,
        keywords: ['trauma', 'abuse', 'assault', 'violence', 'accident', 'witnessed', 'sexual assault'],
      }),
      criterion('ptsd.B.1', 'B', 'Recurrent, involuntary, intrusive memories.', 'Are there intrusive memories of the traumatic event?', {
        number: 1,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['intrusive memories', 'can', ', '],
      }),
      criterion('ptsd.B.2', 'B', 'Recurrent distressing dreams related to the trauma.', 'Are there trauma-related nightmares or distressing dreams?', {
        number: 2,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['nightmares', 'trauma dreams', 'distressing dreams'],
      }),
      criterion('ptsd.B.3', 'B', 'Dissociative reactions such as flashbacks.', 'Are there flashbacks or moments of feeling back in the traumatic event?', {
        number: 3,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['flashback', 'felt like it was happening again'],
      }),
      criterion('ptsd.B.4', 'B', 'Intense psychological distress at reminders.', 'Do reminders of the event trigger intense emotional distress?', {
        number: 4,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['triggered', 'distress at reminders', 'reminders upset'],
      }),
      criterion('ptsd.B.5', 'B', 'Marked physiological reactions to reminders.', 'Do reminders trigger a strong physical reaction?', {
        number: 5,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['physically reacts', 'heart racing at reminders', 'panic at reminders'],
      }),
      criterion('ptsd.C.1', 'C', 'Avoidance of trauma-related thoughts, feelings, or memories.', 'Are thoughts, memories, or feelings about the trauma avoided?', {
        number: 1,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['avoid thinking about it', 'push it away'],
      }),
      criterion('ptsd.C.2', 'C', 'Avoidance of external reminders.', 'Are people, places, conversations, or activities avoided because they remind the person of the trauma?', {
        number: 2,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['avoid reminders', 'avoid places', 'avoid people'],
      }),
      criterion('ptsd.D.1', 'D', 'Inability to remember an important aspect of the trauma.', 'Is there trauma-related amnesia or fragmented recall?', {
        number: 1,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['can', ', ', ', '],
      }),
      criterion('ptsd.D.2', 'D', 'Persistent exaggerated negative beliefs or expectations.', 'Are there enduring negative beliefs about self, others, or the world since the trauma?', {
        number: 2,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['can', ', ', ', '],
      }),
      criterion('ptsd.D.3', 'D', 'Persistent distorted blame of self or others.', 'Is there persistent self-blame or blame of others related to the trauma?', {
        number: 3,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['my fault', 'blame myself', 'blame them'],
      }),
      criterion('ptsd.D.4', 'D', 'Persistent negative emotional state.', 'Is there chronic fear, horror, anger, guilt, or shame related to the trauma?', {
        number: 4,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['fear', 'horror', 'shame', 'guilt', 'anger'],
      }),
      criterion('ptsd.D.5', 'D', 'Markedly diminished interest or participation in activities.', 'Has the person withdrawn from activities since the trauma?', {
        number: 5,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['withdrawn', 'not interested anymore', 'stopped doing things'],
      }),
      criterion('ptsd.D.6', 'D', 'Feelings of detachment or estrangement from others.', 'Do they feel detached, numb, or cut off from other people?', {
        number: 6,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['detached', 'estranged', 'cut off from others', 'numb'],
      }),
      criterion('ptsd.D.7', 'D', 'Persistent inability to experience positive emotions.', 'Is there difficulty feeling positive emotions such as happiness or love?', {
        number: 7,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['can', ', ', ', '],
      }),
      criterion('ptsd.E.1', 'E', 'Irritable behavior or angry outbursts.', 'Have there been angry outbursts or increased irritability since the trauma?', {
        number: 1,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['irritable', 'angry outbursts', 'rage'],
      }),
      criterion('ptsd.E.2', 'E', 'Reckless or self-destructive behavior.', 'Has there been reckless or self-destructive behavior since the trauma?', {
        number: 2,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['reckless', 'self-destructive', 'dangerous behavior'],
      }),
      criterion('ptsd.E.3', 'E', 'Hypervigilance.', 'Is there hypervigilance or constant scanning for danger?', {
        number: 3,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['hypervigilant', 'always on guard', 'scan the room'],
      }),
      criterion('ptsd.E.4', 'E', 'Exaggerated startle response.', 'Is there an exaggerated startle response?', {
        number: 4,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['startle', 'jumpy'],
      }),
      criterion('ptsd.E.5', 'E', 'Problems with concentration.', 'Has concentration worsened since the trauma?', {
        number: 5,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['concentration', 'can'],
      }),
      criterion('ptsd.E.6', 'E', 'Sleep disturbance.', 'Has trauma-related distress affected sleep?', {
        number: 6,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['sleep disturbance', 'can', ', ', ', '],
      }),
      criterion('ptsd.F', 'F', 'Duration is more than 1 month.', 'How long have the trauma symptoms been present?', {
        intakeFields: TRAUMA_FIELDS,
      }),
      criterion('ptsd.G', 'G', 'Symptoms cause clinically significant distress or impairment.', 'How much have the trauma symptoms affected work, relationships, or daily functioning?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('ptsd.H', 'H', 'Symptoms are not attributable to substances or another medical condition.', 'Could substances or a medical condition better explain the trauma-related symptoms?', {
        intakeFields: ['medicalHistory', 'alcoholUse', 'drugUse', 'substanceUseHistory', 'rawQA'],
      }),
    ],
    requiredCounts: [
      { criterion: 'B', required: 1, total: 5 },
      { criterion: 'C', required: 1, total: 2 },
      { criterion: 'D', required: 2, total: 7 },
      { criterion: 'E', required: 2, total: 6 },
    ],
    durationRequirement: 'More than 1 month',
    exclusions: [
      'Symptoms are not attributable to substances or another medical condition.',
    ],
    specifierOptions: ['With dissociative symptoms', 'With delayed expression'],
    ruleOuts: ['Acute stress disorder', 'Adjustment disorder', 'Panic disorder', 'Major depressive disorder'],
  },
  {
    id: 'acute_stress_disorder',
    name: 'Acute Stress Disorder',
    chapter: 'Trauma- and Stressor-Related Disorders',
    icd10Codes: ['F43.0'],
    sourcePages: [469, 475],
    criteria: [
      criterion('acute_stress.A', 'A', 'Exposure to actual or threatened death, serious injury, or sexual violation.', 'What acute trauma exposure occurred?', {
        intakeFields: TRAUMA_FIELDS,
        keywords: ['trauma', 'abuse', 'assault', 'violence', 'accident'],
      }),
      criterion('acute_stress.B.1', 'B', 'Recurrent, involuntary, and intrusive memories.', 'Have there been intrusive memories since the event?', {
        number: 1,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['intrusive memories', 'flashback'],
      }),
      criterion('acute_stress.B.2', 'B', 'Recurrent distressing dreams.', 'Have there been trauma-related dreams since the event?', {
        number: 2,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['nightmares', 'distressing dreams'],
      }),
      criterion('acute_stress.B.3', 'B', 'Dissociative reactions such as flashbacks.', 'Any flashbacks or feeling as if the event is happening again?', {
        number: 3,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['flashback', 'happening again'],
      }),
      criterion('acute_stress.B.4', 'B', 'Intense or prolonged distress at reminders.', 'Do reminders trigger strong emotional distress?', {
        number: 4,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['triggered', 'distress at reminders'],
      }),
      criterion('acute_stress.B.5', 'B', 'Marked physiological reactions to reminders.', 'Do reminders trigger strong physical reactions?', {
        number: 5,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['physical reaction', 'heart racing at reminders'],
      }),
      criterion('acute_stress.B.6', 'B', 'Persistent inability to experience positive emotions.', 'Since the event, is it hard to feel positive emotions?', {
        number: 6,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['numb', 'can'],
      }),
      criterion('acute_stress.B.7', 'B', 'Altered sense of reality.', 'Have there been episodes of feeling dazed, detached, or in a fog?', {
        number: 7,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['dazed', 'detached', 'foggy', 'unreal'],
      }),
      criterion('acute_stress.B.8', 'B', 'Inability to remember an important aspect of the trauma.', 'Is there trauma-related amnesia?', {
        number: 8,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['can', ', '],
      }),
      criterion('acute_stress.B.9', 'B', 'Avoidance of distressing memories, thoughts, or feelings.', 'Are trauma-related thoughts or feelings being avoided?', {
        number: 9,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['avoid thinking about it', 'push it away'],
      }),
      criterion('acute_stress.B.10', 'B', 'Avoidance of external reminders.', 'Are reminders or places associated with the trauma being avoided?', {
        number: 10,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['avoid reminders', 'avoid places'],
      }),
      criterion('acute_stress.B.11', 'B', 'Sleep disturbance.', 'Has sleep worsened since the event?', {
        number: 11,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['sleep disturbance', 'insomnia', 'nightmares'],
      }),
      criterion('acute_stress.B.12', 'B', 'Irritable behavior or angry outbursts.', 'Is there increased irritability or anger since the event?', {
        number: 12,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['irritable', 'angry outbursts'],
      }),
      criterion('acute_stress.B.13', 'B', 'Hypervigilance.', 'Is there hypervigilance since the event?', {
        number: 13,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['hypervigilant', 'on guard'],
      }),
      criterion('acute_stress.B.14', 'B', 'Problems with concentration or exaggerated startle.', 'Have concentration problems or a strong startle response emerged since the event?', {
        number: 14,
        intakeFields: TRAUMA_FIELDS,
        keywords: ['concentration', 'startle', 'jumpy'],
      }),
      criterion('acute_stress.C', 'C', 'Duration is 3 days to 1 month after trauma exposure.', 'Did the symptom cluster begin after the event and stay within the 3-day to 1-month window?', {
        intakeFields: TRAUMA_FIELDS,
      }),
      criterion('acute_stress.D', 'D', 'Symptoms cause clinically significant distress or impairment.', 'How much have the acute trauma symptoms impaired day-to-day functioning?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('acute_stress.E', 'E', 'The disturbance is not attributable to substances, another medical condition, or a brief psychotic disorder.', 'Could substances, a medical condition, or brief psychosis better explain the acute symptoms?', {
        intakeFields: ['medicalHistory', 'alcoholUse', 'drugUse', 'substanceUseHistory', 'rawQA'],
      }),
    ],
    requiredCounts: [
      { criterion: 'B', required: 9, total: 14 },
    ],
    durationRequirement: '3 days to 1 month after trauma',
    exclusions: [
      'Not attributable to substances or another medical condition.',
      'Not better explained by brief psychotic disorder.',
    ],
    specifierOptions: ['No formal DSM specifier'],
    ruleOuts: ['Posttraumatic stress disorder', 'Adjustment disorder', 'Brief psychotic disorder'],
  },
  {
    id: 'adjustment_disorder',
    name: 'Adjustment Disorder',
    chapter: 'Trauma- and Stressor-Related Disorders',
    icd10Codes: ['F43.20', 'F43.22', 'F43.23', 'F43.24', 'F43.25', 'F43.8'],
    sourcePages: [476, 479],
    criteria: [
      criterion('adjustment.A', 'A', 'Emotional or behavioral symptoms develop in response to an identifiable stressor within 3 months of its onset.', 'What stressor preceded the symptoms, and when did it begin?', {
        keywords: ['breakup', 'divorce', 'job loss', 'recent loss', 'stress at work', 'moved', 'financial stress', 'caregiver stress'],
      }),
      criterion('adjustment.B.1', 'B', 'Distress is out of proportion to the severity or intensity of the stressor.', 'Does the reaction seem clearly more intense than would normally be expected for the stressor?', {
        number: 1,
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('adjustment.B.2', 'B', 'Symptoms cause significant impairment in social, occupational, or other important areas.', 'How much is the stress response affecting functioning?', {
        number: 2,
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('adjustment.C', 'C', 'The disturbance does not meet criteria for another mental disorder and is not merely an exacerbation of a preexisting condition.', 'Do the symptoms fit another disorder more fully than adjustment disorder?', {
        intakeFields: ['chiefComplaint', 'presentingProblems', 'historyOfPresentIllness', 'additionalSymptoms', 'rawQA'],
      }),
      criterion('adjustment.D', 'D', 'Symptoms do not represent normal bereavement and are not better explained by prolonged grief disorder.', 'Is this better understood as normative grief or prolonged grief rather than adjustment disorder?', {
        intakeFields: ['chiefComplaint', 'presentingProblems', 'additionalInfo', 'rawQA'],
      }),
      criterion('adjustment.E', 'E', 'Once the stressor or its consequences end, symptoms do not persist for more than 6 additional months.', 'If the stressor has resolved, did symptoms continue beyond six months?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
    ],
    requiredCounts: [
      { criterion: 'B', required: 1, total: 2 },
    ],
    durationRequirement: 'Begins within 3 months of the stressor',
    exclusions: [
      'Does not better meet another mental disorder.',
      'Not better explained by normative bereavement or prolonged grief disorder.',
    ],
    specifierOptions: ['With depressed mood', 'With anxiety', 'With mixed anxiety and depressed mood', 'With disturbance of conduct', 'With mixed disturbance of emotions and conduct', 'Unspecified'],
    ruleOuts: ['Major depressive disorder', 'Generalized anxiety disorder', 'Posttraumatic stress disorder', 'Prolonged grief disorder'],
  },
  {
    id: 'ocd',
    name: 'Obsessive-Compulsive Disorder',
    chapter: 'Obsessive-Compulsive and Related Disorders',
    icd10Codes: ['F42.2', 'F42.8', 'F42.9'],
    sourcePages: [409, 414],
    criteria: [
      criterion('ocd.A.1', 'A', 'Obsessions are recurrent and persistent thoughts, urges, or images that are intrusive and unwanted.', 'Are there intrusive thoughts, urges, or images that feel unwanted and hard to dismiss?', {
        number: 1,
        keywords: ['obsession', 'intrusive thoughts', 'unwanted thoughts', 'mental images'],
      }),
      criterion('ocd.A.2', 'A', 'The person tries to ignore, suppress, or neutralize obsessions.', 'Do they try to suppress, neutralize, or counteract the intrusive thoughts?', {
        number: 2,
        keywords: ['suppress', 'neutralize', 'cancel it out', 'mental ritual'],
      }),
      criterion('ocd.A.3', 'A', 'Compulsions are repetitive behaviors or mental acts driven by obsessions or rigid rules.', 'Are there repetitive behaviors or mental rituals performed to reduce anxiety or prevent harm?', {
        number: 3,
        keywords: ['compulsion', 'ritual', 'checking', 'washing', 'counting', 'mental ritual'],
      }),
      criterion('ocd.A.4', 'A', 'The compulsions are aimed at reducing anxiety or preventing a feared event, but are excessive or not realistically connected.', 'Do the rituals feel excessive or not realistically connected to what they are trying to prevent?', {
        number: 4,
        keywords: ['excessive checking', 'reassurance seeking', 'not rational but i still do it'],
      }),
      criterion('ocd.B', 'B', 'Obsessions or compulsions are time-consuming or cause significant distress or impairment.', 'How much time do the obsessions or compulsions take, and how disruptive are they?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('ocd.C', 'C', 'The symptoms are not attributable to substances or another medical condition.', 'Could substances or a medical condition better explain the obsessional symptoms?', {
        intakeFields: ['medicalHistory', 'alcoholUse', 'drugUse', 'substanceUseHistory', 'rawQA'],
      }),
      criterion('ocd.D', 'D', 'The disturbance is not better explained by another mental disorder.', 'Could the symptoms be better explained by GAD, eating disorder concerns, illness anxiety, or another disorder?', {
        intakeFields: ['chiefComplaint', 'presentingProblems', 'additionalSymptoms', 'rawQA'],
      }),
    ],
    requiredCounts: [
      { criterion: 'A', required: 1, total: 4 },
    ],
    exclusions: [
      'Not attributable to substances or another medical condition.',
      'Not better explained by another mental disorder.',
    ],
    specifierOptions: ['With good or fair insight', 'With poor insight', 'With absent insight/delusional beliefs', 'Tic-related'],
    ruleOuts: ['Generalized anxiety disorder', 'Eating disorders', 'Illness anxiety disorder', 'Body dysmorphic disorder'],
  },
  {
    id: 'adhd',
    name: 'Attention-Deficit/Hyperactivity Disorder',
    chapter: 'Neurodevelopmental Disorders',
    icd10Codes: ['F90.0', 'F90.1', 'F90.2'],
    sourcePages: [167, 172],
    criteria: [
      criterion('adhd.A1.1', 'A1', 'Often fails to give close attention to details or makes careless mistakes.', 'Are there repeated careless mistakes or missed details?', {
        number: 1,
        keywords: ['careless mistakes', 'misses details'],
      }),
      criterion('adhd.A1.2', 'A1', 'Often has difficulty sustaining attention.', 'Is sustained attention difficult in work, school, or conversations?', {
        number: 2,
        keywords: ['difficulty paying attention', 'can', ', '],
      }),
      criterion('adhd.A1.3', 'A1', 'Often does not seem to listen when spoken to directly.', 'Do others report that the person seems not to listen?', {
        number: 3,
        keywords: ['doesn', ', '],
      }),
      criterion('adhd.A1.4', 'A1', 'Often does not follow through on instructions and fails to finish tasks.', 'Do they start tasks and fail to finish them?', {
        number: 4,
        keywords: ['doesn', ', '],
      }),
      criterion('adhd.A1.5', 'A1', 'Often has difficulty organizing tasks and activities.', 'Are organizing tasks, time, or materials persistent problems?', {
        number: 5,
        keywords: ['disorganized', 'poor time management', 'messy'],
      }),
      criterion('adhd.A1.6', 'A1', 'Often avoids or dislikes tasks requiring sustained mental effort.', 'Do they avoid tasks that require sustained concentration?', {
        number: 6,
        keywords: ['avoid paperwork', 'avoid sustained effort', 'procrastinate'],
      }),
      criterion('adhd.A1.7', 'A1', 'Often loses things necessary for tasks or activities.', 'Is misplacing essential items a frequent problem?', {
        number: 7,
        keywords: ['loses things', 'misplaces'],
      }),
      criterion('adhd.A1.8', 'A1', 'Is often easily distracted by extraneous stimuli.', 'Are they easily distracted by noise, thoughts, or other stimuli?', {
        number: 8,
        keywords: ['easily distracted', 'distracted by everything'],
      }),
      criterion('adhd.A1.9', 'A1', 'Is often forgetful in daily activities.', 'Is day-to-day forgetfulness persistent and impairing?', {
        number: 9,
        keywords: ['forgetful', 'forgets appointments', 'forgets tasks'],
      }),
      criterion('adhd.A2.1', 'A2', 'Often fidgets or taps hands/feet or squirms in seat.', 'Is there noticeable fidgeting or restlessness?', {
        number: 1,
        keywords: ['fidget', 'restless', 'can'],
      }),
      criterion('adhd.A2.2', 'A2', 'Often leaves seat when remaining seated is expected.', 'Do they have trouble staying seated when expected?', {
        number: 2,
        keywords: ['gets up', 'leaves seat'],
      }),
      criterion('adhd.A2.3', 'A2', 'Often runs about, climbs, or feels restless.', 'Is there frequent physical restlessness or driven activity?', {
        number: 3,
        keywords: ['runs around', 'restless', 'driven by a motor'],
      }),
      criterion('adhd.A2.4', 'A2', 'Often unable to play or engage quietly.', 'Is quiet leisure difficult?', {
        number: 4,
        keywords: ['can', ', ', 't do quiet activities'],
      }),
      criterion('adhd.A2.5', 'A2', 'Is often on the go or acts as if driven by a motor.', 'Do others describe them as always on the go?', {
        number: 5,
        keywords: ['on the go', 'driven by a motor'],
      }),
      criterion('adhd.A2.6', 'A2', 'Often talks excessively.', 'Is excessive talking part of the presentation?', {
        number: 6,
        keywords: ['talks excessively', 'talks nonstop'],
      }),
      criterion('adhd.A2.7', 'A2', 'Often blurts out answers before questions are completed.', 'Do they impulsively blurt out answers or interrupt?', {
        number: 7,
        keywords: ['blurts out', 'answers before'],
      }),
      criterion('adhd.A2.8', 'A2', 'Often has difficulty waiting their turn.', 'Is waiting their turn unusually hard?', {
        number: 8,
        keywords: ['can', ', '],
      }),
      criterion('adhd.A2.9', 'A2', 'Often interrupts or intrudes on others.', 'Do they interrupt or intrude on other people regularly?', {
        number: 9,
        keywords: ['interrupts', 'intrudes'],
      }),
      criterion('adhd.B', 'B', 'Several symptoms were present before age 12 years.', 'Were multiple symptoms already present in childhood?', {
        intakeFields: ['developmentalHistory', 'education', 'additionalInfo', 'rawQA'],
        keywords: ['since childhood', 'as a kid', 'elementary school'],
      }),
      criterion('adhd.C', 'C', 'Several symptoms are present in two or more settings.', 'Do the attention or hyperactivity symptoms show up in more than one setting?', {
        intakeFields: ['education', 'occupation', 'relationshipDescription', 'additionalInfo', 'rawQA'],
      }),
      criterion('adhd.D', 'D', 'There is clear evidence that the symptoms interfere with social, academic, or occupational functioning.', 'How do the symptoms impair school, work, home, or relationships?', {
        intakeFields: ['education', 'occupation', 'historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
      criterion('adhd.E', 'E', 'The symptoms are not better explained by another mental disorder.', 'Could anxiety, trauma, depression, or another condition better explain the attention symptoms?', {
        intakeFields: ['chiefComplaint', 'presentingProblems', 'additionalSymptoms', 'rawQA'],
      }),
    ],
    requiredCounts: [
      { criterion: 'A1', required: 6, total: 9 },
      { criterion: 'A2', required: 6, total: 9 },
    ],
    requiredCountAdjustments: [
      {
        minAge: 17,
        note: 'For adolescents age 17 and older and adults, five symptoms are required in either domain.',
        requiredCounts: [
          { criterion: 'A1', required: 5, total: 9 },
          { criterion: 'A2', required: 5, total: 9 },
        ],
      },
    ],
    durationRequirement: 'At least 6 months',
    exclusions: [
      'Symptoms present before age 12.',
      'Symptoms present in at least two settings.',
      'Not better explained by another mental disorder.',
    ],
    specifierOptions: ['Combined presentation', 'Predominantly inattentive presentation', 'Predominantly hyperactive/impulsive presentation', 'Mild', 'Moderate', 'Severe'],
    ruleOuts: ['Anxiety disorders', 'Trauma-related disorders', 'Depressive disorders', 'Substance use disorders'],
  },
  {
    id: 'bipolar_i',
    name: 'Bipolar I Disorder',
    chapter: 'Bipolar and Related Disorders',
    icd10Codes: ['F31.0', 'F31.1', 'F31.2', 'F31.3', 'F31.4', 'F31.5', 'F31.6', 'F31.7', 'F31.9'],
    sourcePages: [254, 265],
    criteria: [
      criterion('bipolar_i.A', 'A', 'A distinct period of abnormally elevated, expansive, or irritable mood and increased energy/activity lasting at least 1 week or any duration if hospitalization is necessary.', 'Has there ever been a distinct period of unusually elevated or irritable mood with much more energy, lasting a week or requiring hospitalization?', {
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['manic', 'euphoric', 'high energy', 'barely slept', 'hospitalized for mania'],
      }),
      criterion('bipolar_i.B.1', 'B', 'Inflated self-esteem or grandiosity.', 'During the elevated period, was there unusual grandiosity or inflated self-confidence?', {
        number: 1,
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['grandiose', 'special powers', 'inflated self-esteem'],
      }),
      criterion('bipolar_i.B.2', 'B', 'Decreased need for sleep.', 'During the elevated period, did they need far less sleep without feeling tired?', {
        number: 2,
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['decreased need for sleep', 'slept 2 hours', 'didn'],
      }),
      criterion('bipolar_i.B.3', 'B', 'More talkative than usual or pressure to keep talking.', 'During the elevated period, was there pressured or excessive talking?', {
        number: 3,
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['pressured speech', 'talking nonstop', 'more talkative'],
      }),
      criterion('bipolar_i.B.4', 'B', 'Flight of ideas or racing thoughts.', 'Were there racing thoughts or flight of ideas?', {
        number: 4,
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['racing thoughts', 'flight of ideas'],
      }),
      criterion('bipolar_i.B.5', 'B', 'Distractibility.', 'Did distractibility increase markedly during the elevated period?', {
        number: 5,
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['distractible', 'can'],
      }),
      criterion('bipolar_i.B.6', 'B', 'Increase in goal-directed activity or psychomotor agitation.', 'Was there a major increase in projects, productivity, agitation, or goal-directed activity?', {
        number: 6,
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['too many projects', 'goal-directed', 'psychomotor agitation', 'driven'],
      }),
      criterion('bipolar_i.B.7', 'B', 'Excessive involvement in risky or high-consequence activities.', 'Did the elevated period involve unusual risk-taking, spending, sexual behavior, or impulsive decisions?', {
        number: 7,
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['spending spree', 'risky sex', 'reckless', 'impulsive spending'],
      }),
      criterion('bipolar_i.C', 'C', 'The mood disturbance is severe enough to cause marked impairment, require hospitalization, or include psychotic features.', 'Did the period cause major impairment, require hospitalization, or include psychosis?', {
        intakeFields: ['psychiatricHospitalization', 'additionalSymptoms', 'additionalInfo', 'rawQA'],
        keywords: ['hospitalized', 'psychosis', 'couldn'],
      }),
      criterion('bipolar_i.D', 'D', 'The episode is not attributable to substances or another medical condition.', 'Could substances or a medical condition better explain the elevated mood episode?', {
        intakeFields: ['medicalHistory', 'alcoholUse', 'drugUse', 'substanceUseHistory', 'rawQA'],
      }),
    ],
    requiredCounts: [
      { criterion: 'B', required: 3, total: 7 },
    ],
    durationRequirement: 'At least 1 week, or any duration if hospitalization is needed',
    exclusions: [
      'Not attributable to substances or another medical condition.',
    ],
    specifierOptions: ['Current or most recent episode manic', 'Current or most recent episode hypomanic', 'Current or most recent episode depressed', 'With psychotic features', 'In partial remission', 'In full remission'],
    ruleOuts: ['Substance/medication-induced bipolar disorder', 'Major depressive disorder', 'Bipolar II disorder'],
  },
  {
    id: 'bipolar_ii',
    name: 'Bipolar II Disorder',
    chapter: 'Bipolar and Related Disorders',
    icd10Codes: ['F31.81'],
    sourcePages: [267, 275],
    criteria: [
      criterion('bipolar_ii.A', 'A', 'At least one hypomanic episode has occurred.', 'Has there ever been a 4-day period of unusually elevated or irritable mood with clearly increased energy that others noticed?', {
        intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
        keywords: ['hypomanic', 'elevated mood', 'decreased need for sleep', 'racing thoughts'],
      }),
      criterion('bipolar_ii.B', 'B', 'At least one major depressive episode has occurred.', 'Has there also been a clear major depressive episode with multiple depressive symptoms?', {
        intakeFields: [...NARRATIVE_FIELDS, 'suicidalIdeation', 'rawQA'],
        keywords: ['depressed', 'anhedonia', 'hopeless', 'suicidal'],
      }),
      criterion('bipolar_ii.C', 'C', 'There has never been a manic episode.', 'Has there ever been a manic episode severe enough for hospitalization, major impairment, or psychosis?', {
        intakeFields: [...NARRATIVE_FIELDS, 'psychiatricHospitalization', 'additionalSymptoms', 'rawQA'],
        keywords: ['manic', 'hospitalized for mania', 'psychosis'],
      }),
      criterion('bipolar_ii.D', 'D', 'The occurrence of the episodes is not better explained by a schizophrenia-spectrum or other psychotic disorder.', 'Could psychotic-spectrum disorders better account for the episodes?', {
        intakeFields: ['additionalSymptoms', 'additionalInfo', 'rawQA'],
      }),
      criterion('bipolar_ii.E', 'E', 'The symptoms of depression or the unpredictability caused by mood shifts cause clinically significant distress or impairment.', 'How much impairment or distress comes from the depressive burden or mood variability?', {
        intakeFields: ['historyOfPresentIllness', 'additionalInfo', 'rawQA'],
      }),
    ],
    requiredCounts: [],
    exclusions: [
      'No lifetime manic episode.',
      'Not better explained by psychotic-spectrum disorders.',
    ],
    specifierOptions: ['Current or most recent episode hypomanic', 'Current or most recent episode depressed', 'With anxious distress', 'In partial remission', 'In full remission'],
    ruleOuts: ['Major depressive disorder', 'Cyclothymic disorder', 'Bipolar I disorder'],
  },
  {
    id: 'alcohol_use_disorder',
    name: 'Alcohol Use Disorder',
    chapter: 'Substance-Related and Addictive Disorders',
    icd10Codes: ['F10.10', 'F10.20'],
    sourcePages: [764, 772],
    criteria: [
      criterion('alcohol_use.A.1', 'A', 'Alcohol is often taken in larger amounts or over a longer period than intended.', 'Does drinking often go further than planned?', {
        number: 1,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['drink more than intended', 'can'],
      }),
      criterion('alcohol_use.A.2', 'A', 'Persistent desire or unsuccessful efforts to cut down or control use.', 'Have there been unsuccessful attempts to cut down or stop drinking?', {
        number: 2,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['tried to cut down', 'couldn'],
      }),
      criterion('alcohol_use.A.3', 'A', 'A great deal of time is spent obtaining, using, or recovering from alcohol.', 'Is a lot of time spent drinking or recovering from drinking?', {
        number: 3,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['hangover', 'recovering from drinking', 'whole day drinking'],
      }),
      criterion('alcohol_use.A.4', 'A', 'Craving or a strong desire to use alcohol.', 'Are cravings or strong urges to drink present?', {
        number: 4,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['craving', 'urge to drink'],
      }),
      criterion('alcohol_use.A.5', 'A', 'Recurrent use resulting in failure to fulfill major obligations.', 'Has alcohol contributed to problems meeting work, school, or home responsibilities?', {
        number: 5,
        intakeFields: ['alcoholUse', 'occupation', 'education', 'additionalInfo', 'rawQA'],
        keywords: ['missed work because of drinking', 'neglect responsibilities'],
      }),
      criterion('alcohol_use.A.6', 'A', 'Continued use despite social or interpersonal problems caused by alcohol.', 'Has drinking continued despite relationship conflict or social problems?', {
        number: 6,
        intakeFields: ['alcoholUse', 'relationshipDescription', 'additionalInfo', 'rawQA'],
        keywords: ['arguments about drinking', 'relationship problems because of alcohol'],
      }),
      criterion('alcohol_use.A.7', 'A', 'Important activities are given up or reduced because of alcohol use.', 'Have activities been reduced because drinking took priority?', {
        number: 7,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['stopped activities', 'drinking instead of'],
      }),
      criterion('alcohol_use.A.8', 'A', 'Recurrent use in physically hazardous situations.', 'Has alcohol been used in dangerous situations such as driving?', {
        number: 8,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['drunk driving', 'hazardous use'],
      }),
      criterion('alcohol_use.A.9', 'A', 'Use continues despite knowing it causes physical or psychological problems.', 'Does alcohol use continue despite known health or mental health consequences?', {
        number: 9,
        intakeFields: ['alcoholUse', 'medicalHistory', 'additionalInfo', 'rawQA'],
        keywords: ['still drink even though', 'doctor told me to stop drinking'],
      }),
      criterion('alcohol_use.A.10', 'A', 'Tolerance.', 'Has tolerance developed, requiring more alcohol for the same effect?', {
        number: 10,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['tolerance', 'need more alcohol'],
      }),
      criterion('alcohol_use.A.11', 'A', 'Withdrawal or use to relieve withdrawal.', 'Have there been withdrawal symptoms or drinking to avoid withdrawal?', {
        number: 11,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['withdrawal', 'shakes', 'drink to feel normal'],
      }),
    ],
    requiredCounts: [
      { criterion: 'A', required: 2, total: 11 },
    ],
    durationRequirement: 'Within a 12-month period',
    exclusions: [],
    specifierOptions: ['Mild', 'Moderate', 'Severe', 'In early remission', 'In sustained remission'],
    ruleOuts: ['Social drinking without impairment', 'Substance-induced symptoms without use disorder'],
  },
  {
    id: 'cannabis_use_disorder',
    name: 'Cannabis Use Disorder',
    chapter: 'Substance-Related and Addictive Disorders',
    icd10Codes: ['F12.10', 'F12.20'],
    sourcePages: [790, 797],
    criteria: [
      criterion('cannabis_use.A.1', 'A', 'Cannabis is often taken in larger amounts or over a longer period than intended.', 'Does cannabis use often go further than planned?', {
        number: 1,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['use more weed than intended', 'can'],
      }),
      criterion('cannabis_use.A.2', 'A', 'Persistent desire or unsuccessful efforts to cut down or control use.', 'Have there been unsuccessful attempts to cut down or stop cannabis use?', {
        number: 2,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['tried to cut down weed', 'couldn'],
      }),
      criterion('cannabis_use.A.3', 'A', 'A great deal of time is spent obtaining, using, or recovering from cannabis.', 'Is a lot of time spent using cannabis or recovering from it?', {
        number: 3,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['all day smoking', 'recovering from using'],
      }),
      criterion('cannabis_use.A.4', 'A', 'Craving or a strong desire to use cannabis.', 'Are cravings or strong urges to use cannabis present?', {
        number: 4,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['craving weed', 'urge to use'],
      }),
      criterion('cannabis_use.A.5', 'A', 'Recurrent use resulting in failure to fulfill major obligations.', 'Has cannabis contributed to problems meeting work, school, or home responsibilities?', {
        number: 5,
        intakeFields: ['drugUse', 'occupation', 'education', 'additionalInfo', 'rawQA'],
        keywords: ['missed work because of weed', 'neglect responsibilities'],
      }),
      criterion('cannabis_use.A.6', 'A', 'Continued use despite social or interpersonal problems caused by cannabis.', 'Has cannabis use continued despite relationship or social conflict?', {
        number: 6,
        intakeFields: ['drugUse', 'relationshipDescription', 'additionalInfo', 'rawQA'],
        keywords: ['arguments about weed', 'relationship problems because of cannabis'],
      }),
      criterion('cannabis_use.A.7', 'A', 'Important activities are given up or reduced because of cannabis.', 'Have activities been reduced because cannabis use took priority?', {
        number: 7,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['stopped activities', 'weed instead of'],
      }),
      criterion('cannabis_use.A.8', 'A', 'Recurrent use in physically hazardous situations.', 'Has cannabis been used in dangerous situations such as driving?', {
        number: 8,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['drive high', 'hazardous use'],
      }),
      criterion('cannabis_use.A.9', 'A', 'Use continues despite knowing it causes physical or psychological problems.', 'Does cannabis use continue despite health or mental health consequences?', {
        number: 9,
        intakeFields: ['drugUse', 'medicalHistory', 'additionalInfo', 'rawQA'],
        keywords: ['weed makes anxiety worse', 'still use even though'],
      }),
      criterion('cannabis_use.A.10', 'A', 'Tolerance.', 'Has tolerance developed to cannabis?', {
        number: 10,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['tolerance', 'need more cannabis'],
      }),
      criterion('cannabis_use.A.11', 'A', 'Withdrawal or use to relieve withdrawal.', 'Have there been withdrawal symptoms or using to relieve them?', {
        number: 11,
        intakeFields: SUBSTANCE_FIELDS,
        keywords: ['withdrawal', 'irritable without weed', 'use to feel normal'],
      }),
    ],
    requiredCounts: [
      { criterion: 'A', required: 2, total: 11 },
    ],
    durationRequirement: 'Within a 12-month period',
    exclusions: [],
    specifierOptions: ['Mild', 'Moderate', 'Severe', 'In early remission', 'In sustained remission'],
    ruleOuts: ['Nonproblematic cannabis use', 'Substance-induced symptoms without a use disorder'],
  },
  {
    id: 'borderline_personality_disorder',
    name: 'Borderline Personality Disorder',
    chapter: 'Personality Disorders',
    icd10Codes: ['F60.3'],
    sourcePages: [1002, 1005],
    criteria: [
      criterion('borderline.A', 'A', 'A pervasive pattern of instability in relationships, self-image, affect, and impulsivity beginning by early adulthood and present across contexts.', 'Has there been a long-standing cross-situational pattern of instability in identity, relationships, mood, and impulsivity?', {
        intakeFields: [...NARRATIVE_FIELDS, ...SOCIAL_FIELDS],
      }),
      criterion('borderline.B.1', 'B', 'Frantic efforts to avoid real or imagined abandonment.', 'Are there frantic efforts to avoid abandonment or intense reactions to perceived rejection?', {
        number: 1,
        intakeFields: [...NARRATIVE_FIELDS, ...SOCIAL_FIELDS],
        keywords: ['abandonment', 'fear of being left', 'panic when someone pulls away'],
      }),
      criterion('borderline.B.2', 'B', 'A pattern of unstable and intense interpersonal relationships alternating between idealization and devaluation.', 'Are close relationships intense, unstable, or marked by rapid swings between idealization and devaluation?', {
        number: 2,
        intakeFields: [...NARRATIVE_FIELDS, ...SOCIAL_FIELDS],
        keywords: ['unstable relationships', 'idealize', 'devalue', 'push-pull'],
      }),
      criterion('borderline.B.3', 'B', 'Identity disturbance with markedly unstable self-image or sense of self.', 'Is there a markedly unstable sense of self or identity?', {
        number: 3,
        intakeFields: NARRATIVE_FIELDS,
        keywords: ['don', ', ', ', '],
      }),
      criterion('borderline.B.4', 'B', 'Impulsivity in at least two potentially self-damaging areas.', 'Are there impulsive behaviors in self-damaging areas such as spending, sex, substances, driving, or binge eating?', {
        number: 4,
        intakeFields: [...NARRATIVE_FIELDS, ...SUBSTANCE_FIELDS],
        keywords: ['impulsive spending', 'risky sex', 'reckless driving', 'binge eating', 'substance abuse'],
      }),
      criterion('borderline.B.5', 'B', 'Recurrent suicidal behavior, gestures, threats, or self-mutilation.', 'Is there recurrent suicidal behavior, self-harm, or self-mutilation?', {
        number: 5,
        intakeFields: ['suicidalIdeation', 'suicideAttemptHistory', 'additionalSymptoms', 'additionalInfo', 'rawQA'],
        keywords: ['self-harm', 'cutting', 'suicide attempts', 'suicidal gestures'],
      }),
      criterion('borderline.B.6', 'B', 'Affective instability due to marked reactivity of mood.', 'Are there rapid, intense mood shifts tied to interpersonal or situational triggers?', {
        number: 6,
        intakeFields: NARRATIVE_FIELDS,
        keywords: ['mood swings', 'emotionally reactive', 'intense mood changes'],
      }),
      criterion('borderline.B.7', 'B', 'Chronic feelings of emptiness.', 'Are chronic feelings of emptiness present?', {
        number: 7,
        intakeFields: NARRATIVE_FIELDS,
        keywords: ['empty', 'void', 'chronic emptiness'],
      }),
      criterion('borderline.B.8', 'B', 'Inappropriate, intense anger or difficulty controlling anger.', 'Is anger intense, hard to regulate, or disproportionate?', {
        number: 8,
        intakeFields: NARRATIVE_FIELDS,
        keywords: ['intense anger', 'rage', 'can'],
      }),
      criterion('borderline.B.9', 'B', 'Transient stress-related paranoid ideation or severe dissociative symptoms.', 'Under stress, are there brief paranoid ideas or dissociative symptoms?', {
        number: 9,
        intakeFields: NARRATIVE_FIELDS,
        keywords: ['paranoid when stressed', 'dissociation', 'stress-related paranoia'],
      }),
    ],
    requiredCounts: [
      { criterion: 'B', required: 5, total: 9 },
    ],
    exclusions: [
      'Pattern is pervasive and longstanding rather than limited to episodes.',
      'Not better explained by substances or another medical condition.',
    ],
    specifierOptions: ['No formal DSM specifier'],
    ruleOuts: ['Bipolar disorders', 'Posttraumatic stress disorder', 'Substance use disorders'],
  },
]

export const DSM5_DISORDER_MAP = Object.fromEntries(
  DSM5_DISORDERS.map((disorder) => [disorder.id, disorder])
) as Record<string, DSM5DisorderDefinition>
