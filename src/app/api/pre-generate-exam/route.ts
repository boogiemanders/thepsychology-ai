import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { getOpenAIApiKey } from '@/lib/openai-api-key'

const openaiApiKey = getOpenAIApiKey()
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null

const DIAGNOSTIC_MODEL =
  process.env.OPENAI_DIAGNOSTIC_MODEL ??
  process.env.ANTHROPIC_DIAGNOSTIC_MODEL ??
  'gpt-4o-mini'
const PRACTICE_MODEL =
  process.env.OPENAI_PRACTICE_MODEL ??
  process.env.ANTHROPIC_PRACTICE_MODEL ??
  'gpt-4o-mini'

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

export async function POST(request: NextRequest) {
  try {
    // In development, skip actual pre-generation to avoid Anthropic/Supabase
    // configuration issues and long-running background jobs.
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Pre-Gen] Skipping exam pre-generation in non-production environment')
      return NextResponse.json(
        { success: true, message: 'Pre-generation disabled in development' },
        { status: 200 }
      )
    }

    // Check if OpenAI API key is available
    if (!openai) {
      console.error('[Pre-Gen] OPENAI_API_KEY not set for exam generation')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
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

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      console.error('[Pre-Gen] Supabase environment variables are not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

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

    // Generate exam using OpenAI
    const prompt = examType === 'diagnostic' ? DIAGNOSTIC_EXAM_PROMPT : PRACTICE_EXAM_PROMPT
    const model = examType === 'diagnostic' ? DIAGNOSTIC_MODEL : PRACTICE_MODEL

    console.log(
      `[Pre-Gen] Calling OpenAI API for ${examType} exam generation using model ${model}...`
    )

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      console.error('[Pre-Gen] Empty response from OpenAI')
      return NextResponse.json(
        { error: 'Empty response from model' },
        { status: 500 }
      )
    }

    console.log(`[Pre-Gen] Received response from OpenAI (${content.length} characters)`)

    let examData: any
    try {
      examData = JSON.parse(content)
    } catch (parseError) {
      console.error('[Pre-Gen] Failed to parse JSON from OpenAI response', parseError)
      return NextResponse.json(
        { error: 'Failed to parse exam data' },
        { status: 500 }
      )
    }

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
      for (let i = 1; i <= 10; i++) {
        filename = `${examType}-exam-${String(i).padStart(3, '0')}.md`
        filePath = join(examsDir, filename)
        if (!existsSync(filePath)) {
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
