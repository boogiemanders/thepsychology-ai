# rater8 Auto-Upload — Design

Date: 2026-07-01. Approved by founder in brainstorm session.

## Goal

The SP Client Reach Chrome extension (`content/Inzinna/sp-client-reach`) already builds the daily rater8 CSV from two SimplePractice reports. The founder currently downloads it and uploads it by hand at rave.rater8.com every day. This feature makes the extension do the upload itself, daily, with catch-up for missed days and Slack alerts. Practice went live on rater8 2026-07-01.

## Decisions made with the founder

- Automation lives in the existing extension (approach A). No new server, PHI stays in the founder's browser and sessions.
- Daily scope is rater8 upload only. Leadership Sheet push and full CSV stay manual.
- SP signs the founder out between uses (they sign in a few times a week), so a fixed-time run would usually find no session. Trigger is therefore hybrid: ride-along runs whenever a signed-in SP page loads, plus a 7:00 AM try-then-nudge backup. Catch-up covers days Chrome was closed (Chrome is "mostly open").
- Dedupe handled on our side (sent-log). rater8's own duplicate behavior is unknown; question pending with Darryl (rater8 ticket #157526). Also asked him for an official SFTP/API channel; if he offers one, only the send step gets swapped.
- Slack gets both a daily success one-liner and failure alerts.
- rater8 login persistence is unknown ("not sure"); design assumes usually-logged-in and makes logged-out loud and recoverable.

## Captured upload protocol (from a real manual upload, 2026-07-01)

Upload is two requests from a logged-in rave.rater8.com session (cookie auth: `ASP.NET_SessionId`, `.AspNet.ApplicationCookie`, persistent `TwoFactorAuthCookie`). No CSRF token observed.

**Step 1 — deliver the file.** `POST https://rave.rater8.com/Integration/UploadFiles`, multipart/form-data:

| part | value |
|---|---|
| `<filename>` (file part, name = filename) | the CSV, `Content-Type: text/csv` |
| `uploadername` | `C:\fakepath\<filename>` |
| `tenantId` | `9008` |
| `pollingFolderId` | `2719` |

Response: `{"success": true, "result": {"fileName": ["IntegrationUploadFile_<id>_<original name>[r8#<guid>].csv"]}, "error": null, "unAuthorizedRequest": false}`

**Step 2 — trigger processing.** `POST https://rave.rater8.com/api/services/app/integrationUploadFile/UploadIntegrationFiles`, JSON:

```json
{
  "fileList": ["<result.fileName[0] from step 1>"],
  "tenantId": 9008,
  "pollingFolderId": "2719",
  "pollingFolderName": "Inzinna Therapy Group - Simple Practice - Manual",
  "processLocationCodes": false,
  "processAppointmentCodes": false,
  "processDepartmentCodes": false,
  "processEmployeeCodes": false
}
```

Response: `{"success": true, "result": {"filesUploaded": 1, "filesFailed": 0}, "error": null, "unAuthorizedRequest": false}`

Success = step 2 HTTP 2xx AND `success: true` AND `filesUploaded == 1` AND `filesFailed == 0`. Logged-out = `unAuthorizedRequest: true`, a non-JSON (login HTML) response, or a redirect to a login URL. Constants (`tenantId` 9008, `pollingFolderId` "2719", folder name) are hardcoded next to `MAIN_PROVIDER_IDS`-style config.

## Architecture

All new orchestration lives in the service worker so the daily run works without the app page open. The merge library is imported into the service worker bundle (esbuild already bundles per-entry).

New module `src/lib/rater8-upload.ts`: pure helpers (date-window math, row hashing, sent-log filtering, upload-result parsing) so they are unit-testable in Node. Browser-only steps (tab handling, `chrome.*`, the in-page upload function) stay in the service worker.

### Triggers

Work is "owed" when `lastUploadedThrough` < yesterday. Three things start a run; all funnel into the same single-flight pipeline (an in-flight flag prevents concurrent runs, and an owed-check makes repeat triggers no-ops):

- **Ride-along (primary):** `chrome.tabs.onUpdated` (permission already held) watches for a completed load on `secure.simplepractice.com` that is not a `sign_in` page. If work is owed and nothing ran in the last few minutes, run now. The same listener on `rave.rater8.com` resumes a run that previously failed at the rater8 step.
- **7:00 AM try-then-nudge (backup):** `chrome.alarms` (`rater8-daily`, next 7:00 AM local, `periodInMinutes: 1440`). Try the run; if SP has no session, send one Slack nudge ("Sign into SimplePractice, I'll do the rest") instead of a failure alert. The ride-along finishes the job when the founder signs in.
- **Catch-up:** `onStartup`/`onInstalled` re-arm the alarm and run the same owed-check (covers days Chrome was closed at 7:00 AM).

At most one success message and one nudge per day (tracked in storage).

### Pipeline

1. A trigger fires and the owed-check passes.
2. Compute window: `lastUploadedThrough + 1 day` through yesterday (local dates), capped at the trailing 7 days. First run ever: yesterday only. Window empty → nothing to do.
3. Pull the two SP reports for the window via the existing `fetchReports` (find-or-create background SP tab, page-context fetch, `LOGIN_REQUIRED` detection).
4. `mergeReports` → `rater8Rows` → drop rows whose hash is in the sent-log. 0 rows left → record success (advance `lastUploadedThrough`), Slack "0 new visits".
5. Build CSV text (`RATER8_HEADER` + rows), filename `rater8_<start>_to_<end>.csv` (same shape as the manual download).
6. Find-or-create a background `rave.rater8.com` tab; `chrome.scripting.executeScript` a self-contained function that does step 1 (FormData + File) and step 2 (JSON fetch), both `credentials: 'same-origin'`, and returns both parsed responses plus HTTP statuses.
7. On verified success: add row hashes to sent-log, set `lastUploadedThrough` = window end, close the created tab, Slack success one-liner, clear badge.
8. On failure: mark nothing as sent, red badge (`chrome.action.setBadgeText`). Logged-out SP or rater8 gets the once-a-day Slack nudge naming the site; signing in is the whole fix, the ride-along listener resumes automatically. Other errors (bad HTTP status, `filesFailed > 0`, malformed response) get a Slack failure alert; "Upload to rater8 now" and the next trigger both retry.

### App page additions

- **"Upload to rater8 now" button**: sends a `RUN_RATER8_UPLOAD` message to the service worker, same pipeline as the alarm, shows the result inline. This is the test/recovery path.
- **Settings**: auto-upload on/off toggle (default off until the founder flips it after the supervised first run) and a Slack webhook URL field. Stored in `chrome.storage.sync` beside `webAppUrl`/`webAppToken`. 7:00 AM is hardcoded, no time picker.

### Storage

`chrome.storage.local`:

- `sentLog`: `{ [sha256(joined 9 columns)]: "YYYY-MM-DD" }`, pruned past 30 days. Hashes only, no readable PHI.
- `lastUploadedThrough`: `"YYYY-MM-DD"`.
- `lastRunResult`: `{ when, ok, detail }` for display on the app page.

A same-client, same-provider, same-day second visit produces an identical row and collapses to one upload: one review request per patient per day, intended.

If storage is lost (extension reinstall), the window resets to yesterday-only, so worst case re-sends one day. Darryl's dedupe answer tells us how bad that is.

### Slack

Direct `fetch` POST to the configured webhook from the service worker. Counts and dates only, never names/emails/phones (Slack stays PII-free per practice policy). Examples:

- Success: `rater8: uploaded 23 visits (2026-07-01).`
- Nudge (logged out): `rater8 upload waiting: sign into <SimplePractice | rater8> and I'll do the rest.`
- Failure (real error): `rater8 upload FAILED: <HTTP 500 | 1 file failed>. Open the extension and click "Upload to rater8 now" to retry.`

Webhook missing → skip Slack silently (badge still works).

### PHI

CSV is built in memory and posted directly to rater8; never written to disk by the auto path. No new third parties. Sent-log stores hashes only.

## Manifest changes

- `host_permissions`: add `https://rave.rater8.com/*` and `https://hooks.slack.com/*` (SP origin already present).
- `permissions`: add `alarms` (`tabs`/`scripting`/`storage` already present).

## Out of scope

- Leadership Google Sheet push automation (Apps Script still not deployed).
- Manual UI flows: unchanged.
- Switching the details fetch to the JSON twin (deep links / guardian contact): separate deferred work.
- SFTP/API channel: swap the send step if Darryl offers one.

## Testing

- `npm test` (Node): new unit tests for window math (normal, catch-up, 7-day cap, first run), row hashing/dedupe against the sent-log, and upload-response parsing (success, `filesFailed > 0`, `unAuthorizedRequest`, non-JSON login HTML). Existing merge reference test untouched.
- `tsc` clean, `npm run build` clean.
- Live verification (founder-side, automation Chrome is logged into neither site): reload unpacked extension, click "Upload to rater8 now" with auto-upload off, confirm the file lands in the rater8 dashboard and the Slack line arrives, then flip the toggle on. First alarm run checked the next morning.

## Rollout

1. PR into `main`, rebuild `dist/`, founder re-copies to `~/Desktop/sp-client-reach-plugin` and reloads at `chrome://extensions`.
2. Founder pastes Slack webhook (a #rater8 channel webhook, or an existing ops one) into settings.
3. Supervised "Upload now" run, verify in rater8 dashboard, enable the toggle.
