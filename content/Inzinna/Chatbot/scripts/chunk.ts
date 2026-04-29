#!/usr/bin/env bun
// Chunker: reads DIPS-Clinic-Manual.md + DIPS-Employee-Handbook.txt,
// splits on headings / section numbers, emits kb.jsonl matching KB-OUTLINE schema.

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

type Category = 'faq' | 'booking' | 'billing' | 'crisis' | 'compliance' | 'hr' | 'benefits' | 'how-to' | 'brand'
type Audience = 'clinician' | 'admin' | 'supervisor' | 'all-staff' | 'new-staff'

interface Chunk {
  id: string
  doc: 'clinic-manual' | 'employee-handbook' | 'brand-strategy'
  title: string
  category: Category
  audience: Audience
  content: string
  links: string[]
  related: string[]
}

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = join(SCRIPT_DIR, '..')
const MANUAL = join(ROOT, 'DIPS-Clinic-Manual.md')
const HANDBOOK = join(ROOT, 'DIPS-Employee-Handbook.txt')
const BRAND = join(ROOT, 'Inzinna-Brand-Strategy.md')
const OUT = join(ROOT, 'out', 'kb.jsonl')

// ----- Category mappings (from KB-OUTLINE.md) ------------------------------

// Keys are substring matches against the chunk title (case-insensitive).
// Default category is "faq" for manual, "hr" for handbook.
const MANUAL_CATEGORY: Array<[RegExp, Category, Audience]> = [
  [/mandated report|child abuse|adult protective|emergency.*crisis|crisis protocol/i, 'crisis', 'clinician'],
  [/cancellation policy|sample script.*cancellation|cpt code|billing|financial/i, 'billing', 'clinician'],
  [/patient booking|receive booking|create client|intake form|review email|schedule the appointment|input all information|verification of benefits/i, 'booking', 'admin'],
  [/hipaa|confidentiality|telehealth|ai usage|dual relation|boundaries|ethical principle|risk management|informed consent|record retention|referral and exclusion/i, 'compliance', 'clinician'],
  [/simple practice|justworks|zocdoc|termination|psychiatric consultation|referral resources|grievance|documentation standard|progress note|notetaker|scope of care/i, 'how-to', 'all-staff'],
  [/supervision/i, 'faq', 'clinician'],
]

const HANDBOOK_CATEGORY: Array<[RegExp, Category, Audience]> = [
  [/401|dental|health insurance|jury duty|military|vision|workers|nursing|domestic violence|crime victim|disability benefit|paid family|prenatal|sick leave|voting/i, 'benefits', 'all-staff'],
  [/ethic|conflict of interest|standard of conduct|eeo|harassment|reproductive|sexual harassment|computer security|social media|privacy|nonsolicit|off-duty|criminal activity|airborne/i, 'compliance', 'all-staff'],
  [/welcome|at-will|about the company|mission|organization|revision/i, 'hr', 'all-staff'],
]

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[*#_`]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-().&,]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function clean(s: string): string {
  // Strip markdown syntax noise, collapse whitespace.
  return s
    .replace(/\\([*_()\[\]])/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractLinks(content: string): string[] {
  const links: string[] = []
  // phone numbers
  const phones = content.match(/\b1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g) || []
  // urls
  const urls = content.match(/https?:\/\/[^\s)\]}]+/g) || []
  // emails
  const emails = content.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []
  return [...new Set([...phones, ...urls, ...emails])]
}

function pickCategory(
  title: string,
  table: Array<[RegExp, Category, Audience]>,
  fallback: [Category, Audience]
): [Category, Audience] {
  for (const [rx, c, a] of table) {
    if (rx.test(title)) return [c, a]
  }
  return fallback
}

// ----- Clinic Manual chunker ----------------------------------------------

function chunkManual(): Chunk[] {
  const src = readFileSync(MANUAL, 'utf8')
  const lines = src.split('\n')

  // Skip TOC: find the first real heading (first line matching `^# ... {#anchor}` after line 200).
  let startIdx = lines.findIndex((line, i) => i > 200 && /^#{1,3} .+\{#[\w\-&(),.]+\}/.test(line))
  if (startIdx < 0) startIdx = 0

  const headingRx = /^(#{1,3})\s+(.+?)\s*\{#([^}]+)\}\s*$/

  interface RawChunk {
    level: number
    id: string
    title: string
    bodyLines: string[]
  }
  const raw: RawChunk[] = []
  let current: RawChunk | null = null

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(headingRx)
    if (m) {
      if (current) raw.push(current)
      const title = m[2].replace(/\*\*/g, '').trim()
      const id = m[3].replace(/[^a-z0-9\-]/gi, '-').replace(/-+/g, '-').toLowerCase()
      current = { level: m[1].length, id, title, bodyLines: [] }
    } else if (current) {
      current.bodyLines.push(line)
    }
  }
  if (current) raw.push(current)

  // Filter out empty / skeletal chunks
  const chunks: Chunk[] = []
  for (const r of raw) {
    const content = clean(r.bodyLines.join('\n'))
    if (!r.title || content.length < 40) continue
    const [category, audience] = pickCategory(r.title, MANUAL_CATEGORY, ['faq', 'all-staff'])
    chunks.push({
      id: r.id,
      doc: 'clinic-manual',
      title: r.title,
      category,
      audience,
      content,
      links: extractLinks(content),
      related: [],
    })
  }
  return chunks
}

// ----- Handbook chunker (PDF text) ----------------------------------------

function chunkHandbook(): Chunk[] {
  const src = readFileSync(HANDBOOK, 'utf8')
  const lines = src.split('\n')

  // Skip TOC: first actual content after "Core Policies" header line.
  // Heuristic: TOC lines contain trailing page numbers and a long run of spaces.
  // Find index of first `1.0 Welcome` that's NOT the TOC entry.
  // Strategy: find second occurrence of `/^\s*1\.0\s+Welcome\b/i`
  const welcomeIdxs: number[] = []
  lines.forEach((l, i) => {
    if (/^\s*1\.0\s+Welcome\b/i.test(l)) welcomeIdxs.push(i)
  })
  const startIdx = welcomeIdxs.length >= 2 ? welcomeIdxs[1] : 70

  // Section patterns:
  // - Numeric subsection: "  1.1 A Welcome Policy" (leading spaces)
  // - Numeric main section: "1.0 WELCOME" (all caps, no leading)
  // - NY Policies: plain-text headings like "Paid Family Leave" on their own line
  //
  // For chunking, we want **subsections** as chunks (1.1, 1.2, ..., 3.1, etc.).
  // For NY section (no numeric prefix), we use the unnumbered headings.

  // Known NY-section heading list (from TOC + KB-OUTLINE). Used for detection.
  const NY_HEADINGS = [
    'Communications Regarding Religious or Political Matters',
    'EEO Statement and Nonharassment Policy',
    'Reproductive Health Rights Notice',
    'Sexual Harassment Prevention',
    'Accommodations for Nursing Mothers',
    'Meal Periods',
    'Overtime',
    'Pay Period',
    'Accommodations for Victims of Domestic Violence',
    'Crime Victim and Witness Leave',
    'Disability Benefits',
    'Jury Duty Leave',
    'Paid Family Leave',
    'Paid Prenatal Personal Leave',
    'Paid Sick Leave (Accrual Method)',
    'Paid Sick Leave (Frontloading Method)',
    'Voting Leave',
    'Airborne Infectious Disease Exposure Prevention Plan',
  ]

  interface RawChunk {
    id: string
    title: string
    bodyLines: string[]
  }
  const raw: RawChunk[] = []
  let current: RawChunk | null = null

  const subRx = /^\s*(\d+\.\d+)\s+(.+?)\s*$/
  const mainRx = /^\s*(\d+\.0)\s+([A-Z][A-Z ,\/()&]+)\s*$/

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    // Skip lines that are pure page footers like " 34 " or "                                34"
    if (/^\s*\d+\s*$/.test(line)) continue
    // Skip lines that are obvious page headers/footers
    if (/^\s*CLOSING STATEMENT|ACKNOWLEDGMENT|APPENDIX\s*$/.test(line)) break

    const sub = line.match(subRx)
    const main = line.match(mainRx)
    const nyMatch = NY_HEADINGS.find(h => line.trim() === h)

    if (sub) {
      if (current) raw.push(current)
      const title = sub[2].trim()
      current = { id: `${sub[1]}-${slug(title)}`, title, bodyLines: [] }
    } else if (main && !sub) {
      // Main section line — record but don't chunk (subsections carry content).
      // If a main section has no subsections (rare), we'd miss it — that's fine for MVP.
      continue
    } else if (nyMatch) {
      if (current) raw.push(current)
      current = { id: `ny-${slug(nyMatch)}`, title: nyMatch, bodyLines: [] }
    } else if (current) {
      current.bodyLines.push(line)
    }
  }
  if (current) raw.push(current)

  const chunks: Chunk[] = []
  for (const r of raw) {
    const content = clean(r.bodyLines.join('\n'))
    if (!r.title || content.length < 40) continue
    const [category, audience] = pickCategory(r.title, HANDBOOK_CATEGORY, ['hr', 'all-staff'])
    chunks.push({
      id: r.id,
      doc: 'employee-handbook',
      title: r.title,
      category,
      audience,
      content,
      links: extractLinks(content),
      related: [],
    })
  }
  return chunks
}

// ----- Brand Strategy chunker ---------------------------------------------

function chunkBrand(): Chunk[] {
  const src = readFileSync(BRAND, 'utf8')
  const lines = src.split('\n')
  const headingRx = /^##\s+(.+?)\s*\{#([^}]+)\}\s*$/

  interface RawChunk { id: string; title: string; bodyLines: string[] }
  const raw: RawChunk[] = []
  let current: RawChunk | null = null

  for (const line of lines) {
    const m = line.match(headingRx)
    if (m) {
      if (current) raw.push(current)
      const title = m[1].replace(/\*\*/g, '').trim()
      const id = `brand-${m[2].replace(/[^a-z0-9\-]/gi, '-').replace(/-+/g, '-').toLowerCase()}`
      current = { id, title, bodyLines: [] }
    } else if (current) {
      current.bodyLines.push(line)
    }
  }
  if (current) raw.push(current)

  const chunks: Chunk[] = []
  for (const r of raw) {
    const content = clean(r.bodyLines.join('\n'))
    if (!r.title || content.length < 40) continue
    chunks.push({
      id: r.id,
      doc: 'brand-strategy',
      title: r.title,
      category: 'brand',
      audience: 'all-staff',
      content,
      links: extractLinks(content),
      related: [],
    })
  }
  return chunks
}

// ----- Main ----------------------------------------------------------------

const manualChunks = chunkManual()
const handbookChunks = chunkHandbook()
const brandChunks = chunkBrand()
const all = [...manualChunks, ...handbookChunks, ...brandChunks]

// De-dupe by id (later wins; shouldn't happen but guard anyway)
const seen = new Map<string, Chunk>()
for (const c of all) seen.set(c.id, c)
const dedup = [...seen.values()]

writeFileSync(OUT, dedup.map(c => JSON.stringify(c)).join('\n') + '\n')

const byCat = dedup.reduce<Record<string, number>>((acc, c) => {
  acc[c.category] = (acc[c.category] || 0) + 1
  return acc
}, {})

console.log(`Wrote ${dedup.length} chunks to ${OUT}`)
console.log(`  manual: ${manualChunks.length}  handbook: ${handbookChunks.length}  brand: ${brandChunks.length}`)
console.log(`  categories:`, byCat)
