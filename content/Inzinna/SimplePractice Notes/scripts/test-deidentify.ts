/**
 * Round-trip test for the full deidentify() / reidentify() pipeline.
 *
 * Simulates the exact production payload from soap-llm.ts:221 (combined
 * clinician notes + transcript) against a realistic intake, then asserts:
 *   1. No original PHI value survives in the sanitized string.
 *   2. Re-identifiable tokens (names, dates, addresses, providers) round-trip
 *      back to the original values.
 *   3. Stripped categories (phone, email, SSN, MRN, insurance, group,
 *      emergency contact, client ID) never reappear after reidentify — by
 *      design, those are one-way.
 *
 * Run: npx tsx scripts/test-deidentify.ts
 */

import { deidentify, reidentify } from '../src/lib/deidentify'
import { EMPTY_INTAKE, type IntakeData } from '../src/lib/types'

const intake: IntakeData = {
  ...EMPTY_INTAKE,
  fullName: 'John Smith',
  firstName: 'John',
  lastName: 'Smith',
  dob: '1985-03-12',
  phone: '(212) 555-1234',
  email: 'john.smith@gmail.com',
  address: {
    street: '123 Main St',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    country: 'USA',
    raw: '123 Main St, Brooklyn, NY 11201',
  },
  emergencyContact: 'Jane Doe',
  insuranceCompany: 'Aetna',
  memberId: 'A123456789',
  groupNumber: 'G001',
  occupation: 'Software Engineer at Google Inc headquarters',
  signedBy: 'Dr. Inzinna',
  prescribingMD: 'Dr. Patel',
  primaryCarePhysician: 'Dr. Williams',
  formDate: '2026-04-20',
  signedAt: '2026-04-20T10:00:00Z',
  clientId: 'SP999',
}

// Mirrors the combined narrative built in soap-llm.ts before it hits OpenAI.
const composite = [
  '=== CLINICIAN LOOSE NOTES ===',
  'Met with John Smith (DOB 1985-03-12) on 03/15/2026. Lives at 123 Main St, Brooklyn, NY 11201.',
  'Occupation: Software Engineer at Google Inc headquarters.',
  'Phone (212) 555-1234. Email john.smith@gmail.com. Aetna, member A123456789, group G001.',
  'Marriage w/ Maria, kid Aiden. Emergency contact: Jane Doe.',
  '',
  '=== TRANSCRIPT ===',
  'Clinician: How have you been, John?',
  'Client: Better. Maria and Aiden helped a lot. Dr. Williams cleared me to exercise.',
  'Client: Dr. Patel adjusted my med last month. Dr. Inzinna is my psychiatrist.',
  'Client: FYI old SSN on a doc: 123-45-6789. Old phone 415-555-9999. DOB is 03/12/1985.',
  'Client: You can reach me at other@example.com.',
].join('\n')

// Original PHI values that must NOT survive in sanitized text.
const mustNotSurvive: string[] = [
  'John Smith',
  'Smith',
  '1985-03-12',
  '03/12/1985',
  '(212) 555-1234',
  '212-555-1234',
  'john.smith@gmail.com',
  'other@example.com',
  '123 Main St',
  'Brooklyn',
  '11201',
  'Jane Doe',
  'Aetna',
  'A123456789',
  'G001',
  '123-45-6789',
  '415-555-9999',
  'Dr. Patel',
  'Dr. Williams',
  'Dr. Inzinna',
  'Maria',
  'Aiden',
  'Software Engineer at Google Inc headquarters',
  'SP999',
  '03/15/2026',
  '2026-04-20',
]

// Values that must be restored by reidentify (tokenized, not stripped).
const mustRoundTrip: string[] = [
  'John Smith',
  '1985-03-12',
  '123 Main St',
  'Brooklyn',
  '11201',
  'Dr. Patel',
  'Dr. Williams',
  'Dr. Inzinna',
  'Maria',
  'Aiden',
  'Software Engineer at Google Inc headquarters',
  '03/15/2026',
]

// Values that must stay gone even after reidentify (stripped, not tokenized).
const mustStayStripped: string[] = [
  '(212) 555-1234',
  '212-555-1234',
  '415-555-9999',
  'john.smith@gmail.com',
  'other@example.com',
  '123-45-6789',
  'Jane Doe',
  'Aetna',
  'A123456789',
  'G001',
  'SP999',
]

const errors: string[] = []
const { sanitized, mapping } = deidentify(composite, intake)

for (const leak of mustNotSurvive) {
  if (sanitized.includes(leak)) {
    errors.push(`LEAK in sanitized: "${leak}"`)
  }
}

const reidentified = reidentify(sanitized, mapping)

for (const want of mustRoundTrip) {
  if (!reidentified.includes(want)) {
    errors.push(`round-trip FAILED to restore: "${want}"`)
  }
}

for (const stripped of mustStayStripped) {
  if (reidentified.includes(stripped)) {
    errors.push(`stripped value leaked after reidentify: "${stripped}"`)
  }
}

console.log('\n=== SANITIZED OUTPUT (what OpenAI sees) ===')
console.log(sanitized)
console.log('\n=== MAPPING ===')
console.log(JSON.stringify(mapping, null, 2))
console.log('\n=== REIDENTIFIED OUTPUT (what clinician sees) ===')
console.log(reidentified)

if (errors.length) {
  console.log(`\n${errors.length} error(s):`)
  errors.forEach((e) => console.log(`  - ${e}`))
  process.exit(1)
}

console.log(`\nPASS — no PHI leaks, all tokenized values round-trip, all stripped values stay gone.`)
process.exit(0)
