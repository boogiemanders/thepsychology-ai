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
const { mergeReports } = await import('./.merge.bundle.mjs')

let failures = 0
function expect(label, actual, predicate, want) {
  if (!predicate) {
    console.error(`FAIL ${label}: got ${actual}, want ${want}`)
    failures++
  }
}

// ---- always-on unit test: JSON details, deep-link ids, minor/guardian contact ----
// Synthetic data (no PHI). Aidem (minor, own contact blank "--", parent contact present),
// Jane (adult, own contact), Alexa (minor, own contact "--", parent present).
{
  const attendance = [
    'client_name,date_of_service,office_name,status,clinician_name',
    '"3 clients,2 clinicians",,,,', // summary row SP injects under the header -> skipped
    'Aidem Falconer,06/02/2026,Manhattan,Show,Dr. Smith',
    'Aidem Falconer,06/09/2026,Manhattan,Show,Dr. Smith',
    'Jane Adult,06/03/2026,Video Office,Show,Dr. Jones',
    'Alexa Wengrod,06/04/2026,Video Office,Show,Dr. Jones',
  ].join('\n')
  const details = JSON.stringify({
    data: [
      {
        // mirrors the real SP record: a minor with an OWN phone on file but NO
        // email; the parent contact lives in contact* — the parent's contact must win
        id: '101841052-aaa111deadbeef',
        type: 'clientDetailsReportRows',
        attributes: {
          hashedId: 'aaa111deadbeef',
          clientName: 'Aidem Falconer',
          clientType: 'Minor',
          contactName: 'Carinda Greene',
          contactPhone: '(917) 334-5760',
          contactEmail: 'carinda@gmail.com',
          phoneNumber: '(347) 421-9750',
          email: '--',
          clinicianName: 'Dr. Smith',
          clinicianId: 1428233,
          lastAppointmentDate: '2026-06-09',
        },
      },
      {
        id: '202-bbb222',
        type: 'clientDetailsReportRows',
        attributes: {
          hashedId: 'bbb222',
          clientName: 'Jane Adult',
          clientType: 'Adult',
          contactName: '--',
          contactPhone: '--',
          contactEmail: '--',
          phoneNumber: '(212) 555-0100',
          email: 'jane@example.com',
          clinicianName: 'Dr. Jones',
          clinicianId: 9999999,
          lastAppointmentDate: '2026-06-03',
        },
      },
      {
        id: '303-ccc333',
        type: 'clientDetailsReportRows',
        attributes: {
          hashedId: 'ccc333',
          clientName: 'Alexa Wengrod',
          clientType: 'Minor',
          contactName: 'Justine Wengrod',
          contactPhone: '--',
          contactEmail: 'justine@example.com',
          phoneNumber: '--',
          email: '--',
          clinicianName: 'Dr. Jones',
          clinicianId: 9999999,
          lastAppointmentDate: '2026-06-04',
        },
      },
    ],
  })

  const r = mergeReports(attendance, details)
  const aidem = r.rows.find((x) => x.clientName === 'Aidem Falconer')
  const jane = r.rows.find((x) => x.clientName === 'Jane Adult')
  const alexa = r.rows.find((x) => x.clientName === 'Alexa Wengrod')

  expect('json appts (summary row skipped)', r.stats.appointments, r.stats.appointments === 4, '4')
  expect('json detail clients', r.stats.detailClients, r.stats.detailClients === 3, '3')
  expect('deep-link id (minor)', aidem?.clientId, aidem?.clientId === 'aaa111deadbeef', 'aaa111deadbeef')
  expect('deep-link id (adult)', jane?.clientId, jane?.clientId === 'bbb222', 'bbb222')
  expect('minor uses guardian phone', aidem?.phone, aidem?.phone === '(917) 334-5760', 'guardian phone')
  expect('minor uses guardian email', aidem?.email, aidem?.email === 'carinda@gmail.com', 'guardian email')
  expect('minor note names parent', aidem?.note, aidem?.note === 'parent: Carinda Greene', 'parent: Carinda Greene')
  expect('adult keeps own phone', jane?.phone, jane?.phone === '(212) 555-0100', 'own phone')
  expect('adult has no parent note', jane?.note, jane?.note === '', 'empty note')
  expect('guardian w/ only email works', alexa?.email, alexa?.email === 'justine@example.com', 'guardian email')
  expect('guardian fallback count', r.stats.guardianFallback, r.stats.guardianFallback === 2, '2')
  expect('all reachable (0 missing)', r.stats.missingContact, r.stats.missingContact === 0, '0')

  // rater8 feed: 2 visits for the minor, carrying the guardian's contact
  const aidemRater8 = r.rater8.filter((row) => row[0] === 'Aidem' && row[1] === 'Falconer')
  expect('minor rater8 rows = visits', aidemRater8.length, aidemRater8.length === 2, '2')
  expect(
    'minor rater8 carries guardian email',
    aidemRater8[0]?.[2],
    aidemRater8.every((row) => row[2] === 'carinda@gmail.com'),
    'carinda@gmail.com on every row'
  )

  // Provider ID column: clinicianId joined by the appointment's clinician name (index 5)
  expect('rater8 has Provider ID column (9 cols)', r.rater8[0]?.length, r.rater8[0]?.length === 9, '9')
  expect(
    'Provider ID populated for known provider',
    aidemRater8[0]?.[5],
    aidemRater8.every((row) => row[5] === '1428233'),
    '1428233 on every Aidem (Dr. Smith) row'
  )
  console.log(failures ? '' : 'JSON/guardian unit test: passed')
}

// ---- regression: BOM-prefixed JSON parses; a blank hashedId yields no link ----
{
  const attendance = [
    'client_name,date_of_service,office_name,status,clinician_name',
    'No Id,06/05/2026,Manhattan,Show,Dr. Smith',
  ].join('\n')
  const bomJson =
    '﻿' +
    JSON.stringify({
      data: [
        {
          id: '404---', // numericId then a blank-marker hashedId portion
          type: 'clientDetailsReportRows',
          attributes: {
            hashedId: '--', // SP blank marker, not a real id
            clientName: 'No Id',
            clientType: 'Adult',
            phoneNumber: '(212) 555-0199',
            email: 'noid@example.com',
            contactName: '--',
            contactPhone: '--',
            contactEmail: '--',
          },
        },
      ],
    })
  const r = mergeReports(attendance, bomJson)
  const noId = r.rows.find((x) => x.clientName === 'No Id')
  expect('BOM JSON still parses', r.stats.detailClients, r.stats.detailClients === 1, '1')
  expect('blank hashedId -> no deep link', noId?.clientId, noId?.clientId === '', 'empty clientId')
}

const attPath = process.argv[2] ?? join(homedir(), 'Downloads', 'client_attendance_report.csv')
const detPath = process.argv[3] ?? join(homedir(), 'Downloads', 'client_details_report (3).csv')

if (!existsSync(attPath) || !existsSync(detPath)) {
  console.log('SKIP: reference report CSVs not found at', attPath, detPath)
  if (failures) {
    console.error(`\n${failures} check(s) failed`)
    process.exit(1)
  }
  console.log('\nAll checks passed.')
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
const badStatus = rater8.filter((r) => r[8] !== 'Show').length
const noContact = rater8.filter((r) => !r[2] && !r[3]).length

// sanity assertions against the known 5/11-6/11 exports (CSV details path)
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
  rater8[0]?.length === 9,
  '9 (First,Last,Email,Cell,Provider,Provider ID,Location,Date,Status)'
)

if (failures) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed.')
