#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const QUESTIONS_DIR = path.join(ROOT, 'questionsGPT')
const LESSONS_DIR = path.join(ROOT, 'topic-content-v4')
const REVIEW_SOURCES = [
  { name: 'AATBS', dir: path.join(ROOT, 'staging', 'review', 'AATBS') },
  { name: 'psychprep', dir: path.join(ROOT, 'staging', 'review', 'psychprep') },
]

const SOURCE_PRIORITY = {
  AATBS: 3,
  psychprep: 2,
  root: 1,
}

function walkFiles(dir, extension) {
  const results = []
  if (!fs.existsSync(dir)) return results

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, extension))
    } else if (entry.isFile() && fullPath.toLowerCase().endsWith(extension.toLowerCase())) {
      results.push(fullPath)
    }
  }

  return results.sort()
}

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
  const normalizedLesson = normalizeText(lessonName)
  const normalizedCandidate = normalizeText(candidateName)
  if (!normalizedLesson || !normalizedCandidate) return 0

  const lessonTokens = new Set(tokenize(lessonName))
  const candidateTokens = new Set(tokenize(candidateName))

  let intersection = 0
  for (const token of lessonTokens) {
    if (candidateTokens.has(token)) intersection += 1
  }

  const minSize = Math.max(1, Math.min(lessonTokens.size, candidateTokens.size))
  const maxSize = Math.max(1, Math.max(lessonTokens.size, candidateTokens.size))

  let score = (intersection / minSize) * 2 + intersection / maxSize

  if (normalizedLesson === normalizedCandidate) score += 3
  if (normalizedCandidate.includes(normalizedLesson) || normalizedLesson.includes(normalizedCandidate)) {
    score += 1
  }

  return score
}

function buildLessonToRootMap() {
  const lessonFiles = walkFiles(LESSONS_DIR, '.md')
  const rootFiles = walkFiles(QUESTIONS_DIR, '.json')
  const rootByFolder = new Map()

  for (const rootFile of rootFiles) {
    const relativeFolder = path.relative(QUESTIONS_DIR, path.dirname(rootFile))
    const group = rootByFolder.get(relativeFolder) ?? []
    group.push(rootFile)
    rootByFolder.set(relativeFolder, group)
  }

  const lessonToRoot = new Map()
  const usedRootFiles = new Set()

  for (const lessonFile of lessonFiles) {
    const lesson = path.basename(lessonFile, '.md')
    const relativeFolder = path.relative(LESSONS_DIR, path.dirname(lessonFile))
    const candidates = rootByFolder.get(relativeFolder) ?? []

    if (candidates.length === 0) {
      throw new Error(`No questionsGPT folder match found for lesson folder ${relativeFolder}`)
    }

    const ranked = candidates
      .map((candidatePath) => ({
        candidatePath,
        score: scoreCandidate(lesson, path.basename(candidatePath, '.json')),
      }))
      .sort((a, b) => b.score - a.score)

    const best = ranked[0]
    if (!best || best.score < 2) {
      throw new Error(`Could not confidently map lesson ${lesson} to a questionsGPT file`)
    }

    if (usedRootFiles.has(best.candidatePath)) {
      throw new Error(`Ambiguous mapping: ${best.candidatePath} already assigned before lesson ${lesson}`)
    }

    lessonToRoot.set(lesson, best.candidatePath)
    usedRootFiles.add(best.candidatePath)
  }

  return lessonToRoot
}

function collectReviewQuestionsByLesson() {
  const byLesson = new Map()

  for (const source of REVIEW_SOURCES) {
    const files = walkFiles(source.dir, '.json')
    for (const filePath of files) {
      const questions = getQuestions(readJson(filePath))
      for (const question of questions) {
        const lesson =
          typeof question?.suggestedLesson === 'string' && question.suggestedLesson.trim()
            ? question.suggestedLesson.trim()
            : path.basename(filePath, '.json')

        const entries = byLesson.get(lesson) ?? []
        entries.push({
          source: source.name,
          filePath,
          question,
        })
        byLesson.set(lesson, entries)
      }
    }
  }

  return byLesson
}

function normalizeStem(question) {
  return normalizeText(question?.stem ?? question?.question ?? '')
}

function unionStrings(left, right) {
  const out = []
  for (const value of [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])]) {
    if (typeof value !== 'string') continue
    if (!out.includes(value)) out.push(value)
  }
  return out
}

function isMissing(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  )
}

function normalizeQuestionShape(question) {
  const normalized = { ...question }

  normalized.stem = String(question?.stem ?? question?.question ?? '').trim()
  normalized.options = Array.isArray(question?.options)
    ? question.options.map((option) => String(option || '').trim()).filter(Boolean)
    : []
  normalized.answer = String(question?.answer ?? question?.correct_answer ?? '').trim()
  normalized.explanation = String(question?.explanation ?? '').trim()

  delete normalized.question
  delete normalized.correct_answer

  return normalized
}

function mergeRecords(records) {
  const sorted = [...records].sort((a, b) => {
    const priorityDelta = SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source]
    return priorityDelta !== 0 ? priorityDelta : 0
  })

  const merged = normalizeQuestionShape(sorted[0].question)

  for (const record of sorted.slice(1)) {
    const candidate = normalizeQuestionShape(record.question)

    for (const [key, value] of Object.entries(candidate)) {
      if (key === 'tags') {
        const tags = unionStrings(merged.tags, value)
        if (tags.length > 0) merged.tags = tags
        continue
      }

      if (key === 'relatedSections') {
        const sections = unionStrings(merged.relatedSections, value)
        if (sections.length > 0) merged.relatedSections = sections
        continue
      }

      if (key === 'is_lock_in_drill') {
        if (value === true) merged.is_lock_in_drill = true
        continue
      }

      if (key === 'lock_in_level') {
        if (!merged.lock_in_level && typeof value === 'string' && value.trim()) {
          merged.lock_in_level = value
        }
        continue
      }

      if (isMissing(merged[key]) && !isMissing(value)) {
        merged[key] = value
      }
    }
  }

  if (!Array.isArray(merged.options) || merged.options.length < 2) return null
  if (!merged.stem || !merged.answer || !merged.options.includes(merged.answer)) return null

  return merged
}

function mergeLessonQuestions(reviewEntries, rootQuestions) {
  const grouped = new Map()
  const orderedStems = []

  function addRecord(source, filePath, question) {
    const stemKey = normalizeStem(question)
    if (!stemKey) return

    const bucket = grouped.get(stemKey) ?? []
    bucket.push({ source, filePath, question })
    grouped.set(stemKey, bucket)

    if (!orderedStems.includes(stemKey)) {
      orderedStems.push(stemKey)
    }
  }

  for (const entry of reviewEntries.filter((entry) => entry.source === 'AATBS')) {
    addRecord(entry.source, entry.filePath, entry.question)
  }

  for (const entry of reviewEntries.filter((entry) => entry.source === 'psychprep')) {
    addRecord(entry.source, entry.filePath, entry.question)
  }

  for (const question of rootQuestions) {
    addRecord('root', null, question)
  }

  const mergedQuestions = []
  for (const stemKey of orderedStems) {
    const merged = mergeRecords(grouped.get(stemKey) ?? [])
    if (merged) mergedQuestions.push(merged)
  }

  return mergedQuestions
}

function main() {
  const lessonToRoot = buildLessonToRootMap()
  const reviewByLesson = collectReviewQuestionsByLesson()

  const stats = []
  let totalWritten = 0
  let totalReviewQuestions = 0
  let totalRootQuestions = 0

  for (const [lesson, rootFilePath] of lessonToRoot.entries()) {
    const rootQuestions = getQuestions(readJson(rootFilePath))
    const reviewEntries = reviewByLesson.get(lesson) ?? []
    const mergedQuestions = mergeLessonQuestions(reviewEntries, rootQuestions)

    writeJson(rootFilePath, { questions: mergedQuestions })

    const bySource = reviewEntries.reduce(
      (acc, entry) => {
        acc[entry.source] += 1
        return acc
      },
      { AATBS: 0, psychprep: 0 }
    )

    stats.push({
      lesson,
      file: path.relative(ROOT, rootFilePath),
      finalCount: mergedQuestions.length,
      rootCount: rootQuestions.length,
      aatbsCount: bySource.AATBS,
      psychprepCount: bySource.psychprep,
    })

    totalWritten += mergedQuestions.length
    totalReviewQuestions += reviewEntries.length
    totalRootQuestions += rootQuestions.length
  }

  const noReviewLessons = stats.filter((row) => row.aatbsCount + row.psychprepCount === 0).map((row) => row.lesson)

  console.log(`Synced ${stats.length} topic files in questionsGPT`)
  console.log(`Review questions considered: ${totalReviewQuestions}`)
  console.log(`Existing root questions considered: ${totalRootQuestions}`)
  console.log(`Final questions written: ${totalWritten}`)
  console.log(`Lessons with no reviewed staging questions: ${noReviewLessons.length ? noReviewLessons.join(', ') : 'none'}`)
}

main()
