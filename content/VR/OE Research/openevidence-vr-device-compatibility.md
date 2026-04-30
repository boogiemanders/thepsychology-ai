# EEG, Smartwatch, VR Compatibility and User Group Evidence

Source: OpenEvidence research synthesis.

## 1. Device Compatibility with VR

### EEG Devices

Most research-validated for VR integration: Oculus Rift and HTC Vive Pro. High-quality EEG recordings in the clinically relevant range have been demonstrated. [1] Current VR headsets provide a "logical, convenient, and unobtrusive framework for mounting EEG sensors." [2]

| EEG Device | VR Compatibility | Channels | Key Strengths | Key Limitations | Refs |
|------------|------------------|----------|---------------|-----------------|------|
| OpenBCI | Excellent (open-source, tested with multiple HMDs) | 8 to 16 | Raw data access, customizable, affordable ($500-700) | Requires technical expertise to set up | [1][2] |
| Emotiv EPOC/X | Good (most-used consumer EEG in research, 531 studies) | 5 to 14 | Large research base, wireless, dry electrodes | Proprietary data access limitations | [1] |
| PSBD Headband Pro | Good (best consumer-grade match to research-grade systems) | 4 to 8 | Best signal quality among consumer devices. Replicates delta/theta/alpha modulations | Limited research ecosystem | [3][4] |
| Muse S Gen 2 | Limited (widely available but poor signal quality) | 4 to 7 | Affordable (~$300), easy to use | Poorest alignment with research-grade devices. Extremely low correspondence with gold standard | [3][4] |
| Frontal 6-channel wearable (custom) | Purpose-built for VR | 6 | Designed to mount on VR headset. Proven for cognitive screening | Not commercially available | [5] |

### HRV/Smartwatch Devices

For real-time biofeedback during VR therapy, ECG-based chest straps significantly outperform PPG-based wrist devices.

| HRV Device | Measurement Method | HRV Accuracy vs. ECG | Best Use Case | Refs |
|------------|--------------------|-----------------------|--------------|------|
| Polar H10 | ECG (chest strap) | Excellent: r > 0.93 for RR intervals. Can surrogate clinical ECG | Real-time biofeedback during VR sessions | [1][2] |
| Apple Watch Series 9 | PPG (wrist) | Moderate: underestimates HRV by ~8.31 ms (MAPE 28.88%). RHR accurate (MAPE 5.91%) | Between-session monitoring, patient engagement | [3][4] |
| Samsung Galaxy Watch | PPG (wrist) | Acceptable during sleep. High errors during awake/active states | Overnight/baseline HRV tracking only | [5] |
| Apple Watch Series 6 | PPG (wrist) | Near-perfect for R-R intervals and BPM at rest (MAPE 1.15%). Moderate for NN intervals (MAPE 31.31%) | Resting HR monitoring | [2][4] |

### Critical Finding

PPG-based wearables (all smartwatches) capture HR more accurately than HRV. Even slight movement negatively impacts agreement with ECG. [13] Even research-grade PPG devices did not outperform consumer-grade devices in lab conditions. All showed low agreement with ECG in ambulatory conditions. [13]

Polar H10 is the clear choice for real-time VR biofeedback, where accurate beat-to-beat data is essential for therapeutic feedback loops.

### Software Integration Layer

Lab Streaming Layer (LSL) is the most widely used open-source framework for synchronizing multimodal physiological data streams in VR. [4][14]

Experiments in Virtual Environments (EVE) framework provides standardized modules for participant training, questionnaire administration, physiological measurement synchronization, and data storage. [15]

## 2. Most Common Technical Challenges

### Electromagnetic Interference (EMI)

Each VR HMD has its own electromagnetic footprint. Introduces artifacts, particularly at line hum (50/60 Hz) and the HMD refresh rate (typically 90 Hz) and their harmonics. [1]

### Data Synchronization

Synchronizing multiple data streams is a core challenge. Hardware latency analysis reveals an average offset of 36 ms between EEG and eye-tracking data streams with mean jitter of 5.76 ms. [14]

For real-time biofeedback, this latency must be compensated. Lack of standard protocols for data collection and analysis across different setups makes comparability and replicability difficult. [4]

### Movement Artifacts

During active tasks, the proportion of EEG components attributed to brain activity decreases compared to stationary conditions. Neural oscillations in source space remain detectable. [16]

Movement degrades PPG-based HRV accuracy significantly. Conditions involving even slight movement negatively impact agreement between PPG devices and ECG criterion. [13] For VR therapy involving physical movement (e.g., 3MDR walking-based PTSD treatment), this is a major constraint.

### Real-Time Signal Processing

Processing noisy biosignals in real-time while maintaining a responsive VR environment poses technical and UX challenges. Particularly when users must multitask (e.g., breathing regulation during a complex decision task). [17]

Adaptive filtering must remove line noise and HMD refresh artifacts without introducing processing delays. [1]

### Cybersickness Interference

Cybersickness directly undermines therapeutic outcomes. Higher cybersickness is inversely correlated with presence (rho = -0.38, p < 0.05). [18]

Multimodal physiological monitoring (EDA + ECG) can predict cybersickness severity with high accuracy (R squared = 0.98 using ensemble learning). The same sensors used for therapy could serve as cybersickness early-warning systems. [19]

### Practical Usability

Detailed reporting of technical procedures is urgently needed to ensure comparability and replicability across studies. [4] The field lacks consensus and best-practice papers on critical issues such as handling movement artifacts in mobile EEG-VR setups. [4]

For a clinical product, this means significant investment in standardizing setup procedures and training clinicians.

## 3. User Groups That Benefit Most

### Tier 1: Strongest Evidence

- Anxiety disorders (specific phobias, social anxiety, panic disorder): most established VR therapy application. Medium-to-large effect sizes vs inactive controls. Adding HRV biofeedback enhances outcomes. VR-biofeedback reduced anxiety (STAI) by 29.5% from baseline [20][21][22][23]
- PTSD (including treatment-resistant): VR exposure therapy is well-established. 3MDR (VR-EMDR hybrid) shows particular promise for treatment-resistant cases. EEG-augmented VR therapy enables continuous adaptation [20][21][24]
- Depression: VR-biofeedback produced 70% reduction in MADRS, 64.1% reduction in PHQ-9. Comparable to conventional biofeedback with a therapist. Higher VR presence predicted greater symptom reduction (beta = -0.07, p = 0.008 for PHQ-9). Female sex and older age were associated with greater clinical improvement and higher satisfaction [23][18]

### Tier 2: Promising Evidence

- Schizophrenia spectrum disorders (auditory verbal hallucinations): VR avatar therapy with real-time EEG biofeedback is being actively investigated [24]
- Substance use disorders: increasing evidence supports VR cue exposure therapy [25][20]
- Eating disorders: VR cue exposure therapy shows increasing evidence of effectiveness [25]
- Attention deficits (ADHD): VR-based EEG neurofeedback is considered "probably efficacious" per TGECEPI criteria. Highest evidence level achieved for any VR-neurofeedback application [26]

### Tier 3: Emerging Applications

- Chronic pain: VR body scan exercises enable training of body-related attentional skills [27]
- Autism spectrum disorder: social skills training in VR is promising but lacks sufficient evidence for EBP classification [21]
- Neurocognitive disorders (dementia): VR cognitive training shows small effects for cognition and emotion. Wearable EEG integrated with VR improves cognitive impairment screening accuracy [7][21]
- Subclinical/wellness populations: healthy controls showed significant decreases in depression and anxiety measures after VR-biofeedback. Market for stress management and performance optimization [23]

### Key Demographic Insights

Cybersickness is the primary barrier to VR therapy adoption and directly undermines outcomes. [18] Populations at higher cybersickness risk (younger males, those with motion sensitivity) may need shorter sessions and more gradual exposure protocols.

Older adults and women appear to derive greater clinical benefit and satisfaction from VR-biofeedback. [18]

## Strategic Recommendation

For initial product development, anxiety disorders and PTSD represent the strongest evidence base and largest addressable market. [20][21]

Treatment-resistant PTSD is a compelling niche given unmet clinical need and preliminary evidence for multimodal VR approaches. [21][24]

Depression with biofeedback integration offers a strong secondary market given robust effect sizes. [23]

## References

1. Weber D, Hertweck S, Alwanni H, et al. A Structured Approach to Test the Signal Quality of Electroencephalography Measurements During Use of Head-Mounted Displays for Virtual Reality Applications. Frontiers in Neuroscience. 2021;15:733673.
2. Tremmel C, Herff C, Sato T, et al. Estimating Cognitive Workload in an Interactive Virtual Reality Environment Using EEG. Frontiers in Human Neuroscience. 2019;13:401.
3. Sabio J, Williams NS, McArthur GM, Badcock NA. A Scoping Review on the Use of Consumer-Grade EEG Devices for Research. PLoS One. 2024;19(3):e0291186.
4. Ocklenburg S, Peterburs J. Monitoring Brain Activity in VR: EEG and Neuroimaging. Current Topics in Behavioral Neurosciences. 2023;65:47-71.
5. Mikhaylov D, Saeed M, Husain Alhosani M, F Al Wahedi Y. Comparison of EEG Signal Spectral Characteristics Obtained With Consumer- And Research-Grade Devices. Sensors. 2024;24(24):8108.
6. Kleeva D, Ninenko I, Lebedev MA. Resting-State EEG Recorded With Gel-Based vs. Consumer Dry Electrodes. Frontiers in Neuroscience. 2024;18:1326139.
7. Lee B, Lee T, Jeon H, et al. Synergy Through Integration of Wearable EEG and Virtual Reality for MCI and Mild Dementia Screening. IEEE Journal of Biomedical and Health Informatics. 2022;26(7):2909-2919.
8. Schaffarczyk M, Rogers B, Reer R, Gronwald T. Validity of the Polar H10 Sensor for HRV Analysis. Sensors. 2022;22(17):6536.
9. Montalvo S, Martinez A, Arias S, et al. Commercial Smart Watches and Heart Rate Monitors: A Concurrent Validity Analysis. Journal of Strength and Conditioning Research. 2023;37(9):1802-1808.
10. O'Grady B, Lambe R, Baldwin M, Acheson T, Doherty C. The Validity of Apple Watch Series 9 and Ultra 2 for Serial Measurements of HRV and Resting Heart Rate. Sensors. 2024;24(19):6220.
11. Bonneval L, Wing D, Sharp S, et al. Validity of HRV Measured With Apple Watch Series 6 Compared to Laboratory Measures. Sensors. 2025;25(8):2380.
12. Sarhaddi F, Kazemi K, Azimi I, et al. A Comprehensive Accuracy Assessment of Samsung Smartwatch HR and HRV. PLoS One. 2022;17(12):e0268361.
13. Sinichi M, Gevonden MJ, Krabbendam L. Quality in Question: Assessing the Accuracy of Four Heart Rate Wearables and the Implications for Psychophysiological Research. Psychophysiology. 2025;62(2):e70004.
14. Larsen OFP, Tresselt WG, Lorenz EA, et al. A Method for Synchronized Use of EEG and Eye Tracking in Fully Immersive VR. Frontiers in Human Neuroscience. 2024;18:1347974.
15. Weibel RP, Grübel J, Zhao H, et al. Virtual Reality Experiments With Physiological Measures. JoVE. 2018;(138).
16. Wang WE, Ho RLM, Gatto B, et al. A Novel Method to Understand Neural Oscillations During Full-Body Reaching. IEEE TNSRE. 2020;28(12):3074-3082.
17. Brammer JC, van Peer JM, Michela A, et al. Breathing Biofeedback for Police Officers in a Stressful Virtual Environment. Frontiers in Psychology. 2021;12:586553.
18. Moon DU, Lütt A, Kim H, et al. Impact of Cybersickness and Presence on Treatment Satisfaction and Clinical Outcomes in VR-Based Biofeedback. Journal of Psychiatric Research. 2025;187:53-61.
19. Long Y, Wang T, Liu X, Li Y, Tao D. Toward Accurate Cybersickness Prediction in VR. Sensors. 2025;25(18):5828.
20. Wiebe A, Kannen K, Selaskowski B, et al. Virtual Reality in the Diagnostic and Therapy for Mental Disorders. Clinical Psychology Review. 2022;98:102213.
21. Dellazizzo L, Potvin S, Luigi M, Dumais A. Evidence on Virtual Reality-Based Therapies for Psychiatric Disorders. Journal of Medical Internet Research. 2020;22(8):e20889.
22. Blum J, Rockstroh C, Göritz AS. HRV Biofeedback Based on Slow-Paced Breathing With Immersive VR Nature Scenery. Frontiers in Psychology. 2019;10:2172.
23. Cho Y, Kim H, Seong S, et al. Effect of VR-Based Biofeedback for Depressive and Anxiety Symptoms: Randomized Controlled Study. Journal of Affective Disorders. 2024;361:392-398.
24. Habla AF, Soleim SB, Due AS, et al. Neuro-VR Study Protocol. PLoS One. 2026;21(2):e0333716.
25. Emmelkamp PMG, Meyerbröker K. Virtual Reality Therapy in Mental Health. Annual Review of Clinical Psychology. 2021;17:495-519.
26. Castanho L, Martinho DV, Saial AC, et al. The Efficacy of VR-Based EEG Neurofeedback in Health-Related Symptoms Relief. Applied Psychophysiology and Biofeedback. 2025.
27. Seinfeld S, Montesano A. Virtual Reality in Psychotherapy: A Commentary on Strategies, Interventions, and Perspectives. Journal of Clinical Psychology. 2025.
