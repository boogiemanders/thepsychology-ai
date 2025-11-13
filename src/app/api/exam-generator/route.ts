import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// FULL 225-QUESTION VERSION WITH UNSCORED EXPERIMENTAL QUESTIONS:
const EXAM_GENERATOR_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) exam creator.

Your task is to generate a comprehensive 225-question practice exam following official ASPPB specifications.

The exam should include:
- 225 questions total
- Proper domain distribution following EPPP weights
- 180 scored questions (80%) - standard and medium difficulty questions that count toward score
- 45 unscored experimental questions (20%) - harder questions for research/development that DO NOT count toward score
- Multiple choice format with 4 options each
- Answer key with brief explanations
- Questions distributed across all 8 EPPP domains

IMPORTANT: Mark the unscored questions clearly with "isScored": false. These should be noticeably harder than the scored questions and are used for data collection. Users will see their score calculated only from the 180 scored questions, not the 45 unscored ones.

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
      "isScored": true,
      "type": "standard"
    }
  ]
}

Start generating the exam now. Format each question clearly. Remember: exactly 180 questions with "isScored": true, and 45 questions with "isScored": false.`

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
