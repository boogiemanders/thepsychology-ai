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

## Open Questions

1. **Which local LLM?** Ollama with Llama 3 / Mistral / Phi-3? Needs strong clinical reasoning; should run well on Inzinna's Mac (16GB+ RAM recommended).
2. **Multi-diagnosis support:** ✅ Decided — no hard cap; max 3 side-by-side panels, extras in tabs; mid-session adds supported; shared evidence across all open diagnoses.
3. **Auto-fill targets:** ✅ Decided — start with intake forms; expand to progress notes, treatment plans, and diagnosis codes in later phases.
4. **Consent workflow:** ✅ Decided — one-time per patient via existing SP consent form; no recording before consent confirmed; recording is never used to capture consent itself.
5. **Data transfer method:** ✅ Decided — DOM-based (no SP API needed for MVP); same approach as ZocDoc extension.
6. **SP intake template fields:** To be confirmed via Chrome DevTools inspection of a live SP intake page.
