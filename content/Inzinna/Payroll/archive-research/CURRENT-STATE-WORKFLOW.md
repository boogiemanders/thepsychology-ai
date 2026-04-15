# Payroll Research — Current-State Workflow (Partially Confirmed)

> Last updated: 2026-04-10

This is the current payroll workflow based on partial confirmation. Some steps are now known, while downstream logic still needs validation with Carlos.

## Confirmed So Far

- Carlos downloads an Excel export from SimplePractice.
- Carlos edits a Google Sheet during payroll prep.
- Carlos knows the hourly rate associated with each billing or service code.
- Carlos then enters the final numbers into Justworks.
- Justworks requires hours to be entered by day.
- Each worker only has one hourly rate in Justworks for the year.

## Working Flow

| Step | System / artifact | Likely owner | Output | Questions / risk |
| --- | --- | --- | --- | --- |
| 1 | SimplePractice appointment calendar and encounter data | Clinicians + admin | Raw session activity | Is appointment status enough, or is note completion also required? |
| 2 | SimplePractice Excel export | Carlos | Pay-period source report | Which exact report is exported, and what fields are missing from it? |
| 3 | Google Sheet | Carlos | Cleaned and adjusted payroll working sheet | What edits are routine every pay period versus exception-only fixes? |
| 4 | Code-based rate logic in sheet | Carlos | Draft per-row pay values | Is the hourly rate determined only by code, or are there clinician/payer exceptions? |
| 5 | Hours and pay rollup by day | Carlos | Per-day hours plus per-row pay logic | How are mixed rates translated when Justworks only allows one annual hourly rate? |
| 6 | Manual adjustments added | Carlos and/or Greg | Corrected totals | Where are bonuses, supervision, admin time, and retro adjustments tracked? |
| 7 | Exception review | Carlos plus others | Resolved or deferred rows | Which exceptions block payroll versus allow override? |
| 8 | Per-clinician and per-day review | Carlos and/or Greg | Final hours and totals | Is approval row-level, day-level, or total-level? |
| 9 | Justworks manual entry | Carlos | Hours entered by day in payroll system | Is Justworks the only final entry point, and are there any non-hourly adjustment fields used? |
| 10 | Payroll provider runs payroll | External provider | Paychecks / direct deposit | Out of scope for v1 |
| 11 | Post-payroll corrections | Carlos | Retro adjustments for next cycle | How often do corrections occur, and why? |

## Likely Pain Points

- Source data does not arrive in a payroll-ready shape
- Compensation rules live partly in memory and partly in spreadsheets
- The pay logic may use multiple code-based rates while Justworks expects one annual hourly rate plus daily hours entry
- Exceptions are found late in the process
- It is hard to explain a clinician's total back to the underlying source rows
- Retro corrections create distrust and rework

## Future-State Direction

The likely target workflow is:

1. Import source activity for a pay period
2. Normalize rows into one ledger format
3. Calculate exact hours and pay by code
4. Roll approved rows into a daily-hours handoff for Justworks
5. Flag rows needing review
6. Approve clean rows and adjusted rows separately
7. Produce a Justworks-ready handoff downstream

## What Must Still Be Confirmed

- Exact SimplePractice report and required fields
- Whether claim/payment status affects compensation timing
- How code-based rates are converted into Justworks-ready daily hours
- Whether separate workflows exist for salaried staff, per-session staff, and admin staff
- Whether notes, signatures, or documentation completeness affect pay eligibility
