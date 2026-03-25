import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { getOpenAIApiKey } from '@/lib/openai-api-key'
import { getCustomAudioR2Prefix } from '@/lib/custom-audio-utils'
import { chunkTextForTts, markdownToSpeakableText, prepareTextForTts, normalizeTextForReadAlong } from '@/lib/speech-text'
import { sendSlackNotification } from '@/lib/notify-slack'
import OpenAI, { toFile } from 'openai'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'

export const runtime = 'nodejs'
export const maxDuration = 300

const INTERNAL_SECRET = process.env.CUSTOM_AUDIO_INTERNAL_SECRET || process.env.SUPABASE_WEBHOOK_SECRET
const MAX_CHARS_PER_CHUNK = 3200
const TTS_MODEL = 'gpt-4o-mini-tts'
const TTS_VOICE = 'alloy'

type WordTiming = { word: string; start: number; end: number }

function getR2Client(): { client: S3Client; bucket: string } | null {
  const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '').trim()
  const bucket = (process.env.CLOUDFLARE_R2_BUCKET || '').trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null

  const endpoint = (
    process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`
  ).trim()

  return {
    bucket,
    client: new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    }),
  }
}

async function uploadToR2(r2: { client: S3Client; bucket: string }, key: string, body: Buffer, contentType: string) {
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )
}

async function generateTtsAudio(openai: OpenAI, text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE as any,
    input: prepareTextForTts(text),
    response_format: 'mp3',
    speed: 1,
  })
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function getWordTimings(openai: OpenAI, audioBuffer: Buffer, promptText: string): Promise<WordTiming[]> {
  const file = await toFile(audioBuffer, 'segment.mp3', { type: 'audio/mpeg' })
  const response: any = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
    temperature: 0,
    prompt: promptText.slice(0, 5000),
  })

  if (Array.isArray(response?.words)) {
    return response.words.map((w: any) => ({
      word: w.word || '',
      start: w.start || 0,
      end: w.end || 0,
    }))
  }
  return []
}

export async function POST(req: NextRequest) {
  // Verify internal auth
  const authHeader = req.headers.get('authorization')
  const expectedAuth = `Bearer ${INTERNAL_SECRET}`
  if (!INTERNAL_SECRET || authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const openaiApiKey = getOpenAIApiKey()
  if (!openaiApiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  const r2 = getR2Client()
  if (!r2) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 500 })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { generationId } = (await req.json()) as { generationId: string }
  if (!generationId) {
    return NextResponse.json({ error: 'Missing generationId' }, { status: 400 })
  }

  // Load generation record
  const { data: generation, error: fetchError } = await supabase
    .from('custom_audio_generations')
    .select('*')
    .eq('id', generationId)
    .single()

  if (fetchError || !generation) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  if (generation.status !== 'pending') {
    return NextResponse.json({ error: `Generation status is ${generation.status}, expected pending` }, { status: 400 })
  }

  // Set status to generating
  await supabase
    .from('custom_audio_generations')
    .update({ status: 'generating' })
    .eq('id', generationId)

  const openai = new OpenAI({ apiKey: openaiApiKey })
  const r2Prefix = getCustomAudioR2Prefix(generationId)

  try {
    // Load lesson content and personalize it
    const { loadTopicContent, replaceMetaphors, stripMetaphorMarkers } = await import('@/lib/topic-content-manager')

    const lessonId = generation.lesson_id as string
    // lessonId format: "domain/topic" e.g. "3-social/persuasion"
    const parts = lessonId.split('/')
    const domain = parts.length > 1 ? parts.slice(0, -1).join('/') : null
    const topicSlug = parts[parts.length - 1]

    const topicContent = loadTopicContent(topicSlug, domain || '')
    if (!topicContent) {
      throw new Error(`Lesson content not found for ${lessonId}`)
    }

    let content = topicContent.content
    const interest = generation.interest as string | null
    const language = generation.language as string | null

    // Apply personalization
    if (interest) {
      content = await replaceMetaphors(content, interest, topicSlug)
    } else {
      content = stripMetaphorMarkers(content)
    }

    // Translate if needed
    if (language) {
      const { default: TranslateOpenAI } = await import('openai')
      const translateClient = new TranslateOpenAI({ apiKey: openaiApiKey })
      const translationResponse = await translateClient.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: `Translate the following EPPP lesson content into ${language}. Preserve the markdown structure (headers, lists, tables, etc.).\n\nContent to translate:\n${content}`,
        }],
      })
      content = translationResponse.choices[0]?.message?.content || content
    }

    // Convert to speakable text and chunk
    const speakableText = markdownToSpeakableText(content)
    const chunks = chunkTextForTts(speakableText, MAX_CHARS_PER_CHUNK)

    // Update chunk count
    await supabase
      .from('custom_audio_generations')
      .update({ chunk_count: chunks.length })
      .eq('id', generationId)

    let totalDuration = 0

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i]
      const audioKey = `${r2Prefix}chunk-${String(i).padStart(3, '0')}.mp3`
      const timingsKey = `${r2Prefix}chunk-${String(i).padStart(3, '0')}.timings.json`

      // Generate TTS audio
      const audioBuffer = await generateTtsAudio(openai, chunkText)

      // Get word timings via Whisper
      const timings = await getWordTimings(openai, audioBuffer, chunkText)

      // Estimate duration from audio buffer (MP3 ~128kbps = ~16KB/sec)
      const durationSeconds = audioBuffer.length / (128 * 1024 / 8)

      // Upload audio + timings to R2
      await uploadToR2(r2, audioKey, audioBuffer, 'audio/mpeg')

      const timingsPayload = {
        version: 1,
        chunkIndex: i,
        text: chunkText,
        words: normalizeTextForReadAlong(chunkText).match(/[\w']+/g) || [],
        timings,
      }
      await uploadToR2(r2, timingsKey, Buffer.from(JSON.stringify(timingsPayload)), 'application/json')

      // Insert chunk record
      await supabase.from('custom_audio_chunks').insert({
        generation_id: generationId,
        chunk_index: i,
        text: chunkText,
        audio_r2_key: audioKey,
        timings_r2_key: timingsKey,
        duration_seconds: durationSeconds,
      })

      totalDuration += durationSeconds
    }

    // Mark as completed
    await supabase
      .from('custom_audio_generations')
      .update({
        status: 'completed',
        total_duration_seconds: totalDuration,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generationId)

    await sendSlackNotification(
      `🎧 Custom audio generated for lesson ${lessonId} (${chunks.length} chunks, ${Math.round(totalDuration)}s)`,
      'payments'
    )

    return NextResponse.json({ success: true, chunks: chunks.length, duration: totalDuration })
  } catch (error) {
    console.error('[CustomAudio] Generation failed:', error)

    await supabase
      .from('custom_audio_generations')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', generationId)

    await sendSlackNotification(
      `❌ Custom audio generation failed for ${generation.lesson_id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'payments'
    )

    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
