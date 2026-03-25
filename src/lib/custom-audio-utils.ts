import crypto from 'node:crypto'

export function computeContentHash(
  lessonId: string,
  interest: string | null,
  language: string | null,
  personalizedText: string
): string {
  const input = [lessonId, interest || '', language || '', personalizedText].join('|')
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function getCustomAudioR2Prefix(generationId: string): string {
  return `topic-teacher-audio/v2/custom/${generationId}/`
}

export async function lookupExistingGeneration(
  supabase: { from: (table: string) => any },
  userId: string,
  lessonId: string,
  contentHash: string
): Promise<{ id: string; status: string; r2_prefix: string; chunk_count: number; total_duration_seconds: number | null } | null> {
  const { data, error } = await supabase
    .from('custom_audio_generations')
    .select('id, status, r2_prefix, chunk_count, total_duration_seconds')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('content_hash', contentHash)
    .eq('status', 'completed')
    .single()

  if (error || !data) return null
  return data
}
