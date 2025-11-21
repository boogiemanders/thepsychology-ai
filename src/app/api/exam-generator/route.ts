import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { inferIsOrgPsych } from '@/lib/org-psych-utils'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// DIAGNOSTIC EXAM: 71 Questions (1 per KN)
const DIAGNOSTIC_EXAM_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) exam creator.

Your task is to generate a 71-question diagnostic exam based on the 71 ASPPB Knowledge Statements.

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

CRITICAL ANSWER LENGTH VARIATION:
- Vary the length of answer choices to avoid length bias (where longer answers appear more correct)
- Ensure that about 25% of correct answers are the longest option, 25% are medium length, 25% are shortest, and 25% are medium-short
- For incorrect distractor options, ensure they have varied lengths - some should be longer, some shorter than the correct answer
- Do NOT make the correct answer consistently the longest or shortest option
- This makes test-taking more rigorous and prevents test-takers from using answer length as a cue

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

Start generating the exam now. Format each question clearly. Generate exactly 71 questions as specified above. Remember to randomize answer positions!`

// PRACTICE EXAM: 225 Questions
const PRACTICE_EXAM_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) exam creator.

Your task is to generate a comprehensive 225-question practice exam following official ASPPB specifications.

The exam should include:
- 225 questions total
- Proper domain distribution following EPPP weights
- 180 scored questions (80%) - standard and medium difficulty questions that count toward score
- 45 unscored experimental questions (20%) - harder questions for research/development that DO NOT count toward score
- Multiple choice format with 4 options each
- Answer key with brief explanations
- Questions distributed across all 8 EPPP domains

CRITICAL RANDOMIZATION REQUIREMENT:
- The correct answer MUST be randomized across all positions (A, B, C, D)
- DO NOT place the correct answer always in position A
- Aim for roughly 25% of correct answers in each position (A, B, C, D)
- Randomize answer option positions for each question independently
- Verify that across all 225 questions, correct answers appear in different positions

CRITICAL ANSWER LENGTH VARIATION:
- Vary the length of answer choices to avoid length bias (where longer answers appear more correct)
- Ensure that about 25% of correct answers are the longest option, 25% are medium length, 25% are shortest, and 25% are medium-short
- For incorrect distractor options, ensure they have varied lengths - some should be longer, some shorter than the correct answer
- Do NOT make the correct answer consistently the longest or shortest option
- This makes test-taking more rigorous and prevents test-takers from using answer length as a cue

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

Start generating the exam now. Format each question clearly. Remember: exactly 180 questions with "isScored": true, and 45 questions with "isScored": false. Most importantly, randomize answer positions throughout the exam!`

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examType = searchParams.get('type') || 'practice' // 'diagnostic' or 'practice'

    // For diagnostic exams, prefer pre-generated GPT exams from diagnosticGPT
    if (examType === 'diagnostic') {
      try {
        const examData = loadDiagnosticFromGpt()
        return NextResponse.json(examData)
      } catch (gptError) {
        console.warn(
          '[Exam Generator] Failed to load diagnostic exam from diagnosticGPT, falling back to Anthropic generation:',
          gptError
        )
      }
    }

    // For practice exams, try loading from cached GPT JSON exams first
    if (examType === 'practice') {
      try {
        const examData = loadPracticeFromGpt()
        return NextResponse.json(examData)
      } catch (practiceError) {
        console.warn(
          '[Exam Generator] Failed to load practice exam from examsGPT, falling back to Anthropic generation:',
          practiceError
        )
      }
    }

    const prompt = examType === 'diagnostic' ? DIAGNOSTIC_EXAM_PROMPT : PRACTICE_EXAM_PROMPT

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 32000,
      stream: true,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Convert stream to ReadableStream for NextResponse
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                new TextEncoder().encode(event.delta.text)
              )
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error generating exam:', error)
    return NextResponse.json(
      { error: 'Failed to generate exam' },
      { status: 500 }
    )
  }
}

/**
 * Load a diagnostic exam from the diagnosticGPT folder.
 * Chooses a random diagnostic-exam-*.json file and maps it into the
 * question shape expected by the exam generator page.
 */
function loadDiagnosticFromGpt() {
  const diagnosticDir = join(process.cwd(), 'diagnosticGPT')
  if (!existsSync(diagnosticDir)) {
    throw new Error(`diagnosticGPT directory not found at ${diagnosticDir}`)
  }

  const files = readdirSync(diagnosticDir).filter(
    (name) => name.startsWith('diagnostic-exam-') && name.endsWith('.json')
  )

  if (files.length === 0) {
    throw new Error('No diagnostic-exam-*.json files found in diagnosticGPT')
  }

  // Pick a random diagnostic exam
  const chosen = files[Math.floor(Math.random() * files.length)]
  const fullPath = join(diagnosticDir, chosen)

  const raw = readFileSync(fullPath, 'utf-8')
  const parsed = JSON.parse(raw)
  const questions = Array.isArray(parsed.questions) ? parsed.questions : []

  const mappedQuestions = questions.map((q: any, idx: number) => {
    const domainNumber =
      typeof q.domain === 'number'
        ? q.domain
        : typeof q.domain === 'string'
        ? parseInt(q.domain, 10)
        : undefined
    const sourceFile = q.sourceFile ?? q.source_file
    const sourceFolder = q.sourceFolder ?? q.source_folder
    const isOrgPsych = inferIsOrgPsych({
      explicitFlag: typeof q.is_org_psych === 'boolean' ? q.is_org_psych : undefined,
      sourceFile,
      sourceFolder,
    })

    return {
      id: idx + 1,
      question: q.stem ?? q.question ?? '',
      options: q.options ?? [],
      correct_answer: q.answer ?? q.correct_answer ?? '',
      explanation: q.explanation ?? '',
      domain: domainNumber && !Number.isNaN(domainNumber) ? `Domain ${domainNumber}` : q.domain ?? '',
      difficulty:
        q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard'
          ? q.difficulty
          : 'medium',
      isScored: typeof q.scored === 'boolean' ? q.scored : q.isScored ?? true,
      knId: q.kn ?? q.knId,
      type: q.type ?? 'standard',
      source_file: sourceFile,
      source_folder: sourceFolder,
      is_org_psych: isOrgPsych,
    }
  })

  return {
    questions: mappedQuestions,
  }
}

/**
 * Load a practice exam from the examsGPT folder (practice-exam-*.json files)
 * This avoids needing to call Anthropic if we already have cached practice exams.
 */
function loadPracticeFromGpt() {
  const practiceDir = join(process.cwd(), 'examsGPT')
  if (!existsSync(practiceDir)) {
    throw new Error(`examsGPT directory not found at ${practiceDir}`)
  }

  const files = readdirSync(practiceDir).filter(
    (name) => name.startsWith('practice-exam-') && name.endsWith('.json')
  )

  if (files.length === 0) {
    throw new Error('No practice-exam-*.json files found in examsGPT')
  }

  // Randomize the exam selection to keep attempts fresh
  const chosen = files[Math.floor(Math.random() * files.length)]
  const fullPath = join(practiceDir, chosen)

  const raw = readFileSync(fullPath, 'utf-8')
  const parsed = JSON.parse(raw)
  const questions = Array.isArray(parsed.questions) ? parsed.questions : []

  const mappedQuestions = questions.map((q: any, idx: number) => {
    const domainNumber =
      typeof q.domain === 'number'
        ? q.domain
        : typeof q.domain === 'string'
        ? parseInt(q.domain, 10)
        : undefined

    const questionId = typeof q.id === 'number' ? q.id : idx + 1
    const options = Array.isArray(q.options) ? q.options : []
    const sourceFile = q.sourceFile ?? q.source_file
    const sourceFolder = q.sourceFolder ?? q.source_folder
    const isOrgPsych = inferIsOrgPsych({
      explicitFlag: typeof q.is_org_psych === 'boolean' ? q.is_org_psych : undefined,
      sourceFile,
      sourceFolder,
    })

    const isScored =
      typeof q.scored === 'boolean'
        ? q.scored
        : typeof q.isScored === 'boolean'
        ? q.isScored
        : true

    return {
      id: questionId,
      question: q.stem ?? q.question ?? '',
      options,
      correct_answer: q.answer ?? q.correct_answer ?? '',
      explanation: q.explanation ?? q.rationale ?? '',
      domain: domainNumber && !Number.isNaN(domainNumber) ? `Domain ${domainNumber}` : q.domain ?? '',
      difficulty:
        q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard'
          ? q.difficulty
          : 'medium',
      isScored,
      knId: q.kn ?? q.knId,
      type: q.type ?? (isScored ? 'standard' : 'experimental'),
      source_file: sourceFile,
      source_folder: sourceFolder,
      is_org_psych: isOrgPsych,
    }
  })

  return {
    questions: mappedQuestions,
    metadata: parsed.meta ?? null,
  }
}
