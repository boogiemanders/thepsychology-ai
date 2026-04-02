# SimplePractice Notes — Session Handoff

> Last updated: 2026-04-02

## What This Is
A standalone Chrome extension (Manifest V3) for Inzinna's clinical workflow. It extracts patient intake data from SimplePractice, and will eventually generate DSM-5 diagnostic impressions, record session audio, and auto-fill progress notes back into SimplePractice.

## Where We Left Off

### LLM-Powered SOAP Note Generation via Local Ollama
Replaced the regex-driven `buildSoapDraft()` with an LLM pipeline that sends session transcripts + clinical context to a local Ollama instance (`localhost:11434`, `llama3.1:8b`). All PHI stays on device. Falls back to regex builder if Ollama is unavailable.

**New files:**
- `src/lib/ollama-client.ts` — Ollama HTTP client (health check, model check, generate)
- `src/lib/soap-prompt.ts` — Builds system + user prompt from transcript, intake, diagnoses, treatment plan, MSE checklist
- `src/lib/soap-generator.ts` — Orchestrator: tries LLM first, falls back to regex `buildSoapDraft()`

**Supporting changes:**
- `types.ts` — Added `MseChecklist`, `ProviderPreferences` with Ollama settings, `SoapDraft.generationMethod` field
- `storage.ts` — MSE checklist CRUD operations
- `manifest.json` — Added `localhost` host permission for Ollama API
- `popup.ts` — Switched draft generation to use LLM generator pipeline

### MSE Quick Check UI
Collapsible pill-toggle checklist in the video notes panel for clinicians to tap MSE (Mental Status Exam) observations during session: appearance, behavior, speech, mood, affect, thought process/content, perceptions, cognition, insight, judgment. Auto-saves to session storage.

### Session End Auto-Detection
Detects when clinician leaves the video room (URL change from `/appt-{id}/room`) and auto-triggers SOAP generation via Ollama.

### C-SSRS Assessment Support
Added Columbia Suicide Severity Rating Scale alongside GAD-7/PHQ-9 — extract, score, store, auto-fetch from linked intake notes.

### Pronoun-Aware Clinical Narrative
Full `PronounForms` (subject/object/possessive/reflexive). Rewrites first-person client language to third-person clinical prose throughout generated notes.

### Manual Notes → Structured Extraction
Pattern-based functions mine clinician notes for themes (anxiety, anger, trauma, relationships, substances) and generate additional SOAP content from unstructured text.

### ICE Auto-Filler — Working Against Real DOM
`fill-note.ts` has been fully rewritten to map intake data to the exact **Initial Clinical Evaluation** (ICE) form fields. All 111 fields have been mapped by type:
- Date inputs (`#date-N`), short-answer (`#short-answer-N`)
- Multi-select checkboxes (`multi-select-N-M`), single-select radios (`single-select-N`)
- ProseMirror contenteditables (`aria-label="free-text-N"`), dropdowns (`#dropdown-N`)

### Fields Auto-Filled from Intake
- **Session info:** appointment start/end time (from `.start-end-time` header), "Patient" present checkbox
- **Chief complaint & HPI** → `free-text-6`, `free-text-7`
  `free-text-6` now builds a short narrative from name, age, ethnicity/race, gender, living situation, occupation, presenting concern, and counseling goals. `free-text-7` falls back to the raw presenting concern if HPI/presenting problems are empty.
- **Depression checkboxes** (multi-select-9) — mapped from PHQ-9 items when captured, keyword fallback
- **Anxiety checkboxes** (multi-select-10) — mapped from GAD-7 items when captured, keyword fallback
- **Additional symptom checklists** — broader keyword-based autofill now covers panic, PTSD, mania, psychosis, ADHD, self-injury, eating disorder behaviors, abuse, risk factors, and protective factors from DIPS intake text / `rawQA`
- **Abuse history** (multi-select-20), **risk factors** (multi-select-21)
- **Past psych history** radios (25-30): hospitalization, prior treatment, suicide attempts
- **Medications** → `free-text-31`, `free-text-34`
- **Substance use** → `single-select-35` + substance type checkboxes (multi-select-36)
- **Substance use details** → labeled "If yes, please specify" field when DIPS includes free-text substance details
- **Medical history** → `single-select-39`, plus allergies, developmental history, surgeries, trouble sleeping, and TBI/LOC are now filled by matching ICE field labels when present
- **Social history:** marital status, living, employment, education (radios/checkboxes 47-53), with employment history keywords also checking prior unemployment / work misconduct when stated in intake
- **Family history** radios (56-59) + notes → `free-text-60`
- **PHQ-9 score** → `free-text-90`, **GAD-7 score** → `free-text-91`
- **SI/HI dropdowns** (86, 87) with text-to-option mapping

### GAD-7 & PHQ-9 — Auto-Captured with Intake
"Capture Intake" now automatically discovers sibling intake-note URLs for the same client from visible links, embedded page HTML, a direct `/clients/<clientId>/intake_notes` fetch, and a background-tab fallback that opens the intake-notes index invisibly long enough for SimplePractice to render the live DOM. It then fetches those pages in the background, detects GAD-7 / PHQ-9 from the fetched page title, and parses the scoring tables. This no longer depends on the visible link text containing "PHQ" or "GAD", and it works with current SimplePractice client URLs that use non-numeric client IDs. It also preserves previously captured assessment data if auto-fetch misses. No separate clicks needed. Manual capture buttons still appear on individual assessment pages as fallback.

Assessment data structure: `AssessmentResult` with items (question, response, score/maxScore), total score, severity description, and functional difficulty.

For debugging, each successful "Capture Intake" run now logs a collapsed console group with the intake summary, full `intake` object, and full `rawQA` array.

### Storage Hardening for Assessment-Only Capture
The session storage layer now normalizes every `IntakeData` read/write against `EMPTY_INTAKE`. This fixes the fallback path where manually capturing only GAD-7 or PHQ-9 could create a partial intake object missing nested fields like `address`, which could then break the popup or note filler. Existing partial session data is repaired on read.

### Button Visibility Toggle
Both extensions have an eye icon (👁) in the popup header. Clicking it now uses explicit page visibility state instead of guessing from current DOM visibility, so hidden floating buttons can be reliably restored. The popup also queries current page state on open so the icon stays in sync with whether `.spn-floating-btn` / `.zsp-floating-btn` elements are visible. Uses `chrome.tabs.sendMessage` with `get-floating-buttons-visibility` and `toggle-floating-buttons`.

### Dev Hot-Reload
Both service workers poll their dist/ files every 1s. When a file size change is detected, `chrome.runtime.reload()` fires automatically. Controlled by `DEV_RELOAD = true` flag. Run `npm run watch` in each extension folder for full auto-rebuild + auto-reload.

## What's Been Built

### Chrome Extension — Complete & Building
- **Location:** `content/Inzinna/SimplePractice Notes/`
- **Dev:** `npm run watch` → auto-rebuilds. Service worker auto-reloads on change.
- **Build:** `npm run build` → loads from `dist/`
- **Load in Chrome:** `chrome://extensions` → Developer Mode → Load Unpacked → select `dist/`

### Clinical Knowledge Corpus — Extracted for Formulation / Treatment Planning
- **Source PDFs:** DBT, MI, CBT, psychoanalytic, PDM-3, and ASAM references provided locally in `~/Downloads`
- **Generator:** `scripts/extract-clinical-knowledge.py`
- **Run:** `npm run extract:clinical-knowledge`
- **Outputs:** `src/assets/clinical-knowledge/` and copied into `dist/assets/clinical-knowledge/`
- **Runtime helper:** `src/lib/clinical-knowledge.ts` loads the manifest, lightweight search index, and full resource JSON on demand
- **Guidance layer:** `src/lib/clinical-guidance.ts` now turns the corpus into formulation, goals, intervention, frequency, referral, and next-step suggestions
- **UI integration:** popup draft generation and the Diagnostics sidepanel now both use the guidance layer; the sidepanel has a new "Formulation + Plan Support" section backed by the extracted corpus
- **Current corpus shape:** 8 resource JSON files + `manifest.json` + lightweight `index.json`
- **Current limitation:** search/ranking is intentionally lightweight and still lets some front matter / index pages into results, especially in the largest books (ASAM, PDM-3)

### Files
| File | What It Does |
|------|-------------|
| `manifest.json` | Manifest V3, targets `*.simplepractice.com`, permissions for storage/alarms/sidePanel |
| `src/lib/types.ts` | `IntakeData` (30+ fields), `AssessmentResult`/`AssessmentItem` (GAD-7/PHQ-9/C-SSRS), `MseChecklist`, `ProviderPreferences`, `ProgressNote`, `NoteStatus` |
| `src/lib/storage.ts` | Session storage for PHI (1hr TTL), `mergeIntake()` for assessment data, MSE checklist CRUD, local storage for provider prefs |
| `src/lib/ollama-client.ts` | Ollama HTTP client — health check, model availability, text generation |
| `src/lib/soap-prompt.ts` | Builds system + user prompts from transcript, intake, diagnoses, treatment plan, MSE |
| `src/lib/soap-generator.ts` | SOAP generation orchestrator — LLM-first with regex fallback |
| `src/lib/diagnostic-engine.ts` | Intake-driven diagnostic scoring, criterion evaluation, and impression generation |
| `src/lib/note-draft.ts` | Async draft-note generator that now pulls knowledge-backed formulation / treatment guidance |
| `src/lib/clinical-knowledge.ts` | Corpus manifest/index loader plus lightweight search over bundled clinical references |
| `src/lib/clinical-guidance.ts` | Converts intake + diagnostic impressions into formulation, goals, interventions, referrals, and next-step guidance |
| `src/content/extract-intake.ts` | Parses DIPS intake Q&A, auto-fetches GAD-7/PHQ-9 from linked pages, injects capture buttons |
| `src/content/fill-note.ts` | Maps intake→ICE form (111 fields), PHQ-9→depression checkboxes, GAD-7→anxiety checkboxes, scores→free-text |
| `src/content/shared.ts` | DOM utilities: button injection, toasts, field filling, checkbox/radio/dropdown/ProseMirror helpers |
| `src/background/service-worker.ts` | PHI cleanup alarm, session storage config, message routing, dev hot-reload |
| `src/popup/popup.html` + `popup.ts` | Popup UI: intake summary, checklist, note preview, settings, button visibility toggle |
| `src/sidepanel/sidepanel.html` + `sidepanel.ts` | Diagnostics workspace with pinned diagnoses, criterion review, summary generation, and formulation / plan support |
| `scripts/extract-clinical-knowledge.py` | Local PDF→JSON extraction pipeline for bundled treatment/formulation references |

### Intake Fields Captured (mapped from DIPS form)
- **Demographics:** full name, DOB, sex, gender identity, phone, address (parsed), race, ethnicity
- **Emergency contact:** name, relationship, phone, address
- **Clinical:** chief complaint, counseling goals, prior treatment, medications, prescribing MD, PCP
- **Risk:** SI, suicide attempt history, HI, psychiatric hospitalization
- **Substance use:** alcohol, recreational drugs
- **Family/social:** family psych history, marital status, relationship, living arrangement, education, occupation
- **Trauma:** physical/sexual abuse history, domestic violence history
- **Checklists:** recent symptoms, additional symptoms, additional info
- **Assessments:** GAD-7 (items + score + severity), PHQ-9 (items + score + severity)
- **Metadata:** form title, form date, signature, raw Q&A array

## What's Next (from PLAN.md)

### Immediate Next Steps

#### D&TP (Diagnosis & Treatment Plan) Auto-Filler — READY TO BUILD
Full field map captured. URL pattern: `/clients/{id}/diagnosis_treatment_plans/{tpId}/edit`

**D&TP form field map:**
| Section | Field IDs | Fill from |
|---------|-----------|-----------|
| Clinical summary | `free-text-1` | Chief complaint narrative |
| Strengths | `multi-select-2` (13 items) | Intake protective factors |
| Barriers | `multi-select-3` (18 items) | Intake risk factors, substance use, etc. |
| Risk | `multi-select-4` (5 items: Suicide, Homicide, Assault, Other, No risk) | SI/HI from intake |
| Interventions | `multi-select-14` (58 therapy modalities) | Clinical guidance engine |
| Treatment goals | `multi-select-20` (8 items) | Presentation severity |
| Goal/Status combos | dynamic comboboxes (aria-label "Goal:", "Status:") | Counseling goals |
| ProseMirror `free-text-16` | **TBD — need visual label** | ? |
| ProseMirror `free-text-17` | **TBD — need visual label** | ? |
| `frequency` | text input | Clinical guidance |
| `diagnosisDescription` | text input | Diagnostic workspace |
| Diagnosis search | `spds-input-search-container-6-trigger-input` | Diagnostic workspace |
| Treatment type combo | aria-label "Treatment type:" | From session type |

**Page header scraping (no intake needed):**
- Client name from `h1.name` → `short-answer-3` equivalent
- DOB from `.item` span containing "DOB" → `short-answer-4` equivalent

**Helper scripts:** `scripts/dump-fields.js`, `scripts/dump-labels.js`, `scripts/dump-pm-context.js` for future DOM inspection.

#### Diagnostic Engine Bug — FIXED
PTSD criterion A was false-positive matching because:
1. `buildCombinedNarrative` joined question+answer text from rawQA — question prompts like "physical/sexual abuse" always matched `TRAUMA_PATTERN`
2. `getFieldValues` for rawQA returned question text as evidence
3. PTSD override didn't check for negative/empty answers before matching

**Fix (committed in `7abcedd`):**
- rawQA corpus now uses only answer text, not question+answer
- PTSD criterion A override requires affirmative trauma field answers
- Broader narrative match downgrades to "likely" instead of "met"

#### Other Pending
- **Test the full workflow end-to-end:** Capture Intake → navigate to ICE note → Fill from Intake
- **Test the new note-generation path live:** Capture Intake → Generate Draft → Open Diagnostics → Generate Summary / Write to Note Draft
- **Verify guidance quality on real intakes:** sanity-check whether the formulation / interventions match the intake and pinned diagnoses, especially with substance-use, trauma, and personality presentations
- **MSE, ROS, Assessment sections** (fields 64-111) need session observation data — these are Phase 4-6

### High-Leverage Next Thread Targets
- **Build `fillDTPFromIntake()` in `fill-note.ts`** — all field IDs mapped above, just need `free-text-16`/`free-text-17` labels
- **Tighten corpus retrieval quality:** remove more front matter/index hits from `clinical-knowledge` extraction and improve ranking in `clinical-guidance.ts`
- **Make source support more actionable:** add deep-linkable references or expandable excerpts in the sidepanel instead of preview-only cards
- **Add clinician controls:** allow accepting/rejecting suggested goals and interventions before writing them into the note draft
- **Broaden diagnostic / guidance coupling:** use pinned diagnosis selection to steer which modalities/resources are prioritized instead of only using broad symptom heuristics
- **Add tests for note generation:** the async `buildDraftNote()` path and clinical-guidance heuristics now need coverage so future changes do not silently regress note quality

### Phase 3: DSM-5 Diagnostic Impressions
- Local LLM (Ollama) maps intake data to DSM-5 criteria
- Ranked diagnosis list with evidence and rule-outs

### Phase 4: Session Audio Recording
- Fully local: `faster-whisper` / `whisper.cpp` for transcription
- `whisperX` / `pyannote-audio` for speaker diarization

### Phase 5: Live Diagnostic Interview Interface
- Chrome side panel with scrollable DSM-5 criteria checklist
- Real-time auto-checking from patient statements

### Phase 6: Post-Session Report & Auto-Fill
- Compiles all data into structured note
- One-click "Submit to SimplePractice"

## Key Decisions
- **Standalone extension** (separate from ZocDoc-to-SP)
- **Fully local processing** — no PHI leaves the device
- **Purple (#7c3aed) brand color** for this extension (vs blue #2563eb for ZocDoc-to-SP)
- **DEV_RELOAD = true** in service workers for auto-reload during development

## Architecture
```
Chrome Extension (Manifest V3)
├── Content Scripts (on simplepractice.com)
│   ├── extract-intake.ts → "Capture Intake" button
│   │   Parses DIPS Q&A + auto-fetches GAD-7/PHQ-9
│   └── fill-note.ts → "Fill from Intake" button
│       Maps intake→ICE form fields (111 fields)
├── Background Service Worker
│   └── PHI cleanup (1hr TTL), message routing, dev hot-reload
├── Popup
│   └── Intake summary, manual notes, draft generation, settings, button toggle
├── Side Panel
│   └── Diagnostic checklist review + formulation / treatment-plan support
└── (Future) Real-Time Session Layer
    └── Live diagnostic interview UI fed by transcript / diarization

Local Server (localhost)
├── Ollama (llama3.1:8b) — SOAP note generation, criteria matching
├── faster-whisper (transcription — future)
└── whisperX (speaker diarization — future)
```
