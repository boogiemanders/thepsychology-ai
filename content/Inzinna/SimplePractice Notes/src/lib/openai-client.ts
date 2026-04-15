/**
 * Thin HTTP client for OpenAI API.
 * Used for clinical reasoning on de-identified data only — PHI never leaves the device.
 * Supports SSE streaming (OpenAI uses text/event-stream, different from Ollama's NDJSON).
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const GENERATE_TIMEOUT_MS = 120_000 // 2 minutes

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIResponse {
  choices: Array<{
    message: { content: string }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface OpenAIStreamDelta {
  choices: Array<{
    delta: { content?: string }
    finish_reason: string | null
  }>
}

export async function checkOpenAIHealth(apiKey: string): Promise<boolean> {
  if (!apiKey) return false
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5_000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function generateOpenAICompletion(
  prompt: string,
  system: string,
  model: string,
  apiKey: string
): Promise<string> {
  const messages: OpenAIMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ]

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS)

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 4096,
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`OpenAI returned ${res.status}: ${text.slice(0, 200)}`)
    }

    // SSE streaming: parse text/event-stream
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body from OpenAI')

    const decoder = new TextDecoder()
    let fullResponse = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE lines
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? '' // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return fullResponse

        try {
          const chunk = JSON.parse(data) as OpenAIStreamDelta
          const content = chunk.choices?.[0]?.delta?.content
          if (content) fullResponse += content
        } catch {
          // partial or malformed chunk, skip
        }
      }
    }

    return fullResponse
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Non-streaming fallback for simpler use cases.
 */
export async function generateOpenAICompletionSync(
  prompt: string,
  system: string,
  model: string,
  apiKey: string
): Promise<string> {
  const messages: OpenAIMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ]

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI returned ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as OpenAIResponse
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI returned empty response')

  if (data.usage) {
    console.log('[SPN] OpenAI usage:', data.usage)
  }

  return content
}
