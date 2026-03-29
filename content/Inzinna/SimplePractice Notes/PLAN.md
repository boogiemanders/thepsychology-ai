# SimplePractice Notes — HIPAA Clinical Notes System

## Vision
A HIPAA-compliant tool for Inzinna's clinical workflow that extracts SimplePractice intake data, generates DSM-5 diagnostic impressions, records session audio, and provides a clinician-facing chat for diagnostic exploration.

---

## Decisions

- **Standalone extension** — separate from the ZocDoc-to-SimplePractice extension
- **Fully local processing** — Whisper local for transcription, local LLM for criteria matching. No PHI leaves the device.
- **Speaker diarization required** — must distinguish clinician vs patient voice. Only patient statements trigger criteria auto-checks.
- **Consent:** One-time per patient. Patient signs a consent form in SimplePractice. Recording does not start until consent is confirmed — the extension checks for a completed SP consent form before enabling audio features. No recording is used to capture consent itself.
- **Data transfer method:** DOM-based (reads from and writes to SimplePractice page structure directly, same approach as ZocDoc extension). No SP API needed for MVP — avoids developer partner approval and BAA negotiation overhead.
- **Auto-fill targets:** Start with intake forms. Expand to progress notes, treatment plans, and diagnosis codes in later phases.
- **Report review:** Clinician reviews the full report in the side panel before submitting anything back to SimplePractice.
- **SP intake URL pattern:** Per-patient URL, but consistent page structure — will be confirmed via Chrome DevTools inspection.

---

## Module 1: Intake Form Extraction

**What:** Extract completed patient intake forms from SimplePractice using the same Chrome extension architecture as the ZocDoc-to-SimplePractice tool.

**Data to capture:**
- Demographics (name, DOB, sex, contact, address)
- Presenting concerns / reason for visit
- Current medications
- Prior treatment history
- Medical history
- Family psychiatric history
- Insurance info (already captured by existing extension)

**Approach:**
- New standalone Chrome extension (Manifest V3)
- Content script targeting SimplePractice's client profile / intake pages
- Mirror the `CapturedClient` type pattern from `zocdoc-to-simplepractice/src/lib/types.ts`, extend with clinical fields
- Store in session storage with same TTL/auto-cleanup pattern (PHI never persists to disk)
- Specific intake template fields to be confirmed via Chrome DevTools inspection of SP

---

## Module 2: DSM-5 Diagnostic Impressions

**What:** Run extracted intake data through DSM-5 criteria to surface possible diagnostic impressions for the clinician to review.

**Data sources:**
- Existing DSM-5 assessment content in `staging/review/psychprep/5 Assessment/`
- Diagnostic exam question banks in `diagnosticGPT/`

**Approach:**
- Local LLM (e.g., Llama 3, Mistral, or Phi-3 via Ollama) maps presenting concerns to DSM-5 categories
- System suggests ranked list of possible diagnoses; clinician confirms or edits — AI suggests, clinician decides
- Flag rule-outs and differential diagnoses
- **Multi-diagnosis support:**
  - No hard cap on number of open diagnoses
  - UI shows up to 3 side-by-side panels; any beyond 3 collapse into tabs
  - Clinician can add diagnoses mid-session if something unexpected surfaces
  - Patient statements auto-populate evidence under **all** matching diagnoses simultaneously (not just the active one)

**Output:** Structured diagnostic impression draft per diagnosis:
```
Primary: [Diagnosis] — [DSM-5 code]
  Criteria met: [list]
  Criteria not met / unclear: [list]
Rule-outs: [list]
Differential: [list]
```

---

## Module 3: Session Audio Recording

**What:** Record session audio locally (HIPAA-safe, no cloud streaming) as an alternative to SimplePractice's built-in note-taker.

**Approach:**
- Browser-based audio recording using Web Audio API / MediaRecorder
- Audio stays 100% local — encrypted at rest, auto-deleted after processing
- **Whisper (local)** for transcription — runs via local server (whisper.cpp or faster-whisper)
- **Speaker diarization** via pyannote-audio or whisperX to separate clinician vs patient voice
- Generate session notes from transcript (SOAP format, progress notes, treatment plan updates)

**HIPAA considerations:**
- Audio NEVER leaves the device — fully local pipeline
- Auto-delete raw audio after transcription
- Transcripts stored in session storage with TTL (same pattern as client data)
- Patient consent confirmed via SP consent form before any recording begins

**Local stack:**
- `faster-whisper` or `whisper.cpp` — local transcription server
- `whisperX` or `pyannote-audio` — speaker diarization
- Runs as a lightweight local service the extension calls via `localhost`
- **Cost: $0** — all tools are free and open source. pyannote models require accepting a HuggingFace user agreement (no cost).

---

## Module 4: Live Diagnostic Interview Interface

**What:** An interactive diagnostic workspace where:
- Clinician scrolls through DSM-5 criteria for a suspected diagnosis
- The system listens to the live session audio and analyzes patient responses in real-time
- The clinician can ask targeted questions to assess specific criteria
- The interface auto-checks YES / NO / UNCLEAR for each criterion based on what the patient says
- Clinician can override any auto-checked item

**UI Concept:**
```
┌──────────────────────────────────────────┐
│  Diagnosis: Major Depressive Disorder     │
│  DSM-5 Code: 296.2x (F32.x)             │
├──────────────────────────────────────────┤
│  Criterion A: ≥5 of the following,       │
│  during same 2-week period               │
│                                          │
│  [✅] 1. Depressed mood most of the day  │
│       "I've been feeling really down      │
│        every day for the past month"      │
│                                          │
│  [✅] 2. Diminished interest/pleasure    │
│       "Nothing feels fun anymore"         │
│                                          │
│  [❓] 3. Weight/appetite change           │
│       (not yet discussed)                 │
│                                          │
│  [❌] 4. Insomnia or hypersomnia         │
│       "I actually sleep fine"             │
│                                          │
│  ... (scrollable list)                   │
├──────────────────────────────────────────┤
│  Suggested question:                      │
│  "Have you noticed changes in your        │
│   appetite or weight recently?"           │
├──────────────────────────────────────────┤
│  [Chat input: ask about other diagnoses] │
│  [Switch diagnosis ▼]                    │
└──────────────────────────────────────────┘
```

**How it works:**
1. System suggests diagnoses based on intake data; clinician confirms
2. DSM-5 criteria load as a scrollable checklist (up to 3 side-by-side; extras in tabs)
3. As the session audio is transcribed in real-time, NLP analyzes patient statements against each criterion
4. Criteria auto-check ✅ (met), ❌ (not met), or ❓ (unclear/not discussed) across all open diagnoses simultaneously
5. Supporting quotes from the patient are displayed under each criterion
6. System suggests follow-up questions for ❓ criteria
7. Clinician can add a new diagnosis mid-session, explore differentials, or ask the chat for guidance
8. At end of session: generates a diagnostic summary with evidence for each criterion

**Approach:**
- Chrome extension side panel (persistent during session)
- Real-time transcription feeds into criteria-matching engine
- Local LLM analyzes patient statements against criteria
- DSM-5 criteria bank bundled from existing `staging/review/psychprep/5 Assessment/` content
- Clinician chat for freeform diagnostic questions
- All processing fully local — no PHI leaves the device

---

## Module 5: Post-Session Report & Auto-Fill

**What:** After the session ends, the system compiles all captured data (intake, transcript, diagnostic impressions, criteria checklist) into a structured clinical note that the clinician reviews, edits, and submits back into SimplePractice.

**Report structure:**
```
┌──────────────────────────────────────┐
│  SESSION NOTE — [Patient] [Date]     │
├──────────────────────────────────────┤
│  DEMOGRAPHICS                        │
│  Name, DOB, Sex, Insurance           │
├──────────────────────────────────────┤
│  CHIEF COMPLAINT                     │
│  Patient's stated reason for visit   │
│  (from intake + session transcript)  │
├──────────────────────────────────────┤
│  PRESENTING COMPLAINT                │
│  Detailed clinical presentation      │
│  synthesized from session            │
├──────────────────────────────────────┤
│  DIAGNOSTIC IMPRESSIONS              │
│  Primary: [Dx] — [DSM-5 code]       │
│    Criteria met: [list w/ evidence]  │
│  Differential: [list]                │
│  Rule-outs: [list]                   │
├──────────────────────────────────────┤
│  CLINICAL FORMULATION                │
│  Predisposing, precipitating,        │
│  perpetuating, protective factors    │
├──────────────────────────────────────┤
│  TREATMENT PLAN                      │
│  - Goals                             │
│  - Interventions                     │
│  - Frequency                         │
│  - Referrals if needed               │
├──────────────────────────────────────┤
│  [Edit any section ✏️]               │
│  [Submit to SimplePractice →]        │
└──────────────────────────────────────┘
```

**Workflow:**
1. Session ends → clinician clicks "Generate Note"
2. Local LLM synthesizes all data into the structured report
3. Clinician reviews and edits any section inline in the side panel
4. Clinician clicks "Submit to SimplePractice"
5. Content script auto-fills SimplePractice's intake form fields (DOM-based, same pattern as ZocDoc extension)

**Auto-fill targets (phased):**
- **Phase MVP:** Intake forms
- **Phase 2:** Progress notes, treatment plans, diagnosis codes (ICD-10/DSM-5)

---

## HIPAA Compliance Checklist

This checklist must be fully cleared before using the extension with real patients.

### Device & OS
- [ ] Mac has FileVault (full-disk encryption) enabled
- [ ] Mac requires password/Touch ID on wake and screen lock
- [ ] Auto-lock set to 5 minutes or less
- [ ] Mac OS is up to date (security patches current)
- [ ] No other users have accounts on the machine that could access files

### Chrome & Browser
- [ ] Chrome profile used for clinical work does NOT have Chrome Sync enabled (or is on a HIPAA-covered Google Workspace account with a signed BAA)
- [ ] Chrome crash reports / usage statistics reporting is disabled
- [ ] No third-party extensions in the same Chrome profile that could intercept page data
- [ ] DevTools is never left open during a clinical session (logs can capture PHI)
- [ ] Extension is installed in developer mode only on Inzinna's machine — not published to Chrome Web Store (which would involve Google review)

### Extension: Data Handling
- [ ] All PHI stored in `sessionStorage` only — never `localStorage`, IndexedDB, or cookies
- [ ] Auto-delete TTL confirmed working (default: 1 hour; clears on browser close)
- [ ] No PHI written to `console.log` statements in production build
- [ ] Extension background service worker does not persist PHI across sessions
- [ ] Confirm Chrome does not back up `sessionStorage` to iCloud or Google account

### Audio & Transcription (Bonus phases only)
- [ ] Audio recording confirmed to stay on-device (MediaRecorder writes to memory, not disk)
- [ ] Raw audio auto-deleted immediately after transcription completes
- [ ] Whisper / faster-whisper server only accessible on `localhost` — not exposed on local network
- [ ] Transcripts stored in `sessionStorage` with same TTL as other PHI
- [ ] Patient consent form confirmed complete in SP before recording is enabled — extension checks this programmatically

### Local LLM (Bonus phases only)
- [ ] Ollama server only accessible on `localhost` — firewall blocks external access
- [ ] Confirm Ollama does not log prompts/responses to disk by default (check Ollama settings)
- [ ] No patient data sent to any remote LLM API (OpenAI, Anthropic, etc.)

### Consent & Documentation
- [ ] Patient consent form in SP covers AI-assisted note generation and local audio processing
- [ ] Consent language reviewed by a healthcare attorney familiar with HIPAA
- [ ] Consent is documented in SP before first use with each patient — extension verifies this

### Audit & Access
- [ ] Audit log implemented: records what data was accessed, when, and what actions were taken
- [ ] Audit logs stored locally (not in session storage — these need to persist), encrypted
- [ ] Extension requires Inzinna to authenticate before accessing any patient data
- [ ] Process exists to delete a patient's data from the extension if they revoke consent

### Business Associate Agreements
- [ ] SimplePractice already has a BAA in place (they are a HIPAA-covered platform) ✅
- [ ] No other third-party services receive PHI in this architecture — BAA not required for any other vendor in the MVP
- [ ] If a cloud LLM is ever added in the future, a BAA must be signed before use

### Pre-Launch Review
- [ ] Extension code reviewed by a developer for accidental PHI leaks (console logs, error messages, network requests)
- [ ] Test session run with fake/demo patient data to verify no unexpected data transmission (use Chrome DevTools Network tab to inspect)
- [ ] Legal/compliance review of consent form language before first real patient use

---

## Architecture

```
┌───────────────────────────────────────────────────────┐
│         Chrome Extension — SimplePractice Notes        │
│                   (Manifest V3, standalone)            │
├────────────┬──────────────┬───────────────────────────┤
│ Content     │ Side Panel    │ Content Script:           │
│ Script:     │ (persistent): │ SP Note Auto-Fill        │
│ SP Intake   │ • DSM-5       │ (submits completed       │
│ Extractor   │   criteria    │  report back into SP)    │
│             │   checklist   │                          │
│             │ • Multi-dx    │                          │
│             │   panels/tabs │                          │
│             │ • Live        │                          │
│             │   transcript  │                          │
│             │ • Clinician   │                          │
│             │   chat        │                          │
│             │ • Post-session│                          │
│             │   report      │                          │
│             │   editor      │                          │
├────────────┴──────────────┴───────────────────────────┤
│              Background Service Worker                 │
│  - Session storage (PHI w/ TTL, auto-cleanup)         │
│  - Bridges extension ↔ local server                   │
│  - Consent state management                           │
├───────────────────────────────────────────────────────┤
│              Local Server (localhost)  [Bonus phases]  │
│  - faster-whisper / whisper.cpp (transcription)       │
│  - whisperX / pyannote-audio (speaker diarization)    │
│  - Ollama + local LLM (criteria matching, note gen)   │
│  - DSM-5 criteria bank (bundled JSON)                 │
└───────────────────────────────────────────────────────┘
```

---

## Build Order

### Must-Have (MVP)

| Phase | Module | Depends On | Description |
|-------|--------|------------|-------------|
| 1 | Intake Form Extraction | — | Content script reads intake data from SP |
| 2 | DSM-5 Diagnostic Impressions | Phase 1 | Local LLM maps intake → ranked diagnoses; multi-dx support |
| 3 | Post-Session Report + Auto-Fill | Phases 1-2 | Generate report, clinician reviews, submit to SP intake form |

### Bonus (Exciting Extras)

| Phase | Module | Depends On | Description |
|-------|--------|------------|-------------|
| 4 | Local server setup | — | Whisper + diarization + Ollama on localhost (free, open source) |
| 5 | Session Audio Recording | Phase 4 | Record + transcribe + diarize locally; consent gated by SP form |
| 6 | Live Diagnostic Interview | Phases 4-5 | Real-time criteria checklist, multi-dx auto-check, mid-session adds |

---

## Future Vision: Facial Expression & Nonverbal Analysis

> This is a longer-term idea to be planned in its own file when ready. Captured here so it doesn't get lost.
>
> **Connection to the bigger plan:** This feature fits directly into Phase 8 of `content/strategy/plan-matching-insurance-booking.md` — the AI-assisted therapy layer (Level 3: AI-delivered structured interventions supervised by a licensed clinician). The clinical tools being built here for Inzinna's practice are the early foundation of that vision: real therapeutic workflow data, real outcome signals, and real clinician feedback loops. The facial analysis layer would eventually power quality monitoring and AI supervision at scale — part of the long-term goal of building a platform that makes ZocDoc and Headway unnecessary.

**Concept:** After a telehealth session (via Zoom, SimplePractice Telehealth, etc.), Inzinna reviews the recorded video. An AI layer analyzes the recording for nonverbal and affective signals and provides structured clinical feedback.

**What it could detect:**
- **Facial affect:** Emotion recognition across the session (baseline neutral, moments of distress, flat affect, incongruent affect)
- **Affect consistency:** Does the patient's expressed emotion match what they're saying? (e.g., laughing while describing grief — clinically significant)
- **Engagement patterns:** Eye contact, head nods, gaze aversion — can signal dissociation, shame, anxiety
- **Psychomotor signs:** Restlessness, slowed movement, hand-wringing — relevant to depression, anxiety, mania assessment
- **Clinician feedback:** How is Inzinna's own body language, tone, and pacing landing? Useful for supervision and skill-building.

**How it would integrate:**
- Video stays fully local — same HIPAA-safe local processing principle
- Runs post-session (not real-time) — clinician reviews the analysis report alongside the session transcript
- Findings feed into the diagnostic impressions (e.g., "flat affect observed — supports MDD criterion B")
- Could eventually plug into the Post-Session Report as an "Observed Affect" section

**Tools likely needed (all local, all free):**
- `MediaPipe` or `DeepFace` — facial landmark and emotion detection, runs locally
- `OpenFace` — action unit analysis (the academic gold standard for clinical affect research)
- Same local server architecture as the audio pipeline (Phase 4)

**HIPAA note:** Video contains highly identifiable biometric data. Consent language will need to explicitly cover video analysis. Raw video must be auto-deleted after analysis — only the structured report persists.

**Next step when ready:** Create `content/Inzinna/Facial Analysis/PLAN.md` and flesh out the full module design.

---

## Research Foundation

Evidence supporting each module, drawn from OpenEvidence systematic literature review and citations from `content/strategy/plan-matching-insurance-booking.md`.

---

### Module 1 & 5: AI Clinical Documentation & Report Generation

**The case for building it:**
- AI tools produce a moderate reduction in documentation workload (SMD = -0.71, 95% CI: -0.93 to -0.49) and documentation time (SMD = -0.72) when clinicians review and edit AI-generated drafts. Quality is at least comparable to manually prepared notes. *(Zhao et al., 2025 — BMC Medical Informatics)*
- Ambient AI scribes reduced EHR time by approximately 2–6 minutes per appointment. ~50% of clinicians reported decreased after-visit documentation time and reduced EHR frustration. *(Pearlman et al., 2025 — JAMA Network Open; Liu et al., 2024 — JAMA Network Open)*

**The case for mandatory clinician review (why we built it that way):**
- A proof-of-concept study of AI-generated psychiatric interview documentation found AI achieved 78% accuracy vs. 94% for human-written reports (p=.003), struggled with complex psychopathological features, and introduced **clinically relevant inaccuracies** — underscoring that clinical review by a qualified professional is not optional. *(Gülegen et al., 2026 — Frontiers in Psychiatry)*
- A 2025 review of commercial AI note-writing tools for mental health found most lacked transparency about training methodologies, bias correction, and evidence base. *(Bouguettaya et al., 2025 — General Hospital Psychiatry)*

**Clinical standards:**
- APA Assessment Guidelines require clinician decision-making authority — AI assists, clinician decides. *(Campbell et al., 2020)*
- APA Telepsychology Practice Guidelines apply to digital clinical tools and remote documentation workflows. *(Barnwell et al., 2024)*

---

### Module 2: DSM-5 Diagnostic Impressions & Multi-Dx Support

**The case for structured diagnostic support:**
- Structured diagnostic interviews improve accuracy dramatically: **86% vs. 54%** compared to unstructured clinical interviews in inpatient settings. *(Miller et al., 2001 — Psychiatry Research)*
- Structured interviews identified **5x as many secondary diagnoses** as routine clinical documentation — directly validating multi-dx support. *(Ramirez Basco et al., 2000 — American Journal of Psychiatry)*
- SCID-5-CV demonstrated excellent reliability (kappa >0.70 for most diagnoses) and high specificity (>0.70). *(Osório et al., 2019 — Psychiatry and Clinical Neurosciences)*
- Combining structured interviewing with medical record review produces the most accurate primary diagnoses. *(Ramirez Basco et al., 2000)*

**The case for AI-assisted (not AI-decided) diagnosis:**
- AI-powered clinical interviews achieved higher agreement, sensitivity, and specificity in identifying clinician-diagnosed disorders vs. established rating scales, with most participants rating the AI interview as **highly empathic and supportive**. *(Sikström et al., 2025 — Scientific Reports)*
- An AI decision support system achieved 89% accuracy using only 28 questions — far fewer than traditional tools. *(Tutun et al., 2023 — Information Systems Frontiers)*
- NLP tools showed good depression detection performance (AUC 0.77–0.92), with LLMs outperforming traditional ML. *(Yulianti et al., 2025 — International Journal of Medical Informatics)*

**Key limitations to respect in design:**
- AI diagnostic tools struggled with cultural adaptability and non-English contexts. *(Yulianti et al., 2025)*
- Performance varied widely (21–100%) across disorders — clinician override must always be possible. *(Cruz-Gonzalez et al., 2025 — Psychological Medicine)*

---

### Modules 3–4 & Bonus Phases: Session Recording & Deliberate Practice

**The case for session recording:**
- When therapists reviewed client symptom measures **before** sessions (rather than after), clients showed significantly larger symptom improvement by the next session. *(Li et al., 2025 — Journal of Counseling Psychology)*
- Progress feedback narrowed the gap between more and less effective therapists by ~18.2%, reducing therapist effects (ICC=0.011 → 0.009). *(Delgadillo et al., 2022 — Journal of Consulting and Clinical Psychology)*
- Deliberate practice using session recordings produced better observer-rated skills across all performance measures and greater empathy at 4-month follow-up vs. traditional didactic training. *(Westra et al., 2021 — Psychotherapy)*
- Therapists cannot accurately identify deteriorating clients without objective data. *(Muir et al., 2019)* — validated by the finding that progress feedback meaningfully changes outcomes.
- Session recording is the single strongest predictor of superior therapist outcomes. *(Chow et al., 2015)*

**Patient attitudes toward recording:**
- **90% of patients** reported listening to session recordings between sessions; most endorsed positive attitudes and discussed recordings with therapists. *(Shepherd et al., 2009 — Behavioural and Cognitive Psychotherapy)*
- Clients rated the potential helpfulness of independently reviewing sessions **higher than therapists anticipated**. *(King & Boswell, 2021 — Journal of Clinical Psychology)*
- Recording for supervision is viewed favorably by both therapists and patients. *(Franzen et al., 2023 — Frontiers in Psychology)*

**Honest limitation:**
- A 2025 systematic review found wide variability in how deliberate practice has been operationalized — only 3 of 20 studies met contemporary DP definitions. Evidence is promising but still developing. *(Diamond et al., 2025 — Psychotherapy)*

**Clinical standards:**
- IOPC Teleneuropsychology Guidance covers standards for remote clinical tools generally. *(Bilder et al., 2020)*
- Routine outcome monitoring (ROM) shows effect sizes of 0.36–0.53 for at-risk clients when clinical support tools flag them early. *(Barkham et al., 2023)*

---

### Full Reference List

1. Zhao J et al. (2025). AI Tools and Clinical Documentation Burden: Systematic Review and Meta-Analysis. *BMC Medical Informatics and Decision Making.*
2. Pearlman K et al. (2025). Use of an AI Scribe and EHR Efficiency. *JAMA Network Open.* 8(10):e2537000.
3. Liu TL et al. (2024). AI-Powered Clinical Documentation and Clinicians' EHR Experience. *JAMA Network Open.* 7(9):e2432460.
4. Stults CD et al. (2025). Evaluation of an Ambient AI Documentation Platform for Clinicians. *JAMA Network Open.* 8(5):e258614.
5. Gülegen B et al. (2026). AI-generated Documentation of Psychiatric Interviews: Proof-of-Concept. *Frontiers in Psychiatry.* 17:1621532.
6. Bouguettaya A et al. (2025). AI-driven Report-Generation Tools in Mental Healthcare. *General Hospital Psychiatry.* 94:150–158.
7. Bracken A et al. (2025). AI-Powered Documentation Systems in Healthcare: Systematic Review. *Journal of Medical Systems.* 49(1):28.
8. Miller PR et al. (2001). Accuracy of Structured vs. Unstructured Interviews. *Psychiatry Research.* 105(3):255–64.
9. Osório FL et al. (2019). Clinical Validity and Reliability of SCID-5-CV. *Psychiatry and Clinical Neurosciences.* 73(12):754–760.
10. Ramirez Basco M et al. (2000). Methods to Improve Diagnostic Accuracy in Community Mental Health. *American Journal of Psychiatry.* 157(10):1599–605.
11. Saunders EFH et al. (2021). Predictors of Diagnostic Delay in Psychiatric Clinics. *Depression and Anxiety.* 38(5):545–553.
12. Sikström S et al. (2025). Generative AI-assisted Clinical Interviewing of Mental Health. *Scientific Reports.* 15(1):37737.
13. Cruz-Gonzalez P et al. (2025). AI in Mental Health Care: Systematic Review. *Psychological Medicine.* 55:e18.
14. Abd-Alrazaq A et al. (2022). Performance of AI in Diagnosing Mental Disorders: Umbrella Review. *NPJ Digital Medicine.* 5(1):87.
15. Yulianti EP et al. (2025). NLP-based Assessment for Mental Health Diagnosis. *International Journal of Medical Informatics.* 205:106129.
16. Tutun S et al. (2023). AI-based Decision Support System for Mental Health Disorders. *Information Systems Frontiers.* 25(3):1261–1276.
17. Ghorbankhani M & Safara M. (2025). AI in Depression Diagnostics: Systematic Review. *Artificial Intelligence in Medicine.* 172:103320.
18. Li X et al. (2025). Therapist Review of Client Symptom Measures and Clinical Outcome. *Journal of Counseling Psychology.* 72(2):192–200.
19. Delgadillo J et al. (2022). Progress Feedback and Therapist Effects Meta-Analysis. *Journal of Consulting and Clinical Psychology.* 90(7):559–567.
20. Vaz A et al. (2025). Rethinking Psychotherapy Training: The Case for Deliberate Practice. *Journal of Clinical Psychology.* 81(6):393–398.
21. Westra HA et al. (2021). Deliberate Practice Workshop for Responsivity to Resistance. *Psychotherapy.* 58(2):175–185.
22. Diamond G et al. (2025). Systematic Review of Deliberate Practice in Psychotherapy. *Psychotherapy.* 62(2):113–131.
23. Shepherd L et al. (2009). Recording Therapy Sessions: Patient and Therapist Attitudes. *Behavioural and Cognitive Psychotherapy.* 37(2):141–50.
24. King BR & Boswell JF. (2021). Therapist and Client Attitudes Toward Client Independent Review of Sessions. *Journal of Clinical Psychology.* 77(9):1894–1904.
25. Franzen MM et al. (2023). Orientation to Being Recorded in Psychotherapeutic Interaction. *Frontiers in Psychology.* 14:1254555.
26. Campbell et al. (2020). APA Assessment Guidelines.
27. Barnwell et al. (2024). APA Telepsychology Practice Guidelines.
28. Bilder et al. (2020). IOPC Teleneuropsychology Guidance. *Archives of Clinical Neuropsychology.*
29. Chow DL et al. (2015). The Role of Deliberate Practice in the Development of Highly Effective Psychotherapists. *Psychotherapy.*
30. Barkham M et al. (2023). Routine Outcome Monitoring and Clinical Support Tools. *(cited in matching plan Phase 6)*
31. Muir HJ et al. (2019). Therapist Self-Assessment of Client Deterioration. *(cited in matching plan Phase 6)*

---

## Open Questions

1. **Which local LLM?** Ollama with Llama 3 / Mistral / Phi-3? Needs strong clinical reasoning; should run well on Inzinna's Mac (16GB+ RAM recommended).
2. **Multi-diagnosis support:** ✅ Decided — no hard cap; max 3 side-by-side panels, extras in tabs; mid-session adds supported; shared evidence across all open diagnoses.
3. **Auto-fill targets:** ✅ Decided — start with intake forms; expand to progress notes, treatment plans, and diagnosis codes in later phases.
4. **Consent workflow:** ✅ Decided — one-time per patient via existing SP consent form; no recording before consent confirmed; recording is never used to capture consent itself.
5. **Data transfer method:** ✅ Decided — DOM-based (no SP API needed for MVP); same approach as ZocDoc extension.
6. **SP intake template fields:** To be confirmed via Chrome DevTools inspection of a live SP intake page.
