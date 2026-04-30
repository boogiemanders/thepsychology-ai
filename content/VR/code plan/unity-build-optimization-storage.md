# Unity Build Optimization and Storage Requirements

Source: OpenEvidence synthesis of VR therapy hardware/software specs.

## Unity Build Optimization Techniques

### Asset Compression Strategies

| Technique | Impact | Implementation |
|-----------|--------|----------------|
| Texture compression | 50-80% size reduction | Use ASTC (Android/Quest) or BC7 (PC). Reduce to 1024x1024 for non-critical textures |
| Audio compression | 70-90% reduction | Vorbis/MP3 at 128kbps for ambient. 96kbps for voice. Mono where possible |
| Mesh optimization | 20-40% reduction | LOD systems. Reduce polygon counts for distant objects |
| Shader variants | 10-30% reduction | Strip unused shader variants. Use shader stripping in build settings |
| Asset bundles | Modular loading | Load environments on-demand rather than bundling all content |

### Unity Build Settings for Quest

```
ProjectSettings optimization checklist
- Texture Compression: ASTC 6x6 (balanced quality/size)
- Audio: Vorbis, Quality 70%
- Strip Engine Code: Enabled
- Managed Stripping Level: High
- IL2CPP Code Generation: Faster (smaller) builds
- Compress Meshes: Enabled
- Vertex Compression: Everything except Position
```

### Addressables System (Recommended for Therapy Apps)

- Load therapy environments as separate addressable groups
- Download additional content post-install
- Reduces initial install size by 40-60%

## Estimated File Sizes for VR Therapy Applications

| Component | Estimated Size | Notes |
|-----------|----------------|-------|
| Basic therapy environment (single scene) | 200-500 MB | Nature scene, simple interactions |
| Full VRET application (multiple environments) | 500 MB - 2 GB | Multiple phobia scenarios, gamification |
| Biofeedback integration layer | 10-30 MB | Scripts, UI, data handling |
| Audio assets (guided meditation, instructions) | 50-150 MB | Compressed voice, ambient sounds |
| Optimized prototype (YC demo) | 300-600 MB | Single environment + biofeedback |

### Reference Points from Published VR Therapy Systems

- ZeroPhobia (smartphone acrophobia): designed for cardboard VR + smartphone. Highly optimized, under 500 MB [2]
- gameChange (psychosis/agoraphobia): HTC Vive Pro with Dell laptop. Six 30-minute sessions with multiple scenarios [4]
- Bravemind (PTSD): full Iraq/Afghanistan environments with visual, auditory, haptic, olfactory immersion. Larger builds (~2-4 GB estimated) [5]

## Sensor Data Storage Per Session

| Data Type | Sample Rate | Raw Size/Hour | Compressed |
|-----------|-------------|---------------|-------------|
| EEG (4-channel Muse) | 256 Hz | ~15 MB | ~3-5 MB |
| EEG (14-channel Emotiv) | 128-256 Hz | ~50 MB | ~10-15 MB |
| ECG/HRV | 250-500 Hz | ~7 MB | ~1-2 MB |
| PPG (smartwatch) | 25-100 Hz | ~3 MB | ~0.5-1 MB |
| Session metadata | Event-based | ~0.5 MB | ~0.1 MB |
| VR interaction logs | Event-based | ~2 MB | ~0.5 MB |
| Combined per 45-min session | | ~25-75 MB | ~5-20 MB |

EVE (Experiments in Virtual Environments) framework provides standardized modules for synchronization of physiological measurements and data storage. [10]

## Multi-User, Multi-Session Clinical Deployment Storage

### Per-Patient Storage Model

```
Per patient (8-12 session treatment course):
- Session recordings (12 × 15 MB avg) = 180 MB
- Processed metrics/summaries = 10 MB
- Session notes/annotations = 5 MB
- Baseline calibration data = 5 MB
Total per patient: ~200 MB
```

### Clinical Deployment Scenarios

| Scenario | Patients | Sessions/Patient | Data Retention | Storage Needed |
|----------|----------|-------------------|-----------------|-----------------|
| Solo practitioner | 50/year | 8 | 7 years (HIPAA) | ~70 GB |
| Small clinic (3 therapists) | 150/year | 10 | 7 years | ~210 GB |
| Research deployment | 100 participants | 12 | Indefinite | ~240 GB + backups |
| Multi-site trial | 500 participants | 8 | 10+ years | ~800 GB |

### Recommended Infrastructure

| Component | Minimum | Recommended | Notes |
|-----------|---------|--------------|-------|
| On-device (Quest 3) | 128 GB | 128 GB | App + 10-20 cached sessions |
| Local clinic server | 500 GB SSD | 2 TB SSD | HIPAA-compliant, encrypted |
| Cloud backup | AWS S3/Azure | AWS S3/Azure | HIPAA BAA required (~$0.023/GB/month) |
| Database | PostgreSQL | TimescaleDB | Optimized for time-series physiological data |

## Architecture for Prototype

Simplified YC demo architecture:

```
Quest 3 ──WiFi──> Mac Mini/MacBook
                  │
                  ├─ Muse S via LSL
                  ├─ Apple Watch
                  └─ Local SQLite
                  │
                  Cloud Sync (post-session)
```

### Immediate Storage Needs (Development)

- Quest 3: 128 GB sufficient (app ~500 MB + test sessions)
- Development Mac: 50-100 GB allocated for builds, test data
- Cloud: Firebase free tier (1 GB) adequate for prototype

### Data Format Recommendations

- Raw physiological: HDF5 or Parquet (efficient for time-series)
- Session summaries: JSON
- Long-term storage: compressed archives (.tar.gz) with encryption

## Key Optimization for Demo

For the YC video demo, prioritize:

1. Single polished environment (nature scene, ~300 MB)
2. Real-time biofeedback visualization (most impressive)
3. Session summary dashboard (shows clinical utility)
4. Store only processed metrics during demo (reduces complexity)

128 GB Quest 3 provides ample headroom. Clinical VR therapy apps are substantially smaller than consumer games. Physiological data is highly compressible.

## References

1. Lindner P, et al. Creating State of the Art VR Exposure Therapies for Anxiety Using Consumer Hardware. Cognitive Behaviour Therapy. 2017;46(5):404-420.
2. Donker T, et al. Self-guided App-Based VR CBT for Acrophobia: RCT. JAMA Psychiatry. 2019;76(7):682-690.
3. Kothgassner OD, Reichmann A, Bock MM. VR Interventions for Mental Health. Current Topics in Behavioral Neurosciences. 2023;65:371-387.
4. Freeman D, et al. Automated VR Therapy for Agoraphobic Avoidance in Psychosis (gameChange). Lancet Psychiatry. 2022;9(5):375-388.
5. van 't Wout-Frank M, et al. VR and tDCS for PTSD: RCT. JAMA Psychiatry. 2024;81(5):437-446.
6. Robbemond LM, et al. Physiological Responses to VR Stress Regulation. Stress and Health. 2026;42(2):e70164.
7. Ocklenburg S, Peterburs J. Monitoring Brain Activity in VR. Current Topics in Behavioral Neurosciences. 2023;65:47-71.
8. Aspiotis V, et al. Assessing EEG as Stress Indicator: VR High-Altitude. Sensors. 2022;22(15):5792.
9. Fourcade A, et al. Linking Brain-Heart Interactions to Emotional Arousal in VR. Psychophysiology. 2024;61(12):e14696.
10. Weibel RP, et al. VR Experiments With Physiological Measures. JoVE. 2018;(138).
