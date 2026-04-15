# Payroll Research — Compensation Rules Matrix

> Last updated: 2026-04-10

This matrix is a rule inventory to validate with Carlos and Greg. We now know Carlos has code-based hourly rates available, but we still need to confirm where that logic is pure lookup versus where exceptions or overrides apply.

## Session-Based Compensation

| Worker / role | Event type | Candidate ledger trigger | Candidate pay basis to validate | Required source fields | Validation status |
| --- | --- | --- | --- | --- | --- |
| Clinician | Completed intake session | Session marked completed for pay period | Hourly rate by code, unless exceptions exist | clinician, session_id, date, CPT/service type, status, units | Partial |
| Clinician | Completed follow-up session | Session marked completed for pay period | Hourly rate by code, unless exceptions exist | clinician, session_id, date, CPT/service type, status, units | Partial |
| Clinician | Group session | Group encounter completed | Per attendee, per group, or flat group rate | clinician, session_id/group_id, date, status, units, attendee count | Needs Carlos |
| Clinician | Late cancel | Cancellation inside policy window | Partial pay, no pay, or same as attended | clinician, session_id, cancel timestamp, policy window | Needs Carlos |
| Clinician | Same-day cancel | Cancellation same day | Partial pay or no pay | clinician, session_id, cancel timestamp, policy window | Needs Carlos |
| Clinician | No-show | Client marked no-show | Partial pay, full pay, or no pay | clinician, session_id, status, payer/policy flag | Needs Carlos |
| Clinician | Rescheduled session | Session moved across dates or periods | Pay tied to final completed date or original scheduled date | original date, final date, status history | Needs Carlos |
| Clinician | Therapist swap / reassignment | Provider on appointment changes | Pay follows servicing clinician, assigned clinician, or manual override | original provider, final provider, note owner | Needs Carlos |

## Non-Session Compensation

| Worker / role | Event type | Candidate ledger trigger | Candidate pay basis to validate | Required source fields | Validation status |
| --- | --- | --- | --- | --- | --- |
| Supervisor | Supervision hour | Approved supervision log | Hourly or fixed per supervisee/session | supervisor, supervisee, date, duration | Needs Carlos |
| Clinician | Admin time | Approved non-session time entry | Hourly or flat stipend | clinician, date, duration, category | Needs Carlos |
| Clinician | Training / meeting time | Approved attendance or time log | Hourly, stipend, or unpaid | clinician, date, duration, category | Needs Carlos |
| Practice staff | Bonus / incentive | Manual adjustment or policy rule | Flat amount or calculated bonus | worker, period, amount, reason | Needs Carlos |
| Practice staff | Mileage / reimbursement | Approved reimbursement request | Exact pass-through reimbursement | worker, date, amount, reason | Needs Carlos |
| Practice staff | Retro adjustment | Correction from prior period | Positive or negative manual adjustment | worker, prior period, amount, reason | Needs Carlos |

## Policy Questions To Resolve

- Are clinicians always paid using hourly rate by code, or are there clinician-, payer-, or context-specific overrides?
- Are clinicians paid on completed sessions, signed notes, submitted claims, collected revenue, or a hybrid?
- Once code-based pay is calculated, how is it converted into Justworks-ready daily hours for a worker who only has one annual hourly rate there?
- Do different clinician types use different compensation models?
- Are late cancels and no-shows paid differently by payer, clinician, or policy date?
- Can a row be paid with missing documentation, or must it be held?
- Who has authority to override a rule and how is that override recorded?
