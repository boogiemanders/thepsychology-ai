// Runs the merge engine against the real report exports in ~/Downloads and
// prints aggregate stats only (no client data). Compares against expected
// counts from the validated Python prototype.
//
// Usage: node test/run-merge.mjs [attendance.csv] [details.csv]

import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { homedir } from 'os'
import { join } from 'path'

// build lib to a temp importable module
execSync('npx esbuild src/lib/merge.ts --bundle --format=esm --outfile=test/.merge.bundle.mjs', {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'inherit',
})
const { mergeReports, rater8Rows } = await import('./.merge.bundle.mjs')

const attPath = process.argv[2] ?? join(homedir(), 'Downloads', 'client_attendance_report.csv')
const detPath = process.argv[3] ?? join(homedir(), 'Downloads', 'client_details_report (3).csv')

if (!existsSync(attPath) || !existsSync(detPath)) {
  console.log('SKIP: report CSVs not found at', attPath, detPath)
  process.exit(0)
}

const { rows, rater8, stats } = mergeReports(readFileSync(attPath, 'utf8'), readFileSync(detPath, 'utf8'))

const byLocation = {}
for (const r of rows) byLocation[r.location] = (byLocation[r.location] ?? 0) + 1
const byMatch = {}
for (const r of rows) byMatch[r.match] = (byMatch[r.match] ?? 0) + 1

console.log('stats:', stats)
console.log('locations:', byLocation)
console.log('match types:', byMatch)
console.log('rater8 rows (one per visit):', rater8.length)
// every rater8 row must be a seen visit with a way to reach the person
const badStatus = rater8.filter((r) => r[7] !== 'Show').length
const noContact = rater8.filter((r) => !r[2] && !r[3]).length

// sanity assertions against the known 5/11-6/11 exports
let failures = 0
function expect(label, actual, predicate, want) {
  if (!predicate) {
    console.error(`FAIL ${label}: got ${actual}, want ${want}`)
    failures++
  }
}
expect('appointments', stats.appointments, stats.appointments === 680, '680')
expect('attendance clients', stats.attendanceClients, stats.attendanceClients === 193, '193')
expect('exact matches', byMatch['exact'] ?? 0, (byMatch['exact'] ?? 0) === 181, '181')
expect(
  'couple members found',
  byMatch['couple_member'] ?? 0,
  (byMatch['couple_member'] ?? 0) >= 4,
  '>=4 (couples split into members)'
)
// 26 Manhattan clients in the raw report, +1 because a Manhattan couple expands to 2 rows
expect('manhattan', byLocation['Manhattan'] ?? 0, (byLocation['Manhattan'] ?? 0) === 27, '27')
expect(
  'no row lost',
  stats.rows,
  stats.rows >= 193,
  '>=193 (couples expand to more rows, never fewer)'
)
expect('rater8 all seen', badStatus, badStatus === 0, '0 rows with status != Show')
expect('rater8 all reachable', noContact, noContact === 0, '0 rows missing phone+email')
expect(
  'rater8 columns',
  rater8[0]?.length,
  rater8[0]?.length === 8,
  '8 (First,Last,Email,Cell,Provider,Location,Date,Status)'
)

if (failures) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed.')
