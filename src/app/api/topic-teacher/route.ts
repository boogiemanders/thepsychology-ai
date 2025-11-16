import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { loadTopicContent, replaceMetaphors } from '@/lib/topic-content-manager'
import { loadReferenceContent } from '@/lib/eppp-reference-loader'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const getTeacherSystemPrompt = (userInterests?: string | null, referenceMaterial?: string): string => {
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

  if (referenceMaterial) {
    prompt += `\n\n## Reference Material\nYou have access to comprehensive course material on this topic. Use this material to inform your answers:\n\n${referenceMaterial}`
  }

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
    let lessonContent = ''

    if (isInitial) {
      // Initial lesson request - use pre-generated content
      try {
        console.log(`[Topic Teacher] Loading topic: "${topic}", domain: "${domain}"`)
        const preGeneratedContent = loadTopicContent(topic, domain)

        if (preGeneratedContent) {
          console.log(`[Topic Teacher] ✅ Found pre-generated content for ${topic}`)
          console.log(`[Topic Teacher] Content length: ${preGeneratedContent.baseContent.length} chars`)

          // Use pre-generated base content (with adult-friendly metaphors)
          lessonContent = preGeneratedContent.baseContent

          // Replace metaphors if user has interests
          if (userInterests) {
            console.log(`[Topic Teacher] 🔄 Personalizing metaphors for ${topic} based on interests: ${userInterests}`)
            const startTime = Date.now()
            lessonContent = await replaceMetaphors(lessonContent, userInterests, topic)
            const duration = Date.now() - startTime
            console.log(`[Topic Teacher] ✅ Metaphor replacement completed in ${duration}ms`)
          } else {
            console.log(`[Topic Teacher] ⚡ Using pre-generated content with generic metaphors for ${topic}`)
          }
        } else {
          // Fallback: Generate on-demand if no pre-generated content
          console.warn(`[Topic Teacher] ❌ No pre-generated content for ${topic}, falling back to on-demand generation`)
          console.warn(`[Topic Teacher] Topic slug would be: ${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
          console.warn(`[Topic Teacher] Domain folder would be: ${domain.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
          messages = [
            {
              role: 'user',
              content: `Please teach me about "${topic}" (Domain ${domain}). Explain it thoroughly but in simple terms, as if I'm 13 years old. Use examples and analogies to make it interesting.`,
            },
          ]

          const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            stream: false,
            system: getTeacherSystemPrompt(userInterests),
            messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
          })

          if (response.content[0].type === 'text') {
            lessonContent = response.content[0].text
          }
        }
      } catch (error) {
        console.error('Error loading pre-generated content:', error)
        // Fallback: Generate on-demand
        messages = [
          {
            role: 'user',
            content: `Please teach me about "${topic}" (Domain ${domain}). Explain it thoroughly but in simple terms, as if I'm 13 years old. Use examples and analogies to make it interesting.`,
          },
        ]

        const response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          stream: false,
          system: getTeacherSystemPrompt(userInterests),
          messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
        })

        if (response.content[0].type === 'text') {
          lessonContent = response.content[0].text
        }
      }
    } else {
      // Conversational follow-up - use streaming
      messages = [
        ...messageHistory,
        { role: 'user', content: userMessage },
      ]
    }

    // For initial lessons with cached content, return immediately without streaming
    if (isInitial && lessonContent) {
      const stream = new ReadableStream({
        start(controller) {
          try {
            // Stream the content in chunks to simulate natural streaming
            const encoder = new TextEncoder()
            const chunkSize = 100
            for (let i = 0; i < lessonContent.length; i += chunkSize) {
              const chunk = lessonContent.slice(i, i + chunkSize)
              controller.enqueue(encoder.encode(chunk))
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
    }

    // For follow-ups, load the EPPP Guts reference material (not pre-generated content)
    // This gives more detailed, comprehensive answers to follow-up questions
    let referenceMaterial: string | undefined
    if (!isInitial && topic) {
      // Extract domain ID from domain name for the loader
      // Domain format: "1: Biological Bases" → domainId: "1"
      const domainId = domain.split(':')[0].trim()
      const referenceContent = loadReferenceContent(topic, domainId)
      if (referenceContent) {
        referenceMaterial = referenceContent
        console.log(`[Topic Teacher] Loaded EPPP reference material for follow-up: ${topic}`)
      } else {
        console.warn(`[Topic Teacher] No EPPP reference found for ${topic}, using pre-generated content`)
        // Fallback to pre-generated content if EPPP reference not found
        const preGenerated = loadTopicContent(topic, domain)
        if (preGenerated) {
          referenceMaterial = preGenerated.content
        }
      }
    }

    // For follow-ups, stream the response
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      stream: true,
      system: getTeacherSystemPrompt(userInterests, referenceMaterial),
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
