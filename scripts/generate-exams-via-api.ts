#!/usr/bin/env node

/**
 * Script to generate all 4 diagnostic and 4 practice exams via API endpoint
 * Generates exams and saves them to the exams directory
 */

import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  domain: string
  difficulty: "easy" | "medium" | "hard"
  isScored?: boolean
  knId?: string
  type?: string
}

interface ExamData {
  questions: Question[]
}

const API_BASE_URL = "http://localhost:3000"
const EXAMS_TO_GENERATE = [
  { type: "diagnostic", number: 1 },
  { type: "diagnostic", number: 2 },
  { type: "diagnostic", number: 3 },
  { type: "diagnostic", number: 4 },
  { type: "practice", number: 1 },
  { type: "practice", number: 2 },
  { type: "practice", number: 3 },
  { type: "practice", number: 4 },
]

async function generateExam(
  type: "diagnostic" | "practice",
  examNumber: number
): Promise<ExamData | null> {
  console.log(
    `[${new Date().toISOString()}] Generating ${type} exam #${examNumber}...`
  )

  try {
    const response = await fetch(`${API_BASE_URL}/api/pre-generate-exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: `temp-exam-gen-${examNumber}`,
        examType: type,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    console.log(`✓ ${type} exam #${examNumber} generated successfully`)
    return null // We'll read it from Supabase instead
  } catch (error) {
    console.error(
      `Error generating ${type} exam #${examNumber}:`,
      error instanceof Error ? error.message : error
    )
    return null
  }
}

function formatExamFile(
  examData: ExamData,
  examType: "diagnostic" | "practice",
  examNumber: number
): string {
  const now = new Date().toISOString()
  const filename =
    examType === "diagnostic"
      ? `diagnostic-exam-${examNumber.toString().padStart(3, "0")}`
      : `practice-exam-${examNumber.toString().padStart(3, "0")}`

  const frontmatter = `---
exam_id: ${filename}
exam_type: ${examType}
generated_at: ${now}
question_count: ${examData.questions.length}
version: 1
---`

  const body = JSON.stringify({ questions: examData.questions }, null, 2)

  return `${frontmatter}\n\n${body}`
}

async function main() {
  console.log("🚀 Starting exam generation via API...\n")
  console.log(
    "Note: Make sure the Next.js development server is running on http://localhost:3000\n"
  )

  // Create directories if they don't exist
  mkdirSync(join(process.cwd(), "exams", "diagnostic"), {
    recursive: true,
  })
  mkdirSync(join(process.cwd(), "exams", "practice"), { recursive: true })

  let successCount = 0
  let failureCount = 0

  for (let i = 0; i < EXAMS_TO_GENERATE.length; i++) {
    const exam = EXAMS_TO_GENERATE[i]
    const result = await generateExam(
      exam.type as "diagnostic" | "practice",
      exam.number
    )

    if (result) {
      successCount++
    } else {
      failureCount++
    }

    // Add delay between requests
    if (i < EXAMS_TO_GENERATE.length - 1) {
      console.log("[Waiting 3 seconds before next exam...]\n")
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  console.log("\n" + "=".repeat(50))
  console.log(`📊 Generation initiated!`)
  console.log(
    `✓ API calls sent: ${EXAMS_TO_GENERATE.length - failureCount}/8`
  )
  console.log(`✗ API failures: ${failureCount}/8`)
  console.log(
    "\nExams are being generated in the background."
  )
  console.log(
    "Check the Next.js server logs for progress."
  )
  console.log("=".repeat(50))

  process.exit(failureCount > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
