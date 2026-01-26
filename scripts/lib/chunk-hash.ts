/**
 * Compute deterministic cache keys for audio chunks.
 *
 * The hash includes all factors that affect the audio output:
 * - Schema version (for cache invalidation on algorithm changes)
 * - TTS model
 * - Voice
 * - Speed
 * - Normalized text
 *
 * If any of these change, the hash changes, ensuring fresh audio generation.
 */

import * as crypto from 'crypto'

/**
 * Schema version for timing data.
 * Increment this when the alignment algorithm changes to invalidate cached timings.
 */
export const TIMING_SCHEMA_VERSION = 1

/**
 * Schema version for audio data.
 * This matches the existing topic-teacher-audio-v1 fingerprint format.
 */
export const AUDIO_SCHEMA_VERSION = 'topic-teacher-audio-v1'

export type ChunkHashInput = {
  text: string // Normalized text (already processed through normalizeForTTS)
  voice: string // TTS voice (e.g., "alloy")
  speed: number // TTS speed multiplier (e.g., 1.0)
  ttsModel: string // TTS model (e.g., "gpt-4o-mini-tts")
}

/**
 * Compute a deterministic hash for a chunk based on its audio-affecting parameters.
 * This hash is used to:
 * 1. Cache audio files (R2 key: audio/{hash}.mp3)
 * 2. Cache timing files (R2 key: timings/{hash}.words.json)
 * 3. Detect when audio needs regeneration
 */
export function computeChunkHash(input: ChunkHashInput): string {
  const fingerprint = [
    AUDIO_SCHEMA_VERSION,
    input.ttsModel,
    input.voice,
    'mp3', // Format is always mp3 for our use case
    input.speed.toString(),
    input.text,
  ].join('|')

  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

/**
 * Compute a hash for MFA timing data.
 * This uses a separate version number so timing caches can be invalidated
 * independently of audio caches.
 */
export function computeTimingHash(input: ChunkHashInput): string {
  const fingerprint = [
    `mfa-v${TIMING_SCHEMA_VERSION}`,
    input.ttsModel,
    input.voice,
    input.speed.toString(),
    input.text,
  ].join('|')

  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

/**
 * Compute a legacy-compatible audio hash.
 * This matches the existing pregenerate-topic-teacher-audio.mjs hash format
 * for backward compatibility with existing cached audio.
 */
export function computeLegacyAudioHash(input: {
  model: string
  voice: string
  format: string
  speed: number
  text: string
}): string {
  const fingerprint = [
    'topic-teacher-audio-v1',
    input.model,
    input.voice,
    input.format,
    input.speed.toString(),
    input.text,
  ].join('|')

  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

/**
 * Compute a hash for lesson manifest.
 * This is used to detect when a manifest needs to be regenerated.
 */
export function computeManifestHash(lessonId: string, contentHash: string, schemaVersion: number): string {
  const fingerprint = ['manifest', `v${schemaVersion}`, lessonId, contentHash].join('|')
  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

/**
 * Compute a content hash for a lesson (just the text content).
 * Used to detect when lesson content has changed.
 */
export function computeContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}
