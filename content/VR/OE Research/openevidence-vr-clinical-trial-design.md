# Clinical Trial Design Framework for Multimodal VR-Biofeedback Psychotherapy

Source: OpenEvidence research synthesis. Framework for validating a multimodal VR platform integrating EEG neurofeedback, HRV biofeedback, and multiple psychotherapy modalities.

## Phase 1: Feasibility and Pilot Studies (N = 20 to 40 per population)

### Primary Objectives

- Establish safety and tolerability
- Assess technical feasibility of multimodal sensor integration
- Refine intervention protocols
- Generate preliminary efficacy signals

### Design Elements

Single-arm or small RCT with 3 to 4 arms:

1. VR + EEG + HRV biofeedback (full multimodal)
2. VR + HRV biofeedback only
3. VR therapy alone (no biofeedback)
4. Waitlist or treatment-as-usual control

### Session Structure

- Duration: 10 to 20 minute VR sessions [1]
- Frequency: 2 to 3 sessions per week
- Total sessions: 6 to 12 sessions over 4 to 8 weeks [2][3]
- Biofeedback training: minimum 4 sessions needed to increase HRV indices and decrease breathing rates [4]

### Critical Feasibility Metrics

| Metric | Target Threshold | Measurement Method | Refs |
|--------|-------------------|---------------------|------|
| Completion rate | >=80% complete all sessions | Session attendance logs | [1][2] |
| Cybersickness | <20% moderate-severe symptoms | Simulator Sickness Questionnaire (SSQ) | [1] |
| Presence | Mean score >=4/7 on presence scale | Igroup Presence Questionnaire (IPQ) | [1] |
| Treatment satisfaction | >=80% satisfied/very satisfied | Client Satisfaction Questionnaire (CSQ-8) | [3] |
| Technical reliability | <5% data loss from sensor failures | System logs, data quality metrics | [4][5] |
| EEG signal quality | >80% usable epochs after artifact rejection | Automated quality metrics | [6] |
| HRV biofeedback adherence | >=70% achieve resonance frequency breathing | Real-time HRV coherence scores | [7][8] |

## Phase 2: Pivotal Randomized Controlled Trials

### Critical Design Elements [5][11][12]

1. Active comparator arms: compare to standard evidence-based treatment (CBT, exposure therapy), not just waitlist. VR interventions show medium-to-large effects vs inactive controls but no significant difference vs standard approaches [11][5]
2. Adequate sample size: target N = 60 to 80 per arm for adequately powered comparisons [13]
3. Follow-up assessments: include 3 to 6 month follow-up. Current evidence lacks long-term data [5][11]
4. Blinding: use sham biofeedback conditions where possible. Assess blinding integrity [14]
5. Independent assessment: use blinded raters for clinician-administered measures [13]
6. Intention-to-treat analysis: account for dropout in primary analyses

### Tier 1: Anxiety Disorders and PTSD (strongest evidence)

- Primary outcome: PCL-5 (PTSD), LSAS (social anxiety), BAI (panic)
- Clinically meaningful change: PCL-5 >=10 points. BAI >=10 points
- Secondary outcomes: CAPS-5, PHQ-9, GAD-7, Q-LES-Q-SF, SOFAS
- Physiological outcomes: HRV indices (RMSSD, HF power), skin conductance
- Sample size: N = 200 (50 per arm x 4 arms). Power 0.80 to detect medium effect (d = 0.5)
- Duration: 8 to 12 sessions over 6 to 8 weeks
- Follow-up: 1, 3, and 6 months post-treatment

Expected effect sizes (based on meta-analyses):

- VR vs waitlist: g = 0.83 to 1.28 for anxiety disorders [5]
- VR vs active CBT: g = 0.08 (non-significant difference) [15]
- VR-biofeedback: 29.5% reduction in STAI, 70% reduction in MADRS [2]

### Tier 2: Depression

- Primary outcome: BDI-II or MADRS
- Clinically meaningful change: BDI-II >=5 points. MADRS >=50% reduction
- Secondary outcomes: PHQ-9, STAI, WHO-5, functioning
- Physiological outcomes: HRV indices, frontal alpha asymmetry (EEG)
- Sample size: N = 160 (40 per arm x 4 arms)
- Duration: 8 to 12 sessions over 4 to 6 weeks
- Moderator analysis: age, sex (females and older adults show greater improvement)

### Tier 3: ADHD

- Primary outcome: ASEBA Attention-Deficit/Hyperactive Problems scale. Validated for NFB + HRV studies. Large effect sizes (d = 1.17 to 1.21)
- Secondary outcomes: IVA Continuous Performance Test, QEEG parameters
- Physiological outcomes: QEEG z-scores, HRV parameters, breathing rate
- Sample size: N = 120 (adults and children separately)
- Duration: 30 sessions (standard NFB protocol)
- Age stratification: separate analyses for children vs adults

VR-EEG neurofeedback for attention is classified as "probably efficacious" (Level 4/5) per TGECEPI criteria. Highest evidence level achieved for any VR-neurofeedback application. [19]

### Tier 4: Schizophrenia Spectrum Disorders (Auditory Hallucinations)

- Primary outcome: PSYRATS-AH
- Secondary outcomes: PANSS, quality of life, functioning
- Physiological outcomes: EEG (for biofeedback adaptation), HRV
- Sample size: N = 60 (pilot). N = 150 (pivotal)
- Duration: 8 sessions of VR-assisted therapy
- Safety monitoring: anxiety during sessions, dissociation

The Neuro-VR trial (NCT06628323) is investigating VR-assisted therapy augmented with real-time biofeedback for auditory hallucinations. Provides a model for this population. [20]

### Tier 5: Chronic Pain

- Primary outcome: VAS or NRS for pain
- Secondary outcomes: pain catastrophizing, functional disability, quality of life
- Moderators: baseline pain severity (moderate-severe shows larger effects), age (younger shows larger effects)
- Sample size: N = 120
- Comparator: standard care without distraction (larger effects) vs active distraction

VR significantly reduces pain (SMD = -0.65, 95% CI -0.76 to -0.54). Effects similar across acute, chronic, and procedural pain. [21] Effects especially pronounced in moderate-to-severe pain and younger subjects. [21]

### Tier 6: Substance Use Disorders

- Primary outcome: craving measures (VAS), state anxiety. VR shows g = 0.89 for reduced state anxiety in alcohol use disorder
- Secondary outcomes: substance use frequency, relapse rates
- VR intervention type: cue exposure therapy
- Sample size: N = 100
- Duration: 8 to 12 sessions

### Tier 7: Autism Spectrum Disorder

- Primary outcome: social skills measures (SRS-2, SSRS)
- Secondary outcomes: anxiety, quality of life, adaptive functioning
- VR intervention type: social skills training
- Sample size: N = 80
- Duration: 10 to 16 sessions

### Tier 8: Neurocognitive Disorders (Dementia)

- Primary outcome: cognitive measures (MoCA, MMSE)
- Secondary outcomes: emotion, quality of life, functional status
- VR intervention type: cognitive training
- EEG integration: wearable EEG improves MCI/dementia screening accuracy
- Sample size: N = 100

## Outcome Measures by Domain

### Primary Clinical Outcomes

| Population | Primary Measure | Clinically Meaningful Change |
|------------|-----------------|-------------------------------|
| PTSD | PCL-5 | >=10 points |
| Social Anxiety | LSAS | >=10 points |
| Panic/Agoraphobia | PAS, BAI | >=10 points |
| Specific Phobias | BAT | Approach behavior |
| Depression | BDI-II, MADRS, PHQ-9 | BDI-II >=5. MADRS >=50% |
| ADHD | ASEBA, IVA | MCID threshold |
| Schizophrenia/AVH | PSYRATS-AH, PANSS | >=20% reduction |
| Chronic Pain | VAS/NRS | >=30% reduction |
| Substance Use | Craving VAS, state anxiety | Clinically significant reduction |
| ASD | SRS-2, SSRS | Clinically significant improvement |
| Dementia | MoCA, MMSE | >=2 to 3 points |

### Secondary Outcomes (Cross-Cutting)

Symptom measures: PHQ-9, GAD-7, STAI, VAS for stress

Functional outcomes: SOFAS, WHO-DAS 2.0, Q-LES-Q-SF, WHO-5

Process measures: presence (IPQ), cybersickness (SSQ), treatment satisfaction (CSQ-8), therapeutic alliance (WAI)

### Physiological Outcomes (Unique to Multimodal Platform)

| Domain | Measure | Clinical Relevance |
|--------|---------|---------------------|
| HRV | RMSSD, HF power, LF/HF ratio | Autonomic regulation, stress response |
| Cardiac coherence | Coherence score during biofeedback | Biofeedback performance |
| Breathing rate | Breaths per minute | Resonance frequency achievement |
| EEG | Frontal alpha asymmetry | Depression biomarker |
| EEG | Sensorimotor rhythm (SMR) | Attention/ADHD |
| EEG | QEEG z-scores | Normalization toward age norms |
| Skin conductance | SCR, SCL | Arousal, fear response |
| Eye tracking | Fixation patterns, avoidance | Attention bias, engagement |

## FDA Regulatory Pathway

### Software as a Medical Device (SaMD) Classification

VR psychotherapy with biofeedback would likely be classified as Software as a Medical Device (SaMD). [27][28]

### Pathway Options

1. 510(k) Clearance (most common for AI/software devices) [27]
   - Requires demonstration of substantial equivalence to a predicate device
   - Most VR therapy devices have used this pathway
   - Lower evidence threshold than PMA

2. De Novo Classification (for novel low-to-moderate risk devices) [27]
   - Appropriate if no suitable predicate exists
   - Establishes new device classification
   - Requires demonstration of safety and effectiveness

3. Premarket Approval (PMA) (highest-risk devices) [27]
   - Requires "valid scientific evidence" including clinical trials
   - Most rigorous pathway
   - Unlikely to be required for VR psychotherapy

### Current Regulatory Landscape

- FDA has exercised enforcement discretion for lower-risk mental health apps. Allows apps to make medical claims without data if seeking 510(k) approval for psychiatric disorders [29]
- The Digital Health Software Precertification Program (Pre-Cert) was piloted but ended in September 2022 without concrete next steps [29][30]
- 21st Century Cures Act excludes certain low-risk software from medical device definition, including software that "encourages a healthy lifestyle" or "provides limited clinical data support" [31]

### Key Considerations

- If making treatment claims (e.g., "treats anxiety"), FDA oversight is likely required [31]
- If positioned as wellness/stress management without treatment claims, may fall under enforcement discretion [29][31]
- Digital therapeutics (clinically validated, intended to treat a condition) require FDA clearance similar to drugs and devices [31]

Recommendation: pursue De Novo classification if no suitable predicate exists, or 510(k) if a predicate VR therapy device can be identified. Build clinical evidence exceeding FDA minimum requirements to support reimbursement and adoption. FDA clearance alone does not indicate app quality or effectiveness. [29]

## Critical Success Factors

### Addressing Current Evidence Gaps

Over 50% of VR intervention studies have high risk of bias, primarily due to: [5]

- Limited RCTs
- Lack of follow-up analysis
- Absence of active control groups
- Heterogeneity and publication bias

Trials should:

1. Use active comparators (standard CBT/exposure), not just waitlist [11][15]
2. Include 6-month follow-up minimum [5][13]
3. Use blinded independent assessors [13]
4. Report adverse events systematically [22]
5. Use standardized protocols to enable replication [32]

### Unique Value Proposition of Multimodal Approach

Multi-modal biofeedback appears most effective in significantly ameliorating psychiatric symptoms. Targeting more than one physiological modality increases therapeutic efficacy. [33]

The triad of neurofeedback, biofeedback (especially HRV training), and metacognitive strategies produces improvements in most clients regardless of disorder. [18]

Platform competitive advantage:

- Only platform integrating VR + EEG + HRV + multiple psychotherapy modalities
- Real-time adaptive treatment based on physiological state
- Comprehensive data collection for outcomes tracking and reimbursement justification
- Ophthalmologist-designed for visual comfort (addresses major adoption barrier)

### Presence and Cybersickness Management

Higher presence predicts better outcomes: greater reductions in anxiety (beta = -0.24), stress (beta = -0.37), depression (beta = -0.07). [3]

Cybersickness undermines outcomes: inversely correlated with presence (rho = -0.38) and associated with smaller symptom improvements. [3]

Design implications:

- Optimize for presence (immersion, interactivity)
- Minimize cybersickness (stable reference frames, high frame rates, short sessions initially)
- Screen for cybersickness susceptibility
- Use physiological monitoring (EDA + ECG) to predict and prevent cybersickness (R squared = 0.98) [34]

## Phased Development Roadmap

### Phase 1 (Months 1 to 12): Feasibility pilots

Across 3 to 4 populations (anxiety, depression, ADHD, pain):

- N = 20 to 40 per population
- Single-arm or small RCT
- Focus on safety, tolerability, technical feasibility
- Refine protocols based on findings

### Phase 2 (Months 12 to 30): Pivotal RCTs for Tier 1 populations

Anxiety, PTSD, depression:

- N = 150 to 200 per trial
- 4-arm design (full multimodal vs VR-HRV vs VR-only vs active control)
- 6-month follow-up
- FDA De Novo or 510(k) submission

### Phase 3 (Months 30 to 48): Expansion to Tier 2-3 populations

ADHD, schizophrenia, chronic pain, substance use:

- Leverage Phase 2 platform and regulatory clearance
- Pursue additional indications

### Phase 4 (Ongoing): Real-world evidence and post-market surveillance

- Track outcomes in clinical practice
- Support reimbursement negotiations
- Continuous platform improvement based on data

## References

1. Lüddecke R, Felnhofer A. Virtual Reality Biofeedback in Health: A Scoping Review. Applied Psychophysiology and Biofeedback. 2022;47(1):1-15.
2. Cho Y, Kim H, Seong S, et al. Effect of VR-Based Biofeedback for Depressive and Anxiety Symptoms: RCT. Journal of Affective Disorders. 2024;361:392-398.
3. Moon DU, Lütt A, Kim H, et al. Impact of Cybersickness and Presence on Treatment Satisfaction in VR-Based Biofeedback. Journal of Psychiatric Research. 2025;187:53-61.
4. Lin IM, Chen TC, Tsai HY, Fan SY. Four Sessions of Combining Wearable Devices and HRV Biofeedback. Applied Psychophysiology and Biofeedback. 2023;48(1):83-95.
5. Zeka F, Clemmensen L, Valmaggia L, et al. The Effectiveness of Immersive VR-Based Treatment for Mental Disorders. Acta Psychiatrica Scandinavica. 2025;151(3):210-230.
6. Schultz J, Baumeister A, Schmotz S, Moritz S, Jelinek L. Efficacy of Internet-Based Intervention With Self-Applied VR Exposure for Panic Disorder: Study Protocol. Trials. 2023;24(1):521.
7. Ocklenburg S, Peterburs J. Monitoring Brain Activity in VR: EEG and Neuroimaging. Current Topics in Behavioral Neurosciences. 2023;65:47-71.
8. Larsen OFP, Tresselt WG, Lorenz EA, et al. A Method for Synchronized Use of EEG and Eye Tracking in Fully Immersive VR. Frontiers in Human Neuroscience. 2024;18:1347974.
9. Weber D, Hertweck S, Alwanni H, et al. A Structured Approach to Test the Signal Quality of EEG During Use of HMDs for VR Applications. Frontiers in Neuroscience. 2021;15:733673.
10. Lalanza JF, Lorente S, Bullich R, et al. Methods for HRV Biofeedback: A Systematic Review and Guidelines. Applied Psychophysiology and Biofeedback. 2023;48(3):275-297.
11. Dellazizzo L, Potvin S, Luigi M, Dumais A. Evidence on VR-Based Therapies for Psychiatric Disorders: Meta-Review. Journal of Medical Internet Research. 2020;22(8):e20889.
12. Wiebe A, Kannen K, Selaskowski B, et al. VR in the Diagnostic and Therapy for Mental Disorders. Clinical Psychology Review. 2022;98:102213.
13. Montesano A, Medina JC, Paz C, et al. Does VR Increase the Efficacy of Psychotherapy for Young Adults With Mild-to-Moderate Depression? Trials. 2021;22(1):916.
14. van 't Wout-Frank M, Arulpragasam AR, Faucher C, et al. VR and Transcranial Direct Current Stimulation for PTSD: RCT. JAMA Psychiatry. 2024;81(5):437-446.
15. van Loenen I, Scholten W, Muntingh A, Smit J, Batelaan N. The Effectiveness of VR Exposure-Based CBT for Severe Anxiety, OCD, and PTSD. Journal of Medical Internet Research. 2022;24(2):e26736.
16. Melnikov MY. The Current Evidence Levels for Biofeedback and Neurofeedback in Treating Depression. Neural Plasticity. 2021;2021:8878857.
17. Groeneveld KM, Mennenga AM, Heidelberg RC, et al. Z-Score Neurofeedback and HRV Training for Adults and Children With ADHD. Applied Psychophysiology and Biofeedback. 2019;44(4):291-308.
18. Thompson L. Synergy Between Neurofeedback and Biofeedback Enhances Therapeutic Outcomes. Applied Psychophysiology and Biofeedback. 2025;50(2):305-314.
19. Castanho L, Martinho DV, Saial AC, et al. The Efficacy of VR-Based EEG Neurofeedback in Health-Related Symptoms Relief. Applied Psychophysiology and Biofeedback. 2025.
20. Habla AF, Soleim SB, Due AS, et al. Neuro-VR Study Protocol. PLoS One. 2026;21(2):e0333716.
21. Lier EJ, de Vries M, Steggink EM, Ten Broek RPG, van Goor H. Effect Modifiers of VR in Pain Management: Systematic Review and Meta-Regression. Pain. 2023;164(8):1658-1665.
22. Rooney T, Sharpe L, Winiarski N, et al. A Synthesis of Meta-Analyses of Immersive VR Interventions in Pain. Clinical Psychology Review. 2025;117:102566.
23. Emmelkamp PMG, Meyerbröker K. Virtual Reality Therapy in Mental Health. Annual Review of Clinical Psychology. 2021;17:495-519.
24. Lee B, Lee T, Jeon H, et al. Synergy Through Integration of Wearable EEG and VR for MCI and Mild Dementia Screening. IEEE JBHI. 2022;26(7):2909-2919.
25. Blum J, Rockstroh C, Göritz AS. HRV Biofeedback Based on Slow-Paced Breathing With Immersive VR Nature Scenery. Frontiers in Psychology. 2019;10:2172.
26. Kluge MG, Maltby S, Walker N, et al. Development of a Modular Stress Management Platform (Performance Edge VR). PLoS One. 2021;16(2):e0245068.
27. Potnis KC, Ross JS, Aneja S, Gross CP, Richman IB. AI in Breast Cancer Screening: FDA Device Regulation and Future Recommendations. JAMA Internal Medicine. 2022;182(12):1306-1312.
28. Shah S, Thakor P, Shah A, Singh OV. Software as Medical Devices: Requirements and Regulatory Landscape in the US. Expert Review of Medical Devices. 2025.
29. King D, Emerson MR, Chan SR, et al. Resource Document on Digital Mental Health 101. American Psychiatric Association. 2023.
30. Darrow JJ, Avorn J, Kesselheim AS. FDA Regulation and Approval of Medical Devices: 1976-2020. JAMA. 2021;326(5):420-432.
31. Fleming GA, Petrie JR, Bergenstal RM, et al. Diabetes Digital App Technology. Diabetes Care. 2020;43(1):250-260.
32. Kim H, Han EC, Muntz PB, Kemp J. VR in the Treatment of Anxiety-Related Disorders. Current Psychiatry Reports. 2025.
33. Schoenberg PL, David AS. Biofeedback for Psychiatric Disorders: A Systematic Review. Applied Psychophysiology and Biofeedback. 2014;39(2):109-35.
34. Long Y, Wang T, Liu X, Li Y, Tao D. Toward Accurate Cybersickness Prediction in VR. Sensors. 2025;25(18):5828.
