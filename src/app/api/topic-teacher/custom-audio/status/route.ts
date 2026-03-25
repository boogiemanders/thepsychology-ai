import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const generationId = searchParams.get('generationId')
  const userId = searchParams.get('userId')
  const lessonId = searchParams.get('lessonId')

  if (generationId) {
    const { data, error } = await supabase
      .from('custom_audio_generations')
      .select('id, user_id, lesson_id, interest, language, content_hash, status, chunk_count, total_duration_seconds, error_message, created_at, completed_at')
      .eq('id', generationId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Get chunk progress for generating status
    let completedChunks = 0
    if (data.status === 'generating') {
      const { count } = await supabase
        .from('custom_audio_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('generation_id', generationId)
      completedChunks = count || 0
    }

    return NextResponse.json({
      generation: data,
      completedChunks,
    })
  }

  if (userId && lessonId) {
    const { data, error } = await supabase
      .from('custom_audio_generations')
      .select('id, interest, language, content_hash, status, chunk_count, total_duration_seconds, error_message, created_at, completed_at')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    return NextResponse.json({ generations: data || [] })
  }

  return NextResponse.json({ error: 'Missing userId+lessonId or generationId' }, { status: 400 })
}
