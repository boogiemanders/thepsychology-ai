import type { PayrollResultWithHours } from './types'

/**
 * JustWorks bulk-hours import CSV.
 * Matches their official template exactly — one row per clinician per Sun-Sat week.
 * Ref: https://help.justworks.com/hc/en-us/articles/360004527771-Import-Hours
 */

interface EmployeeIdentity {
  firstName: string
  lastName: string
  email: string
}

// Pulled verbatim from JustWorks's downloaded template so First Name + Last Name
// match what's on each employee's record. Trailing space on "Carlos " is intentional:
// that's how it appears in JustWorks.
const EMPLOYEE_MAP: Record<string, EmployeeIdentity> = {
  'Anders Chan':         { firstName: 'Anders',   lastName: 'Chan',       email: 'dranders@drinzinna.com' },
  'Bret Boatwright':     { firstName: 'Bret',     lastName: 'Boatwright', email: 'bgboatpsyd@gmail.com' },
  'Emily Underwood':     { firstName: 'Emily',    lastName: 'Underwood',  email: 'etrachte@mail.yu.edu' },
  'Filomena DiFranco':   { firstName: 'Filomena', lastName: 'DiFranco',   email: 'filomenadifranco1@gmail.com' },
  'Isabelle Feinstein':  { firstName: 'Isabelle', lastName: 'Feinstein',  email: 'isf224@nyu.edu' },
  'Joelle Gill':         { firstName: 'Joelle',   lastName: 'Gill',       email: 'joelle@drinzinna.com' },
  'Juan Carlos Espinal': { firstName: 'Carlos ',  lastName: 'Espinal',    email: 'carlos@drinzinna.com' },
  'Karen Terry':         { firstName: 'Karen',    lastName: 'Terry',      email: 'karenterry38@icloud.com' },
  'Lorin Singh':         { firstName: 'Lorin',    lastName: 'Singh',      email: 'lorinsingh@myyahoo.com' },
  'Rachel Beyer':        { firstName: 'Rachel',   lastName: 'Beyer',      email: 'rachel@drinzinna.com' },
}

const HEADER = [
  'First Name',
  'Last Name',
  'Work Email',
  'Start Date',
  'End Date',
  'Pay Rate',
  'Regular Hours',
  'Paid Time Off Hours',
  'Overtime Hours',
  'Double Time Hours',
]

/** MM/DD/YYYY -> Date (local, no timezone shenanigans) */
function parseCsvDate(s: string): Date | null {
  const parts = s.split('/')
  if (parts.length !== 3) return null
  const m = parseInt(parts[0], 10)
  const d = parseInt(parts[1], 10)
  const y = parseInt(parts[2], 10)
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null
  return new Date(y, m - 1, d)
}

/** Date -> MM/DD/YYYY */
function formatCsvDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const y = date.getFullYear()
  return `${m}/${d}/${y}`
}

/** Sunday-of-week (local). JS Sunday = 0, so subtract getDay() days. */
function sundayOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  copy.setDate(copy.getDate() - copy.getDay())
  return copy
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  copy.setDate(copy.getDate() + days)
  return copy
}

/** Escape a single CSV field (quote only if needed). */
function csvField(value: string | number): string {
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function buildJustWorksCSV(result: PayrollResultWithHours): Blob {
  const lines: string[] = []
  lines.push(HEADER.map(csvField).join(','))

  for (const fill of result.fillData) {
    const identity = EMPLOYEE_MAP[fill.clinicianName]
    if (!identity) {
      console.warn(`[justworks-csv] skipping unknown clinician: ${fill.clinicianName}`)
      continue
    }
    if (fill.totalMinutes <= 0) continue

    // Bucket minutes by Sunday-of-week.
    const weekBuckets = new Map<string, { sunday: Date; minutes: number }>()
    for (const day of fill.dailyBreakdown) {
      if (day.totalMinutes <= 0) continue
      const dayDate = parseCsvDate(day.date)
      if (!dayDate) continue
      const sunday = sundayOfWeek(dayDate)
      const key = formatCsvDate(sunday)
      const existing = weekBuckets.get(key)
      if (existing) {
        existing.minutes += day.totalMinutes
      } else {
        weekBuckets.set(key, { sunday, minutes: day.totalMinutes })
      }
    }

    // Emit one row per week bucket, ordered by Sunday date.
    const sortedBuckets = Array.from(weekBuckets.values())
      .sort((a, b) => a.sunday.getTime() - b.sunday.getTime())

    const payRate = `$${fill.adjustedHourlyRate.toFixed(2)}`

    for (const bucket of sortedBuckets) {
      if (bucket.minutes <= 0) continue
      const regularHours = Math.round((bucket.minutes / 60) * 100) / 100
      const startDate = formatCsvDate(bucket.sunday)
      const endDate = formatCsvDate(addDays(bucket.sunday, 6))

      const row = [
        identity.firstName,
        identity.lastName,
        identity.email,
        startDate,
        endDate,
        payRate,
        regularHours.toString(),
        '', // Paid Time Off Hours
        '', // Overtime Hours
        '', // Double Time Hours
      ]
      lines.push(row.map(csvField).join(','))
    }
  }

  // CRLF line endings match the template and keep Excel happy on Windows.
  const body = lines.join('\r\n') + '\r\n'
  return new Blob([body], { type: 'text/csv;charset=utf-8' })
}

export function suggestJustWorksFilename(result: PayrollResultWithHours): string {
  let minIso = ''
  let maxIso = ''
  for (const cl of result.clinicians) {
    for (const r of cl.rows) {
      if (!r.date) continue
      const parts = r.date.split('/')
      if (parts.length !== 3) continue
      const iso = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
      if (!minIso || iso < minIso) minIso = iso
      if (!maxIso || iso > maxIso) maxIso = iso
    }
  }
  if (!minIso || !maxIso) {
    const today = new Date().toISOString().slice(0, 10)
    return `JustWorks ${today}.csv`
  }
  const fmt = (iso: string) => `${iso.slice(5, 7)}_${iso.slice(8, 10)}`
  return `JustWorks ${fmt(minIso)}-${fmt(maxIso)}.csv`
}
