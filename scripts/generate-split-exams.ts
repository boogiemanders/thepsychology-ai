#!/usr/bin/env node

/**
 * Generate exams with questions and explanations in separate files
 * This avoids token limit issues while keeping detailed content
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

// Questions-only prompt (no explanations)
const DIAGNOSTIC_QUESTIONS_PROMPT = `You are an expert EPPP exam creator.

Generate a COMPLETE 71-question diagnostic exam based on the 71 ASPPB Knowledge Statements.

CRITICAL: You MUST generate ALL 71 questions. Do not stop early.

The exam should include:
- 71 questions total (1 per Knowledge Statement, KN1-KN71)
- Questions in RANDOM ORDER (NOT KN1-KN71 sequence)
- Proper domain distribution maintaining EPPP weights:
  - Domain 1: 5 questions
  - Domain 2: 8 questions
  - Domain 3: 7 questions
  - Domain 4: 8 questions
  - Domain 5: 13 questions
  - Domain 6: 11 questions
  - Domain 7: 5 questions
  - Domain 8: 9 questions
- Multiple choice format with 4 options each
- All questions scored (isScored: true)
- Balanced difficulty levels

CRITICAL QUESTION DETAIL REQUIREMENTS:
- Create questions with rich clinical context and real-world scenarios
- Questions should be detailed and thought-provoking, testing application not just recall
- Target question stems of 2-4 sentences with concrete details
- Example: "A 68-year-old patient presents with resting tremor, rigidity, and bradykinesia. Neurological examination reveals reduced arm swing and difficulty initiating movement. These motor symptoms are primarily caused by degeneration of neurons producing which neurotransmitter?"

CRITICAL ANSWER LENGTH VARIATION:
- Vary answer choice lengths to avoid length bias
- Ensure roughly 25% of correct answers in each length category (longest, medium-long, medium-short, shortest)
- Incorrect options should also vary in length

CRITICAL RANDOMIZATION:
1. QUESTION ORDER: Shuffle all 71 questions in RANDOM order
2. ANSWER POSITIONS: Randomize correct answer across positions (A, B, C, D)
   - Aim for ~25% in each position

Generate in JSON format:
{
  "questions": [
    {
      "id": number,
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option text that matches one of the options exactly",
      "domain": "Domain 1-8",
      "difficulty": "easy|medium|hard",
      "isScored": true,
      "knId": "KN1-KN71"
    }
  ]
}

IMPORTANT:
- The "correct_answer" field must contain the actual option text (not A, B, C, or D)
- DO NOT include "explanation" field - explanations will be generated separately
- YOU MUST INCLUDE ALL 71 QUESTIONS in RANDOM order
- Verify you have exactly 71 questions before responding

Start generating now. Generate EXACTLY 71 questions in RANDOM ORDER. NO EXPLANATIONS.`

const PRACTICE_QUESTIONS_PROMPT = `You are an expert EPPP exam creator.

Generate a COMPLETE 225-question practice exam following official ASPPB specifications.

CRITICAL: You MUST generate ALL 225 questions. Do not stop early.

The exam should include:
- 225 questions total in RANDOM ORDER
- Proper domain distribution following EPPP weights
- 180 scored questions (80%) - standard/medium difficulty that count toward score
- 45 unscored experimental questions (20%) - harder questions that DO NOT count toward score
- Multiple choice format with 4 options each
- Questions distributed across all 8 EPPP domains

CRITICAL QUESTION DETAIL REQUIREMENTS:
- Create questions with rich clinical context and real-world scenarios
- Questions should be detailed and thought-provoking, testing application not just recall
- Target question stems of 2-4 sentences with concrete details
- Example: "A 68-year-old patient presents with resting tremor, rigidity, and bradykinesia. Neurological examination reveals reduced arm swing and difficulty initiating movement. These motor symptoms are primarily caused by degeneration of neurons producing which neurotransmitter?"

CRITICAL ANSWER LENGTH VARIATION:
- Vary answer choice lengths to avoid length bias
- Ensure roughly 25% of correct answers in each length category (longest, medium-long, medium-short, shortest)
- Incorrect options should also vary in length

CRITICAL RANDOMIZATION:
1. QUESTION ORDER: Shuffle all 225 questions in RANDOM order
2. ANSWER POSITIONS: Randomize correct answer across positions (A, B, C, D)
   - Aim for ~25% in each position

IMPORTANT: Mark unscored questions with "isScored": false. These should be harder than scored questions.

Generate in JSON format:
{
  "questions": [
    {
      "id": number,
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option text that matches one of the options exactly",
      "domain": "Domain 1-8",
      "difficulty": "easy|medium|hard",
      "isScored": true/false,
      "type": "standard"
    }
  ]
}

IMPORTANT:
- The "correct_answer" field must contain the actual option text (not A, B, C, or D)
- DO NOT include "explanation" field - explanations will be generated separately
- YOU MUST INCLUDE ALL 225 QUESTIONS (180 scored + 45 unscored) in RANDOM order
- Verify you have exactly 225 questions before responding

Start generating now. Generate EXACTLY 225 questions in RANDOM ORDER. NO EXPLANATIONS.`

async function generateQuestions(type: 'diagnostic' | 'practice', number: number) {
  console.log(`\n[${new Date().toISOString()}] Generating ${type} exam #${number} (questions only)...`)

  const prompt = type === 'diagnostic' ? DIAGNOSTIC_QUESTIONS_PROMPT : PRACTICE_QUESTIONS_PROMPT
  const maxTokens = type === 'diagnostic' ? 40000 : 50000 // Reduced since no explanations

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

  // Save questions file
  const dir = join(process.cwd(), 'exams', type)
  mkdirSync(dir, { recursive: true })

  const filename = `${type}-exam-${String(number).padStart(3, '0')}.md`
  const filePath = join(dir, filename)

  const frontmatter = `---
exam_id: ${type}-exam-${String(number).padStart(3, '0')}
exam_type: ${type}
generated_at: ${new Date().toISOString()}
question_count: ${examData.questions.length}
version: 3
format: split
---

${JSON.stringify(examData, null, 2)}`

  writeFileSync(filePath, frontmatter, 'utf-8')
  console.log(`✓ Saved questions: ${filename}`)

  return examData
}

async function generateExplanations(examData: any, type: 'diagnostic' | 'practice', number: number) {
  console.log(`\n[${new Date().toISOString()}] Generating explanations for ${type} exam #${number}...`)

  const questionsText = examData.questions.map((q: any, idx: number) =>
    `Question ${idx + 1}:\n${q.question}\nCorrect Answer: ${q.correct_answer}\nDomain: ${q.domain}`
  ).join('\n\n')

  const prompt = `You are an expert EPPP educator. Generate comprehensive explanations for each question.

For each question, provide a 4-6 sentence explanation that:
1. Explains WHY the correct answer is right with supporting details
2. Briefly addresses why key distractors are incorrect
3. Includes relevant clinical context, research findings, or practical applications
4. Helps the test-taker learn and understand the concept

Example:
"Dopamine is correct because Parkinson's disease results from degeneration of dopaminergic neurons in the substantia nigra pars compacta. This leads to dopamine depletion in the striatum, causing the characteristic motor symptoms. While other neurotransmitter systems are also affected, the primary pathology involves dopamine. Treatment typically involves dopamine replacement therapy with levodopa or dopamine agonists."

Questions:
${questionsText}

Generate explanations in JSON format:
{
  "explanations": {
    "1": "Explanation for question 1...",
    "2": "Explanation for question 2...",
    ...
  }
}

Generate explanations for ALL ${examData.questions.length} questions.`

  let fullResponse = ''

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 64000,
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
    throw new Error('Could not parse explanations')
  }

  const explanationsData = JSON.parse(jsonMatch[0])
  console.log(`✓ Parsed ${Object.keys(explanationsData.explanations).length} explanations`)

  // Save explanations file
  const dir = join(process.cwd(), 'exams', 'explanations')
  mkdirSync(dir, { recursive: true })

  const filename = `${type}-exam-${String(number).padStart(3, '0')}-explanations.json`
  const filePath = join(dir, filename)

  writeFileSync(filePath, JSON.stringify(explanationsData, null, 2), 'utf-8')
  console.log(`✓ Saved explanations: ${filename}`)

  return explanationsData
}

async function main() {
  console.log('🚀 Generating split exams (test: 1 diagnostic + 1 practice)...\n')

  try {
    // Generate diagnostic exam #1
    const diagnosticData = await generateQuestions('diagnostic', 1)
    await generateExplanations(diagnosticData, 'diagnostic', 1)

    console.log('\n[Waiting 2 seconds...]\n')
    await new Promise(r => setTimeout(r, 2000))

    // Generate practice exam #1
    const practiceData = await generateQuestions('practice', 1)
    await generateExplanations(practiceData, 'practice', 1)

    console.log('\n' + '='.repeat(50))
    console.log('✓ Successfully generated test exams!')
    console.log('  - diagnostic-exam-001.md + explanations')
    console.log('  - practice-exam-001.md + explanations')
    console.log('='.repeat(50))
  } catch (error) {
    console.error('✗ Generation failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)
