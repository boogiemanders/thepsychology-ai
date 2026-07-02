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
assert.deepEqual(lib.owedWindow('2026-06-29', now), { start: '2026-06-28', end: '2026-06-30' }) // widened to the 2-day overlap
assert.deepEqual(lib.owedWindow(null, now), { start: '2026-06-28', end: '2026-06-30' }) // first run also widened
assert.deepEqual(lib.owedWindow('2026-06-01', now), { start: '2026-06-24', end: '2026-06-30' }) // capped at 7 days
assert.deepEqual(lib.owedWindow('2026-06-25', now), { start: '2026-06-26', end: '2026-06-30' }) // catch-up, already earlier than the overlap
assert.equal(lib.owedWindow('2026-06-30', now), null) // up to date
assert.equal(lib.owedWindow('2026-07-05', now), null) // future-safe
assert.deepEqual(lib.owedWindow('2026-06-29', now, '2026-06-29'), { start: '2026-06-30', end: '2026-06-30' }) // floor beats overlap
assert.deepEqual(lib.owedWindow('2026-06-29', now, '2026-06-27'), { start: '2026-06-28', end: '2026-06-30' }) // floor earlier than overlap, overlap wins

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

const successFalse = JSON.stringify({ success: false, unAuthorizedRequest: false })
const successFalseVerdict = lib.evaluateUpload([store(successFalse, 200)])
assert.equal(successFalseVerdict.ok, false)
assert.equal(successFalseVerdict.loggedOut, false)
assert.ok(successFalseVerdict.detail.includes('success false')) // 2xx but success:false gets honest copy, not "HTTP 200"

// ---- filenames + report urls ----
assert.equal(lib.csvFilename('2026-06-30', '2026-06-30'), 'rater8_2026-06-30_to_2026-06-30.csv')
const urls = lib.reportUrls('2026-06-24', '2026-06-30')
assert.ok(urls[0].includes('client-attendance-report-rows.csv'))
assert.ok(urls[0].includes('2026-06-24') && urls[0].includes('2026-06-30'))
assert.ok(urls[1].includes('client-details-report-rows.csv'))

console.log('PASS run-rater8-upload: all assertions passed')
