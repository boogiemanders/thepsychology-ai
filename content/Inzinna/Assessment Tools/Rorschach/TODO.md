# TODO.md

**Project:** Novel projective inkblot instrument
**Updated:** 2026-04-21

---

## Now

- [ ] Inzinna reviews `CONSTRUCT.md` and picks:
  - Primary construct (Options 1 through 5)
  - Whether to pair with AI-scoring methodology (Option 6)
  - Journal target
- [ ] Anders flags to Inzinna that Rorschach research is done and decision point is live

## Next (after CONSTRUCT decision)

- [ ] Draft `STIMULUS-GEN.md` (stimulus generation method, candidate count, selection criteria)
- [ ] Draft `SCORING-FRAMEWORK.md` (coding rubric, rater training, LLM-scoring arm if applicable)
- [ ] Draft `VALIDATION-PROTOCOL.md` (sample, convergent measures, analysis plan)
- [ ] Instrument naming (not "Rorschach"; working title TBD)

## Then (stimulus pilot, weeks 3 to 6)

- [ ] Generate 30 to 50 candidate stimuli
- [ ] Internal pilot with 5 to 10 lab/colleague participants
- [ ] Narrow to 10 to 12 final stimuli
- [ ] Commit final stimuli to `assets/stimuli/` with generation metadata

## Then (admin, weeks 4 to 8)

- [ ] IRB protocol submission
- [ ] OSF pre-registration

## Then (platform build, weeks 6 to 10)

- [ ] Supabase migration for `inkblot_sessions`, `inkblot_responses`, `inkblot_codes`, `inkblot_stimuli` (with RLS)
- [ ] `/lab/inzinna/inkblot/admin` examiner view
- [ ] `/lab/inzinna/inkblot/session/[id]` participant view
- [ ] `/lab/inzinna/inkblot/score/[id]` rater view
- [ ] `/lab/inzinna/inkblot/export` CSV/JSON export
- [ ] End-to-end test with Anders + Inzinna as participants

## Then (main study, weeks 10 to 28)

- [ ] Recruitment launch (Prolific or equivalent)
- [ ] n >= 90 usable sessions
- [ ] Rater training
- [ ] Double-code 20% for IRR
- [ ] Primary analyses per pre-reg

## Then (manuscript, weeks 26 to 40)

- [ ] First draft (Anders lead, Inzinna senior)
- [ ] Internal review
- [ ] Submission to target journal

---

## Parking lot (not now, maybe Phase 2)

- Clinical sample validation
- Norms collection
- HIPAA-grade deployment
- Clinician dashboard
- Mobile UX
- Real-time audio transcription
- Commercial licensing

---

## Done

- [x] Research: online Rorschach admin literature (OpenEvidence)
- [x] Research: Reddit + forums signal (last30days)
- [x] Decision framework for construct selection (CONSTRUCT.md)
- [x] Phase 1 plan (PLAN.md)
