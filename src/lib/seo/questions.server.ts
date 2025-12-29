import "server-only"

import fs from "node:fs"
import path from "node:path"

export type PracticeQuestion = {
  id: string | number
  question: string
  options: Array<{ label: string; text: string }>
  correctAnswer?: string
  explanation?: string
  difficulty?: string
  domain?: string
}

type QuestionSet = {
  domain: string
  sourceFile: string
  filePath: string
  questions: PracticeQuestion[]
}

const QUESTIONS_ROOT = path.join(process.cwd(), "questions")

function normalizeOptions(options: unknown): Array<{ label: string; text: string }> {
  if (Array.isArray(options)) {
    const labels = ["A", "B", "C", "D", "E", "F"]
    return options.map((text, index) => ({
      label: labels[index] ?? String(index + 1),
      text: typeof text === "string" ? text : String(text),
    }))
  }

  if (options && typeof options === "object") {
    return Object.entries(options as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, text]) => ({
        label,
        text: typeof text === "string" ? text : String(text),
      }))
  }

  return []
}

function parseQuestionSet(raw: string, filePath: string): QuestionSet | null {
  try {
    const parsed = JSON.parse(raw) as {
      source_file?: string
      domain?: string
      questions?: Array<{
        id: string | number
        question: string
        options?: unknown
        correct_answer?: string
        explanation?: string
        difficulty?: string
        domain?: string
      }>
    }

    const domain = parsed.domain?.trim()
    if (!domain || !Array.isArray(parsed.questions)) return null

    const sourceFile = parsed.source_file?.trim() || path.basename(filePath)
    const questions: PracticeQuestion[] = parsed.questions
      .filter((q) => q && typeof q.question === "string")
      .map((q) => ({
        id: q.id,
        question: q.question,
        options: normalizeOptions(q.options),
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        domain: q.domain || domain,
      }))

    return { domain, sourceFile, filePath, questions }
  } catch {
    return null
  }
}

export function getAllQuestionSets(): QuestionSet[] {
  if (!fs.existsSync(QUESTIONS_ROOT)) return []

  const domainDirs = fs
    .readdirSync(QUESTIONS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "archive")
    .map((entry) => entry.name)

  const sets: QuestionSet[] = []

  for (const domainDir of domainDirs) {
    const domainPath = path.join(QUESTIONS_ROOT, domainDir)
    const files = fs
      .readdirSync(domainPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md") && !entry.name.startsWith("."))
      .map((entry) => entry.name)

    for (const filename of files) {
      const filePath = path.join(domainPath, filename)
      const raw = fs.readFileSync(filePath, "utf8").trim()
      if (!raw.startsWith("{")) continue

      const set = parseQuestionSet(raw, filePath)
      if (set) sets.push(set)
    }
  }

  return sets.sort((a, b) => a.domain.localeCompare(b.domain) || a.sourceFile.localeCompare(b.sourceFile))
}

export function getSampleQuestionsByDomain(limitPerDomain = 3) {
  const sets = getAllQuestionSets()
  const grouped = new Map<string, PracticeQuestion[]>()

  for (const set of sets) {
    const current = grouped.get(set.domain) ?? []
    if (current.length >= limitPerDomain) continue

    for (const question of set.questions) {
      if (current.length >= limitPerDomain) break
      current.push(question)
    }

    grouped.set(set.domain, current)
  }

  return Array.from(grouped.entries())
    .map(([domain, questions]) => ({ domain, questions }))
    .sort((a, b) => a.domain.localeCompare(b.domain))
}

