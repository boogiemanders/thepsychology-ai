#!/usr/bin/env node

/**
 * Script to generate all 4 diagnostic and 4 practice exams
 * and save them to the exams directory
 *
 * Usage: npx ts-node scripts/generate-all-exams.ts
 */

import Anthropic from "@anthropic-ai/sdk"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

const DIAGNOSTIC_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) exam creator.

Your task is to generate a COMPLETE 71-question diagnostic exam based on the 71 ASPPB Knowledge Statements.

The exam should include:
- 71 questions total (1 per Knowledge Statement, KN1-KN71)
- Proper domain distribution maintaining EPPP weights:
  - Domain 1: 5 questions
  - Domain 2: 8 questions
  - Domain 3: 7 questions
  - Domain 4: 8 questions
  - Domain 5: 13 questions
  - Domain 6: 11 questions
  - Domain 7: 5 questions (rounded from 7%)
  - Domain 8: 9 questions (rounded from 16%)
- Multiple choice format with 4 options each
- All questions scored (isScored: true)
- Balanced difficulty levels

CRITICAL RANDOMIZATION REQUIREMENT:
- The correct answer MUST be randomized across all positions (A, B, C, D)
- DO NOT place the correct answer always in position A
- Aim for roughly 25% of correct answers in each position (A, B, C, D)
- Randomize answer option positions for each question independently
- Verify that across all 71 questions, correct answers appear in different positions

Generate the exam in JSON format with this structure:
{
  "questions": [
    {
      "id": number,
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option text that matches one of the options exactly",
      "explanation": "Why this is correct",
      "domain": "Domain 1-8",
      "difficulty": "easy|medium|hard",
      "isScored": true,
      "knId": "KN1"
    }
  ]
}

IMPORTANT: The "correct_answer" field must contain the actual option text (not A, B, C, or D), and the options array must contain the option text, not letters. This allows proper randomization.

Start generating the exam now. Generate EXACTLY 71 questions as specified above. Remember to randomize answer positions! Include all 71 questions in your response.`

const PRACTICE_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) exam creator.

Your task is to generate a COMPLETE 225-question practice exam following official ASPPB specifications.

The exam should include:
- 225 questions total
- Proper domain distribution following EPPP weights
- 180 scored questions (80%) - standard and medium difficulty questions that count toward score
- 45 unscored experimental questions (20%) - harder questions for research/development that DO NOT count toward score
- Multiple choice format with 4 options each
- Questions distributed across all 8 EPPP domains

CRITICAL RANDOMIZATION REQUIREMENT:
- The correct answer MUST be randomized across all positions (A, B, C, D)
- DO NOT place the correct answer always in position A
- Aim for roughly 25% of correct answers in each position (A, B, C, D)
- Randomize answer option positions for each question independently
- Verify that across all 225 questions, correct answers appear in different positions

IMPORTANT: Mark the unscored questions clearly with "isScored": false. These should be noticeably harder than the scored questions and are used for data collection. Users will see their score calculated only from the 180 scored questions, not the 45 unscored ones.

Generate the exam in JSON format with this structure:
{
  "questions": [
    {
      "id": number,
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option text that matches one of the options exactly",
      "explanation": "Why this is correct",
      "domain": "Domain 1-8",
      "difficulty": "easy|medium|hard",
      "isScored": true,
      "type": "standard"
    }
  ]
}

IMPORTANT: The "correct_answer" field must contain the actual option text (not A, B, C, or D), and the options array must contain the option text, not letters. This allows proper randomization.

Start generating the exam now. Format each question clearly. Generate EXACTLY 225 questions (180 scored + 45 unscored) as specified above. Remember to randomize answer positions! Include all 225 questions in your response.`

async function generateExam(
  type: "diagnostic" | "practice",
  examNumber: number
): Promise<ExamData | null> {
  const prompt = type === "diagnostic" ? DIAGNOSTIC_PROMPT : PRACTICE_PROMPT
  const expectedCount = type === "diagnostic" ? 71 : 225

  console.log(
    `[${new Date().toISOString()}] Generating ${type} exam #${examNumber}...`
  )

  try {
    let fullResponse = ""

    const stream = await client.messages.create({
      model: "claude-opus-4-1-20250805", // Use Opus for better quality and larger context
      max_tokens: 128000, // Increased significantly for complete exams
      stream: true,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponse += event.delta.text
        process.stdout.write(".")
      }
    }

    console.log("\n[Parsing response...]")

    // Extract JSON from response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error(`Failed to extract JSON for ${type} exam #${examNumber}`)
      return null
    }

    const examData: ExamData = JSON.parse(jsonMatch[0])

    // Validate question count
    if (examData.questions.length !== expectedCount) {
      console.warn(
        `⚠️  ${type} exam #${examNumber} has ${examData.questions.length} questions, expected ${expectedCount}`
      )
    } else {
      console.log(
        `✓ ${type} exam #${examNumber} has correct number of questions (${expectedCount})`
      )
    }

    // Validate that all questions have required fields
    const invalidQuestions = examData.questions.filter(
      (q) =>
        !q.id ||
        !q.question ||
        !q.options ||
        !q.correct_answer ||
        !q.explanation ||
        !q.domain
    )

    if (invalidQuestions.length > 0) {
      console.warn(
        `⚠️  ${invalidQuestions.length} questions are missing required fields`
      )
    }

    return examData
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
  console.log("🚀 Starting exam generation...\n")

  // Create directories if they don't exist
  mkdirSync(join(process.cwd(), "exams", "diagnostic"), {
    recursive: true,
  })
  mkdirSync(join(process.cwd(), "exams", "practice"), { recursive: true })

  const examsToGenerate = [
    { type: "diagnostic" as const, number: 1 },
    { type: "diagnostic" as const, number: 2 },
    { type: "diagnostic" as const, number: 3 },
    { type: "diagnostic" as const, number: 4 },
    { type: "practice" as const, number: 1 },
    { type: "practice" as const, number: 2 },
    { type: "practice" as const, number: 3 },
    { type: "practice" as const, number: 4 },
  ]

  let successCount = 0
  let failureCount = 0

  for (const exam of examsToGenerate) {
    const examData = await generateExam(exam.type, exam.number)

    if (examData) {
      const filename =
        exam.type === "diagnostic"
          ? `diagnostic-exam-${exam.number.toString().padStart(3, "0")}.md`
          : `practice-exam-${exam.number.toString().padStart(3, "0")}.md`

      const filepath = join(
        process.cwd(),
        "exams",
        exam.type,
        filename
      )

      const fileContent = formatExamFile(examData, exam.type, exam.number)
      writeFileSync(filepath, fileContent)

      console.log(`✓ Saved: ${filepath}`)
      console.log(`  Questions: ${examData.questions.length}`)
      successCount++
    } else {
      failureCount++
      console.error(`✗ Failed to generate ${exam.type} exam #${exam.number}`)
    }

    // Add delay between requests to avoid rate limits
    if (examsToGenerate.indexOf(exam) < examsToGenerate.length - 1) {
      console.log("[Waiting 2 seconds before next exam...]\n")
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  console.log("\n" + "=".repeat(50))
  console.log(`📊 Generation complete!`)
  console.log(`✓ Success: ${successCount}/8`)
  console.log(`✗ Failures: ${failureCount}/8`)
  console.log("=".repeat(50))

  process.exit(failureCount > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
