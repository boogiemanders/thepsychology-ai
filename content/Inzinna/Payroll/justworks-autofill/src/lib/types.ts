export interface SessionRow {
  dateOfService: string
  client: string
  clinician: string
  billingCode: string
  ratePerUnit: string
}

export interface PayResult {
  pay: number | null
  supervisionValue: number
}

export interface ClinicianSummary {
  name: string
  sessionPay: number
  supervisionTotal: number
  supervisionForBret: number
  sessionCount: number
  rows: SessionDetail[]
}

export interface SessionDetail {
  date: string
  client: string
  code: string
  pay: number | null
  supervisionValue: number
  durationMinutes: number
}

export interface DailyHours {
  date: string
  dayOfWeek: string
  totalMinutes: number
  sessionCount: number
}

export interface JustWorksFillData {
  clinicianName: string
  totalPay: number
  totalMinutes: number
  adjustedHourlyRate: number
  dailyBreakdown: DailyHours[]
  minuteAdjustment: number
}

export interface PayrollResult {
  clinicians: ClinicianSummary[]
  bretFullCalc: {
    sessionPay: number
    supervisionFromIzzy: number
    supervisionFromCarlos: number
    supervisionFromKaren: number
    totalSupervision: number
    grandTotal: number
  }
}

export type ClinicianType = 'flat' | 'cpt_based' | 'payer_dependent'

export interface FlatConfig {
  type: 'flat'
  rate: number
  noShow?: Record<string, number>
  supervision?: Record<string, number>
}

export interface CptBasedConfig {
  type: 'cpt_based'
  rates: Record<string, number>
  default?: number
  overrides?: Record<string, number>
  noShow?: Record<string, number>
  supervision?: Record<string, number>
}

export interface PayerDependentConfig {
  type: 'payer_dependent'
  note: string
  noShow?: Record<string, number>
}

export type ClinicianConfig = FlatConfig | CptBasedConfig | PayerDependentConfig

export interface PayrollResultWithHours extends PayrollResult {
  fillData: JustWorksFillData[]
}

export interface StoredPayroll {
  timestamp: number
  result: PayrollResultWithHours
}
