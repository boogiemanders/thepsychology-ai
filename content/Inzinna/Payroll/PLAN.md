# Payroll Research — Shared Plan

> Last updated: 2026-04-10

## Goal

Define the smallest useful payroll-prep automation layer for Inzinna: a tool that turns session activity and related adjustments into a clean, auditable pay-period ledger for Carlos to review and export downstream.

## Working Product Assumption

- This is **not** a replacement for the payroll provider
- This is **not** tax filing, withholding, benefits, or direct deposit software
- V1 is a reconciliation layer between practice operations and the existing payroll engine
- The primary use case is **session-based clinician compensation**
- The immediate build path is likely a Google Sheets AI optimization version before any standalone app

## Research Questions

1. What is the real current payroll workflow from appointment data to final payroll entry?
2. Which compensation rules are deterministic, and which depend on human judgment?
3. Which exception types create the most rework or mistrust?
4. What minimum outputs would Carlos trust enough to stop doing parts of the process manually?
5. Which data lives in SimplePractice versus spreadsheets versus the payroll provider?

## Core Workstreams

### 1. Current-State Workflow Mapping
- Trace every handoff from session activity to payroll export
- Identify systems, owners, approvals, and manual adjustments
- Separate what is deterministic from what is policy-driven

### 2. Compensation Logic Interviews
- Capture rules by clinician role, session type, payer/event type, and special cases
- Confirm whether compensation is tied to scheduled sessions, completed sessions, collections, flat rates, or mixed logic
- Confirm how supervision, admin time, bonuses, and retro adjustments are handled

### 3. Exception Discovery
- Document failure points that stop or distort payroll
- Define which exceptions block payroll versus which can be overridden
- Assign an owner for each exception class

### 4. v1 Product Boundary
- Keep scope on ledger generation, exception handling, approval, and export
- Exclude filing payroll taxes, withholding, direct deposit, and replacing the payroll system of record

### 4A. Demo Path
- Start with a Google Sheets-first operating version
- Use the sheet to prove import, rate calculation, exception handling, and Justworks handoff
- Treat the sheet as the first demo, not a throwaway mockup

### 5. Output Design
- Per-clinician pay summary
- Line-item ledger
- Exception queue
- Approval state
- Export shape for downstream payroll entry

## Deliverables In This Folder

- `MARKET-RESEARCH.md` — market framing and vendor landscape
- `CURRENT-STATE-WORKFLOW.md` — assumed v0 workflow to validate
- `INTERVIEW-GUIDE.md` — stakeholder interview prompts and artifact requests
- `COMPENSATION-RULES-MATRIX.md` — rule inventory to confirm with Carlos
- `FIELD-MAP.md` — source-to-ledger field mapping
- `EXCEPTION-TAXONOMY.md` — error classes, owners, and handling
- `PRODUCT-BRIEF.md` — v1 product definition and ledger interface
- `TEST-CASES.md` — acceptance scenarios for the reconciliation layer
- `SESSION.md` — handoff and next-step summary

## Decisions Already Made

- Start from a **payroll-ready ledger**, not a payroll engine
- Assume SimplePractice plus spreadsheet reconciliation is the current source layer until proven otherwise
- Optimize for explainability: every dollar on payroll should be explainable by a ledger row or approved adjustment
- Minimize PHI in payroll outputs wherever possible
- Prefer a Sheets-first prototype for the first demo

## Next Sequence

1. Validate the assumed workflow with Carlos
2. Collect one real pay-period artifact set
3. Confirm compensation rules and approval logic
4. Convert assumptions in the rules matrix and field map into confirmed rules
5. Define the Google Sheets AI optimization version and demo flow
6. Prioritize a v1 workflow around the highest-friction exception classes
