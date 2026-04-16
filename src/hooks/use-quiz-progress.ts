'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getAllQuizResults,
  fetchSupabaseQuizResults,
  backfillLocalToSupabase,
  type QuizResults,
} from '@/lib/quiz-results-storage'
import { useAuth } from '@/context/auth-context'

export interface TopicProgress {
  bestPercentage: number
  latestResult: QuizResults
}

/**
 * Merges localStorage + Supabase quiz results into a per-topic progress map.
 * Supabase wins when both have data for a topic (source of truth for cross-device).
 * Returns { topicName -> { bestPercentage, latestResult } }.
 */
export function useQuizProgress() {
  const { user } = useAuth()
  const [progressMap, setProgressMap] = useState<Record<string, TopicProgress>>({})
  const [allResults, setAllResults] = useState<QuizResults[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    // Always start with localStorage (works for anonymous + signed-in)
    const localResults = getAllQuizResults()
    let remoteResults: QuizResults[] = []

    if (user) {
      remoteResults = await fetchSupabaseQuizResults()
    }

    // Merge: build per-topic best-percentage + latest-result map
    const map: Record<string, TopicProgress> = {}
    const combined = [...localResults, ...remoteResults]

    for (const r of combined) {
      const pct = r.totalQuestions > 0
        ? Math.round((r.score / r.totalQuestions) * 100)
        : 0
      const existing = map[r.topic]

      if (!existing) {
        map[r.topic] = { bestPercentage: pct, latestResult: r }
      } else {
        if (pct > existing.bestPercentage) {
          map[r.topic] = { bestPercentage: pct, latestResult: r }
        } else if (r.timestamp > existing.latestResult.timestamp) {
          map[r.topic] = { ...existing, latestResult: r }
        }
      }
    }

    setProgressMap(map)
    setAllResults(combined)
    setLoading(false)
  }, [user])

  // Initial load + listen for local quiz-results-updated events
  useEffect(() => {
    refresh()

    const handler = () => { refresh() }
    window.addEventListener('quiz-results-updated', handler)
    return () => window.removeEventListener('quiz-results-updated', handler)
  }, [refresh])

  // Supabase realtime: refresh on new quiz_results inserts from other devices
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('quiz-results-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_results',
          filter: `user_id=eq.${user.id}`,
        },
        () => { refresh() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, refresh])

  // One-time backfill: push localStorage to Supabase on first sign-in
  useEffect(() => {
    if (!user) return
    const key = `quiz_backfill_done_${user.id}`
    if (sessionStorage.getItem(key)) return

    backfillLocalToSupabase().then(() => {
      sessionStorage.setItem(key, '1')
    })
  }, [user])

  return { progressMap, allResults, loading, refresh }
}
