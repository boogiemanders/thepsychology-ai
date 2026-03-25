#!/usr/bin/env node
/**
 * Assembles EPPP practice exams from the audited question bank.
 *
 * Primary source:  staging/review/psychprep/**
 * Fallback source: questionsGPT/**
 *
 * Usage: npx tsx scripts/assemble-practice-exams.ts
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, basename, dirname } from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StagingQuestion {
  stem: string
  options: string[]
  answer: string
  explanation?: string
  kn?: string
  difficulty?: string
  needsReview?: boolean
  inspirationDomain?: string
  [key: string]: unknown
}

interface ExamQuestion {
  id: number
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  domain: string
  knId: string
  source_file: string
  source_folder: string
  difficulty: string
  question_type: string
  isScored: boolean
  is_org_psych: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOT = process.cwd()
const STAGING_DIR = join(ROOT, 'staging', 'review', 'psychprep')
const FALLBACK_DIR = join(ROOT, 'questionsGPT')
const OUTPUT_DIR = join(ROOT, 'exams', 'practice')

// Full domain labels used in the quizzer
const DOMAIN_LABELS: Record<string, string> = {
  '1': 'Domain 1: Biological Bases of Behavior',
  '2': 'Domain 2: Cognitive-Affective Bases of Behavior',
  '3': 'Domain 3: Social Psychology & Cultural Aspects',
  '4': 'Domain 4: Growth & Lifespan Development',
  '5': 'Domain 5: Assessment, Diagnosis & Psychopathology',
  '6': 'Domain 6: Treatment & Intervention',
  '7': 'Domain 7: Research Methods & Statistics',
  '8': 'Domain 8: Ethical, Legal & Professional Issues',
}

// Per-exam question targets by domain key (total = 225)
const DOMAIN_TARGETS: Record<string, number> = {
  '1': 25,
  '2': 29,
  '3': 28,
  '4': 28,
  '5': 32,
  '6': 35,
  '7': 14,
  '8': 34,
}

// inspirationDomain string → domain key
const INSPIRATION_DOMAIN_MAP: Record<string, string> = {
  'BIOLOGICAL BASES OF BEHAVIOR': '1',
  'BIOPSYCHOLOGY': '1',
  'COGNITIVE-AFFECTIVE BASES OF BEHAVIOR': '2',
  'SOCIAL AND MULTICULTURAL BASES OF BEHAVIOR': '3',
  'SOCIAL PSYCHOLOGY': '3',
  'GROWTH AND LIFESPAN DEVELOPMENT': '4',
  'LIFESPAN DEVELOPMENT': '4',
  'ASSESSMENT AND DIAGNOSIS': '5',
  'ASSESSMENT': '5',
  'TREATMENT, INTERVENTION, AND PREVENTION': '6',
  'TREATMENT/INTERVENTION': '6',
  'TREATMENT AND INTERVENTION': '6',
  'RESEARCH METHODS AND STATISTICS': '7',
  'RESEARCH METHODS': '7',
  'ETHICAL/LEGAL/PROFESSIONAL ISSUES': '8',
  'ETHICS': '8',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function folderToDomainKey(folderName: string): string | null {
  const f = folderName.trim()
  if (f.startsWith('1 ') || f === '1') return '1'
  if (f.startsWith('2 3 5 6') || f.startsWith('2 3 5 ')) return null // I-O — route via inspirationDomain
  if (f.startsWith('2 ')) return '2'
  if (f.startsWith('3 ')) return '3'
  if (f.startsWith('4 ')) return '4'
  if (f.startsWith('5 ')) return '5'
  if (f.startsWith('6 ')) return '6'
  if (f.startsWith('7 ')) return '7'
  if (f.startsWith('8 ')) return '8'
  return null
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function walkJson(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        results.push(...walkJson(full))
      } else if (entry.endsWith('.json')) {
        results.push(full)
      }
    }
  } catch {
    // directory may not exist
  }
  return results
}

// ─── Load questions ───────────────────────────────────────────────────────────

type Pool = Record<string, StagingQuestion[]>

function loadPool(baseDir: string, skipNeedsReview: boolean): Pool {
  const pool: Pool = { '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [] }
  const files = walkJson(baseDir)

  for (const filePath of files) {
    const folderName = basename(dirname(filePath))
    let domainKey = folderToDomainKey(folderName)

    let raw: unknown
    try {
      raw = JSON.parse(readFileSync(filePath, 'utf8'))
    } catch {
      continue
    }

    const questions: StagingQuestion[] = Array.isArray(raw)
      ? (raw as StagingQuestion[])
      : Array.isArray((raw as { questions?: unknown }).questions)
        ? ((raw as { questions: StagingQuestion[] }).questions)
        : []

    for (const q of questions) {
      if (!q || typeof q !== 'object') continue
      if (!q.stem || !Array.isArray(q.options) || !q.answer) continue
      if (skipNeedsReview && q.needsReview === true) continue

      // Determine domain key
      let key = domainKey
      if (!key && q.inspirationDomain) {
        key = INSPIRATION_DOMAIN_MAP[q.inspirationDomain.toUpperCase()] ?? null
      }
      if (!key) {
        // I-O questions without inspirationDomain: split evenly to 2, 3, 5
        const fallbackDomains = ['2', '3', '5']
        const sizes = fallbackDomains.map(d => pool[d].length)
        key = fallbackDomains[sizes.indexOf(Math.min(...sizes))]
      }

      if (pool[key]) {
        pool[key].push({ ...q, _sourceFile: basename(filePath), _sourceFolder: folderName } as StagingQuestion)
      }
    }
  }

  return pool
}

// ─── Assemble one exam ────────────────────────────────────────────────────────

function assembleExam(
  stagingPool: Pool,
  fallbackPool: Pool,
  examNumber: number
): ExamQuestion[] | null {
  const drawn: Record<string, StagingQuestion[]> = {}
  const DOMAIN_KEYS = Object.keys(DOMAIN_TARGETS)

  for (const key of DOMAIN_KEYS) {
    const need = DOMAIN_TARGETS[key]
    const batch: StagingQuestion[] = []

    // Draw from staging first
    const stagingAvail = stagingPool[key]
    const stagingDraw = Math.min(need, stagingAvail.length)
    batch.push(...stagingAvail.splice(0, stagingDraw))

    // Fill remainder from fallback
    const remaining = need - batch.length
    if (remaining > 0) {
      const fallbackAvail = fallbackPool[key]
      const fallbackDraw = Math.min(remaining, fallbackAvail.length)
      batch.push(...fallbackAvail.splice(0, fallbackDraw))
    }

    if (batch.length < need) {
      console.log(`  ✗ Domain ${key} exhausted: have ${batch.length}, need ${need} — stopping`)
      return null
    }

    drawn[key] = batch
  }

  // Build flat list with scored/unscored assignment per domain
  const allQuestions: ExamQuestion[] = []
  let globalId = 1

  for (const key of DOMAIN_KEYS) {
    const batch = drawn[key]
    const scoredCount = Math.floor(batch.length * 0.8)

    for (let i = 0; i < batch.length; i++) {
      const q = batch[i]
      const isScored = i < scoredCount

      // Shuffle options, track new correct_answer
      const originalAnswer = q.answer
      const shuffledOptions = shuffle(q.options)
      const correctAnswer = shuffledOptions.includes(originalAnswer)
        ? originalAnswer
        : shuffledOptions[0] // fallback safety

      allQuestions.push({
        id: globalId++,
        question: q.stem,
        options: shuffledOptions,
        correct_answer: correctAnswer,
        explanation: (q.explanation as string) ?? '',
        domain: DOMAIN_LABELS[key],
        knId: (q.kn as string) ?? '',
        source_file: (q as { _sourceFile?: string })._sourceFile ?? '',
        source_folder: (q as { _sourceFolder?: string })._sourceFolder ?? '',
        difficulty: (q.difficulty as string) ?? 'medium',
        question_type: 'standard',
        isScored,
        is_org_psych: ((q as { _sourceFolder?: string })._sourceFolder ?? '').includes('I-O'),
      })
    }
  }

  // Shuffle all questions globally
  return shuffle(allQuestions).map((q, i) => ({ ...q, id: i + 1 }))
}

// ─── Write exam file ──────────────────────────────────────────────────────────

function writeExam(questions: ExamQuestion[], examNumber: number): void {
  const paddedNum = String(examNumber).padStart(3, '0')
  const examId = `practice-exam-${paddedNum}`
  const outPath = join(OUTPUT_DIR, `${examId}.md`)

  const frontmatter = [
    '---',
    `exam_id: ${examId}`,
    `exam_type: practice`,
    `generated_at: ${new Date().toISOString()}`,
    `question_count: ${questions.length}`,
    `version: 1`,
    `format: full`,
    `source: Assembled from audited question bank (PsychPrep 2016 Exam A references)`,
    '---',
  ].join('\n')

  const body = JSON.stringify({ questions }, null, 2)
  writeFileSync(outPath, `${frontmatter}\n${body}\n`, 'utf8')
  console.log(`  ✓ Wrote ${outPath} (${questions.length} questions)`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('Loading staging question bank (primary)…')
  const stagingPool = loadPool(STAGING_DIR, true)
  console.log('Loading root question bank (fallback)…')
  const fallbackPool = loadPool(FALLBACK_DIR, false)

  // Log supply
  console.log('\nQuestion supply per domain:')
  for (const key of Object.keys(DOMAIN_TARGETS).sort()) {
    const s = stagingPool[key].length
    const f = fallbackPool[key].length
    const target = DOMAIN_TARGETS[key]
    const maxExams = Math.floor((s + f) / target)
    console.log(
      `  Domain ${key}: ${s} staging + ${f} fallback = ${s + f} total → ~${maxExams} exams`
    )
  }

  // Find next exam number
  let examNumber = 5
  while (
    (() => {
      try {
        statSync(join(OUTPUT_DIR, `practice-exam-${String(examNumber).padStart(3, '0')}.md`))
        return true
      } catch {
        return false
      }
    })()
  ) {
    examNumber++
  }

  console.log(`\nAssembling exams starting at practice-exam-${String(examNumber).padStart(3, '0')}…\n`)

  let examsGenerated = 0
  while (true) {
    console.log(`Exam ${examNumber}:`)
    const questions = assembleExam(stagingPool, fallbackPool, examNumber)
    if (!questions) break

    // Verify correct_answer is in options for every question
    const badCount = questions.filter(q => !q.options.includes(q.correct_answer)).length
    if (badCount > 0) {
      console.warn(`  ⚠ ${badCount} questions have correct_answer not in options — skipping exam`)
      break
    }

    writeExam(questions, examNumber)
    examNumber++
    examsGenerated++
  }

  console.log(`\nDone. Generated ${examsGenerated} practice exam(s).`)

  // Dedup check across all generated exams
  if (examsGenerated > 1) {
    console.log('\nRunning dedup check…')
    const stems = new Set<string>()
    let dupeCount = 0
    const startNum = examNumber - examsGenerated
    for (let n = startNum; n < examNumber; n++) {
      const f = join(OUTPUT_DIR, `practice-exam-${String(n).padStart(3, '0')}.md`)
      const content = readFileSync(f, 'utf8')
      const jsonStart = content.indexOf('\n---\n') + 5
      const data = JSON.parse(content.slice(jsonStart)) as { questions: ExamQuestion[] }
      for (const q of data.questions) {
        if (stems.has(q.question)) dupeCount++
        stems.add(q.question)
      }
    }
    console.log(dupeCount === 0 ? '  ✓ No duplicates found' : `  ✗ ${dupeCount} duplicate questions detected!`)
  }
}

main()
