import type { ClientRecord, BretInsurance } from './types'

/**
 * Parse SimplePractice "Client Details" report CSV.
 * We only keep what we need: name, insurance, primary clinician.
 * Address/phone/email/insurance ID are dropped at parse time so they never
 * touch chrome.storage.local — minimizes PHI footprint.
 *
 * Inactive clients are excluded.
 */
export function parseClientRoster(text: string): ClientRecord[] {
  const lines = text.split('\n')
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const colMap: Record<string, number> = {}
  for (let i = 0; i < headers.length; i++) {
    colMap[headers[i]] = i
  }

  const nameIdx = colMap['client']
  const insIdx = colMap['primary insurance']
  const clinIdx = colMap['primary clinician']
  const statusIdx = colMap['status']

  if (nameIdx === undefined || insIdx === undefined) return []

  const records: ClientRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const cols = parseCSVLine(line)

    const name = cols[nameIdx]?.trim() || ''
    if (!name) continue

    const status = statusIdx !== undefined ? (cols[statusIdx]?.trim().toLowerCase() || '') : ''
    if (status === 'inactive') continue

    const insuranceRaw = cols[insIdx]?.trim() || ''
    const primaryClinician = clinIdx !== undefined ? (cols[clinIdx]?.trim() || '') : ''

    records.push({
      name,
      insuranceRaw,
      insuranceNormalized: normalizeInsurance(insuranceRaw),
      primaryClinician,
    })
  }
  return records
}

/**
 * Map a free-text insurance string to Bret's binary picker.
 * United / UHC / Oxford / UMR -> 'united' (all UnitedHealthcare-family).
 * Aetna -> 'aetna'.
 * Anything else (Cigna, BCBS, Empire, Allied, etc.) -> null.
 */
export function normalizeInsurance(raw: string): BretInsurance | null {
  if (!raw) return null
  const r = raw.toLowerCase()
  if (r.includes('aetna')) return 'aetna'
  if (r.includes('united') || r.includes('uhc') || r.includes('oxford') || r.includes('umr')) {
    return 'united'
  }
  return null
}

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
      if (ch === '"') inQuotes = true
      else if (ch === ',') { result.push(current); current = '' }
      else current += ch
    }
  }
  result.push(current)
  return result
}
