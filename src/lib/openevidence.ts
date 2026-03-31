import 'server-only'

import OpenAI from 'openai'

export const OPENEVIDENCE_BASE_URL = 'https://api.openevidence.com/v1'

/**
 * Returns an OpenAI-compatible client pointed at the OpenEvidence API.
 * Set OPENEVIDENCE_API_KEY in your environment to enable.
 */
export function getOpenEvidenceClient(): OpenAI {
  const apiKey = process.env.OPENEVIDENCE_API_KEY
  if (!apiKey) {
    throw new Error('OPENEVIDENCE_API_KEY is not set')
  }
  return new OpenAI({
    apiKey,
    baseURL: OPENEVIDENCE_BASE_URL,
  })
}

export type OpenEvidenceMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}
