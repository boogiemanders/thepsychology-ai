# Session Prompt: ZocDoc to SimplePractice Chrome Extension

Paste this to continue working:

---

## Pilot: P02 (first real-portal user)

Per the Inzinna clinician survey (April 2026, n=7), **P02's #1 priority is VOB automation**, #2 is simplified billing, #3 is localizing information. This extension hits priorities 1 and 2 directly. P02 is the designated first pilot once real-portal QA lands.

**P02 profile:** LSW, humanistic/person-centered, 18 client hrs/wk, 2 hrs documentation/wk, 0–1 hr supervision. High Likert fit scores (5/5 workflow fit, 5/5 comfortable with feedback). Primary barriers: accuracy skepticism, technical friction, workflow integration uncertainty. No privacy dealbreakers.

**Pre-pilot config for P02 (set in popup settings):**
- Provider name: P02's actual name from SP
- Locations: whichever of Video Office (39003359), New Rochelle (40833537), Manhattan (41119532) apply to his caseload
- CPT codes: his usual intake + follow-up codes (confirm during onboarding)
- VOB recipients: his VOB workflow inbox
- VOB signature block: his standard template

**VOB-specific QA checklist (before sending him to test):**
- [ ] Gmail compose URL opens with correct recipient(s) pre-filled
- [ ] Subject line format correct (abbreviated name + date + time)
- [ ] Body uses abbreviated name (not full name)
- [ ] Appointment date/time rendered in local TZ
- [ ] Signature block matches his configured template
- [ ] Draft vs. send behavior is draft-only (clinician reviews before sending)
- [ ] Works for both new-patient VOB and re-verification VOB flows

**Outreach:** adapt `content/Inzinna/Clinician Survey/pilot-outreach-P07-P08.md` with VOB-first framing for P02.

---

Let's continue working on the ZocDoc to SimplePractice Chrome extension at `content/Inzinna/zocdoc-to-simplepractice/`. The design spec is at `docs/superpowers/specs/2026-03-26-zocdoc-simplepractice-extension-design.md`.

## Architecture

Chrome Extension (Manifest V3), no backend. All data in `chrome.storage.local`. Two content scripts (ZocDoc capture + SimplePractice fill), popup with settings, background service worker for PHI auto-cleanup.

## Key files

- `src/content/zocdoc.ts` — scrapes patient data from ZocDoc provider portal
- `src/content/simplepractice.ts` — fills SP forms (demographics, insurance, appointments)
- `src/content/shared.ts` — fillField, injectButton, imageToBase64 utilities
- `src/popup/popup.ts` + `popup.html` — popup UI with settings panel
- `src/lib/types.ts` — CapturedClient + ProviderPreferences interfaces
- `src/lib/storage.ts` — chrome.storage.local wrapper
- `src/lib/vob-email.ts` — Gmail compose URL builder
- `build.mjs` — esbuild bundler, output to `dist/`

## SP uses Ember.js (not React)

SimplePractice is an Ember app. Key DOM patterns:
- Native `<select>` for clinician, office, CPT code, DOB parts
- Ember select-box (`.select-box__selected-option.typeahead-trigger`) for "Referred by"
- Ember power-select for payer typeahead
- `button.add-row-button` to reveal email/phone inputs
- `.spds-input-dropdown-list-trigger` for status dropdown

## Real SP selectors confirmed

- Office: `select#new-client-office[name="office"]` — options: Video Office (39003359), New Rochelle (40833537), Manhattan (41119532)
- Referred by: `.select-box__selected-option.typeahead-trigger` with `span.placeholder` "Select" — option text is "Zoc Doc"
- Insurance card download on ZocDoc: `button[data-test="download-button"]`

## What's been built

1. ZocDoc capture (name, DOB, phone, email, address, appointment, insurance cards)
2. SP client demographics fill (name, DOB, email, phone, billing type, status, clinician, office, referred by, reminders)
3. SP insurance fill (payer typeahead, member ID, group #, subscriber, copay, card image upload)
4. SP appointment fill (client search, date, time, office, CPT code, recurring toggle, notes)
5. VOB email (Gmail compose with abbreviated name, date, time)
6. Popup with settings (provider name, location dropdown, CPT codes, VOB recipients/signature)
7. PHI auto-cleanup (24h TTL + hourly alarm)

## What to test/fix next

- Load extension in Chrome (`chrome://extensions` > Load unpacked > point to `dist/`)
- Test on real ZocDoc provider portal — verify capture scrapes all fields
- Test on real SP new client form — verify each field fills correctly
- Verify insurance card images capture (download button fallback)
- Test payer typeahead (may need real payer names to verify matching)
- Test recurring appointment toggle + follow-up CPT code
- Map any missing SP selectors from real DOM inspection
- Build: `cd content/Inzinna/zocdoc-to-simplepractice && node build.mjs`
