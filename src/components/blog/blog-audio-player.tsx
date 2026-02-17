'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { normalizeTextForReadAlong } from '@/lib/speech-text'
import {
  computeWordProgressMap,
  findWordIndexForRatio,
  findWordIndexForEndTimes,
  countWords,
  getEffectiveDurationSeconds,
  PLAYBACK_RATE_OPTIONS,
} from '@/lib/audio-playback-utils'

type WordTiming = { word: string; start: number; end: number }

type ManifestChunk = {
  chunkId: string
  text: string
  audioUrl: string
  timingsUrl: string
  duration: number
  sectionIdx: number
  sectionTitle: string
}

type ManifestResponse = {
  slug: string
  chunks: ManifestChunk[]
  totalDuration: number
}

interface BlogAudioPlayerProps {
  markdown: string
  slug: string
  onWordProgress?: (wordIndex: number | null) => void
}

export function BlogAudioPlayer({ markdown, slug, onWordProgress }: BlogAudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Audio state refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlsRef = useRef<string[]>([])
  const chunkTextsRef = useRef<string[]>([])
  const chunkDurationsRef = useRef<number[]>([])
  const chunkOffsetsRef = useRef<number[]>([])
  const chunkWordOffsetsRef = useRef<number[]>([])
  const currentChunkRef = useRef(0)
  const totalDurationRef = useRef(0)
  const readyRef = useRef(false)
  const animFrameRef = useRef<number>(0)
  const abortRef = useRef<AbortController | null>(null)

  // Word timing refs
  const wordTimingsEndTimesRef = useRef<Map<number, number[]>>(new Map())
  const progressMapsRef = useRef<Map<number, number[]>>(new Map())

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getGlobalWordIndex = useCallback((chunkIdx: number, localWordIdx: number): number => {
    return (chunkWordOffsetsRef.current[chunkIdx] ?? 0) + localWordIdx
  }, [])

  const updateWordHighlight = useCallback(() => {
    if (!readyRef.current || !playing) {
      animFrameRef.current = 0
      return
    }

    const audio = audioRef.current
    if (!audio) {
      animFrameRef.current = 0
      return
    }

    const chunkIdx = currentChunkRef.current
    const chunkOffset = chunkOffsetsRef.current[chunkIdx] ?? 0
    const localTime = audio.currentTime
    const globalTime = chunkOffset + localTime

    setCurrentTime(globalTime)

    // Try MFA word-level timings first
    const endTimes = wordTimingsEndTimesRef.current.get(chunkIdx)
    if (endTimes && endTimes.length > 0) {
      const localIdx = findWordIndexForEndTimes(endTimes, localTime)
      onWordProgress?.(getGlobalWordIndex(chunkIdx, localIdx))
    } else {
      // Fallback to progress map estimation
      const progressMap = progressMapsRef.current.get(chunkIdx)
      if (progressMap && progressMap.length > 0) {
        const chunkDur = chunkDurationsRef.current[chunkIdx] ?? 1
        const ratio = chunkDur > 0 ? localTime / chunkDur : 0
        const localIdx = findWordIndexForRatio(progressMap, ratio)
        onWordProgress?.(getGlobalWordIndex(chunkIdx, localIdx))
      }
    }

    animFrameRef.current = requestAnimationFrame(updateWordHighlight)
  }, [playing, onWordProgress, getGlobalWordIndex])

  // Fetch word timings JSON from R2 for a chunk
  const fetchTimings = useCallback(async (chunkIdx: number, timingsUrl: string, signal: AbortSignal) => {
    try {
      const response = await fetch(timingsUrl, { signal })
      if (!response.ok) return

      const data = await response.json().catch(() => null)
      const timings: WordTiming[] = Array.isArray(data?.words) ? data.words : []
      if (timings.length === 0) return

      const endTimes = timings.map((t) => (typeof t?.end === 'number' ? t.end : NaN))
      if (!endTimes.every((t) => Number.isFinite(t))) return

      wordTimingsEndTimesRef.current.set(chunkIdx, endTimes)
    } catch {
      // silently ignore
    }
  }, [])

  const loadManifest = useCallback(async () => {
    if (readyRef.current) return true
    setLoading(true)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      // Fetch manifest from API
      const manifestRes = await fetch(`/api/blog/audio-manifest?slug=${encodeURIComponent(slug)}`, {
        signal: controller.signal,
      })

      if (!manifestRes.ok) {
        throw new Error('Audio not available for this post')
      }

      const manifest: ManifestResponse = await manifestRes.json()

      if (!manifest.chunks || manifest.chunks.length === 0) {
        setError('No audio content found.')
        setLoading(false)
        return false
      }

      // Fetch all chunk audio as blobs (parallel)
      const blobPromises = manifest.chunks.map(async (chunk) => {
        const res = await fetch(chunk.audioUrl, { signal: controller.signal })
        if (!res.ok) throw new Error(`Failed to fetch audio chunk: ${chunk.chunkId}`)
        return res.blob()
      })

      const blobs = await Promise.all(blobPromises)
      const urls = blobs.map((blob) => URL.createObjectURL(blob))

      // Build durations and offsets
      const durations: number[] = []
      const offsets: number[] = []
      const wordOffsets: number[] = []
      const texts: string[] = []
      let totalDur = 0
      let totalWords = 0

      for (let i = 0; i < manifest.chunks.length; i++) {
        const chunk = manifest.chunks[i]

        // Use manifest duration, but verify with actual audio metadata
        let dur = chunk.duration
        if (!dur || dur <= 0) {
          dur = await new Promise<number>((resolve) => {
            const a = new Audio()
            a.preload = 'metadata'
            const onLoaded = () => {
              const d = getEffectiveDurationSeconds(a)
              a.removeEventListener('loadedmetadata', onLoaded)
              a.removeEventListener('error', onErr)
              resolve(Number.isFinite(d) ? d : 0)
            }
            const onErr = () => {
              a.removeEventListener('loadedmetadata', onLoaded)
              a.removeEventListener('error', onErr)
              resolve(0)
            }
            a.addEventListener('loadedmetadata', onLoaded, { once: true })
            a.addEventListener('error', onErr, { once: true })
            a.src = urls[i]
          })
        }

        offsets.push(totalDur)
        wordOffsets.push(totalWords)
        durations.push(dur)
        texts.push(chunk.text)
        totalDur += dur

        // Build fallback progress map
        const normalizedText = normalizeTextForReadAlong(chunk.text)
        const progressMap = computeWordProgressMap(normalizedText)
        progressMapsRef.current.set(i, progressMap)
        totalWords += countWords(normalizedText)
      }

      audioUrlsRef.current = urls
      chunkTextsRef.current = texts
      chunkDurationsRef.current = durations
      chunkOffsetsRef.current = offsets
      chunkWordOffsetsRef.current = wordOffsets
      totalDurationRef.current = totalDur
      setDuration(totalDur)
      readyRef.current = true

      // Fetch MFA word timings in background for all chunks
      for (let i = 0; i < manifest.chunks.length; i++) {
        const chunk = manifest.chunks[i]
        if (chunk.timingsUrl) {
          fetchTimings(i, chunk.timingsUrl, controller.signal)
        }
      }

      setLoading(false)
      return true
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setLoading(false)
        return false
      }
      console.error('[blog-audio] Error loading manifest:', err)
      setError('Failed to load audio. Please try again.')
      setLoading(false)
      return false
    }
  }, [slug, fetchTimings])

  const playChunk = useCallback((chunkIdx: number) => {
    const url = audioUrlsRef.current[chunkIdx]
    if (!url) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
    }

    const audio = new Audio(url)
    audio.playbackRate = playbackRate
    audioRef.current = audio
    currentChunkRef.current = chunkIdx

    audio.onended = () => {
      const nextIdx = chunkIdx + 1
      if (nextIdx < audioUrlsRef.current.length) {
        playChunk(nextIdx)
      } else {
        setPlaying(false)
        onWordProgress?.(null)
        setCurrentTime(totalDurationRef.current)
      }
    }

    audio.play().catch(() => {
      setPlaying(false)
    })
  }, [playbackRate, onWordProgress])

  const handlePlayPause = useCallback(async () => {
    if (loading) return

    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      onWordProgress?.(null)
      return
    }

    if (!readyRef.current) {
      const ok = await loadManifest()
      if (!ok) return
    }

    const audio = audioRef.current
    if (audio && audio.src && !audio.ended) {
      audio.play().catch(() => {})
      setPlaying(true)
    } else {
      setPlaying(true)
      playChunk(0)
    }
  }, [loading, playing, loadManifest, playChunk, onWordProgress])

  // Update playback rate on active audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  // Animation frame loop for word highlighting
  useEffect(() => {
    if (playing) {
      animFrameRef.current = requestAnimationFrame(updateWordHighlight)
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = 0
      }
    }
  }, [playing, updateWordHighlight])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      audioRef.current?.pause()
      audioUrlsRef.current.forEach((url) => {
        try { URL.revokeObjectURL(url) } catch {}
      })
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!readyRef.current || totalDurationRef.current <= 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const targetTime = ratio * totalDurationRef.current

    // Find the chunk that contains this time
    let chunkIdx = 0
    for (let i = 0; i < chunkOffsetsRef.current.length; i++) {
      const chunkEnd = (chunkOffsetsRef.current[i + 1] ?? totalDurationRef.current)
      if (targetTime < chunkEnd) {
        chunkIdx = i
        break
      }
    }

    const localTime = targetTime - (chunkOffsetsRef.current[chunkIdx] ?? 0)

    if (currentChunkRef.current === chunkIdx && audioRef.current) {
      audioRef.current.currentTime = localTime
      setCurrentTime(targetTime)
    } else {
      // Need to switch chunks
      const url = audioUrlsRef.current[chunkIdx]
      if (!url) return

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
      }

      const audio = new Audio(url)
      audio.playbackRate = playbackRate
      audioRef.current = audio
      currentChunkRef.current = chunkIdx

      audio.onended = () => {
        const nextIdx = chunkIdx + 1
        if (nextIdx < audioUrlsRef.current.length) {
          playChunk(nextIdx)
        } else {
          setPlaying(false)
          onWordProgress?.(null)
          setCurrentTime(totalDurationRef.current)
        }
      }

      audio.addEventListener('loadedmetadata', () => {
        audio.currentTime = localTime
        if (playing) audio.play().catch(() => {})
      }, { once: true })

      audio.src = url
      setCurrentTime(targetTime)
    }
  }, [playing, playbackRate, playChunk, onWordProgress])

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRate((prev) => {
      const idx = PLAYBACK_RATE_OPTIONS.indexOf(prev as typeof PLAYBACK_RATE_OPTIONS[number])
      const nextIdx = idx >= 0 ? (idx + 1) % PLAYBACK_RATE_OPTIONS.length : 0
      return PLAYBACK_RATE_OPTIONS[nextIdx]
    })
  }, [])

  const progressRatio = duration > 0 ? currentTime / duration : 0

  return (
    <div className="blog-audio-player fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handlePlayPause}
          disabled={loading}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div
            className="group relative h-1.5 cursor-pointer rounded-full bg-muted"
            onClick={handleSeek}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressRatio * 100)}
            aria-label="Audio progress"
            tabIndex={0}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-100"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        <button
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground tabular-nums"
          onClick={cyclePlaybackRate}
          aria-label={`Playback speed ${playbackRate}x`}
        >
          {playbackRate}x
        </button>

        <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
          Beta
        </span>
      </div>

      {error && (
        <div className="mx-auto max-w-3xl px-4 pb-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
