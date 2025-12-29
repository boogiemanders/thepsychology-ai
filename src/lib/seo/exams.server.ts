import "server-only"

import fs from "node:fs"
import path from "node:path"

export type ExamQuestion = {
  id: string | number
  question: string
  options: string[]
  correctAnswer?: string
  explanation?: string
  domain?: string
  difficulty?: string
}

export type SampleExam = {
  examType: "diagnostic" | "practice"
  examId: string
  questionCount?: number
  generatedAt?: string
  questions: ExamQuestion[]
}

const EXAMS_ROOT = path.join(process.cwd(), "exams")

function parseFrontmatterAndBody(raw: string) {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: {}, body: raw }
  }

  const endMarker = "\n---\n"
  const endIndex = raw.indexOf(endMarker, 4)
  if (endIndex === -1) return { frontmatter: {}, body: raw }

  const frontmatterRaw = raw.slice(4, endIndex).trim()
  const body = raw.slice(endIndex + endMarker.length).trim()
  const frontmatter: Record<string, string> = {}

  for (const line of frontmatterRaw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const colonIndex = trimmed.indexOf(":")
    if (colonIndex === -1) continue
    const key = trimmed.slice(0, colonIndex).trim()
    const value = trimmed.slice(colonIndex + 1).trim()
    if (!key) continue
    frontmatter[key] = value
  }

  return { frontmatter, body }
}

function parseExamFile(filePath: string, examType: SampleExam["examType"]): SampleExam | null {
  const raw = fs.readFileSync(filePath, "utf8")
  const { frontmatter, body } = parseFrontmatterAndBody(raw)
  if (!body.startsWith("{")) return null

  try {
    const json = JSON.parse(body) as {
      questions?: Array<{
        id: string | number
        question: string
        options?: string[]
        correct_answer?: string
        explanation?: string
        domain?: string
        difficulty?: string
      }>
    }

    if (!Array.isArray(json.questions)) return null

    const questions: ExamQuestion[] = json.questions
      .filter((q) => q && typeof q.question === "string")
      .map((q) => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        domain: q.domain,
        difficulty: q.difficulty,
      }))

    return {
      examType,
      examId: frontmatter.exam_id || path.basename(filePath, ".md"),
      questionCount: frontmatter.question_count ? Number(frontmatter.question_count) : undefined,
      generatedAt: frontmatter.generated_at,
      questions,
    }
  } catch {
    return null
  }
}

function pickFirstMarkdownFile(dirPath: string) {
  if (!fs.existsSync(dirPath)) return null
  const files = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))

  return files[0] ? path.join(dirPath, files[0]) : null
}

export function getSampleExams(questionLimit = 5): SampleExam[] {
  const diagnosticPath = pickFirstMarkdownFile(path.join(EXAMS_ROOT, "diagnostic"))
  const practicePath = pickFirstMarkdownFile(path.join(EXAMS_ROOT, "practice"))

  const results: SampleExam[] = []

  if (diagnosticPath) {
    const exam = parseExamFile(diagnosticPath, "diagnostic")
    if (exam) results.push({ ...exam, questions: exam.questions.slice(0, questionLimit) })
  }

  if (practicePath) {
    const exam = parseExamFile(practicePath, "practice")
    if (exam) results.push({ ...exam, questions: exam.questions.slice(0, questionLimit) })
  }

  return results
}

