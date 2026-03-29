# SimplePractice Notes — HIPAA Clinical Notes System

## Vision
A HIPAA-compliant tool for Inzinna's clinical workflow that extracts SimplePractice intake data, generates DSM-5 diagnostic impressions, records session audio, and provides a clinician-facing chat for diagnostic exploration.

---

## Decisions

- **Standalone extension** — separate from the ZocDoc-to-SimplePractice extension
- **Fully local processing** — Whisper local for transcription, local LLM for criteria matching. No PHI leaves the device.
- **Speaker diarization required** — must distinguish clinician vs patient voice. Only patient statements trigger criteria auto-checks.

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

---

## Module 2: DSM-5 Diagnostic Impressions

**What:** Run extracted intake data through DSM-5 criteria to surface possible diagnostic impressions for the clinician to review.

**Data sources:**
- Existing DSM-5 assessment content in `staging/review/psychprep/5 Assessment/`
- Diagnostic exam question banks in `diagnosticGPT/`

**Approach:**
- Local LLM (e.g., Llama 3, Mistral, or Phi-3 via Ollama) maps presenting concerns to DSM-5 categories
- Generate a ranked list of possible diagnoses with supporting criteria
- Flag rule-outs and differential diagnoses
- Clinician reviews and confirms/edits — AI suggests, clinician decides

**Output:** Structured diagnostic impression draft:
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
- Patient consent workflow required before recording

**Local stack:**
- `faster-whisper` or `whisper.cpp` — local transcription server
- `whisperX` or `pyannote-audio` — speaker diarization
- Runs as a lightweight local service the extension calls via `localhost`

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
1. Clinician selects a suspected diagnosis (or system suggests based on intake)
2. DSM-5 criteria load as a scrollable checklist
3. As the session audio is transcribed in real-time, NLP analyzes patient statements against each criterion
4. Criteria auto-check ✅ (met), ❌ (not met), or ❓ (unclear/not discussed)
5. Supporting quotes from the patient are displayed under each criterion
6. System suggests follow-up questions for ❓ criteria
7. Clinician can switch between diagnoses, explore differentials, or ask the chat for guidance
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

**What:** After the session ends, the system compiles all captured data (intake, transcript, diagnostic impressions, criteria checklist) into a structured clinical note that the clinician can review, edit, and submit back into SimplePractice with one click.

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
│  Differential: [list]               │
│  Rule-outs: [list]                   │
├──────────────────────────────────────┤
│  CLINICAL FORMULATION               │
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
3. Clinician reviews and edits any section inline
4. Clinician clicks "Submit to SimplePractice"
5. Content script auto-fills SimplePractice's progress note / clinical documentation forms (same DOM-filling pattern as the existing ZocDoc extension)

**Auto-fill targets in SimplePractice:**
- Progress notes
- Treatment plans
- Diagnosis codes (ICD-10/DSM-5)
- Clinical documentation forms

---

## HIPAA Compliance Checklist

- [ ] All PHI stored in browser session storage only (never localStorage or disk)
- [ ] Auto-delete with TTL (1 hour default, configurable)
- [ ] Audio encrypted at rest, auto-deleted after transcription
- [ ] No PHI transmitted without BAA-covered endpoint
- [ ] Patient consent captured before audio recording
- [ ] Audit logging (what was accessed, when, by whom)
- [ ] Extension requires authentication (clinician login)

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
│              Local Server (localhost)                   │
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
| 1 | Intake Form Extraction | — | Content script extracts intake data from SP |
| 2 | DSM-5 Diagnostic Impressions | Phase 1 | Local LLM maps intake to DSM-5 criteria |
| 3 | Post-Session Report + Auto-Fill | Phases 1-2 | Generate report, edit, submit back to SP |

### Bonus (Exciting Extras)

| Phase | Module | Depends On | Description |
|-------|--------|------------|-------------|
| 4 | Local server setup | — | Whisper + diarization + Ollama running on localhost |
| 5 | Session Audio Recording | Phase 4 | Record + transcribe + diarize in real-time |
| 6 | Live Diagnostic Interview | Phases 4-5 | Side panel with criteria checklist + auto-check |

---

## Open Questions

1. **Which local LLM?** Ollama with Llama 3 / Mistral / Phi-3? Need one that's good at clinical reasoning and runs well on your Mac.
2. **Consent workflow:** Pop-up before each session? One-time consent per patient?
3. **Multi-diagnosis support:** Can the clinician have multiple diagnosis checklists open simultaneously (e.g., MDD + GAD differential)?
4. **Which SimplePractice note forms** should we target for auto-fill? (Progress notes, intake assessments, treatment plans — all of them?)
