import type { ClientPaymentRow } from './csv-parser'
import type { PayrollResult } from './types'
import { norm } from './sosa'

/**
 * Per-provider revenue + margin view from the same SimplePractice CSV.
 *
 * Revenue is an ESTIMATE: insurance lines are valued at billed rates (Total Fee),
 * which is the ceiling, not the actual reimbursement. Self-pay is valued at what
 * was actually collected (Paid). Net subtracts session pay + the supervision cost
 * each provider's sessions generate for Bret.
 *
 * Why a whitelist, not a 2-code blacklist: payroll-engine values insurance billing
 * via an inclusion whitelist of real CPT codes (it excludes 00001/00002 no-shows
 * AND 00005/EFC50/Admin internal codes). We mirror that here so a no-show line
 * never counts as billed revenue, and so the two views reconcile on the same set
 * of "billable" rows rather than diverging on internal codes.
 */
const CPT_BILLED_CODES = new Set([
  '90791', '90832', '90834', '90837', '90846', '90847',
  '96130', '96131', '96132', '96133', '96138', '96139',
])

const MS_PER_DAY = 86400000
const DAYS_PER_MONTH = 30.44

export interface ProviderRevenue {
  name: string
  sessions: number
  insuranceBilled: number      // Total Fee on insurance, non-no-show rows
  selfPayCollected: number     // Paid on self-pay rows
  revenueTotal: number         // insuranceBilled + selfPayCollected
  estMonthly: number           // revenueTotal scaled to a month by date span
  pay: number                  // session pay from payroll
  supeCost: number             // supervision $ this provider generates for Bret
  net: number                  // revenueTotal - pay - supeCost
  margin: number               // net / revenueTotal (0 when revenue is 0)
  ownerNoPayroll: boolean      // in revenue rows but not in payroll (e.g. Gregory)
  supeIncome: number           // Bret only: sum of everyone's supervisionForBret
}

export interface RevenueTotals {
  sessions: number
  insuranceBilled: number
  selfPayCollected: number
  revenueTotal: number
  estMonthly: number
  pay: number
  supeCost: number
  net: number
  margin: number
}

export interface RevenueResult {
  providers: ProviderRevenue[]
  totals: RevenueTotals
  spanDays: number
  factor: number
}

// True when at least one code on the row is a real billable CPT.
// Multi-code rows arrive two ways: '\n'-joined (single column, separate lines)
// or comma-joined inside one quoted cell (e.g. a "96132, 96133, 96133" testing
// battery). Split on both so a legit battery isn't mistaken for an internal code.
function hasBilledCode(code: string): boolean {
  return code.split(/[\n,]/).map(c => c.trim()).some(c => CPT_BILLED_CODES.has(c))
}

// Parse 'MM/DD/YYYY HH:mm' (time optional). Returns ms epoch or null.
function parseRowDate(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  const t = new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])).getTime()
  return Number.isFinite(t) ? t : null
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function computeRevenue(
  rows: ClientPaymentRow[],
  selfPayNames: string[],
  payrollResult: PayrollResult
): RevenueResult {
  const roster = new Set(selfPayNames.map(norm))

  // First pass: total each self-pay client's Paid across ALL their rows.
  // SOSA drops any client whose aggregate is <= 0 (e.g. a refund that nets
  // negative). We mirror that so a reversal can't show as negative collected
  // on a provider, and so the per-provider self-pay sum reconciles with SOSA.
  const selfPayClientTotal = new Map<string, number>()
  for (const r of rows) {
    if (!roster.has(norm(r.client))) continue
    const key = norm(r.client)
    selfPayClientTotal.set(key, (selfPayClientTotal.get(key) || 0) + r.paid)
  }
  const keptSelfPay = new Set<string>()
  for (const [key, total] of selfPayClientTotal) {
    if (total > 0) keptSelfPay.add(key)
  }

  // payroll lookup by clinician name
  const payByName = new Map(payrollResult.clinicians.map(c => [c.name, c]))
  // Bret's total supervision income = sum of supervisees' supervisionForBret.
  const bretSupeIncome = payrollResult.bretFullCalc.totalSupervision

  interface Acc {
    sessions: number
    insuranceBilled: number
    selfPayCollected: number
  }
  const agg = new Map<string, Acc>()

  let minTs = Infinity
  let maxTs = -Infinity

  for (const r of rows) {
    const provider = r.clinician || 'Unknown'
    let a = agg.get(provider)
    if (!a) {
      a = { sessions: 0, insuranceBilled: 0, selfPayCollected: 0 }
      agg.set(provider, a)
    }
    a.sessions += 1

    const isSelfPay = roster.has(norm(r.client))
    if (isSelfPay) {
      // Only kept clients (positive aggregate) contribute, matching SOSA.
      // A net-negative client (pure refund) is dropped entirely so no
      // provider shows negative self-pay collected.
      if (keptSelfPay.has(norm(r.client))) {
        a.selfPayCollected += r.paid
      }
    } else if (hasBilledCode(r.code)) {
      // insurance + real CPT -> bill at the rate (Total Fee)
      a.insuranceBilled += r.fee
    } else {
      // insurance + no-show / internal code -> insurance never pays it; use Paid
      a.insuranceBilled += r.paid
    }

    const ts = parseRowDate(r.date)
    if (ts !== null) {
      if (ts < minTs) minTs = ts
      if (ts > maxTs) maxTs = ts
    }
  }

  // Date span -> monthly scaling factor. Single-day (or no parsable dates)
  // caps factor at 30.44 so a one-day CSV doesn't divide by zero.
  let spanDays = 1
  if (Number.isFinite(minTs) && Number.isFinite(maxTs) && maxTs >= minTs) {
    spanDays = Math.floor((maxTs - minTs) / MS_PER_DAY) + 1
  }
  const factor = spanDays >= 27 ? 1 : DAYS_PER_MONTH / spanDays

  const providers: ProviderRevenue[] = []
  for (const [name, a] of agg) {
    const revenueTotal = a.insuranceBilled + a.selfPayCollected
    const summary = payByName.get(name)
    const ownerNoPayroll = !summary
    const isBret = name === 'Bret Boatwright'
    const pay = summary ? summary.sessionPay : 0
    const supeCost = summary && !isBret ? summary.supervisionForBret : 0
    const net = revenueTotal - pay - supeCost
    providers.push({
      name,
      sessions: a.sessions,
      insuranceBilled: round2(a.insuranceBilled),
      selfPayCollected: round2(a.selfPayCollected),
      revenueTotal: round2(revenueTotal),
      estMonthly: round2(revenueTotal * factor),
      pay: round2(pay),
      supeCost: round2(supeCost),
      net: round2(net),
      margin: revenueTotal > 0 ? net / revenueTotal : 0,
      ownerNoPayroll,
      supeIncome: isBret ? round2(bretSupeIncome) : 0,
    })
  }

  providers.sort((x, y) => y.revenueTotal - x.revenueTotal)

  const totalsRaw = providers.reduce(
    (t, p) => {
      t.sessions += p.sessions
      t.insuranceBilled += p.insuranceBilled
      t.selfPayCollected += p.selfPayCollected
      t.revenueTotal += p.revenueTotal
      t.pay += p.pay
      t.supeCost += p.supeCost
      t.net += p.net
      return t
    },
    { sessions: 0, insuranceBilled: 0, selfPayCollected: 0, revenueTotal: 0, pay: 0, supeCost: 0, net: 0 }
  )

  const totals: RevenueTotals = {
    sessions: totalsRaw.sessions,
    insuranceBilled: round2(totalsRaw.insuranceBilled),
    selfPayCollected: round2(totalsRaw.selfPayCollected),
    revenueTotal: round2(totalsRaw.revenueTotal),
    estMonthly: round2(totalsRaw.revenueTotal * factor),
    pay: round2(totalsRaw.pay),
    supeCost: round2(totalsRaw.supeCost),
    net: round2(totalsRaw.net),
    margin: totalsRaw.revenueTotal > 0 ? totalsRaw.net / totalsRaw.revenueTotal : 0,
  }

  return { providers, totals, spanDays, factor }
}
