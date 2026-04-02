/**
 * Thin HTTP client for local Ollama API.
 * All PHI stays on device — Ollama runs at localhost.
 */

const DEFAULT_ENDPOINT = 'http://localhost:11434'
const GENERATE_TIMEOUT_MS = 120_000 // 2 minutes for long transcripts

interface OllamaTagsResponse {
  models: Array<{ name: string }>
}

interface OllamaGenerateResponse {
  response: string
  done: boolean
}

export async function checkOllamaHealth(endpoint = DEFAULT_ENDPOINT): Promise<boolean> {
  try {
    const res = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(5_000) })
    return res.ok
  } catch {
    return false
  }
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
    const res = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 4096,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Ollama returned ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = (await res.json()) as OllamaGenerateResponse
    return data.response
  } finally {
    clearTimeout(timeoutId)
  }
}
