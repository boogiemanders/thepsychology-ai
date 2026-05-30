# Fact-Check Report - Domain: Diagnosis

Method: each lesson's checkable claims verified against OpenEvidence (citation-backed). Tiers: FACTUAL-WRONG (incorrect), MISLEADING (defensible but could mislead), JUDGMENT (diverges from literature but may be the EPPP-accepted answer). Report-only; no lesson/question files edited. When fixes are approved, matching lessonExcerpt quotes in questionsGPT get synced in the same edit.

---

## 5-mood.md
URL: /resources/topics/5-diagnosis-psychopathology/bipolar-and-depressive-disorders

Verified against standard references (high confidence, not separately OE-queried): Lewinsohn social reinforcement theory, Seligman learned helplessness/hopelessness reformulation, Beck cognitive triad, episode durations (mania 7d, hypomania 4d, MDE 14d, cyclothymia 2y), peripartum onset specifier (4 weeks post-delivery), SAD with seasonal pattern, 2022 CDC suicide demographics. OE-checked the below.

### Finding 1 - FACTUAL-WRONG
**Claim (Manic Episode section, ~line 22):** "We're talking about three or more of these symptoms:" (lists the 7 Criterion B symptoms, no irritable-mood caveat)
**OE verdict:** DSM-5-TR requires three or more Criterion B symptoms when mood is elevated/expansive, but FOUR or more if the mood is only irritable. The lesson omits the "four if only irritable" rule. This is a commonly tested DSM detail.
*Cite: DSM-5-TR (APA, 2022).*
**Suggested fix (lesson-voice):** "We're talking about three or more of these symptoms (or four or more if the mood is only irritable, not elevated):"

**Excerpt sync:** grep questionsGPT for excerpts quoting "three or more of these symptoms" to keep them matched.

### Finding 2 - JUDGMENT
**Claim (Genetics, ~line 58 and ~line 62):** "Heritability estimates range from 60% to 90%" and concordance "Monozygotic 40-80%, Dizygotic 5-30%."
**OE verdict:** Defensible. DSM-5-TR cites heritability up to ~90% and MZ concordance ~40-70%; Lancet reviews report DZ ~4-6%. The lesson's wider ranges (MZ up to 80%, DZ up to 30%) are on the high end of older sources but within the textbook range commonly taught. Not an error for EPPP purposes.
*Cite: DSM-5-TR (APA, 2022); McIntyre et al., Lancet 2020.*
**Suggested fix (lesson-voice):** None needed; ranges are acceptable as taught.

### Finding 3 - MISLEADING
**Claim (MDD Genetics, ~line 169):** "Concordance rates: 46% (monozygotic twins), 20% (dizygotic twins)"
**OE verdict:** Heritability 30-50% is accurate (DSM-5-TR ~40%). The specific concordance figures (46%/20%) are older textbook numbers and not what current registry studies emphasize, but they are within range and are the figures EPPP prep tends to use. Low risk; flagging as defensible-but-dated.
*Cite: DSM-5-TR (APA, 2022); Kendler et al., Am J Psychiatry 2018.*
**Suggested fix (lesson-voice):** None required; numbers are within the commonly taught range.

---

## 5-anxiety-and-ocd.md
URL: /resources/topics/5-diagnosis-psychopathology/anxiety-disorders-and-obsessive-compulsive-disorder

Verified against standard references (high confidence, not separately OE-queried): Mowrer two-factor theory, Borkovec cognitive avoidance, Newman & Llera contrast avoidance, Dugas intolerance of uncertainty, ERP/applied tension for BII phobia, panic control treatment, benzodiazepine cautions. OE-checked the below.

### Finding 1 - JUDGMENT (no error)
**Claim (Specific Phobia, ~line 76-77):** "Twice as common in girls than boys" and "Average onset around age 10."
**OE verdict:** Confirmed. Female-to-male lifetime prevalence is roughly 2:1 (World Mental Health Surveys: 9.8% vs 4.9%). Median age of onset is around 8 years in cross-national data; "around age 10" is within the commonly taught range and matches DSM-5-TR text. Not an error.
*Cite: DSM-5-TR (APA, 2022); Wardenaar et al., Psychol Med 2017.*
**Suggested fix (lesson-voice):** None needed.

### Finding 2 - No error
**Claim (multiple):** GAD requires 3 of 6 associated symptoms (1 for children); panic attack needs 4 of 13 symptoms; separation anxiety needs 3 of 8 symptoms with 4 weeks (children) vs 6 months (adults) duration.
**OE verdict:** All confirmed against DSM-5-TR exactly as written in the lesson.
*Cite: DSM-5-TR (APA, 2022).*

No other factual errors found; all checked claims accurate.

---

## 5-acting-out.md
URL: /resources/topics/5-diagnosis-psychopathology/disruptive-impulse-control-and-conduct-disorders

Verified against standard references (high confidence, not separately OE-queried): ODD criteria (4 symptoms, 6 months, non-sibling), CD criteria (3 in 12 months, 1 in past 6 months, childhood-onset before age 10), IED criteria (2x/week for 3 months OR 3 outbursts/12 months with damage, age 6+), CD-to-ASPD transition rule, Slutske et al. 1997 heritability (65% male / 43% female), Moffitt 1993 two-path theory, low resting heart rate / blunted arousal in CD, Fairchild 2019, Kazdin PSST/PMT, PMTO, PCIT, FFT, MDFT, MST (Bronfenbrenner ecological), MTFC, Scared Straight iatrogenic effect, ~30% ODD-to-CD progression. These are DSM-5-TR criteria and well-attributed theory/program facts; no clinical/epidemiological claim carried meaningful error risk, so no OE call was spent.

No factual errors found; all checked claims accurate.

---

## 5-eating-sleep-elimination.md
URL: /resources/topics/5-diagnosis-psychopathology/feeding-eating-elimination-and-sleep-wake-disor

Verified against standard references (high confidence, not separately OE-queried): pica (1 month, non-food), anorexia criteria and FBT/CBT-E, bulimia medical complications, CBT-I components, sleepwalking/sleep terrors (NREM stage 3, first third of night), nightmare disorder (REM, second half), Harvey cognitive model. OE-checked the below.

### Finding 1 - No error
**Claim (BED, ~line 118):** "BED is 2-3 times more common in women than men."
**OE verdict:** Confirmed. DSM-5-TR 12-month prevalence 0.6-1.6% women vs 0.26-0.8% men, a roughly 2-3x ratio (less skewed than anorexia or bulimia).
*Cite: DSM-5-TR (APA, 2022).*

### Finding 2 - No error (minor simplification)
**Claim (Narcolepsy, ~line 213):** "REM sleep latency of 15 minutes or less on polysomnography."
**OE verdict:** Accurate. DSM-5-TR Criterion B3 lists nocturnal PSG REM latency 15 min or less OR an MSLT mean sleep latency 8 min or less with 2+ sleep-onset REM periods. The lesson states the PSG version and omits the MSLT alternative, which is a fair simplification, not an error.
*Cite: DSM-5-TR (APA, 2022).*

### Finding 3 - No error
**Claim (multiple):** Bulimia once weekly for 3 months; BED once weekly for 3 months with 3 of 5 features; enuresis age 5+, 2x weekly for 3 months OR significant distress; narcolepsy sleep attacks 3x weekly for 3 months plus one of cataplexy / hypocretin deficiency / short REM latency.
**OE verdict:** All confirmed against DSM-5-TR exactly as written.
*Cite: DSM-5-TR (APA, 2022).*

No factual errors found; all checked claims accurate.

---

## 5-neurocognitive.md
URL: /resources/topics/5-diagnosis-psychopathology/neurocognitive-disorders

Verified against standard references (high confidence, not separately OE-queried): delirium criteria, amyloid plaques / tau tangles and their spread (medial temporal first), cortical vs subcortical symptom map, frontotemporal NCD behavioral variant criteria, vascular NCD criteria, prion/CJD subtypes, pseudodementia comparison, reversible causes (B12, NPH). OE-checked the below.

### Finding 1 - No error
**Claim (~line 65, 292):** "Alzheimer's accounts for 60-80% of all neurocognitive disorder cases."
**OE verdict:** Confirmed. Alzheimer's Association cites 60-80%; DSM-5-TR says ~60% to over 90% depending on setting. The lesson's range is widely accepted.
*Cite: DSM-5-TR (APA, 2022); Frisoni et al., Lancet 2025.*

### Finding 2 - No error
**Claim (~line 152):** "Donanemab: Newly approved, targets amyloid plaques directly (monthly IV infusion for early-stage disease)."
**OE verdict:** Confirmed. Donanemab (Kisunla) got full FDA approval July 2024 for MCI/mild-dementia stage Alzheimer's, given IV every 4 weeks, anti-amyloid antibody.
*Cite: FDA Novel Drug Approvals 2024; Sims et al., JAMA 2023 (TRAILBLAZER-ALZ 2).*

### Finding 3 - No error
**Claim (~line 174):** Lewy body NCD core feature: "Parkinsonism symptoms that develop AFTER cognitive symptoms."
**OE verdict:** Confirmed. DSM-5-TR lists spontaneous parkinsonism with onset subsequent to cognitive decline as a core feature, which is what separates it from Parkinson's disease dementia.
*Cite: DSM-5-TR (APA, 2022).*

### Finding 4 - JUDGMENT
**Claim (~line 85):** "Among adults 65+, Black Americans have the highest rates, followed by Hispanic Americans, then White Americans."
**OE verdict:** Directionally correct (both Black and Hispanic adults have higher rates than White), but the strict Black > Hispanic ordering is not consistently supported. Some large studies show Hispanic > Black for incidence. This is the Alzheimer's Association / commonly taught framing, so it is likely the EPPP-accepted answer. Flagging, not calling it an error.
*Cite: Kornblith et al., JAMA 2022; Manly et al., JAMA Neurol 2022; DSM-5-TR.*
**Suggested fix (lesson-voice):** Optional softening: "Black and Hispanic Americans both have higher rates than White Americans (studies differ on which of the two is highest)."

### Finding 5 - JUDGMENT
**Claim (~line 100):** "reduced acetylcholine (ACh) and excessive glutamate."
**OE verdict:** Reduced ACh is solidly correct. "Excessive glutamate" is an oversimplification. The real picture is dysregulated glutamate (impaired reuptake causing extrasynaptic NMDA overactivation), and postmortem brains can show overall glutamate decreases. But "too much glutamate activity" is the standard teaching that explains why memantine (an NMDA blocker) helps, so it is the EPPP-accepted simplification. Flagging, not an error.
*Cite: Soares et al., Mol Psychiatry 2024; Benarroch, Neurology 2018.*
**Suggested fix (lesson-voice):** Optional: "reduced acetylcholine and overactive glutamate signaling (which is why a glutamate-blocking drug, memantine, can help)."

No factual errors found; checked claims accurate (two JUDGMENT flags reflect EPPP-accepted simplifications).

---

## 5-neurodevelopmental.md
URL: /resources/topics/5-diagnosis-psychopathology/neurodevelopmental-disorders

Verified against standard references (high confidence, not separately OE-queried): intellectual disability 3 components + severity by adaptive functioning, Down syndrome (trisomy 21, not inherited) vs Fragile X (inherited X-linked), ADHD symptom counts (6 under 17, 5 at 17+, onset before 12, 2 settings, 6 months), tic disorder criteria, EIBI/Lovaas, specific learning disorder criteria, prenatal/perinatal/postnatal etiology percentages, no vaccine-ASD link. OE-checked the below.

### Finding 1 - No error (current)
**Claim (~line 78):** "in the United States, the rate is higher, 3.2% for 8-year-olds and 2.2% for adults. Males receive diagnoses three to four times more often than females."
**OE verdict:** Child figure is current and correct (CDC ADDM 2022 = 1 in 31 = 3.2%, up from 1 in 36 in 2020). The 2.2% adult figure is a modeled projection, not directly measured surveillance, but it is a reasonable and commonly cited estimate. Male 3-4x matches DSM-5-TR (true population ratio nearer 3:1; declining over time, but 3-4x is the DSM/EPPP answer).
*Cite: Shaw et al., MMWR 2025 (ADDM 2022); DSM-5-TR; Dietz et al., J Autism Dev Disord 2020.*
**Suggested fix (lesson-voice):** Optional: note the 2.2% adult figure is an estimate, not a head-count. Not required.

### Finding 2 - No error
**Claim (~line 91):** ASD "serotonin paradox": lower brain serotonin, elevated blood serotonin.
**OE verdict:** Confirmed. Whole-blood hyperserotonemia is the most replicated ASD biomarker; PET shows reduced brain serotonin transporter availability. The paradox is real.
*Cite: Muller et al., Neuroscience 2016; Andersson et al., Mol Psychiatry 2021.*

### Finding 3 - No error
**Claim (~line 138):** "male-to-female ratio is 2:1 in childhood but narrows to about 1.6:1 in adulthood."
**OE verdict:** Confirmed verbatim against DSM-5-TR (2:1 children, 1.6:1 adults).
*Cite: DSM-5-TR (APA, 2022).*

### Finding 4 - JUDGMENT (no error)
**Claim (~line 93, 289):** ASD "heritability around 62%."
**OE verdict:** Defensible but at the low end. Twin meta-analyses cluster 64-91%, with large Swedish registry data up to ~0.93. 62% is a commonly cited textbook figure and is fine for EPPP; flagging only because current literature trends higher.
*Cite: Tick et al., JCPP 2016; Taylor et al., JAMA Psychiatry 2020.*
**Suggested fix (lesson-voice):** Optional: "heritability is high (estimates from about 60% up to 90% or more across studies)."

No factual errors found; all checked claims accurate.

---

## 5-personality.md
URL: /resources/topics/5-diagnosis-psychopathology/personality-disorders

Verified against standard references (high confidence, not separately OE-queried): cluster organization (A/B/C), Big Five linkage (neuroticism +, agreeableness -), DBT/Linehan three components, OCPD vs OCD distinction, schizoid/schizotypal/avoidant differential, age rules (only ASPD requires 18+). OE-checked the below.

### Finding 1 - No error
**Claim (symptom-threshold table, ~line 269-280):** Paranoid 4/7, Schizoid 4/7, Schizotypal 5/9, Antisocial 3/7 (18+, CD before 15), Borderline 5/9, Histrionic 5/8, Narcissistic 5/9, Avoidant 4/7, Dependent 5/8, OCPD 4/8.
**OE verdict:** Every threshold and the antisocial age/conduct-disorder rules confirmed exactly against DSM-5-TR Section II.
*Cite: DSM-5-TR (APA, 2022).*

### Finding 2 - No error
**Claim (~line 134, 236):** "Up to 75% of individuals no longer meet full criteria by age 40."
**OE verdict:** Within the supported range. DSM-5-TR notes BPD lessens in the 30s-40s; long-term prospective studies (Zanarini, CLPS) show remission of 77-93%+ at 10-24 years, while a 5-year meta-analysis averages ~60%. "Up to 75%" is a fair, commonly cited figure. Note remission is not the same as full functional recovery, but the claim as stated is accurate.
*Cite: DSM-5-TR; Leichsenring et al., JAMA 2023; Gunderson et al., Arch Gen Psychiatry 2011.*

No factual errors found; all checked claims accurate.

---

## 5-psychosis.md
URL: /resources/topics/5-diagnosis-psychopathology/schizophrenia-spectrum-other-psychotic-disorders

Verified against standard references (high confidence, not separately OE-queried): duration criteria (brief <1 month, schizophreniform 1-6 months, schizophrenia 6+ months), symptom counts (brief 1, schizophreniform/schizophrenia 2, one must be delusion/hallucination/disorganized speech), revised dopamine hypothesis (subcortical excess = positive, prefrontal deficit = negative), enlarged ventricles / hypofrontality, delusional disorder subtypes, prognosis factors, expressed emotion, clozapine for treatment-resistant (2 trials, 6 weeks each), NAVIGATE. OE-checked the below.

### Finding 1 - No error (broad framing)
**Claim (intro, ~line 12):** "About 3% of people will experience a psychotic episode at some point in their lives."
**OE verdict:** Reasonable for ANY psychotic disorder broadly defined (lifetime ~2.3-3.5% including affective psychoses). Schizophrenia alone is ~0.3-0.7%, which the lesson correctly reflects elsewhere (1% general-population concordance). No conflict.
*Cite: van Os & Kapur, Lancet 2009; DSM-5-TR.*

### Finding 2 - No error
**Claim (~line 84, 154):** Heritability 70-80%; onset males early-to-mid 20s, females late 20s; schizoaffective requires 2+ weeks of psychosis without a mood episode; tobacco use 70-85%.
**OE verdict:** Heritability 70-80% confirmed (meta-analyses 69-81%). Onset by sex confirmed (men ~18-25, women ~25-30). Schizoaffective 2-week rule confirmed (DSM-5-TR Criterion B). Tobacco 70-85% is reasonable for clinical/inpatient and lifetime use (community active-use rates now lower, but the EPPP figure stands).
*Cite: Sullivan et al., Arch Gen Psychiatry 2003; DSM-5-TR; Han et al., JAMA Netw Open 2023.*

### Finding 3 - JUDGMENT
**Claim (concordance table, ~line 92-94):** "Dizygotic twin: 17%, Monozygotic twin: 48%."
**OE verdict:** These are the classic/historical textbook figures (MZ ~48%, DZ ~17%) and almost certainly the EPPP-accepted answer. Modern population-based registries report lower probandwise concordance (Danish: MZ ~33%, DZ ~7%); estimates range MZ 33-65%. Flagging because current literature trends lower, but this is the traditionally taught number, so not an error for the exam.
*Cite: Hilker et al., Biol Psychiatry 2018; Song et al., JAMA Psychiatry 2024.*
**Suggested fix (lesson-voice):** Optional: keep 48% but add "(some newer studies find lower rates, around 33%)."

No factual errors found; all checked claims accurate (one JUDGMENT flag on historical concordance figures).

---

## 5-sex-and-gender.md
URL: /resources/topics/5-diagnosis-psychopathology/sexual-dysfunctions-gender-dysphoria-and-paraphilic-disorders

Verified against standard references (high confidence, not separately OE-queried): sexual dysfunction rule-outs and specifiers, sensate focus (Masters & Johnson), start-stop / pause-squeeze, directed masturbation, PE-SSRI (paroxetine), paraphilia vs paraphilic disorder distinction, covert sensitization, orgasmic reconditioning, antiandrogens (Depo-Provera) / GnRH (Lupron), Dutch protocol vs gender-affirmative model, five paraphilic disorder criteria. OE-checked the below.

### Finding 1 - No error
**Claim (multiple):** Erectile disorder and premature ejaculation require symptoms on 75-100% of occasions for 6+ months; PE = ejaculation within ~1 minute of penetration; gender dysphoria children 6/8 indicators (one being desire to be other gender), adolescents/adults 2/6, both 6 months; pedophilic disorder = prepubescent children (~13 or younger), individual 16+ and 5+ years older, 6 months.
**OE verdict:** All confirmed exactly against DSM-5-TR. Minor note: DSM-5-TR's discussion text acknowledges expert consensus has shifted toward a 2-minute latency for PE, but the formal criterion the lesson quotes ("approximately 1 minute") is still the official wording, so the lesson is correct.
*Cite: DSM-5-TR (APA, 2022).*

No factual errors found; all checked claims accurate.

---

## 5-substance-misuse.md
URL: /resources/topics/5-diagnosis-psychopathology/substance-related-and-addictive-disorders

Verified against standard references (high confidence, not separately OE-queried): substance-induced vs substance-use disorder split, intoxication sign sets, hallucinogen persisting perception disorder, CRA/CRAFT, VBRT/contingency management, PNF, text-message interventions, Marlatt & Gordon relapse prevention / abstinence violation effect, Project MATCH (3 treatments, slight 12-step edge, modest matching support), alcohol/benzo withdrawal seizure risk. OE-checked the below.

### Finding 1 - No error
**Claim (multiple):** SUD = 2+ of 11 criteria in 12 months; opioid withdrawal 3 of 9 (fever is a listed symptom); alcohol withdrawal 2 of 8; tobacco withdrawal 4 of 7 within 24 hours; stimulant withdrawal dysphoric mood + 2 of 5; Korsakoff from thiamine (B1) deficiency; caffeine has no use disorder in DSM-5-TR main text.
**OE verdict:** All confirmed against DSM-5-TR. The lesson's opioid-withdrawal list is truncated (shows 7 of the 9 items) but correctly states "three of nine," and fever is correctly included, so no error, just abbreviated text.
*Cite: DSM-5-TR (APA, 2022).*

No factual errors found; all checked claims accurate.

---

## 5-trauma-dissociation-somatic.md
URL: /resources/topics/5-diagnosis-psychopathology/trauma-stressor-related-dissociative-and-somatic-symptom-disorders

Verified against standard references (high confidence, not separately OE-queried): PTSD 4 symptom clusters and brain changes, RAD vs DSED withdrawal-vs-indiscriminate distinction, APA 2025 PTSD treatment hierarchy (CPT/PE/TF-CBT first-line, EMDR/CT/NET second-line, no first-line meds), critical incident stress debriefing ineffective/harmful, COPE for PTSD+SUD, dissociative amnesia subtypes (localized most common), depersonalization/derealization intact reality testing, somatic symptom vs illness anxiety distinction, conversion/FND, PNES/video-EEG, factitious vs malingering, forced-choice/TOMM. OE-checked the below.

### Finding 1 - No error
**Claim (Acute Stress Disorder, ~line 122):** "Need at least 9 symptoms from any of five categories."
**OE verdict:** Confirmed. DSM-5-TR requires 9 of 14 symptoms across the five categories (intrusion, negative mood, dissociation, avoidance, arousal), duration 3 days to 1 month.
*Cite: DSM-5-TR (APA, 2022).*

### Finding 2 - No error
**Claim (Prolonged Grief Disorder, ~line 129-131):** Death 12 months ago (adults) / 6 months (children), 3 of 8 symptoms nearly daily for the past month.
**OE verdict:** Confirmed exactly against DSM-5-TR.
*Cite: DSM-5-TR (APA, 2022).*

### Finding 3 - No error
**Claim (RAD/DSED, ~line 33, 47):** RAD symptoms started before age 5; both require developmental age of at least 9 months.
**OE verdict:** Confirmed and correctly scoped. The "before age 5" onset criterion is explicit only for RAD (Criterion F), and the lesson attributes it only to RAD (not DSED). The shared 9-month developmental-age requirement is correct. PTSD >1 month / 4 clusters and illness anxiety 6-month duration also confirmed.
*Cite: DSM-5-TR (APA, 2022).*

No factual errors found; all checked claims accurate.



