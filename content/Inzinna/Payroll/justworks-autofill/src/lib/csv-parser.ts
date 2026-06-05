import type { SessionRow } from './types'

/**
 * Parse SimplePractice appointment status CSV.
 * Expected columns: Date of Service, Client, Clinician, Billing Code, Rate per Unit
 * (columns F-L are ignored — Units through Unpaid)
 */
export function parseCSV(text: string): SessionRow[] {
  const lines = text.split('\n')
  if (lines.length < 2) return []

  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine)

  // Find column indices by name (case-insensitive, trimmed)
  const colMap: Record<string, number> = {}
  const targetCols = ['date of service', 'client', 'clinician', 'billing code', 'rate per unit']
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim().toLowerCase()
    if (targetCols.includes(h)) {
      colMap[h] = i
    }
  }

  const rows: SessionRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = parseCSVLine(line)
    const clinician = cols[colMap['clinician']]?.trim()
    if (!clinician || clinician === 'Gregory Inzinna') continue

    rows.push({
      dateOfService: cols[colMap['date of service']]?.trim() || '',
      client: cols[colMap['client']]?.trim() || '',
      clinician,
      billingCode: cols[colMap['billing code']]?.trim() || '',
      ratePerUnit: cols[colMap['rate per unit']]?.trim() || '',
    })
  }

  return rows
}

export interface ClientPaymentRow {
  client: string
  paid: number
  fee: number
  charge: number
  // Revenue view needs these — SOSA does not, so they're additive and safe.
  clinician: string
  date: string        // Date of Service, raw (MM/DD/YYYY HH:mm)
  code: string        // Billing Code, raw (may be multi-line, '\n'-joined)
}

/**
 * Parse per-row client payments from the same SimplePractice appointment CSV.
 * Unlike parseCSV (payroll), this keeps the money columns (Total Fee, Charge,
 * Paid) and does NOT drop Gregory's rows — SOSA's fee is on the whole practice's
 * collections, so every client who paid counts.
 */
export function parseClientPayments(text: string): ClientPaymentRow[] {
  const lines = text.split('\n')
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const idx: Record<string, number> = {}
  const want = ['client', 'total fee', 'charge', 'paid', 'clinician', 'date of service', 'billing code']
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim().toLowerCase()
    if (want.includes(h)) idx[h] = i
  }
  if (idx['client'] === undefined || idx['paid'] === undefined) return []

  const num = (s: string | undefined): number => {
    const n = parseFloat((s || '').replace(/[$,]/g, '').replace(/[()]/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  const out: ClientPaymentRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = parseCSVLine(line)
    const client = cols[idx['client']]?.trim()
    if (!client) continue
    out.push({
      client,
      paid: num(cols[idx['paid']]),
      fee: idx['total fee'] !== undefined ? num(cols[idx['total fee']]) : 0,
      charge: idx['charge'] !== undefined ? num(cols[idx['charge']]) : 0,
      clinician: idx['clinician'] !== undefined ? (cols[idx['clinician']]?.trim() || '') : '',
      date: idx['date of service'] !== undefined ? (cols[idx['date of service']]?.trim() || '') : '',
      code: idx['billing code'] !== undefined ? (cols[idx['billing code']]?.trim() || '') : '',
    })
  }
  return out
}

/**
 * Parse a single CSV line, handling quoted fields with commas and newlines.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}
