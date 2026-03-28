# SimplePractice Notes — Session Handoff

## What This Is
A standalone Chrome extension (Manifest V3) for Inzinna's clinical workflow. It extracts patient intake data from SimplePractice, and will eventually generate DSM-5 diagnostic impressions, record session audio, and auto-fill progress notes back into SimplePractice.

## What's Been Built (Phase 1 & 2)

### Chrome Extension — Complete & Building
- **Location:** `content/Inzinna/SimplePractice Notes/`
- **Build:** `cd` into the folder, `npm install`, `npm run build` → loads from `dist/`
- **Load in Chrome:** `chrome://extensions` → Developer Mode → Load Unpacked → select `dist/`

### Files Created
| File | What It Does |
|------|-------------|
| `manifest.json` | Manifest V3, targets `*.simplepractice.com`, permissions for storage/alarms/sidePanel |
| `src/lib/types.ts` | `IntakeData` (22 clinical fields), `ProgressNote` (structured sections: CC, MSE, Dx, Tx plan), `NoteStatus` |
| `src/lib/storage.ts` | Session storage for PHI (auto-cleanup TTL), local storage for provider prefs |
| `src/content/extract-intake.ts` | Injects "Capture Intake" button on SP client pages. Extracts demographics, insurance, chief complaint, presenting problems, HPI, psychiatric history, medications, medical/family/social/substance history, SI/HI |
| `src/content/fill-note.ts` | Injects "Fill Note" button on SP note pages. Fills individual fields by label, or falls back to full note body in contenteditable/textarea |
| `src/content/shared.ts` | DOM utilities: button injection, toasts, field filling (native setter + event dispatch for Ember.js), label-based field finding |
| `src/background/service-worker.ts` | PHI cleanup alarm (1hr TTL), session storage config, message routing |
| `src/popup/popup.html` | Popup UI: intake field summary, 4-step checklist, note preview, provider settings |
| `src/popup/popup.ts` | Popup logic: renders captured intake fields, status checklist, settings form |
| `build.mjs` | esbuild config matching the ZocDoc-to-SP extension pattern |

### Extension Icons Updated
- **SimplePractice Notes** → blue background brain logo
- **ZocDoc to SimplePractice** → split blue/dark brain logo
- All sizes (16, 48, 128px) in both `src/assets/icons/` and `dist/assets/icons/`

## What's Planned Next (from PLAN.md)

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

## Key Decisions Made
- **Standalone extension** (separate from ZocDoc-to-SP)
- **Fully local processing** — no PHI leaves the device
- **Speaker diarization required** — only patient voice triggers criteria auto-checks
- **Purple (#7c3aed) brand color** for this extension (vs blue #2563eb for ZocDoc-to-SP)

## Architecture Reference
```
Chrome Extension (Manifest V3)
├── Content Scripts (on simplepractice.com)
│   ├── extract-intake.ts → "Capture Intake" button
│   └── fill-note.ts → "Fill Note" button
├── Background Service Worker
│   └── PHI cleanup, message routing
├── Popup
│   └── Status tracking, intake preview, settings
└── (Future) Side Panel
    └── Live diagnostic interview UI

Local Server (Future — localhost)
├── faster-whisper (transcription)
├── whisperX (speaker diarization)
└── Ollama + local LLM (criteria matching, note generation)
```

## Existing Extension Reference
The ZocDoc-to-SP extension at `content/Inzinna/zocdoc-to-simplepractice/` has the same architecture and was used as the template. Key patterns carried over:
- Session storage with TTL for PHI
- Ember.js-aware field filling (native setter + event dispatch)
- Label-based DOM traversal for form fields
- Floating button injection with toast notifications
