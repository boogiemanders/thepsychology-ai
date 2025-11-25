import { NextRequest, NextResponse } from 'next/server'

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

const protectAsteriskKeywords = (content: string): { protected: string; placeholders: Placeholder[] } => {
  const placeholders: Placeholder[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let match: RegExpExecArray | null
  let index = 0
  let result = content

  while ((match = regex.exec(content)) !== null) {
    const original = match[0]
    const placeholder = `@@PROTECTED_${index}@@`
    placeholders.push({ placeholder, original })
    result = result.replace(original, placeholder)
    index++
  }

  return { protected: result, placeholders }
}

const restorePlaceholders = (text: string, placeholders: Placeholder[]): string => {
  let restored = text
  for (const { placeholder, original } of placeholders) {
    restored = restored.replaceAll(placeholder, original)
  }
  return restored
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

    const translationPrompt = `Translate the following EPPP lesson content into ${targetLanguage}.

Important:
- Preserve markdown structure (headers, lists, tables, etc.).
- Do NOT translate placeholder tokens. When you see sequences like @@PROTECTED_0@@, copy them over exactly as-is and do not change their order or spacing.
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
                controller.close()
                return
              }

              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content
                if (delta) {
                  pendingOutput += delta
                  pendingOutput = restorePlaceholders(pendingOutput, placeholders)

                  // Only emit text that doesn't contain partial placeholder tokens
                  let emitLength = pendingOutput.length
                  const lastPlaceholderIndex = pendingOutput.lastIndexOf('@@PROTECTED_')
                  if (lastPlaceholderIndex !== -1) {
                    const closingIndex = pendingOutput.indexOf('@@', lastPlaceholderIndex + '@@PROTECTED_'.length)
                    if (closingIndex === -1) {
                      emitLength = lastPlaceholderIndex
                    } else {
                      emitLength = closingIndex + 2
                    }
                  }

                  if (emitLength > 0) {
                    const emitText = pendingOutput.slice(0, emitLength)
                    controller.enqueue(encoder.encode(emitText))
                    pendingOutput = pendingOutput.slice(emitLength)
                  }
                }
              } catch {
                // Ignore JSON parse errors from partial chunks
              }
            }
          }
          // Flush any remaining buffer (if parseable)
          const remaining = buffer.trim()
          if (remaining.startsWith('data:')) {
            const data = remaining.replace(/^data:\s*/, '')
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content
                if (delta) {
                  pendingOutput += delta
                  pendingOutput = restorePlaceholders(pendingOutput, placeholders)
                }
              } catch {
                // ignore
              }
            }
          }
          if (pendingOutput.length > 0) {
            controller.enqueue(encoder.encode(pendingOutput))
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
