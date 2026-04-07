#!/usr/bin/env node
// Builds a short 8-question diagnostic (1 easy question per domain 1..8)
// from free-questionsGPT, writing to free-examsGPT/diagnostic-exam-short-1.json.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'free-questionsGPT')
const OUT = join(ROOT, 'free-examsGPT', 'diagnostic-exam-short-1.json')

function collectDomainQuestions(domain) {
  // Match single-domain folders only (e.g. "2 Cognitive..."), skip multi-domain
  // folders like "2 3 5 6 Organizational Psychology" whose second token is a digit.
  const prefix = `${domain} `
  const folders = readdirSync(SRC).filter((name) => {
    const p = join(SRC, name)
    if (!statSync(p).isDirectory()) return false
    if (!name.startsWith(prefix)) return false
    const secondToken = name.split(' ')[1] ?? ''
    return !/^\d+$/.test(secondToken)
  })
  const questions = []
  for (const folder of folders) {
    const folderPath = join(SRC, folder)
    const files = readdirSync(folderPath).filter((f) => f.endsWith('.json'))
    for (const file of files) {
      const full = join(folderPath, file)
      try {
        const raw = readFileSync(full, 'utf-8')
        const parsed = JSON.parse(raw)
        const qs = Array.isArray(parsed.questions) ? parsed.questions : []
        qs.forEach((q) => {
          questions.push({
            ...q,
            sourceFile: full,
            sourceFolder: folder,
            domain,
          })
        })
      } catch (err) {
        console.warn('Skipping bad file', full, err.message)
      }
    }
  }
  return questions
}

function pickEasy(questions) {
  const easy = questions.filter(
    (q) => typeof q.difficulty === 'string' && q.difficulty.toLowerCase() === 'easy'
  )
  const pool = easy.length > 0 ? easy : questions // fallback
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

const selected = []
for (let d = 1; d <= 8; d++) {
  const all = collectDomainQuestions(d)
  const chosen = pickEasy(all)
  if (!chosen) {
    console.error(`No questions found for domain ${d}`)
    process.exit(1)
  }
  console.log(
    `Domain ${d}: picked from ${basename(chosen.sourceFolder)} / ${basename(chosen.sourceFile)} [${chosen.difficulty}]`
  )
  selected.push(chosen)
}

const domainCounts = {}
selected.forEach((q) => {
  domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1
})

const payload = {
  meta: {
    examId: 'short-1',
    totalQuestions: selected.length,
    domainCounts,
    orgPsychCount: 0,
    orgPsychPercentage: 0,
    generatedAt: new Date().toISOString(),
    variant: 'short',
  },
  questions: selected.map((q) => ({
    stem: q.stem,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
    kn: q.kn,
    kn_explanation: q.kn_explanation,
    difficulty: q.difficulty,
    quality_comment: q.quality_comment,
    sourceFile: q.sourceFile,
    sourceFolder: q.sourceFolder,
    domain: q.domain,
    isOrgPsych: false,
  })),
}

writeFileSync(OUT, JSON.stringify(payload, null, 2))
console.log(`\nWrote ${selected.length}-question short diagnostic to ${OUT}`)
