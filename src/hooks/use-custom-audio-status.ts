import { useCallback, useEffect, useRef, useState } from 'react'

interface CustomAudioGeneration {
  id: string
  interest: string | null
  language: string | null
  content_hash: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  chunk_count: number
  total_duration_seconds: number | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

interface UseCustomAudioStatusOptions {
  userId: string | null
  lessonId: string | null
  currentInterest: string | null
  currentLanguage: string | null
  currentContentHash: string | null
  enabled?: boolean
}

export function useCustomAudioStatus({
  userId,
  lessonId,
  currentInterest,
  currentLanguage,
  currentContentHash,
  enabled = true,
}: UseCustomAudioStatusOptions) {
  const [generations, setGenerations] = useState<CustomAudioGeneration[]>([])
  const [completedChunks, setCompletedChunks] = useState(0)
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeGenerationIdRef = useRef<string | null>(null)

  const latestCompleted = generations.find((g) => g.status === 'completed') || null
  const activeGeneration = generations.find((g) => g.status === 'generating' || g.status === 'pending') || null

  // Is the completed generation stale (settings changed)?
  const isStale = latestCompleted
    ? latestCompleted.content_hash !== currentContentHash
    : false

  const isGenerating = Boolean(activeGeneration)

  const progress = activeGeneration
    ? { completed: completedChunks, total: activeGeneration.chunk_count }
    : null

  const fetchStatus = useCallback(async () => {
    if (!userId || !lessonId) return

    try {
      const res = await fetch(
        `/api/topic-teacher/custom-audio/status?userId=${encodeURIComponent(userId)}&lessonId=${encodeURIComponent(lessonId)}`
      )
      if (!res.ok) return
      const data = await res.json()
      if (data.generations) {
        setGenerations(data.generations)
      }
    } catch {
      // Silent fail
    }
  }, [userId, lessonId])

  const pollGenerationStatus = useCallback(async (generationId: string) => {
    try {
      const res = await fetch(
        `/api/topic-teacher/custom-audio/status?generationId=${encodeURIComponent(generationId)}`
      )
      if (!res.ok) return
      const data = await res.json()
      if (data.generation) {
        setCompletedChunks(data.completedChunks || 0)
        if (data.generation.status === 'completed' || data.generation.status === 'failed') {
          // Stop polling and refresh full list
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
          activeGenerationIdRef.current = null
          await fetchStatus()
        }
      }
    } catch {
      // Silent fail
    }
  }, [fetchStatus])

  // Initial fetch
  useEffect(() => {
    if (!enabled || !userId || !lessonId) return
    setLoading(true)
    fetchStatus().finally(() => setLoading(false))
  }, [enabled, userId, lessonId, fetchStatus])

  // Poll when there's an active generation
  useEffect(() => {
    const genId = activeGeneration?.id
    if (!genId) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    if (activeGenerationIdRef.current === genId && pollRef.current) return

    activeGenerationIdRef.current = genId
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(() => {
      pollGenerationStatus(genId)
    }, 3000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [activeGeneration?.id, pollGenerationStatus])

  const refetch = useCallback(() => {
    return fetchStatus()
  }, [fetchStatus])

  return {
    latestCompleted,
    activeGeneration,
    isStale,
    isGenerating,
    progress,
    loading,
    refetch,
    generations,
  }
}
