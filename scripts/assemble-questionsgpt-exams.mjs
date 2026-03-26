#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const QUESTIONS_DIR = path.join(ROOT, 'questionsGPT')
const PRACTICE_OUTPUT_DIR = path.join(ROOT, 'examsGPT')
const DIAGNOSTIC_OUTPUT_DIR = path.join(ROOT, 'diagnosticGPT')
const KNS_CANDIDATE_PATHS = ['KNs.md', 'Kns.md']

const DEFAULT_TYPE = 'practice'
const DEFAULT_COUNT = 4

const DOMAIN_LABELS = {
  1: 'Domain 1: Biological Bases of Behavior',
  2: 'Domain 2: Cognitive-Affective Bases of Behavior',
  3: 'Domain 3: Social Psychology & Cultural Aspects',
  4: 'Domain 4: Growth & Lifespan Development',
  5: 'Domain 5: Assessment, Diagnosis & Psychopathology',
  6: 'Domain 6: Treatment & Intervention',
  7: 'Domain 7: Research Methods & Statistics',
  8: 'Domain 8: Ethical, Legal & Professional Issues',
}

// These targets match the repo's documented 225-question distribution in EXAM_GENERATION_GUIDE.md.
const PRACTICE_DOMAIN_TARGETS = {
  1: 23,
  2: 29,
  3: 25,
  4: 27,
  5: 36,
  6: 34,
  7: 16,
  8: 35,
}

const PRACTICE_SCORED_TARGETS = {
  1: 18,
  2: 23,
  3: 20,
  4: 22,
  5: 29,
  6: 27,
  7: 13,
  8: 28,
}

function parseArgs(argv) {
  const options = {
    type: DEFAULT_TYPE,
    count: DEFAULT_COUNT,
    dryRun: false,
    seed: Date.now(),
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--type' && argv[i + 1]) {
      options.type = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--count' && argv[i + 1]) {
      options.count = Number.parseInt(argv[i + 1], 10)
      i += 1
      continue
    }
    if (arg === '--seed' && argv[i + 1]) {
      options.seed = Number.parseInt(argv[i + 1], 10)
      i += 1
      continue
    }
    if (arg === '--dry-run') {
      options.dryRun = true
    }
  }

  if (!['practice', 'diagnostic', 'both'].includes(options.type)) {
    throw new Error(`Invalid --type "${options.type}". Use practice, diagnostic, or both.`)
  }

  if (!Number.isInteger(options.count) || options.count <= 0) {
    throw new Error(`Invalid --count "${options.count}". Use a positive integer.`)
  }

  if (!Number.isInteger(options.seed)) {
    throw new Error(`Invalid --seed "${options.seed}". Use an integer.`)
  }

  return options
}

function resolveKnPath() {
  for (const candidate of KNS_CANDIDATE_PATHS) {
    const fullPath = path.join(ROOT, candidate)
    if (fs.existsSync(fullPath)) return fullPath
  }
  throw new Error(`Could not find any KN markdown file. Tried: ${KNS_CANDIDATE_PATHS.join(', ')}`)
}

function parseKnCatalog(markdown) {
  const domains = new Map()
  let currentDomain = null

  for (const line of markdown.split(/\r?\n/)) {
    const domainMatch = line.match(/^##\s+(\d+)\.\s+(.+?)\s+\((\d+)%\)/)
    if (domainMatch) {
      const domainId = Number.parseInt(domainMatch[1], 10)
      currentDomain = domainId
      domains.set(domainId, {
        id: domainId,
        name: domainMatch[2].trim(),
        weight: Number.parseInt(domainMatch[3], 10),
        kns: [],
      })
      continue
    }

    const knMatch = line.match(/^- \*\*(KN\d{1,2})\.\*\*\s+(.*)$/)
    if (knMatch && currentDomain) {
      const domain = domains.get(currentDomain)
      domain.kns.push({
        id: knMatch[1],
        description: knMatch[2].trim(),
      })
    }
  }

  if (domains.size !== 8) {
    throw new Error(`Expected 8 domains in KN markdown, found ${domains.size}`)
  }

  return domains
}

function walkJsonFiles(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkJsonFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath)
    }
  }
  return results.sort()
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function normalizeStem(stem) {
  return String(stem || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function hashString(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(items, rng) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

function difficultyWeight(difficulty) {
  if (difficulty === 'hard') return 3
  if (difficulty === 'medium') return 2
  return 1
}

function domainFromKn(knId) {
  const value = Number.parseInt(String(knId || '').replace('KN', ''), 10)
  if (value >= 1 && value <= 5) return 1
  if (value >= 6 && value <= 13) return 2
  if (value >= 14 && value <= 20) return 3
  if (value >= 21 && value <= 28) return 4
  if (value >= 29 && value <= 41) return 5
  if (value >= 42 && value <= 52) return 6
  if (value >= 53 && value <= 60) return 7
  if (value >= 61 && value <= 71) return 8
  return null
}

function getQuestionArray(raw) {
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.questions)) return raw.questions
  return []
}

function createQuestionBucketMap(knCatalog) {
  const buckets = new Map()
  for (const [domainId, domain] of knCatalog.entries()) {
    const knMap = new Map()
    for (const kn of domain.kns) {
      knMap.set(kn.id, [])
    }
    buckets.set(domainId, knMap)
  }
  return buckets
}

function loadQuestionBank(knCatalog) {
  const buckets = createQuestionBucketMap(knCatalog)
  const seenStems = new Set()
  let skippedInvalid = 0
  let skippedDuplicate = 0

  for (const filePath of walkJsonFiles(QUESTIONS_DIR)) {
    const sourceFile = path.basename(filePath)
    const sourceFolder = path.basename(path.dirname(filePath))
    const raw = readJson(filePath)
    const questions = getQuestionArray(raw)

    for (const question of questions) {
      const stem = String(question?.stem || '').trim()
      const options = Array.isArray(question?.options) ? question.options.map(String) : []
      const answer = String(question?.answer || '')
      const knId = String(question?.kn || question?.knId || '')
      const domainId = domainFromKn(knId)
      const normalizedStem = normalizeStem(stem)

      if (!stem || options.length !== 4 || !options.includes(answer) || !domainId || !buckets.get(domainId)?.has(knId)) {
        skippedInvalid += 1
        continue
      }

      if (seenStems.has(normalizedStem)) {
        skippedDuplicate += 1
        continue
      }

      seenStems.add(normalizedStem)
      buckets.get(domainId).get(knId).push({
        stem,
        options,
        answer,
        explanation: String(question?.explanation || ''),
        knId,
        difficulty: question?.difficulty === 'easy' || question?.difficulty === 'medium' || question?.difficulty === 'hard'
          ? question.difficulty
          : 'medium',
        source_file: sourceFile,
        source_folder: sourceFolder,
        is_org_psych: sourceFolder.includes('I-O'),
        normalizedStem,
      })
    }
  }

  return { buckets, skippedInvalid, skippedDuplicate }
}

function readExistingStemUsage(outputDir, prefix) {
  const usage = new Map()
  if (!fs.existsSync(outputDir)) return usage

  const files = fs.readdirSync(outputDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))
    .sort((a, b) => {
      const aNum = Number.parseInt((a.match(/(\d+)/) || [])[1] || '0', 10)
      const bNum = Number.parseInt((b.match(/(\d+)/) || [])[1] || '0', 10)
      return aNum - bNum
    })

  for (const fileName of files) {
    const questions = getQuestionArray(readJson(path.join(outputDir, fileName)))
    for (const question of questions) {
      const stem = normalizeStem(question?.question || question?.stem || '')
      if (!stem) continue
      usage.set(stem, (usage.get(stem) || 0) + 1)
    }
  }

  return usage
}

function getNextExamNumber(outputDir, prefix) {
  if (!fs.existsSync(outputDir)) return 1

  const numbers = fs.readdirSync(outputDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))
    .map((name) => Number.parseInt((name.match(/(\d+)/) || [])[1] || '0', 10))
    .filter((value) => Number.isInteger(value) && value > 0)

  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1
}

function sortCandidates(candidates, usage, seedSalt) {
  return [...candidates].sort((left, right) => {
    const usageDelta = (usage.get(left.normalizedStem) || 0) - (usage.get(right.normalizedStem) || 0)
    if (usageDelta !== 0) return usageDelta

    const difficultyDelta = difficultyWeight(right.difficulty) - difficultyWeight(left.difficulty)
    if (difficultyDelta !== 0) return difficultyDelta

    const leftHash = hashString(`${seedSalt}:${left.normalizedStem}`)
    const rightHash = hashString(`${seedSalt}:${right.normalizedStem}`)
    return leftHash - rightHash
  })
}

function pickOneQuestion(candidates, usedInExam, usage, seedSalt) {
  const viable = candidates.filter((candidate) => !usedInExam.has(candidate.normalizedStem))
  if (viable.length === 0) return null
  return sortCandidates(viable, usage, seedSalt)[0]
}

function allocateDomainQuestions(domainId, knCatalog, questionBuckets, usage, usedInExam, targetCount, seedSalt) {
  const domainKnIds = knCatalog.get(domainId).kns
    .map((kn) => kn.id)
    .filter((knId) => (questionBuckets.get(domainId).get(knId) || []).length > 0)

  const selected = []
  const cursorState = new Map(domainKnIds.map((knId) => [knId, 0]))

  while (selected.length < targetCount) {
    let madeProgress = false

    for (const knId of domainKnIds) {
      if (selected.length >= targetCount) break

      const pool = questionBuckets.get(domainId).get(knId) || []
      const choice = pickOneQuestion(pool, usedInExam, usage, `${seedSalt}:${domainId}:${knId}:${cursorState.get(knId)}`)
      cursorState.set(knId, (cursorState.get(knId) || 0) + 1)

      if (!choice) continue

      selected.push(choice)
      usedInExam.add(choice.normalizedStem)
      madeProgress = true
    }

    if (madeProgress) continue

    const remainingPool = []
    for (const knId of domainKnIds) {
      const pool = questionBuckets.get(domainId).get(knId) || []
      for (const question of pool) {
        if (!usedInExam.has(question.normalizedStem)) {
          remainingPool.push(question)
        }
      }
    }

    if (remainingPool.length === 0) break

    const fallback = sortCandidates(remainingPool, usage, `${seedSalt}:${domainId}:fallback`)[0]
    if (!fallback) break
    selected.push(fallback)
    usedInExam.add(fallback.normalizedStem)
  }

  if (selected.length !== targetCount) {
    throw new Error(`Domain ${domainId} could only provide ${selected.length} unique questions; needed ${targetCount}`)
  }

  return selected
}

function assignScoringFlags(questions, scoredTarget, usage, seedSalt) {
  const unscoredCount = questions.length - scoredTarget
  const rankedForUnscored = [...questions].sort((left, right) => {
    const difficultyDelta = difficultyWeight(right.difficulty) - difficultyWeight(left.difficulty)
    if (difficultyDelta !== 0) return difficultyDelta

    const usageDelta = (usage.get(left.normalizedStem) || 0) - (usage.get(right.normalizedStem) || 0)
    if (usageDelta !== 0) return usageDelta

    const leftHash = hashString(`${seedSalt}:${left.normalizedStem}`)
    const rightHash = hashString(`${seedSalt}:${right.normalizedStem}`)
    return leftHash - rightHash
  })

  const unscored = new Set(rankedForUnscored.slice(0, unscoredCount).map((question) => question.normalizedStem))
  return questions.map((question) => ({
    ...question,
    isScored: !unscored.has(question.normalizedStem),
  }))
}

function shuffleOptions(options, rng) {
  return shuffle(options, rng)
}

function buildPracticeExam({
  examNumber,
  knCatalog,
  questionBuckets,
  usage,
  seed,
}) {
  const usedInExam = new Set()
  const assembled = []
  const domainCounts = {}
  const scoredCounts = {}

  for (const domainId of Object.keys(PRACTICE_DOMAIN_TARGETS).map(Number)) {
    const domainQuestions = allocateDomainQuestions(
      domainId,
      knCatalog,
      questionBuckets,
      usage,
      usedInExam,
      PRACTICE_DOMAIN_TARGETS[domainId],
      `${seed}:${examNumber}`
    )

    const withScoring = assignScoringFlags(
      domainQuestions,
      PRACTICE_SCORED_TARGETS[domainId],
      usage,
      `${seed}:${examNumber}:${domainId}:score`
    )

    domainCounts[domainId] = withScoring.length
    scoredCounts[domainId] = withScoring.filter((question) => question.isScored).length

    assembled.push(
      ...withScoring.map((question) => ({
        ...question,
        domain: DOMAIN_LABELS[domainId],
        type: question.isScored ? 'standard' : 'experimental',
        question_type: question.isScored ? 'standard' : 'difficult',
      }))
    )
  }

  const examRng = createRng(seed + examNumber * 97)
  const shuffledQuestions = shuffle(assembled, examRng).map((question, index) => {
    const optionRng = createRng(hashString(`${seed}:${examNumber}:${question.normalizedStem}`))
    const options = shuffleOptions(question.options, optionRng)

    return {
      id: index + 1,
      question: question.stem,
      options,
      correct_answer: question.answer,
      explanation: question.explanation,
      domain: question.domain,
      knId: question.knId,
      source_file: question.source_file,
      source_folder: question.source_folder,
      difficulty: question.difficulty,
      question_type: question.question_type,
      isScored: question.isScored,
      type: question.type,
      is_org_psych: question.is_org_psych,
    }
  })

  return {
    meta: {
      examId: examNumber,
      totalQuestions: shuffledQuestions.length,
      scoredQuestions: shuffledQuestions.filter((question) => question.isScored !== false).length,
      unscoredQuestions: shuffledQuestions.filter((question) => question.isScored === false).length,
      domainCounts,
      scoredCounts,
      generatedAt: new Date().toISOString(),
      source: 'questionsGPT',
      blueprint: 'Kns.md',
      generator: 'scripts/assemble-questionsgpt-exams.mjs',
    },
    questions: shuffledQuestions,
  }
}

function getDiagnosticCoverage(knCatalog, questionBuckets) {
  const missing = []
  const counts = {}

  for (const [domainId, domain] of knCatalog.entries()) {
    for (const kn of domain.kns) {
      const count = (questionBuckets.get(domainId).get(kn.id) || []).length
      counts[kn.id] = count
      if (count === 0) {
        missing.push(kn.id)
      }
    }
  }

  return { counts, missing }
}

function writeExamJson(outputDir, prefix, examNumber, payload, dryRun) {
  const fileName = `${prefix}${examNumber}.json`
  const fullPath = path.join(outputDir, fileName)

  if (dryRun) {
    console.log(`  • Dry run: would write ${path.relative(ROOT, fullPath)}`)
    return
  }

  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`  ✓ Wrote ${path.relative(ROOT, fullPath)} (${payload.questions.length} questions)`)
}

function summarizeSupply(knCatalog, questionBuckets) {
  console.log('Question supply by domain:')
  for (const [domainId, domain] of knCatalog.entries()) {
    const count = domain.kns.reduce((sum, kn) => sum + (questionBuckets.get(domainId).get(kn.id) || []).length, 0)
    console.log(`  Domain ${domainId}: ${count} questions across ${domain.kns.length} KNs`)
  }
}

function generatePracticeExams(options, knCatalog, questionBuckets) {
  const prefix = 'practice-exam-'
  const usage = readExistingStemUsage(PRACTICE_OUTPUT_DIR, prefix)
  const startExamNumber = getNextExamNumber(PRACTICE_OUTPUT_DIR, prefix)

  console.log(`\nGenerating ${options.count} practice exam(s) starting at ${prefix}${startExamNumber}.json`)
  for (let offset = 0; offset < options.count; offset += 1) {
    const examNumber = startExamNumber + offset
    const exam = buildPracticeExam({
      examNumber,
      knCatalog,
      questionBuckets,
      usage,
      seed: options.seed,
    })

    writeExamJson(PRACTICE_OUTPUT_DIR, prefix, examNumber, exam, options.dryRun)

    for (const question of exam.questions) {
      const normalizedStem = normalizeStem(question.question)
      usage.set(normalizedStem, (usage.get(normalizedStem) || 0) + 1)
    }
  }
}

function reportDiagnosticStatus(knCatalog, questionBuckets) {
  const coverage = getDiagnosticCoverage(knCatalog, questionBuckets)

  if (coverage.missing.length === 0) {
    console.log('\nDiagnostic coverage check: all 71 KNs have at least one question in questionsGPT.')
    return
  }

  console.log('\nDiagnostic coverage check: cannot build a true 71-KN diagnostic exam from questionsGPT only yet.')
  console.log(`Missing KN coverage (${coverage.missing.length}): ${coverage.missing.join(', ')}`)
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const knPath = resolveKnPath()
  const knCatalog = parseKnCatalog(fs.readFileSync(knPath, 'utf8'))
  const { buckets: questionBuckets, skippedInvalid, skippedDuplicate } = loadQuestionBank(knCatalog)

  console.log(`Using KN blueprint: ${path.relative(ROOT, knPath)}`)
  console.log(`Loaded questions from ${path.relative(ROOT, QUESTIONS_DIR)}`)
  console.log(`Skipped invalid questions: ${skippedInvalid}`)
  console.log(`Skipped duplicate stems: ${skippedDuplicate}`)
  summarizeSupply(knCatalog, questionBuckets)

  if (options.type === 'practice' || options.type === 'both') {
    generatePracticeExams(options, knCatalog, questionBuckets)
  }

  if (options.type === 'diagnostic' || options.type === 'both') {
    reportDiagnosticStatus(knCatalog, questionBuckets)
    if (options.type === 'diagnostic') {
      const coverage = getDiagnosticCoverage(knCatalog, questionBuckets)
      if (coverage.missing.length > 0) {
        process.exitCode = 1
      }
    }
  }

  if (options.type !== 'diagnostic') {
    reportDiagnosticStatus(knCatalog, questionBuckets)
  }
}

main()
