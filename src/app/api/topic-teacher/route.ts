import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const getTeacherSystemPrompt = (userInterests?: string | null): string => {
  let prompt = `You are an expert EPPP psychology teacher who explains concepts using simple, engaging language (13-year-old reading level) with custom metaphors and analogies.

Your teaching style:
- Use everyday analogies and examples
- Avoid jargon, define technical terms clearly
- Be encouraging and supportive
- Break complex ideas into simple steps
- Use stories and examples to illustrate points
- End lessons with key takeaways
- Use a measured, calm tone - avoid excessive enthusiasm or exclamation marks
- Never start lessons with "Hey!" or similar casual greetings

Formatting guidelines:
- Use markdown lists (- or 1.) to break up content visually, especially for comparisons, strengths/weaknesses, or multiple items
- Do NOT use code blocks or backticks for regular content like comparison charts or lists
- Use markdown tables for side-by-side comparisons when appropriate
- Use headers to organize sections clearly
- Minimize emoji usage - use emojis very sparingly and only at the beginning of section titles if at all, NOT before individual bullet points
- Use bold (**word**) ONLY for key terms and important concepts - not for full sentences or multiple words
- Avoid over-bolding: bold sparingly, only highlight 1-2 words per paragraph that are truly critical to understand
- Add extra spacing between sections for readability
- Keep paragraphs concise (2-3 sentences), with lots of breathing room

You're teaching EPPP (Examination for Professional Practice in Psychology) content. Cover the topic comprehensively but in an accessible way. Be ready for follow-up questions about the topic and answer them thoroughly.`

  if (userInterests) {
    prompt += `\n\nThe student is interested in: ${userInterests}. When possible, use examples and analogies related to their interests to make the content more engaging and relatable.`
  }

  return prompt
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, domain, messageHistory = [], userMessage, isInitial, userInterests } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic required' },
        { status: 400 }
      )
    }

    let messages: Message[] = []

    if (isInitial) {
      // Initial lesson request
      messages = [
        {
          role: 'user',
          content: `Please teach me about "${topic}" (Domain ${domain}). Explain it thoroughly but in simple terms, as if I'm 13 years old. Use examples and analogies to make it interesting.`,
        },
      ]
    } else {
      // Conversational follow-up
      messages = [
        ...messageHistory,
        { role: 'user', content: userMessage },
      ]
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      stream: true,
      system: getTeacherSystemPrompt(userInterests),
      messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
    })

    // Convert stream to ReadableStream
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
    console.error('Error in topic teacher:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    )
  }
}
