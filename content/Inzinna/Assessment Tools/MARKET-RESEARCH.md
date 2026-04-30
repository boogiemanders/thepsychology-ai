# BAARS & ADHD-RS Market Research — Competitive Intelligence

> Last updated: 2026-04-08

## Context
Market research to inform Assessment Engine v1 — starting with BAARS and ADHD-RS. Covers clinician pain points, competitor gaps, and positioning opportunities.

---

## 1. BAARS (Barkley Adult ADHD Rating Scale-IV)

### Strengths Clinicians Value
- **Cost model**: One-time $136 purchase + unlimited photocopies. Huge advantage over per-use platforms like CAARS 2
- **Speed**: 5-7 min (long form), 3-5 min (quick screen) — one of the fastest adult ADHD assessments
- **Unique SCT module**: Only scale with a 9-item Sluggish Cognitive Tempo / Cognitive Disengagement Syndrome subscale. No competitor replicates this
- **Multi-rater**: Self-report + other-report (spouse, parent, sibling) + childhood retrospective
- **Functional impairment**: One of the only adult ADHD scales that assesses functional impairment (not just symptoms)
- **Large norms**: N > 1,200 adults, ages 18-89, with separate age-band score sheets

### Weaknesses / Known Problems
- **Poor discriminative validity**: Weak at distinguishing ADHD from healthy controls, depression, or anxiety groups
- **Self-report version unreliable**: Vanderbilt study found no significant difference between ADHD and non-ADHD groups on self-report (parent-report worked, p < 0.0001)
- **No malingering detection**: Zero embedded validity indicators. CAARS 2 has two (Infrequency Index, Exaggeration Index). In an era of stimulant-seeking, this is a dealbreaker for many clinicians
- **DSM-IV anchored**: Built on 1994 criteria despite DSM-5 (2013) and DSM-5-TR (2022) updates
- **Retrospective childhood recall**: Highly vulnerable to memory distortion
- **Cultural/linguistic limitations**: Normed primarily on English-speaking US populations

### Clinician Frustrations
- **Paper-only, manual scoring** — no official digital platform exists. Clinicians hand-calculate raw scores, look up percentiles in age/gender norm tables manually
- **No EHR integration** — results can't flow into SimplePractice, TherapyNotes, etc.
- **Cannot detect faking** — major concern with rising ADHD malingering
- **Not standalone diagnostic** — must be paired with clinical interview and collateral data
- **Clinicians prefer broader tools**: Research suggests CAARS is more useful because it goes beyond the 18 DSM symptoms already covered in interview

### Existing Digital Solutions for BAARS
| Product | What It Does | Limitation |
|---------|-------------|------------|
| ADHDme.care | Unofficial online self-assessment using BAARS questions | Consumer-facing, not clinical, no scoring integration |
| **Nothing else** | No official digital BAARS scoring platform exists | **This is the gap** |

---

## 2. ADHD-RS (ADHD Rating Scale, IV & 5)

### Strengths Clinicians Value
- **Brevity**: 5 minutes, 18 items — "exceptional for assessing ADHD and measuring treatment effects"
- **20+ years of research**: Validated in multinational studies
- **DSM alignment**: 1:1 mapping to DSM criteria (DSM-IV for RS-IV, DSM-5 for RS-5)
- **Cost**: Same $136 reproducible book model as BAARS
- **Pharma gold standard**: Dominant outcome measure in clinical trials — enormous credibility

### Weaknesses / Known Problems
- **No adult version**: DuPaul ADHD-RS validated only for ages 5-17. Adults need completely different instruments
- **Rater discrepancy**: Low agreement between parent and teacher ratings, especially on Hyperactivity-Impulsivity. No built-in method to reconcile conflicting informants
- **Cross-cultural bias**: UK parent ratings at 80th percentile = 93rd-98th percentile of Hong Kong ratings. Norms based on narrow population subset
- **Not standalone**: "Responses and scores are not sufficient for a diagnosis of ADHD"
- **Lower sensitivity than objective measures**: QbTest identified improvement in 57% of patients vs. only 40% with ADHD-RS

### Clinician Frustrations
- **Manual scoring + norm lookup** — hand-sum items, then cross-reference printed norm tables by age/gender/informant. Every competitor has gone digital
- **No digital administration or auto-scoring** — no online portal, no EHR integration, no automated reports
- **Version confusion (IV vs. 5)** — two versions circulate simultaneously, no score crosswalk
- **No comorbidity screening** — ADHD-only. Vanderbilt screens ODD/anxiety/depression; Conners 4 screens emotional dysregulation, anxiety, mood, ODD, conduct, self-harm, sleep
- **No longitudinal tracking** — no way to visualize score changes over time

### Competitive Landscape
| Dimension | ADHD-RS | Vanderbilt | Conners 4 | ASRS (Adults) |
|-----------|---------|------------|-----------|---------------|
| Cost | $136 book | **Free** | Per-use | **Free** |
| Digital scoring | None | Easily automated | Fully digital (Q-global) | Multiple platforms |
| Comorbidities | None | ODD, anxiety, depression | ODD, mood, anxiety, conduct, sleep | ADHD only |
| Ages | 5-17 | 6-12 | 6-18 + adults | Adults 18+ |
| Auto-reports | None | Available | Yes | Yes |
| EHR integration | None | Creyos, NovoPsych | Q-global | MDCalc, NovoPsych |
| AAP endorsed | No | **Yes** | No | No |

---

## 3. Broader Market Intelligence

### The Scoring Workflow Pain (Universal)
Typical clinician ADHD eval workflow today:
1. Administer paper forms or deliver via one platform
2. Log into a **different** platform to score
3. Purchase credits/reports
4. Download PDF report
5. Manually extract relevant scores
6. Re-type scores into clinical note in EHR
7. Write interpretive summary (duplicating the report in their own words)
8. Cross-reference multiple instruments manually

**Clinician quotes** (paraphrased from forums):
- "I spend more time logging into scoring platforms and buying credits than actually interpreting results"
- "Why can't I just enter raw scores somewhere and get a table with all my T-scores and percentiles?"
- "I have to use 3 different platforms to score one ADHD battery — MHS for Conners, PAR for BRIEF, Pearson for WISC"
- "I'd kill for something that takes my raw scores and generates the table I need for my report"

### Multi-Platform Tax Per Eval
A comprehensive ADHD eval currently costs $50-100+ just in scoring platform fees:
- Conners-4 (MHS): $3-5/score
- BRIEF-2 (PAR): $3-5/score
- CAARS-2 (PAR): $3-5/score
- CPT-3 (MHS): $15-25
- Plus 3-4 different logins

### Existing Digital Products & Their Gaps
| Product | What It Does | Pricing | Key Limitation |
|---------|-------------|---------|----------------|
| PARiConnect | Scoring/reports for PAR tests | $2-5/score, $10-25/report | Only PAR instruments; clunky UI; no EHR integration; credits expire |
| Q-interactive (Pearson) | iPad-based admin/scoring | ~$200/yr + $2-4/subtest | iPad-only; crashes; predatory subscription; Pearson-only |
| MHS Online Assessment Center | Conners-4, CPT-3, CEFI-2 | $3-5/score, $15-30/report | Separate platform; no EHR integration; verbose templates |
| NovoPsych | 150+ scales, auto-scoring, longitudinal | Subscription | Has ASRS, Vanderbilt — **no BAARS, no ADHD-RS** |
| Creyos | Cognitive + questionnaire protocol | ~$100-150/eval | Uses ASRS/SWAN, not BAARS or ADHD-RS |
| QbTest | Objective CPT + motion tracking | $25-50/test + hardware | Expensive hardware; not standalone |
| ADHD TrEAT (CADDRA) | Fillable auto-scored scales | $125/yr | Canada-focused |

### Willingness to Pay Signals
- Solo practitioners: **$30-50/mo** for unified scoring dashboard
- Per-eval report generation: **$15-25** (saves 2-3 hours at $150-250/hr)
- Comprehensive ADHD evals charged to patients: **$1,500-3,500**
- Clinicians currently spend $50-100+ per eval on fragmented scoring platforms
- Strong WTP for anything that cuts report time by 30-50%

### Market Size
- Global ADHD Apps Market: $2.08B (2024), projected $7.55B by 2033 (15.39% CAGR)
- ~100,000 psychologists + ~30,000 neuropsychologists in US
- Integration solutions show 23% workflow efficiency improvement and 75% reduction in manual data entry

---

## 4. The Gaps That Matter Most

### For BAARS Specifically
1. **No digital scoring platform exists** — the single biggest gap
2. No EHR integration
3. No validity/malingering detection layer
4. No DSM-5-TR alignment
5. No longitudinal tracking / treatment monitoring
6. No telehealth-ready format

### For ADHD-RS Specifically
1. **No digital ADHD-RS-5 scoring platform** — same gap
2. No automated norm lookup (manual age x gender x informant table cross-reference)
3. No multi-informant visualization (parent vs. teacher agreement/discrepancy)
4. No comorbidity screening bundle
5. No adult version

### For the Assessment Market Overall
1. **No unified scoring across publishers** — clinicians juggle 3-4 platforms
2. **No raw-score-to-report-table automation** — the #1 time sink
3. **No cross-measure pattern detection** — clinicians do this in their heads
4. **No AI-assisted report narrative** from scored results
5. **No DSM-5 criterion mapping** from assessment results
6. **No billing code recommendation** based on what was administered

---

## 5. Strategic Implications for Assessment Engine v1

### What to Build (Prioritized)
1. **Digital scoring that actually works** — auto-score BAARS + ADHD-RS with no manual norm lookup. This alone is differentiated because nobody offers it
2. **Clean clinical output** — formatted summary that can drop directly into a report or note. Not a generic PDF — a clinician-ready paragraph
3. **Multi-informant view** — show self vs. collateral ratings side by side with agreement/discrepancy flags
4. **Symptom count + threshold logic** — DSM-style "X of Y symptoms in clinically significant range"
5. **Longitudinal tracking** — re-administer and show score changes over time (treatment monitoring)

### What NOT to Build Yet
- Don't chase malingering detection (complex, needs validation research)
- Don't build comorbidity screening (scope creep — stay focused on ADHD)
- Don't try to integrate with EHRs yet (SimplePractice API is limited)
- Don't build CPT/objective testing (hardware-dependent, patent-heavy)

### Positioning
Don't call it "BAARS scorer" or "ADHD-RS tool." Call it:
- **"Assessment Engine"** or **"ADHD Assessment Pipeline"**
- Scalable name that can grow to more instruments
- Positions as infrastructure, not a one-off

### Competitive Moat
- BAARS has **no digital solution anywhere**. First mover advantage is real
- ADHD-RS has **no digital solution anywhere**. Same opportunity
- The AI interpretation layer (generating clinical summary text) is something publishers don't offer
- The unified multi-instrument view is something no single platform provides

### Legal Consideration
- Norm tables are copyrighted by publishers
- Scoring algorithms (age-based lookup math) are factual/mathematical — gray area
- Safest path: tool works WITH clinician-purchased instruments (they bring the content, you provide the workflow)
- Free public-domain screeners (ASRS, Vanderbilt, PHQ-9) can be freely scored as a growth funnel

### Demo Script for Bret
1. Fill out form in 30 seconds
2. Show auto-scored sheet with subscale breakdowns
3. Show clean clinical summary output
4. Say: "This replaces manual scoring and gives you something you can drop directly into your report"
5. Then: "If we expand to more assessments, we standardize your entire workflow"

---

## Sources
- Guilford Press BAARS-IV product page
- PMC6086381, PMC6458092, PMC5291336 (BAARS validation studies)
- medRxiv 2023.05.30.23290708v2 (BAARS discriminative validity review)
- Frontiers in Psychiatry 2025/1532807 (malingering detection gap)
- MHS CAARS 2, Creyos, NovoPsych, QbTech product documentation
- CHADD, AAP, CADDRA clinical resources
- Reddit r/neuropsychology, r/psychotherapy, r/ADHD (paraphrased clinician discourse)
- PubMed 26867860, 39465583 (BAARS sensitivity/specificity studies)
