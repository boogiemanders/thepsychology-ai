# SimplePractice Notes — HIPAA Clinical Notes System

## Vision
A HIPAA-compliant tool for Inzinna's clinical workflow that extracts SimplePractice intake data, generates DSM-5-TR diagnostic impressions, records session audio, and provides a clinician-facing chat for diagnostic exploration.

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

## Module 2: DSM-5-TR Diagnostic Impressions

**What:** Run extracted intake data through DSM-5-TR criteria to surface possible diagnostic impressions for the clinician to review.

**Data sources:**
- Existing DSM-5-TR assessment content in `staging/review/psychprep/5 Assessment/`
- Diagnostic exam question banks in `diagnosticGPT/`

**Approach:**
- Local LLM (e.g., Llama 3, Mistral, or Phi-3 via Ollama) maps presenting concerns to DSM-5-TR categories
- Generate a ranked list of possible diagnoses with supporting criteria
- Flag rule-outs and differential diagnoses
- Clinician reviews and confirms/edits — AI suggests, clinician decides

**Output:** Structured diagnostic impression draft:
```
Primary: [Diagnosis] — [DSM-5-TR code]
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
- Clinician scrolls through DSM-5-TR criteria for a suspected diagnosis
- The system listens to the live session audio and analyzes patient responses in real-time
- The clinician can ask targeted questions to assess specific criteria
- The interface auto-checks YES / NO / UNCLEAR for each criterion based on what the patient says
- Clinician can override any auto-checked item

**UI Concept:**
```
┌──────────────────────────────────────────┐
│  Diagnosis: Major Depressive Disorder     │
│  DSM-5-TR Code: 296.2x (F32.x)          │
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
2. DSM-5-TR criteria load as a scrollable checklist
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
- DSM-5-TR criteria bank bundled from existing `staging/review/psychprep/5 Assessment/` content
- Clinician chat for freeform diagnostic questions
- All processing fully local — no PHI leaves the device

---

## Module 5: Post-Session Report & Auto-Fill

**What:** After the session ends, the system compiles all captured data (intake, transcript, diagnostic impressions, criteria checklist, MSE, standardized measures, C-SSRS) into a structured clinical note that the clinician can review, edit, and submit back into SimplePractice with one click.

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
│  MENTAL STATUS EXAM                  │
│  Appearance, Behavior, Speech,       │
│  Mood, Affect, Thought Process,      │
│  Thought Content, Cognition,         │
│  Insight, Judgment                   │
├──────────────────────────────────────┤
│  RISK ASSESSMENT                     │
│  C-SSRS score + level, SI/HI summary │
├──────────────────────────────────────┤
│  STANDARDIZED MEASURES               │
│  PHQ-9: [score] ([severity])         │
│  GAD-7: [score] ([severity])         │
├──────────────────────────────────────┤
│  DIAGNOSTIC IMPRESSIONS              │
│  Primary: [Dx] — [DSM-5-TR code]    │
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
│  - Interventions used this session   │
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
- Diagnosis codes (DSM-5-TR)
- Clinical documentation forms

---

## Module 6: Structured Mental Status Exam (MSE)

**What:** A guided MSE form in the side panel that the clinician fills during the session. Replaces freeform MSE narrative with structured, consistent documentation.

**Fields:**
| Domain | Options |
|--------|---------|
| Appearance | Well-groomed, disheveled, appropriate dress, unusual |
| Behavior | Cooperative, agitated, guarded, psychomotor agitation/retardation |
| Speech | Normal rate/rhythm/volume, pressured, slow, tangential |
| Mood | Patient's own words (verbatim quote) |
| Affect | Euthymic, dysthymic, anxious, blunted, flat, labile, congruent/incongruent |
| Thought Process | Linear/goal-directed, circumstantial, tangential, loose associations, flight of ideas |
| Thought Content | No SI/HI, delusions, obsessions, phobias (links to C-SSRS for SI/HI detail) |
| Perceptions | No hallucinations, auditory/visual/other |
| Cognition | Alert & oriented ×3/4, intact concentration, intact memory |
| Insight | Good, fair, poor, absent |
| Judgment | Good, fair, poor |

**Approach:**
- Dropdown/checkbox UI in side panel — quick to fill during session, no typing required
- MSE data stored in session storage with the rest of the session PHI
- Auto-generates a narrative MSE paragraph for the note (e.g., "Patient presented as well-groomed and cooperative. Speech was normal in rate and volume...")
- Clinician can edit the generated narrative before submitting

---

## Module 7: Standardized Measure Scoring & Trend Tracking

**What:** Auto-score PHQ-9 and GAD-7 responses from SimplePractice intake/check-ins, and track scores longitudinally across sessions.

**Measures:**
- **PHQ-9** (Patient Health Questionnaire-9) — depression severity
- **GAD-7** (Generalized Anxiety Disorder-7) — anxiety severity

**Forms:** Physical forms are available and will be digitized into the extension.

**Approach:**
- Content script extracts PHQ-9 / GAD-7 responses if submitted through SP
- Manual entry fallback: clinician enters scores from paper forms in the side panel
- Scoring thresholds applied automatically:
  - PHQ-9: Minimal (0-4), Mild (5-9), Moderate (10-14), Mod-Severe (15-19), Severe (20-27)
  - GAD-7: Minimal (0-4), Mild (5-9), Moderate (10-14), Severe (15-21)
- **Longitudinal graph** shown in the side panel — score trend across all sessions for this patient
- Scores and severity levels auto-populate the standardized measures section of the session note

---

## Module 8: C-SSRS Risk Assessment Workflow

**What:** A structured Columbia Suicide Severity Rating Scale (C-SSRS) workflow in the side panel for every session. Replaces informal risk screening with a validated, structured instrument.

**Form:** The full C-SSRS form is available and will be digitized into the extension.

**Approach:**
- C-SSRS questions presented as a guided flow in the side panel at the start of each session
- Branching logic: if patient denies ideation, skip intensity/behavior sections
- Auto-calculates risk level: No risk / Low / Moderate / High
- Required before "Generate Note" can be clicked — ensures risk is assessed every session
- Output populates the Risk Assessment section of the session note:
  ```
  C-SSRS: Ideation Type [X], Intensity Score [X], Behavior [Y/N]
  Risk Level: [Low/Moderate/High]
  Safety plan: [reviewed / updated / N/A]
  ```
- Links to MSE Thought Content field (SI/HI entry pulls from C-SSRS result)

---

## Module 9: Session Timer & Intervention Logger

**What:** Two lightweight session-management tools visible in the side panel throughout the session.

### Session Timer
- Countdown from session start (configurable: 45 min, 50 min, 60 min)
- Visual alert at 10 minutes remaining, urgent alert at 5 minutes
- Shown persistently in side panel header so it's always visible

### Intervention Logger
- Checkboxes for therapeutic modalities used in the session
- Examples: CBT techniques, DBT skill, motivational interviewing, psychoeducation, exposure, behavioral activation, mindfulness, crisis intervention, psychodynamic exploration, supportive therapy
- Clinician checks what was actually done — documents treatment fidelity
- Selected interventions auto-populate the "Interventions" section of the session note

---

## Module 10: DSM-5-TR Quick Lookup

**What:** An in-panel DSM-5-TR diagnosis search so the clinician can look up criteria, codes, and specifiers without leaving SimplePractice.

**Approach:**
- Bundled DSM-5-TR diagnosis list with criteria summaries, specifiers, and diagnostic codes
- Search by diagnosis name or DSM-5-TR code prefix — instant filtering
- Click a diagnosis to view its full criteria in-panel or insert the code into the diagnostic impressions section
- Sources from existing DSM-5-TR content in `staging/review/psychprep/5 Assessment/`

---

## Module 11: Teleprompter Mode (Webcam Eye Contact)

**What:** A compact floating overlay that positions the most critical session information near the top of the screen — directly below or beside the webcam — so the clinician appears to maintain natural eye contact during video visits while reading criteria, suggested questions, or the C-SSRS flow.

**The problem it solves:** During telehealth, clinicians look down or to the side to read notes, which patients perceive as inattention. By placing the interface near the webcam, the clinician's gaze stays naturally forward.

**UI Concept:**
```
┌─────────────────────────────────────────────────────────┐  ← top of screen (near webcam)
│  [MDD Criterion A3 ❓]  Weight/appetite change           │
│  Suggested: "Have you noticed changes in your appetite?" │
│  ──────────────────────────────  [≡ Full Panel]  [✕]   │
└─────────────────────────────────────────────────────────┘
         ↑ webcam is here
```

**How it works:**
- Full side panel has a **"Teleprompter Mode"** button
- Clicking it collapses the interface to a slim, semi-transparent floating bar
- Bar defaults to top-center of the browser window (directly below the webcam on most laptops)
- **Draggable** — clinician positions it once, position saved in localStorage per monitor/resolution
- Displays only the most immediately needed item: current criterion, C-SSRS question, or suggested follow-up
- Clinician taps a hotkey (e.g., `Alt+N`) to advance to the next item without clicking
- Clicking **"Full Panel"** restores the complete side panel
- **Auto-detects video visits:** If the URL matches a telehealth/video pattern in SP, teleprompter mode activates automatically (configurable)

**Display priority in teleprompter mode (in order):**
1. C-SSRS current question (if risk assessment is in progress)
2. Current DSM-5-TR criterion being assessed + suggested follow-up question
3. Active homework check-in prompt (start of session)
4. Session timer (always visible in corner of bar)

---

## Module 12: Pre-Session Brief

**What:** A 1-page auto-generated prep card that appears the moment the clinician opens a client's page in SimplePractice — before the session starts. Gives instant context without digging through old notes.

**Contents:**
```
┌──────────────────────────────────────────────┐
│  PRE-SESSION BRIEF — [Patient] — [Date]      │
├──────────────────────────────────────────────┤
│  Last session: [date] ([X] days ago)         │
│  Last session summary: [2-3 sentence recap]  │
├──────────────────────────────────────────────┤
│  Homework assigned last session:             │
│  • [Assignment 1] — check in today           │
│  • [Assignment 2] — check in today           │
├──────────────────────────────────────────────┤
│  Active treatment goals:                     │
│  • [Goal 1] — In progress                   │
│  • [Goal 2] — Achieved ✅                   │
├──────────────────────────────────────────────┤
│  Last measures:                              │
│  PHQ-9: 12 (Moderate) ↑ from 9              │
│  GAD-7: 8 (Mild) → stable                   │
├──────────────────────────────────────────────┤
│  Last C-SSRS: Low risk ([date])              │
├──────────────────────────────────────────────┤
│  Current medications: [list from intake]     │
│  Open items: [any flags from prior sessions] │
└──────────────────────────────────────────────┘
```

**Approach:**
- Content script detects when a client's appointment/profile page loads
- Pulls from session storage (prior session data) and local LLM generates 2-3 sentence summary of last session
- PHQ-9/GAD-7 trend arrows (↑ ↓ →) calculated automatically
- Dismisses automatically when the session timer starts, or with a keystroke
- No new data entry — entirely generated from data already captured by other modules

---

## Module 13: Safety Plan Builder

**What:** A structured Stanley-Brown safety plan workflow triggered when C-SSRS flags moderate or high risk. Produces a completed safety plan the clinician can print or save for the client.

**Stanley-Brown Safety Plan sections:**
1. Warning signs (thoughts, images, moods, behaviors)
2. Internal coping strategies (things I can do alone to distract)
3. Social contacts for distraction (people + places)
4. People I can ask for help
5. Professionals/agencies to contact in crisis (with phone numbers)
6. Making the environment safe (means restriction)

**Approach:**
- C-SSRS module auto-triggers the safety plan builder when risk level = Moderate or High
- Clinician can also open it manually at any time from the side panel
- Free-text fields per section, voice-to-text supported (patient can dictate their own answers)
- Completed plan exports to printable PDF
- Copy of completed plan stored in session storage and referenced in the session note's risk section
- Date/version tracked across sessions so the clinician can see if the plan was updated

---

## Module 14: Between-Session Homework Tracker

**What:** A simple log of between-session assignments given to the patient. Displayed in the pre-session brief next session and prompts the clinician to check in on completion.

**Approach:**
- Clinician adds assignments at the end of a session (free text or from a preset list: thought record, behavioral activation, sleep diary, exposure practice, journaling, reading, etc.)
- Assignments stored linked to the patient and session date
- Next session: pre-session brief shows what was assigned, homework tracker in side panel prompts check-in at session start
- Clinician marks each as: Completed / Partially completed / Not attempted / Not applicable
- Completion status + any barriers noted auto-populate the session note
- Patterns surfaced by cross-session detection (Module 15): consistent non-completion flagged

---

## Module 15: Cross-Session Pattern Detection

**What:** After 3+ sessions, the local LLM analyzes data across all sessions to surface clinically meaningful trends the clinician might not consciously notice.

**Patterns detected:**
- **Measure trends:** "PHQ-9 has increased 3 sessions in a row despite active treatment"
- **Symptom recurrence:** "Patient has mentioned sleep difficulties in 4 of 5 sessions — not reflected in treatment goals"
- **Homework non-completion:** "Assignments have not been completed in 3 consecutive sessions"
- **Risk escalation:** "C-SSRS score has increased each session for the past month"
- **Goal stagnation:** "Treatment goal #2 has been 'in progress' for 8 sessions without advancement"
- **Unaddressed themes:** "Trauma history mentioned in intake but no trauma-focused intervention logged"

**Approach:**
- Runs locally via Ollama after each session completes (no real-time processing needed)
- Patterns displayed as a brief alert section in the pre-session brief (Module 12)
- Clinician can dismiss, snooze, or flag a pattern for supervision
- All analysis fully local — no PHI leaves the device

---

## Module 16: Prescriber & PCP Communication Draft

**What:** Auto-generate a brief clinical update letter to the prescribing physician or PCP, based on session data. Covers coordination-of-care documentation requirements.

**Letter types:**
- **Prescriber update** — diagnosis, current functioning, medication response (reported by patient), clinical recommendations
- **PCP update** — presenting problem, diagnosis, treatment approach, any medical referral needs
- **Referral letter** — to psychiatrist, specialist, or other provider

**Approach:**
- Clinician selects letter type and recipient from side panel after session
- Local LLM drafts the letter using session data (diagnosis, functioning, medications from intake, interventions used)
- Clinician reviews and edits inline before sending
- Letter does NOT auto-send — clinician copies/pastes or prints
- Draft stored in session storage with the session data (same TTL)

---

## Module 17: Termination Summary Generator

**What:** At end of treatment, compiles a comprehensive termination summary from all session data across the entire treatment episode.

**Summary structure:**
```
TERMINATION SUMMARY — [Patient] — [Date]
Treatment dates: [start] to [end] ([X] sessions)

Presenting problem at intake:
[Chief complaint + intake clinical summary]

Diagnoses:
Primary: [Dx] — [DSM-5-TR code]
[Any changes across treatment]

Treatment provided:
Modalities: [from intervention logs]
Frequency: [from session data]

Goal achievement:
• [Goal 1]: Achieved ✅ — [brief note]
• [Goal 2]: Partially achieved — [brief note]
• [Goal 3]: Discontinued — [reason]

Symptom trajectory:
PHQ-9: [intake score] → [final score] ([% change])
GAD-7: [intake score] → [final score] ([% change])
[Chart of scores across treatment]

Risk summary:
[C-SSRS history summary, any safety plans]

Reason for termination:
[Goals met / patient request / transfer / etc.]

Aftercare plan:
[Follow-up recommendations, referrals, resources]
```

**Approach:**
- Triggered by clinician clicking "Generate Termination Summary" in the side panel
- Local LLM synthesizes across all stored session data for this patient
- Clinician reviews, edits, and submits to SimplePractice or exports as PDF
- PHQ-9/GAD-7 trend chart included as a visual

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
│ SP Intake   │ • DSM-5-TR    │ (submits completed       │
│ Extractor   │   criteria    │  report back into SP)    │
│             │   checklist   │                          │
│             │ • MSE form    │                          │
│             │ • C-SSRS flow │                          │
│             │ • PHQ-9/GAD-7 │                          │
│             │ • Session     │                          │
│             │   timer       │                          │
│             │ • Intervention│                          │
│             │   logger      │                          │
│             │ • DSM-5-TR    │                          │
│             │   lookup      │                          │
│             │ • Teleprompter│                          │
│             │   mode        │                          │
│             │ • Pre-session │                          │
│             │   brief       │                          │
│             │ • Homework    │                          │
│             │   tracker     │                          │
│             │ • Safety plan │                          │
│             │   builder     │                          │
│             │ • Pattern     │                          │
│             │   detection   │                          │
│             │ • Prescriber  │                          │
│             │   letter      │                          │
│             │ • Termination │                          │
│             │   summary     │                          │
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
│  - DSM-5-TR criteria bank (bundled JSON)              │
└───────────────────────────────────────────────────────┘
```

---

## Build Order

| Phase | Module | Depends On | Description |
|-------|--------|------------|-------------|
| 1 | Local server setup | — | Whisper + diarization + Ollama running on localhost |
| 2 | Intake Form Extraction | — | Content script extracts intake data from SP |
| 3 | DSM-5-TR Diagnostic Impressions | Phase 2 | Local LLM maps intake to DSM-5-TR criteria |
| 4 | Session Audio Recording | Phase 1 | Record + transcribe + diarize in real-time |
| 5 | MSE + C-SSRS + PHQ-9/GAD-7 + Timer + Interventions | — | Side panel session tools (no audio dependency) |
| 6 | DSM-5-TR Quick Lookup | — | Bundled diagnosis/criteria search, standalone |
| 7 | Live Diagnostic Interview | Phases 1-4 | Side panel with criteria checklist + auto-check |
| 8 | Teleprompter Mode | Phase 5 | Floating overlay near webcam for video visits |
| 9 | Homework Tracker | Phase 5 | Log assignments, check in next session |
| 10 | Pre-Session Brief | Phases 2, 5, 9 | Auto-generated prep card on client page load |
| 11 | Safety Plan Builder | Phase 8 (C-SSRS) | Stanley-Brown plan, PDF export, linked to C-SSRS |
| 12 | Cross-Session Pattern Detection | Phases 5, 9, 10 | LLM surfaces trends across all sessions |
| 13 | Prescriber/PCP Communication Draft | Phases 2, 5 | Auto-drafted coordination-of-care letters |
| 14 | Post-Session Report + Auto-Fill | Phases 2-13 | Generate report, edit, submit to SP |
| 15 | Termination Summary Generator | Phase 14 | Full treatment episode summary at discharge |

---

## Open Questions

1. **Which local LLM?** Ollama with Llama 3 / Mistral / Phi-3? Need one that's good at clinical reasoning and runs well on your Mac.
2. **Consent workflow:** Pop-up before each session? One-time consent per patient?
3. **Multi-diagnosis support:** Can the clinician have multiple DSM-5-TR diagnosis checklists open simultaneously (e.g., MDD + GAD differential)?
4. **Which SimplePractice note forms** should we target for auto-fill? (Progress notes, intake assessments, treatment plans — all of them?)
5. **PHQ-9/GAD-7 source:** Extract from SP if patient fills them digitally, or always manual entry by clinician?
6. **C-SSRS version:** Full vs. screener version for each session?
