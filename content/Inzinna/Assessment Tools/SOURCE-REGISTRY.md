# Assessment Engine V1 — Source Registry

> Last updated: 2026-04-08

This file tracks the authoritative source files used to build form definitions, scoring logic, and verification fixtures for Assessment Engine v1.

## BAARS-IV Self-Report Long Form

### Locked v1 target
- Instrument: BAARS-IV
- Form: Self-Report, Current Symptoms
- Respondent type: adult self-report
- Intended use in v1: clinician-first item-by-item entry in the lab demo

### Source files discovered
- Questionnaire PDF:
  - `/Users/anderschan/Downloads/BAARS-ADHD-questionnaire-PLEASE-COMPLETE-with-respect-to-symptoms-while-OFF-ADHD-medication.pdf`
- Norms PDF:
  - `/Users/anderschan/Downloads/BAARS Norms.pdf`
- Scorer workbook:
  - `/Users/anderschan/Downloads/BAARS_IV_SR_Scorer.xlsx`
- Corrected scorer workbook:
  - `/Users/anderschan/Downloads/BAARS_IV_SR_Scorer.corrected.xlsx`
- Related scorer workbook also found locally:
  - `/Users/anderschan/Downloads/BAARS_IV_Childhood_Scorer.xlsx`
- Corrected childhood scorer workbook:
  - `/Users/anderschan/Downloads/BAARS_IV_Childhood_Scorer.corrected.xlsx`

### Parsed assets in repo
- Question text extracted to:
  - [BAARS-IV-self-report-current-symptoms.md](/Users/anderschan/thepsychology-ai/content/Inzinna/Assessment%20Tools/BAARS/BAARS-IV-self-report-current-symptoms.md)
- Norm tables transcribed to:
  - [BAARS-IV-self-report-norms.md](/Users/anderschan/thepsychology-ai/content/Inzinna/Assessment%20Tools/BAARS/BAARS-IV-self-report-norms.md)
- Lab demo config created at:
  - [baars-config.ts](/Users/anderschan/thepsychology-ai/src/app/lab/baars/baars-config.ts)

### Verification notes
- Questionnaire PDF is image-based; plain `pdftotext` output is blank.
- Questions were verified by OCR plus direct visual inspection of pages 1-3.
- The scorer workbook was inspected directly from the `.xlsx` XML contents.
- The original local scorer workbooks had `Subscale Scores` formulas pointing at section-header rows instead of the actual `Item Entry` score rows.
- Corrected workbook copies were generated with:
  - [fix_baars_workbook_offsets.py](/Users/anderschan/thepsychology-ai/scripts/fix_baars_workbook_offsets.py)
- The scorer workbook severity labels only cover ages 18-39.
- The norms PDF provides raw-score percentile lookups for ages 18-39, 40-59, and 60-89 for both current and childhood symptom forms.
- Current scorer workbook confirms these scoring groups:
  - Inattention: items 1-9
  - Hyperactivity: items 10-14
  - Impulsivity: items 15-18
  - Total ADHD: items 1-18
  - Sluggish Cognitive Tempo: items 19-27
- Current scorer workbook includes severity ranges and labels for ages 18-39 only.

## ADHD-RS-5 Parent Form

### Locked v1 target
- Instrument: ADHD-RS-5
- Form: Parent form
- Respondent type: parent-report
- Intended use in v1: clinician-first item-by-item entry in the lab demo

### Source status
- No authoritative ADHD-RS-5 parent source file has been copied into the repo yet.
- No ADHD-RS-specific PDF or workbook was found in the inspected local file list during this pass.

### Next source needed
- Parent questionnaire PDF or scan
- Scoring workbook or manual scoring sheet
- Any version/edition notes needed to disambiguate ADHD-RS-IV vs ADHD-RS-5
