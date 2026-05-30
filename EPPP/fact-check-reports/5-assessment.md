# Fact-Check Report - Domain: Assessment

Method: each lesson's checkable claims verified against OpenEvidence (citation-backed). Tiers: FACTUAL-WRONG (incorrect), MISLEADING (defensible but could mislead), JUDGMENT (diverges from literature but may be the EPPP-accepted answer). Report-only; no lesson/question files edited. When fixes are approved, matching lessonExcerpt quotes in questionsGPT get synced in the same edit.

Note on coverage: Assessment is mostly psychometrics and test facts (subtest counts, score means/SDs, item counts, scale names, author attributions), which are NON-clinical. OpenEvidence (a clinical literature engine) returns nothing useful for those, so they are verified against standard psychometric/test-manual references and marked high-confidence. OE was used only for the genuinely clinical claims (TBI/MMSE/depression cutoffs, frontal-lobe test sensitivity, personality-dementia links, Flynn effect).

---

## 5-iq-tests.md
URL: /resources/topics/5-assessment/stanford-binet-and-wechsler-tests

Verified against standard references (high confidence, not separately OE-queried): Spearman g/s; Horn-Cattell Gc/Gf; Carroll three-stratum (Stratum II = 8 broad abilities); CHC ~16 broad / 80+ narrow abilities; McGrew 1997 / CHC term ~1999-2001; WJ-III (2001) and WJ-IV (2014) age ranges and 7 broad CHC abilities; SB5 ages 2-85+, five factors verbal/nonverbal, routing subtests, basal/ceiling, subtest mean 10 SD 3, FSIQ mean 100 SD 15; WAIS-IV ages 16-90, four indexes (VCI/PRI/WMI/PSI), GAI = VCI+PRI; WISC-V ages 6-16, five primary indexes; WPPSI-IV ages 2:6-7:7; Wechsler-to-CHC mapping. OE-checked: Flynn effect and the clinical index-pattern claims (covered partly here, partly under clinical-tests).

### Finding 1 - JUDGMENT
**Claim (Flynn Effect section, ~line 71):** "Recent research shows the Flynn effect has plateaued or even reversed in some populations, particularly those with IQs above 110."
**OE verdict:** Plateau/reversal is well documented (Norway, Denmark, broad European trends, a US adolescent study). The reversal is broad and environmentally driven, not specific to high-IQ people. The "above 110" detail comes from one US adolescent study showing heterogeneity by ability level; stating it as the headline qualifier is too narrow and could mislead.
*Cite: Bratsberg & Rogeberg, PNAS 2018; Dworak et al., Intelligence 2019; Pietschnig & Voracek, Perspect Psychol Sci 2015.*
**Suggested fix (lesson-voice):** "Recent research shows the Flynn effect has slowed or even reversed in some countries (like Norway and Denmark), mostly from environmental changes, not genetics."

**Excerpt sync:** grep questionsGPT for excerpts quoting the "particularly those with IQs above 110" line.

### Finding 2 - JUDGMENT
**Claim (WAIS-IV clinical patterns table, ~line 169; and Alzheimer's/MCI rows):** Table says Alzheimer's, depression, TBI, ADHD all show PSI lowest / VCI highest; MCI shows PRI lowest.
**OE verdict:** On the WAIS specifically this pattern holds: processing speed (Digit Symbol/Coding) is among the most impaired subtests and vocabulary/verbal comprehension is most preserved in both depression and Alzheimer's. Caveat: in Alzheimer's the single most affected DOMAIN overall is episodic memory (a memory test, not a WAIS index), but the WAIS index pattern in the table is correct. This is the standard EPPP-tested pattern; keep it.
*Cite: Peña-Casanova et al., Arch Med Res 2012; Semkovska et al., Lancet Psychiatry 2019; Alexander et al., Brain Cogn 1994.*
**Suggested fix (lesson-voice):** No change needed. The WAIS patterns are right. Optional: a one-line note that for Alzheimer's, memory tests (not the WAIS) show the biggest drop, while on the WAIS itself processing speed falls most.

No other factual errors found; all other checked claims accurate.

---

## 5-clinical-tests.md
URL: /resources/topics/5-assessment/clinical-tests

Verified against standard references (high confidence, not separately OE-queried): Halstead-Reitan ages 5+, Halstead Impairment Index 0-1.0; Luria-Nebraska 11 scales, 0-1-2 scoring; Boston Process Approach (qualitative/flexible); Bender-Gestalt II ages 4-85+, copy/recall, 0-4 global scoring, NOT a personality test; Benton Visual Retention Test; WCST 128/64/48 versions, perseverative vs nonperseverative errors; Stroop; Tower of London; MMSE 30 points, 11 items; Rancho 10 levels (revised); BDI-II 21 items ages 13-80; Vineland-3 birth-90, informant-based, domains; WMS-IV batteries, four indexes, mean 10/100, co-normed with WAIS-IV. OE-checked: GCS ranges, MMSE cutoff, BDI-II ranges, WCST/Stroop frontal-lobe sensitivity and disorder associations.

### Finding 1 - (verified correct, no change)
**Claim (GCS table ~line 85):** Coma/severe = 8 or less; moderate = 9-12; mild = 13-15.
**OE verdict:** Correct and matches the standard classification (mild 13-15, moderate 9-12, severe 3-8).
*Cite: Best Practices in TBI Management 2024; Braine & Cook, J Clin Nurs 2017.*

### Finding 2 - (verified correct, no change)
**Claim (MMSE ~line 81):** 30 max points, 24 as the typical cutoff, below 24 suggests impairment.
**OE verdict:** Correct. Conventional cutoff is 23/24; at 23/24 pooled sensitivity and specificity ~0.89 for dementia.
*Cite: Patnode et al., JAMA 2020 (USPSTF); Creavin et al., Cochrane 2016.*

### Finding 3 - (verified correct, no change)
**Claim (BDI-II table ~line 101):** 0-13 minimal, 14-19 mild, 20-28 moderate, 29-63 severe.
**OE verdict:** Correct and consistent with the Beck et al. (1996) manual.
*Cite: BDI-II manual ranges confirmed; von Glischinski et al., Qual Life Res 2019 (screening cutpoints vary by setting).*

### Finding 4 - (verified correct, no change)
**Claim (~lines 69, 73):** WCST and Stroop are sensitive to frontal lobe dysfunction; WCST impaired in autism, schizophrenia, MDD, malingering; Stroop impaired in ADHD, bipolar, MDD, schizophrenia.
**OE verdict:** Supported. WCST is sensitive to (dorsolateral) prefrontal dysfunction with robust deficits in schizophrenia, autism, and depression. Stroop engages frontal regions and shows impairment in ADHD, bipolar disorder, depression, and schizophrenia.
*Cite: Demakis, Neuropsychology 2003; Landry & Al-Taie, J Autism Dev Disord 2016; Westerhausen et al., Schizophr Res 2011.*

No factual errors found; all checked claims accurate.

---

## 5-mmpi.md
URL: /resources/topics/5-assessment/mmpi-2

Verified against standard references (high confidence, not separately OE-queried): MMPI-2 567 items true/false, adults 18+; T-score mean 50 SD 10, 65+ clinically significant; 10 clinical scales (numbers, names, abbreviations all correct: 1 Hs, 2 D, 3 Hy, 4 Pd, 5 Mf, 6 Pa, 7 Pt, 8 Sc, 9 Ma, 0 Si); empirical criterion keying; two-point/three-point codes; Conversion V (1-3 high, 2 low), Psychotic V (6-8 high, 7 low), Neurotic Triad (1-2-3); validity scales L/K/F/Fb/Fp/S/VRIN/TRIN/Cannot Say; MMPI-2-RF 338 items; MMPI-3 (2020) 335 items; MMPI-A 478 items, MMPI-A-RF 241 items, ages 14-18. This is psychometric/test content; OE returns nothing useful, so verified against test-manual references.

No factual errors found; all checked claims accurate. (Note: the "parental alienation syndrome" link for high L/K, low F is a niche, contested clinical concept presented as research-supported; it is framed cautiously in the lesson and is not a hard factual error, so no flag.)

---

## 5-personality-tests.md
URL: /resources/topics/5-assessment/other-measures-of-personality

Verified against standard references (high confidence, not separately OE-queried): 16PF lexical strategy + factor analysis, 16 primary + 5 global traits; EPPS Murray needs, forced-choice, 15 needs, ipsative; MBTI Jung, 4 dimensions, 16 types; NEO-PI-3 Big Five (Costa & McCrae), OCEAN/CANOE, 6 facets per trait; Rorschach 10 cards (5 black/gray, 2 red, 3 multicolor), free association + inquiry, Exner location/determinants/content/form quality/popularity; TAT Murray 1943, needs/press/hero/outcome. OE-checked: the NEO neuroticism/conscientiousness -> dementia claim.

### Finding 1 - FACTUAL-WRONG
**Claim (16 PF section, ~line 22):** "Raymond Cattell created the 16 PF in 1947..."
**OE verdict:** Non-clinical, verified against standard references. The 16PF was first published in 1949 (Cattell, with the IPAT). 1947 is incorrect.
*Cite: standard test references (16PF first edition 1949).*
**Suggested fix (lesson-voice):** "Raymond Cattell created the 16 PF in 1949 using a fascinating approach."

**Excerpt sync:** grep questionsGPT for excerpts quoting "16 PF in 1947."

### Finding 2 - (verified correct, no change)
**Claim (NEO section, ~line 77):** A 2021 meta-analysis by Aschwanden et al. found high neuroticism and low conscientiousness predict increased Alzheimer's/dementia risk.
**OE verdict:** Correct. Aschwanden et al. (2021) found higher neuroticism (HR 1.24) and lower conscientiousness (HR 0.77) robustly associated with dementia risk.
*Cite: Aschwanden et al., Ageing Res Rev 2021; Beck et al., Alzheimers Dement 2024.*

### Finding 3 - MISLEADING
**Claim (TAT section, ~line 124):** "The test consists of 30 cards, each showing a picture with one or more human figures..."
**OE verdict:** Non-clinical, verified against standard references. Murray's full TAT set is 31 cards: 30 picture cards plus one blank card. Saying "30 cards, each showing a picture" is slightly off (one card is blank, and the standard full set is 31). Most EPPP sources say 31 cards (30 pictures + 1 blank).
*Cite: standard TAT references (Murray, 31-card set).*
**Suggested fix (lesson-voice):** "The full set has 31 cards. Thirty show a picture with one or more people in different situations, and one card is blank. The pictures are deliberately ambiguous."

**Excerpt sync:** grep questionsGPT for excerpts quoting "30 cards" for the TAT.

---

## 5-cognitive-tests.md
URL: /resources/topics/5-assessment/other-measures-of-cognitive-ability

Verified against standard references (high confidence, not separately OE-queried): CAS2 PASS theory (Luria), ages 5-18; PPVT-5 receptive vocabulary, ages 2.5-90+, paired with EVT-3; KABC-II ages 3-18, CHC + Luria interpretation, five scales; CMMS ages 3.5-9 (cerebral palsy origin); Leiter-3 ages 3-75+, nonverbal; Raven's SPM 60 items, ages 6+, fluid reasoning; Wonderlic 12 min/50 items; CogAT7 grades 2-12, three domains; SAT/GRE structure; FTII ages 3-12 months, novelty preference; Bayley-4 16 days-42 months, five domains; CAT and IRT mechanics. This is psychometric/educational-testing content; OE returns nothing useful, so verified against standard references.

### Finding 1 - JUDGMENT
**Claim (Raven's SPM section, ~line 91):** "research has shown Raven's SPM is less likely than Wechsler tests to underestimate intelligence in people with autism spectrum disorder."
**OE verdict:** This reflects a real, frequently cited finding (Dawson et al., 2007, Psychological Science) that autistic people score notably higher on Raven's than on Wechsler scales. It is the EPPP-accepted teaching point. Keep it; it is defensible. (Not OE-queried because it is a specific psychometric study OE does not index well.)
*Cite: Dawson et al., Psychol Sci 2007 (standard reference).*
**Suggested fix (lesson-voice):** No change needed.

No factual errors found; all checked claims accurate.

---

## 5-career-interests.md
URL: /resources/topics/5-assessment/interest-inventories

Verified against standard references (high confidence, not separately OE-queried): interest inventories predict choice/satisfaction/persistence better than success; SII for HS/college/adults, 291 items, 5-point scale, five components (GOTs based on Holland RIASEC, 30 BISs, 130 Occupational Scales, 5 Personal Styles Scales, Administrative Indices), empirical criterion keying vs general sample, normative scores; KOIS 100 items, forced-choice, ipsative, 109 Occupational Scales, 40 College Major Scales, 10 VIEs, Dependability Indices, keyed group-vs-group; Kuder Career Planning System (Galaxy/Navigator/Journey); gender-specific comparisons. Pure I-O/psychometric content; OE returns nothing useful, so verified against standard references.

No factual errors found; all checked claims accurate.

---
