# SimplePractice Notes — Session Handoff

> Last updated: 2026-03-28

## What This Is
A standalone Chrome extension (Manifest V3) for Inzinna's clinical workflow. It extracts patient intake data from SimplePractice, and will eventually generate DSM-5 diagnostic impressions, record session audio, and auto-fill progress notes back into SimplePractice.

## Where We Left Off

### Intake Extractor — Done & Tested Against Real DOM
The intake extractor has been rewritten to match **SimplePractice's actual DIPS Intake Form** DOM structure. The form renders as Q&A inside `.markdown.intake-answers`:
```html
<h3>Question text</h3>
<p>Answer line 1</p>
<p>Answer line 2</p>
<!-- or -->
<ul><li>Answer</li></ul>
```

The extractor parses all `h3` → following `p`/`ul` pairs and maps them to 30+ structured fields. It also preserves the full raw Q&A array (`rawQA`) so nothing is lost even if a question doesn't match a known field.

### Progress Note Auto-Filler — Built, Not Yet Tested
`fill-note.ts` is ready to fill SP note forms but hasn't been tested against real SP note editing pages yet. It tries label-based field matching first, then falls back to filling a single contenteditable/textarea body.

**Next step:** Need to inspect the actual DOM of SP's progress note editor (similar to how we got the DIPS intake form DOM) to tune the selectors.

## What's Been Built

### Chrome Extension — Complete & Building
- **Location:** `content/Inzinna/SimplePractice Notes/`
- **Build:** `cd` into the folder, `npm install`, `npm run build` → loads from `dist/`
- **Load in Chrome:** `chrome://extensions` → Developer Mode → Load Unpacked → select `dist/`

### Files
| File | What It Does |
|------|-------------|
| `manifest.json` | Manifest V3, targets `*.simplepractice.com`, permissions for storage/alarms/sidePanel |
| `src/lib/types.ts` | `IntakeData` (30+ fields mapped to DIPS form), `ProgressNote` (CC, MSE, Dx, Tx plan), `NoteStatus`, raw Q&A preservation |
| `src/lib/storage.ts` | Session storage for PHI (auto-cleanup 1hr TTL), local storage for provider prefs |
| `src/content/extract-intake.ts` | Parses `.markdown.intake-answers` h3/p/ul Q&A pairs. Maps to demographics, clinical, risk, substance, family/social, trauma fields. Injects "Capture Intake" button. |
| `src/content/fill-note.ts` | Injects "Fill Note" button on SP note pages. Fills individual fields by label, or falls back to full note body. |
| `src/content/shared.ts` | DOM utilities: button injection, toasts, field filling (native setter + event dispatch for Ember.js), label-based field finding |
| `src/background/service-worker.ts` | PHI cleanup alarm (1hr TTL), session storage config, message routing |
| `src/popup/popup.html` + `popup.ts` | Popup UI: 30+ intake field summary, 4-step checklist, note preview, provider settings |
| `build.mjs` | esbuild config matching the ZocDoc-to-SP extension pattern |
| `PLAN.md` | Full project plan with all 6 phases |

### Intake Fields Captured (mapped from DIPS form)
- **Demographics:** full name, DOB, sex, gender identity, phone, address (parsed), race, ethnicity
- **Emergency contact:** name, relationship, phone, address
- **Clinical:** chief complaint, counseling goals, prior treatment, medications, prescribing MD, PCP
- **Risk:** SI, suicide attempt history, HI, psychiatric hospitalization
- **Substance use:** alcohol, recreational drugs
- **Family/social:** family psych history, marital status, relationship, living arrangement, education, occupation
- **Trauma:** physical/sexual abuse history, domestic violence history
- **Checklists:** recent symptoms, additional symptoms, additional info
- **Metadata:** form title, form date, signature, raw Q&A array

### Extension Icons
- **SimplePractice Notes** → blue background brain logo (purple #7c3aed brand)
- **ZocDoc to SimplePractice** → split blue/dark brain logo

## What's Next (from PLAN.md)

### Immediate Next Step
**Get the SP progress note editor DOM** — paste the HTML from a note editing page so we can tune `fill-note.ts` selectors, just like we did for the intake form.

### Phase 3: DSM-5 Diagnostic Impressions
- Local LLM (Ollama) maps intake data to DSM-5 criteria
- Ranked diagnosis list with evidence and rule-outs
- Uses existing DSM-5 content from `staging/review/psychprep/5 Assessment/`

### Phase 4: Session Audio Recording
- Fully local: `faster-whisper` / `whisper.cpp` for transcription
- `whisperX` / `pyannote-audio` for speaker diarization (clinician vs patient)
- Local server on `localhost` that the extension calls

### Phase 5: Live Diagnostic Interview Interface
- Chrome side panel with scrollable DSM-5 criteria checklist
- Real-time auto-checking of criteria (YES/NO/UNCLEAR) based on patient statements
- Suggested follow-up questions for unclear criteria
- Supporting quotes displayed under each criterion

### Phase 6: Post-Session Report & Auto-Fill
- Compiles all data into structured note: demographics → chief complaint → presenting complaint → diagnostic impressions → formulation → treatment plan
- Clinician reviews/edits inline
- One-click "Submit to SimplePractice" auto-fills SP forms

## Key Decisions
- **Standalone extension** (separate from ZocDoc-to-SP)
- **Fully local processing** — no PHI leaves the device
- **Speaker diarization required** — only patient voice triggers criteria auto-checks
- **Purple (#7c3aed) brand color** for this extension (vs blue #2563eb for ZocDoc-to-SP)

## Architecture
```
Chrome Extension (Manifest V3)
├── Content Scripts (on simplepractice.com)
│   ├── extract-intake.ts → "Capture Intake" button
│   │   Parses .markdown.intake-answers h3/p/ul Q&A pairs
│   └── fill-note.ts → "Fill Note" button
│       Fills note fields by label or contenteditable body
├── Background Service Worker
│   └── PHI cleanup (1hr TTL), session storage, message routing
├── Popup
│   └── Intake field summary, 4-step checklist, settings
└── (Future) Side Panel
    └── Live diagnostic interview UI

Local Server (Future — localhost)
├── faster-whisper (transcription)
├── whisperX (speaker diarization)
└── Ollama + local LLM (criteria matching, note generation)
```
