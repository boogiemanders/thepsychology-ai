# BAARS — Plan

## Goal
Create a BAARS workflow for the lab site that presents the assessment cleanly, scores it consistently, and returns a structured summary for clinical use.

## MVP
- Intro screen with tool description and intended respondent
- Assessment form with all item prompts and response choices
- Score calculation per subscale / total, if applicable
- Results screen with:
  - raw scores
  - interpretation bands
  - brief clinical summary
- Reset / retake support

## Open Questions
- Which BAARS version do you want to implement?
- Self-report only, or observer / collateral version too?
- Do you need age norms or percentile logic?
- Do you want symptom counts, impairment summaries, or both?
- Can exact BAARS wording be displayed in-product?

## Data Model
- instrument id
- version
- respondent type
- item list
- response scale
- scoring groups
- interpretation thresholds
- disclaimer text

## Lab Site Integration
- Add BAARS as a new tool entry in the ring animation
- Provide label, slug, icon, and short description
- Route BAARS to its own assessment page or modal flow

## Definition Of Done
- BAARS appears in the lab UI
- User can complete it start to finish
- Scores match expected manual calculations
- Result copy is clinically legible
- Content structure is reusable for ADHD-RS
