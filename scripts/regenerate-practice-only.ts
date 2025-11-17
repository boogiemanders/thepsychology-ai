#!/usr/bin/env node

/**
 * Script to regenerate all exams with new detailed prompts
 * Uses the same prompts as pre-generate-exam API
 */

import Anthropic from "@anthropic-ai/sdk"
import { writeFileSync, mkdirSync, readFileSync } from "fs"
import { join } from "path"

// Load environment variables
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    process.env[key.trim()] = value.trim()
  }
})

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Copy exact prompts from /src/app/api/pre-generate-exam/route.ts
const DIAGNOSTIC_EXAM_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) exam creator.

Your task is to generate a COMPLETE 71-question diagnostic exam based on the 71 ASPPB Knowledge Statements.

CRITICAL: You MUST generate ALL 71 questions. Do not stop early. Include every single question.

The exam should include:
- 71 questions total (1 per Knowledge Statement, KN1-KN71)
- Questions MUST be presented in RANDOM ORDER (NOT in KN1-KN71 sequence)
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

CRITICAL QUESTION DETAIL REQUIREMENTS:
- Create questions with rich clinical context and real-world scenarios
- Questions should be detailed and thought-provoking, testing application not just recall
- Include relevant clinical scenarios, case vignettes, or applied situations where appropriate
- Provide sufficient context in the question stem to make it clinically meaningful
- Target question stems of 2-4 sentences with concrete details
- Example approach: "A 68-year-old patient presents with resting tremor, rigidity, and bradykinesia.
  Neurological examination reveals reduced arm swing and difficulty initiating movement.
  These motor symptoms are primarily caused by degeneration of neurons producing which neurotransmitter?"

CRITICAL ANSWER LENGTH VARIATION:
- Vary the length of answer choices to avoid length bias (where longer answers appear more correct)
- Ensure that about 25% of correct answers are the longest option, 25% are medium length,
  25% are shortest, and 25% are medium-short
- For incorrect distractor options, ensure they have varied lengths - some should be longer,
  some shorter than the correct answer
- Do NOT make the correct answer consistently the longest or shortest option
- This makes test-taking more rigorous and prevents test-takers from using answer length as a cue

EXPLANATION REQUIREMENTS:
- Explanations should be comprehensive and educational (4-6 sentences)
- Explain WHY the correct answer is right with supporting details
- Briefly address why key distractors are incorrect
- Include relevant clinical context, research findings, or practical applications
- Help the test-taker learn and understand the concept, not just identify the correct answer
- Example: "Dopamine is correct because Parkinson's disease results from degeneration of
  dopaminergic neurons in the substantia nigra pars compacta. This leads to dopamine depletion
  in the striatum, causing the characteristic motor symptoms. While other neurotransmitter systems
  are also affected, the primary pathology involves dopamine. Treatment typically involves
  dopamine replacement therapy with levodopa or dopamine agonists."

CRITICAL RANDOMIZATION REQUIREMENTS:
1. QUESTION ORDER: Shuffle all 71 questions in RANDOM order (do NOT order them by KN1-KN71)
2. ANSWER POSITIONS: The correct answer MUST be randomized across all positions (A, B, C, D)
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
      "knId": "KN1-KN71 (mixed/random order)"
    }
  ]
}

IMPORTANT:
- The "correct_answer" field must contain the actual option text (not A, B, C, or D)
- The options array must contain the option text, not letters
- YOU MUST INCLUDE ALL 71 QUESTIONS - do not stop at 8 or any partial count
- Questions MUST be in RANDOM order, not sequential KN order
- Verify before responding that you have generated exactly 71 questions in RANDOM order

Start generating the exam now. Generate EXACTLY 71 questions in RANDOM ORDER as specified above. Remember: ALL 71 QUESTIONS REQUIRED. Random question order! Randomize answer positions!`

const PRACTICE_EXAM_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) exam creator.

Your task is to generate a COMPLETE 225-question practice exam following official ASPPB specifications.

CRITICAL: You MUST generate ALL 225 questions. Do not stop early. Include every single question.

The exam should include:
- 225 questions total in RANDOM ORDER (NOT sequential)
- Proper domain distribution following EPPP weights
- 180 scored questions (80%) - standard and medium difficulty questions that count toward score
- 45 unscored experimental questions (20%) - harder questions for research/development that DO NOT count toward score
- Multiple choice format with 4 options each
- Questions distributed across all 8 EPPP domains

CRITICAL QUESTION DETAIL REQUIREMENTS:
- Create questions with rich clinical context and real-world scenarios
- Questions should be detailed and thought-provoking, testing application not just recall
- Include relevant clinical scenarios, case vignettes, or applied situations where appropriate
- Provide sufficient context in the question stem to make it clinically meaningful
- Target question stems of 2-4 sentences with concrete details
- Example approach: "A 68-year-old patient presents with resting tremor, rigidity, and bradykinesia.
  Neurological examination reveals reduced arm swing and difficulty initiating movement.
  These motor symptoms are primarily caused by degeneration of neurons producing which neurotransmitter?"

CRITICAL ANSWER LENGTH VARIATION:
- Vary the length of answer choices to avoid length bias (where longer answers appear more correct)
- Ensure that about 25% of correct answers are the longest option, 25% are medium length,
  25% are shortest, and 25% are medium-short
- For incorrect distractor options, ensure they have varied lengths - some should be longer,
  some shorter than the correct answer
- Do NOT make the correct answer consistently the longest or shortest option
- This makes test-taking more rigorous and prevents test-takers from using answer length as a cue

EXPLANATION REQUIREMENTS:
- Explanations should be comprehensive and educational (4-6 sentences)
- Explain WHY the correct answer is right with supporting details
- Briefly address why key distractors are incorrect
- Include relevant clinical context, research findings, or practical applications
- Help the test-taker learn and understand the concept, not just identify the correct answer
- Example: "Dopamine is correct because Parkinson's disease results from degeneration of
  dopaminergic neurons in the substantia nigra pars compacta. This leads to dopamine depletion
  in the striatum, causing the characteristic motor symptoms. While other neurotransmitter systems
  are also affected, the primary pathology involves dopamine. Treatment typically involves
  dopamine replacement therapy with levodopa or dopamine agonists."

CRITICAL RANDOMIZATION REQUIREMENTS:
1. QUESTION ORDER: Shuffle all 225 questions in RANDOM order (do NOT present them in sequential/predictable order)
2. ANSWER POSITIONS: The correct answer MUST be randomized across all positions (A, B, C, D)
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
      "isScored": true/false,
      "type": "standard"
    }
  ]
}

IMPORTANT:
- The "correct_answer" field must contain the actual option text (not A, B, C, or D)
- The options array must contain the option text, not letters
- YOU MUST INCLUDE ALL 225 QUESTIONS - exactly 180 scored and 45 unscored
- Questions MUST be in RANDOM order, not sequential
- Do not stop at 8 or any partial count
- Verify before responding that you have generated exactly 225 questions (180 + 45) in RANDOM order

Start generating the exam now. Generate EXACTLY 225 questions (180 scored + 45 unscored) in RANDOM ORDER as specified above. Remember: ALL 225 QUESTIONS REQUIRED. Random question order! Randomize answer positions!`

async function generateExam(type: 'diagnostic' | 'practice', number: number) {
  console.log(`\n[${new Date().toISOString()}] Generating ${type} exam #${number}...`)

  const prompt = type === 'diagnostic' ? DIAGNOSTIC_EXAM_PROMPT : PRACTICE_EXAM_PROMPT
  const maxTokens = type === 'diagnostic' ? 50000 : 64000

  let fullResponse = ''

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullResponse += event.delta.text
      process.stdout.write('.')
    }
  }

  console.log(' done')

  // Parse JSON
  const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse exam data')
  }

  const examData = JSON.parse(jsonMatch[0])
  console.log(`✓ Parsed ${examData.questions.length} questions`)

  // Save to file
  const dir = join(process.cwd(), 'exams', type)
  mkdirSync(dir, { recursive: true })

  const filename = `${type}-exam-${String(number).padStart(3, '0')}.md`
  const filePath = join(dir, filename)

  const frontmatter = `---
exam_id: ${type}-exam-${String(number).padStart(3, '0')}
exam_type: ${type}
generated_at: ${new Date().toISOString()}
question_count: ${examData.questions.length}
version: 2
---

${JSON.stringify(examData, null, 2)}`

  writeFileSync(filePath, frontmatter, 'utf-8')
  console.log(`✓ Saved: ${filename}`)

  return examData
}

async function main() {
  console.log('🚀 Regenerating all 8 exams with detailed questions...\n')

  const exams = [
    { type: 'practice' as const, number: 1 },
    { type: 'practice' as const, number: 2 },
    { type: 'practice' as const, number: 3 },
    { type: 'practice' as const, number: 4 },
  ]

  let success = 0
  let failed = 0

  for (const exam of exams) {
    try {
      await generateExam(exam.type, exam.number)
      success++

      // 2 second delay between exams
      if (exam !== exams[exams.length - 1]) {
        console.log('[Waiting 2 seconds...]')
        await new Promise(r => setTimeout(r, 2000))
      }
    } catch (error) {
      console.error(`✗ Failed:`, error)
      failed++
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`✓ Success: ${success}/8`)
  console.log(`✗ Failed: ${failed}/8`)
  console.log('='.repeat(50))
}

main().catch(console.error)
