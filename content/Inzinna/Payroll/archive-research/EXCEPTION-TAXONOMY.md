# Payroll Research — Exception Taxonomy

> Last updated: 2026-04-09

The purpose of this taxonomy is to separate clean rows from rows that need human review before payroll is finalized.

## Severity Model

- `Blocking` — row should not export until resolved or explicitly overridden
- `Review` — row can be reviewed and overridden by an authorized user
- `Informational` — row should be visible for audit but does not stop export

## Exception Types

| Exception type | Example | Severity | Likely resolution owner | Expected tool behavior |
| --- | --- | --- | --- | --- |
| Missing documentation | Session appears attended but required note/signoff is missing | Blocking | Clinician or admin | Hold row and show missing requirement |
| Status mismatch | Appointment shows completed in one place and canceled in another | Blocking | Admin / Carlos | Hold row until source of truth is confirmed |
| Provider attribution conflict | Therapist swap or reassignment is unclear | Blocking | Carlos / admin | Hold row and require provider confirmation |
| Missing service code or units | CPT or billable units absent | Blocking | Billing / admin | Hold row and request billing correction |
| Duplicate session row | Same encounter imported twice | Blocking | Carlos | Prevent double pay and require merge/remove decision |
| Cross-period reschedule | Session moved from one pay period into another | Review | Carlos | Surface original and final dates for decision |
| Mid-period rate change | Clinician comp model changes inside pay period | Review | Greg / Carlos | Split affected rows by effective date |
| Late cancel policy ambiguity | Cancellation exists but timing/policy bucket is unclear | Review | Carlos | Require policy selection before export |
| Retro denial / refund | Prior paid row must be corrected after denial or refund | Review | Carlos / billing | Create negative or offset adjustment row |
| Manual adjustment without reason | Bonus or correction entered with no explanation | Review | Carlos / Greg | Require reason before approval |
| Non-session pay not linked to source log | Supervision or admin hours entered ad hoc | Review | Carlos / supervisor | Require attachment to a log or approval record |
| PHI overexposure | Export includes unnecessary patient-identifying data | Informational | Carlos / builder | Warn and prefer minimized export format |

## Suggested Resolution States

- `open`
- `needs-owner`
- `pending-source-fix`
- `ready-for-override`
- `resolved`
- `exported-with-override`

## Highest-Leverage Exceptions To Validate First

- Missing documentation
- Status mismatch
- Provider attribution conflict
- Duplicate rows
- Retro adjustments
