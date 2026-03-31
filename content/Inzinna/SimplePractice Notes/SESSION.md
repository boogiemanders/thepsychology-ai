# SimplePractice Notes — Session Handoff

> Last updated: 2026-03-30

## What This Is
A standalone Chrome extension (Manifest V3) for Inzinna's clinical workflow. It extracts patient intake data from SimplePractice, and will eventually generate DSM-5 diagnostic impressions, record session audio, and auto-fill progress notes back into SimplePractice.

## Where We Left Off

### ICE Auto-Filler — Working Against Real DOM
`fill-note.ts` has been fully rewritten to map intake data to the exact **Initial Clinical Evaluation** (ICE) form fields. All 111 fields have been mapped by type:
- Date inputs (`#date-N`), short-answer (`#short-answer-N`)
- Multi-select checkboxes (`multi-select-N-M`), single-select radios (`single-select-N`)
- ProseMirror contenteditables (`aria-label="free-text-N"`), dropdowns (`#dropdown-N`)

### Fields Auto-Filled from Intake
- **Session info:** appointment start/end time (from `.start-end-time` header), "Patient" present checkbox
- **Chief complaint & HPI** → `free-text-6`, `free-text-7`
- **Depression checkboxes** (multi-select-9) — mapped from PHQ-9 items when captured, keyword fallback
- **Anxiety checkboxes** (multi-select-10) — mapped from GAD-7 items when captured, keyword fallback
- **Abuse history** (multi-select-20), **risk factors** (multi-select-21)
- **Past psych history** radios (25-30): hospitalization, prior treatment, suicide attempts
- **Medications** → `free-text-31`, `free-text-34`
- **Substance use** → `single-select-35` + substance type checkboxes (multi-select-36)
- **Medical history** → `single-select-39`
- **Social history:** marital status, living, employment, education (radios/checkboxes 47-53)
- **Family history** radios (56-59) + notes → `free-text-60`
- **PHQ-9 score** → `free-text-90`, **GAD-7 score** → `free-text-91`
- **SI/HI dropdowns** (86, 87) with text-to-option mapping

### GAD-7 & PHQ-9 — Auto-Captured with Intake
"Capture Intake" now automatically finds GAD-7/PHQ-9 links (`a[href*="/intake_notes/"]`) on the intake page, fetches those pages in the background, and parses the scoring tables. No separate clicks needed. Manual capture buttons still appear on individual assessment pages as fallback.

Assessment data structure: `AssessmentResult` with items (question, response, score/maxScore), total score, severity description, and functional difficulty.

### Button Visibility Toggle
Both extensions have an eye icon (👁) in the popup header. Clicking it sends a `toggle-floating-buttons` message to the content script, which hides/shows all `.spn-floating-btn` and `.zsp-floating-btn` elements. Icon changes to 🚫 when hidden. Uses `chrome.tabs.sendMessage` with `return true` for async response.

### Dev Hot-Reload
Both service workers poll their dist/ files every 1s. When a file size change is detected, `chrome.runtime.reload()` fires automatically. Controlled by `DEV_RELOAD = true` flag. Run `npm run watch` in each extension folder for full auto-rebuild + auto-reload.

## What's Been Built

### Chrome Extension — Complete & Building
- **Location:** `content/Inzinna/SimplePractice Notes/`
- **Dev:** `npm run watch` → auto-rebuilds. Service worker auto-reloads on change.
- **Build:** `npm run build` → loads from `dist/`
- **Load in Chrome:** `chrome://extensions` → Developer Mode → Load Unpacked → select `dist/`

### Files
| File | What It Does |
|------|-------------|
| `manifest.json` | Manifest V3, targets `*.simplepractice.com`, permissions for storage/alarms/sidePanel |
| `src/lib/types.ts` | `IntakeData` (30+ fields), `AssessmentResult`/`AssessmentItem` (GAD-7/PHQ-9), `ProgressNote`, `NoteStatus` |
| `src/lib/storage.ts` | Session storage for PHI (1hr TTL), `mergeIntake()` for assessment data, local storage for provider prefs |
| `src/content/extract-intake.ts` | Parses DIPS intake Q&A, auto-fetches GAD-7/PHQ-9 from linked pages, injects capture buttons |
| `src/content/fill-note.ts` | Maps intake→ICE form (111 fields), PHQ-9→depression checkboxes, GAD-7→anxiety checkboxes, scores→free-text |
| `src/content/shared.ts` | DOM utilities: button injection, toasts, field filling, checkbox/radio/dropdown/ProseMirror helpers |
| `src/background/service-worker.ts` | PHI cleanup alarm, session storage config, message routing, dev hot-reload |
| `src/popup/popup.html` + `popup.ts` | Popup UI: intake summary, checklist, note preview, settings, button visibility toggle |

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
- **Test the full workflow end-to-end:** Capture Intake → navigate to ICE note → Fill from Intake
- **MSE, ROS, Assessment sections** (fields 64-111) need session observation data — these are Phase 4-6

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
│   └── Intake summary, checklist, settings, button toggle
└── (Future) Side Panel
    └── Live diagnostic interview UI

Local Server (Future — localhost)
├── faster-whisper (transcription)
├── whisperX (speaker diarization)
└── Ollama + local LLM (criteria matching, note generation)
```
