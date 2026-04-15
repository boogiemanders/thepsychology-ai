# Payroll Research — Interview Guide

> Last updated: 2026-04-09

## Interview Goal

Get from vague payroll pain to a concrete, reviewable compensation workflow. The objective is to learn the rule system and failure points, not just collect complaints about the current process.

## Stakeholders To Interview

### Carlos
- Primary workflow owner for payroll preparation and reconciliation
- Best source for the current state, exception pain, approval logic, and export requirements

### Greg
- Policy owner for pay models, override decisions, and practice-level compensation rules

### Billing / Admin Staff
- Best source for upstream data quality problems, missing documentation, and report extraction steps

### Clinicians
- Best source for trust issues: what they dispute, what they need explained, and what feels unfair or opaque

## Artifacts To Request

- One real pay-period spreadsheet used to prepare payroll
- The SimplePractice report(s) or export(s) used as input
- A redacted payroll export or handoff format sent to the downstream provider
- Any written compensation policy, fee split table, or rate sheet
- Examples of manual adjustments from a recent pay period
- Examples of disputed pay rows, if any

## Carlos Interview

### 1. Current Workflow
- Walk me through the last payroll cycle from the first source report to the final payroll entry.
- Which systems do you touch in order, every single pay period?
- Which parts are copy/paste, spreadsheet formulas, or manual judgment?
- Which step takes the most time?
- Which step makes you least confident that the totals are correct?

### 2. Compensation Logic
- What event actually triggers pay: scheduled session, attended session, signed note, submitted claim, paid claim, or something else?
- How do intake sessions differ from follow-ups?
- How are group sessions handled?
- How are late cancels, same-day cancels, and no-shows handled?
- Are different clinicians on different rate models?
- Are supervision, training, admin hours, or meetings compensated through the same workflow?

### 3. Exceptions And Rework
- What are the top 5 reasons a row cannot be finalized on first pass?
- What kinds of data are most often missing or wrong?
- Which exceptions always require your review versus someone else's review?
- What kinds of retroactive changes happen after payroll is already prepared?

### 4. Approval And Trust
- Before payroll goes out, what do you personally need to see to trust the numbers?
- Do you review row by row, by clinician total, or by exception only?
- If a clinician disputes pay, what evidence do you use to explain the amount?
- What would make you comfortable approving payroll faster?

### 5. Output Requirements
- What must the final per-clinician summary include?
- What columns are mandatory in the line-item ledger?
- What format do you hand downstream: CSV, spreadsheet, payroll portal entry, or something else?
- What fields are only helpful internally and should never leave the reconciliation layer?

## Greg Interview

### Policy Questions
- What compensation models exist today across the practice?
- Which rules are fixed policy versus case-by-case discretion?
- Which exceptions are acceptable to override?
- How should rate changes mid-period be handled?
- Are there rules about paying before collections arrive?

## Billing / Admin Interview

### Data Quality Questions
- Which SimplePractice reports are reliable, and which are not?
- What fields are commonly missing, inconsistent, or entered late?
- How do therapist swaps, reschedules, or corrected CPT codes show up in source data?
- Where do you track adjustments that are not visible in SimplePractice?

## Clinician Interview

### Trust Questions
- What parts of your compensation are hardest to understand from current reports?
- Which disputes come up repeatedly?
- What explanation would make a pay line feel transparent?
- What non-session work do you expect to be represented in compensation?

## Desired Outputs From The Interviews

- Confirmed current-state workflow
- Confirmed compensation rule inventory
- Confirmed exception list with owners
- Confirmed minimum ledger and export fields
- Confirmed v1 scope boundaries
