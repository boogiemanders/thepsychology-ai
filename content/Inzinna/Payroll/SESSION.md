# Payroll Research — Session Handoff

> Last updated: 2026-04-10

## What This Is

Planning and research workspace for an Inzinna payroll-prep automation tool centered on session-based clinician compensation and payroll reconciliation.

## Current Status

- Folder scaffold exists
- Market framing document exists
- Shared research plan created
- Draft workflow, interview guide, rules matrix, field map, exception taxonomy, product brief, and test cases created
- A canonical Carlos build plan now exists in `CARLOS-BUILD-PLAN.md`
- No code or live integrations have been built yet

## Current Product Assumption

The likely product path is:

1. a **Google Sheets AI optimization version** as the first usable prototype and demo
2. a later **audit-friendly payroll preparation layer** if the sheet proves the workflow

The likely sheet-first product should:
- ingest source activity
- normalize it into a pay-period ledger
- apply compensation rules
- surface exceptions
- produce a Justworks-ready daily-hours handoff

It is not a replacement payroll provider.

## What Still Needs Validation

- Actual source systems used for payroll prep
- Exact compensation model(s) by clinician type
- Whether pay is tied to scheduled sessions, completed sessions, notes, claims, collections, or a hybrid
- Which exception types truly block payroll
- What Carlos considers the minimum trustworthy export

## Recommended Next Step

Use `INTERVIEW-GUIDE.md` plus one real pay-period artifact set to turn the assumed workflow and rule matrix into confirmed operating logic, then define the Google Sheets demo tabs and outputs.
