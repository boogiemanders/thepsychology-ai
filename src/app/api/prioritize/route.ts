import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const PRIORITIZE_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) study advisor and psychologist.

You will receive detailed exam results from an EPPP diagnostic or practice exam, including:
- All questions and answer choices
- User's selected answers
- Correct answers
- Question domains and difficulty levels
- Overall score and performance metrics

Your task is to provide a comprehensive, actionable analysis that helps the student prioritize their study efforts.

Your analysis should include:

## Overall Performance
- Overall score percentage
- Total questions answered
- Strengths and weaknesses summary

## Domain Breakdown
- Performance by each of the 8 EPPP domains
- Identify which domains need the most attention
- Highlight strongest domains

## Priority Study Recommendations
Provide 5-7 specific, actionable study priorities ranked from highest to lowest urgency:
1. For each priority, explain:
   - What domain/topic it relates to
   - Why it's important (tied to wrong answers or knowledge gaps)
   - Concrete study actions (specific chapters, concepts to review)
   - Estimated study time needed

## Detailed Question Analysis (if diagnostic exam)
- Review specific questions the user got wrong
- Identify patterns in mistakes (conceptual gaps, misreading, etc.)
- Provide targeted recommendations for each knowledge gap

## Study Strategy
- Recommend a study schedule based on their performance
- Suggest practice approaches for weak areas
- Provide test-taking tips based on observed patterns

Format your response using clear markdown headers (##) and bullet points for easy reading. Be specific, encouraging, and actionable.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examResults } = body

    if (!examResults) {
      return NextResponse.json(
        { error: 'Exam results required' },
        { status: 400 }
      )
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      stream: true,
      messages: [
        {
          role: 'user',
          content: `${PRIORITIZE_PROMPT}\n\nHere are the exam results to analyze:\n\n${examResults}`,
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
    console.error('Error analyzing exam results:', error)
    return NextResponse.json(
      { error: 'Failed to analyze exam results' },
      { status: 500 }
    )
  }
}
