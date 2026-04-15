# Payroll Research — Source-To-Ledger Field Map

> Last updated: 2026-04-10

Design rule: the payroll ledger should be as explainable as possible while minimizing unnecessary PHI. Prefer stable IDs and short references over full client details in downstream outputs. The field model also has to support a downstream Justworks workflow that uses one annual hourly rate per worker and daily hours entry.

## Core Ledger Fields

| Ledger field | Purpose | Likely source | Notes / validation questions |
| --- | --- | --- | --- |
| `pay_period_id` | Unique pay-run reference | Payroll calendar or spreadsheet | Confirm whether periods are weekly, biweekly, semimonthly, or custom |
| `pay_period_start` | Period boundary | Payroll calendar | Must be authoritative and locked |
| `pay_period_end` | Period boundary | Payroll calendar | Must be authoritative and locked |
| `clinician_id` | Stable worker reference | Payroll roster or HR system | Avoid name-only joins |
| `clinician_name` | Human-readable review label | Payroll roster or source export | Review-only field |
| `session_id` | Stable row back-reference | SimplePractice appointment / encounter id | Confirm actual export field availability |
| `client_reference` | Audit reference with minimized PHI | SimplePractice client id, initials, or internal alias | Prefer not to export full patient name downstream |
| `session_date` | Date used for payroll logic | Appointment or encounter date | Confirm whether pay anchors to scheduled date or completed date |
| `scheduled_start_at` | Optional audit detail | Calendar export | Useful for no-show/cancel policy validation |
| `service_type` | Appointment/service label | SimplePractice export | May be different from CPT |
| `service_code` | Billing code / CPT | Encounter or billing export | Confirm whether code is always available at payroll-prep time |
| `status` | Pay-driving session status | Appointment / encounter export | Must normalize values like completed, canceled, no-show, rescheduled |
| `payer` | Insurance/self-pay context | Billing export or client billing profile | Needed only if compensation logic depends on payer |
| `units` | Quantity used in pay logic | CPT units or duration | Confirm if duration ever matters more than units |
| `duration_minutes` | Optional time detail | Calendar or encounter export | Useful if pay is time-based for some rows |
| `rate_rule_id` | Applied rule reference | Rules table | Critical for explainability |
| `base_rate` | Underlying rate before adjustments | Rules table or spreadsheet lookup | Might be flat, percentage, or hourly |
| `gross_comp` | Calculated pay amount for row | Reconciliation layer | Final computed value before payroll export |
| `payable_hours` | Exact hours attributable to the row | Reconciliation layer | Needed when pay is based on duration or hourly conversion |
| `work_date` | Date used for downstream daily entry | Session date or payroll rule date | Must support Justworks day-level entry |
| `justworks_rate` | Annual hourly rate configured downstream for worker | Payroll roster / Justworks setup | One per worker-year based on current understanding |
| `equivalent_hours_for_payroll` | Hours to enter downstream to represent approved pay | Reconciliation layer | Critical if code-based pay must be translated into Justworks hours |
| `adjustment_reason` | Manual or retro change note | Spreadsheet/manual adjustment log | Must be structured enough for audit |
| `exception_flag` | Indicates row needs review | Reconciliation layer | Boolean summary |
| `exception_type` | Why row needs review | Reconciliation layer | Use controlled taxonomy |
| `approval_status` | Review state | Reconciliation layer | Suggested states: pending, approved, overridden, held |
| `approved_by` | Final reviewer | Reconciliation layer | Optional but useful for audit |
| `approved_at` | Review timestamp | Reconciliation layer | Optional but useful for audit |
| `source_report` | Traceability to import | Import metadata | Helpful when multiple exports are combined |
| `export_batch_id` | Downstream handoff reference | Reconciliation layer | Useful for reruns and corrections |

## Supporting Tables Likely Needed

| Table / object | Purpose |
| --- | --- |
| Clinician roster | Map clinician names, ids, worker types, and comp models |
| Payroll calendar | Lock period boundaries and export batches |
| Rate rules | Store rate logic by clinician type and event type |
| Payroll rate roster | Store the Justworks hourly rate by worker-year |
| Manual adjustments | Track non-session and retro items |
| Exception log | Track unresolved rows and overrides |
| Daily rollups | Track approved hours by worker and date for downstream entry |

## High-Risk Mapping Questions

- Does SimplePractice expose a stable appointment id in the report Carlos actually uses?
- Are CPT/service codes finalized before payroll is prepared?
- Is there a reliable way to distinguish completed session, late cancel, same-day cancel, and no-show from exports alone?
- Where do non-session items live today if they are not in SimplePractice?
- What is the exact formula for converting multiple code-based rates into Justworks-ready daily hours when only one hourly rate exists downstream?
