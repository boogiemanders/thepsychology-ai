# Fact-Check Report - Domain: Clinical Interventions

Method: each lesson's checkable claims verified against OpenEvidence (citation-backed). Tiers: FACTUAL-WRONG (incorrect), MISLEADING (defensible but could mislead), JUDGMENT (diverges from literature but may be the EPPP-accepted answer). Report-only; no lesson/question files edited. When fixes are approved, matching lessonExcerpt quotes in questionsGPT get synced in the same edit.

---

## 6-brief-therapies.md
URL: /resources/topics/6-treatment-intervention/brief-therapies

Verified against standard references (high confidence, not separately OE-queried): IPT founders (Klerman & Weissman), the three IPT stages and four problem areas, "sick role" concept; Solution-Focused founder (de Shazer), miracle/exception/scaling questions, formula first session task; Transtheoretical Model founders (Prochaska & DiClemente), six stages and timelines, decisional balance/self-efficacy/temptation; MI founders (Miller & Rollnick) and definition, theoretical sources, change/sustain/discord talk, decisional balance revision; brief psychodynamic shared features. OE-checked the clinical efficacy claims below.

### Finding 1 - No issue (efficacy claims confirmed)
**Claim (IPT comparison table / MI Effectiveness section):** IPT is "Best For: Depression, eating disorders"; and "MI before CBT shows greater improvement than CBT alone for anxiety disorders."
**OE verdict:** Both accurate. IPT is a first-line evidence-based psychotherapy for depression (VA/DoD 2022 guideline; Cuijpers 2016 meta-analysis g=0.60) and a strongly supported treatment for bulimia nervosa and binge-eating disorder. Adding MI to CBT outperforms CBT alone for anxiety (Marker & Norton 2018 meta-analysis, Hedges g=0.59; Westra 2016 RCT: ~5x higher odds of remission at 12 months).
*Cite: Cuijpers P, et al. Am J Psychiatry. 2016;173(7):680-7. Marker I, Norton PJ. Clin Psychol Rev. 2018;62:1-10.*

No factual errors found; all checked claims accurate.

**Excerpt sync:** none needed (no changes).

---

## 6-cbt.md
URL: /resources/topics/6-treatment-intervention/cognitive-behavioral-therapies

Verified against standard references (high confidence, not separately OE-queried): Beck founder/cognitive triad/three components (schemas, automatic thoughts, distortions), the five cognitive distortion definitions, collaborative empiricism/Socratic dialogue; Ellis REBT A-B-C-D-E model; Meichenbaum self-instructional training five stages and stress inoculation three phases; ACT clean vs dirty pain and six core processes; MBSR/MBCT eight-session format; Safety Planning Intervention six steps. OE-checked the clinical efficacy claims below.

### Finding 1 - No issue (efficacy claims confirmed)
**Claim (ACT, MBCT, and Suicide Prevention sections):** "ACT is evidence-based for chronic pain, psychosis, depression, anxiety disorders, and OCD"; MBCT "originally developed for recurrent depression"; "Safety plans are evidence-based. No-suicide contracts... are NOT supported by research."
**OE verdict:** All accurate. ACT has a broad evidence base across all five named conditions (chronic pain is its strongest; psychosis, depression, anxiety comparable to CBT; OCD growing but solid, non-inferior to CBT/ERP in a 2025 RCT). MBCT is well-supported for preventing depressive relapse (Kuyken 2016 JAMA Psychiatry IPD meta-analysis, HR 0.69 vs usual care); NICE recommends it for >=3 prior episodes. Safety Planning Intervention reduces suicidal behavior (Stanley 2018: 45% fewer; Nuij 2021 meta-analysis RR 0.57). No-suicide contracts have no empirical support and are discouraged (Rudd 2006; Kroll 2000).
*Cite: Kuyken W, et al. JAMA Psychiatry. 2016;73(6):565-74. Stanley B, et al. JAMA Psychiatry. 2018;75(9):894-900.*

No factual errors found; all checked claims accurate.

**Excerpt sync:** none needed (no changes).

---

## 6-family-and-group.md
URL: /resources/topics/6-treatment-intervention/family-therapies-and-group-therapies

Verified against standard references (high confidence, not separately OE-queried): systems theory, homeostasis, cybernetic feedback loops, symmetrical/complementary interactions; all eight family therapy approaches and their founders (Bowen, Minuchin, Haley, Selvini-Palazzoli, Satir, White & Epston, Johnson & Greenberg, Alexander & Parsons, Henggeler) and signature techniques; Yalom & Leszcz group stages and 11 therapeutic factors. OE-checked the clinical/empirical claims below.

### Finding 1 - JUDGMENT (double-bind and schizophrenia)
**Claim (Communication Patterns section, ~line 34):** "Bateson linked this pattern [double-bind] to schizophrenia development."
**OE verdict:** The attribution is historically accurate (Bateson et al. 1956 did propose this), so as a statement of what Bateson believed it is correct. But the double-bind theory as a CAUSE of schizophrenia has been discredited; modern models treat schizophrenia as multifactorial (genetic plus environmental). The lesson only says Bateson "linked" it, not that it is true, so this is not an error. Flagging as JUDGMENT because a careless reader could take it as endorsed causation. The expressed emotion (EE) construct survived as a validated predictor of relapse, not onset.
*Cite: Hall JA, Levin S. Br J Psychiatry. 1980;137:78-92. Howes OD, Murray RM. Lancet. 2014;383(9929):1677-87.*
**Suggested fix (lesson-voice, optional):** "Bateson thought this pattern helped cause schizophrenia. Later research did not back that up. Today we know schizophrenia comes from many causes (genes plus environment), not bad family talk. The exam may still ask you to link Bateson and the double-bind, so keep that pairing."

### Finding 2 - No issue (FFT and MST evidence base)
**Claim (Section 8):** FFT and MST are "evidence-based approaches for at-risk adolescents" (conduct disorder, substance use, offenders).
**OE verdict:** Accurate as stated and matches the EPPP-accepted view. Both are listed as evidence-based by major clearinghouses and meet APA "probable efficacy" criteria; meta-analyses show significant effects (MST: van der Stouwe 2014; FFT: Hartnett 2017, d=0.48 vs untreated). Note for awareness only: a rigorous 2025 JAACAP review found their advantage over well-delivered usual care may be smaller than older studies suggested, and UK replication trials (START, Humayun) were null. This does not change the "evidence-based" label and is not an EPPP-level concern.
*Cite: van der Stouwe T, et al. Clin Psychol Rev. 2014;34(6):468-81. Hunkin H, et al. JAACAP. 2025;64(4):427-446.*

**Excerpt sync:** if the double-bind line is changed, grep questionsGPT for excerpts quoting "linked this pattern to schizophrenia" and sync.

---

## 6-psychodynamic-and-humanistic.md
URL: /resources/topics/6-treatment-intervention/psychodynamic-and-humanistic-therapies

Verified against standard references (high confidence, not separately OE-queried): Freud id/ego/superego, defense mechanisms, four targets of analysis and four-step process; Jung personal vs collective unconscious, archetypes, individuation; Rogers three facilitative conditions and incongruence/conditions of worth; Gestalt boundary disturbances, empty chair, dream work; existential four ultimate concerns and normal vs neurotic anxiety; Glasser reality therapy/WDEP and five needs; Kelly personal constructs and fixed-role therapy. These are therapy-theory and founder attributions (OE returns little here; verified against standard references). OE-checked the one empirical health claim below.

### Finding 1 - No issue (positive psychology health claim confirmed)
**Claim (Positive Psychology section, ~line 191):** "Studies have linked positive emotions and optimism to longer life and improved physical health."
**OE verdict:** Accurate and well-supported. Meta-analyses and large cohorts link higher optimism to lower all-cause mortality (Rozanski 2019: RR 0.86) and longer lifespan, with AHA recognizing positive psychological health for cardiovascular health. Caveat (not an error): evidence is mostly observational, and one reanalysis found absence of pessimism predicts health more strongly than presence of optimism.
*Cite: Rozanski A, et al. JAMA Netw Open. 2019;2(9):e1912200. Levine GN, et al. Circulation. 2021;143(10):e763-e783.*

No factual errors found; all checked claims accurate.

**Excerpt sync:** none needed (no changes).

---

## 6-prevention-and-consultation.md
URL: /resources/topics/6-treatment-intervention/prevention-consultation-and-psychotherapy-research

Verified against standard references (high confidence, not separately OE-queried): Caplan prevention model (1964) and four consultation types/theme interference, Gordon prevention model (1983) and IOM continuum, consultation vs collaboration; Eysenck 1952 figures (72%/64%/44%) and Bergin recalculation; Smith Glass & Miller 1980 (475 studies, ES .85); Howard dosage and phase models; Norcross & Lambert common-factors percentages; Greenson working alliance components; ethnic-matching effect sizes (.32/.09); utilization patterns; alpha/beta bias, androcentrism, WEIRD sampling; ROM, stepped care, treatment fidelity, transdiagnostic examples (CBT-E, UP, ACT, PCIT); economic methods (CBA/CEA/CUA); disability models (biomedical/social/functional/forensic). These are history, research-methods, and framework claims (OE non-clinical territory). OE-checked the two clinical efficacy/outcome claims below.

### Finding 1 - No issue (telepsychology and cost-offset confirmed)
**Claim (Telepsychology section, ~line 200-206; Economics section, ~line 137):** Videoconference CBT is "comparable to in-person therapy" for anxiety, PTSD, and depression; and psychological interventions produce a "medical cost offset," with one meta-analysis citing ~20% average reduction in medical costs.
**OE verdict:** Both accurate. Multiple meta-analyses show video CBT is non-inferior to in-person for anxiety, PTSD (strongest evidence), and depression (Fernandez 2021; Hedman-Lagerlof 2023 g=0.02). Medical cost offset is well-supported (Bellon 2022 dose-response; Hawrilenko 2025 ~1.9x ROI; Bui 2021). The "20% reduction" figure reflects the older Chiles et al. cost-offset literature the lesson cites and remains broadly defensible.
*Cite: Fernandez E, et al. Clin Psychol Psychother. 2021;28(6):1535-49. Bellon J, et al. JAMA Netw Open. 2022;5(12):e2244644.*

No factual errors found; all checked claims accurate.

**Excerpt sync:** none needed (no changes).
