import type { ClientPaymentRow } from './csv-parser'

/**
 * SOSA billing-fee check.
 *
 * Per the Service Agreement Section 3(a), SOSA's 8% fee applies only to billables
 * tied to a claim they filed (insurance payments + copays/coinsurance/deductibles).
 * Self-pay clients (no claim) are NOT in the base. SOSA bills 8% on gross
 * collections, sweeping in self-pay money. This quantifies the overcharge from the
 * uploaded SimplePractice CSV + the scraped self-pay roster.
 */

export const SOSA_FEE_RATE = 0.08

export interface SosaClientLine {
  client: string
  paid: number
}

export interface SosaResult {
  totalCollected: number          // all client-paid $ in the CSV
  selfPayCollected: number        // self-pay client $ (not fee-eligible)
  overcharge: number              // 8% of selfPayCollected
  disputable: SosaClientLine[]    // self-pay clients who paid, desc
  driftNew: SosaClientLine[]      // paid full fee every session but NOT in roster -> verify
  matchedCount: number
  rosterSize: number
}

export function norm(s: string): string {
  return s.toLowerCase().trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
}

export function computeSosa(rows: ClientPaymentRow[], selfPayNames: string[]): SosaResult {
  const roster = new Set(selfPayNames.map(norm))

  // Aggregate per client.
  const agg = new Map<string, { paid: number; copayRows: number; rows: number }>()
  for (const r of rows) {
    const a = agg.get(r.client) || { paid: 0, copayRows: 0, rows: 0 }
    a.paid += r.paid
    a.rows += 1
    if (r.fee > 0 && r.charge < r.fee - 0.01) a.copayRows += 1
    agg.set(r.client, a)
  }

  let totalCollected = 0
  let selfPayCollected = 0
  const disputable: SosaClientLine[] = []
  const driftNew: SosaClientLine[] = []

  for (const [client, a] of agg) {
    if (a.paid <= 0) continue
    totalCollected += a.paid
    const inRoster = roster.has(norm(client))
    if (inRoster) {
      selfPayCollected += a.paid
      disputable.push({ client, paid: a.paid })
    } else if (a.copayRows === 0) {
      // full fee every session but not flagged self-pay -> maybe new self-pay
      driftNew.push({ client, paid: a.paid })
    }
  }

  disputable.sort((x, y) => y.paid - x.paid)
  driftNew.sort((x, y) => y.paid - x.paid)

  return {
    totalCollected: round2(totalCollected),
    selfPayCollected: round2(selfPayCollected),
    overcharge: round2(selfPayCollected * SOSA_FEE_RATE),
    disputable,
    driftNew,
    matchedCount: disputable.length,
    rosterSize: selfPayNames.length,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
