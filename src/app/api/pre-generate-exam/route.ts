import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for backend operations
)

// Use same prompts as exam-generator
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

export async function POST(request: NextRequest) {
  try {
    // Check if Anthropic API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not set')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, examType } = body

    // Validate inputs
    if (!userId || !examType) {
      return NextResponse.json(
        { error: 'Missing userId or examType' },
        { status: 400 }
      )
    }

    if (!['diagnostic', 'practice'].includes(examType)) {
      return NextResponse.json(
        { error: 'Invalid examType' },
        { status: 400 }
      )
    }

    console.log(`[Pre-Gen] Starting generation for user ${userId}, exam type: ${examType}`)

    // Check if a valid unused pre-gen already exists
    const { data: existing } = await supabase
      .from('pre_generated_exams')
      .select('id')
      .eq('user_id', userId)
      .eq('exam_type', examType)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existing) {
      console.log(`[Pre-Gen] Valid pre-generated exam already exists for user ${userId}`)
      return NextResponse.json(
        { success: true, message: 'Valid pre-gen already exists' },
        { status: 200 }
      )
    }

    // Generate exam using Claude
    const prompt = examType === 'diagnostic' ? DIAGNOSTIC_EXAM_PROMPT : PRACTICE_EXAM_PROMPT
    let fullResponse = ''

    console.log(`[Pre-Gen] Calling Claude API for ${examType} exam generation...`)

    // Use Sonnet 4.5 for both exams - better model for large outputs
    const stream = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 40000, // Sonnet 4.5 can handle larger outputs
      stream: true,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Collect all streamed content
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullResponse += event.delta.text
      }
    }

    console.log(`[Pre-Gen] Received response from Claude (${fullResponse.length} characters)`)

    // Extract JSON from response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[Pre-Gen] Failed to extract JSON from Claude response')
      return NextResponse.json(
        { error: 'Failed to parse exam data' },
        { status: 500 }
      )
    }

    const examData = JSON.parse(jsonMatch[0])

    if (!examData.questions || !Array.isArray(examData.questions)) {
      console.error('[Pre-Gen] Invalid exam structure from Claude')
      return NextResponse.json(
        { error: 'Invalid exam structure' },
        { status: 500 }
      )
    }

    console.log(`[Pre-Gen] Successfully parsed ${examData.questions.length} questions`)

    // Save to filesystem
    try {
      const examsDir = join(process.cwd(), 'exams', examType)

      // Create directory if it doesn't exist
      try {
        mkdirSync(examsDir, { recursive: true })
      } catch (mkdirError) {
        console.warn('[Pre-Gen] Directory might already exist:', mkdirError)
      }

      // Find next available exam number
      let examNumber = 1
      let filename = `${examType}-exam-${String(examNumber).padStart(3, '0')}.md`
      let filePath = join(examsDir, filename)

      // Check if file exists and find next available number (up to 10 exams)
      const fs = require('fs')
      for (let i = 1; i <= 10; i++) {
        filename = `${examType}-exam-${String(i).padStart(3, '0')}.md`
        filePath = join(examsDir, filename)
        if (!fs.existsSync(filePath)) {
          examNumber = i
          break
        }
      }

      // Create markdown file with frontmatter
      const now = new Date().toISOString()
      const fileContent = `---
exam_id: ${examType}-exam-${String(examNumber).padStart(3, '0')}
exam_type: ${examType}
generated_at: ${now}
question_count: ${examData.questions.length}
version: 1
---

${JSON.stringify(examData, null, 2)}
`

      // Write file
      writeFileSync(filePath, fileContent, 'utf-8')

      console.log(
        `[Pre-Gen] Successfully saved ${examType} exam to filesystem: ${filePath} (${examData.questions.length} questions)`
      )

      return NextResponse.json(
        {
          success: true,
          examFile: filename,
          questionCount: examData.questions.length,
          path: filePath,
        },
        { status: 200 }
      )
    } catch (fileError) {
      console.error('[Pre-Gen] Error saving exam to filesystem:', fileError)
      return NextResponse.json(
        { error: 'Failed to save exam to filesystem', message: String(fileError) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Pre-Gen] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
