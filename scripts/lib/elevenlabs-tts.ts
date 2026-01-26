/**
 * ElevenLabs TTS API integration.
 *
 * Prerequisites:
 *   - Create account at https://elevenlabs.io
 *   - Get API key from https://elevenlabs.io/settings/api-keys
 *   - Set ELEVENLABS_API_KEY in .env.local
 */

import * as https from 'https'

// Default voice IDs from ElevenLabs
export const ELEVENLABS_VOICES = {
  rachel: '21m00Tcm4TlvDq8ikWAM', // Calm female
  domi: 'AZnzlk1XvdvUeBnXmlld', // Strong female
  bella: 'EXAVITQu4vr4xnSDxMaL', // Soft female
  antoni: 'ErXwobaYiN019PkySvjV', // Well-rounded male
  josh: 'TxGEqnHWrfWFTfGW9XjX', // Deep male
  arnold: 'VR6AewLTigWG4xSOukaG', // Crisp male
  adam: 'pNInz6obpgDQGcFmaJgB', // Deep male
  sam: 'yoZ06aMxZJJ28mfd3POQ', // Raspy male
} as const

export type ElevenLabsVoice = keyof typeof ELEVENLABS_VOICES

// Models
export const ELEVENLABS_MODELS = {
  multilingual_v2: 'eleven_multilingual_v2', // Best quality, slower
  turbo_v2_5: 'eleven_turbo_v2_5', // Fast, good quality
  turbo_v2: 'eleven_turbo_v2', // Fastest
  monolingual_v1: 'eleven_monolingual_v1', // English only, legacy
} as const

export type ElevenLabsModel = keyof typeof ELEVENLABS_MODELS

const DEFAULT_MODEL = ELEVENLABS_MODELS.turbo_v2_5
const DEFAULT_VOICE = ELEVENLABS_VOICES.adam
const DEFAULT_TIMEOUT_MS = 60_000

export type ElevenLabsTTSOptions = {
  apiKey: string
  text: string
  voiceId?: string
  modelId?: string
  stability?: number // 0-1, default 0.5
  similarityBoost?: number // 0-1, default 0.75
  style?: number // 0-1, default 0 (only for v2 models)
  speakerBoost?: boolean // default true
  outputFormat?: 'mp3_44100_128' | 'mp3_44100_192' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100'
  timeoutMs?: number
}

export type ElevenLabsTTSResult = {
  ok: boolean
  status: number
  buffer: Buffer | null
  errorText: string | null
  characterCount?: number
}

/**
 * Generate speech using ElevenLabs API.
 */
export async function elevenLabsTTS(options: ElevenLabsTTSOptions): Promise<ElevenLabsTTSResult> {
  const {
    apiKey,
    text,
    voiceId = DEFAULT_VOICE,
    modelId = DEFAULT_MODEL,
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0,
    speakerBoost = true,
    outputFormat = 'mp3_44100_128',
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options

  const payload = JSON.stringify({
    text,
    model_id: modelId,
    voice_settings: {
      stability,
      similarity_boost: similarityBoost,
      style,
      use_speaker_boost: speakerBoost,
    },
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`,
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const status = res.statusCode ?? 0
        const chunks: Buffer[] = []

        res.setTimeout(timeoutMs, () => {
          res.destroy(new Error(`ElevenLabs response timed out after ${timeoutMs}ms`))
        })

        res.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        })

        res.on('end', () => {
          const buffer = Buffer.concat(chunks)

          if (status >= 200 && status < 300) {
            // Get character count from headers if available
            const charCount = res.headers['character-count']
            resolve({
              ok: true,
              status,
              buffer,
              errorText: null,
              characterCount: charCount ? parseInt(charCount as string, 10) : undefined,
            })
            return
          }

          // Error response
          let errorText = buffer.toString('utf8')
          try {
            const errorJson = JSON.parse(errorText)
            errorText = errorJson.detail?.message || errorJson.detail || errorText
          } catch {
            // Keep raw text
          }

          resolve({ ok: false, status, buffer: null, errorText })
        })

        res.on('error', reject)
      }
    )

    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`ElevenLabs request timed out after ${timeoutMs}ms`))
    })
    req.write(payload)
    req.end()
  })
}

/**
 * Generate speech with retry logic.
 */
export async function elevenLabsTTSWithRetry(
  options: ElevenLabsTTSOptions & {
    maxRetries?: number
    retryDelayMs?: number
  }
): Promise<ElevenLabsTTSResult> {
  const { maxRetries = 3, retryDelayMs = 1000, ...ttsOptions } = options
  let attempt = 0

  while (true) {
    let result: ElevenLabsTTSResult
    try {
      result = await elevenLabsTTS(ttsOptions)
    } catch (err) {
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * Math.pow(2, attempt))
        attempt++
        continue
      }
      return {
        ok: false,
        status: 0,
        buffer: null,
        errorText: (err as Error)?.message ?? String(err),
      }
    }

    if (result.ok) return result

    // Don't retry auth errors
    if (result.status === 401 || result.status === 403) {
      return result
    }

    // Retry on rate limit or server errors
    const retryable = result.status === 429 || result.status >= 500
    if (!retryable || attempt >= maxRetries) return result

    await sleep(retryDelayMs * Math.pow(2, attempt))
    attempt++
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get user's subscription info and character usage.
 */
export async function getElevenLabsSubscription(apiKey: string): Promise<{
  ok: boolean
  characterCount?: number
  characterLimit?: number
  tier?: string
  errorText?: string
}> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'GET',
        hostname: 'api.elevenlabs.io',
        path: '/v1/user/subscription',
        headers: {
          'xi-api-key': apiKey,
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          if (res.statusCode !== 200) {
            resolve({ ok: false, errorText: body })
            return
          }
          try {
            const data = JSON.parse(body)
            resolve({
              ok: true,
              characterCount: data.character_count,
              characterLimit: data.character_limit,
              tier: data.tier,
            })
          } catch {
            resolve({ ok: false, errorText: 'Failed to parse response' })
          }
        })
        res.on('error', reject)
      }
    )
    req.on('error', reject)
    req.end()
  })
}
