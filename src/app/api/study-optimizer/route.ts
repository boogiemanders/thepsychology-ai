import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const STUDY_OPTIMIZER_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) study advisor.

You will receive exam results from an EPPP practice exam. Your task is to:

1. Identify which domains the user struggled with most
2. Extract specific topics within those domains that need attention
3. Calculate performance percentages per domain
4. Recommend a prioritized study plan based on:
   - Lowest performance areas (study these first)
   - Learning efficiency (quick wins before harder topics)
   - Domain dependencies

Provide your analysis in a structured format with:
- Overall exam performance percentage
- Performance breakdown by domain
- Top 5 priority topics to study (from highest to lowest priority)
- Brief explanation of why each topic is prioritized
- Estimated study time for each topic

Format your response clearly with headers and bullet points for easy reading.`

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
          content: `${STUDY_OPTIMIZER_PROMPT}\n\nHere are the exam results to analyze:\n\n${examResults}`,
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
    console.error('Error analyzing exam:', error)
    return NextResponse.json(
      { error: 'Failed to analyze exam results' },
      { status: 500 }
    )
  }
}
