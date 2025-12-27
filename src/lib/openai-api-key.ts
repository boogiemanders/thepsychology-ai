import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

export function sanitizeOpenAIApiKey(raw?: string | null): string | null {
  if (!raw) return null

  let value = raw.trim()
  if (!value) return null

  // Strip zero-width characters (common copy/paste issue).
  value = value.replace(/[\u200B-\u200D\uFEFF]/g, '')

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

  // Keep only printable ASCII (defensive).
  value = value.replace(/[^\x21-\x7E]/g, '')

  return value || null
}

function readDotenvLocalValue(key: string): string | null {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const text = fs.readFileSync(envPath, 'utf8')
    const line = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith('#') && l.startsWith(`${key}=`))
    if (!line) return null
    let value = line.slice(key.length + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return value.trim() || null
  } catch {
    return null
  }
}

export function getOpenAIApiKey(): string | null {
  const fromProcess = sanitizeOpenAIApiKey(process.env.OPENAI_API_KEY)
  if (process.env.NODE_ENV === 'production') return fromProcess

  const fromEnvLocal = sanitizeOpenAIApiKey(readDotenvLocalValue('OPENAI_API_KEY'))
  if (fromEnvLocal && fromProcess && fromEnvLocal !== fromProcess) {
    console.warn('[openai-api-key] Detected differing OPENAI_API_KEY values; using .env.local value in development.')
    return fromEnvLocal
  }

  return fromProcess ?? fromEnvLocal
}
