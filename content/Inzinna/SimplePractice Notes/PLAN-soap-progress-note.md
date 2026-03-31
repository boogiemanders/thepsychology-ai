# SOAP Progress Note (90837) — Implementation Plan

## Overview

Add a SOAP progress note workflow for psychotherapy follow-up sessions (CPT 90837). The clinician takes notes during a video session, then after the session generates an editable SOAP draft that auto-fills SimplePractice's progress note template.

## Target Form (SimplePractice "Progress note" tab)

| Section | Selector | Content |
|---------|----------|---------|
| **S** — Subjective Complaint | `[aria-label="free-text-1"]` | Client's self-report, presenting concerns, mood since last session |
| **O** — Objective Findings | `[aria-label="free-text-2"]` | MSE observations, affect, behavior, assessment scores |
| **A** — Assessment of Progress | `[aria-label="free-text-3"]` | Progress toward treatment plan goals, diagnostic status |
| **P** — Plans for Next Session | `[aria-label="free-text-4"]` | Next session interventions, homework, referrals |

URL pattern: `https://secure.simplepractice.com/appointments/{appointmentId}`
Container class: `progress-individual-note-container`

All 4 fields are ProseMirror `contenteditable` divs (same as intake note fields — existing `fillProseMirrorField()` works).

---

## Data Sources

### 1. Session Notes (manual, during video call)
- **Already exists**: Floating note panel in video room (`injectVideoNotePanel` in fill-note.ts)
- **Storage**: `spn_session_notes` in `chrome.storage.session` (keyed by apptId)
- **Enhancement needed**: The popup's "Clinician Notes" textarea should also work as a session notes input (not just intake augmentation)

### 2. Live Transcript / Captions (auto, during video call)
- **Status**: SimplePractice video room HAS captions but we haven't mapped the DOM elements yet
- **Video domain**: `video.simplepractice.com` (separate from `secure.simplepractice.com`)
- **TODO — NEXT LIVE SESSION**: Run caption DOM dump during an active video call to identify caption elements, then implement caption capture
- **Fallback**: Web Speech API as alternative if SP captions aren't accessible
- **Storage**: New `spn_transcript` key in `chrome.storage.session`

### 3. Treatment Plan (fetched from SimplePractice)
- **URL pattern**: `/clients/{clientId}/diagnosis_treatment_plans/{planId}`
- **Content is static HTML** (not form fields) — scrape via DOM walking between headings
- **Structure** (confirmed from live dump):
  ```
  Treatment Plan
  ├── Diagnoses: F12.9, F10.9, F39 (ICD-10 codes)
  ├── Presenting problem: narrative text
  ├── Client strengths: list
  ├── Client risks: list
  ├── Goals & Objectives
  │   ├── Goal 1 + Objective 1A, 1B (with completion dates, status)
  │   └── Goal 2 + Objective 2A, 2B
  ├── Interventions: ACT, DBT, etc.
  ├── Treatment approach: type, length
  └── Medical necessity: frequency, last review date
  ```
- **Fetch strategy**: Background script fetches the page HTML (same-origin cookies), parses it, stores as `TreatmentPlan` in `chrome.storage.session`

### 4. Intake Data (already captured)
- Diagnoses, history, risk factors from the initial intake
- Stored in `spn_intake` in `chrome.storage.session`

---

## New Types (`src/lib/types.ts`)

```typescript
// ── Treatment Plan (scraped from SimplePractice) ──

export interface TreatmentPlanGoal {
  number: number
  goal: string
  estimatedCompletion: string
  status: string // e.g. "No improvement", "Some improvement", "Significant improvement"
  objectives: {
    id: string // "1A", "1B", etc.
    objective: string
    estimatedCompletion: string
  }[]
}

export interface TreatmentPlan {
  clientId: string
  diagnoses: { code: string; name: string }[]
  presentingProblem: string
  clientStrengths: string[]
  clientRisks: string[]
  goals: TreatmentPlanGoal[]
  interventions: string[]
  treatmentApproach: string
  treatmentLength: string
  frequency: string
  medicalNecessity: string
  capturedAt: string
}

// ── SOAP Note Draft ──

export interface SoapDraft {
  apptId: string
  clientName: string
  sessionDate: string
  cptCode: string // "90837"

  subjective: string   // S — client self-report
  objective: string    // O — clinician observations / MSE
  assessment: string   // A — progress toward goals
  plan: string         // P — next session plans

  // Source data references
  sessionNotes: string
  transcript: string
  treatmentPlanId: string

  generatedAt: string
  editedAt: string
  status: 'draft' | 'reviewed' | 'submitted'
}

// ── Session Transcript ──

export interface TranscriptEntry {
  speaker: 'clinician' | 'client' | 'unknown'
  text: string
  timestamp: string
}

export interface SessionTranscript {
  apptId: string
  entries: TranscriptEntry[]
  updatedAt: string
}
```

---

## Implementation Steps

### Step 1: Types & Storage (types.ts, storage.ts)

**types.ts** — Add `TreatmentPlan`, `SoapDraft`, `SessionTranscript`, `TranscriptEntry` interfaces and empty defaults.

**storage.ts** — Add CRUD functions:
- `saveTreatmentPlan()` / `getTreatmentPlan()` / `clearTreatmentPlan()`
- `saveSoapDraft()` / `getSoapDraft()` / `clearSoapDraft()`
- `saveTranscript()` / `getTranscript()` / `appendTranscriptEntry()`

Storage keys: `spn_treatment_plan`, `spn_soap_draft`, `spn_transcript`

### Step 2: Treatment Plan Scraper (new file: `src/lib/treatment-plan-scraper.ts`)

~80 lines. Functions:
- `parseTreatmentPlanHTML(html: string): TreatmentPlan` — Parse the static HTML by walking between H3/H4 headings
- `fetchTreatmentPlan(clientId: string): Promise<TreatmentPlan | null>` — Background script fetches `/clients/{clientId}/diagnosis_treatment_plans/*` page, calls parser

Discovery: First fetch `/clients/{clientId}/diagnosis_treatment_plans` (list page) to find the active plan ID, then fetch the detail page.

### Step 3: SOAP Draft Builder (new file: `src/lib/soap-builder.ts`)

~150 lines. Main function:
```typescript
export function buildSoapDraft(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlan | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  prefs: ProviderPreferences
): SoapDraft
```

**S — Subjective**:
- Primary source: session notes (clinician's typed notes during session)
- Secondary: transcript excerpts tagged as client speech
- Format: "Client reports [chief concern]. [Session-specific complaints]. [Mood/symptom changes since last session]."

**O — Objective**:
- MSE observations from session notes (appearance, affect, speech, behavior)
- Any new assessment scores (PHQ-9, GAD-7 if re-administered)
- Default template if no observations: "Client presented as [appearance]. Affect was [affect]. Speech was [speech]. Thought process was [thought process]."

**A — Assessment**:
- Reference treatment plan goals and rate progress
- Diagnostic status (from intake impressions)
- Clinical formulation update
- Format per goal: "Goal 1 ([goal text]): [progress status]. [Evidence from session]."

**P — Plan**:
- Next session focus areas (from treatment plan objectives)
- Homework/skills practice assigned
- Any referrals or medication changes
- Next appointment frequency

### Step 4: SOAP Panel in Side Panel (`src/sidepanel/sidepanel.ts`)

Add a new tab/section to the existing side panel for SOAP note editing.

**UI additions**:
- "SOAP Draft" tab alongside existing "Diagnostics" tab
- 4 editable text areas (S, O, A, P) pre-filled from `buildSoapDraft()`
- "Treatment Plan" reference panel (read-only, shows goals/objectives)
- "Session Notes" reference panel (shows captured notes)
- "Regenerate" button to rebuild draft
- "Fill Note" button to push SOAP into SimplePractice form

### Step 5: Fill SOAP Note (`src/content/fill-note.ts`)

Add to existing fill-note.ts:
- `fillSoapNote(draft: SoapDraft): Promise<void>` — Fills the 4 ProseMirror fields
- `detectSoapForm(): boolean` — Checks if current page has the SOAP template (looks for the "Progress note" tab being active + free-text-1 through free-text-4)
- `injectFillSoapButton()` — Adds "Fill SOAP from Notes" button on appointment pages
- URL detection: `/appointments/{id}` pattern

### Step 6: Popup Enhancement (`src/popup/popup.ts`, `popup.html`)

- When on an appointment page (not intake), show "Session Notes" mode instead of intake mode
- The "Clinician Notes" textarea becomes the primary session notes input
- Add "Fetch Treatment Plan" button that triggers background fetch
- Add "Generate SOAP Draft" button
- Show treatment plan summary (diagnoses, goals) as reference

### Step 7: Background Script Updates (`src/background/service-worker.ts`)

- Handle `fetchTreatmentPlan` message from popup/content scripts
- Handle `generateSoapDraft` message
- Relay SOAP draft to content script for filling

### Step 8: Manifest Updates

- Add `video.simplepractice.com` to `host_permissions` (for future caption capture)
- No new permissions needed for treatment plan fetch (same origin)

---

## TODO — Next Live Session

- [ ] Run caption DOM dump during active video call
- [ ] Map caption element selectors
- [ ] Implement caption capture (DOM observer or Web Speech API fallback)
- [ ] Store transcript entries with speaker labels
- [ ] Test transcript → SOAP Subjective section integration

---

## File Change Summary

| File | Change | Lines (est.) |
|------|--------|-------------|
| `src/lib/types.ts` | Add TreatmentPlan, SoapDraft, SessionTranscript types | +60 |
| `src/lib/storage.ts` | Add CRUD for treatment plan, SOAP draft, transcript | +60 |
| `src/lib/treatment-plan-scraper.ts` | **NEW** — Parse treatment plan HTML | ~80 |
| `src/lib/soap-builder.ts` | **NEW** — Generate SOAP draft from all data sources | ~150 |
| `src/content/fill-note.ts` | Add fillSoapNote(), detectSoapForm(), injectFillSoapButton() | +80 |
| `src/sidepanel/sidepanel.ts` | Add SOAP draft tab with editable fields + treatment plan reference | +200 |
| `src/popup/popup.ts` + `popup.html` | Session notes mode, treatment plan fetch, SOAP generation | +100 |
| `src/background/service-worker.ts` | Message handlers for treatment plan fetch, SOAP generation | +40 |
| `manifest.json` | Add video.simplepractice.com to host_permissions | +1 |
| **Total** | | **~770 lines** |

---

## Acceptance Criteria

1. On `/appointments/{id}`, a "Fill SOAP" button appears
2. Clinician can type session notes in popup or video panel
3. Treatment plan is fetchable and displayed as reference
4. SOAP draft is generated from session notes + treatment plan + intake data
5. Each SOAP section is editable before filling
6. "Fill Note" pushes final content into the 4 ProseMirror fields
7. Caption/transcript integration deferred to next live session
