import type {
  AssessmentOption,
  AssessmentQuestion,
  AssessmentScoringGroup,
  AssessmentSection,
  InstrumentDefinition,
} from '../_lib/assessment-types'

export type AdhdRsNormGroup = 'boys' | 'girls'
export type AdhdRsAgeBand = '5-7' | '8-10' | '11-13' | '14-17'
type AdhdRsScaleId = 'ia_raw' | 'hi_raw' | 'total_raw'
type AdhdRsImpairmentQuestionId = 'i1' | 'i2' | 'i3' | 'i4' | 'i5' | 'i6'
type AdhdRsImpairmentScore = 1 | 2 | 3

interface AdhdRsNormRow {
  percentile: string
  hi_5_7: number
  hi_8_10: number
  hi_11_13: number
  hi_14_17: number
  ia_5_7: number
  ia_8_10: number
  ia_11_13: number
  ia_14_17: number
  total_5_7: number
  total_8_10: number
  total_11_13: number
  total_14_17: number
}

export const ADHD_RS_HOME_PERCENTILE_CITATION =
  'DuPaul, Power, Anastopoulos, and Reid (2016). ADHD Rating Scale-5 for Children and Adolescents: Home Version norms.'

export const ADHD_RS_HOME_PERCENTILE_NOTE =
  'Percentiles are reported as conservative floors from the published home-version anchor tables (for example, ">=95th percentile"). Impairment percentiles are attached only to ratings of 1-3; a raw impairment rating of 0 is reported as No Problem without percentile labeling.'

const ADHD_RS_RESPONSE_SCALE: AssessmentOption[] = [
  { value: '0', label: 'Never or Rarely', numericValue: 0 },
  { value: '1', label: 'Sometimes', numericValue: 1 },
  { value: '2', label: 'Often', numericValue: 2 },
  { value: '3', label: 'Very Often', numericValue: 3 },
]

export const ADHD_RS_IMPAIRMENT_SCALE: AssessmentOption[] = [
  { value: '0', label: 'No Problem', numericValue: 0 },
  { value: '1', label: 'Minor Problem', numericValue: 1 },
  { value: '2', label: 'Moderate Problem', numericValue: 2 },
  { value: '3', label: 'Severe Problem', numericValue: 3 },
]

const NORM_GROUP_OPTIONS: AssessmentOption[] = [
  { value: 'boys', label: 'Boys' },
  { value: 'girls', label: 'Girls' },
]

const COMPLETED_BY_OPTIONS: AssessmentOption[] = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other_caregiver', label: 'Other Caregiver' },
]

const ADHD_RS_HOME_NORM_ROWS: Record<AdhdRsNormGroup, AdhdRsNormRow[]> = {
  boys: [
    { percentile: '99+', hi_5_7: 27, hi_8_10: 27, hi_11_13: 26, hi_14_17: 21, ia_5_7: 27, ia_8_10: 27, ia_11_13: 27, ia_14_17: 27, total_5_7: 50, total_8_10: 53, total_11_13: 52, total_14_17: 47 },
    { percentile: '99', hi_5_7: 24, hi_8_10: 26, hi_11_13: 22, hi_14_17: 16, ia_5_7: 25, ia_8_10: 27, ia_11_13: 27, ia_14_17: 26, total_5_7: 45, total_8_10: 49, total_11_13: 47, total_14_17: 39 },
    { percentile: '98', hi_5_7: 19, hi_8_10: 20, hi_11_13: 19, hi_14_17: 15, ia_5_7: 23, ia_8_10: 25, ia_11_13: 27, ia_14_17: 25, total_5_7: 41, total_8_10: 44, total_11_13: 43, total_14_17: 37 },
    { percentile: '97', hi_5_7: 18, hi_8_10: 20, hi_11_13: 18, hi_14_17: 13, ia_5_7: 22, ia_8_10: 21, ia_11_13: 25, ia_14_17: 21, total_5_7: 38, total_8_10: 38, total_11_13: 38, total_14_17: 34 },
    { percentile: '96', hi_5_7: 17, hi_8_10: 19, hi_11_13: 17, hi_14_17: 12, ia_5_7: 21, ia_8_10: 20, ia_11_13: 22, ia_14_17: 20, total_5_7: 38, total_8_10: 36, total_11_13: 36, total_14_17: 30 },
    { percentile: '95', hi_5_7: 17, hi_8_10: 18, hi_11_13: 15, hi_14_17: 10, ia_5_7: 18, ia_8_10: 17, ia_11_13: 21, ia_14_17: 19, total_5_7: 35, total_8_10: 35, total_11_13: 34, total_14_17: 27 },
    { percentile: '94', hi_5_7: 17, hi_8_10: 17, hi_11_13: 14, hi_14_17: 9, ia_5_7: 17, ia_8_10: 16, ia_11_13: 21, ia_14_17: 18, total_5_7: 32, total_8_10: 33, total_11_13: 31, total_14_17: 26 },
    { percentile: '93', hi_5_7: 17, hi_8_10: 16, hi_11_13: 13, hi_14_17: 9, ia_5_7: 17, ia_8_10: 16, ia_11_13: 19, ia_14_17: 18, total_5_7: 31, total_8_10: 31, total_11_13: 30, total_14_17: 25 },
    { percentile: '92', hi_5_7: 16, hi_8_10: 16, hi_11_13: 12, hi_14_17: 9, ia_5_7: 16, ia_8_10: 16, ia_11_13: 18, ia_14_17: 17, total_5_7: 29, total_8_10: 30, total_11_13: 28, total_14_17: 25 },
    { percentile: '91', hi_5_7: 15, hi_8_10: 15, hi_11_13: 11, hi_14_17: 8, ia_5_7: 15, ia_8_10: 15, ia_11_13: 18, ia_14_17: 16, total_5_7: 27, total_8_10: 29, total_11_13: 26, total_14_17: 22 },
    { percentile: '90', hi_5_7: 15, hi_8_10: 14, hi_11_13: 10, hi_14_17: 8, ia_5_7: 14, ia_8_10: 14, ia_11_13: 17, ia_14_17: 16, total_5_7: 27, total_8_10: 28, total_11_13: 25, total_14_17: 21 },
    { percentile: '89', hi_5_7: 13, hi_8_10: 13, hi_11_13: 10, hi_14_17: 7, ia_5_7: 14, ia_8_10: 12, ia_11_13: 16, ia_14_17: 15, total_5_7: 26, total_8_10: 25, total_11_13: 24, total_14_17: 20 },
    { percentile: '88', hi_5_7: 13, hi_8_10: 11, hi_11_13: 9, hi_14_17: 7, ia_5_7: 12, ia_8_10: 12, ia_11_13: 15, ia_14_17: 14, total_5_7: 25, total_8_10: 24, total_11_13: 23, total_14_17: 19 },
    { percentile: '87', hi_5_7: 12, hi_8_10: 10, hi_11_13: 9, hi_14_17: 6, ia_5_7: 11, ia_8_10: 12, ia_11_13: 15, ia_14_17: 13, total_5_7: 24, total_8_10: 22, total_11_13: 22, total_14_17: 18 },
    { percentile: '86', hi_5_7: 12, hi_8_10: 10, hi_11_13: 9, hi_14_17: 5, ia_5_7: 11, ia_8_10: 11, ia_11_13: 15, ia_14_17: 12, total_5_7: 22, total_8_10: 21, total_11_13: 22, total_14_17: 18 },
    { percentile: '85', hi_5_7: 10, hi_8_10: 9, hi_11_13: 9, hi_14_17: 5, ia_5_7: 10, ia_8_10: 11, ia_11_13: 14, ia_14_17: 11, total_5_7: 20, total_8_10: 19, total_11_13: 21, total_14_17: 17 },
    { percentile: '84', hi_5_7: 10, hi_8_10: 9, hi_11_13: 9, hi_14_17: 5, ia_5_7: 10, ia_8_10: 11, ia_11_13: 13, ia_14_17: 11, total_5_7: 20, total_8_10: 19, total_11_13: 21, total_14_17: 16 },
    { percentile: '80', hi_5_7: 9, hi_8_10: 8, hi_11_13: 7, hi_14_17: 4, ia_5_7: 9, ia_8_10: 9, ia_11_13: 12, ia_14_17: 10, total_5_7: 18, total_8_10: 17, total_11_13: 19, total_14_17: 14 },
    { percentile: '75', hi_5_7: 8, hi_8_10: 7, hi_11_13: 6, hi_14_17: 3, ia_5_7: 9, ia_8_10: 9, ia_11_13: 10, ia_14_17: 9, total_5_7: 16, total_8_10: 14, total_11_13: 17, total_14_17: 11 },
    { percentile: '50', hi_5_7: 5, hi_8_10: 3, hi_11_13: 2, hi_14_17: 1, ia_5_7: 5, ia_8_10: 4, ia_11_13: 6, ia_14_17: 4, total_5_7: 10, total_8_10: 8, total_11_13: 8, total_14_17: 5 },
    { percentile: '25', hi_5_7: 2, hi_8_10: 1, hi_11_13: 0, hi_14_17: 0, ia_5_7: 2, ia_8_10: 2, ia_11_13: 1, ia_14_17: 1, total_5_7: 4, total_8_10: 3, total_11_13: 2, total_14_17: 2 },
    { percentile: '10', hi_5_7: 0, hi_8_10: 0, hi_11_13: 0, hi_14_17: 0, ia_5_7: 0, ia_8_10: 0, ia_11_13: 0, ia_14_17: 0, total_5_7: 0, total_8_10: 1, total_11_13: 0, total_14_17: 0 },
    { percentile: '1', hi_5_7: 0, hi_8_10: 0, hi_11_13: 0, hi_14_17: 0, ia_5_7: 0, ia_8_10: 0, ia_11_13: 0, ia_14_17: 0, total_5_7: 0, total_8_10: 0, total_11_13: 0, total_14_17: 0 },
  ],
  girls: [
    { percentile: '99+', hi_5_7: 27, hi_8_10: 26, hi_11_13: 22, hi_14_17: 20, ia_5_7: 26, ia_8_10: 27, ia_11_13: 27, ia_14_17: 25, total_5_7: 50, total_8_10: 53, total_11_13: 38, total_14_17: 42 },
    { percentile: '99', hi_5_7: 25, hi_8_10: 23, hi_11_13: 16, hi_14_17: 19, ia_5_7: 23, ia_8_10: 26, ia_11_13: 25, ia_14_17: 23, total_5_7: 45, total_8_10: 47, total_11_13: 35, total_14_17: 36 },
    { percentile: '98', hi_5_7: 20, hi_8_10: 21, hi_11_13: 15, hi_14_17: 12, ia_5_7: 21, ia_8_10: 22, ia_11_13: 21, ia_14_17: 19, total_5_7: 43, total_8_10: 37, total_11_13: 32, total_14_17: 32 },
    { percentile: '97', hi_5_7: 17, hi_8_10: 15, hi_11_13: 14, hi_14_17: 11, ia_5_7: 18, ia_8_10: 18, ia_11_13: 20, ia_14_17: 18, total_5_7: 35, total_8_10: 36, total_11_13: 29, total_14_17: 28 },
    { percentile: '96', hi_5_7: 16, hi_8_10: 13, hi_11_13: 13, hi_14_17: 9, ia_5_7: 17, ia_8_10: 17, ia_11_13: 19, ia_14_17: 18, total_5_7: 32, total_8_10: 30, total_11_13: 29, total_14_17: 25 },
    { percentile: '95', hi_5_7: 15, hi_8_10: 11, hi_11_13: 12, hi_14_17: 9, ia_5_7: 16, ia_8_10: 16, ia_11_13: 17, ia_14_17: 18, total_5_7: 29, total_8_10: 28, total_11_13: 27, total_14_17: 24 },
    { percentile: '94', hi_5_7: 14, hi_8_10: 10, hi_11_13: 12, hi_14_17: 8, ia_5_7: 15, ia_8_10: 15, ia_11_13: 15, ia_14_17: 17, total_5_7: 27, total_8_10: 25, total_11_13: 24, total_14_17: 23 },
    { percentile: '93', hi_5_7: 13, hi_8_10: 9, hi_11_13: 11, hi_14_17: 8, ia_5_7: 14, ia_8_10: 14, ia_11_13: 15, ia_14_17: 17, total_5_7: 25, total_8_10: 21, total_11_13: 23, total_14_17: 21 },
    { percentile: '92', hi_5_7: 12, hi_8_10: 9, hi_11_13: 9, hi_14_17: 7, ia_5_7: 13, ia_8_10: 13, ia_11_13: 13, ia_14_17: 15, total_5_7: 24, total_8_10: 21, total_11_13: 22, total_14_17: 20 },
    { percentile: '91', hi_5_7: 12, hi_8_10: 9, hi_11_13: 9, hi_14_17: 6, ia_5_7: 13, ia_8_10: 13, ia_11_13: 13, ia_14_17: 14, total_5_7: 22, total_8_10: 20, total_11_13: 21, total_14_17: 20 },
    { percentile: '90', hi_5_7: 11, hi_8_10: 9, hi_11_13: 8, hi_14_17: 6, ia_5_7: 12, ia_8_10: 12, ia_11_13: 12, ia_14_17: 14, total_5_7: 21, total_8_10: 20, total_11_13: 20, total_14_17: 19 },
    { percentile: '89', hi_5_7: 10, hi_8_10: 8, hi_11_13: 8, hi_14_17: 6, ia_5_7: 12, ia_8_10: 12, ia_11_13: 12, ia_14_17: 13, total_5_7: 21, total_8_10: 18, total_11_13: 19, total_14_17: 18 },
    { percentile: '88', hi_5_7: 9, hi_8_10: 8, hi_11_13: 7, hi_14_17: 5, ia_5_7: 12, ia_8_10: 11, ia_11_13: 11, ia_14_17: 13, total_5_7: 20, total_8_10: 18, total_11_13: 18, total_14_17: 18 },
    { percentile: '87', hi_5_7: 9, hi_8_10: 8, hi_11_13: 7, hi_14_17: 5, ia_5_7: 12, ia_8_10: 11, ia_11_13: 11, ia_14_17: 12, total_5_7: 18, total_8_10: 17, total_11_13: 18, total_14_17: 17 },
    { percentile: '86', hi_5_7: 8, hi_8_10: 7, hi_11_13: 7, hi_14_17: 5, ia_5_7: 11, ia_8_10: 11, ia_11_13: 10, ia_14_17: 12, total_5_7: 18, total_8_10: 17, total_11_13: 18, total_14_17: 16 },
    { percentile: '85', hi_5_7: 8, hi_8_10: 7, hi_11_13: 6, hi_14_17: 4, ia_5_7: 10, ia_8_10: 10, ia_11_13: 10, ia_14_17: 11, total_5_7: 18, total_8_10: 16, total_11_13: 17, total_14_17: 15 },
    { percentile: '84', hi_5_7: 8, hi_8_10: 7, hi_11_13: 6, hi_14_17: 4, ia_5_7: 10, ia_8_10: 10, ia_11_13: 10, ia_14_17: 11, total_5_7: 17, total_8_10: 16, total_11_13: 16, total_14_17: 15 },
    { percentile: '80', hi_5_7: 7, hi_8_10: 6, hi_11_13: 5, hi_14_17: 3, ia_5_7: 9, ia_8_10: 9, ia_11_13: 9, ia_14_17: 9, total_5_7: 15, total_8_10: 14, total_11_13: 13, total_14_17: 12 },
    { percentile: '75', hi_5_7: 6, hi_8_10: 5, hi_11_13: 4, hi_14_17: 3, ia_5_7: 8, ia_8_10: 8, ia_11_13: 8, ia_14_17: 7, total_5_7: 13, total_8_10: 12, total_11_13: 11, total_14_17: 10 },
    { percentile: '50', hi_5_7: 3, hi_8_10: 2, hi_11_13: 1, hi_14_17: 1, ia_5_7: 3, ia_8_10: 3, ia_11_13: 3, ia_14_17: 3, total_5_7: 7, total_8_10: 6, total_11_13: 5, total_14_17: 4 },
    { percentile: '25', hi_5_7: 1, hi_8_10: 0, hi_11_13: 0, hi_14_17: 0, ia_5_7: 1, ia_8_10: 1, ia_11_13: 1, ia_14_17: 0, total_5_7: 3, total_8_10: 2, total_11_13: 1, total_14_17: 1 },
    { percentile: '10', hi_5_7: 0, hi_8_10: 0, hi_11_13: 0, hi_14_17: 0, ia_5_7: 0, ia_8_10: 0, ia_11_13: 0, ia_14_17: 0, total_5_7: 0, total_8_10: 0, total_11_13: 0, total_14_17: 0 },
    { percentile: '1', hi_5_7: 0, hi_8_10: 0, hi_11_13: 0, hi_14_17: 0, ia_5_7: 0, ia_8_10: 0, ia_11_13: 0, ia_14_17: 0, total_5_7: 0, total_8_10: 0, total_11_13: 0, total_14_17: 0 },
  ],
}

const HOME_COLUMN_MAP: Record<AdhdRsScaleId, Record<AdhdRsAgeBand, keyof AdhdRsNormRow>> = {
  ia_raw: {
    '5-7': 'ia_5_7',
    '8-10': 'ia_8_10',
    '11-13': 'ia_11_13',
    '14-17': 'ia_14_17',
  },
  hi_raw: {
    '5-7': 'hi_5_7',
    '8-10': 'hi_8_10',
    '11-13': 'hi_11_13',
    '14-17': 'hi_14_17',
  },
  total_raw: {
    '5-7': 'total_5_7',
    '8-10': 'total_8_10',
    '11-13': 'total_11_13',
    '14-17': 'total_14_17',
  },
}

const ADHD_RS_HOME_IMPAIRMENT_NORMS: Record<
  AdhdRsNormGroup,
  Record<AdhdRsImpairmentQuestionId, Record<AdhdRsAgeBand, Record<AdhdRsImpairmentScore, string>>>
> = {
  boys: {
    i1: {
      '5-7': { 1: '90', 2: '98', 3: '99.5+' },
      '8-10': { 1: '93', 2: '98', 3: '99.5+' },
      '11-13': { 1: '93', 2: '99', 3: '99.5+' },
      '14-17': { 1: '95', 2: '98', 3: '99.5+' },
    },
    i2: {
      '5-7': { 1: '93', 2: '98', 3: '99.5+' },
      '8-10': { 1: '93', 2: '98', 3: '99.5+' },
      '11-13': { 1: '93', 2: '99', 3: '99.5+' },
      '14-17': { 1: '95', 2: '99', 3: '99.5+' },
    },
    i3: {
      '5-7': { 1: '90', 2: '95', 3: '99.5+' },
      '8-10': { 1: '90', 2: '99', 3: '99.5+' },
      '11-13': { 1: '85', 2: '98', 3: '99.5+' },
      '14-17': { 1: '85', 2: '95', 3: '99.5+' },
    },
    i4: {
      '5-7': { 1: '93', 2: '98', 3: '99.5+' },
      '8-10': { 1: '95', 2: '99', 3: '99.5+' },
      '11-13': { 1: '90', 2: '98', 3: '99.5+' },
      '14-17': { 1: '90', 2: '98', 3: '99.5+' },
    },
    i5: {
      '5-7': { 1: '90', 2: '95', 3: '99.5+' },
      '8-10': { 1: '93', 2: '98', 3: '99.5+' },
      '11-13': { 1: '93', 2: '98', 3: '99.5+' },
      '14-17': { 1: '95', 2: '99', 3: '99.5+' },
    },
    i6: {
      '5-7': { 1: '95', 2: '98', 3: '99.5+' },
      '8-10': { 1: '93', 2: '99', 3: '99.5+' },
      '11-13': { 1: '93', 2: '99.5+', 3: '99.5+' },
      '14-17': { 1: '95', 2: '99', 3: '99.5+' },
    },
  },
  girls: {
    i1: {
      '5-7': { 1: '95', 2: '99', 3: '99.5+' },
      '8-10': { 1: '95', 2: '99', 3: '99.5+' },
      '11-13': { 1: '90', 2: '99', 3: '99.5+' },
      '14-17': { 1: '85', 2: '95', 3: '99.5+' },
    },
    i2: {
      '5-7': { 1: '98', 2: '99.5+', 3: '99.5+' },
      '8-10': { 1: '95', 2: '99', 3: '99.5+' },
      '11-13': { 1: '95', 2: '99', 3: '99.5+' },
      '14-17': { 1: '90', 2: '98', 3: '99.5+' },
    },
    i3: {
      '5-7': { 1: '95', 2: '99.5+', 3: '99.5+' },
      '8-10': { 1: '95', 2: '99', 3: '99.5+' },
      '11-13': { 1: '85', 2: '98', 3: '99.5+' },
      '14-17': { 1: '85', 2: '98', 3: '99.5+' },
    },
    i4: {
      '5-7': { 1: '95', 2: '99', 3: '99.5+' },
      '8-10': { 1: '95', 2: '98', 3: '99.5+' },
      '11-13': { 1: '93', 2: '98', 3: '99.5+' },
      '14-17': { 1: '85', 2: '98', 3: '99.5+' },
    },
    i5: {
      '5-7': { 1: '95', 2: '99', 3: '99.5+' },
      '8-10': { 1: '98', 2: '99.5+', 3: '99.5+' },
      '11-13': { 1: '95', 2: '99', 3: '99.5+' },
      '14-17': { 1: '95', 2: '98', 3: '99.5+' },
    },
    i6: {
      '5-7': { 1: '98', 2: '99.5+', 3: '99.5+' },
      '8-10': { 1: '95', 2: '99.5+', 3: '99.5+' },
      '11-13': { 1: '93', 2: '98', 3: '99.5+' },
      '14-17': { 1: '93', 2: '98', 3: '99.5+' },
    },
  },
}

function symptomQuestion(id: number, prompt: string): AssessmentQuestion {
  return {
    id: `q${id}`,
    number: id,
    prompt,
    type: 'likert',
    required: true,
  }
}

function impairmentQuestion(id: number, prompt: string): AssessmentQuestion {
  return {
    id: `i${id}`,
    number: 18 + id,
    prompt,
    type: 'single_select',
    options: ADHD_RS_IMPAIRMENT_SCALE,
  }
}

const sections: AssessmentSection[] = [
  {
    id: 'inattention',
    title: 'Section 1: Inattention',
    description: 'Items 1-9. Rate the child\'s behavior over the past 6 months.',
    questions: [
      symptomQuestion(1, 'Fails to give close attention to details or makes careless mistakes in schoolwork or during other activities'),
      symptomQuestion(2, 'Has difficulty sustaining attention in tasks or play activities'),
      symptomQuestion(3, 'Does not seem to listen when spoken to directly'),
      symptomQuestion(4, 'Does not follow through on instructions and fails to finish schoolwork or chores'),
      symptomQuestion(5, 'Has difficulty organizing tasks and activities'),
      symptomQuestion(6, 'Avoids, dislikes, or is reluctant to engage in tasks that require sustained mental effort (for example, schoolwork or homework)'),
      symptomQuestion(7, 'Loses things necessary for tasks or activities (for example, school materials, pencils, books, eyeglasses)'),
      symptomQuestion(8, 'Easily distracted'),
      symptomQuestion(9, 'Forgetful in daily activities (for example, doing chores)'),
    ],
  },
  {
    id: 'hyperactivity_impulsivity',
    title: 'Section 2: Hyperactivity-Impulsivity',
    description: 'Items 10-18. Use the same 0-3 symptom scale.',
    questions: [
      symptomQuestion(10, 'Fidgets with or taps hands or feet or squirms in seat'),
      symptomQuestion(11, 'Leaves seat in situations when remaining seated is expected'),
      symptomQuestion(12, 'Runs about or climbs in situations where it is inappropriate'),
      symptomQuestion(13, 'Unable to play or engage in leisure activities quietly'),
      symptomQuestion(14, '"On the go," acts as if "driven by a motor"'),
      symptomQuestion(15, 'Talks excessively'),
      symptomQuestion(16, 'Blurts out an answer before a question has been completed'),
      symptomQuestion(17, 'Has difficulty waiting his or her turn (for example, while waiting in line)'),
      symptomQuestion(18, 'Interrupts or intrudes on others'),
    ],
  },
  {
    id: 'impairment',
    title: 'Section 3: Impairment',
    description: 'Items 19-24. Rate current functional impact in each home-domain area.',
    questions: [
      impairmentQuestion(1, 'Getting along with family members'),
      impairmentQuestion(2, 'Getting along with other children'),
      impairmentQuestion(3, 'Completing or returning homework'),
      impairmentQuestion(4, 'Performing academically in school'),
      impairmentQuestion(5, 'Controlling behavior in school'),
      impairmentQuestion(6, 'Feeling good about himself or herself'),
    ],
  },
]

const scoringGroups: AssessmentScoringGroup[] = [
  {
    id: 'ia_raw',
    label: 'Inattention Raw Score',
    scoringType: 'raw_sum',
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'],
    note: 'Looked up against age-banded home norms for boys or girls.',
  },
  {
    id: 'hi_raw',
    label: 'Hyperactivity-Impulsivity Raw Score',
    scoringType: 'raw_sum',
    questionIds: ['q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18'],
    note: 'Looked up against age-banded home norms for boys or girls.',
  },
  {
    id: 'total_raw',
    label: 'Total Raw Score',
    scoringType: 'raw_sum',
    questionIds: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9',
      'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18',
    ],
    note: 'Looked up against age-banded home norms for boys or girls.',
  },
  {
    id: 'ia_symptom_count',
    label: 'Inattention Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'],
    positiveThresholdValue: 2,
    note: 'Counts items rated Often or Very Often.',
  },
  {
    id: 'hi_symptom_count',
    label: 'Hyperactivity-Impulsivity Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: ['q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18'],
    positiveThresholdValue: 2,
    note: 'Counts items rated Often or Very Often.',
  },
  {
    id: 'total_symptom_count',
    label: 'Total Symptom Count',
    scoringType: 'count_at_or_above',
    questionIds: [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9',
      'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18',
    ],
    positiveThresholdValue: 2,
    note: 'Counts items rated Often or Very Often.',
  },
]

export const ADHD_RS_HOME_PARENT: InstrumentDefinition = {
  id: 'adhd_rs_5_home_parent',
  slug: 'adhd-rs',
  title: 'ADHD-RS-5 Home Version',
  shortTitle: 'ADHD-RS-5',
  description: 'ADHD-RS-5 home-version parent scorer with age- and norm-group-aware symptom and impairment percentile lookup.',
  versionLabel: 'Home Parent',
  respondentType: 'Parent / caregiver report',
  sourceFiles: [
    '/Users/anderschan/Downloads/drive-download-20260409T210620Z-3-001/ADHD-RS Child.pdf',
    '/Users/anderschan/Downloads/ADHD-RS Norms.pdf',
    '/Users/anderschan/Downloads/ADHD_RS_Home_Scorer2 (2).xlsx',
  ],
  headerFields: [
    { id: 'child_name', label: 'Child Name', type: 'text' },
    { id: 'date', label: 'Assessment Date', type: 'date' },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      helpText: 'Used to select the 5-7, 8-10, 11-13, or 14-17 norm band.',
    },
    {
      id: 'norm_group',
      label: 'Norm Reference Group',
      type: 'single_select',
      required: true,
      helpText: 'The published home norms are split into boys and girls tables.',
      options: NORM_GROUP_OPTIONS,
    },
    {
      id: 'completed_by',
      label: 'Completed By',
      type: 'single_select',
      options: COMPLETED_BY_OPTIONS,
    },
    { id: 'rater_name', label: 'Rater Name', type: 'text' },
  ],
  instructions: 'Please rate the child\'s behavior over the past 6 months using the 0-3 response scale. Symptom counts treat Often and Very Often as positive endorsements.',
  responseScale: ADHD_RS_RESPONSE_SCALE,
  sections,
  scoringGroups,
  notes: [
    'Symptom items and impairment items were transcribed from the English home-version parent forms.',
    'Symptom percentiles are looked up from the published boys/girls home norm tables for ages 5-17.',
    'Impairment domains use the published boys/girls home impairment sheets for ratings of 1-3. A raw impairment rating of 0 is reported as No Problem without a percentile label.',
  ],
}

function parsePercentileFloor(percentile: string): number {
  if (percentile.endsWith('+')) {
    return Number(percentile.slice(0, -1))
  }

  return Number(percentile)
}

export function getAdhdRsAgeBand(age: number): AdhdRsAgeBand | null {
  if (age >= 5 && age <= 7) return '5-7'
  if (age >= 8 && age <= 10) return '8-10'
  if (age >= 11 && age <= 13) return '11-13'
  if (age >= 14 && age <= 17) return '14-17'
  return null
}

export function getAdhdRsNormGroupLabel(normGroup: AdhdRsNormGroup): string {
  return normGroup === 'boys' ? 'Boys' : 'Girls'
}

function getPercentileFloorForColumn(
  rows: AdhdRsNormRow[],
  column: keyof AdhdRsNormRow,
  rawScore: number,
): string | null {
  for (const row of rows) {
    const cutoff = row[column]
    if (typeof cutoff !== 'number') continue
    if (rawScore >= cutoff) {
      return row.percentile
    }
  }

  return null
}

export function lookupAdhdRsHomePercentileFloor(
  scaleId: AdhdRsScaleId,
  rawScore: number,
  age: number,
  normGroup: AdhdRsNormGroup,
): string | null {
  const ageBand = getAdhdRsAgeBand(age)
  if (!ageBand) return null

  const rows = ADHD_RS_HOME_NORM_ROWS[normGroup]
  const column = HOME_COLUMN_MAP[scaleId][ageBand]
  return getPercentileFloorForColumn(rows, column, rawScore)
}

export function lookupAdhdRsHomeImpairmentPercentileFloor(
  questionId: string,
  rawScore: number,
  age: number,
  normGroup: AdhdRsNormGroup,
): string | null {
  if (rawScore < 1 || rawScore > 3) return null

  const ageBand = getAdhdRsAgeBand(age)
  if (!ageBand) return null

  const questionNorms = ADHD_RS_HOME_IMPAIRMENT_NORMS[normGroup][questionId as AdhdRsImpairmentQuestionId]
  if (!questionNorms) return null

  return questionNorms[ageBand][rawScore as AdhdRsImpairmentScore] ?? null
}

function ordinal(value: number): string {
  const teen = value % 100
  const suffix = teen >= 11 && teen <= 13
    ? 'th'
    : value % 10 === 1
      ? 'st'
      : value % 10 === 2
        ? 'nd'
        : value % 10 === 3
          ? 'rd'
          : 'th'

  return `${value}${suffix}`
}

export function formatAdhdRsPercentileFloor(percentileFloor: string): string {
  if (percentileFloor.endsWith('+')) {
    return `>=${ordinal(Number(percentileFloor.slice(0, -1)))} percentile`
  }

  return `>=${ordinal(Number(percentileFloor))} percentile`
}

export function getAdhdRsPercentileDescriptor(percentileFloor: string | null): string | null {
  if (!percentileFloor) return null

  const floor = parsePercentileFloor(percentileFloor)

  if (floor >= 97) return 'High'
  if (floor >= 92) return 'Moderate'
  if (floor >= 84) return 'Mild'
  if (floor >= 75) return 'Subclinical'
  return 'Within expected range'
}
