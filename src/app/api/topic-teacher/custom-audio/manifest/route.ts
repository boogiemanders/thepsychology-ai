import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const R2_BASE_URL = (process.env.NEXT_PUBLIC_TOPIC_TEACHER_AUDIO_BASE_URL || '').replace(/\/+$/, '')

export async function GET(req: NextRequest) {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const lessonId = searchParams.get('lessonId')
  const contentHash = searchParams.get('contentHash')
  const generationId = searchParams.get('generationId')

  if (!userId && !generationId) {
    return NextResponse.json({ error: 'Missing userId or generationId' }, { status: 400 })
  }

  // Find the completed generation
  let generation: any = null

  if (generationId) {
    const { data } = await supabase
      .from('custom_audio_generations')
      .select('*')
      .eq('id', generationId)
      .eq('status', 'completed')
      .single()
    generation = data
  } else if (userId && lessonId) {
    // Find most recent completed generation, optionally matching contentHash
    let query = supabase
      .from('custom_audio_generations')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (contentHash) {
      query = query.eq('content_hash', contentHash)
    }

    const { data } = await query
    generation = data?.[0] || null
  }

  if (!generation) {
    return NextResponse.json({ error: 'No completed generation found' }, { status: 404 })
  }

  // Load chunks
  const { data: chunks, error: chunksError } = await supabase
    .from('custom_audio_chunks')
    .select('chunk_index, text, audio_r2_key, timings_r2_key, duration_seconds')
    .eq('generation_id', generation.id)
    .order('chunk_index', { ascending: true })

  if (chunksError || !chunks || chunks.length === 0) {
    return NextResponse.json({ error: 'No chunks found' }, { status: 404 })
  }

  // Build ManifestResponse-compatible shape
  const manifestChunks = chunks.map((chunk: any, idx: number) => ({
    chunkId: `custom-${generation.id}-${chunk.chunk_index}`,
    text: chunk.text,
    audioUrl: R2_BASE_URL ? `${R2_BASE_URL}/${chunk.audio_r2_key}` : null,
    timingsUrl: R2_BASE_URL ? `${R2_BASE_URL}/${chunk.timings_r2_key}` : null,
    duration: chunk.duration_seconds || null,
    needsLiveGeneration: false,
    sectionIdx: 0,
    sectionTitle: 'Full Lesson',
    sectionStart: idx === 0,
  }))

  const totalDuration = chunks.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0)

  const manifest = {
    lessonId: generation.lesson_id,
    hobby: generation.interest || null,
    sections: [{ idx: 0, title: 'Full Lesson', startChunkIdx: 0 }],
    chunks: manifestChunks,
    totalDuration,
    version: 1,
    schemaVersion: 1,
    generationId: generation.id,
    contentHash: generation.content_hash,
  }

  return NextResponse.json(manifest)
}
