# PLAN.md

**Project:** Novel AI-era projective inkblot instrument (working title TBD)
**Lead:** Anders (postdoc)
**Supervisor:** Dr. Inzinna
**Phase:** 1 (pilot study toward first publication)
**Target timeline:** 12 to 18 months to manuscript submission
**Plan file:** `/Users/anderschan/.claude/plans/okay-so-are-we-robust-eclipse.md`

---

## Why this project exists

Two research files in this folder (openevidence-research.md, reddit-forums-research.md) documented that building a digital Rorschach is blocked by copyright (Hogrefe R-PAS, PAR Exner), APA ethics, and multi-year validation costs. The clean path forward is a novel instrument with our own IP. This plan does that as a research program, not a product launch.

Deliverable for Phase 1: one peer-reviewed manuscript describing the instrument, initial psychometric properties, and scoring methodology.

---

## Non-goals (Phase 1)

- Not a Rorschach replacement.
- Not a clinical-use product. No billing codes, no HIPAA deployment, no clinician dashboard.
- Not norm-referenced. Pilot-only. Norms are Phase 2 plus.
- Not mobile. Desktop-only for lab pilot.
- Not for general release. Preview URLs only until paper is under review.

---

## Phase 1 sequence

### Step 1. Research decisions (weeks 1 to 4)

All md files, no code. Four decision documents locked before building anything.

- `CONSTRUCT.md` (drafted, awaiting Inzinna decision)
- `STIMULUS-GEN.md` (draft after construct locked)
- `SCORING-FRAMEWORK.md` (draft after construct locked)
- `VALIDATION-PROTOCOL.md` (draft after above)

**Gate to next step:** Inzinna signs off on all four.

### Step 2. Stimulus generation pilot (weeks 3 to 6, parallel with step 1)

- Generate 30 to 50 candidate stimuli per method chosen in STIMULUS-GEN.md (likely AI-generated with controlled symmetry, ambiguity, color).
- Internal review: 5 to 10 people (lab members, colleagues) give responses to each candidate.
- Reject stimuli that: produce uniform responses, trigger specific reactions unrelated to construct, have obvious content (a specific animal, a skull), fail to elicit projection.
- Narrow to 10 to 12 final stimuli.
- Commit finalized stimuli to `content/Inzinna/Assessment Tools/Rorschach/assets/stimuli/` with metadata (generation params, pilot notes).

**Gate to next step:** 10 to 12 stimuli locked with documentation.

### Step 3. IRB + pre-registration (weeks 4 to 8)

- IRB protocol submitted wherever Inzinna's affiliation supports it.
- Pre-registration on OSF before any participant data collection. Locks hypotheses, sample size, analysis plan.

**Gate to next step:** IRB approval + OSF pre-reg posted.

### Step 4. Minimal platform build (weeks 6 to 10)

- Next.js App Router pages under `src/app/lab/inzinna/inkblot/` (working URL; rename after instrument is named).
- Supabase tables with RLS: `inkblot_sessions`, `inkblot_responses`, `inkblot_codes`, `inkblot_stimuli`.
- Rater interface for human coding.
- CSV/JSON export.
- Optional: LLM-assisted coding pipeline if SCORING-FRAMEWORK.md goes that direction.

**Gate to next step:** End-to-end test with Anders + Inzinna as participants. Data captured, stored, exported.

### Step 5. Main pilot data collection (weeks 10 to 20)

- Target n=100 non-clinical adults.
- Recruitment: Prolific or equivalent. Fair compensation per APA guidelines.
- Each participant: consent, 10 to 12 stimuli, text responses (audio optional), self-report convergent measures at end of session.

**Gate to next step:** n >= 90 usable sessions.

### Step 6. Scoring and analysis (weeks 18 to 28)

- Human rater training (2 to 3 raters on a subset).
- Double-coding on 20% of responses for IRR.
- If LLM-scoring arm: LLM coding of all responses, IRR comparison against human coders.
- Primary analyses per pre-reg: IRR, convergent validity correlations, reliability (internal consistency where applicable).

**Gate to next step:** IRR kappa >= 0.70. At least one significant convergent correlation.

### Step 7. Manuscript (weeks 26 to 40)

- First draft: Anders lead, Inzinna senior author.
- Internal review + revision.
- Submission to target journal from CONSTRUCT.md.

**Phase 1 complete when:** manuscript under peer review.

---

## Critical files and paths

### Content (research)
- `content/Inzinna/Assessment Tools/Rorschach/openevidence-research.md` (existing)
- `content/Inzinna/Assessment Tools/Rorschach/reddit-forums-research.md` (existing)
- `content/Inzinna/Assessment Tools/Rorschach/CONSTRUCT.md` (drafted)
- `content/Inzinna/Assessment Tools/Rorschach/PLAN.md` (this file)
- `content/Inzinna/Assessment Tools/Rorschach/TODO.md` (checklist)
- `content/Inzinna/Assessment Tools/Rorschach/STIMULUS-GEN.md` (pending)
- `content/Inzinna/Assessment Tools/Rorschach/SCORING-FRAMEWORK.md` (pending)
- `content/Inzinna/Assessment Tools/Rorschach/VALIDATION-PROTOCOL.md` (pending)
- `content/Inzinna/Assessment Tools/Rorschach/assets/stimuli/` (pending, final 10 to 12 stimuli)

### Code (future, step 4)
- `src/app/lab/inzinna/inkblot/` (new)
- `supabase/migrations/YYYYMMDD_inkblot_tables.sql` (new)

### Patterns to mirror
- `content/Inzinna/Assessment Tools/ADHD-RS/` for folder structure
- `src/app/lab/inzinna/timeline/` for data-heavy lab page patterns

---

## Risks and mitigations

- **Construct creep.** Temptation to measure too many things. Mitigation: CONSTRUCT.md locks exactly one primary construct (optionally paired with a methodology contribution).
- **Stimulus quality.** AI-generated inkblots may be too uniform or too content-specific. Mitigation: 30 to 50 candidates narrowed to 10 to 12, with internal pilot.
- **Rater reliability below target.** Mitigation: clear rubric in SCORING-FRAMEWORK.md, training session, pilot coding, refine rubric before main coding.
- **Null convergent validity.** Possible if the instrument doesn't measure what we claim. Mitigation: pre-register hypotheses, report honestly, Phase 2 redesign if needed.
- **Scope drift into clinical product.** Tempting once pilot works. Mitigation: explicit non-goals above, revisit only after manuscript is under review.

---

## Next action

Inzinna reviews CONSTRUCT.md and picks a construct (or construct + methodology pair). That unlocks the next three md files and step 2 of this plan.
