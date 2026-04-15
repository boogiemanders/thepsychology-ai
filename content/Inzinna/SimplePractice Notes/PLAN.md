# SimplePractice Notes — HIPAA Clinical Notes System

## Vision
A HIPAA-compliant tool for Inzinna's clinical workflow that extracts SimplePractice intake data, generates DSM-5 diagnostic impressions, records session audio, and provides a clinician-facing chat for diagnostic exploration.

---

## Survey-Driven Priorities (April 2026)

The Inzinna clinician survey (n=7) directly maps to this plan. See `content/Inzinna/Clinician Survey/FEEDBACK-SYNTHESIS.md` for the full prioritization. Key signals:

- **100% (7/7)** want after-session note drafts — already built (Phase 3.5 SOAP generation)
- **86% (6/7)** want supervision prep (agenda + questions) — **new Phase 3.9 below**
- **86% (6/7)** want treatment planning suggestions — already in sidepanel; D&TP auto-filler (Phase 4) extends this
- **Highest Likert (4.14/5):** "helps identify blind spots" — positioning anchor
- **Lowest Likert (3.29/5):** "timely feedback when supervisor unavailable" — do NOT lead with this
- **Dealbreakers** (P01, P03, P05): no supervisor-visible telemetry on accept/reject, no auto-shared AI feedback to supervision, no training-data collection without opt-in

Cross-cutting requirements (apply to every phase going forward):

1. **Accuracy transparency** — every AI suggestion shows its source (intake field, DSM criterion, knowledge-base chunk). Addresses 6/7 accuracy barrier.
2. **UI reliability** — error boundaries, graceful degradation, one-click "report a problem" button. Addresses 5/7 UI barrier.
3. **Privacy-by-default** — no telemetry on follow/ignore. Codify in `PRIVACY-MODEL.md`. Addresses the 3 dealbreaker respondents.
4. **"Complement, not replace" copy** — every suggestion-label is advisory ("Consider asking...") not imperative.
5. **Autosave note drafts** on a timer (P01's only specific verbatim ask: "autosave on its own").

Pilots: P07 (licensed psychologist, already uses AI note-taker, most enthusiastic) and P08 (LMHC, no concerns stated, building caseload). See `content/Inzinna/Clinician Survey/pilot-outreach-P07-P08.md`.

---

## Phase 3.9 — Supervision Agenda Generator (new)

**Trigger:** 6/7 demand + highest-Likert value prop ("identify blind spots").

**Reuse, don't recreate:**

- Input: `diagnostic-engine.ts` output (pinned diagnoses + criterion evidence), latest `soap-generator.ts` draft, `clinical-knowledge.ts` corpus
- Pipeline: same Ollama→Groq→regex fallback chain as Phase 3.5

**Output (new sidepanel "Supervision Agenda" tab):**

- **Case summary** — 2–3 sentences, clinician-facing
- **Three discussion questions** — phrased as questions the supervisor might prompt, derived from weak/uncertain DSM-5 criteria and case-conceptualization gaps. Questions, not answers.
- **Blind-spot flags** — missed risk domains (SI/HI/substance), unscreened differentials given the intake, countertransference-adjacent patterns in the SOAP draft
- **Modality-specific prompts** — pulled from the clinical-knowledge corpus (DBT, MI, CBT, psychodynamic, PDM-3, ASAM) based on the clinician's declared orientation setting

**Privacy guardrails (non-negotiable):**

- Generated only on clinician demand (explicit button click); never auto-generated
- No logging of which questions the clinician uses vs. discards
- Never auto-shared; output is clinician-facing only
- "Export to supervisor" is a manual per-session action with a visible confirmation

**UI:**

- New tab alongside Diagnostics / SOAP in `src/sidepanel/`
- No new shell work; reuses existing sidepanel components

**Build order:** After Phase 3.8 (clinical-knowledge corpus), before Phase 4 (D&TP auto-filler).

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

## Phase 7: Diagnostic Coverage Expansion

**What:** Expand the diagnostic workspace beyond the initial high-frequency outpatient diagnosis set after the core intake, side panel, and note-generation flows are stable.

**Why:** The first pass is intentionally narrow so the diagnostic review workflow is usable quickly. Once that base is working reliably, the system should broaden to cover additional disorders that matter in real outpatient practice and differential diagnosis.

**Expansion principles:**
- Add diagnoses in curated packs, not the entire DSM at once
- Keep the system rules-first by default; only use local LLM support where it adds clear value
- Do not auto-suggest low-signal diagnoses from weak intake cues alone
- Require targeted follow-up prompts for diagnoses that need longitudinal or specialized assessment

**Priority expansion packs:**
- **Dissociative disorders:** Dissociative Identity Disorder, Depersonalization/Derealization Disorder, Dissociative Amnesia
- **Additional personality disorders:** Narcissistic Personality Disorder, Histrionic Personality Disorder, Avoidant Personality Disorder, Dependent Personality Disorder, Obsessive-Compulsive Personality Disorder, Antisocial Personality Disorder
- **Neurodevelopmental disorders:** Autism Spectrum Disorder (especially adult presentations that may overlap with anxiety, trauma, or ADHD), broader ADHD subtype refinement
- **Eating disorders:** Anorexia Nervosa, Bulimia Nervosa, Binge-Eating Disorder
- **Psychotic-spectrum / differential review:** Schizophrenia-spectrum rule-outs, Delusional Disorder, Schizoaffective Disorder

**Implementation approach:**
- Extend the DSM criteria data module with additional curated diagnosis definitions
- Add diagnosis-specific evidence mappings from intake, PHQ-9, GAD-7, raw Q&A, and future transcript data
- Introduce targeted clinician prompts for low-base-rate or high-complexity diagnoses before surfacing them as meaningful suggestions
- Keep personality and dissociative disorders in a conservative review tier unless the intake packet contains strong supporting signals
- Expand the side panel so clinicians can manually add these diagnoses even when auto-suggestion confidence is low

**Expected outcome:** A broader but still clinically controlled diagnostic system that can support more real-world cases without turning the suggestion engine into a noisy DSM keyword matcher.

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

### AI-Specific Consent & Transparency (from Lawrence et al., 2025)
- [ ] Patient consent form explicitly covers AI-assisted note generation (separate from recording consent)
- [ ] Patients informed about how AI is used, what data it processes, and opt-out options
- [ ] Consent language reviewed against Lawrence et al. (2025) findings on ambient AI documentation disclosure gaps

### AI Governance & Clinician Readiness (from Palmieri et al., 2026; Abdulnour et al., 2025)
- [ ] Inzinna completes minimum Tier 1 AI literacy training before clinical use (APA, ACP, or NYU Langone short course)
- [ ] Report review UI prompts Inzinna to note corrections made to AI-generated content (creates audit trail, builds critical evaluation habit)
- [ ] Known LLM limitations (cultural bias, non-English) surfaced as warnings in the report review UI
- [ ] Process established for logging and reviewing any AI-generated content that required significant clinical correction

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

**The unintended consequences we're designing against:**
- A study of 20,000+ primary care visits found that while AI scribes increased documentation of neuropsychiatric symptoms, they were associated with a **lesser likelihood of depression intervention** — clinicians became less active in treatment decisions, analogous to reduced pilot proficiency after autopilot adoption. This is the "automation complacency" risk. *(Castro et al., 2026 — JAMA Psychiatry)*
- AI can embed biases that spread across clinical teams who rely on previous notes, particularly compromising care for vulnerable populations including cognitively impaired or non-English-speaking patients. *(Sun et al., 2025 — Journal of Medical Ethics)*
- Key aspects of mental health care are relational — AI use may diminish clinicians' ability to provide safe care and push vulnerable patients further from recovery-promoting relationships. *(Woodnutt et al., 2024 — Journal of Psychiatric and Mental Health Nursing)*
- Experienced clinicians are more skeptical of AI tools. Counterintuitively, the most psychologically vulnerable patients — those with avoidant attachment, low epistemic trust, and high symptomatology — showed **higher acceptance of AI-based interventions** than psychologically healthier individuals who preferred human teletherapy. This means AI therapy tools may reach the patients who most need human connection. *(Békés & Aafjes-van Doorn, 2026 — Psychotherapy Research)*
- Skill degradation: reliance on AI tools may have unanticipated adverse consequences including diminished human clinician skill over time. *(Perlis, 2026 — JAMA Psychiatry)*

**The one strong positive RCT for AI-assisted therapy support:**
- An AI platform that provided therapists with feedback on evidence-based practices, session transcription, and automated progress notes led to **67% more session attendance** and superior depression/anxiety outcomes vs. treatment-as-usual. Notes were submitted 55 hours earlier on average. *(Sadeh-Sharvit et al., 2023 — Journal of Medical Internet Research)*
- This is the model closest to what the SP Notes tool does: AI supports the clinician's workflow without replacing clinical judgment.

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

**What true deliberate practice actually requires (design implications):**
Contemporary DP has 6 required components — this defines what the session recording module must enable to be genuinely useful, not just a recording archive:
1. Direct observation of performance
2. Concrete feedback
3. Specific learning goals defined in advance
4. Repeated behavioral rehearsal
5. Ongoing assessment of performance
6. Focus on expert performance benchmarks

*(Sacks, 2025 — Journal of Clinical Psychology; Husby, 2025 — Journal of Clinical Psychology; Vaz et al., 2025)*

Many "DP" studies actually involved traditional workshops with limited practice or feedback — the label isn't enough. The tool needs to support structured review against benchmarks, not just playback. *(Diamond et al., 2025)*

**Honest limitation:**
- A 2025 systematic review found wide variability in how deliberate practice has been operationalized — only 3 of 20 studies met contemporary DP definitions. Evidence is promising but still developing. *(Diamond et al., 2025 — Psychotherapy)*

**Clinical standards:**
- IOPC Teleneuropsychology Guidance covers standards for remote clinical tools generally. *(Bilder et al., 2020)*
- Routine outcome monitoring (ROM) shows effect sizes of 0.36–0.53 for at-risk clients when clinical support tools flag them early. *(Barkham et al., 2023)*

---

### Implementation Safeguards (Evidence-Based Design Requirements)

This section maps governance research directly to design decisions in the SP Notes tool.

**Mandatory clinician review is not a UX choice — it's a clinical safety requirement:**
- TJC/CHAI 2025 guidelines require mandatory reporting of AI adverse events, continuous performance monitoring scaled to proximity to patient care, and cross-functional AI oversight. *(Palmieri et al., 2026 — JAMA)*
- Informed consent for AI ambient documentation varies widely — many patients and clinicians report inadequate information about how the technology works, data handling, and opt-out options. *(Lawrence et al., 2025 — JAMA Network Open)*
- → **Design decision:** The SP Notes tool must disclose to patients that AI is used to assist note generation. This is a separate consent item from recording consent and needs to be in the SP consent form.

**The DEFT-AI framework for supervising AI use:**
- NEJM 2025: A structured framework for supervising AI use in clinical settings — Diagnosis, Evidence, Feedback, Teaching — promotes critical thinking and prevents skill degradation. The key question is always: "Did the AI output require correction, and why?" *(Abdulnour et al., 2025 — NEJM)*
- → **Design decision:** The report review UI should prompt Inzinna to note any corrections made to AI-generated content. This creates a local audit trail and builds the habit of critical evaluation.

**Bias and equity safeguards:**
- AI documentation may embed biases that spread across teams relying on previous notes — particularly compromising care for non-English-speaking and cognitively impaired patients. *(Sun et al., 2025 — Journal of Medical Ethics)*
- → **Design decision:** The local LLM must be tested against diverse patient presentations before clinical use. Any known language or cultural limitations should be surfaced as warnings in the UI.

**What clinicians need to know to use this safely (training):**
A 3-tier AI competency framework for clinicians *(Cao et al., 2026 — JMIR)*:
- **Tier 1 (Minimum for safe use):** Understand how LLMs work, prompt basics, privacy/security awareness, patient transparency and consent
- **Tier 2 (Evaluative):** Bias detection, interpreting AI explainability outputs, integrating AI into clinical workflow
- **Tier 3 (Leadership):** Governing model updates and change protocols

→ **Design decision:** Before Inzinna uses this tool with real patients, she should complete at minimum Tier 1 training. APA, ACP, NYU Langone, and Harvard all offer short courses. This isn't optional — it's part of the pre-launch review.

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
32. Castro VM et al. (2026). Psychiatric Documentation and Management in Primary Care With AI Scribe Use. *JAMA Psychiatry.* doi:10.1001/jamapsychiatry.2025.4303.
33. Perlis RH. (2026). Artificial Intelligence and the Potential Transformation of Mental Health. *JAMA Psychiatry.* doi:10.1001/jamapsychiatry.2025.4116.
34. Sun QW, Miller J, Hull SC. (2025). Charting the Ethical Landscape of Generative AI-augmented Clinical Documentation. *Journal of Medical Ethics.* doi:10.1136/jme-2024-110656.
35. Woodnutt S et al. (2024). Could Artificial Intelligence Write Mental Health Nursing Care Plans? *Journal of Psychiatric and Mental Health Nursing.* 31(1):79–86.
36. Békés V & Aafjes-van Doorn K. (2026). The Most Vulnerable Are Prone to Use AI Therapists. *Psychotherapy Research.* doi:10.1080/10503307.2026.2615388.
37. Sadeh-Sharvit S et al. (2023). Effects of an AI Platform for Behavioral Interventions on Depression and Anxiety: RCT. *Journal of Medical Internet Research.* 25:e46781.
38. Sacks D. (2025). Deliberate Practice Supervision to Enhance Behavioral Activation: Case Study. *Journal of Clinical Psychology.* 81(6):526–537.
39. Husby VM. (2025). Challenge and Support: Scaffolding the Practicing Therapist in DP Supervision. *Journal of Clinical Psychology.* 81(5):366–378.
40. Nissen-Lie HA. (2025). Deliberate Practice in Psychotherapy Supervision. *Journal of Clinical Psychology.* doi:10.1002/jclp.70043.
41. Palmieri S, Robertson CT, Cohen IG. (2026). New Guidance on Responsible Use of AI. *JAMA.* 335(3):207–208.
42. Abdulnour RE, Gin B, Boscardin CK. (2025). Educational Strategies for Clinical Supervision of AI Use (DEFT-AI). *New England Journal of Medicine.* 393(8):786–797.
43. Lawrence K et al. (2025). Informed Consent for Ambient Documentation Using Generative AI. *JAMA Network Open.* 8(7):e2522400.
44. Warraich HJ, Tazbaz T, Califf RM. (2025). FDA Perspective on Regulation of AI in Health Care. *JAMA.* 333(3):241–247.
45. Morgan DJ, Rodman A, Goodman KE. (2025). How Physicians Can Prepare for Generative AI. *JAMA Internal Medicine.* 185(12):1407–1408.
46. Cao W et al. (2026). From Agents to Governance: Essential AI Skills for Clinicians. *Journal of Medical Internet Research.* 28:e86550.
47. Russell RG et al. (2023). Competencies for Use of AI-Based Tools by Health Care Professionals. *Academic Medicine.* 98(3):348–356.
48. Labkoff S et al. (2024). Toward a Responsible Future: Recommendations for AI-enabled Clinical Decision Support. *JAMIA.* 31(11):2730–2739.

---

## Open Questions

1. **Which local LLM?** Ollama with Llama 3 / Mistral / Phi-3? Needs strong clinical reasoning; should run well on Inzinna's Mac (16GB+ RAM recommended).
2. **Multi-diagnosis support:** ✅ Decided — no hard cap; max 3 side-by-side panels, extras in tabs; mid-session adds supported; shared evidence across all open diagnoses.
3. **Auto-fill targets:** ✅ Decided — start with intake forms; expand to progress notes, treatment plans, and diagnosis codes in later phases.
4. **Consent workflow:** ✅ Decided — one-time per patient via existing SP consent form; no recording before consent confirmed; recording is never used to capture consent itself.
5. **Data transfer method:** ✅ Decided — DOM-based (no SP API needed for MVP); same approach as ZocDoc extension.
6. **SP intake template fields:** To be confirmed via Chrome DevTools inspection of a live SP intake page.
