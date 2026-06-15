# SP Client Reach

Chrome extension for Inzinna. One click pulls two SimplePractice reports for a date range, merges them into one list per client (where they meet + how to reach them), then:

- downloads a rater8-ready CSV
- pushes the full list to the leadership Google Sheet, one tab per period

No servers. Client data never leaves the browser tab except the rows you send to your own Google Sheet.

## How it works

1. Click the extension icon. A page opens.
2. Pick a period (Last 30 days, This month, custom...).
3. Click "Pull from SimplePractice". The extension fetches both reports with your logged-in session:
   - Client attendance (who was seen, where: Manhattan vs Video Office) — CSV
   - Client details (phone + email for all active clients) — JSON, which also carries each client's id (for deep links) and, for minors, the parent/guardian contact
4. It merges them: each client gets a location (Manhattan / Virtual, based on their most recent attended appointment), last visit date, provider, phone, and email. Couples are split into individual people. Name quirks (nicknames in quotes, middle names) are matched automatically; anyone it can't find is flagged red instead of silently dropped.
5. Buttons: download the rater8 CSV, download the full CSV, send to the Google Sheet, or copy all emails / phone numbers for the current filter (e.g. just Manhattan clients).

### Clickable client names (deep links)

When pulled live from SimplePractice, each client name in the results table links straight to that client's SP overview page (`/clients/<id>/overview`), opening in a new tab. Manually dropped CSVs don't carry the id, so those names are plain text.

### Minors and guardians

Minors usually have no phone or email of their own in SimplePractice; the contact lives on the parent/guardian. The details JSON exposes that guardian contact (`contactName` / `contactPhone` / `contactEmail`). When a client's own phone and email are both blank, the merge falls back to the guardian's contact, notes `parent: <name>` on that row, and uses the guardian's phone/email in the rater8 feed so the parent receives the review request. The stats line shows how many people were reached this way ("N via guardian"). This only works on the live JSON pull, not the manual CSV drag.

## Install (load unpacked)

1. `npm install && npm run build` (already done if `dist/` exists)
2. Chrome > `chrome://extensions` > Developer mode ON > "Load unpacked" > pick the `dist/` folder.

## One-time Google Sheet setup (5 min)

1. Open the leadership Google Sheet (see apps-script/Code.gs header, or create one).
2. Extensions > Apps Script. Paste the contents of `apps-script/Code.gs`.
3. Deploy > New deployment > Web app. Execute as **Me**, access **Anyone with the link**. Deploy and authorize.
4. Copy the Web app URL into the extension settings (gear icon on the extension page). The shared token already matches.

Each "Send to Google Sheet" creates (or refreshes) a tab named after the period, e.g. `2026-05-11 to 2026-06-11`.

## rater8 CSV columns

`First Name, Last Name, Email, Cell Phone, Provider, Location, Appointment Date, Appointment Status`

One row **per attended visit** (rater8's appointment-level model), not one per person. A client seen 5 times in the period gets 5 rows. Only attended ("Show") appointments where the person has a phone or email are included, so Appointment Status is always "Show" (rater8 accepts either a status column or a report pre-filtered to seen patients; this gives both).

Fields rater8 also asks for but SimplePractice does NOT export in these two reports: secondary phone, provider ID, location ID, appointment ID, appointment type. The names are the required fields and are present. To change columns, edit `RATER8_HEADER` and the `rater8.push([...])` block in `mergeReports` (`src/lib/merge.ts`).

## Troubleshooting

- "SimplePractice wants you to log in": log into the SP tab that opened, then press the pull button again.
- A client shows "not_found": they had an appointment in the period but are not in the Active client details export (usually archived/discharged). Look them up manually in SP.
- Sheet push fails with "bad token": the token in the extension settings must match `TOKEN` in the deployed Apps Script.

## Tests

`npm test` runs the merge engine against the real exports in `~/Downloads` (skips if absent) and checks counts against the validated reference run.
