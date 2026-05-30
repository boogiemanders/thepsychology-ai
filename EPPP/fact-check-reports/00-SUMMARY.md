# EPPP Lesson Fact-Check - Master Summary

All 82 lessons across 12 domains checked against OpenEvidence (a citation-backed clinical literature engine) plus authoritative standard references for the non-clinical domains. Report-only: no lesson or question files were changed. One report per domain sits next to this file.

## Tiers
- **FACTUAL-WRONG**: incorrect, should be fixed.
- **MISLEADING**: defensible but oversimplified in a way that could mislead.
- **JUDGMENT**: diverges from current literature but may be the EPPP-tested/accepted answer. Your call.

## Totals
- FACTUAL-WRONG: ~16
- MISLEADING: ~20
- JUDGMENT: ~34

## A note on coverage
OpenEvidence is a clinical/medical engine. It gave strong, citation-backed answers for the biological and clinical domains (Biopsychology, Diagnosis, Clinical Interventions, parts of Development and Assessment). It returns nothing for non-clinical topics, so I-O, Test Construction, Research/Stats, Ethics, and most Social/Cultural theory were verified against authoritative standard references instead (still solid, just not OE-citation-backed). Each report says which method was used per lesson.

## The must-fix list (FACTUAL-WRONG)

**Biopsychology**
1. hindbrain: CN XII (hypoglossal) damage described as Broca's-aphasia-like. It is dysarthria (a tongue/movement speech problem), not aphasia (a language problem).
2. neurons: "C6-C7 = leg paralysis plus some arm weakness." Any cervical injury is tetraplegia (all four limbs).
3. neuro-endocrine: TIA "blockage clears in less than five minutes." No such definition; symptoms usually resolve within an hour or two and scans show no infarct.
4. neuro-endocrine: gestational diabetes "1-3% of pregnancies." Outdated; now about 6-9% in the US.
5. pharmacology-other: lists pemoline (Cylert) as a current ADHD stimulant. It was pulled from the US market for fatal liver failure.
6. pharmacology-other: atomoxetine "more effective than stimulants" for comorbid cases. It is less effective, just better tolerated.

**I-O Psychology**
7. leadership: French & Raven dated 1958. Correct year is 1959.
8. hiring-methods: ".58 validity for both structured and unstructured interviews." The .58 is structured only; unstructured is much lower.

**Cultural Considerations**
9. cultural-concepts: Ridley's terms flipped. "Functional / healthy cultural paranoia" is the adaptive type; "pathological paranoia" is the unhealthy one. Lesson calls functional paranoia unhealthy.

**Development**
10. heredity: heritability values mislabeled. Schizophrenia is ~0.80 (lesson says 0.50-0.70) and major depression is ~0.30-0.50 (lesson lumps it at 0.50-0.70).

**Assessment**
11. personality-tests: 16PF "created in 1947." Correct year is 1949.

**Diagnosis**
12. mood: manic episode lists "three or more" Criterion B symptoms but omits the DSM-5-TR rule that four are required if mood is only irritable (not elevated).

**Research and Stats**
13. designs: AB design said to "control for maturation." It controls for neither maturation nor history; it is the weakest single-subject design.
14. variables: leptokurtic and platykurtic descriptions reversed. Leptokurtic = sharp peak + fat tails; platykurtic = flat peak + thin tails.
15. stats-tests: Cohen's d cutoffs wrong. Correct is 0.2 small, 0.5 medium, 0.8 large (lesson says 0.2-0.8 medium). The lesson's own example contradicts its table.

**Ethics**
16. standards-5-6: record retention says age of majority is "typically 21." It is 18 in nearly all states (so retention often runs to about 21, which is the 3-years-past-majority rule).

## Higher-value MISLEADING items worth a look
- Biopsych: Cushing's "disease" vs "syndrome" wording; Huntington's "10-30 years" (DSM-5-TR says 10-20); SGA receptor description (D2 + 5-HT2A defines the class, not D3/D4); therapeutic index numeric cutoffs; buspirone "no sedation."
- Development: trisomy-21 risk steepens at 35 (not 30); Klinefelter "long arms and legs" (legs only); English has ~44 phonemes (not 50).
- Social: Milgram dated 1974 (book year); experiments ran 1961-62.
- Assessment: TAT is 31 cards (30 pictures + 1 blank).
- Research: "99% within 3 SD" should be 99.7%.
- Ethics: "Telepsychology Guidelines (2024)" should be 2013; insanity-defense "1% used / 25% success" is a rough average.

## Next steps (Phase 2, needs your go-ahead)
1. Decide which fixes to apply (all FACTUAL-WRONG, plus any MISLEADING/JUDGMENT you pick).
2. Apply edits in a fresh git worktree, em-dash-free, at the lessons' simple reading level.
3. For every changed line, grep questionsGPT for matching lessonExcerpt quotes and update them in the same edit so question grounding does not break.
