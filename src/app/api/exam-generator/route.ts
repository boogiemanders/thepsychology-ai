import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// FULL 225-QUESTION VERSION (COMMENTED OUT FOR TESTING):
// const EXAM_GENERATOR_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) exam creator.
//
// Your task is to generate a comprehensive 225-question practice exam following official ASPPB specifications.
//
// The exam should include:
// - 225 questions total
// - Proper domain distribution following EPPP weights
// - 175 regular questions (counted for scoring)
// - 50 comparative questions testing distinctions
// - Multiple choice format with 4 options each
// - Answer key with brief explanations
// - Difficulty balanced throughout
//
// Generate the exam in JSON format with this structure:
// {
//   "questions": [
//     {
//       "id": number,
//       "question": "Question text",
//       "options": ["A", "B", "C", "D"],
//       "correct_answer": "A",
//       "explanation": "Why this is correct",
//       "domain": "Domain 1-8",
//       "difficulty": "easy|medium|hard",
//       "type": "standard|comparative|experimental"
//     }
//   ]
// }
//
// Start generating the exam now. Format each question clearly.`

// TEMPORARY 2-QUESTION VERSION FOR TESTING:
const EXAM_GENERATOR_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) exam creator.

Your task is to generate a practice exam with 2 questions following ASPPB specifications.

The exam should include:
- 2 questions total (for testing purposes)
- Multiple choice format with 4 options each
- Answer key with brief explanations
- Mix of different EPPP domains

Generate the exam in JSON format with this structure:
{
  "questions": [
    {
      "id": number,
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Why this is correct",
      "domain": "Domain 1-8",
      "difficulty": "easy|medium|hard",
      "type": "standard"
    }
  ]
}

Start generating the exam now. Format each question clearly.`

export async function POST(request: NextRequest) {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16000,
      stream: true,
      messages: [
        {
          role: 'user',
          content: EXAM_GENERATOR_PROMPT,
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
