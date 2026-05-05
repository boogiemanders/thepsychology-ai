# Adaptive Decision Criteria and Biomarker Thresholds for Integrated Chronic Pain Protocol

Detailed specification of the adaptive decision criteria, biomarker thresholds, and decision logic for the Week 5 decision point and subsequent treatment adjustments.

---

## WEEK 5 ADAPTIVE DECISION POINT: CLINICAL CRITERIA

The primary decision at Week 5 is whether the patient is a responder (continue psychotherapy alone) or non-responder (augment with biofeedback). This decision uses a tiered system combining patient-reported outcomes with biomarker data.

### Tier 1: Patient-Reported Outcome Thresholds

The IMMPACT consensus and multiple SMART trials converge on the following clinically validated thresholds: [1][2][3][4][5]

- **Responder:** ≥30% reduction in BPI total score (pain severity composite) from baseline, OR ≥1-point absolute reduction on BPI interference (0-10 scale). This 30% threshold represents a "moderate clinically important difference" and is the standard used in the SCOPE, SPACE, VOICE, and OPTIMIZE trials. [1][3][4][6]
- **Partial responder:** 15-29% reduction in BPI total score, OR 0.5-0.9 point reduction on BPI interference. These patients have shown some movement but have not crossed the clinically meaningful threshold.
- **Non-responder:** <15% reduction in BPI total score AND <0.5-point reduction on BPI interference.

The OPTIMIZE SMART trial (Fritz et al., 2026, N = 749) used a similar binary responder/non-responder classification after 8 weeks of first-stage treatment (PT or CBT), with non-responders re-randomized to second-stage treatment. In the proposed protocol, the decision point is moved earlier (Week 5) because the PRT trial demonstrated that most treatment effects emerge within the first 4 weeks of active psychotherapy, and the CT/MBSR/BT comparison trial showed benefits typically appearing by session 6. [7][8][6]

The military SMART trial (Flynn et al.) used an even earlier decision point — 3 weeks — with non-responders re-randomized, while the Hassett et al. interventional response phenotyping SMART used a 4-week run-in followed by 8-week treatment blocks. [9][10]

### Decision logic at Week 5:

- **Responder (≥30% BPI reduction):** Continue psychotherapy through Week 8. Biofeedback is optional and offered as an enhancement rather than a necessity. Proceed directly to Phase 4 (Integration) at Week 9.
- **Partial responder (15-29% BPI reduction):** Continue psychotherapy AND begin biofeedback augmentation (Phase 3) concurrently starting Week 5. The rationale is that partial responders are engaging with the psychotherapy mechanism but may benefit from additional bottom-up self-regulation training.
- **Non-responder (<15% BPI reduction):** Begin biofeedback augmentation immediately AND consider psychotherapy track switching (e.g., PRT → EAET, or ACT → PRT). The Hassett et al. SMART design similarly re-randomizes non-responders to a different treatment modality. [9]

---

## TIER 2: EEG BIOMARKER DECISION CRITERIA

EEG data collected at baseline (Week 0) and optionally at Week 5 can refine the clinical decision. While no absolute power thresholds have been validated as treatment-switching criteria, the following parameters have the strongest evidence base.

### Baseline EEG phenotyping for initial track assignment:

- **Elevated theta power (4-8 Hz) at central sites with reduced alpha peak frequency:** Associated with greater pain intensity in the mega-analysis of 614 patients, driven by limbic network connectivity at theta frequencies. These patients may be best suited for PRT (targeting threat-based pain processing) or β1/β2 neurofeedback (which specifically reduced ongoing pain intensity in the Mussigmann et al. trial). [11][12]
- **Reduced alpha power (8-12 Hz) with preserved theta:** May indicate disrupted inhibitory cortical processing. These patients are candidates for alpha-upregulation neurofeedback. Importantly, the individual alpha peak frequency should be identified, as chronic pain patients often have a shifted dominant alpha frequency (mean ~7.6 Hz vs. ~10 Hz in healthy populations). Neurofeedback targeting the individual alpha band (α ± 2 Hz) produced significantly larger alpha increases and greater pain reduction than targeting the fixed 8-12 Hz band. [13]
- **Elevated high-beta (20-30 Hz):** Suggests cortical hyperexcitability and is associated with anxiety/rumination. These patients may benefit most from α/θ neurofeedback training, which specifically reduced anxiety and depression in the Mussigmann et al. neuropathic pain trial. [12][14]

### Week 5 EEG reassessment (if performed):

- **Responder EEG signature:** In the Mussigmann et al. trial, responders to β1/β2 neurofeedback showed increased β1 activity or β1/β2 ratio in resting-state EEG during or after training sessions. Responders to α/θ training showed increased β1/β2 ratio during sessions. These within-session and between-session EEG changes distinguished responders from non-responders. [12]
- **Longitudinal EEG change:** The Heitmann et al. longitudinal study found that clinical improvement after interdisciplinary pain therapy was associated with increased global network efficiency at theta frequencies — not with changes in spectral power alone. This suggests that connectivity-based metrics may be more sensitive treatment-response markers than simple power measures. [15]
- **Alpha state dynamics:** Rather than mean alpha power, the fractional occupancy (time spent in high-alpha state), dwell time, and transition probability from low-to-high alpha state correlated significantly with pain reduction during neurofeedback (r = −0.45 to −0.48). These dynamic parameters may be more sensitive indicators of neurofeedback learning and clinical response than static power measures. [16]

### Practical EEG decision rule at Week 5:

If a patient is a clinical partial responder AND shows no increase in individual alpha band power or no decrease in theta/alpha ratio from baseline → strong indication for biofeedback augmentation, as the cortical oscillatory abnormality has not begun to normalize through psychotherapy alone.

If a patient is a clinical non-responder BUT shows favorable EEG shifts (increasing alpha, decreasing theta) → consider continuing the current psychotherapy track for 2 additional weeks before switching, as the neurophysiological substrate may be changing ahead of subjective improvement.

---

## TIER 3: HRV BIOMARKER DECISION CRITERIA

### Baseline HRV phenotyping:

The meta-analytic evidence shows chronic pain patients have reduced RMSSD and HF-HRV compared to healthy controls, with a pooled effect size of g = −0.52 for vagal indices. [17] Specific values from the literature:

- **Fibromyalgia:** RMSSD during N2 sleep was 30 ± 12 ms (patients) vs. 42 ± 13 ms (controls); during REM sleep, 23 ± 11 ms vs. 37 ± 16 ms. [18]
- **Chronic neck pain:** rMSSD showed high discriminatory capacity between patients and healthy controls (AUC = 0.932), with patients showing significantly lower parasympathetic indices. [19]
- **Sciatica:** HF power was markedly lower in patients vs. controls (p < 0.0001), with a modest negative correlation between HF power and pain duration (r = −0.232). [20]

However, a large multicenter study (N = 366) found that individual HRV parameters are not suitable as surrogate markers for pain intensity — the highest surrogacy point estimate was only 0.096 for mean heart rate. [21] This means HRV should be used as a phenotyping and treatment-matching tool, not as a direct pain intensity proxy.

### Resonance frequency (RF) assessment considerations:

A critical finding is that RF is not stable over time — it changed between test and retest sessions in 66.7% of participants. [22] Therefore, RF should be reassessed before each biofeedback session block (or at minimum every 2 weeks) rather than relying on the Week 0 assessment alone. The Shaffer & Meehan practical guide recommends testing breathing rates from 4.0 to 7.0 breaths/min in 0.5-breath increments and selecting the rate producing the highest HRV amplitude, with fine-tuning at ±0.5 breaths/min around the initial estimate. [23]

### HRV response criteria during biofeedback training:

- **Minimum effective dose:** 4 sessions are needed to produce measurable increases in HRV indices and decreases in breathing rate compared to relaxation training. Significant within-session improvements in HRV emerge at weeks 3-4 compared to weeks 1-2. [24]
- **Training response indicator:** Progressive increase in RMSSD and HF-HRV from pre-training baseline to post-training baseline across sessions. The Koenig et al. occupational cohort study found that effective analgesic treatment (of any kind) was associated with restoration of vmHRV (RMSSD), while ineffective treatment was associated with the lowest vmHRV values. [25]
- **Non-response indicator:** If after 4 biofeedback sessions (Week 7), there is no increase in resting RMSSD or HF-HRV from the Week 5 baseline, consider: (a) reassessing resonance frequency, (b) switching from preset-pace to optimal RF protocol, or (c) adding VR immersion to enhance engagement and autonomic response. [26]

### Practical HRV decision rule at Week 5:

Patients with baseline RMSSD in the lowest quartile for their age/sex (indicating severe vagal impairment) should be prioritized for biofeedback augmentation regardless of clinical response status, as they have the greatest autonomic dysregulation to correct and may be at higher cardiovascular risk from chronic pain-related autonomic dysfunction. [27]

---

## INTEGRATED DECISION MATRIX

| Clinical response (BPI) | EEG signal | HRV signal | Action at Week 5 |
|---|---|---|---|
| Responder (≥30%) | Any | Any | Continue psychotherapy; biofeedback optional |
| Partial (15-29%) | No favorable shift OR elevated theta persists | Low RMSSD persists | Add biofeedback (both EEG NF + HRV BFB) |
| Partial (15-29%) | Favorable shift (alpha rising, theta falling) | RMSSD trending up | Continue psychotherapy 2 more weeks, reassess |
| Non-responder (<15%) | No favorable shift | Low RMSSD persists | Switch psychotherapy track + add biofeedback |
| Non-responder (<15%) | Favorable shift | RMSSD trending up | Continue current track 2 weeks, then reassess |
| Any | Any | Bottom quartile RMSSD for age/sex | Prioritize HRV biofeedback augmentation regardless |

---

## WEEK 8 AND WEEK 12 REASSESSMENT CRITERIA

### Week 8 (end of psychotherapy core):

- Repeat full questionnaire battery (BPI, PCS, TSK, CPAQ, PHQ-9, GAD-7)
- Repeat resting-state EEG (compare to baseline)
- The key EEG responder signature to look for: increased β1 activity or β1/β2 ratio in resting state (for β1/β2 protocol patients), or increased individual alpha band power (for alpha protocol patients). [12][13]
- For neurofeedback patients: assess transfer — can the patient maintain the trained EEG pattern during a 5-minute "transfer task" without feedback? In the Mussigmann et al. trial, 12 of 15 responders showed partial maintenance of therapeutic benefit during transfer. [12]

### Week 12 (primary endpoint):

- Full battery + EEG + HRV
- **Treatment success:** ≥30% BPI reduction from baseline (moderate improvement) or ≥50% reduction (substantial improvement), per IMMPACT recommendations. [2]
- **Neurofeedback success:** Clinically significant pain reduction (≥30%) AND evidence of EEG self-regulation (increased alpha fractional occupancy or improved target ratio during transfer task). [13][16]
- **HRV success:** Resting RMSSD increase of ≥1 SD from baseline, or normalization into the age/sex-appropriate reference range.

---

## IMPORTANT CAVEATS

The biomarker thresholds proposed above are derived from the best available cross-sectional and treatment studies, but none have been prospectively validated as treatment-switching decision rules in a clinical trial. The EEG mega-analysis found limited replicability of associations between pain intensity and brain connectivity across datasets, highlighting the challenge of using EEG as an individual-level decision tool. [11] HRV has been explicitly shown to be unsuitable as a surrogate marker for pain intensity at the individual level. [21] The proposed decision matrix should therefore be considered a research framework requiring prospective validation, not a clinically validated algorithm.

The most robust element of the decision system is the clinical response threshold (≥30% BPI reduction), which has been validated across multiple large RCTs and is the standard used in the IMMPACT consensus, the OPTIMIZE SMART trial, the SPACE trial, and the VOICE trial. [6][1][3][4] The biomarker tiers add mechanistic precision but should be weighted as supplementary to, not replacements for, patient-reported outcomes.

---

## References

1. Kroenke K, Krebs EE, Wu J, et al. Telecare Collaborative Management of Chronic Pain in Primary Care: A Randomized Clinical Trial. JAMA. 2014;312(3):240-8. doi:10.1001/jama.2014.7689.
2. Richards BL, Whittle SL, Buchbinder R. Neuromodulators for Pain Management in Rheumatoid Arthritis. The Cochrane Database of Systematic Reviews. 2012;1:CD008921. doi:10.1002/14651858.CD008921.pub2.
3. Krebs EE, Gravely A, Nugent S, et al. Effect of Opioid vs Nonopioid Medications on Pain-Related Function in Patients With Chronic Back Pain or Hip or Knee Osteoarthritis Pain: The SPACE Randomized Clinical Trial. JAMA. 2018;319(9):872-882. doi:10.1001/jama.2018.0899.
4. Krebs EE, Becker WC, Nelson DB, et al. Care Models to Improve Pain and Reduce Opioids Among Patients Prescribed Long-Term Opioid Therapy: The VOICE Randomized Clinical Trial. JAMA Internal Medicine. 2025;185(2):208-220. doi:10.1001/jamainternmed.2024.6683.
5. Reed DE, Stump TE, Monahan PO, Kroenke K. Comparable Minimally Important Differences and Responsiveness of Brief Pain Inventory and PEG Pain Scales Across 6 Trials. The Journal of Pain. 2024;25(1):142-152. doi:10.1016/j.jpain.2023.07.028.
6. Fritz JM, Skolasky RL, Brennan G, et al. Effectiveness of Nonpharmacologic Treatments for Chronic Low Back Pain: A Sequential, Multiple-Assignment, Randomized Trial. Annals of Internal Medicine. 2026;. doi:10.7326/ANNALS-25-04645.
7. Ashar YK, Gordon A, Schubiner H, et al. Effect of Pain Reprocessing Therapy vs Placebo and Usual Care for Patients With Chronic Back Pain: A Randomized Clinical Trial. JAMA Psychiatry. 2022;79(1):13-23. doi:10.1001/jamapsychiatry.2021.2669.
8. Burns JW, Jensen MP, Thorn B, et al. Cognitive Therapy, Mindfulness-Based Stress Reduction, and Behavior Therapy for the Treatment of Chronic Pain: Randomized Controlled Trial. Pain. 2022;163(2):376-389. doi:10.1097/j.pain.0000000000002357.
9. Hassett AL, Williams DA, Harris RE, et al. An Interventional Response Phenotyping Study in Chronic Low Back Pain: Protocol for a Mechanistic Randomized Controlled Trial. Pain Medicine (Malden, Mass.). 2023;24(Suppl 1):S126-S138. doi:10.1093/pm/pnad005.
10. Flynn D, Eaton LH, Langford DJ, et al. A SMART Design to Determine the Optimal Treatment of Chronic Pain Among Military Personnel. Contemporary Clinical Trials. 2018;73:68-74. doi:10.1016/j.cct.2018.08.008.
11. Bott FS, Zebhauser PT, Hohn VD, et al. Exploring Electroencephalographic Chronic Pain Biomarkers: A Mega-Analysis. EBioMedicine. 2025;120:105955. doi:10.1016/j.ebiom.2025.105955.
12. Mussigmann T, Bardel B, Créange A, et al. Relieving Chronic Neuropathic Pain With EEG-Neurofeedback. European Journal of Neurology. 2025;32(9):e70363. doi:10.1111/ene.70363.
13. Vučković A, Altaleb MKH, Fraser M, McGeady C, Purcell M. EEG Correlates of Self-Managed Neurofeedback Treatment of Central Neuropathic Pain in Chronic Spinal Cord Injury. Frontiers in Neuroscience. 2019;13:762. doi:10.3389/fnins.2019.00762.
14. Mussigmann T, Bardel B, Lefaucheur JP. Resting-State Electroencephalography (EEG) Biomarkers of Chronic Neuropathic Pain. A Systematic Review. NeuroImage. 2022;258:119351. doi:10.1016/j.neuroimage.2022.119351.
15. Heitmann H, Gil Ávila C, Nickel MM, et al. Longitudinal Resting-State Electroencephalography in Patients With Chronic Pain Undergoing Interdisciplinary Multimodal Pain Therapy. Pain. 2022;163(9):e997-e1005. doi:10.1097/j.pain.0000000000002565.
16. Patel K, Henshaw J, Sutherland H, et al. Using EEG Alpha States to Understand Learning During Alpha Neurofeedback Training for Chronic Pain. Frontiers in Neuroscience. 2020;14:620666. doi:10.3389/fnins.2020.620666.
17. Fernández-Morales C, Espejo-Antúnez L, Rubio-Fernández S, Albornoz-Cabello M, Cardero-Durán MLÁ. Which Moderating Factors Influence Autonomic Imbalance in Chronic Musculoskeletal Pain? A Domain-Specific Systematic Review and Multilevel Meta-Regression of Heart Rate Variability. Pain. 2026;:00006396-990000000-01144. doi:10.1097/j.pain.0000000000003958.
18. Mork PJ, Nilsson J, Lorås HW, et al. Heart Rate Variability in Fibromyalgia Patients and Healthy Controls During Non-REM and REM Sleep: A Case-Control Study. Scandinavian Journal of Rheumatology. 2013;42(6):505-8. doi:10.3109/03009742.2012.755564.
19. Espejo-Antúnez L, Fernández-Morales C, Albornoz-Cabello M, Cardero-Durán MLÁ. Does Pain Location Influence Heart Rate Variability? A Comparative Analysis of Patients With Neck or Low Back Pain, and Healthy Controls. Behavioural Brain Research. 2025;:115811. doi:10.1016/j.bbr.2025.115811.
20. Södervall J, Karppinen J, Puolitaival J, et al. Heart Rate Variability in Sciatica Patients Referred to Spine Surgery: A Case Control Study. BMC Musculoskeletal Disorders. 2013;14:149. doi:10.1186/1471-2474-14-149.
21. Moens M, Billet B, Molenberghs G, et al. Heart Rate Variability Is Not Suitable as a Surrogate Marker for Pain Intensity in Patients With Chronic Pain. Pain. 2023;164(8):1741-1749. doi:10.1097/j.pain.0000000000002868.
22. Capdevila L, Parrado E, Ramos-Castro J, Zapata-Lamana R, Lalanza JF. Resonance Frequency Is Not Always Stable Over Time and Could Be Related to the Inter-Beat Interval. Scientific Reports. 2021;11(1):8400. doi:10.1038/s41598-021-87867-8.
23. Shaffer F, Meehan ZM. A Practical Guide to Resonance Frequency Assessment for Heart Rate Variability Biofeedback. Frontiers in Neuroscience. 2020;14:570400. doi:10.3389/fnins.2020.570400.
24. Lin IM, Chen TC, Tsai HY, Fan SY. Four Sessions of Combining Wearable Devices and Heart Rate Variability (HRV) Biofeedback Are Needed to Increase HRV Indices and Decrease Breathing Rates. Applied Psychophysiology and Biofeedback. 2023;48(1):83-95. doi:10.1007/s10484-022-09567-x.
25. Koenig J, Jarczok MN, Fischer JE, Thayer JF. The Association of (Effective and Ineffective) Analgesic Intake, Pain Interference and Heart Rate Variability in a Cross-Sectional Occupational Sample. Pain Medicine. 2015;16(12):2261-70. doi:10.1111/pme.12825.
26. Lalanza JF, Lorente S, Bullich R, et al. Methods for Heart Rate Variability Biofeedback (HRVB): A Systematic Review and Guidelines. Applied Psychophysiology and Biofeedback. 2023;48(3):275-297. doi:10.1007/s10484-023-09582-6.
27. Bruehl S, Olsen RB, Tronstad C, et al. Chronic Pain-Related Changes in Cardiovascular Regulation and Impact on Comorbid Hypertension in a General Population: The Tromsø Study. Pain. 2018;159(1):119-127. doi:10.1097/j.pain.0000000000001070.
