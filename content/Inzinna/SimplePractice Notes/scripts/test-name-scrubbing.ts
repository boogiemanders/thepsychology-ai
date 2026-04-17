/**
 * Smoke test for the first-name scrubbing pass added to deidentify().
 * Run: npx tsx scripts/test-name-scrubbing.ts
 */

import { deidentify, reidentify } from '../src/lib/deidentify'
import type { IntakeData } from '../src/lib/types'

// Use null intake — we're testing the unknown-name scrubbing pass, not
// intake-field masking. The first-name pass runs regardless of intake.
const intake: IntakeData | null = null

const cases: Array<{ name: string; input: string; shouldMask: string[]; shouldKeep: string[] }> = [
  {
    name: 'mid-session names not in intake',
    input: 'Client discussed his relationship with Eliana and his daughter Victoria. He also mentioned that his coworker Samir pushed back on the new plan.',
    shouldMask: ['Eliana', 'Victoria', 'Samir'],
    shouldKeep: [],
  },
  {
    name: 'first name in dictionary gets masked even without intake',
    input: 'David reported improving mood. David and his partner talked.',
    shouldMask: ['David'],
    shouldKeep: [],
  },
  {
    name: 'lowercase homographs left alone',
    input: 'She said she had hope for the future. I hope things get better.',
    shouldMask: [],
    shouldKeep: ['hope'],
  },
  {
    name: 'ambiguous Title-Case words skipped',
    input: 'Hope and Grace are feeling better. May was rough for everyone.',
    shouldMask: [],
    shouldKeep: ['Hope', 'Grace', 'May'],
  },
  {
    name: 'same name reused across text gets same token',
    input: 'Eliana called. Then Eliana called again. Eliana was worried.',
    shouldMask: ['Eliana'],
    shouldKeep: [],
  },
  {
    name: 'sentence-start common words not in names list',
    input: 'Yesterday he felt worse. Today he feels better. Anxiety has decreased.',
    shouldMask: [],
    shouldKeep: ['Yesterday', 'Today', 'Anxiety'],
  },
]

let pass = 0
let fail = 0

for (const c of cases) {
  const { sanitized, mapping } = deidentify(c.input, intake)
  const reIdentified = reidentify(sanitized, mapping)

  const errors: string[] = []

  for (const name of c.shouldMask) {
    if (sanitized.includes(name)) {
      errors.push(`expected "${name}" to be masked; still in sanitized: "${sanitized}"`)
    }
  }
  for (const word of c.shouldKeep) {
    if (!sanitized.includes(word)) {
      errors.push(`expected "${word}" to remain; missing from sanitized: "${sanitized}"`)
    }
  }

  const personTokens = Object.keys(mapping).filter((k) => k.startsWith('[PERSON_'))
  if (c.shouldMask.length > 0) {
    const expectedUniqueNames = new Set(c.shouldMask.map((n) => n.toLowerCase())).size
    if (personTokens.length !== expectedUniqueNames) {
      errors.push(`expected ${expectedUniqueNames} PERSON tokens, got ${personTokens.length}: ${personTokens.join(', ')}`)
    }
  }

  for (const name of c.shouldMask) {
    if (!reIdentified.includes(name)) {
      errors.push(`reidentify() failed to restore "${name}" — result: "${reIdentified}"`)
    }
  }

  if (errors.length) {
    fail++
    console.log(`\n❌ ${c.name}`)
    console.log(`   input:     ${c.input}`)
    console.log(`   sanitized: ${sanitized}`)
    console.log(`   mapping:   ${JSON.stringify(mapping)}`)
    errors.forEach((e) => console.log(`   - ${e}`))
  } else {
    pass++
    console.log(`\nPASS ${c.name}`)
    console.log(`   sanitized: ${sanitized}`)
    if (personTokens.length) console.log(`   tokens:    ${personTokens.map((t) => `${t}→${mapping[t]}`).join(', ')}`)
  }
}

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail > 0 ? 1 : 0)
