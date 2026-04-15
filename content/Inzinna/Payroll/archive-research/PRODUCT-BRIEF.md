# Payroll Research — v1 Product Brief

> Last updated: 2026-04-10

## Product Summary

Build an internal payroll-prep and reconciliation tool for Inzinna that converts pay-period clinical activity into a clean, explainable ledger plus a Justworks-ready daily hours handoff for Carlos to review and verify.

Near-term delivery path: start with a Google Sheets-based AI optimization version that serves as the first demo and validates the workflow before a heavier product build.

## Problem

The practice likely has source activity in one system, compensation logic in a spreadsheet, and final payroll in a different system. That creates four recurring problems:

- too much manual reconciliation
- too many exception cases
- not enough explainability when a clinician asks why they were paid a certain amount
- a mismatch between code-based pay logic and a downstream payroll system that wants one annual hourly rate plus daily hours entry

## Primary User

Carlos, as the operational owner closest to payroll preparation and reconciliation.

Secondary users:
- Greg for policy and overrides
- admin or billing staff for source corrections
- clinicians as recipients of clearer compensation explanations

## Jobs To Be Done

- Import pay-period source activity
- Normalize rows into one reviewable format
- Calculate exact hours and pay using code-based rate logic
- Separate clean rows from exception rows
- Approve or override rows with clear reasoning
- Produce a Justworks-ready daily hours handoff downstream

## v1 Scope

### In scope
- Pay-period imports from source reports
- Line-item ledger generation
- Rule application
- Daily hour rollups by worker and date
- Exception queue
- Per-clinician summary
- Approval state
- Downstream Justworks handoff format

### Likely v0 before v1
- Google Sheets workbook as the first operating surface
- structured tabs for import, rates, calculations, exceptions, daily rollups, and final handoff
- AI-assisted checks or explanations aimed at reducing manual spreadsheet work
- a demo that proves Carlos can mostly review and verify instead of rebuilding payroll math

### Out of scope
- Running payroll
- Tax filing or withholding
- Benefits administration
- Direct deposit
- Replacing the payroll provider

## Draft Ledger Interface

```ts
type PayrollLedgerRow = {
  pay_period_id: string
  clinician_id: string
  clinician_name: string
  session_id?: string
  client_reference?: string
  session_date?: string
  service_type?: string
  service_code?: string
  status: string
  payer?: string
  units?: number
  rate_rule_id: string
  base_rate?: number
  gross_comp: number
  equivalent_hours_for_payroll?: number
  adjustment_reason?: string
  exception_flag: boolean
  exception_type?: string
  approval_status: 'pending' | 'approved' | 'overridden' | 'held'
}
```

## Required Outputs

- **Per-clinician summary:** total gross compensation for the period plus exception count
- **Line-item ledger:** one row per pay-driving event or approved adjustment
- **Rate and hours breakdown:** exact sessions, hours, code-based rates, and computed pay
- **Exception queue:** unresolved rows grouped by exception type and owner
- **Approval view:** what is approved, overridden, or held
- **Justworks handoff:** per-worker, per-day hours in the format Carlos needs to enter or verify downstream

## Demo Definition

The first demo should be a Google Sheets workflow that shows:

1. source import from the SimplePractice export
2. automatic code-based pay and hours calculation
3. exception surfacing inside the sheet
4. per-day Justworks handoff numbers ready for review

## Design Principles

- Explain every dollar with a source row or approved adjustment
- Minimize PHI in payroll-facing outputs
- Keep rules visible and editable, not buried in formulas
- Treat exceptions as first-class workflow objects
- Make Justworks the final verification step, not the place where payroll math is rebuilt

## Success Criteria

- Carlos can reconstruct a clinician total from ledger rows without side calculations
- Carlos can see how exact code-based pay translates into the daily hours that must be entered in Justworks
- Clean rows can be approved without row-by-row manual inspection
- Exception rows are isolated before final payroll prep
- The downstream Justworks handoff can be produced without rebuilding totals manually
- The Google Sheets demo is useful enough that Carlos would rather verify outputs than keep manually rebuilding them
