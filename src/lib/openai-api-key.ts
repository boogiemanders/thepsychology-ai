export function sanitizeOpenAIApiKey(raw?: string | null): string | null {
  if (!raw) return null

  let value = raw.trim()
  if (!value) return null

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }

  // Common dotenv pitfall: inline comments (e.g. OPENAI_API_KEY=sk-... # local)
  // OpenAI keys never contain spaces or '#', so stripping is safe.
  if (value.includes('#')) {
    value = value.split('#')[0].trim()
  }

  value = value.split(/\s+/)[0]?.trim() ?? ''

  return value || null
}

export function getOpenAIApiKey(): string | null {
  return sanitizeOpenAIApiKey(process.env.OPENAI_API_KEY)
}

