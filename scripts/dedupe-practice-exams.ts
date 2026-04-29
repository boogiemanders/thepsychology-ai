#!/usr/bin/env bun
/**
 * Detects and replaces in-exam duplicate questions across examsGPT/practice-exam-*.json.
 *
 *   npx tsx scripts/dedupe-practice-exams.ts --dry-run   writes dedupe-report.json
 *   npx tsx scripts/dedupe-practice-exams.ts --apply     applies report, rewrites exams
 *   npx tsx scripts/dedupe-practice-exams.ts --validate  exits non-zero if any exam has dupes
 *
 * Detection (any one match = dupe):
 *   1. Exact normalized stem match
 *   2. Jaccard word-overlap on stem >= 0.6 (very similar stems)
 *   3. Same knId AND Jaccard(answer) >= 0.4 AND Jaccard(stem) >= 0.3 (same-KN semantic dupe)
 */

import { promises as fs } from 'fs'
import { createHash } from 'crypto'
import path from 'path'

const REPO = path.resolve(__dirname, '..')
const EXAMS_DIR = path.join(REPO, 'examsGPT')
const BANK_DIR = path.join(REPO, 'questionsGPT')
const REPORT_PATH = path.join(REPO, 'scripts', 'dedupe-report.json')

type RawQuestion = Record<string, any>

interface NormalizedQuestion {
  /** original index in exam's questions array (0-based) */
  slot: number
  /** original id field as-is (preserve on swap) */
  origId: any
  stem: string
  options: string[]
  answer: string
  knId: string | null
  domain: number | null
  scored: boolean
  raw: RawQuestion
}

interface ExamFile {
  filePath: string
  examNum: number
  schema: 'stem' | 'question'
  meta: any
  raw: RawQuestion
  questions: NormalizedQuestion[]
}

interface BankCandidate {
  bankPath: string
  bankIndex: number
  stem: string
  options: string[]
  answer: string
  kn: string | null
  domain: number | null
  raw: RawQuestion
  fingerprint: string
}

interface DupeProposal {
  examFile: string
  keepSlot: number
  keepId: any
  keepStem: string
  replaceSlot: number
  replaceId: any
  replaceStem: string
  matchMethod: 'exact' | 'jaccard' | 'knId'
  newQuestion: BankCandidate | null
  matchQuality: 'perfect' | 'relaxed-kn' | 'relaxed-domain' | 'no-match'
  notes: string
}

interface CrossExamRepeat {
  fingerprint: string
  stemPreview: string
  occurrences: { exam: number; slot: number; origId: any }[]
}

interface Report {
  generatedAt: string
  inExamProposals: DupeProposal[]
  crossExamRepeats: CrossExamRepeat[]
}

function normalizeStem(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeAnswer(s: string | null | undefined): string {
  return normalizeStem(s)
}

function fingerprint(stem: string, options: string[], answer: string): string {
  const payload = JSON.stringify({
    s: normalizeStem(stem),
    o: options.map((o) => normalizeStem(o)).sort(),
    a: normalizeAnswer(answer),
  })
  return createHash('sha256').update(payload).digest('hex')
}

function tokenize(s: string): Set<string> {
  return new Set(normalizeStem(s).split(' ').filter((w) => w.length > 2))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  const union = a.size + b.size - inter
  return inter / union
}

function parseDomain(d: any): number | null {
  if (typeof d === 'number') return d
  if (typeof d === 'string') {
    const m = d.match(/(\d+)/)
    if (m) return Number(m[1])
  }
  return null
}

function parseKn(q: RawQuestion): string | null {
  const k = q.knId ?? q.kn ?? null
  if (!k) return null
  return String(k).trim().toUpperCase()
}

function detectSchema(q: RawQuestion): 'stem' | 'question' {
  if ('stem' in q) return 'stem'
  return 'question'
}

function normalizeQuestion(raw: RawQuestion, slot: number): NormalizedQuestion {
  const schema = detectSchema(raw)
  const stem = (schema === 'stem' ? raw.stem : raw.question) ?? ''
  const answer = (schema === 'stem' ? raw.answer : raw.correct_answer) ?? ''
  const scored = raw.scored ?? raw.isScored ?? true
  return {
    slot,
    origId: raw.id,
    stem,
    options: Array.isArray(raw.options) ? raw.options : [],
    answer,
    knId: parseKn(raw),
    domain: parseDomain(raw.domain),
    scored: Boolean(scored),
    raw,
  }
}

async function loadExam(filePath: string): Promise<ExamFile> {
  const text = await fs.readFile(filePath, 'utf8')
  const raw = JSON.parse(text)
  const questionsRaw: RawQuestion[] = raw.questions ?? []
  const schema = detectSchema(questionsRaw[0] ?? {})
  const examNum = Number(path.basename(filePath).match(/practice-exam-(\d+)/)?.[1])
  const questions = questionsRaw.map((q, i) => normalizeQuestion(q, i))
  return {
    filePath,
    examNum,
    schema,
    meta: raw.meta ?? null,
    raw,
    questions,
  }
}

async function loadAllExams(): Promise<ExamFile[]> {
  const files = (await fs.readdir(EXAMS_DIR))
    .filter((f) => /^practice-exam-\d+\.json$/.test(f))
    .sort((a, b) => {
      const ai = Number(a.match(/(\d+)/)![1])
      const bi = Number(b.match(/(\d+)/)![1])
      return ai - bi
    })
  return Promise.all(files.map((f) => loadExam(path.join(EXAMS_DIR, f))))
}

async function loadBank(): Promise<BankCandidate[]> {
  const out: BankCandidate[] = []
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.name.endsWith('.json')) {
        try {
          const txt = await fs.readFile(full, 'utf8')
          const data = JSON.parse(txt)
          const arr: RawQuestion[] = Array.isArray(data) ? data : data.questions ?? []
          arr.forEach((q, i) => {
            const stem = q.stem ?? q.question ?? ''
            const options = Array.isArray(q.options) ? q.options : []
            const answer = q.answer ?? q.correct_answer ?? ''
            if (!stem || !answer || options.length === 0) return
            const dirName = path.basename(path.dirname(full))
            const inferDomain = parseDomain(dirName) ?? parseDomain(q.domain)
            out.push({
              bankPath: full,
              bankIndex: i,
              stem,
              options,
              answer,
              kn: parseKn(q),
              domain: inferDomain,
              raw: q,
              fingerprint: fingerprint(stem, options, answer),
            })
          })
        } catch (e) {
          console.warn(`skip ${full}: ${(e as Error).message}`)
        }
      }
    }
  }
  await walk(BANK_DIR)
  return out
}

function detectInExamDupes(exam: ExamFile): Array<{
  keep: NormalizedQuestion
  replace: NormalizedQuestion
  method: 'exact' | 'jaccard' | 'knId'
}> {
  const out: Array<{ keep: NormalizedQuestion; replace: NormalizedQuestion; method: any }> = []
  const tokens = exam.questions.map((q) => tokenize(q.stem))
  const replaced = new Set<number>()

  for (let i = 0; i < exam.questions.length; i++) {
    if (replaced.has(i)) continue
    const a = exam.questions[i]
    const aStem = normalizeStem(a.stem)
    const aAnsNorm = normalizeAnswer(a.answer)

    for (let j = i + 1; j < exam.questions.length; j++) {
      if (replaced.has(j)) continue
      const b = exam.questions[j]
      const bStem = normalizeStem(b.stem)
      const bAnsNorm = normalizeAnswer(b.answer)

      let method: 'exact' | 'jaccard' | 'knId' | null = null
      if (aStem && aStem === bStem) method = 'exact'
      else if (jaccard(tokens[i], tokens[j]) >= 0.6) method = 'jaccard'
      else if (a.knId && b.knId && a.knId === b.knId) {
        const ansTokensA = tokenize(a.answer)
        const ansTokensB = tokenize(b.answer)
        const stemSim = jaccard(tokens[i], tokens[j])
        if (jaccard(ansTokensA, ansTokensB) >= 0.4 && stemSim >= 0.3) method = 'knId'
      }

      if (method) {
        out.push({ keep: a, replace: b, method })
        replaced.add(j)
      }
    }
  }

  return out
}

function findReplacement(
  target: NormalizedQuestion,
  bank: BankCandidate[],
  forbiddenFingerprints: Set<string>,
): { candidate: BankCandidate; quality: DupeProposal['matchQuality']; notes: string } | null {
  const targetDomain = target.domain
  const targetKn = target.knId
  const candidates = bank.filter((c) => !forbiddenFingerprints.has(c.fingerprint))

  const tiers: Array<{ filter: (c: BankCandidate) => boolean; quality: DupeProposal['matchQuality']; notes: string }> = [
    {
      filter: (c) => c.domain === targetDomain && c.kn === targetKn && targetKn !== null,
      quality: 'perfect',
      notes: 'matched domain + knId',
    },
    {
      filter: (c) => c.domain === targetDomain,
      quality: 'relaxed-kn',
      notes: 'matched domain only (knId relaxed)',
    },
    {
      filter: () => true,
      quality: 'relaxed-domain',
      notes: 'fallback any candidate',
    },
  ]

  for (const tier of tiers) {
    const pool = candidates.filter(tier.filter)
    if (pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * pool.length)]
      return { candidate: pick, quality: tier.quality, notes: tier.notes }
    }
  }
  return null
}

function rebuildRawFromBank(
  exam: ExamFile,
  target: NormalizedQuestion,
  cand: BankCandidate,
): RawQuestion {
  const orig = target.raw
  const out: RawQuestion = { ...orig }
  if (exam.schema === 'stem') {
    out.stem = cand.stem
    out.options = cand.options
    out.answer = cand.answer
    if (cand.raw.explanation) out.explanation = cand.raw.explanation
    if (cand.kn) out.kn = cand.kn
    if (cand.raw.kn_explanation) out.kn_explanation = cand.raw.kn_explanation
    if (cand.raw.difficulty) out.difficulty = cand.raw.difficulty
    out.sourceFile = cand.bankPath
  } else {
    out.question = cand.stem
    out.options = cand.options
    out.correct_answer = cand.answer
    if (cand.raw.explanation) out.explanation = cand.raw.explanation
    if (cand.kn) out.knId = cand.kn
    if (cand.raw.difficulty) out.difficulty = cand.raw.difficulty
    out.source_file = path.basename(cand.bankPath)
    out.source_folder = path.basename(path.dirname(cand.bankPath))
  }
  return out
}

async function runDryRun() {
  console.log('Loading exams...')
  const exams = await loadAllExams()
  console.log(`Loaded ${exams.length} exams`)

  console.log('Loading question bank...')
  const bank = await loadBank()
  console.log(`Loaded ${bank.length} bank questions`)

  const fingerprintLocations = new Map<string, { exam: number; slot: number; origId: any; stemPreview: string }[]>()
  const examFingerprints = new Map<number, Set<string>>()
  for (const exam of exams) {
    const local = new Set<string>()
    for (const q of exam.questions) {
      const fp = fingerprint(q.stem, q.options, q.answer)
      local.add(fp)
      const arr = fingerprintLocations.get(fp) ?? []
      arr.push({ exam: exam.examNum, slot: q.slot, origId: q.origId, stemPreview: q.stem.slice(0, 80) })
      fingerprintLocations.set(fp, arr)
    }
    examFingerprints.set(exam.examNum, local)
  }

  const proposals: DupeProposal[] = []
  const usedReplacementFingerprints = new Set<string>()

  for (const exam of exams) {
    const dupes = detectInExamDupes(exam)
    if (dupes.length === 0) continue
    console.log(`Exam ${exam.examNum}: ${dupes.length} dupe(s)`)

    const localFps = examFingerprints.get(exam.examNum) ?? new Set()

    for (const { keep, replace, method } of dupes) {
      const forbidden = new Set<string>([...localFps, ...usedReplacementFingerprints])
      const found = findReplacement(replace, bank, forbidden)

      const proposal: DupeProposal = {
        examFile: path.relative(REPO, exam.filePath),
        keepSlot: keep.slot,
        keepId: keep.origId,
        keepStem: keep.stem.slice(0, 100),
        replaceSlot: replace.slot,
        replaceId: replace.origId,
        replaceStem: replace.stem.slice(0, 100),
        matchMethod: method,
        newQuestion: found?.candidate ?? null,
        matchQuality: found?.quality ?? 'no-match',
        notes: found?.notes ?? 'no candidate found',
      }
      proposals.push(proposal)
      if (found) usedReplacementFingerprints.add(found.candidate.fingerprint)
    }
  }

  const crossExam: CrossExamRepeat[] = []
  for (const [fp, locs] of fingerprintLocations) {
    const examsHit = new Set(locs.map((l) => l.exam))
    if (examsHit.size > 1) {
      crossExam.push({
        fingerprint: fp.slice(0, 12),
        stemPreview: locs[0].stemPreview,
        occurrences: locs,
      })
    }
  }
  crossExam.sort((a, b) => b.occurrences.length - a.occurrences.length)

  const report: Report = {
    generatedAt: new Date().toISOString(),
    inExamProposals: proposals,
    crossExamRepeats: crossExam,
  }

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`\nReport: ${path.relative(REPO, REPORT_PATH)}`)
  console.log(`In-exam dupe proposals: ${proposals.length}`)
  console.log(`  perfect      : ${proposals.filter((p) => p.matchQuality === 'perfect').length}`)
  console.log(`  relaxed-kn   : ${proposals.filter((p) => p.matchQuality === 'relaxed-kn').length}`)
  console.log(`  relaxed-domain: ${proposals.filter((p) => p.matchQuality === 'relaxed-domain').length}`)
  console.log(`  no-match     : ${proposals.filter((p) => p.matchQuality === 'no-match').length}`)
  console.log(`Cross-exam repeats: ${crossExam.length} fingerprint(s) appear in 2+ exams`)
}

async function runApply() {
  let report: Report
  try {
    report = JSON.parse(await fs.readFile(REPORT_PATH, 'utf8'))
  } catch {
    console.error(`Run --dry-run first to generate ${path.relative(REPO, REPORT_PATH)}`)
    process.exit(1)
  }

  const proposalsByFile = new Map<string, DupeProposal[]>()
  for (const p of report.inExamProposals) {
    if (p.matchQuality === 'no-match' || !p.newQuestion) continue
    const arr = proposalsByFile.get(p.examFile) ?? []
    arr.push(p)
    proposalsByFile.set(p.examFile, arr)
  }

  for (const [relFile, proposals] of proposalsByFile) {
    const filePath = path.join(REPO, relFile)
    const exam = await loadExam(filePath)
    let edits = 0
    for (const proposal of proposals) {
      const target = exam.questions[proposal.replaceSlot]
      if (!target) continue
      if (String(target.origId) !== String(proposal.replaceId)) {
        console.warn(`skip ${relFile} slot ${proposal.replaceSlot}: id changed (${target.origId} vs ${proposal.replaceId})`)
        continue
      }
      const newRaw = rebuildRawFromBank(exam, target, proposal.newQuestion as BankCandidate)
      exam.raw.questions[proposal.replaceSlot] = newRaw
      edits++
    }
    if (edits > 0) {
      await fs.writeFile(filePath, JSON.stringify(exam.raw, null, 2) + '\n')
      console.log(`${relFile}: applied ${edits} swap(s)`)
    }
  }

  console.log('\nRe-validating...')
  const examsAfter = await loadAllExams()
  let leftover = 0
  for (const exam of examsAfter) {
    const dupes = detectInExamDupes(exam)
    if (dupes.length > 0) {
      console.error(`Exam ${exam.examNum}: STILL ${dupes.length} dupe(s)`)
      leftover += dupes.length
    }
  }
  if (leftover === 0) console.log('All exams clean.')
  else process.exit(2)
}

async function runValidate() {
  const exams = await loadAllExams()
  let total = 0
  for (const exam of exams) {
    const dupes = detectInExamDupes(exam)
    if (dupes.length > 0) {
      console.error(`Exam ${exam.examNum}: ${dupes.length} dupe(s)`)
      for (const { keep, replace, method } of dupes) {
        console.error(`  [${method}] keep id=${keep.origId} / replace id=${replace.origId}`)
      }
      total += dupes.length
    }
  }
  if (total > 0) {
    console.error(`\nFAIL: ${total} in-exam duplicate(s) detected.`)
    process.exit(1)
  }
  console.log(`OK: ${exams.length} exams have no in-exam duplicates.`)
}

async function main() {
  const mode = process.argv.includes('--apply')
    ? 'apply'
    : process.argv.includes('--validate')
    ? 'validate'
    : process.argv.includes('--dry-run')
    ? 'dry-run'
    : null
  if (!mode) {
    console.error('usage: npx tsx scripts/dedupe-practice-exams.ts --dry-run | --apply | --validate')
    process.exit(1)
  }
  if (mode === 'dry-run') await runDryRun()
  else if (mode === 'apply') await runApply()
  else await runValidate()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
