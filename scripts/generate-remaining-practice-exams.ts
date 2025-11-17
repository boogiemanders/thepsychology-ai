#!/usr/bin/env node

/**
 * Generate remaining practice exams #2-#4 using split approach
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

const PRACTICE_QUESTIONS_PROMPT = `You are an expert EPPP exam creator.

Generate a COMPLETE 225-question EPPP practice exam.

CRITICAL: You MUST generate ALL 225 questions covering all 71 Knowledge Statements. Do not stop early.

The exam should include:
- 225 questions total
- Questions in RANDOM ORDER
- Proper domain distribution maintaining EPPP weights:
  - Domain 1: 17 questions (7.5%)
  - Domain 2: 25 questions (11%)
  - Domain 3: 22 questions (10%)
  - Domain 4: 26 questions (11.5%)
  - Domain 5: 42 questions (19%)
  - Domain 6: 34 questions (15%)
  - Domain 7: 17 questions (7.5%)
  - Domain 8: 29 questions (13%)
  - Domain 9: 13 questions (5.5%)
- Multiple choice format with 4 options each
- 200 scored questions (isScored: true), 25 unscored field test questions (isScored: false)
- Balanced difficulty levels
- Cover all 71 ASPPB Knowledge Statements

CRITICAL QUESTION DETAIL REQUIREMENTS:
- Create questions with rich clinical context and real-world scenarios
- Each question stem should be AT LEAST 2-3 detailed sentences
- Include specific patient details, demographics, symptoms, behaviors
- Questions should feel like real clinical vignettes
- Answer options should be substantive (not just 1-2 words)
- Make scenarios realistic and professionally detailed

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A",
      "domain": 1,
      "knowledgeStatement": "KN1",
      "isScored": true
    }
  ]
}

IMPORTANT:
- Do NOT include any markdown formatting like \`\`\`json
- Do NOT include explanations in this response
- Just return the raw JSON object
- Ensure all 225 questions are included`

const PRACTICE_EXPLANATIONS_PROMPT_TEMPLATE = (questionsJson: string) => `You are an expert EPPP exam creator providing detailed explanations.

Here are the 225 questions from a practice exam:

${questionsJson}

Generate comprehensive explanations for ALL 225 questions.

CRITICAL: You MUST provide explanations for ALL 225 questions. Do not stop early.

For each question, provide:
1. Why the correct answer is right
2. Why each incorrect option is wrong
3. Key concepts and principles
4. Clinical applications
5. References to relevant theories, research, or DSM-5 criteria when applicable

Return ONLY valid JSON in this exact format:
{
  "explanations": [
    {
      "questionIndex": 0,
      "explanation": "Detailed explanation here..."
    },
    {
      "questionIndex": 1,
      "explanation": "Detailed explanation here..."
    }
  ]
}

IMPORTANT:
- Do NOT include any markdown formatting like \`\`\`json
- Just return the raw JSON object
- Provide explanations for all 225 questions (indices 0-224)`

async function generateExam(examNumber: number) {
  const examDir = join(process.cwd(), 'exams', 'practice')
  mkdirSync(examDir, { recursive: true })

  const examFile = join(examDir, `practice-exam-${examNumber.toString().padStart(3, '0')}.md`)
  const explanationsFile = join(examDir, `practice-exam-${examNumber.toString().padStart(3, '0')}-explanations.json`)

  console.log(`\n[${new Date().toISOString()}] Generating practice exam #${examNumber} (questions only)...`)

  // Step 1: Generate questions
  const questionsStream = await client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 64000,
    messages: [{ role: "user", content: PRACTICE_QUESTIONS_PROMPT }],
  })

  let questionsText = ''
  for await (const event of questionsStream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      process.stdout.write('.')
      questionsText += event.delta.text
    }
  }

  console.log(' done')

  // Parse and save questions
  const cleanedQuestions = questionsText.trim().replace(/^```json\s*/,  '').replace(/\s*```$/, '')
  const questionsData = JSON.parse(cleanedQuestions)
  console.log(`✓ Parsed ${questionsData.questions.length} questions`)

  // Save questions as markdown
  let markdown = `# EPPP Practice Exam ${examNumber.toString().padStart(3, '0')}\n\n`
  markdown += `Total Questions: ${questionsData.questions.length}\n\n`
  markdown += `---\n\n`

  questionsData.questions.forEach((q: any, idx: number) => {
    markdown += `## Question ${idx + 1}\n\n`
    markdown += `**Domain ${q.domain}** | **${q.knowledgeStatement}** | **${q.isScored ? 'Scored' : 'Field Test'}**\n\n`
    markdown += `${q.question}\n\n`
    q.options.forEach((opt: string) => {
      markdown += `${opt}\n`
    })
    markdown += `\n**Correct Answer:** ${q.correctAnswer}\n\n`
    markdown += `---\n\n`
  })

  writeFileSync(examFile, markdown)
  console.log(`✓ Saved questions: practice-exam-${examNumber.toString().padStart(3, '0')}.md`)

  // Wait before generating explanations
  console.log('[Waiting 2 seconds...]')
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Step 2: Generate explanations
  console.log(`\n[${new Date().toISOString()}] Generating explanations for practice exam #${examNumber}...`)

  const explanationsStream = await client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 64000,
    messages: [{ role: "user", content: PRACTICE_EXPLANATIONS_PROMPT_TEMPLATE(JSON.stringify(questionsData.questions, null, 2)) }],
  })

  let explanationsText = ''
  for await (const event of explanationsStream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      process.stdout.write('.')
      explanationsText += event.delta.text
    }
  }

  console.log(' done')

  // Parse and save explanations
  const cleanedExplanations = explanationsText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '')
  const explanationsData = JSON.parse(cleanedExplanations)
  console.log(`✓ Parsed ${explanationsData.explanations.length} explanations`)

  writeFileSync(explanationsFile, JSON.stringify(explanationsData, null, 2))
  console.log(`✓ Saved explanations: practice-exam-${examNumber.toString().padStart(3, '0')}-explanations.json`)
}

async function main() {
  console.log('🚀 Generating remaining practice exams (#2-#4)...\n')

  const examNumbers = [2, 3, 4]

  for (const examNum of examNumbers) {
    try {
      await generateExam(examNum)

      // Wait between exams
      if (examNum < 4) {
        console.log('\n[Waiting 3 seconds before next exam...]')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.error(`\n✗ Failed to generate practice exam #${examNum}:`, error)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('✓ Practice exam generation complete!')
  console.log('='.repeat(50))
}

main()
