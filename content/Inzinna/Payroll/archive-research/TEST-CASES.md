# Payroll Research — Test Cases And Scenarios

> Last updated: 2026-04-09

These scenarios define what the reconciliation layer must handle before implementation should be considered trustworthy.

| Scenario | Setup | Expected ledger behavior | Expected exception behavior |
| --- | --- | --- | --- |
| Completed intake session | One intake session completed in pay period | Create one payable row with intake-specific rule id | No exception if required source fields exist |
| Completed follow-up session | One follow-up session completed in pay period | Create one payable row with follow-up rule id | No exception if required source fields exist |
| Late cancel vs same-day cancel vs no-show | Three sessions with distinct final statuses and timestamps | Apply different row logic by policy bucket | Flag if status or timing data is insufficient |
| Session crosses pay periods | Session scheduled in period A, completed in period B | Anchor row to the confirmed payroll rule date | Review exception if rule date is ambiguous |
| Mid-period rate change | Clinician compensation changes effective mid-cycle | Rows before and after effective date use different rule ids | Review exception if effective date or worker model is unclear |
| Group or shared-service compensation | One clinician runs a group session or shared event | Create row using group/shared rule logic | Review exception if attendee count or allocation basis is missing |
| Supervision or admin time | Non-session work is compensable | Create adjustment or non-session ledger row with category-specific rule | Review exception if supporting log is missing |
| Retro adjustment after denial or refund | Prior period row needs correction | Create offsetting or corrective adjustment row tied to prior period | Review exception until reason and amount are confirmed |
| Missing or inconsistent source data | Session lacks CPT, provider, status, or documentation | Do not calculate silently | Blocking exception with clear owner |
| Duplicate source row | Same session imported twice | Prevent duplicate pay | Blocking exception until duplicate is resolved |

## Core Acceptance Checks

- Every exported amount is traceable to a row and a rule
- Every override has a reason
- Rows with missing critical data do not silently compute
- Per-clinician totals equal the sum of approved row amounts plus approved adjustments
