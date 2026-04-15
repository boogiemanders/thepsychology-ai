/**
 * Thin HTTP client for local Ollama API.
 * All PHI stays on device — Ollama runs at localhost.
 * Uses streaming mode to avoid fetch timeout issues on slow CPU inference.
 */

const DEFAULT_ENDPOINT = 'http://localhost:11434'
const GENERATE_TIMEOUT_MS = 300_000 // 5 minutes for long transcripts on CPU

interface OllamaTagsResponse {
  models: Array<{ name: string }>
}

interface OllamaStreamChunk {
  response: string
  done: boolean
}

export interface OllamaEndpointDiagnostic {
  ok: boolean
  status: number | null
  error?: string
}

function buildOllamaErrorMessage(
  status: number | null,
  endpoint: string,
  details = ''
): string {
  if (status === 403) {
    return [
      `Ollama blocked this Chrome extension at ${endpoint}.`,
      'Allow browser-extension origins by setting',
      'OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*,safari-web-extension://*',
      'and restart Ollama.',
    ].join(' ')
  }

  if (status === null) {
    return `Could not reach Ollama at ${endpoint}. Make sure Ollama is running and listening on that URL.`
  }

  const suffix = details ? ` ${details}` : ''
  return `Ollama returned ${status} at ${endpoint}.${suffix}`.trim()
}

export async function diagnoseOllamaEndpoint(endpoint = DEFAULT_ENDPOINT): Promise<OllamaEndpointDiagnostic> {
  try {
    const res = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(5_000) })
    if (res.ok) {
      return { ok: true, status: res.status }
    }

    const text = await res.text().catch(() => '')
    return {
      ok: false,
      status: res.status,
      error: buildOllamaErrorMessage(res.status, endpoint, text.slice(0, 200)),
    }
  } catch {
    return {
      ok: false,
      status: null,
      error: buildOllamaErrorMessage(null, endpoint),
    }
  }
}

export async function checkOllamaHealth(endpoint = DEFAULT_ENDPOINT): Promise<boolean> {
  const diagnostic = await diagnoseOllamaEndpoint(endpoint)
  return diagnostic.ok
}

export async function checkModelAvailable(model: string, endpoint = DEFAULT_ENDPOINT): Promise<boolean> {
  try {
    const res = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(5_000) })
    if (!res.ok) return false
    const data = (await res.json()) as OllamaTagsResponse
    return data.models.some((m) => m.name === model || m.name.startsWith(`${model}:`))
  } catch {
    return false
  }
}

export async function generateCompletion(
  prompt: string,
  system: string,
  model: string,
  endpoint = DEFAULT_ENDPOINT
): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS)

  try {
    // Use streaming mode — Ollama sends headers immediately, then NDJSON chunks.
    // This avoids fetch headers timeout issues on slow CPU inference.
    const res = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: true,
        options: {
          temperature: 0.2,
          num_predict: 4096,
          num_ctx: 16384,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(buildOllamaErrorMessage(res.status, endpoint, text.slice(0, 200)))
    }

    // Collect streamed NDJSON chunks into final response
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body from Ollama')

    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      // Each line is a JSON object
      for (const line of text.split('\n')) {
        if (!line.trim()) continue
        try {
          const chunk = JSON.parse(line) as OllamaStreamChunk
          fullResponse += chunk.response
          if (chunk.done) return fullResponse
        } catch {
          // partial JSON line, will be completed in next chunk
        }
      }
    }

    return fullResponse
  } finally {
    clearTimeout(timeoutId)
  }
}
