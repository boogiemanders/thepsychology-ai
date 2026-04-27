import type { ClinicianConfig, PayResult, ManualAdditionKind } from './types'

/**
 * Billing code -> session duration in minutes.
 * Industry standard CPT durations + practice-specific codes.
 */
export const CODE_DURATION_MINUTES: Record<string, number> = {
  '90791': 60,   // Diagnostic evaluation
  '90837': 60,   // Individual therapy 53+ min
  '90834': 45,   // Individual therapy 38-52 min
  '90832': 30,   // Individual therapy 16-37 min
  '90846': 60,   // Family therapy w/o patient
  '90847': 60,   // Family therapy w/ patient
  '00001': 0,    // No-show
  '00002': 0,    // Late cancellation
  '00005': 0,    // Contact outreach
  'EFC50': 30,   // Extended follow-up contact
  'Admin': 60,   // Administrative hour
  '96130': 60,   // Psych testing eval (first hour)
  '96131': 60,   // Psych testing eval (addtl hour)
  '96132': 60,   // Neuropsych testing eval (first hour)
  '96133': 60,   // Neuropsych testing eval (addtl hour)
  '96138': 60,   // Psych/neuropsych testing
  '96139': 60,   // Psych/neuropsych testing
}

const DEFAULT_DURATION_MINUTES = 60

export function getCodeDurationMinutes(code: string): number {
  return CODE_DURATION_MINUTES[code] ?? DEFAULT_DURATION_MINUTES
}

/**
 * Full compensation legend — ported from payroll-calc.py
 * Source: clinician employment contracts (Section 5) + Juan Carlos confirmation
 */
export const legend: Record<string, ClinicianConfig> = {
  'Anders Chan': {
    type: 'cpt_based',
    rates: { '90791': 75, '90837': 75 },
    default: 50,
    noShow: { '00001': 40, '00002': 40 },
    manualRates: { didactic: 75 },
  },
  'Bret Boatwright': {
    type: 'payer_dependent',
    note: 'Needs payer info. Falling back to 80% of billing rate.',
    noShow: { '00001': 75, '00002': 75 },
  },
  'Juan Carlos Espinal': {
    type: 'cpt_based',
    rates: {},
    default: 80,
    overrides: { 'EFC50': 45, '00005': 0 },
    noShow: { '00001': 40, '00002': 40 },
    supervision: {
      '90791': 160, '90837': 140, '90834': 120,
      '90847': 120, '90832': 70, 'EFC50': 0,
    },
  },
  'Emily Underwood': {
    type: 'cpt_based',
    rates: { '90791': 80, '90837': 80, '90834': 70, '90846': 65, '90847': 65, '90832': 40 },
    noShow: { '00001': 40, '00002': 40 },
  },
  'Filomena DiFranco': {
    type: 'cpt_based',
    rates: { '90791': 70, '90837': 65, '90834': 60, '90847': 60, '90832': 40, 'Admin': 65 },
    noShow: {},
    manualRates: { admin: 65 },
  },
  'Isabelle Feinstein': {
    type: 'flat',
    rate: 50,
    noShow: { '00001': 25, '00002': 25 },
    supervision: {
      '90791': 160, '90837': 140, '90834': 120, '90846': 120,
      '90847': 120, '90832': 70,
      '96132': 93.53, '96138': 93.53, '96139': 93.53,
    },
    manualRates: { fusion: 50 },
  },
  'Joelle Gill': {
    type: 'flat',
    rate: 50,
    noShow: { '00001': 25, '00002': 25 },
  },
  'Karen Terry': {
    type: 'cpt_based',
    rates: { '90791': 80, '90837': 75, '90834': 65, '90847': 65, '90832': 40 },
    noShow: { '00001': 40, '00002': 40 },
    supervision: {
      '90791': 160, '90837': 140, '90834': 120,
      '90847': 120, '90832': 70,
    },
  },
  'Lorin Singh': {
    type: 'cpt_based',
    rates: { '90791': 90, '90837': 90 },
    default: 65,
    overrides: { '00005': 0 },
    noShow: { '00001': 40, '00002': 40 },
  },
  'Rachel Beyer': {
    type: 'flat',
    rate: 50,
    noShow: { '00001': 25, '00002': 25 },
    manualRates: { fusion: 50 },
  },
}

/**
 * Look up the rate for a manual addition (didactic, fusion).
 * Returns null if no rate is configured for that clinician + kind.
 */
export function getManualRate(
  clinicianName: string,
  kind: ManualAdditionKind
): number | null {
  const cfg = legend[clinicianName]
  if (!cfg) return null
  return cfg.manualRates?.[kind] ?? null
}

/**
 * Calculate pay rate and supervision value for a single CSV row.
 * Handles multi-code rows (codes separated by newlines in the CSV).
 */
export function getPayRate(
  clinician: string,
  code: string,
  billingRate?: string
): PayResult {
  const cfg = legend[clinician]
  if (!cfg) return { pay: null, supervisionValue: 0 }

  const codes = code.split('\n').map(c => c.trim()).filter(Boolean)
  let totalPay = 0
  let totalSupe = 0

  for (const c of codes) {
    let pay = 0
    let supe = 0

    if (cfg.type === 'payer_dependent') {
      if (cfg.noShow && c in cfg.noShow) {
        pay = cfg.noShow[c]
      } else if (billingRate) {
        const rates = billingRate.split('\n').map(r => r.trim()).filter(Boolean)
        const idx = codes.indexOf(c)
        const rateStr = idx < rates.length ? rates[idx] : rates[0]
        const parsed = parseFloat(rateStr)
        pay = isNaN(parsed) ? 0 : parsed * 0.80
      }
    } else if (cfg.type === 'flat') {
      if (cfg.noShow && c in cfg.noShow) {
        pay = cfg.noShow[c]
      } else {
        pay = cfg.rate
      }
    } else if (cfg.type === 'cpt_based') {
      if (cfg.noShow && c in cfg.noShow) {
        pay = cfg.noShow[c]
      } else if (cfg.overrides && c in cfg.overrides) {
        pay = cfg.overrides[c]
      } else if (c in cfg.rates) {
        pay = cfg.rates[c]
      } else if (cfg.default !== undefined) {
        pay = cfg.default
      }
    }

    if ('supervision' in cfg && cfg.supervision && c in cfg.supervision) {
      supe = cfg.supervision[c]
    }

    totalPay += pay
    totalSupe += supe
  }

  return { pay: totalPay, supervisionValue: totalSupe }
}
