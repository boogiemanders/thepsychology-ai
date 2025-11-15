import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const stream = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16000,
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

    // Save to Supabase
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7-day expiration

    const { data: savedExam, error: saveError } = await supabase
      .from('pre_generated_exams')
      .insert({
        user_id: userId,
        exam_type: examType,
        questions: examData,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
      .select('id')
      .single()

    if (saveError) {
      console.error('[Pre-Gen] Error saving to Supabase:', saveError)
      return NextResponse.json(
        { error: 'Failed to save exam' },
        { status: 500 }
      )
    }

    console.log(
      `[Pre-Gen] Successfully saved pre-generated ${examType} exam (ID: ${savedExam.id}) for user ${userId}`
    )

    return NextResponse.json(
      {
        success: true,
        examId: savedExam.id,
        questionCount: examData.questions.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Pre-Gen] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
