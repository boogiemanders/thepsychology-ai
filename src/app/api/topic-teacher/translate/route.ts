import { NextRequest, NextResponse } from 'next/server'
import { logUsageEvent } from '@/lib/usage-events'

const openaiApiKey = process.env.OPENAI_API_KEY

const normalizeLanguagePreference = (raw?: string | null): string | null => {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (lower === 'english' || lower === 'en' || lower === 'eng') {
    return null
  }
  return trimmed
}

interface Placeholder {
  placeholder: string
  original: string
}

const PLACEHOLDER_PREFIX = '@@PROTECTED_'

const protectAsteriskKeywords = (content: string): { protected: string; placeholders: Placeholder[] } => {
  const placeholders: Placeholder[] = []
  let index = 0
  const protectedContent = content.replace(/(\*\*[^*]+\*\*|\*[^*]+\*)/g, (match) => {
    const placeholder = `${PLACEHOLDER_PREFIX}${index}@@`
    placeholders.push({ placeholder, original: match })
    index++
    return placeholder
  })
  return { protected: protectedContent, placeholders }
}

const getPartialPlaceholderStart = (text: string): number => {
  for (let i = Math.min(text.length, PLACEHOLDER_PREFIX.length); i > 0; i--) {
    const suffix = text.slice(-i)
    if (PLACEHOLDER_PREFIX.startsWith(suffix)) {
      return text.length - i
    }
  }
  return -1
}

const processBuffer = (
  buffer: string,
  placeholderMap: Map<string, string>,
  flushAll: boolean = false
): { emitText: string; remaining: string } => {
  let working = buffer
  let emitText = ''

  while (working.length > 0) {
    const start = working.indexOf(PLACEHOLDER_PREFIX)
    if (start === -1) {
      if (!flushAll) {
        const partialStart = getPartialPlaceholderStart(working)
        if (partialStart !== -1) {
          emitText += working.slice(0, partialStart)
          working = working.slice(partialStart)
          break
        }
      }
      emitText += working
      working = ''
      break
    }

    const closingIndex = working.indexOf('@@', start + PLACEHOLDER_PREFIX.length)
    if (closingIndex === -1) {
      emitText += working.slice(0, start)
      working = working.slice(start)
      break
    }

    const placeholder = working.slice(start, closingIndex + 2)
    const original = placeholderMap.get(placeholder) ?? ''
    emitText += working.slice(0, start) + original
    working = working.slice(closingIndex + 2)
  }

  if (flushAll && working.length > 0) {
    emitText += working.replace(/@@PROTECTED_\d+@@/g, (ph) => placeholderMap.get(ph) ?? '')
    working = ''
  }

  return { emitText, remaining: working }
}

export async function POST(request: NextRequest) {
  if (!openaiApiKey) {
    return NextResponse.json(
      { error: 'Topic Teacher translation is not configured.' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { content, languagePreference } = body as {
      content?: string
      languagePreference?: string
    }

    const trimmedContent = typeof content === 'string' ? content.trim() : ''
    const targetLanguage = normalizeLanguagePreference(languagePreference)

    if (!trimmedContent || !targetLanguage) {
      return NextResponse.json(
        { error: 'Content and target language are required.' },
        { status: 400 }
      )
    }

    const { protected: protectedContent, placeholders } = protectAsteriskKeywords(trimmedContent)
    const placeholderMap = new Map<string, string>()
    placeholders.forEach(({ placeholder, original }) => {
      placeholderMap.set(placeholder, original)
    })

    const translationPrompt = `Translate the following EPPP lesson content into ${targetLanguage}.

Important:
- Preserve markdown structure (headers, lists, tables, etc.).
- Do NOT translate placeholder tokens. When you see sequences like @@PROTECTED_0@@, copy them exactly as-is; they will be replaced later with English keywords.
- Use natural language appropriate for a study guide.

Content to translate:
${protectedContent}`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        stream: true,
        messages: [
          {
            role: 'user',
            content: translationPrompt,
          },
        ],
      }),
    })

    await logUsageEvent({
      userId: null,
      eventName: 'topic-teacher.translate',
      endpoint: '/api/topic-teacher/translate',
      model: 'gpt-4o-mini',
      metadata: {
        targetLanguage,
      },
    })

    if (!openaiResponse.ok || !openaiResponse.body) {
      const errorText = await openaiResponse.text()
      return NextResponse.json(
        { error: errorText || 'Failed to translate content' },
        { status: openaiResponse.status || 500 }
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body!.getReader()
        let buffer = ''
        let pendingOutput = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            const segments = buffer.split('\n\n')
            buffer = segments.pop() || ''

            for (const segment of segments) {
              const line = segment.trim()
              if (!line.startsWith('data:')) continue

              const data = line.replace(/^data:\s*/, '')
              if (data === '[DONE]') {
                const { emitText } = processBuffer(pendingOutput, placeholderMap, true)
                if (emitText) {
                  controller.enqueue(encoder.encode(emitText))
                }
                controller.close()
                return
              }

              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content
                if (delta) {
                  pendingOutput += delta
                  const { emitText, remaining } = processBuffer(pendingOutput, placeholderMap)
                  pendingOutput = remaining
                  if (emitText) {
                    controller.enqueue(encoder.encode(emitText))
                  }
                }
              } catch {
                // Ignore JSON parse errors from partial chunks
              }
            }
          }

          const { emitText } = processBuffer(pendingOutput, placeholderMap, true)
          if (emitText) {
            controller.enqueue(encoder.encode(emitText))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('[Topic Teacher Translate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to translate content' },
      { status: 500 }
    )
  }
}
