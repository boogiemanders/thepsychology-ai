# rater8 Auto-Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The SP Client Reach Chrome extension uploads the daily rater8 CSV to rave.rater8.com by itself, riding along on the founder's natural SimplePractice logins, with a 7 AM check, a hashed sent-log so nothing is ever double-sent, and Slack alerts.

**Architecture:** Pure logic (date windows, row hashing, sent-log filtering, upload-response verdicts) lives in a new `src/lib/rater8-upload.ts`, unit-tested in Node. The service worker gains a single-flight `runAutoUpload` pipeline reusing the existing SP background-tab fetch, plus a rater8 background-tab uploader replaying the captured two-step protocol. The app page gains an on/off toggle, a Slack webhook field, and an "Upload to rater8 now" button.

**Tech Stack:** Chrome MV3 extension, TypeScript (strict), esbuild bundle, Node test scripts with `assert` (pattern of `test/run-merge.mjs`).

**Spec:** `docs/superpowers/specs/2026-07-01-rater8-auto-upload-design.md` — read it first.

## Global Constraints

- All paths below are relative to `content/Inzinna/sp-client-reach/`. Run npm/tsc/build commands from that directory.
- Code style: no semicolons, single quotes, 2-space indent, comments only for non-obvious constraints (match existing files).
- Founder-facing copy (statuses, Slack messages, labels): plain language, no emojis, no em dashes.
- PHI: never put client names/emails/phones in Slack messages, storage keys, or logs. Sent-log stores SHA-256 hashes only. CSV is built in memory, never written to disk.
- Captured rater8 constants (from the real 2026-07-01 upload): tenantId `9008`, pollingFolderId `'2719'`, pollingFolderName `'Inzinna Therapy Group - Simple Practice - Manual'`.
- Success = step-2 response `success: true` AND `filesUploaded >= 1` AND `filesFailed == 0`. `unAuthorizedRequest: true` or an HTML body = logged out.
- Don't touch the existing manual flows (pull button, downloads, sheet push, copy buttons) beyond the exact edits listed.
- Verify with: `npm test`, `npx tsc --noEmit`, `npm run build` — all must pass before each commit.

---

### Task 1: Pure helpers library + unit tests

**Files:**
- Create: `src/lib/rater8-upload.ts`
- Create: `test/run-rater8-upload.mjs`
- Modify: `package.json` (test script)

**Interfaces:**
- Consumes: nothing (pure module, no chrome.* APIs).
- Produces (used by Tasks 2-3):
  - `RATER8_ORIGIN: string`, `RATER8_TENANT_ID: number`, `RATER8_POLLING_FOLDER_ID: string`, `RATER8_POLLING_FOLDER_NAME: string`
  - `isoDate(d: Date): string`
  - `owedWindow(lastUploadedThrough: string | null, now: Date): { start: string; end: string } | null`
  - `reportUrls(startsAt: string, endsAt: string): string[]`
  - `csvFilename(start: string, end: string): string`
  - `hashRow(row: string[]): Promise<string>`
  - `filterUnsent(rows: string[][], sentLog: Record<string, string>): Promise<{ fresh: string[][]; hashes: string[] }>`
  - `pruneSentLog(sentLog: Record<string, string>, now: Date, keepDays?: number): Record<string, string>`
  - `interface UploadStep { step: string; status: number; body: string }`
  - `interface UploadVerdict { ok: boolean; loggedOut: boolean; detail: string }`
  - `evaluateUpload(steps: UploadStep[]): UploadVerdict`

- [ ] **Step 1: Write the failing test**

Create `test/run-rater8-upload.mjs` (mirrors `test/run-merge.mjs`'s esbuild-bundle pattern; needs no external files so it always runs):

```js
// Unit tests for the rater8 auto-upload pure helpers. No client data involved.
//
// Usage: node test/run-rater8-upload.mjs

import { execSync } from 'child_process'
import assert from 'node:assert/strict'

execSync('npx esbuild src/lib/rater8-upload.ts --bundle --format=esm --outfile=test/.rater8-upload.bundle.mjs', {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'inherit',
})
const lib = await import('./.rater8-upload.bundle.mjs')

const now = new Date(2026, 6, 1) // Jul 1 2026 (month is 0-based)

// ---- owedWindow ----
assert.deepEqual(lib.owedWindow('2026-06-29', now), { start: '2026-06-30', end: '2026-06-30' })
assert.deepEqual(lib.owedWindow(null, now), { start: '2026-06-30', end: '2026-06-30' }) // first run = yesterday only
assert.deepEqual(lib.owedWindow('2026-06-01', now), { start: '2026-06-24', end: '2026-06-30' }) // capped at 7 days
assert.deepEqual(lib.owedWindow('2026-06-25', now), { start: '2026-06-26', end: '2026-06-30' }) // catch-up
assert.equal(lib.owedWindow('2026-06-30', now), null) // up to date
assert.equal(lib.owedWindow('2026-07-05', now), null) // future-safe

// ---- hashRow / filterUnsent ----
const rowA = ['Ann', 'Smith', 'ann@example.com', '(555) 555-0100', 'Gregory Inzinna', '1428233', 'Manhattan', '06/30/2026', 'Show']
const rowB = ['Bob', 'Jones', 'bob@example.com', '(555) 555-0101', 'Anders Chan', '1973632', 'Virtual', '06/30/2026', 'Show']
const hA = await lib.hashRow(rowA)
assert.match(hA, /^[0-9a-f]{64}$/)
{
  const { fresh, hashes } = await lib.filterUnsent([rowA, rowB, rowA], { [hA]: '2026-06-30' })
  assert.deepEqual(fresh, [rowB]) // rowA dropped via sent-log, repeat rowA collapsed in-batch
  assert.equal(hashes.length, 1)
}
{
  const { fresh, hashes } = await lib.filterUnsent([rowA, rowA], {})
  assert.equal(fresh.length, 1) // same-day duplicate visit collapses to one review ask
  assert.equal(hashes.length, 1)
}

// ---- pruneSentLog ----
assert.deepEqual(
  lib.pruneSentLog({ aaa: '2026-05-01', bbb: '2026-06-28' }, now),
  { bbb: '2026-06-28' } // 30-day retention: floor is 2026-06-01
)

// ---- evaluateUpload ----
const store = (body, status = 200) => ({ step: 'store', status, body })
const proc = (body, status = 200) => ({ step: 'process', status, body })
const ok1 = JSON.stringify({ success: true, result: { fileName: ['X.csv'] }, error: null, unAuthorizedRequest: false })
const ok2 = JSON.stringify({ success: true, result: { filesUploaded: 1, filesFailed: 0 }, error: null, unAuthorizedRequest: false })

assert.equal(lib.evaluateUpload([store(ok1), proc(ok2)]).ok, true)
assert.equal(lib.evaluateUpload([store(ok1), proc(ok2)]).loggedOut, false)

const failedFile = JSON.stringify({ success: true, result: { filesUploaded: 0, filesFailed: 1 }, unAuthorizedRequest: false })
assert.equal(lib.evaluateUpload([store(ok1), proc(failedFile)]).ok, false)
assert.equal(lib.evaluateUpload([store(ok1), proc(failedFile)]).loggedOut, false)

const unauth = JSON.stringify({ success: false, unAuthorizedRequest: true })
assert.equal(lib.evaluateUpload([store(unauth)]).loggedOut, true)
assert.equal(lib.evaluateUpload([store('<!doctype html><html>sign in</html>')]).loggedOut, true) // login page instead of JSON
assert.equal(lib.evaluateUpload([{ step: 'error', status: 0, body: 'TypeError: Failed to fetch' }]).ok, false)
assert.equal(lib.evaluateUpload([{ step: 'error', status: 0, body: 'TypeError: Failed to fetch' }]).loggedOut, false)
assert.equal(lib.evaluateUpload([store(ok1)]).ok, false) // stored but processing never triggered
assert.equal(lib.evaluateUpload([store(ok1, 500)]).ok, false) // bad HTTP status
assert.equal(lib.evaluateUpload([]).ok, false)

// ---- filenames + report urls ----
assert.equal(lib.csvFilename('2026-06-30', '2026-06-30'), 'rater8_2026-06-30_to_2026-06-30.csv')
const urls = lib.reportUrls('2026-06-24', '2026-06-30')
assert.ok(urls[0].includes('client-attendance-report-rows.csv'))
assert.ok(urls[0].includes('2026-06-24') && urls[0].includes('2026-06-30'))
assert.ok(urls[1].includes('client-details-report-rows.csv'))

console.log('PASS run-rater8-upload: all assertions passed')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/run-rater8-upload.mjs`
Expected: FAIL — esbuild errors with `Could not resolve "src/lib/rater8-upload.ts"` (file does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/rater8-upload.ts`:

```ts
// Pure helpers for the rater8 auto-upload pipeline. No chrome.* APIs here so
// everything is unit-testable in Node (test/run-rater8-upload.mjs).
//
// Protocol constants come from a captured real upload (2026-07-01), see
// docs/superpowers/specs/2026-07-01-rater8-auto-upload-design.md.

export const RATER8_ORIGIN = 'https://rave.rater8.com'
export const RATER8_TENANT_ID = 9008
export const RATER8_POLLING_FOLDER_ID = '2719'
export const RATER8_POLLING_FOLDER_NAME = 'Inzinna Therapy Group - Simple Practice - Manual'

const SP = 'https://secure.simplepractice.com'

export function isoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// The date range still owed to rater8: the day after the last successful
// upload through yesterday, capped at the trailing 7 days (a lost sent-log
// must never resend weeks of visits). null = nothing owed.
export function owedWindow(
  lastUploadedThrough: string | null,
  now: Date
): { start: string; end: string } | null {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const floor = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  let start: Date
  if (lastUploadedThrough) {
    start = parseIso(lastUploadedThrough)
    start.setDate(start.getDate() + 1)
  } else {
    start = new Date(yesterday.getTime())
  }
  if (start.getTime() < floor.getTime()) start = floor
  if (start.getTime() > yesterday.getTime()) return null
  return { start: isoDate(start), end: isoDate(yesterday) }
}

// Same two SimplePractice report URLs the app page uses (app.ts reportUrls)
export function reportUrls(startsAt: string, endsAt: string): string[] {
  const f = encodeURIComponent
  return [
    `${SP}/frontend/client-attendance-report-rows.csv?filter%5BstartsAt%5D=${f(startsAt)}&filter%5BendsAt%5D=${f(endsAt)}&sort=clientName`,
    `${SP}/frontend/client-details-report-rows.csv?filter%5BclientStatus%5D=Active&sort=clientName`,
  ]
}

export function csvFilename(start: string, end: string): string {
  return `rater8_${start}_to_${end}.csv`
}

// SHA-256 of the joined row: the sent-log stores fingerprints, not PHI
export async function hashRow(row: string[]): Promise<string> {
  const data = new TextEncoder().encode(row.join('|'))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Drop rows already uploaded (sent-log hit) and collapse duplicates within
// the batch (a same-day repeat visit = one review ask). Returns the surviving
// rows plus their hashes so the caller can record them after a verified upload.
export async function filterUnsent(
  rows: string[][],
  sentLog: Record<string, string>
): Promise<{ fresh: string[][]; hashes: string[] }> {
  const fresh: string[][] = []
  const hashes: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const h = await hashRow(row)
    if (sentLog[h] || seen.has(h)) continue
    seen.add(h)
    fresh.push(row)
    hashes.push(h)
  }
  return { fresh, hashes }
}

export function pruneSentLog(
  sentLog: Record<string, string>,
  now: Date,
  keepDays = 30
): Record<string, string> {
  const floor = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - keepDays))
  const out: Record<string, string> = {}
  for (const [hash, date] of Object.entries(sentLog)) {
    if (date >= floor) out[hash] = date
  }
  return out
}

// Raw record of one HTTP exchange made inside the rater8 tab
export interface UploadStep {
  step: string // 'store' | 'process' | 'error'
  status: number
  body: string
}

export interface UploadVerdict {
  ok: boolean
  loggedOut: boolean
  detail: string
}

function parseJson(body: string): Record<string, unknown> | null {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

// Interpret the two-step upload exchange. Logged-out shows up as
// unAuthorizedRequest: true or as an HTML login page instead of JSON.
export function evaluateUpload(steps: UploadStep[]): UploadVerdict {
  if (!steps.length) return { ok: false, loggedOut: false, detail: 'no response from the rater8 tab' }
  const err = steps.find((s) => s.step === 'error')
  if (err) return { ok: false, loggedOut: false, detail: err.body }
  for (const s of steps) {
    const j = parseJson(s.body)
    if (j === null) return { ok: false, loggedOut: true, detail: `${s.step}: got a login page instead of JSON` }
    if (j.unAuthorizedRequest) return { ok: false, loggedOut: true, detail: `${s.step}: not signed in` }
    if (s.status < 200 || s.status >= 300 || !j.success) {
      return { ok: false, loggedOut: false, detail: `${s.step}: HTTP ${s.status}` }
    }
  }
  const process = steps.find((s) => s.step === 'process')
  if (!process) return { ok: false, loggedOut: false, detail: 'file stored but processing never started' }
  const result = (parseJson(process.body)?.result ?? {}) as { filesUploaded?: number; filesFailed?: number }
  const uploaded = result.filesUploaded ?? 0
  const failed = result.filesFailed ?? 0
  if (failed > 0 || uploaded < 1) {
    return { ok: false, loggedOut: false, detail: `rater8 processed ${uploaded} file(s), rejected ${failed}` }
  }
  return { ok: true, loggedOut: false, detail: `rater8 accepted ${uploaded} file(s)` }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/run-rater8-upload.mjs`
Expected: `PASS run-rater8-upload: all assertions passed`

- [ ] **Step 5: Chain into npm test**

In `package.json`, change the test script line:

```json
    "test": "node test/run-merge.mjs && node test/run-rater8-upload.mjs"
```

Run: `npm test`
Expected: run-merge output (or its SKIP line if the Downloads CSVs are absent), then `PASS run-rater8-upload: all assertions passed`.

- [ ] **Step 6: Typecheck and commit**

Run: `npx tsc --noEmit`
Expected: no output (clean).

```bash
git add src/lib/rater8-upload.ts test/run-rater8-upload.mjs package.json
git commit -m "feat(sp-client-reach): rater8 auto-upload pure helpers + tests"
```

---

### Task 2: Service worker upload machinery + manifest permissions

**Files:**
- Modify: `src/background/service-worker.ts`
- Modify: `manifest.json`

**Interfaces:**
- Consumes (Task 1): `RATER8_ORIGIN`, `RATER8_TENANT_ID`, `RATER8_POLLING_FOLDER_ID`, `RATER8_POLLING_FOLDER_NAME`, `UploadStep`, `evaluateUpload`.
- Produces (Task 3 relies on these exact signatures):
  - `fetchReports(urls: string[], surfaceLoginTab?: boolean)` — existing function, gains the optional param (default `true`, preserving current behavior for the FETCH_REPORTS message path).
  - `uploadToRater8(csvText: string, filename: string, surfaceLoginTab: boolean): Promise<{ steps: UploadStep[]; loggedOutBeforeUpload?: boolean }>`

- [ ] **Step 1: Update manifest.json**

Bump version, add `alarms` permission and the two new hosts (rater8 for the upload tab + fetches, Slack for webhook posts from the worker):

```json
  "version": "1.1.0",
  "permissions": ["storage", "scripting", "tabs", "alarms"],
  "host_permissions": [
    "https://*.simplepractice.com/*",
    "https://script.google.com/*",
    "https://script.googleusercontent.com/*",
    "https://rave.rater8.com/*",
    "https://hooks.slack.com/*"
  ],
```

- [ ] **Step 2: Add imports and the surfaceLoginTab option to fetchReports**

At the top of `src/background/service-worker.ts` (currently has no imports), add:

```ts
import { toCsv } from '../lib/csv'
import { mergeReports, RATER8_HEADER } from '../lib/merge'
import {
  RATER8_ORIGIN,
  RATER8_TENANT_ID,
  RATER8_POLLING_FOLDER_ID,
  RATER8_POLLING_FOLDER_NAME,
  UploadStep,
  evaluateUpload,
  owedWindow,
  isoDate,
  reportUrls,
  csvFilename,
  filterUnsent,
  pruneSentLog,
} from '../lib/rater8-upload'
```

(`toCsv`, `mergeReports`, `RATER8_HEADER`, `owedWindow`, `isoDate`, `reportUrls`, `csvFilename`, `filterUnsent`, `pruneSentLog` are used by Task 3's pipeline; importing them now keeps this file compiling once, not twice.)

Change the `fetchReports` signature and its login branch (auto runs must not steal window focus at 7 AM):

```ts
async function fetchReports(urls: string[], surfaceLoginTab = true) {
```

and inside it:

```ts
    if (reports.length !== urls.length || reports.some((r) => !r.ok || looksLikeLogin(r))) {
      // surface the SP tab so the user can log in (manual runs only), keep it open
      if (surfaceLoginTab) await chrome.tabs.update(tabId, { active: true })
      return { ok: false, error: 'LOGIN_REQUIRED' }
    }
```

- [ ] **Step 3: Add the in-page upload function**

Append after `fetchReports`. This runs INSIDE the rave.rater8.com page (like `fetchCsvsInPage` for SP), so it must be self-contained: no imports, no outer-scope references. It replays the captured two-step protocol and returns the raw exchanges for `evaluateUpload`.

```ts
// Runs inside the rave.rater8.com page. Must be self-contained.
// Step 'store' delivers the CSV bytes; the server's reply names the stored
// file, which step 'process' then submits for review-request processing.
async function uploadCsvInPage(
  csvText: string,
  filename: string,
  tenantId: number,
  pollingFolderId: string,
  pollingFolderName: string
): Promise<{ step: string; status: number; body: string }[]> {
  const out: { step: string; status: number; body: string }[] = []
  try {
    const fd = new FormData()
    fd.append(filename, new File([csvText], filename, { type: 'text/csv' }), filename)
    fd.append('uploadername', 'C:\\fakepath\\' + filename)
    fd.append('tenantId', String(tenantId))
    fd.append('pollingFolderId', pollingFolderId)
    const res1 = await fetch('/Integration/UploadFiles', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    })
    const body1 = await res1.text()
    out.push({ step: 'store', status: res1.status, body: body1 })
    let stored: string[] | null = null
    try {
      const j = JSON.parse(body1)
      if (j?.success && Array.isArray(j?.result?.fileName)) stored = j.result.fileName
    } catch {
      // not JSON (login page); evaluateUpload will classify it
    }
    if (!stored || !stored.length) return out
    const res2 = await fetch('/api/services/app/integrationUploadFile/UploadIntegrationFiles', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fileList: stored,
        tenantId,
        pollingFolderId,
        pollingFolderName,
        processLocationCodes: false,
        processAppointmentCodes: false,
        processDepartmentCodes: false,
        processEmployeeCodes: false,
      }),
    })
    out.push({ step: 'process', status: res2.status, body: await res2.text() })
  } catch (e) {
    out.push({ step: 'error', status: 0, body: String(e) })
  }
  return out
}
```

- [ ] **Step 4: Add uploadToRater8 (tab find-or-create, mirrors fetchReports)**

Append after `uploadCsvInPage`:

```ts
async function uploadToRater8(
  csvText: string,
  filename: string,
  surfaceLoginTab: boolean
): Promise<{ steps: UploadStep[]; loggedOutBeforeUpload?: boolean }> {
  let [tab] = await chrome.tabs.query({ url: `${RATER8_ORIGIN}/*` })
  let createdTabId: number | null = null
  if (!tab) {
    tab = await chrome.tabs.create({ url: `${RATER8_ORIGIN}/`, active: false })
    createdTabId = tab.id!
    await waitForTabComplete(tab.id!, 20000)
    tab = await chrome.tabs.get(tab.id!)
  }
  const tabId = tab.id!
  if (!tab.url?.startsWith(RATER8_ORIGIN)) {
    // bounced to an off-origin login: signing in is the fix, keep the tab for that
    if (surfaceLoginTab) await chrome.tabs.update(tabId, { active: true })
    return { steps: [], loggedOutBeforeUpload: true }
  }
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: uploadCsvInPage,
      args: [csvText, filename, RATER8_TENANT_ID, RATER8_POLLING_FOLDER_ID, RATER8_POLLING_FOLDER_NAME],
    })
    const steps = (result?.result ?? []) as UploadStep[]
    const verdict = evaluateUpload(steps)
    if (verdict.ok && createdTabId !== null) {
      chrome.tabs.remove(createdTabId).catch(() => {})
    }
    if (verdict.loggedOut && surfaceLoginTab) await chrome.tabs.update(tabId, { active: true })
    return { steps }
  } catch (e) {
    return { steps: [{ step: 'error', status: 0, body: String(e) }] }
  }
}
```

- [ ] **Step 5: Verify it compiles and builds**

Run: `npx tsc --noEmit`
Expected: clean. (Unused-import warnings are not errors under this tsconfig; the pipeline imports get used in Task 3.)

Run: `npm run build`
Expected: `Build complete.`

- [ ] **Step 6: Commit**

```bash
git add src/background/service-worker.ts manifest.json
git commit -m "feat(sp-client-reach): rater8 two-step upload machinery + manifest perms"
```

---

### Task 3: Pipeline, triggers, Slack, badge, message route

**Files:**
- Modify: `src/background/service-worker.ts`

**Interfaces:**
- Consumes (Tasks 1-2): everything imported in Task 2, `fetchReports(urls, surfaceLoginTab)`, `uploadToRater8(csvText, filename, surfaceLoginTab)`.
- Produces (Task 4 relies on): message `{ type: 'RUN_RATER8_UPLOAD' }` answered with `{ ok: boolean; detail: string }`; `chrome.storage.local` keys `lastUploadedThrough` (ISO date string), `sentLog`, `lastRunResult: { when: number; ok: boolean; detail: string }`; `chrome.storage.sync` keys `autoUploadEnabled` (boolean), `slackWebhookUrl` (string).

- [ ] **Step 1: Add the pipeline and alert helpers**

Append to `src/background/service-worker.ts`:

```ts
// ---------- rater8 auto-upload pipeline ----------
// Triggers (alarm, ride-along, manual button) all funnel here. Single-flight:
// concurrent triggers are dropped, repeat triggers after success are no-ops
// because owedWindow returns null.

interface RunOutcome {
  ok: boolean
  detail: string
}

let runInFlight = false

async function runAutoUpload(trigger: 'alarm' | 'ridealong' | 'manual'): Promise<RunOutcome> {
  if (runInFlight) return { ok: false, detail: 'a run is already in progress' }
  runInFlight = true
  try {
    return await doRun(trigger)
  } catch (e) {
    return { ok: false, detail: String(e) }
  } finally {
    runInFlight = false
  }
}

async function doRun(trigger: 'alarm' | 'ridealong' | 'manual'): Promise<RunOutcome> {
  const settings = await chrome.storage.sync.get(['autoUploadEnabled', 'slackWebhookUrl'])
  if (trigger !== 'manual' && !settings.autoUploadEnabled) {
    return { ok: false, detail: 'auto-upload is switched off' }
  }
  const store = await chrome.storage.local.get(['lastUploadedThrough', 'sentLog', 'lastAttemptAt'])
  const now = new Date()
  const window = owedWindow(store.lastUploadedThrough ?? null, now)
  if (!window) return { ok: true, detail: 'nothing owed, already up to date' }
  // ride-along fires on every SP page load; don't hammer a failing pipeline
  if (trigger === 'ridealong' && store.lastAttemptAt && Date.now() - store.lastAttemptAt < 3 * 60 * 1000) {
    return { ok: false, detail: 'tried a few minutes ago' }
  }
  await chrome.storage.local.set({ lastAttemptAt: Date.now() })
  const surface = trigger === 'manual'
  const range = window.start === window.end ? window.end : `${window.start} to ${window.end}`

  const sp = await fetchReports(reportUrls(window.start, window.end), surface)
  if (!sp.ok) {
    if (sp.error === 'LOGIN_REQUIRED') {
      // signing in IS the fix; clear the debounce so the post-login
      // ride-along run is never blocked
      await chrome.storage.local.remove('lastAttemptAt')
      await setFailBadge(true)
      await recordRun(false, `waiting for a SimplePractice sign-in (${range})`)
      if (trigger !== 'manual') await nudgeOnce(settings.slackWebhookUrl, now, 'SimplePractice')
      return { ok: false, detail: 'sign into SimplePractice first' }
    }
    await setFailBadge(true)
    await recordRun(false, `SimplePractice pull failed: ${sp.error} (${range})`)
    if (trigger !== 'manual') {
      await postSlack(
        settings.slackWebhookUrl,
        `rater8 upload FAILED: SimplePractice pull error (${sp.error}). Open the extension and click "Upload to rater8 now" to retry.`
      )
    }
    return { ok: false, detail: `SimplePractice pull failed: ${sp.error}` }
  }

  const [attendance, details] = sp.reports as string[]
  const merged = mergeReports(attendance, details)
  const sentLog = pruneSentLog((store.sentLog ?? {}) as Record<string, string>, now)
  const { fresh, hashes } = await filterUnsent(merged.rater8, sentLog)

  if (!fresh.length) {
    await chrome.storage.local.set({ sentLog, lastUploadedThrough: window.end })
    await recordRun(true, `0 new visits (${range})`)
    await setFailBadge(false)
    if (trigger !== 'manual') {
      await successOnce(settings.slackWebhookUrl, now, `rater8: 0 new visits to upload (${range}).`)
    }
    return { ok: true, detail: `0 new visits (${range})` }
  }

  const up = await uploadToRater8(toCsv(RATER8_HEADER, fresh), csvFilename(window.start, window.end), surface)
  const verdict = evaluateUpload(up.steps)
  if (up.loggedOutBeforeUpload || verdict.loggedOut) {
    await chrome.storage.local.remove('lastAttemptAt')
    await setFailBadge(true)
    await recordRun(false, `waiting for a rater8 sign-in (${range})`)
    if (trigger !== 'manual') await nudgeOnce(settings.slackWebhookUrl, now, 'rater8')
    return { ok: false, detail: 'sign into rater8 first' }
  }
  if (!verdict.ok) {
    await setFailBadge(true)
    await recordRun(false, `${verdict.detail} (${range})`)
    if (trigger !== 'manual') {
      await postSlack(
        settings.slackWebhookUrl,
        `rater8 upload FAILED: ${verdict.detail}. Open the extension and click "Upload to rater8 now" to retry.`
      )
    }
    return { ok: false, detail: verdict.detail }
  }

  for (const h of hashes) sentLog[h] = window.end
  await chrome.storage.local.set({ sentLog, lastUploadedThrough: window.end })
  await recordRun(true, `uploaded ${fresh.length} visits (${range})`)
  await setFailBadge(false)
  if (trigger !== 'manual') {
    await successOnce(settings.slackWebhookUrl, now, `rater8: uploaded ${fresh.length} visits (${range}).`)
  }
  return { ok: true, detail: `uploaded ${fresh.length} visits (${range})` }
}

async function recordRun(ok: boolean, detail: string) {
  await chrome.storage.local.set({ lastRunResult: { when: Date.now(), ok, detail } })
}

async function postSlack(webhook: string | undefined, text: string) {
  if (!webhook) return
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    // Slack being down must not break the run
  }
}

// one nudge and one success message per day, max
async function nudgeOnce(webhook: string | undefined, now: Date, site: 'SimplePractice' | 'rater8') {
  const today = isoDate(now)
  const { lastNudgeDate } = await chrome.storage.local.get('lastNudgeDate')
  if (lastNudgeDate === today) return
  await chrome.storage.local.set({ lastNudgeDate: today })
  await postSlack(webhook, `rater8 upload waiting: sign into ${site} and I'll do the rest.`)
}

async function successOnce(webhook: string | undefined, now: Date, text: string) {
  const today = isoDate(now)
  const { lastSuccessDate } = await chrome.storage.local.get('lastSuccessDate')
  if (lastSuccessDate === today) return
  await chrome.storage.local.set({ lastSuccessDate: today })
  await postSlack(webhook, text)
}

async function setFailBadge(on: boolean) {
  await chrome.action.setBadgeText({ text: on ? '!' : '' })
  if (on) await chrome.action.setBadgeBackgroundColor({ color: '#d93025' })
}
```

- [ ] **Step 2: Add the triggers**

Append after the pipeline code:

```ts
// ---------- triggers ----------

const ALARM_NAME = 'rater8-daily'

function msUntilNext7am(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

function armAlarm() {
  chrome.alarms.create(ALARM_NAME, {
    when: Date.now() + msUntilNext7am(new Date()),
    periodInMinutes: 1440,
  })
}

// startup/install: re-arm the alarm and quietly catch up missed days
chrome.runtime.onInstalled.addListener(() => {
  armAlarm()
  void runAutoUpload('ridealong')
})
chrome.runtime.onStartup.addListener(() => {
  armAlarm()
  void runAutoUpload('ridealong')
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) void runAutoUpload('alarm')
})

// ride-along: a signed-in SP or rater8 page load finishes any owed work.
// Cheap when nothing is owed; single-flight blocks the loads our own
// background tabs generate mid-run.
chrome.tabs.onUpdated.addListener((_tabId, info, tab) => {
  if (info.status !== 'complete' || !tab.url) return
  const watched = tab.url.startsWith(`${SP_ORIGIN}/`) || tab.url.startsWith(`${RATER8_ORIGIN}/`)
  if (!watched || /sign_in|login/i.test(tab.url)) return
  void runAutoUpload('ridealong')
})
```

- [ ] **Step 3: Route the manual-run message**

Replace the existing `chrome.runtime.onMessage.addListener` block at the bottom of the file with:

```ts
interface RunUploadRequest {
  type: 'RUN_RATER8_UPLOAD'
}

chrome.runtime.onMessage.addListener(
  (msg: FetchReportsRequest | RunUploadRequest, _sender, sendResponse) => {
    if (msg?.type === 'FETCH_REPORTS') {
      fetchReports(msg.urls).then(sendResponse)
      return true // async response
    }
    if (msg?.type === 'RUN_RATER8_UPLOAD') {
      runAutoUpload('manual').then(sendResponse)
      return true // async response
    }
  }
)
```

- [ ] **Step 4: Verify it compiles, builds, and tests still pass**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npm run build`
Expected: `Build complete.`

Run: `npm test`
Expected: both test scripts pass.

- [ ] **Step 5: Commit**

```bash
git add src/background/service-worker.ts
git commit -m "feat(sp-client-reach): auto-upload pipeline, ride-along + 7am triggers, Slack alerts"
```

---

### Task 4: App page UI (toggle, webhook, Upload now button)

**Files:**
- Modify: `src/app/app.html`
- Modify: `src/app/app.ts`

**Interfaces:**
- Consumes (Task 3): message `{ type: 'RUN_RATER8_UPLOAD' }` → `{ ok, detail }`; storage keys `autoUploadEnabled`, `slackWebhookUrl` (sync), `lastUploadedThrough`, `lastRunResult` (local).
- Produces: element ids `auto-upload-enabled`, `slack-webhook`, `run-rater8`, `auto-status`.

- [ ] **Step 1: Add the settings fields**

In `src/app/app.html`, inside `<section id="settings">`, directly BEFORE the `<button id="save-settings"` line, insert:

```html
    <label>Auto-upload to rater8 daily
      <input type="checkbox" id="auto-upload-enabled">
    </label>
    <label>Slack webhook for upload alerts
      <input type="url" id="slack-webhook" placeholder="https://hooks.slack.com/services/...">
    </label>
    <p class="hint">When on: the upload runs by itself whenever you sign into SimplePractice, and a 7 AM check nudges you on Slack if a sign-in is needed.</p>
```

- [ ] **Step 2: Add the manual run button**

In `src/app/app.html`, directly AFTER the `<p id="fetch-status" class="status"></p>` line, insert:

```html
    <div class="range-row">
      <button id="run-rater8" class="btn secondary">Upload to rater8 now</button>
    </div>
    <p id="auto-status" class="status"></p>
```

- [ ] **Step 3: Extend settings load/save in app.ts**

Replace the `loadSettings` and `saveSettings` functions in `src/app/app.ts` with:

```ts
interface Settings {
  url: string
  token: string
  autoUploadEnabled: boolean
  slackWebhookUrl: string
}

async function loadSettings(): Promise<Settings> {
  if (!hasChrome) return { url: '', token: DEFAULT_TOKEN, autoUploadEnabled: false, slackWebhookUrl: '' }
  const got = await chrome.storage.sync.get(['webAppUrl', 'webAppToken', 'autoUploadEnabled', 'slackWebhookUrl'])
  return {
    url: got.webAppUrl ?? '',
    token: got.webAppToken ?? DEFAULT_TOKEN,
    autoUploadEnabled: !!got.autoUploadEnabled,
    slackWebhookUrl: got.slackWebhookUrl ?? '',
  }
}

async function saveSettings(s: Settings) {
  if (!hasChrome) return
  await chrome.storage.sync.set({
    webAppUrl: s.url,
    webAppToken: s.token,
    autoUploadEnabled: s.autoUploadEnabled,
    slackWebhookUrl: s.slackWebhookUrl,
  })
  // seed the ledger on first enable so the first auto window starts AFTER
  // the founder's last manual upload day instead of overlapping it
  if (s.autoUploadEnabled) {
    const { lastUploadedThrough } = await chrome.storage.local.get('lastUploadedThrough')
    if (!lastUploadedThrough) {
      const y = new Date()
      y.setDate(y.getDate() - 1)
      await chrome.storage.local.set({ lastUploadedThrough: iso(y) })
    }
  }
}
```

- [ ] **Step 4: Wire the UI in init() and add the run handler**

In `src/app/app.ts`, replace the settings-related lines of `init()` (the `$<HTMLInputElement>('webapp-url').value = ...` through the `save-settings` listener block) with:

```ts
  const settings = await loadSettings()
  $<HTMLInputElement>('webapp-url').value = settings.url
  $<HTMLInputElement>('webapp-token').value = settings.token
  $<HTMLInputElement>('auto-upload-enabled').checked = settings.autoUploadEnabled
  $<HTMLInputElement>('slack-webhook').value = settings.slackWebhookUrl
  $('settings-toggle').addEventListener('click', () => $('settings').classList.toggle('hidden'))
  $('save-settings').addEventListener('click', async () => {
    await saveSettings({
      url: $<HTMLInputElement>('webapp-url').value.trim(),
      token: $<HTMLInputElement>('webapp-token').value.trim(),
      autoUploadEnabled: $<HTMLInputElement>('auto-upload-enabled').checked,
      slackWebhookUrl: $<HTMLInputElement>('slack-webhook').value.trim(),
    })
    setStatus('settings-status', 'Saved.', 'ok')
  })
```

Then add the run handler as a new top-level function (after `pullFromSp` is a natural spot):

```ts
// ---------- manual rater8 upload ----------
async function runRater8Now() {
  if (!hasChrome) {
    setStatus('auto-status', 'Open this page through the extension icon to upload.', 'error')
    return
  }
  const btn = $<HTMLButtonElement>('run-rater8')
  btn.disabled = true
  setStatus('auto-status', 'Running: pulling from SimplePractice, uploading to rater8...')
  try {
    const res = await chrome.runtime.sendMessage({ type: 'RUN_RATER8_UPLOAD' })
    if (res?.ok) setStatus('auto-status', `Done: ${res.detail}.`, 'ok')
    else setStatus('auto-status', `Not uploaded: ${res?.detail ?? 'unknown error'}`, 'error')
  } finally {
    btn.disabled = false
  }
}
```

And register it plus the last-run display inside `init()` (next to the other button listeners):

```ts
  $('run-rater8').addEventListener('click', runRater8Now)
  if (hasChrome) {
    const { lastRunResult } = await chrome.storage.local.get('lastRunResult')
    if (lastRunResult) {
      const when = new Date(lastRunResult.when).toLocaleString()
      setStatus(
        'auto-status',
        `Last auto-upload: ${lastRunResult.ok ? '' : 'FAILED, '}${lastRunResult.detail} (${when})`,
        lastRunResult.ok ? 'ok' : 'error'
      )
    }
  }
```

- [ ] **Step 5: Deduplicate reportUrls**

`src/lib/rater8-upload.ts` (Task 1) now owns the SP report URLs. In `src/app/app.ts`, delete the local `reportUrls` function and add `reportUrls` to the imports:

```ts
import { reportUrls } from '../lib/rater8-upload'
```

(`pullFromSp` keeps calling `reportUrls(startsAt, endsAt)` unchanged.)

- [ ] **Step 6: Verify compile + build + tests**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npm run build`
Expected: `Build complete.`

Run: `npm test`
Expected: both scripts pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/app.html src/app/app.ts
git commit -m "feat(sp-client-reach): auto-upload toggle, Slack webhook setting, Upload now button"
```

---

### Task 5: Ship artifacts + PR

**Files:**
- Modify: `dist/` (rebuilt), `sp-client-reach.zip` (rebuilt)

**Interfaces:**
- Consumes: everything above.
- Produces: reloadable `dist/` for the founder's `~/Desktop/sp-client-reach-plugin` copy, updated zip, draft PR.

- [ ] **Step 1: Full verification pass**

```bash
npm test && npx tsc --noEmit && npm run build
```
Expected: all pass, `Build complete.`

- [ ] **Step 2: Rebuild the zip (dist contents at archive root, no sourcemaps — matches the existing zip layout)**

```bash
rm sp-client-reach.zip
cd dist && zip -r ../sp-client-reach.zip . -x '*.map' && cd ..
unzip -l sp-client-reach.zip
```
Expected: `manifest.json`, `background/service-worker.js`, `app/app.html`, `app/app.js`, `app/app.css`, `assets/...` at root; no `.map` entries.

- [ ] **Step 3: Commit artifacts, push, open draft PR**

```bash
git add dist sp-client-reach.zip
git commit -m "build(sp-client-reach): rebuild dist + zip for rater8 auto-upload"
git push -u origin worktree-rater8-auto-upload
gh pr create --draft --title "SP Client Reach: daily rater8 auto-upload" --body "$(cat <<'EOF'
Automates the daily rater8 CSV upload that the founder currently does by hand at rave.rater8.com.

## What it does
- Uploads ride along on natural SimplePractice sign-ins (SP signs the founder out between uses, so fixed-time runs would find no session). A 7 AM alarm tries anyway and sends one Slack nudge if a sign-in is needed; the upload finishes itself right after the next sign-in.
- Replays the captured two-step upload from a background rave.rater8.com tab: multipart POST to /Integration/UploadFiles, then the JSON trigger to UploadIntegrationFiles (tenantId 9008, pollingFolderId 2719). Success requires filesUploaded >= 1 and filesFailed == 0.
- Hashed sent-log (SHA-256, 30-day retention) plus a lastUploadedThrough ledger: catch-up windows (capped at 7 days) can never double-send a visit. No PHI in Slack, storage keys, or on disk.
- Slack: one success line and at most one nudge per day; real errors alert immediately. Red icon badge until the next good run.
- New UI: settings toggle (default off) + Slack webhook field + "Upload to rater8 now" button.

## Founder setup
1. Re-copy dist/ to ~/Desktop/sp-client-reach-plugin, reload at chrome://extensions
2. Paste the Slack webhook in settings, tick "Auto-upload to rater8 daily", Save (seeds the ledger to yesterday so the first auto window starts after the last manual upload day)
3. Next morning: supervised "Upload to rater8 now" run, confirm the file in rater8's dashboard, then leave the alarm to it

## Open items
- Darryl (rater8, ticket #157526) owes answers on duplicate handling and an official SFTP/API channel. If an official channel appears, only the send step gets swapped.

Spec: docs/superpowers/specs/2026-07-01-rater8-auto-upload-design.md
Plan: docs/superpowers/plans/2026-07-01-rater8-auto-upload.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Founder-side verification (after merge, not executable by the engineer)

The automation Chrome is logged into neither SP nor rater8, so live verification is founder-side:

1. Re-copy `dist/` to `~/Desktop/sp-client-reach-plugin`, reload at `chrome://extensions`.
2. Open settings, paste the Slack webhook, tick "Auto-upload to rater8 daily", Save (this seeds the ledger to yesterday).
3. Next morning: click "Upload to rater8 now". Expect the ok status with a visit count, the same count in a Slack line, and the file visible in rater8's dashboard (Configure > Upload history / Diagnostics).
4. Leave it alone the following day; confirm the 7 AM behavior (silent success if SP session alive, otherwise one Slack nudge and the upload completes right after the next SP sign-in).
