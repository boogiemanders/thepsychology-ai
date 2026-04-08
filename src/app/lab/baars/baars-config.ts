import type {
  AssessmentOption,
  AssessmentQuestion,
  AssessmentScoringGroup,
  AssessmentSection,
  InstrumentDefinition,
} from '../_lib/assessment-types'

type BaarsCurrentPercentileGroupId =
  | 'inattention_raw'
  | 'hyperactivity_raw'
  | 'impulsivity_raw'
  | 'total_adhd_raw'
  | 'sct_raw'

type BaarsChildhoodPercentileGroupId =
  | 'inattention_raw'
  | 'hyperactivity_impulsivity_raw'
  | 'total_adhd_raw'

type BaarsAgeBand = '18-39' | '40-59' | '60-89'

interface BaarsCurrentPercentileRow {
  percentile: string
  inattention_raw?: string
  hyperactivity_raw?: string
  impulsivity_raw?: string
  total_adhd_raw?: string
  sct_raw?: string
}

interface BaarsChildhoodPercentileRow {
  percentile: string
  inattention_raw?: string
  hyperactivity_impulsivity_raw?: string
  total_adhd_raw?: string
}

const BAARS_RESPONSE_SCALE: AssessmentOption[] = [
  { value: '1', label: 'Never or rarely', numericValue: 1 },
  { value: '2', label: 'Sometimes', numericValue: 2 },
  { value: '3', label: 'Often', numericValue: 3 },
  { value: '4', label: 'Very often', numericValue: 4 },
]

const YES_NO_OPTIONS: AssessmentOption[] = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
]

const IMPAIRMENT_SETTING_OPTIONS: AssessmentOption[] = [
  { value: 'school', label: 'School' },
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'social_relationships', label: 'Social Relationships' },
]

const CHILDHOOD_IMPAIRMENT_SETTING_OPTIONS: AssessmentOption[] = [
  { value: 'school', label: 'School' },
  { value: 'home', label: 'Home' },
  { value: 'social_relationships', label: 'Social Relationships' },
]

const BAARS_CURRENT_PERCENTILE_ROWS: Record<BaarsAgeBand, BaarsCurrentPercentileRow[]> = {
  '18-39': [
    { percentile: '99+', inattention_raw: '29-36', hyperactivity_raw: '17-20', impulsivity_raw: '14-16', total_adhd_raw: '54-72', sct_raw: '32-36' },
    { percentile: '98', inattention_raw: '27-28', hyperactivity_raw: '15-16', impulsivity_raw: '12-13', total_adhd_raw: '49-53', sct_raw: '29-31' },
    { percentile: '97', inattention_raw: '24-26', total_adhd_raw: '46-48', sct_raw: '27-28' },
    { percentile: '96', inattention_raw: '23', hyperactivity_raw: '14', impulsivity_raw: '11', total_adhd_raw: '44-45', sct_raw: '25-26' },
    { percentile: '95', inattention_raw: '22', impulsivity_raw: '10', total_adhd_raw: '43' },
    { percentile: '94', hyperactivity_raw: '13', impulsivity_raw: '9', total_adhd_raw: '42', sct_raw: '24' },
    { percentile: '93', inattention_raw: '21', hyperactivity_raw: '12', total_adhd_raw: '39-41', sct_raw: '23' },
    { percentile: '92', inattention_raw: '20', impulsivity_raw: '8', total_adhd_raw: '38', sct_raw: '22' },
    { percentile: '91', total_adhd_raw: '37' },
    { percentile: '90', inattention_raw: '19', hyperactivity_raw: '11', total_adhd_raw: '36', sct_raw: '21' },
    { percentile: '89', inattention_raw: '18' },
    { percentile: '87', sct_raw: '20' },
    { percentile: '86', hyperactivity_raw: '10' },
    { percentile: '85', total_adhd_raw: '35', sct_raw: '19' },
    { percentile: '84', inattention_raw: '17' },
    { percentile: '83', total_adhd_raw: '34', sct_raw: '18' },
    { percentile: '82', total_adhd_raw: '33' },
    { percentile: '81', impulsivity_raw: '7', total_adhd_raw: '32' },
    { percentile: '80', inattention_raw: '16' },
    { percentile: '79', hyperactivity_raw: '9', total_adhd_raw: '31' },
    { percentile: '77', total_adhd_raw: '30', sct_raw: '17' },
    { percentile: '51-75', inattention_raw: '11-15', hyperactivity_raw: '6-8', impulsivity_raw: '5-6', total_adhd_raw: '23-29', sct_raw: '13-16' },
    { percentile: '1-50', inattention_raw: '9-10', hyperactivity_raw: '5', impulsivity_raw: '4', total_adhd_raw: '18-22', sct_raw: '9-12' },
  ],
  '40-59': [
    { percentile: '99+', inattention_raw: '27-36', hyperactivity_raw: '15-20', impulsivity_raw: '13-16', total_adhd_raw: '52-72', sct_raw: '31-36' },
    { percentile: '98', inattention_raw: '24-26', hyperactivity_raw: '14', impulsivity_raw: '12', total_adhd_raw: '45-51', sct_raw: '30' },
    { percentile: '97', inattention_raw: '22-23', hyperactivity_raw: '13', impulsivity_raw: '11', total_adhd_raw: '42-44', sct_raw: '29' },
    { percentile: '96', inattention_raw: '21', hyperactivity_raw: '12', impulsivity_raw: '10', total_adhd_raw: '39-41', sct_raw: '27-28' },
    { percentile: '95', impulsivity_raw: '9', total_adhd_raw: '38', sct_raw: '26' },
    { percentile: '94', inattention_raw: '20', hyperactivity_raw: '11', total_adhd_raw: '37', sct_raw: '24-25' },
    { percentile: '93', inattention_raw: '19', total_adhd_raw: '36', sct_raw: '23' },
    { percentile: '92', sct_raw: '22' },
    { percentile: '91', inattention_raw: '18', hyperactivity_raw: '10', impulsivity_raw: '8', total_adhd_raw: '35' },
    { percentile: '90', sct_raw: '21' },
    { percentile: '89', total_adhd_raw: '34' },
    { percentile: '88', total_adhd_raw: '33', sct_raw: '20' },
    { percentile: '86', inattention_raw: '17', hyperactivity_raw: '9', total_adhd_raw: '32' },
    { percentile: '85', sct_raw: '19' },
    { percentile: '84', inattention_raw: '16', impulsivity_raw: '7', total_adhd_raw: '31', sct_raw: '18' },
    { percentile: '81', inattention_raw: '15', sct_raw: '17' },
    { percentile: '80', hyperactivity_raw: '8', total_adhd_raw: '30' },
    { percentile: '78', inattention_raw: '14', total_adhd_raw: '29' },
    { percentile: '76', sct_raw: '16' },
    { percentile: '51-75', inattention_raw: '11-13', hyperactivity_raw: '6-7', impulsivity_raw: '5-6', total_adhd_raw: '22-28', sct_raw: '12-15' },
    { percentile: '1-50', inattention_raw: '9-10', hyperactivity_raw: '5', impulsivity_raw: '4', total_adhd_raw: '18-21', sct_raw: '9-11' },
  ],
  '60-89': [
    { percentile: '99+', inattention_raw: '20-36', hyperactivity_raw: '13-20', impulsivity_raw: '11-16', total_adhd_raw: '39-72', sct_raw: '24-36' },
    { percentile: '98', hyperactivity_raw: '12', impulsivity_raw: '10', total_adhd_raw: '36-38', sct_raw: '23' },
    { percentile: '97', inattention_raw: '19', hyperactivity_raw: '10-11', impulsivity_raw: '9', total_adhd_raw: '35', sct_raw: '22' },
    { percentile: '96', inattention_raw: '18', impulsivity_raw: '8', total_adhd_raw: '34', sct_raw: '21' },
    { percentile: '95', hyperactivity_raw: '9', total_adhd_raw: '33' },
    { percentile: '94', sct_raw: '20' },
    { percentile: '93', total_adhd_raw: '32' },
    { percentile: '92', inattention_raw: '17', hyperactivity_raw: '8' },
    { percentile: '91', total_adhd_raw: '31', sct_raw: '19' },
    { percentile: '90', impulsivity_raw: '7' },
    { percentile: '89', total_adhd_raw: '30', sct_raw: '18' },
    { percentile: '88', inattention_raw: '16' },
    { percentile: '87', total_adhd_raw: '29' },
    { percentile: '85', hyperactivity_raw: '7' },
    { percentile: '84', inattention_raw: '15', sct_raw: '17' },
    { percentile: '83', impulsivity_raw: '6', total_adhd_raw: '28' },
    { percentile: '79', total_adhd_raw: '27' },
    { percentile: '78', sct_raw: '16' },
    { percentile: '77', inattention_raw: '14' },
    { percentile: '51-75', inattention_raw: '11-13', hyperactivity_raw: '6', impulsivity_raw: '5', total_adhd_raw: '22-26', sct_raw: '13-15' },
    { percentile: '1-50', inattention_raw: '9-10', hyperactivity_raw: '5', impulsivity_raw: '4', total_adhd_raw: '18-21', sct_raw: '9-12' },
  ],
}

const BAARS_CHILDHOOD_PERCENTILE_ROWS: Record<BaarsAgeBand, BaarsChildhoodPercentileRow[]> = {
  '18-39': [
    { percentile: '99+', inattention_raw: '32-36', hyperactivity_impulsivity_raw: '31-36', total_adhd_raw: '60-72' },
    { percentile: '98', inattention_raw: '30-31', hyperactivity_impulsivity_raw: '27-30', total_adhd_raw: '55-59' },
    { percentile: '97', inattention_raw: '27-29', total_adhd_raw: '52-54' },
    { percentile: '96', hyperactivity_impulsivity_raw: '26', total_adhd_raw: '51' },
    { percentile: '95', inattention_raw: '26', hyperactivity_impulsivity_raw: '25', total_adhd_raw: '49-50' },
    { percentile: '94', inattention_raw: '25', hyperactivity_impulsivity_raw: '24', total_adhd_raw: '47-48' },
    { percentile: '93', hyperactivity_impulsivity_raw: '23', total_adhd_raw: '46' },
    { percentile: '92', inattention_raw: '24', total_adhd_raw: '45' },
    { percentile: '91', hyperactivity_impulsivity_raw: '22', total_adhd_raw: '44' },
    { percentile: '90', inattention_raw: '23', total_adhd_raw: '43' },
    { percentile: '89', inattention_raw: '22', total_adhd_raw: '42' },
    { percentile: '88', inattention_raw: '21', hyperactivity_impulsivity_raw: '21', total_adhd_raw: '41' },
    { percentile: '87', hyperactivity_impulsivity_raw: '20', total_adhd_raw: '39-40' },
    { percentile: '85', inattention_raw: '20', hyperactivity_impulsivity_raw: '19', total_adhd_raw: '38' },
    { percentile: '84', total_adhd_raw: '37' },
    { percentile: '83', inattention_raw: '19' },
    { percentile: '82', hyperactivity_impulsivity_raw: '18', total_adhd_raw: '36' },
    { percentile: '81', inattention_raw: '18' },
    { percentile: '77', total_adhd_raw: '35' },
    { percentile: '76', total_adhd_raw: '34' },
    { percentile: '51-75', inattention_raw: '11-17', hyperactivity_impulsivity_raw: '12-17', total_adhd_raw: '24-33' },
    { percentile: '1-50', inattention_raw: '9-10', hyperactivity_impulsivity_raw: '9-11', total_adhd_raw: '18-23' },
  ],
  '40-59': [
    { percentile: '99+', inattention_raw: '31-36', hyperactivity_impulsivity_raw: '28-36', total_adhd_raw: '55-72' },
    { percentile: '98', inattention_raw: '27-30', hyperactivity_impulsivity_raw: '27', total_adhd_raw: '52-54' },
    { percentile: '97', inattention_raw: '26', hyperactivity_impulsivity_raw: '25-26', total_adhd_raw: '46-51' },
    { percentile: '96', inattention_raw: '24-25', hyperactivity_impulsivity_raw: '23-24' },
    { percentile: '95', inattention_raw: '23', hyperactivity_impulsivity_raw: '22', total_adhd_raw: '43-45' },
    { percentile: '94', inattention_raw: '22', total_adhd_raw: '42' },
    { percentile: '93', hyperactivity_impulsivity_raw: '21', total_adhd_raw: '40-41' },
    { percentile: '92', inattention_raw: '21' },
    { percentile: '91', hyperactivity_impulsivity_raw: '20', total_adhd_raw: '39' },
    { percentile: '90', inattention_raw: '20', hyperactivity_impulsivity_raw: '19', total_adhd_raw: '38' },
    { percentile: '89', hyperactivity_impulsivity_raw: '18', total_adhd_raw: '37' },
    { percentile: '88', inattention_raw: '19', total_adhd_raw: '36' },
    { percentile: '86', inattention_raw: '18' },
    { percentile: '84', hyperactivity_impulsivity_raw: '17', total_adhd_raw: '35' },
    { percentile: '83', total_adhd_raw: '34' },
    { percentile: '81', total_adhd_raw: '33' },
    { percentile: '80', hyperactivity_impulsivity_raw: '16' },
    { percentile: '79', inattention_raw: '17', total_adhd_raw: '32' },
    { percentile: '76', hyperactivity_impulsivity_raw: '15', total_adhd_raw: '31' },
    { percentile: '51-75', inattention_raw: '11-16', hyperactivity_impulsivity_raw: '11-14', total_adhd_raw: '24-30' },
    { percentile: '1-50', inattention_raw: '9-10', hyperactivity_impulsivity_raw: '9-10', total_adhd_raw: '18-23' },
  ],
  '60-89': [
    { percentile: '99+', inattention_raw: '26-36', hyperactivity_impulsivity_raw: '25-36', total_adhd_raw: '48-72' },
    { percentile: '98', inattention_raw: '24-25', hyperactivity_impulsivity_raw: '22-24', total_adhd_raw: '44-47' },
    { percentile: '97', inattention_raw: '23', hyperactivity_impulsivity_raw: '20-21', total_adhd_raw: '42-43' },
    { percentile: '96', inattention_raw: '22', total_adhd_raw: '40-41' },
    { percentile: '95', hyperactivity_impulsivity_raw: '18-19', total_adhd_raw: '39' },
    { percentile: '94', inattention_raw: '20-21', total_adhd_raw: '37-38' },
    { percentile: '93', inattention_raw: '19', total_adhd_raw: '36' },
    { percentile: '91', inattention_raw: '18', hyperactivity_impulsivity_raw: '17' },
    { percentile: '89', total_adhd_raw: '35' },
    { percentile: '87', hyperactivity_impulsivity_raw: '16', total_adhd_raw: '34' },
    { percentile: '86', total_adhd_raw: '33' },
    { percentile: '85', inattention_raw: '17', total_adhd_raw: '32' },
    { percentile: '84', hyperactivity_impulsivity_raw: '15', total_adhd_raw: '31' },
    { percentile: '82', hyperactivity_impulsivity_raw: '14', total_adhd_raw: '30' },
    { percentile: '81', inattention_raw: '16' },
    { percentile: '79', total_adhd_raw: '29' },
    { percentile: '78', total_adhd_raw: '28' },
    { percentile: '76', inattention_raw: '15', hyperactivity_impulsivity_raw: '13', total_adhd_raw: '27' },
    { percentile: '51-75', inattention_raw: '11-14', hyperactivity_impulsivity_raw: '10-12', total_adhd_raw: '22-26' },
    { percentile: '1-50', inattention_raw: '9-10', hyperactivity_impulsivity_raw: '9', total_adhd_raw: '18-21' },
  ],
}

function parseRawScoreRange(rangeText: string): { min: number; max: number } {
  if (rangeText.includes('-')) {
    const [min, max] = rangeText.split('-').map(Number)
    return { min, max }
  }

  const value = Number(rangeText)
  return { min: value, max: value }
}

export function getBaarsAgeBand(age: number): BaarsAgeBand | null {
  if (age >= 18 && age <= 39) return '18-39'
  if (age >= 40 && age <= 59) return '40-59'
  if (age >= 60 && age <= 89) return '60-89'
  return null
}

export function lookupBaarsCurrentPercentile(
  groupId: string,
  rawScore: number,
  age: number,
): string | null {
  const ageBand = getBaarsAgeBand(age)
  if (!ageBand) return null

  const rows = BAARS_CURRENT_PERCENTILE_ROWS[ageBand]
  const typedGroupId = groupId as BaarsCurrentPercentileGroupId

  for (const row of rows) {
    const rangeText = row[typedGroupId]
    if (!rangeText) continue

    const { min, max } = parseRawScoreRange(rangeText)
    if (rawScore >= min && rawScore <= max) {
      return row.percentile
    }
  }

  return null
}

export function lookupBaarsChildhoodPercentile(
  groupId: string,
  rawScore: number,
  age: number,
): string | null {
  const ageBand = getBaarsAgeBand(age)
  if (!ageBand) return null

  const rows = BAARS_CHILDHOOD_PERCENTILE_ROWS[ageBand]
  const typedGroupId = groupId as BaarsChildhoodPercentileGroupId

  for (const row of rows) {
    const rangeText = row[typedGroupId]
    if (!rangeText) continue

    const { min, max } = parseRawScoreRange(rangeText)
    if (rawScore >= min && rawScore <= max) {
      return row.percentile
    }
  }

  return null
}

function likertQuestion(id: number, prompt: string): AssessmentQuestion {
  return {
    id: `q${id}`,
    number: id,
    prompt,
    type: 'likert',
    required: true,
  }
}

const currentSections: AssessmentSection[] = [
  {
    id: 'inattention',
    title: 'Section 1: Inattention',
    questions: [
      likertQuestion(1, 'Fail to give close attention to details or make careless mistakes in my work or other activities'),
      likertQuestion(2, 'Difficulty sustaining my attention in tasks or fun activities'),
      likertQuestion(3, "Don't listen when spoken to directly"),
      likertQuestion(4, "Don't follow through on instructions and fail to finish work or chores"),
      likertQuestion(5, 'Have difficulty organizing tasks and activities'),
      likertQuestion(6, 'Avoid, dislike, or am reluctant to engage in tasks that require sustained mental effort'),
      likertQuestion(7, 'Lose things necessary for tasks or activities'),
      likertQuestion(8, 'Easily distracted by extraneous stimuli or irrelevant thoughts'),
      likertQuestion(9, 'Forgetful in daily activities'),
    ],
  },
  {
    id: 'hyperactivity',
    title: 'Section 2: Hyperactivity',
    questions: [
      likertQuestion(10, 'Fidget with hands or feet or squirm in seat'),
      likertQuestion(11, 'Leave my seat in classrooms or in other situations in which remaining seated is expected'),
      likertQuestion(12, 'Shift around excessively or feel restless or hemmed in'),
      likertQuestion(13, 'Have difficulty engaging in leisure activities quietly (feel uncomfortable, or am loud or noisy)'),
      likertQuestion(14, 'I am "on the go" or act as if "driven by a motor" (or I feel like I have to be busy or always doing something)'),
    ],
  },
  {
    id: 'impulsivity',
    title: 'Section 3: Impulsivity',
    questions: [
      likertQuestion(15, 'Talk excessively (in social situations)'),
      likertQuestion(16, "Blurt out answers before questions have been completed, complete others' sentences, or jump the gun"),
      likertQuestion(17, 'Have difficulty awaiting my turn'),
      likertQuestion(18, 'Interrupt or intrude on others (butt into conversations or activities without permission or take over what others are doing)'),
    ],
  },
  {
    id: 'sluggish_cognitive_tempo',
    title: 'Section 4: Sluggish Cognitive Tempo',
    questions: [
      likertQuestion(19, 'Prone to daydreaming when I should be concentrating on something or working'),
      likertQuestion(20, 'Have trouble staying alert or awake in boring situations'),
      likertQuestion(21, 'Easily confused'),
      likertQuestion(22, 'Easily bored'),
      likertQuestion(23, 'Spacey or "in a fog"'),
      likertQuestion(24, 'Lethargic, more tired than others'),
      likertQuestion(25, 'Underactive or have less energy than others'),
      likertQuestion(26, 'Slow moving'),
      likertQuestion(27, "I don't seem to process information as quickly or as accurately as others"),
    ],
  },
  {
    id: 'follow_up',
    title: 'Section 5: Follow-Up Questions',
    questions: [
      {
        id: 'q28',
        number: 28,
        prompt: 'Did you experience any of these 27 symptoms at least "Often" or more frequently (Did you circle a 3 or a 4 above)?',
        type: 'single_select',
        required: true,
        options: YES_NO_OPTIONS,
      },
      {
        id: 'q29',
        number: 29,
        prompt: 'If so, how old were you when those symptoms began?',
        type: 'number',
        helpText: 'Enter age in years.',
      },
      {
        id: 'q30',
        number: 30,
        prompt: 'If so, in which of these settings did those symptoms impair your functioning?',
        type: 'multi_select',
        options: IMPAIRMENT_SETTING_OPTIONS,
      },
    ],
  },
]

const currentScoringGroups: AssessmentScoringGroup[] = [
  {
    id: 'inattention_raw',
    label: 'Inattention Raw Score',
    scoringType: 'raw_sum',
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'],
    severityBands: [
      { min: 17, max: 20, label: 'Subclinical' },
      { min: 21, max: 23, label: 'Mild' },
      { min: 24, max: 28, label: 'Moderate' },
      { min: 29, label: 'High' },
    ],
  },
  {
    id: 'hyperactivity_raw',
    label: 'Hyperactivity Raw Score',
    scoringType: 'raw_sum',
    questionIds: ['q10', 'q11', 'q12', 'q13', 'q14'],
    severityBands: [
      { min: 10, max: 11, label: 'Subclinical' },
      { min: 12, max: 14, label: 'Mild' },
      { min: 15, max: 16, label: 'Moderate' },
      { min: 17, label: 'High' },
    ],
    note: 'Bands normalized to match workbook formula precedence.',
  },
  {
    id: 'impulsivity_raw',
    label: 'Impulsivity Raw Score',
    scoringType: 'raw_sum',
    questionIds: ['q15', 'q16', 'q17', 'q18'],
    severityBands: [
      { min: 8, max: 8, label: 'Subclinical' },
      { min: 9, max: 11, label: 'Mild' },
      { min: 12, max: 13, label: 'Moderate' },
      { min: 14, label: 'High' },
    ],
  },
  {
    id: 'total_adhd_raw',
    label: 'Total ADHD Raw Score',
    scoringType: 'raw_sum',
    questionIds: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9',
      'q10', 'q11', 'q12', 'q13', 'q14',
      'q15', 'q16', 'q17', 'q18',
    ],
    severityBands: [
      { min: 35, max: 38, label: 'Subclinical' },
      { min: 39, max: 45, label: 'Mild' },
      { min: 46, max: 53, label: 'Moderate' },
      { min: 54, label: 'High' },
    ],
    note: 'Bands normalized to match workbook formula precedence.',
  },
  {
    id: 'sct_raw',
    label: 'Sluggish Cognitive Tempo Raw Score',
    scoringType: 'raw_sum',
    questionIds: ['q19', 'q20', 'q21', 'q22', 'q23', 'q24', 'q25', 'q26', 'q27'],
    severityBands: [
      { min: 19, max: 22, label: 'Subclinical' },
      { min: 23, max: 26, label: 'Mild' },
      { min: 27, max: 31, label: 'Moderate' },
      { min: 32, label: 'High' },
    ],
  },
  {
    id: 'inattention_symptom_count',
    label: 'Inattention Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'],
    positiveThresholdValue: 3,
  },
  {
    id: 'hyperactivity_symptom_count',
    label: 'Hyperactivity Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: ['q10', 'q11', 'q12', 'q13', 'q14'],
    positiveThresholdValue: 3,
  },
  {
    id: 'impulsivity_symptom_count',
    label: 'Impulsivity Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: ['q15', 'q16', 'q17', 'q18'],
    positiveThresholdValue: 3,
  },
  {
    id: 'hyperactivity_impulsivity_symptom_count',
    label: 'Hyperactivity + Impulsivity Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: ['q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18'],
    positiveThresholdValue: 3,
  },
  {
    id: 'total_adhd_symptom_count',
    label: 'Total ADHD Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9',
      'q10', 'q11', 'q12', 'q13', 'q14',
      'q15', 'q16', 'q17', 'q18',
    ],
    positiveThresholdValue: 3,
  },
  {
    id: 'sct_symptom_count',
    label: 'SCT Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: ['q19', 'q20', 'q21', 'q22', 'q23', 'q24', 'q25', 'q26', 'q27'],
    positiveThresholdValue: 3,
  },
]

export const BAARS_SELF_REPORT_CURRENT_SYMPTOMS: InstrumentDefinition = {
  id: 'baars_iv_self_report_current_symptoms',
  slug: 'baars',
  title: 'BAARS-IV Self-Report: Current Symptoms',
  shortTitle: 'BAARS-IV',
  description: 'Source-backed config for the BAARS-IV self-report current symptoms questionnaire, structured for the lab demo form.',
  versionLabel: 'BAARS-IV',
  respondentType: 'Adult self-report',
  sourceFiles: [
    '/Users/anderschan/Downloads/BAARS-ADHD-questionnaire-PLEASE-COMPLETE-with-respect-to-symptoms-while-OFF-ADHD-medication.pdf',
    '/Users/anderschan/Downloads/BAARS_IV_SR_Scorer.corrected.xlsx',
    '/Users/anderschan/Downloads/BAARS Norms.pdf',
  ],
  headerFields: [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'date', label: 'Date', type: 'date' },
    { id: 'age', label: 'Age', type: 'number', helpText: 'Age in years.' },
  ],
  instructions: `For the first 27 items, please circle the number next to each item below that best describes your behavior DURING THE PAST 6 MONTHS.
Then answer the remaining three questions.`,
  responseScale: BAARS_RESPONSE_SCALE,
  sections: currentSections,
  scoringGroups: currentScoringGroups,
  notes: [
    'Question text was OCR-extracted and visually verified against pages 1-3 of the questionnaire PDF.',
    'The corrected local scorer workbook fixes Item Entry row offsets that were present in the original spreadsheet.',
    'Severity ranges come from the local scorer workbook and are intended for ages 18-39 only.',
    'This config is meant for the lab demo scaffold, not final clinical release validation.',
  ],
}

const childhoodSections: AssessmentSection[] = [
  {
    id: 'inattention',
    title: 'Section 1: Inattention',
    questions: [
      likertQuestion(1, 'Failed to give close attention to details or made careless mistakes in my work or other activities'),
      likertQuestion(2, 'Had difficulty sustaining my attention in tasks or fun activities'),
      likertQuestion(3, 'Didn’t listen when spoken to directly'),
      likertQuestion(4, 'Didn’t follow through on instructions and failed to finish work or chores'),
      likertQuestion(5, 'Had difficulty organizing tasks and activities'),
      likertQuestion(6, 'Avoided, disliked, or was reluctant to engage in tasks that required sustained mental effort'),
      likertQuestion(7, 'Lost things necessary for tasks or activities'),
      likertQuestion(8, 'Was easily distracted by extraneous stimuli or irrelevant thoughts'),
      likertQuestion(9, 'Was forgetful in daily activities'),
    ],
  },
  {
    id: 'hyperactivity_impulsivity',
    title: 'Section 2: Hyperactivity-Impulsivity',
    questions: [
      likertQuestion(10, 'Fidgeted with hands or feet or squirmed in seat'),
      likertQuestion(11, 'Left my seat in classrooms or in other situations in which remaining seated was expected'),
      likertQuestion(12, 'Shifted around excessively or felt restless or hemmed in'),
      likertQuestion(13, 'Had difficulty engaging in leisure activities quietly (felt uncomfortable, or was loud or noisy)'),
      likertQuestion(14, 'Was “on the go” or acted as if “driven by a motor”'),
      likertQuestion(15, 'Talked excessively'),
      likertQuestion(16, 'Blurted out answers before questions had been completed, completed others’ sentences, or jumped the gun'),
      likertQuestion(17, 'Had difficulty awaiting my turn'),
      likertQuestion(18, 'Interrupted or intruded on others (butted into conversations or activities without permission or took over what others were doing)'),
    ],
  },
  {
    id: 'follow_up',
    title: 'Section 3',
    questions: [
      {
        id: 'q19',
        number: 19,
        prompt: 'Did you experience any of these 18 symptoms at least “Often” or more frequently (Did you circle a 3 or a 4 above)?',
        type: 'single_select',
        required: true,
        options: YES_NO_OPTIONS,
      },
      {
        id: 'q20',
        number: 20,
        prompt: 'If so, in which of these settings did those symptoms impair your functioning?',
        type: 'multi_select',
        options: CHILDHOOD_IMPAIRMENT_SETTING_OPTIONS,
      },
    ],
  },
]

const childhoodScoringGroups: AssessmentScoringGroup[] = [
  {
    id: 'inattention_raw',
    label: 'Inattention Raw Score',
    scoringType: 'raw_sum',
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'],
    severityBands: [
      { min: 20, max: 24, label: 'Subclinical' },
      { min: 25, max: 26, label: 'Mild' },
      { min: 27, max: 31, label: 'Moderate' },
      { min: 32, label: 'High' },
    ],
  },
  {
    id: 'hyperactivity_impulsivity_raw',
    label: 'Hyperactivity-Impulsivity Raw Score',
    scoringType: 'raw_sum',
    questionIds: ['q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18'],
    severityBands: [
      { min: 19, max: 22, label: 'Subclinical' },
      { min: 23, max: 26, label: 'Mild' },
      { min: 27, max: 30, label: 'Moderate' },
      { min: 31, label: 'High' },
    ],
  },
  {
    id: 'total_adhd_raw',
    label: 'Total ADHD Raw Score',
    scoringType: 'raw_sum',
    questionIds: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9',
      'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18',
    ],
    severityBands: [
      { min: 37, max: 45, label: 'Subclinical' },
      { min: 46, max: 51, label: 'Mild' },
      { min: 52, max: 59, label: 'Moderate' },
      { min: 60, label: 'High' },
    ],
  },
  {
    id: 'inattention_symptom_count',
    label: 'Inattention Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'],
    positiveThresholdValue: 3,
  },
  {
    id: 'hyperactivity_impulsivity_symptom_count',
    label: 'Hyperactivity-Impulsivity Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: ['q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18'],
    positiveThresholdValue: 3,
  },
  {
    id: 'total_adhd_symptom_count',
    label: 'Total ADHD Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9',
      'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18',
    ],
    positiveThresholdValue: 3,
  },
]

export const BAARS_SELF_REPORT_CHILDHOOD_SYMPTOMS: InstrumentDefinition = {
  id: 'baars_iv_self_report_childhood_symptoms',
  slug: 'baars',
  title: 'BAARS-IV Self-Report: Childhood Symptoms',
  shortTitle: 'BAARS-IV',
  description: 'Source-backed config for the BAARS-IV self-report childhood symptoms form, structured for the lab demo form.',
  versionLabel: 'BAARS-IV',
  respondentType: 'Adult retrospective self-report',
  sourceFiles: [
    '/Users/anderschan/Downloads/Section3.4 Referral Packet.11.07.16.pdf',
    '/Users/anderschan/Downloads/BAARS_IV_Childhood_Scorer.corrected.xlsx',
    '/Users/anderschan/Downloads/BAARS Norms.pdf',
  ],
  headerFields: [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'date', label: 'Date', type: 'date' },
    { id: 'age', label: 'Age', type: 'number', helpText: 'Current age in years.' },
  ],
  instructions: `For the first 18 items, please circle the number next to each item below that best describes your behavior when you were a child BETWEEN 5 AND 12 YEARS OF AGE.
Then answer the remaining two questions.`,
  responseScale: BAARS_RESPONSE_SCALE,
  sections: childhoodSections,
  scoringGroups: childhoodScoringGroups,
  notes: [
    'Question text was transcribed from pages 5-6 of the referral packet and visually verified against the page images.',
    'The corrected local childhood scorer workbook fixes Item Entry row offsets that were present in the original spreadsheet.',
    'Severity ranges come from the local childhood scorer workbook and are intended for ages 18-39 only.',
    'Percentile lookup is sourced from the BAARS norms PDF for ages 18-39, 40-59, and 60-89.',
  ],
}
