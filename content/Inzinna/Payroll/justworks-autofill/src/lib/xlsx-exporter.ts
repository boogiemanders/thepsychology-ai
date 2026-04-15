import * as XLSX from 'xlsx'
import { legend } from './compensation-legend'
import type { PayrollResultWithHours, ClinicianSummary } from './types'

type Row = (string | number | { f: string } | null)[]

/**
 * Build a multi-sheet Excel workbook from the plugin's computed payroll.
 * Sheet 1 = Master (summary across clinicians).
 * Sheets 2..N = one tab per clinician, laid out like Carlos's existing per-clinician .xlsx files.
 */
export function buildPayrollWorkbook(result: PayrollResultWithHours): Blob {
  const wb = XLSX.utils.book_new()

  // --- Master sheet ---
  const masterRows: Row[] = [
    ['Clinician', 'Total Pay', 'JW Hourly Rate', 'Total Hours', 'Sessions', 'How the total was built'],
  ]
  const sorted = [...result.clinicians].sort((a, b) => a.name.localeCompare(b.name))
  for (const cl of sorted) {
    const fill = result.fillData.find(f => f.clinicianName === cl.name)
    if (!fill) continue
    const hours = Math.round((fill.totalMinutes / 60) * 100) / 100
    const note = cl.name === 'Bret Boatwright'
      ? 'Session pay (80% of billing) + 5% supervision from Izzy / Carlos / Karen'
      : `${cl.sessionCount} sessions from CSV + any manual additions`
    masterRows.push([cl.name, fill.totalPay, fill.adjustedHourlyRate, hours, cl.sessionCount, note])
  }
  const master = XLSX.utils.aoa_to_sheet(masterRows)
  master['!cols'] = [
    { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 9 }, { wch: 60 },
  ]
  XLSX.utils.book_append_sheet(wb, master, 'Master')

  // --- Per-clinician sheets ---
  for (const cl of sorted) {
    const sheet = buildClinicianSheet(cl, result)
    const tabName = sanitizeTabName(cl.name)
    XLSX.utils.book_append_sheet(wb, sheet, tabName)
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function buildClinicianSheet(cl: ClinicianSummary, result: PayrollResultWithHours): XLSX.WorkSheet {
  const rows: Row[] = []

  // Header row (matches Carlos's columns)
  rows.push(['Date of Service', 'Client', 'Clinician', 'Billing Code', 'Rate per Unit', 'Units'])

  // Session rows
  for (const r of cl.rows) {
    const units = Math.max(1, r.code.split('\n').filter(Boolean).length)
    const payValue: string | number = r.pay === null ? '' : r.pay
    rows.push([r.date || '', r.client, cl.name, r.code, payValue, units])
  }

  // Row numbers are 1-indexed in the spreadsheet
  const firstDataRow = 2
  const lastDataRow = 1 + cl.rows.length

  // Blank row
  rows.push([])

  // Totals block (starts in column E = index 4)
  if (cl.name === 'Bret Boatwright') {
    const b = result.bretFullCalc
    if (lastDataRow >= firstDataRow) {
      rows.push(['', '', '', '', { f: `SUM(E${firstDataRow}:E${lastDataRow})` }, '<Session pay (80% already applied)'])
    } else {
      rows.push(['', '', '', '', b.sessionPay, '<Session pay (80% already applied)'])
    }
    rows.push(['', '', '', '', b.supervisionFromIzzy, '<Izzy 5% supervision'])
    rows.push(['', '', '', '', b.supervisionFromCarlos, '<Carlos 5% supervision'])
    rows.push(['', '', '', '', b.supervisionFromKaren, '<Karen 5% supervision'])
    rows.push([])
    rows.push(['', '', '', '', b.grandTotal, '<On JustWorks (grand total)'])
  } else if (lastDataRow >= firstDataRow) {
    rows.push(['', '', '', '', { f: `SUM(E${firstDataRow}:E${lastDataRow})` }, '<On JustWorks (session pay)'])
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = [
    { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 32 },
  ]

  // Side legend (column H) for cpt_based / flat clinicians so Carlos can see rate sources
  const cfg = legend[cl.name]
  if (cfg) {
    const legendRows: Row[] = [['Rates:']]
    if (cfg.type === 'flat') {
      legendRows.push([`all CPT = $${cfg.rate}`])
    } else if (cfg.type === 'cpt_based') {
      for (const [code, rate] of Object.entries(cfg.rates)) {
        legendRows.push([`${code} = $${rate}`])
      }
      if (cfg.default !== undefined) legendRows.push([`default = $${cfg.default}`])
      if (cfg.overrides) {
        for (const [code, rate] of Object.entries(cfg.overrides)) {
          legendRows.push([`${code} override = $${rate}`])
        }
      }
    } else if (cfg.type === 'payer_dependent') {
      legendRows.push([cfg.note])
    }
    if (cfg.noShow) {
      for (const [code, rate] of Object.entries(cfg.noShow)) {
        legendRows.push([`${code} no-show = $${rate}`])
      }
    }
    if (cfg.manualRates) {
      for (const [kind, rate] of Object.entries(cfg.manualRates)) {
        legendRows.push([`${kind} = $${rate}`])
      }
    }
    XLSX.utils.sheet_add_aoa(sheet, legendRows, { origin: 'H1' })
  }

  return sheet
}

function sanitizeTabName(name: string): string {
  // Excel tab names: max 31 chars, no : \ / ? * [ ]
  return name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31)
}

/**
 * Suggested filename like "Payroll 03_22-04_04.xlsx" based on min/max dates in the data.
 */
export function suggestFilename(result: PayrollResultWithHours): string {
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
    return `Payroll ${today}.xlsx`
  }
  const fmt = (iso: string) => `${iso.slice(5, 7)}_${iso.slice(8, 10)}`
  return `Payroll ${fmt(minIso)}-${fmt(maxIso)}.xlsx`
}
