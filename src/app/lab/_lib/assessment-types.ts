export interface AssessmentOption {
  value: string
  label: string
  numericValue?: number
}

export interface AssessmentField {
  id: string
  label: string
  type: 'text' | 'date' | 'number' | 'single_select' | 'multi_select'
  required?: boolean
  helpText?: string
  options?: AssessmentOption[]
}

export interface AssessmentQuestion {
  id: string
  number: number
  prompt: string
  type: 'likert' | 'single_select' | 'number' | 'multi_select'
  required?: boolean
  options?: AssessmentOption[]
  helpText?: string
}

export interface AssessmentSection {
  id: string
  title: string
  description?: string
  questions: AssessmentQuestion[]
}

export interface AssessmentSeverityBand {
  min: number
  max?: number
  label: string
}

export interface AssessmentScoringGroup {
  id: string
  label: string
  scoringType: 'raw_sum' | 'count_at_or_above'
  questionIds: string[]
  positiveThresholdValue?: number
  severityBands?: AssessmentSeverityBand[]
  note?: string
}

export interface InstrumentDefinition {
  id: string
  slug: string
  title: string
  shortTitle: string
  description: string
  versionLabel: string
  respondentType: string
  sourceFiles: string[]
  headerFields: AssessmentField[]
  instructions: string
  responseScale?: AssessmentOption[]
  sections: AssessmentSection[]
  scoringGroups: AssessmentScoringGroup[]
  notes?: string[]
}
