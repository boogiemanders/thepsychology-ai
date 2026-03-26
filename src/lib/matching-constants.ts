export const MODALITIES = [
  'CBT',
  'DBT',
  'EMDR',
  'ACT',
  'Psychodynamic',
  'Psychoanalytic',
  'IFS',
  'Somatic',
  'Motivational Interviewing',
  'Person-Centered',
  'Solution-Focused',
  'Narrative',
  'Gottman Method',
  'EFT',
] as const

export const CONDITIONS = [
  'Depression',
  'Anxiety',
  'Trauma/PTSD',
  'OCD',
  'ADHD',
  'Grief/Loss',
  'Relationship Issues',
  'Bipolar Disorder',
  'Eating Disorders',
  'Substance Use',
  'Life Transitions',
  'Stress/Burnout',
  'Identity/Self-Esteem',
] as const

export const POPULATIONS = [
  'Adults (18+)',
  'Adolescents (13-17)',
  'Children (6-12)',
  'Older Adults (65+)',
  'Couples',
  'Families',
  'LGBTQ+',
  'BIPOC',
  'Veterans',
  'First Responders',
  'Healthcare Workers',
] as const

export const INSURANCE_PAYERS = [
  'Aetna',
  'BCBS',
  'Cigna',
  'United/Optum',
  'Oscar',
  'Anthem',
  'Kaiser',
  'Magellan',
  'Beacon Health',
  'Out-of-Network Only',
] as const

export const FAITH_TRADITIONS = [
  'Christian',
  'Jewish',
  'Muslim',
  'Buddhist',
  'Hindu',
  'Secular/Non-Religious',
  'Spiritual but not religious',
] as const

export const LANGUAGES = [
  'English',
  'Spanish',
  'Mandarin',
  'Cantonese',
  'Korean',
  'Vietnamese',
  'Tagalog',
  'Arabic',
  'Farsi',
  'Russian',
  'Portuguese',
  'French',
  'Hindi',
  'Japanese',
  'ASL',
] as const

export const RACIAL_CULTURAL_FOCUS = [
  'African American/Black',
  'Asian American/Pacific Islander',
  'Hispanic/Latinx',
  'Native American/Indigenous',
  'Middle Eastern/North African',
  'South Asian',
  'Immigrant/Refugee',
  'Multicultural/Multiracial',
] as const

export const LAUNCH_STATES = ['CA', 'NY'] as const
export type LaunchState = (typeof LAUNCH_STATES)[number]

export const STYLE_LABELS = {
  style_directive: {
    low: 'Non-directive / Exploratory',
    high: 'Directive / Structured',
    description: 'How much structure and guidance do you prefer?',
  },
  style_present_focused: {
    low: 'Past-oriented / Insight',
    high: 'Present & Future-focused',
    description: 'Focus on understanding the past or building forward?',
  },
  style_insight_behavioral: {
    low: 'Insight / Understanding',
    high: 'Behavioral / Skills-based',
    description: 'Emphasis on understanding why or learning what to do?',
  },
  style_warmth_professional: {
    low: 'Formal / Professional',
    high: 'Warm / Casual',
    description: 'Preferred therapist communication style?',
  },
} as const
