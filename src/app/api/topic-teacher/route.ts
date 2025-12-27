import { NextRequest, NextResponse } from 'next/server'
import { loadTopicContent, loadFreeTopicContent, replaceMetaphors, stripMetaphorMarkers } from '@/lib/topic-content-manager'
import { loadReferenceContent } from '@/lib/eppp-reference-loader'
import OpenAI from 'openai'
import { logUsageEvent } from '@/lib/usage-events'
import { isProPromoActive } from '@/lib/subscription-utils'

const openaiApiKey = process.env.OPENAI_API_KEY
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null

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

function normalizeLanguagePreference(raw?: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (lower === 'english' || lower === 'en' || lower === 'eng') {
    return null
  }
  return trimmed
}

function protectAsteriskKeywords(
  content: string
): { protectedContent: string; placeholders: Array<{ placeholder: string; original: string }> } {
  const placeholders: Array<{ placeholder: string; original: string }> = []
  let protectedContent = content

  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let match: RegExpExecArray | null
  let index = 0

  while ((match = regex.exec(content)) !== null) {
    const original = match[0]
    const placeholder = `@@PROTECTED_${index}@@`
    placeholders.push({ placeholder, original })
    protectedContent = protectedContent.replace(original, placeholder)
    index++
  }

  return { protectedContent, placeholders }
}

async function translateLessonContent(
  content: string,
  languagePreference?: string | null
): Promise<string> {
  const targetLanguage = normalizeLanguagePreference(languagePreference)
  if (!targetLanguage || !openai) return content

  try {
    const { protectedContent, placeholders } = protectAsteriskKeywords(content)

    const translationPrompt = `Translate the following EPPP lesson content into ${targetLanguage}.

Important:
- Keep all placeholder tokens like @@PROTECTED_0@@ exactly as they are (do NOT translate or modify them).
- Do not translate any markdown emphasis segments that have been replaced by these placeholders; they will be re-inserted later.
- Preserve the markdown structure (headers, lists, tables, etc.).

Content to translate:
${protectedContent}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: translationPrompt,
        },
      ],
    })

    let translated = completion.choices[0]?.message?.content || protectedContent

    for (const { placeholder, original } of placeholders) {
      translated = translated.replaceAll(placeholder, original)
    }

    console.log(`[Topic Teacher] ✅ Translated lesson to ${targetLanguage}`)
    return translated
  } catch (error) {
    console.error('[Topic Teacher] Error translating lesson content:', error)
    return content
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic,
      domain,
      messageHistory = [],
      userMessage,
      isInitial,
      userInterests,
      subscriptionTier,
      languagePreference,
      userId,
    } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic required' },
        { status: 400 }
      )
    }

    let messages: Message[] = []
    let lessonContent = ''
    let baseContentOnly = ''

    const tier: string | undefined = subscriptionTier
    const promoActive = isProPromoActive()
    const isFreeTier = (tier === 'free' || !tier) && !promoActive

    if (isInitial) {
      // Initial lesson request - use pre-generated content
      try {
        console.log(`[Topic Teacher] Loading topic: "${topic}", domain: "${domain}"`)
        const preGeneratedContent = isFreeTier
          ? loadFreeTopicContent(topic, domain)
          : loadTopicContent(topic, domain)

        if (preGeneratedContent) {
          console.log(`[Topic Teacher] ✅ Found pre-generated content for ${topic}`)
          console.log(`[Topic Teacher] Content length: ${preGeneratedContent.baseContent.length} chars`)

          // Store the base content
          baseContentOnly = stripMetaphorMarkers(preGeneratedContent.baseContent)

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
            lessonContent = stripMetaphorMarkers(lessonContent)
          }

          // Translate lesson content if user has a language preference
          lessonContent = await translateLessonContent(lessonContent, languagePreference)
        } else {
          // No pre-generated content found
          console.error(`[Topic Teacher] ❌ No pre-generated content for ${topic}`)
          console.error(`[Topic Teacher] Topic slug: ${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
          console.error(`[Topic Teacher] Domain ID: ${domain}`)

          const message = isFreeTier
            ? `This topic is part of the full Pro library. Upgrade to Pro to unlock this lesson.`
            : `No pre-generated content found for topic: ${topic}. Please ensure the content exists in topic-content-v3-test.`

          return NextResponse.json(
            { error: message },
            { status: isFreeTier ? 403 : 404 }
          )
        }
      } catch (error) {
        console.error('[Topic Teacher] Error loading pre-generated content:', error)
        return NextResponse.json(
          { error: `Failed to load pre-generated content for topic: ${topic}. Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        )
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
          // Send base content length so frontend knows if base content is available
          'X-Base-Content-Length': baseContentOnly.length.toString(),
          // Encode base content in base64 to avoid header encoding issues
          'X-Base-Content': baseContentOnly ? Buffer.from(baseContentOnly).toString('base64') : '',
        },
      })
    }

    // For follow-ups, load the EPPP Guts reference material (not pre-generated content)
    // This gives more detailed, comprehensive answers to follow-up questions
    let referenceMaterial: string | undefined
    if (!isInitial && topic && domain) {
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

    if (!openai) {
      console.error('[Topic Teacher] Missing OPENAI_API_KEY for follow-up')
      return NextResponse.json(
        { error: 'Topic Teacher follow-up is not configured (missing OPENAI_API_KEY).' },
        { status: 500 }
      )
    }

    // For follow-ups, call OpenAI and then stream the full response text in chunks
    const systemPrompt = getTeacherSystemPrompt(userInterests, referenceMaterial)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(messages as Array<{ role: 'user' | 'assistant'; content: string }>),
      ],
    })

    await logUsageEvent({
      userId: typeof userId === 'string' ? userId : null,
      eventName: 'topic-teacher.followup',
      endpoint: '/api/topic-teacher',
      model: 'gpt-4o-mini',
      metadata: {
        topic,
        domain,
        languagePreference: languagePreference ?? null,
      },
    })

    let fullText = completion.choices[0]?.message?.content || ''

    // Translate follow-up responses if user has a language preference
    fullText = await translateLessonContent(fullText, languagePreference)

    const stream = new ReadableStream({
      start(controller) {
        try {
          const encoder = new TextEncoder()
          const chunkSize = 100
          for (let i = 0; i < fullText.length; i += chunkSize) {
            const chunk = fullText.slice(i, i + chunkSize)
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
  } catch (error) {
    console.error('Error in topic teacher:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    )
  }
}
