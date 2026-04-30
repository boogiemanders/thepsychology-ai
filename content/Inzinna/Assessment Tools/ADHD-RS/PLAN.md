# ADHD-RS — Plan

## Goal
Create an ADHD-RS workflow for the lab site that inherits the BAARS interaction language, uses the same shared assessment system, and can expand from a single clinician-first scorer into a multi-informant ADHD workflow without a rewrite.

## Locked V1 Target
- Instrument: ADHD-RS-5
- Form: Parent form
- Population: ages 5-17
- Entry mode: clinician-first item-by-item entry on the lab site
- Initial output: raw scores, symptom counts, norm-aware interpretation shell, and a note-ready summary

## Product Direction
- Match the BAARS page aesthetic and page structure so the assessment lane feels like one coherent product family
- Keep the Inzinna + thePsychology.ai co-branding in the top-left lockup for the ADHD-RS route
- Prioritize speed and clarity over a patient-facing portal or decorative UI
- Treat parent-vs-teacher comparison and longitudinal tracking as phase-2 / phase-3 work, not MVP blockers

## MVP
- BAARS-style route shell with tool framing, version labeling, and collaboration branding
- Respondent / child context fields:
  - child name or identifier
  - DOB or age
  - sex / gender field if needed for norms
  - rater name
  - rater relationship
  - assessment date
- Structured 18-item ADHD-RS-5 parent form
- Deterministic scoring for:
  - inattention raw score
  - hyperactivity / impulsivity raw score
  - total raw score
  - symptom counts at the clinical threshold
- Results screen with:
  - subscale scores
  - total score
  - threshold counts
  - interpretation text
  - concise note-ready summary paragraph
- Clear restart flow

## UX Structure
1. Route shell
   - Back link to `/lab`
   - BAARS-aligned title block
   - BAARS-aligned version / form pills
   - Collaboration context for Inzinna
2. Intake block
   - Child + rater metadata
   - Any norm-required fields surfaced before scoring
3. Item entry
   - 18 prompts
   - Uniform response scale
   - Clear section split between Inattention and Hyperactivity-Impulsivity
4. Results
   - raw score table
   - symptom-count table
   - interpretation notes / caveats
   - copyable summary text
5. Reset / rerun
   - start over without stale state

## Data Model
- instrument id
- slug
- version label
- respondent type
- intended age range
- item list
- response scale
- scoring groups
- clinical threshold definition for symptom counts
- norm lookup metadata
- disclaimer text

## Scoring / Logic Needs
- ADHD-RS-5 parent item bank
- parent-form answer scale
- inattention scoring group
- hyperactivity / impulsivity scoring group
- total score logic
- symptom threshold rule
- norm lookup by:
  - age
  - sex / gender if required by source materials
  - informant type
- interpretation bands / summary rules

## Source Dependencies
- Parent questionnaire PDF or scan
- Scoring workbook or manual scoring sheet
- Norm tables for ADHD-RS-5 parent form
- Edition notes confirming ADHD-RS-5 vs ADHD-RS-IV handling
- Explicit decision on how much copyrighted wording can appear in the product

## Implementation Phases

### Phase 0 — Source Lock
- Confirm the authoritative ADHD-RS-5 parent source packet
- Confirm what wording, tables, and instructions can live in the repo
- Confirm any norm dependencies on sex, age band, and informant

### Phase 1 — Page Shell
- Replace the generic placeholder route with a BAARS-aligned ADHD-RS page
- Add the same co-branded navbar lockup used on BAARS
- Make the page honest about current readiness: shell now, scoring after source packet

### Phase 2 — Config + Scoring Engine
- Create the ADHD-RS config file using the shared assessment schema
- Add scoring groups and deterministic score calculation
- Build the results summary component using the BAARS pattern where possible

### Phase 3 — Norms + Clinical Summary
- Add norm lookup helpers
- Render interpretation copy with raw scores + threshold counts
- Add copy-ready output for notes / reports

### Phase 4 — Expansion
- Teacher form
- parent vs teacher discrepancy view
- longitudinal tracking across administrations
- optional export / print support

## Lab Site Integration
- Keep ADHD-RS registered as its own lab entry
- Reuse the same renderer / scoring patterns established by BAARS where it makes sense
- Keep config-driven metadata so additional scales can be added without route-specific rewrites
- Preserve route-level co-branding for Inzinna collaboration pages

## Definition Of Done
- ADHD-RS loads from the lab site
- Page shell matches the BAARS product family visually
- Co-branded lockup appears on the ADHD-RS route
- Form flow works on desktop and mobile
- Score output matches the manual scoring reference
- Result summary is clinically legible and copy-ready
- Implementation shares the same assessment framework as BAARS
- Remaining gaps are source / licensing questions, not UI ambiguity
