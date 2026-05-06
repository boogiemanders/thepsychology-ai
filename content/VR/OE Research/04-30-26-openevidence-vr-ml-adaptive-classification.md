# ML Architectures for EEG Pain Classification + Adaptive VR

Source: OpenEvidence research synthesis.

## Bottom Line

- ML can predict pain intensity from EEG at 62-100% accuracy in lab. Drops to 60-68% on novel subjects with new paradigms (the only externally validated benchmark).
- Inter-subject variability is the single biggest barrier to real-world VR-EEG deployment.
- Transfer learning frameworks (especially resting-state pain phenotyping) can bridge this gap.
- Adaptive VR using physiology to keep patients in a therapeutic window doubles time-on-target vs static VR.
- Progressive thresholding and reinforcement-learning-based adaptive algorithms can replace the trained clinician for home use.
- Practical pipeline: ~90ms total latency, well within validated VR-EEG sync windows.

---

## Part 1: The ML Landscape

Systematic review of 44 studies: ML predicts pain intensity with 62-100% accuracy, pain phenotypes with 57-99% accuracy, treatment response with 65-95% accuracy. Wide ranges reflect heterogeneity in methods, populations, validation [1].

Critical for VR: real-time (ms-to-s latency) vs offline.

### Classical ML (Fastest, Most Validated)

**Support Vector Machines (SVM)**

Most common in EEG pain research. For chronic neuropathic pain severity: SVM with polynomial kernel using only **two frontal channels (Fp1, Fp2)** achieved R² of 0.655 for continuous pain intensity regression. Most discriminative features: gamma power asymmetry and phase-amplitude coupling (theta-to-low-gamma, low-beta-to-gamma) [2].

Significance for VR: minimal electrode montage (2 frontal channels) easily embeddable in headset.

**Random Forest (RF)**

Best performance in the **only externally validated** EEG pain study:

- 73.2% cross-validation accuracy
- 68.3% on novel subjects with identical paradigm
- 60.4% on novel subjects with new paradigm [3]

External validation matters. Most reported 80-100% accuracies come from within-subject CV, which dramatically overestimates real-world performance. RF's 60-68% on truly novel data is the most honest estimate for a deployed VR system using classical ML.

**Dynamic Ensemble Selection**

85.6% accuracy across 5 pain levels using inter-channel synchronization features from 34 channels. Most discriminative features: electrodes over cortical ridge (somatosensory). Prolonged pain engaged prefrontal regions. VR systems should monitor both sensorimotor and frontal areas [4].

### Deep Learning (Higher Accuracy, More Complex)

**CNN**

For pain detection in chronic back pain: AUC 0.83 ± 0.09 for movement-induced pain, 0.81 ± 0.15 for video-induced pain. Operates on raw EEG without hand-crafted features. Movement-induced pain activates generalized brain areas; psychologically-induced pain activates more focal regions [5].

**Attentive-Recurrent-Convolutional (ARCNN)**

Most sophisticated pain-specific architecture. Converts raw multi-channel EEG into multi-spectral topography maps (preserving spatial electrode layout as 2D images). Attention → recurrence → convolution captures spatial-spectral-temporal representations. Outperformed all baselines on cross-subject 4-level pain classification [6].

Key innovation: converting EEG into image sequences captures spatial patterns (which regions co-activate) that 1D time-series models miss.

**Transformer (STPA-Net)**

Newest, most promising for pediatric/nonverbal pain. 87.83% subject-independent accuracy for pain recognition in children using scalp EEG during arterial puncture. Combines 3D hand-crafted features with raw signals through transformer attention. Reduced electrode configurations (8-16 channels) maintained competitive performance [7].

### The Cross-Subject Problem

The biggest barrier to real-world VR-EEG deployment. EEG patterns differ dramatically between people. Lab accuracies of 85-100% collapse to 60-70% in deployment [3].

Transfer learning solutions:

**Domain Adversarial Neural Networks (DANN)**

Feature extractor learns domain-invariant representations by training against a domain discriminator. Forces network to extract pain features consistent across subjects, discard subject-specific noise. Multi-source DANN draws from multiple source subjects, improves cross-subject performance [8].

**Global Adaptive Transformer (GAT)**

Attention-based adaptors transfer source features to target domain while emphasizing global EEG correlations. Adaptive center loss aligns conditional distributions. Outperformed prior domain adaptation methods on standard BCI benchmarks [9].

**Resting-EEG Pain Sensitivity Matching (RE-HPBS-IPIC)**

Most pain-specific transfer learning framework. Quantifies each person's pain sensitivity from resting-state EEG. Identifies source subjects with comparable neural pain signatures. Localizes high-activation pain brain sources. Applies balanced distribution adaptation. Significantly outperformed three existing approaches for inter-subject pain intensity classification [10].

For a VR system: brief resting-state EEG calibration (2-5 min before first session) identifies the patient's neural pain phenotype, selects the optimal pre-trained model.

**Privacy-Preserving Transfer (PDCC)**

Constructs proxy domain from source model predictions instead of raw source data. Knowledge transfer without sharing patient EEG. Critical for HIPAA-compliant deployment. Outperformed 11 existing methods across 4 EEG datasets [11].

---

## Part 2: Closed-Loop Adaptive VR

Physiology-driven adaptive VR: detect user states (pain, anxiety, fatigue, engagement), modify content to keep patient in therapeutic window. Not too little (ineffective), not too much (overwhelming).

### Biocybernetic Adaptation Framework

Most mature framework. In arachnophobia: adaptive VR using EDA kept patients in desired therapeutic anxiety state for **about twice as long** as static pre-recorded VR [12].

Same principle for pain: VR adapts to keep patient in optimal pain processing zone. Enough engagement with pain content to drive neuroplastic change (VRNT-style), not so much that it triggers catastrophizing or avoidance.

### Adaptive Neurofeedback in VR

2025 study testing adaptive vs fixed-protocol training. Adaptive system used online recognition duration: when patient succeeded, task progressed; when they struggled, it eased.

- Adaptive VR group: 81.85% classification accuracy (+10.14% from baseline)
- Traditional Graz-based training: only +6.43% improvement
- Adaptive reduced mean task duration by **>30%** vs fixed-time protocols

Patients learned faster with less fatigue [13].

### Progressive Thresholding (Automated Shaping)

Algorithm simulating the shaping a clinician would do when manually adjusting reward thresholds. Dynamic difficulty tuning, individual-specific progress models. In double-blind comparison: significantly better learning vs standard automatic thresholding [14].

Essential for home-based VR with no clinician present.

### Optimal Difficulty for Learning

Two studies established: **specificity matters more than sensitivity** for neurofeedback RL. Optimal difficulty threshold is higher than the threshold that maximizes classification accuracy. System should challenge patient slightly beyond current ability rather than make success easy. Self-rated mental effort correlates with difficulty threshold. Adaptive threshold-setting based on effort ratings reduced mental effort while increasing classification accuracy and PPV [15][16].

### Reinforcement Learning Framework

Trends in Neurosciences framework reconceptualizes neurofeedback as RL: patient's internal states, actions (mental strategies), rewards (feedback signals) formally modeled. Key RL concepts (prediction errors, credit assignment, exploration-exploitation) rarely applied to NFB but could dramatically improve adaptive algorithms.

Example: detect when patient is "exploiting" a suboptimal strategy (some reward, not maximizing learning). Introduce perturbations to encourage exploration of more effective strategies [17].

---

## Part 3: Architecture for an Adaptive VR-EEG Pain Platform

### System Components

| Component | Implementation | Evidence Base |
|-----------|----------------|---------------|
| EEG hardware | 2-8 frontal + central dry electrodes embedded in headset | 2-channel frontal: R² = 0.655; 8-channel maintains competitive accuracy [1][2] |
| Calibration | 2-5 min resting-state EEG → pain phenotyping → model selection | RE-HPBS-IPIC matches by resting-state pain signatures [3] |
| Real-time pain classifier | Transformer-CNN hybrid (STPA-Net or CTNet) | 87.83% subject-independent; spatial-spectral-temporal dynamics [2][4] |
| Cross-subject adaptation | Domain adversarial training + privacy-preserving proxy domains | PDCC outperforms 11 methods, no raw data sharing [5][6] |
| Feature pipeline | Theta-gamma PAC + gamma asymmetry + beta power + inter-channel synchronization | Mega-analysis (n=614): theta-limbic connectivity most robust biomarker [1][7][8] |
| Adaptive content engine | Progressive thresholding + RL-based exploration-exploitation | Adaptive NFT: -30% training time, +10.14% accuracy vs fixed [9][10][11] |
| Therapeutic VR content | Condition-specific: ISF-NF for CLBP, motor imagery for PLP, pain reprocessing for central sensitization | Protocol-by-condition mapping [12][13][14][15] |
| Biocybernetic control loop | Dual-loop: EEG (cortical) + optical HR (autonomic). EDA optional | Adaptive VR doubles time in therapeutic window vs static [16][17] |
| Session-to-session learning | Transfer learning updates model each session; progressive difficulty | GAT and multi-source DANN improve with accumulated data [5][18] |

### Real-Time Processing Pipeline

Per VR frame (~11ms at 90Hz refresh):

1. **EEG acquisition** (256-512 Hz sampling) → artifact rejection (automated ICA or wavelet denoising) → ~50ms latency
2. **Feature extraction** (1-2 sec sliding window): band powers (theta, alpha, SMR, beta, gamma), PAC (theta-gamma, beta-gamma), inter-channel coherence, asymmetry indices → ~20ms
3. **Pain state classification** (transformer-CNN inference): continuous pain intensity + categorical pain state (low/moderate/high) + confidence score → ~15ms
4. **Adaptive engine decision** (every 5-10 sec): compares current pain state to therapeutic target, adjusts VR scene parameters (environment complexity, exposure intensity, NFB difficulty threshold, breathing pacer rate) → ~5ms
5. **VR rendering update**: smooth interpolation of changes to avoid jarring transitions

Total ~90ms. Well within validated synchronization (36ms ± 5.76ms jitter for VR-EEG systems). Adaptive decisions operate on 5-10 sec timescale, not frame-by-frame [24].

### Key Unsolved Problem: External Validation Gap

Only externally validated EEG pain classifier achieved just 60-68% on novel subjects/paradigms [3]. Mega-analysis of 614 chronic pain patients found limited replicability of pain-EEG associations across datasets. Robust findings only emerged when all data combined [19].

A deployed VR system would need substantial within-patient data over multiple sessions before adaptive algorithms become truly personalized. First few sessions rely on population-level models with modest accuracy. Improves progressively as system learns each patient's neural pain signature.

---

## References

1. Mari T, et al. J Pain. 2022;23(3):349-369. doi:10.1016/j.jpain.2021.07.011.
2. Ryu S, et al. Sci Rep. 2024;14(1):20188. doi:10.1038/s41598-024-71219-3.
3. Mari T, et al. Sci Rep. 2023;13(1):242. doi:10.1038/s41598-022-27298-1.
4. Afrasiabi S, Boostani R, Masnadi-Shirazi MA. Physiol Meas. 2020;41(11). doi:10.1088/1361-6579/abc4f4.
5. Chen D, et al. IEEE Trans Neural Syst Rehabil Eng. 2022;30:274-285. doi:10.1109/TNSRE.2022.3147673.
6. Wu F, et al. Neuroscience. 2022;481:144-155. doi:10.1016/j.neuroscience.2021.11.034.
7. Fu Z, et al. IEEE Trans Biomed Eng. 2024;71(6):1889-1900. doi:10.1109/TBME.2024.3355215.
8. Liu D, et al. IEEE Trans Neural Syst Rehabil Eng. 2023;31:218-228. doi:10.1109/TNSRE.2022.3219418.
9. Song Y, et al. IEEE Trans Neural Syst Rehabil Eng. 2023;31:2767-2777. doi:10.1109/TNSRE.2023.3285309.
10. Gao W, et al. IEEE J Biomed Health Inform. 2026;PP. doi:10.1109/JBHI.2026.3650972.
11. Peng Y, et al. IEEE J Biomed Health Inform. 2025;PP. doi:10.1109/JBHI.2025.3595826.
12. Kritikos I, et al. Front Hum Neurosci. 2021;15:596980. doi:10.3389/fnhum.2021.596980.
13. Wang K, et al. IEEE Trans Neural Syst Rehabil Eng. 2025;PP. doi:10.1109/TNSRE.2025.3592988.
14. Dhindsa K, et al. IEEE Trans Neural Syst Rehabil Eng. 2018;26(12):2297-2305. doi:10.1109/TNSRE.2018.2878328.
15. Bauer R, et al. Clin Neurophysiol. 2016;127(9):3156-3164. doi:10.1016/j.clinph.2016.06.020.
16. Bauer R, Vukelić M, Gharabaghi A. Clin Neurophysiol. 2016;127(9):3033-3041. doi:10.1016/j.clinph.2016.06.016.
17. Lubianiker N, et al. Trends Neurosci. 2022;45(8):579-593. doi:10.1016/j.tins.2022.03.008.
18. Zhao W, et al. Sci Rep. 2024;14(1):20237. doi:10.1038/s41598-024-71118-7.
19. Bott FS, et al. EBioMedicine. 2025;120:105955. doi:10.1016/j.ebiom.2025.105955.
20. Adhia DB, et al. Sci Rep. 2023;13(1):1177. doi:10.1038/s41598-023-28344-2.
21. Terrasa JL, et al. Front Neurosci. 2020;14:236. doi:10.3389/fnins.2020.00236.
22. Mussigmann T, et al. Eur J Neurol. 2025;32(9):e70363. doi:10.1111/ene.70363.
23. Roualdes V, et al. Front Hum Neurosci. 2026;20:1697837. doi:10.3389/fnhum.2026.1697837.
24. Larsen OFP, et al. Front Hum Neurosci. 2024;18:1347974. doi:10.3389/fnhum.2024.1347974.
