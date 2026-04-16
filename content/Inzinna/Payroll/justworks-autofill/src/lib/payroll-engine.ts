import type { SessionRow, ClinicianSummary, PayrollResult, PayrollResultWithHours, JustWorksFillData, DailyHours, PendingSessionStatus } from './types'
import { getPayRate, getCodeDurationMinutes } from './compensation-legend'

/**
 * Process parsed CSV rows into per-clinician pay summaries.
 * Mirrors payroll-calc.py main() logic.
 */
export function calculatePayroll(rows: SessionRow[]): PayrollResult {
  const byClinicianMap = new Map<string, ClinicianSummary>()

  for (const row of rows) {
    if (!byClinicianMap.has(row.clinician)) {
      byClinicianMap.set(row.clinician, {
        name: row.clinician,
        sessionPay: 0,
        supervisionTotal: 0,
        supervisionForBret: 0,
        sessionCount: 0,
        rows: [],
      })
    }

    const summary = byClinicianMap.get(row.clinician)!
    const { pay, supervisionValue } = getPayRate(
      row.clinician,
      row.billingCode,
      row.ratePerUnit
    )

    if (pay !== null) {
      summary.sessionPay += pay
    }
    summary.supervisionTotal += supervisionValue
    summary.sessionCount++
    const codes = row.billingCode.split('\n').map(c => c.trim()).filter(Boolean)
    const durationMinutes = codes.reduce((sum, c) => sum + getCodeDurationMinutes(c), 0)

    summary.rows.push({
      date: row.dateOfService,
      client: row.client,
      code: row.billingCode,
      pay,
      supervisionValue,
      durationMinutes,
    })
  }

  // Calculate Bret's supervision pay from supervisees
  const izzySupeTotal = byClinicianMap.get('Isabelle Feinstein')?.supervisionTotal ?? 0
  const carlosSupeTotal = byClinicianMap.get('Juan Carlos Espinal')?.supervisionTotal ?? 0
  const karenSupeTotal = byClinicianMap.get('Karen Terry')?.supervisionTotal ?? 0

  const supervisionFromIzzy = izzySupeTotal * 0.05
  const supervisionFromCarlos = carlosSupeTotal * 0.05
  const supervisionFromKaren = karenSupeTotal * 0.05
  const totalSupervision = supervisionFromIzzy + supervisionFromCarlos + supervisionFromKaren

  // Tag supervision amounts on supervisees
  for (const [name, summary] of byClinicianMap) {
    if (summary.supervisionTotal > 0) {
      summary.supervisionForBret = summary.supervisionTotal * 0.05
    }
  }

  const bretSessionPay = byClinicianMap.get('Bret Boatwright')?.sessionPay ?? 0

  const clinicians = Array.from(byClinicianMap.values()).sort(
    (a, b) => a.name.localeCompare(b.name)
  )

  return {
    clinicians,
    bretFullCalc: {
      sessionPay: bretSessionPay,
      supervisionFromIzzy,
      supervisionFromCarlos,
      supervisionFromKaren,
      totalSupervision,
      grandTotal: bretSessionPay + totalSupervision,
    },
  }
}

/**
 * Extended calculation that adds JustWorks fill data:
 * - Actual hours per day from billing code durations
 * - Adjusted hourly rate so rate * hours = exact total pay
 * - Minute nudges (+/- 1-2 min) to compensate for rounding
 */
export function calculatePayrollWithHours(rows: SessionRow[]): PayrollResultWithHours {
  const baseResult = calculatePayroll(rows)

  const fillData: JustWorksFillData[] = baseResult.clinicians.map(clinician => {
    const totalPay = clinician.name === 'Bret Boatwright'
      ? baseResult.bretFullCalc.grandTotal
      : clinician.sessionPay

    // Group sessions by date
    const byDate = new Map<string, { totalMinutes: number; sessionCount: number }>()
    for (const row of clinician.rows) {
      const existing = byDate.get(row.date) || { totalMinutes: 0, sessionCount: 0 }
      existing.totalMinutes += row.durationMinutes
      existing.sessionCount += 1
      byDate.set(row.date, existing)
    }

    const dailyBreakdown: DailyHours[] = Array.from(byDate.entries())
      .map(([date, data]) => ({
        date,
        dayOfWeek: getDayOfWeek(date),
        totalMinutes: data.totalMinutes,
        sessionCount: data.sessionCount,
      }))
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())

    const rawTotalMinutes = dailyBreakdown.reduce((s, d) => s + d.totalMinutes, 0)

    if (rawTotalMinutes === 0 || totalPay === 0) {
      return {
        clinicianName: clinician.name,
        totalPay,
        totalMinutes: rawTotalMinutes,
        adjustedHourlyRate: 0,
        dailyBreakdown,
        minuteAdjustment: 0,
      }
    }

    // Find the best rate + minute combo that lands exactly on totalPay
    const { adjustedRate, finalMinutes, nudge } = findExactMatch(totalPay, rawTotalMinutes)

    // Apply minute nudge to the last day
    if (nudge !== 0 && dailyBreakdown.length > 0) {
      dailyBreakdown[dailyBreakdown.length - 1].totalMinutes += nudge
    }

    return {
      clinicianName: clinician.name,
      totalPay,
      totalMinutes: finalMinutes,
      adjustedHourlyRate: adjustedRate,
      dailyBreakdown,
      minuteAdjustment: nudge,
    }
  })

  return { ...baseResult, fillData }
}

/**
 * Apply a manual hours+rate addition to a clinician after-the-fact.
 * Used for things like didactic/fusion that aren't in the SimplePractice CSV.
 *
 * The date (MM/DD/YYYY) determines where the hours land in the daily breakdown
 * -- if a matching day exists, minutes are merged; otherwise a new day is inserted.
 * Without a correct date, JustWorks can't place the hours in the right column.
 *
 * Returns a new result with the clinician's sessionPay, rows, and fillData updated.
 */
export function applyManualAddition(
  result: PayrollResultWithHours,
  clinicianName: string,
  hours: number,
  rate: number,
  label: string,
  date: string
): PayrollResultWithHours {
  if (hours <= 0 || rate <= 0 || !date) return result

  const clone: PayrollResultWithHours = JSON.parse(JSON.stringify(result))
  const clinician = clone.clinicians.find(c => c.name === clinicianName)
  const fill = clone.fillData.find(f => f.clinicianName === clinicianName)
  if (!clinician || !fill) return result

  const addedMinutes = Math.round(hours * 60)
  const addedPay = Math.round(hours * rate * 100) / 100

  clinician.sessionPay += addedPay
  clinician.sessionCount += 1
  clinician.rows.push({
    date,
    client: label,
    code: label.toUpperCase(),
    pay: addedPay,
    supervisionValue: 0,
    durationMinutes: addedMinutes,
  })

  // Strip old nudge from the last day (where it was applied by the initial calc)
  if (fill.minuteAdjustment !== 0 && fill.dailyBreakdown.length > 0) {
    fill.dailyBreakdown[fill.dailyBreakdown.length - 1].totalMinutes -= fill.minuteAdjustment
  }

  // Merge into existing day if date matches, else insert + resort
  const existing = fill.dailyBreakdown.find(d => d.date === date)
  if (existing) {
    existing.totalMinutes += addedMinutes
    existing.sessionCount += 1
  } else {
    fill.dailyBreakdown.push({
      date,
      dayOfWeek: getDayOfWeek(date),
      totalMinutes: addedMinutes,
      sessionCount: 1,
    })
    fill.dailyBreakdown.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
  }

  // Recompute from clean totals
  const newRawMinutes = fill.dailyBreakdown.reduce((s, d) => s + d.totalMinutes, 0)
  const newTotalPay = Math.round((fill.totalPay + addedPay) * 100) / 100

  const { adjustedRate, finalMinutes, nudge } = findExactMatch(newTotalPay, newRawMinutes)

  fill.totalPay = newTotalPay
  fill.totalMinutes = finalMinutes
  fill.adjustedHourlyRate = adjustedRate
  fill.minuteAdjustment = nudge

  // Apply new nudge to last day
  if (nudge !== 0) {
    fill.dailyBreakdown[fill.dailyBreakdown.length - 1].totalMinutes += nudge
  }

  return clone
}

/**
 * Apply a pending session (code-based, with confirmation status) to a clinician.
 * Used for sessions not yet in the SimplePractice CSV — e.g. Emily's Friday
 * sessions when Carlos runs payroll Friday morning. Carlos toggles each at
 * end of Friday: completed (pay CPT rate), no-show (pay no-show rate),
 * pending (treat as completed for optimistic preview).
 *
 * Returns a new result with the clinician's sessionPay, rows, and fillData updated.
 */
export function applyPendingSession(
  result: PayrollResultWithHours,
  clinicianName: string,
  dateCsv: string,     // MM/DD/YYYY
  client: string,
  code: string,
  status: PendingSessionStatus
): PayrollResultWithHours {
  if (!dateCsv || !client || !code) return result

  // no-show → compute pay via '00001' lookup; pending/completed → use actual code
  const effectiveCode = status === 'no-show' ? '00001' : code
  const { pay } = getPayRate(clinicianName, effectiveCode)
  if (pay === null || pay === 0) return result

  const durationMinutes = status === 'no-show' ? 0 : getCodeDurationMinutes(code)

  const clone: PayrollResultWithHours = JSON.parse(JSON.stringify(result))
  const clinician = clone.clinicians.find(c => c.name === clinicianName)
  const fill = clone.fillData.find(f => f.clinicianName === clinicianName)

  // If the clinician wasn't in the base result (e.g. no CSV rows this week),
  // seed a summary + fill entry so pending sessions still compute.
  let clinicianRef = clinician
  let fillRef = fill
  if (!clinicianRef) {
    clinicianRef = {
      name: clinicianName,
      sessionPay: 0,
      supervisionTotal: 0,
      supervisionForBret: 0,
      sessionCount: 0,
      rows: [],
    }
    clone.clinicians.push(clinicianRef)
    clone.clinicians.sort((a, b) => a.name.localeCompare(b.name))
  }
  if (!fillRef) {
    fillRef = {
      clinicianName,
      totalPay: 0,
      totalMinutes: 0,
      adjustedHourlyRate: 0,
      dailyBreakdown: [],
      minuteAdjustment: 0,
    }
    clone.fillData.push(fillRef)
  }

  const statusTag = status === 'completed' ? '' : ` (${status})`
  clinicianRef.sessionPay += pay
  clinicianRef.sessionCount += 1
  clinicianRef.rows.push({
    date: dateCsv,
    client: `${client}${statusTag}`,
    code: effectiveCode,
    pay,
    supervisionValue: 0,
    durationMinutes,
  })

  // Strip old nudge before merging
  if (fillRef.minuteAdjustment !== 0 && fillRef.dailyBreakdown.length > 0) {
    fillRef.dailyBreakdown[fillRef.dailyBreakdown.length - 1].totalMinutes -= fillRef.minuteAdjustment
  }

  const existing = fillRef.dailyBreakdown.find(d => d.date === dateCsv)
  if (existing) {
    existing.totalMinutes += durationMinutes
    existing.sessionCount += 1
  } else {
    fillRef.dailyBreakdown.push({
      date: dateCsv,
      dayOfWeek: getDayOfWeek(dateCsv),
      totalMinutes: durationMinutes,
      sessionCount: 1,
    })
    fillRef.dailyBreakdown.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
  }

  const newRawMinutes = fillRef.dailyBreakdown.reduce((s, d) => s + d.totalMinutes, 0)
  const newTotalPay = Math.round((fillRef.totalPay + pay) * 100) / 100

  if (newRawMinutes === 0 || newTotalPay === 0) {
    fillRef.totalPay = newTotalPay
    fillRef.totalMinutes = newRawMinutes
    fillRef.adjustedHourlyRate = 0
    fillRef.minuteAdjustment = 0
    return clone
  }

  const { adjustedRate, finalMinutes, nudge } = findExactMatch(newTotalPay, newRawMinutes)

  fillRef.totalPay = newTotalPay
  fillRef.totalMinutes = finalMinutes
  fillRef.adjustedHourlyRate = adjustedRate
  fillRef.minuteAdjustment = nudge

  if (nudge !== 0) {
    fillRef.dailyBreakdown[fillRef.dailyBreakdown.length - 1].totalMinutes += nudge
  }

  return clone
}

/**
 * Find rate + minute nudge where rate * (minutes/60) = totalPay exactly.
 *
 * Math: we need rateCents * minutes = totalPay * 6000 (all integers).
 * Search outward from rawMinutes for a divisor that works.
 * Tries +/-30 minutes and both floor/ceil rounding on rate.
 */
export function findExactMatch(totalPay: number, rawMinutes: number): {
  adjustedRate: number
  finalMinutes: number
  nudge: number
} {
  const target = Math.round(totalPay * 100)  // totalPay in cents

  for (let n = 0; n <= 30; n++) {
    for (const sign of (n === 0 ? [0] : [1, -1])) {
      const nudge = n * (sign || 1)
      const minutes = rawMinutes + nudge
      if (minutes <= 0) continue

      const hours = minutes / 60

      // Try both floor and ceil rounding of rate
      const exactRate = totalPay / hours
      const rateFloor = Math.floor(exactRate * 100) / 100
      const rateCeil = Math.ceil(exactRate * 100) / 100

      for (const rate of [rateFloor, rateCeil]) {
        const computed = Math.round(rate * hours * 100)
        if (computed === target) {
          return { adjustedRate: rate, finalMinutes: minutes, nudge }
        }
      }
    }
  }

  // Fallback: use raw minutes, nearest-rounded rate
  const hours = rawMinutes / 60
  const rate = Math.round((totalPay / hours) * 100) / 100
  return { adjustedRate: rate, finalMinutes: rawMinutes, nudge: 0 }
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/')
  return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
}

function getDayOfWeek(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
}
