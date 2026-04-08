# ADHD-RS — Plan

## Goal
Create an ADHD-RS workflow for the lab site using the same shared assessment system as BAARS so additional rating scales can be added without custom one-off UI.

## MVP
- Intro screen with context and respondent instructions
- Structured item form
- Deterministic scoring
- Results screen with:
  - subscale scores
  - total score
  - interpretation text
- Clear restart flow

## Open Questions
- Which ADHD-RS edition / version should be supported?
- Parent, teacher, clinician, or self-report workflow?
- Do you need age or sex norm references?
- Are you aiming for a screening summary, a tracking tool, or both?
- Can exact item wording be used in the lab site?

## Data / Logic Needs
- item bank
- answer scale
- inattentive scoring group
- hyperactive / impulsive scoring group
- total score logic
- interpretation thresholds

## Lab Site Integration
- Add ADHD-RS as its own ring-animation entry
- Reuse the same assessment renderer as BAARS
- Keep config-driven metadata so the loader can add more scales later

## Definition Of Done
- ADHD-RS loads from the lab site
- Form flow works on desktop and mobile
- Score output is correct
- Result summary is understandable
- Implementation shares the same assessment framework as BAARS
