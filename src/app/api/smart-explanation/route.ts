import { NextRequest, NextResponse } from 'next/server'
import { loadReferenceContent } from '@/lib/eppp-reference-loader'
import { getUserCurrentInterest } from '@/lib/interests'
import OpenAI from 'openai'
import { getOpenAIApiKey } from '@/lib/openai-api-key'

const openaiApiKey = getOpenAIApiKey()
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null

interface SmartExplanationRequest {
  question: string
  options: string[]
  correctAnswer: string
  selectedAnswer: string
  topicName: string
  domain: string
  userId?: string | null
}

function buildPrompt(
  referenceContent: string,
  question: string,
  options: string[],
  correctAnswer: string,
  selectedAnswer: string,
  userInterests?: string | null
): string {
  const optionsText = options
    .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`)
    .join('\n')

  let prompt = `You are an EPPP psychology tutor helping a student understand why they got a question wrong.

## Reference Material (from EPPP study guide)
Use ONLY this material to inform your explanation:

${referenceContent}

---

## The Question
${question}

## Answer Choices
${optionsText}

## Correct Answer
${correctAnswer}

## Student's Wrong Answer
${selectedAnswer}

---

## Your Task
Using ONLY the reference material above, provide a helpful explanation:

1. **Why the correct answer is right**: Explain the psychology concept that makes "${correctAnswer}" the correct choice. Reference specific information from the study material.

2. **Why their answer was a common mistake**: Gently explain why "${selectedAnswer}" might seem reasonable but isn't correct. Focus on the learning, not judgment.

3. **Memory tip**: Give them a simple, memorable way to remember this concept for the exam.

Keep your response concise (200-300 words). Use a warm, encouraging tone.`

  if (userInterests) {
    prompt += `\n\n**Personalization**: The student is interested in ${userInterests}. Where possible, use a brief analogy or example related to their interests to make the explanation more memorable.`
  }

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const body: SmartExplanationRequest = await request.json()
    const { question, options, correctAnswer, selectedAnswer, topicName, domain, userId } = body

    if (!question || !correctAnswer || !selectedAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields: question, correctAnswer, selectedAnswer' },
        { status: 400 }
      )
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Load reference content from eppp-reference og/
    const referenceContent = loadReferenceContent(topicName, domain)

    if (!referenceContent) {
      return NextResponse.json(
        { error: `No reference content found for topic: ${topicName} in domain: ${domain}` },
        { status: 404 }
      )
    }

    // Get user interests if userId provided
    let userInterests: string | null = null
    if (userId) {
      userInterests = await getUserCurrentInterest(userId)
    }

    // Build the prompt
    const prompt = buildPrompt(
      referenceContent,
      question,
      options || [],
      correctAnswer,
      selectedAnswer,
      userInterests
    )

    // Call OpenAI with streaming
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful EPPP psychology tutor. Always base your explanations on the provided reference material.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
      stream: true,
    })

    // Create a streaming response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('[smart-explanation] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
