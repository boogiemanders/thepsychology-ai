#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const EXAMS_DIR = path.join(ROOT, 'examsGPT')
const REVIEW_DIR = path.join(ROOT, 'staging', 'review')
const ROOT_BANK_DIR = path.join(ROOT, 'questionsGPT')
const LESSONS_DIR = path.join(ROOT, 'topic-content-v4')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function getQuestions(raw) {
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.questions)) return raw.questions
  return []
}

function collectJsonFiles(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectJsonFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(full)
    }
  }
  return results.sort()
}

function collectFiles(dir, extension) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, extension))
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      results.push(full)
    }
  }
  return results.sort()
}

const fileCache = new Map()

function loadQuestionsFromFile(filePath) {
  if (!fileCache.has(filePath)) {
    const raw = readJson(filePath)
    fileCache.set(filePath, getQuestions(raw))
  }
  return fileCache.get(filePath)
}

function findByStemInFile(filePath, stem) {
  if (!fs.existsSync(filePath)) return null
  const questions = loadQuestionsFromFile(filePath)
  return questions.find((q) => q && q.stem === stem) ?? null
}

function buildStemIndex(files) {
  const index = new Map()
  for (const filePath of files) {
    const questions = loadQuestionsFromFile(filePath)
    for (const q of questions) {
      if (!q || typeof q.stem !== 'string') continue
      const matches = index.get(q.stem) ?? []
      matches.push({ filePath, question: q })
      index.set(q.stem, matches)
    }
  }
  return index
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokenize(text) {
  return normalizeText(text).split(/\s+/).filter(Boolean)
}

function scoreCandidate(lessonName, candidateName) {
  const lessonTokens = new Set(tokenize(lessonName))
  const candidateTokens = new Set(tokenize(candidateName))
  let overlap = 0

  for (const token of lessonTokens) {
    if (candidateTokens.has(token)) overlap += 1
  }

  const minSize = Math.max(1, Math.min(lessonTokens.size, candidateTokens.size))
  const maxSize = Math.max(1, Math.max(lessonTokens.size, candidateTokens.size))

  let score = (overlap / minSize) * 2 + overlap / maxSize
  const normalizedLesson = normalizeText(lessonName)
  const normalizedCandidate = normalizeText(candidateName)

  if (normalizedLesson === normalizedCandidate) score += 3
  if (normalizedLesson.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedLesson)) {
    score += 1
  }

  return score
}

function buildLessonToRootMap() {
  const lessonFiles = collectFiles(LESSONS_DIR, '.md')
  const rootFiles = collectJsonFiles(ROOT_BANK_DIR)
  const rootByFolder = new Map()
  const lessonToRoot = new Map()
  const usedRootFiles = new Set()

  for (const rootFile of rootFiles) {
    const relativeFolder = path.relative(ROOT_BANK_DIR, path.dirname(rootFile))
    const group = rootByFolder.get(relativeFolder) ?? []
    group.push(rootFile)
    rootByFolder.set(relativeFolder, group)
  }

  for (const lessonFile of lessonFiles) {
    const lesson = path.basename(lessonFile, '.md')
    const relativeFolder = path.relative(LESSONS_DIR, path.dirname(lessonFile))
    const candidates = rootByFolder.get(relativeFolder) ?? []
    const ranked = candidates
      .map((candidatePath) => ({
        candidatePath,
        score: scoreCandidate(lesson, path.basename(candidatePath, '.json')),
      }))
      .sort((a, b) => b.score - a.score)

    const best = ranked[0]
    if (!best || best.score < 2 || usedRootFiles.has(best.candidatePath)) continue
    lessonToRoot.set(lesson, best.candidatePath)
    usedRootFiles.add(best.candidatePath)
  }

  return lessonToRoot
}

const reviewFiles = collectJsonFiles(REVIEW_DIR).filter((p) => path.basename(p) !== 'archive-beyond-lesson.json' && !p.includes(`${path.sep}reports${path.sep}`))
const reviewStemIndex = buildStemIndex(reviewFiles)
const rootBankFiles = collectJsonFiles(ROOT_BANK_DIR)
const rootStemIndex = buildStemIndex(rootBankFiles)
const lessonToRootMap = buildLessonToRootMap()

function locateRootByLessonSlug(lessonSlug, stem) {
  if (!lessonSlug) return null
  const rootFile = lessonToRootMap.get(lessonSlug)
  if (!rootFile) return null
  const match = findByStemInFile(rootFile, stem)
  return match ? { filePath: rootFile, question: match, strategy: 'rootLessonFileStem' } : null
}

function parseOldExamIndex(question) {
  const id = String(question.id ?? '')
  const match = id.match(/::(\d+)$/)
  return match ? Number(match[1]) : null
}

function locateForOldSchema(question) {
  const oldSourceFile = String(question.sourceFile ?? '')
  const oldLessonSlug = oldSourceFile ? path.basename(oldSourceFile, path.extname(oldSourceFile)) : ''
  const rootLessonMatch = locateRootByLessonSlug(oldLessonSlug, question.stem)
  if (rootLessonMatch) return rootLessonMatch

  const rootMatches = rootStemIndex.get(question.stem) ?? []
  if (rootMatches.length === 1) return { ...rootMatches[0], strategy: 'rootStem' }

  const sourceFile = oldSourceFile
  if (sourceFile && fs.existsSync(sourceFile)) {
    const questions = loadQuestionsFromFile(sourceFile)
    const idx = parseOldExamIndex(question)
    if (idx !== null && questions[idx]) return { filePath: sourceFile, question: questions[idx], strategy: 'sourceFile+index' }
    const byStem = questions.find((q) => q && q.stem === question.stem)
    if (byStem) return { filePath: sourceFile, question: byStem, strategy: 'sourceFile+stem' }
  }

  const reviewMatches = reviewStemIndex.get(question.stem) ?? []
  if (reviewMatches.length === 1) return { ...reviewMatches[0], strategy: 'reviewStem' }

  return null
}

function locateReviewCandidates(sourceFolder, sourceFile) {
  return [
    path.join(REVIEW_DIR, 'AATBS', sourceFolder, sourceFile),
    path.join(REVIEW_DIR, 'psychprep', sourceFolder, sourceFile),
  ]
}

function locateForNewSchema(question) {
  const sourceFolder = String(question.source_folder ?? '')
  const sourceFile = String(question.source_file ?? '')
  const stem = String(question.question ?? '')

  const lessonSlug = sourceFile ? path.basename(sourceFile, path.extname(sourceFile)) : ''
  const rootLessonMatch = locateRootByLessonSlug(lessonSlug, stem)
  if (rootLessonMatch) return rootLessonMatch

  const rootMatches = rootStemIndex.get(stem) ?? []
  if (rootMatches.length === 1) return { ...rootMatches[0], strategy: 'rootStem' }

  for (const candidate of locateReviewCandidates(sourceFolder, sourceFile)) {
    const match = findByStemInFile(candidate, stem)
    if (match) return { filePath: candidate, question: match, strategy: 'reviewFolderFileStem' }
  }

  const reviewMatches = reviewStemIndex.get(stem) ?? []
  if (reviewMatches.length === 1) return { ...reviewMatches[0], strategy: 'reviewStem' }

  return null
}

function syncOldSchemaQuestion(target, source) {
  target.stem = source.stem
  target.options = source.options
  target.answer = source.answer
  target.explanation = source.explanation
  if (source.kn) target.kn = source.kn
  if (source.kn_explanation) target.kn_explanation = source.kn_explanation
  if (source.difficulty) target.difficulty = source.difficulty
  if (source.quality_comment) target.quality_comment = source.quality_comment
}

function syncNewSchemaQuestion(target, source) {
  target.question = source.stem
  target.options = source.options
  target.correct_answer = source.answer
  target.explanation = source.explanation
  if (source.kn) target.knId = source.kn
  if (source.difficulty) target.difficulty = source.difficulty
}

function main() {
  const examFiles = collectJsonFiles(EXAMS_DIR).filter((p) => path.basename(p).startsWith('practice-exam-'))
  const summary = []

  for (const examFile of examFiles) {
    const raw = readJson(examFile)
    const questions = getQuestions(raw)
    let matched = 0
    let unmatched = 0

    for (const q of questions) {
      const isOldSchema = 'stem' in q && 'answer' in q
      const located = isOldSchema ? locateForOldSchema(q) : locateForNewSchema(q)
      if (!located) {
        unmatched += 1
        continue
      }

      if (isOldSchema) {
        syncOldSchemaQuestion(q, located.question)
      } else {
        syncNewSchemaQuestion(q, located.question)
      }
      matched += 1
    }

    writeJson(examFile, raw)
    summary.push({
      file: path.relative(ROOT, examFile),
      matched,
      unmatched,
      total: questions.length,
    })
  }

  for (const row of summary) {
    console.log(`${row.file}: matched ${row.matched}/${row.total}, unmatched ${row.unmatched}`)
  }
}

main()
