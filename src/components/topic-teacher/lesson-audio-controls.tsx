'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { chunkTextForTts, markdownToSpeakableText, prepareTextForTts } from '@/lib/speech-text'
import { Highlighter, Pause, Play, ScrollText, SkipBack, SkipForward } from 'lucide-react'

type MetaphorRange = { start: number; end: number }

const DEFAULT_VOICE = 'alloy'

const VOICE_OPTIONS = ['alloy', 'nova', 'shimmer', 'onyx', 'fable', 'echo'] as const

const MAX_CHARS_PER_TTS_REQUEST = 3200

const PLAYBACK_RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const
const RECOMMENDED_PLAYBACK_RATE = 1.75
const DEFAULT_TTS_MODEL = 'gpt-4o-mini-tts'
const FALLBACK_TTS_MODEL = 'tts-1'
const DEFAULT_TTS_SPEED = 1
const PREGENERATED_AUDIO_BASE_PATH = (process.env.NEXT_PUBLIC_TOPIC_TEACHER_AUDIO_BASE_URL || '/topic-teacher-audio/v1').replace(
  /\/+$/,
  ''
)

const WORD_REGEX = /[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g

function countWords(text: string): number {
  const matches = text.match(WORD_REGEX)
  return matches ? matches.length : 0
}

async function sha256Hex(input: string): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const subtle = window.crypto?.subtle
  if (!subtle) return null
  const bytes = new TextEncoder().encode(input)
  const digest = await subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function computePublicAudioUrl(input: {
  model: string
  voice: string
  format: 'mp3'
  speed: number
  text: string
}): Promise<string | null> {
  const fingerprint = [
    'topic-teacher-audio-v1',
    input.model,
    input.voice,
    input.format,
    input.speed.toString(),
    input.text,
  ].join('|')
  const key = await sha256Hex(fingerprint)
  if (!key) return null
  return `${PREGENERATED_AUDIO_BASE_PATH}/${key}.${input.format}`
}

async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const contentType = response.headers.get('Content-Type') || ''
  if (contentType.includes('application/json')) {
    const data: any = await response.json().catch(() => null)
    const errorValue = data?.error
    if (typeof errorValue === 'string' && errorValue.trim()) {
      return errorValue.trim()
    }
    const messageValue = data?.message
    if (typeof messageValue === 'string' && messageValue.trim()) {
      return messageValue.trim()
    }
  }

  const text = await response.text().catch(() => '')
  return text.trim() || fallback
}

function normalizeRanges(baseText: string, ranges: MetaphorRange[]): MetaphorRange[] {
  const length = baseText.length
  const normalized = ranges
    .map((r) => ({
      start: typeof r.start === 'number' ? r.start : NaN,
      end: typeof r.end === 'number' ? r.end : NaN,
    }))
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end))
    .map((r) => ({
      start: Math.max(0, Math.min(length, r.start)),
      end: Math.max(0, Math.min(length, r.end)),
    }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start)

  const deduped: MetaphorRange[] = []
  let cursor = 0
  for (const r of normalized) {
    if (r.start < cursor) continue
    deduped.push(r)
    cursor = r.end
  }
  return deduped
}

function buildStaticPartsFromRanges(baseLessonMarkdown: string, ranges: MetaphorRange[]): string[] {
  const staticParts: string[] = []
  let cursor = 0
  for (const range of ranges) {
    staticParts.push(baseLessonMarkdown.slice(cursor, range.start))
    cursor = range.end
  }
  staticParts.push(baseLessonMarkdown.slice(cursor))
  return staticParts
}

function extractMetaphorTextsFromLesson(lessonMarkdown: string, staticParts: string[]): string[] | null {
  let cursor = 0
  const metaphors: string[] = []

  for (let i = 0; i < staticParts.length; i++) {
    const part = staticParts[i]
    const idx = part ? lessonMarkdown.indexOf(part, cursor) : cursor
    if (idx === -1) return null

    if (i === 0 && idx > 0) {
      // Allow leading whitespace differences.
      if (lessonMarkdown.slice(0, idx).trim().length > 0) {
        return null
      }
    }

    if (i > 0) {
      metaphors.push(lessonMarkdown.slice(cursor, idx))
    }

    cursor = idx + part.length
  }

  return metaphors
}

function isEnglishish(raw: string | null): boolean {
  const normalized = raw?.trim().toLowerCase()
  return !normalized || normalized === 'english' || normalized === 'en' || normalized === 'eng'
}

export function LessonAudioControls(props: {
  lessonMarkdown: string
  baseLessonMarkdown: string
  metaphorRanges: MetaphorRange[]
  topic: string
  domain: string | null
  userId: string | null
  userInterests: string | null
  languagePreference: string | null
  disabledReason?: string | null
  readAlongEnabled?: boolean
  onReadAlongToggle?: () => void
  onWordProgress?: (payload: { wordIndex: number | null; totalWords: number }) => void
  autoScrollEnabled?: boolean
  onAutoScrollToggle?: () => void
}) {
  const {
    lessonMarkdown,
    baseLessonMarkdown,
    metaphorRanges,
    topic,
    domain,
    userId,
    userInterests,
    languagePreference,
    disabledReason,
    readAlongEnabled = Boolean(props.onWordProgress),
    onReadAlongToggle,
    onWordProgress,
    autoScrollEnabled = false,
    onAutoScrollToggle,
  } = props

  const [voice, setVoice] = useState<string>(DEFAULT_VOICE)
  const [playbackRate, setPlaybackRate] = useState<number>(1)

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [sourceCounts, setSourceCounts] = useState<{ pregen: number; live: number }>({ pregen: 0, live: 0 })

  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const autoPlayNextRef = useRef(false)
  const audioUrlsRef = useRef<string[]>([])
  const segmentWordCountsRef = useRef<number[]>([])
  const segmentWordOffsetsRef = useRef<number[]>([])
  const totalWordsRef = useRef(0)
  const lastWordIndexRef = useRef<number | null>(null)

  const lessonReady = Boolean(lessonMarkdown && lessonMarkdown.trim())
  const effectiveDisabledReason = disabledReason ?? (!lessonReady ? 'Load a lesson to enable audio.' : null)
  const isDisabled = Boolean(effectiveDisabledReason)
  const interestsActive = Boolean(userInterests && userInterests.trim())
  const shouldAutoLoadPregenFullLesson =
    lessonReady && voice === DEFAULT_VOICE && !interestsActive && isEnglishish(languagePreference)

  const speakableFullText = useMemo(() => {
    if (!lessonReady) return ''
    return prepareTextForTts(markdownToSpeakableText(lessonMarkdown))
  }, [lessonMarkdown, lessonReady])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = playbackRate
  }, [playbackRate, currentIndex, audioUrls])

  const revokeUrls = (urls: string[]) => {
    urls.forEach((url) => URL.revokeObjectURL(url))
  }

  const clearAudio = () => {
    abortRef.current?.abort()
    abortRef.current = null
    autoPlayNextRef.current = false
    setIsGenerating(false)
    setProgress({ current: 0, total: 0 })
    setError(null)
    setCurrentIndex(0)
    setSourceCounts({ pregen: 0, live: 0 })
    setAudioUrls((prev) => {
      revokeUrls(prev)
      return []
    })
    segmentWordCountsRef.current = []
    segmentWordOffsetsRef.current = []
    totalWordsRef.current = 0
    lastWordIndexRef.current = null
    onWordProgress?.({ wordIndex: null, totalWords: 0 })
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
    }
  }

  useEffect(() => {
    clearAudio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonMarkdown])

  useEffect(() => {
    audioUrlsRef.current = audioUrls
  }, [audioUrls])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      revokeUrls(audioUrlsRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track scroll position for dynamic sticky bar positioning
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Dynamic top position - starts at 120px (below breadcrumb), moves up to 64px as user scrolls
  const stickyTop = Math.max(120 - scrollY, 64)

  const handleEnded = () => {
    const next = currentIndex + 1
    if (next >= audioUrls.length) return
    autoPlayNextRef.current = true
    setCurrentIndex(next)
  }

  const updateWordProgressFromAudio = useCallback(() => {
    if (!onWordProgress) return
    const audio = audioRef.current
    if (!audio) return
    const counts = segmentWordCountsRef.current
    if (counts.length === 0) return
    const currentCount = counts[currentIndex] ?? 0
    if (currentCount <= 0) return
    const duration = audio.duration
    if (!Number.isFinite(duration) || duration <= 0) return
    const ratio = Math.min(1, Math.max(0, audio.currentTime / duration))
    const localIndex = Math.min(currentCount - 1, Math.floor(ratio * currentCount))
    const offset = segmentWordOffsetsRef.current[currentIndex] ?? 0
    const globalIndex = offset + localIndex
    if (lastWordIndexRef.current === globalIndex) return
    lastWordIndexRef.current = globalIndex
    onWordProgress({ wordIndex: globalIndex, totalWords: totalWordsRef.current })
  }, [currentIndex, onWordProgress])

  useEffect(() => {
    if (!autoPlayNextRef.current) return
    const audio = audioRef.current
    if (!audio) return
    if (!audioUrls[currentIndex]) return

    audio.load()
    audio
      .play()
      .catch(() => {
        // Autoplay might be blocked; user can press play manually.
      })
      .finally(() => {
        autoPlayNextRef.current = false
      })
  }, [audioUrls, currentIndex])

  useEffect(() => {
    updateWordProgressFromAudio()
  }, [audioUrls, currentIndex, updateWordProgressFromAudio])

  const generateAudioForSegments = async (
    segments: Array<{ text: string; voice: string; cacheable?: boolean }>,
    trackWords: boolean
  ) => {
    if (segments.length === 0) {
      throw new Error('No audio segments to generate.')
    }

    if (onWordProgress) {
      if (trackWords) {
        const counts = segments.map((segment) => countWords(segment.text))
        const offsets: number[] = []
        let total = 0
        counts.forEach((count) => {
          offsets.push(total)
          total += count
        })
        segmentWordCountsRef.current = counts
        segmentWordOffsetsRef.current = offsets
        totalWordsRef.current = total
        lastWordIndexRef.current = null
        onWordProgress({ wordIndex: null, totalWords: total })
      } else {
        segmentWordCountsRef.current = []
        segmentWordOffsetsRef.current = []
        totalWordsRef.current = 0
        lastWordIndexRef.current = null
        onWordProgress({ wordIndex: null, totalWords: 0 })
      }
    }

    const controller = new AbortController()
    abortRef.current = controller

    const urls: string[] = []
    setAudioUrls([])
    setCurrentIndex(0)
    setProgress({ current: 0, total: segments.length })

    setSourceCounts({ pregen: 0, live: 0 })

    const incrementSource = (key: 'pregen' | 'live') => {
      setSourceCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }))
    }

    for (let i = 0; i < segments.length; i++) {
	      if (controller.signal.aborted) {
	        throw new DOMException('Aborted', 'AbortError')
	      }

	      setProgress({ current: i, total: segments.length })

	      const segment = segments[i]
	      const preparedText = prepareTextForTts(segment.text)

	      const shouldTryPregenerated = segment.cacheable && segment.voice === DEFAULT_VOICE
	      if (shouldTryPregenerated) {
	        const primaryUrl = await computePublicAudioUrl({
	          model: DEFAULT_TTS_MODEL,
	          voice: segment.voice,
	          format: 'mp3',
	          speed: DEFAULT_TTS_SPEED,
	          text: preparedText,
	        })
	        if (primaryUrl) {
	          const pre = await fetch(primaryUrl, { signal: controller.signal }).catch(() => null)
	          if (pre?.ok) {
	            const blob = await pre.blob()
	            const url = URL.createObjectURL(blob)
	            urls.push(url)
	            setAudioUrls([...urls])
	            incrementSource('pregen')
	            continue
	          }
	        }

	        const fallbackUrl = await computePublicAudioUrl({
	          model: FALLBACK_TTS_MODEL,
	          voice: segment.voice,
	          format: 'mp3',
	          speed: DEFAULT_TTS_SPEED,
	          text: preparedText,
	        })
	        if (fallbackUrl) {
	          const pre = await fetch(fallbackUrl, { signal: controller.signal }).catch(() => null)
	          if (pre?.ok) {
	            const blob = await pre.blob()
	            const url = URL.createObjectURL(blob)
	            urls.push(url)
	            setAudioUrls([...urls])
	            incrementSource('pregen')
	            continue
	          }
	        }
	      }

	      const response = await fetch('/api/topic-teacher/audio', {
	        method: 'POST',
	        headers: {
	          'Content-Type': 'application/json',
	        },
	        signal: controller.signal,
	        body: JSON.stringify({
	          text: preparedText,
	          voice: segment.voice,
	          format: 'mp3',
	          cacheable: Boolean(segment.cacheable),
	          userId,
	          topic,
	          domain,
	          languagePreference,
	        }),
	      })

      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, 'Failed to generate audio.'))
      }

	      const blob = await response.blob()
	      const url = URL.createObjectURL(blob)
	      urls.push(url)
	      setAudioUrls([...urls])
	      incrementSource('live')
	    }

    setProgress({ current: segments.length, total: segments.length })
  }

  const handleGenerate = async () => {
    if (isDisabled || isGenerating) return

    setError(null)
    setIsGenerating(true)
    setProgress({ current: 0, total: 0 })
    setAudioUrls((prev) => {
      revokeUrls(prev)
      return []
    })
    setCurrentIndex(0)

    try {
      const normalizedRanges =
          baseLessonMarkdown && metaphorRanges.length > 0 && isEnglishish(languagePreference)
            ? normalizeRanges(baseLessonMarkdown, metaphorRanges)
            : []

        if (baseLessonMarkdown && normalizedRanges.length > 0) {
          const staticParts = buildStaticPartsFromRanges(baseLessonMarkdown, normalizedRanges)
          const metaphorTexts = extractMetaphorTextsFromLesson(lessonMarkdown, staticParts)

          if (!metaphorTexts || metaphorTexts.length !== normalizedRanges.length) {
            const chunks = chunkTextForTts(speakableFullText, MAX_CHARS_PER_TTS_REQUEST)
            const segments = chunks.map((text) => ({ text, voice }))
            await generateAudioForSegments(segments, true)
            return
          }

	          const segments: Array<{ text: string; voice: string; cacheable?: boolean }> = []
	          const metaphorCacheable = !Boolean(userInterests && userInterests.trim())
	          for (let i = 0; i < staticParts.length; i++) {
	            const staticMarkdown = staticParts[i]
	            if (staticMarkdown.trim()) {
	              const speakable = prepareTextForTts(markdownToSpeakableText(staticMarkdown))
	              const chunks = chunkTextForTts(speakable, MAX_CHARS_PER_TTS_REQUEST)
              chunks.forEach((text) => {
                if (!text.trim()) return
                segments.push({ text, voice, cacheable: true })
              })
            }

	            if (i < metaphorTexts.length) {
	              const metaphorMarkdown = metaphorTexts[i]
	              if (metaphorMarkdown.trim()) {
	                const speakable = prepareTextForTts(markdownToSpeakableText(metaphorMarkdown))
	                const chunks = chunkTextForTts(speakable, MAX_CHARS_PER_TTS_REQUEST)
	                chunks.forEach((text) => {
	                  if (!text.trim()) return
	                  segments.push({ text, voice, cacheable: metaphorCacheable })
	                })
	              }
	            }
	          }

          await generateAudioForSegments(segments, true)
          return
        }

      const chunks = chunkTextForTts(speakableFullText, MAX_CHARS_PER_TTS_REQUEST)
      const segments = chunks.map((text) => ({ text, voice }))
      await generateAudioForSegments(segments, true)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return
      }
      console.error('[LessonAudioControls] Error generating audio:', err)
      const message = err instanceof Error ? err.message : 'Failed to generate audio.'
      setError(message)
      setAudioUrls((prev) => {
        revokeUrls(prev)
        return []
      })
    } finally {
      setIsGenerating(false)
      abortRef.current = null
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsGenerating(false)
    setProgress({ current: 0, total: 0 })
  }

  const progressText =
    isGenerating && progress.total > 0 ? `Generating audio ${Math.min(progress.current + 1, progress.total)}/${progress.total}…` : null
  const sourceTotal = sourceCounts.pregen + sourceCounts.live
  const sourceText =
    sourceTotal > 0
      ? `Audio source: ${sourceCounts.pregen} pre-generated · ${sourceCounts.live} live`
      : null

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = Number.parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    setDuration(audio.duration)
    updateWordProgressFromAudio()
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
    updateWordProgressFromAudio()
  }

  const hasAudio = audioUrls.length > 0
  const showStickyBar = hasAudio || shouldAutoLoadPregenFullLesson
  const showGenerateButton = !shouldAutoLoadPregenFullLesson || voice !== DEFAULT_VOICE || interestsActive
  const showRegenerateButton = hasAudio && (interestsActive || voice !== DEFAULT_VOICE || !isEnglishish(languagePreference))

  useEffect(() => {
    if (!shouldAutoLoadPregenFullLesson) return
    if (isDisabled || isGenerating || hasAudio || error) return
    void handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoLoadPregenFullLesson, isDisabled, isGenerating, hasAudio, error])

  return (
    <>
      {/* Spacer when unified audio bar is visible */}
      {showStickyBar && <div className="h-20" />}

      {/* Initial Settings Panel - only shown when NO audio exists and sticky bar is not visible */}
      {!hasAudio && !showStickyBar && (
        <div className="mb-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-background px-3 py-2">
            {/* Voice selector with label */}
            <select
              className="h-7 rounded-md border border-input bg-background px-1.5 text-xs"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              disabled={isGenerating}
            >
              <option value="" disabled>Voice</option>
              {VOICE_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* Playback speed slider */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={PLAYBACK_RATE_OPTIONS.length - 1}
                value={PLAYBACK_RATE_OPTIONS.indexOf(playbackRate as typeof PLAYBACK_RATE_OPTIONS[number])}
                onChange={(e) => setPlaybackRate(PLAYBACK_RATE_OPTIONS[parseInt(e.target.value)])}
                className="w-20 h-1 appearance-none bg-border rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="text-xs text-muted-foreground tabular-nums w-24">
                {playbackRate}×{playbackRate === RECOMMENDED_PLAYBACK_RATE ? ' recommended' : ''}
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Generate button */}
            <div className="flex items-center gap-1">
              {showGenerateButton && (
                <Button type="button" size="sm" onClick={handleGenerate} disabled={isDisabled || isGenerating} className="h-7 px-2 text-xs">
                  Generate Audio
                </Button>
              )}
              {isGenerating && (
                <Button type="button" size="sm" variant="outline" onClick={handleCancel} className="h-7 px-2 text-xs">
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Status messages */}
          {(effectiveDisabledReason || progressText || sourceText) && (
            <div className="mt-1 text-xs text-muted-foreground">
              {effectiveDisabledReason || progressText || sourceText}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Hidden audio element */}
      {hasAudio && (
        <audio
          ref={audioRef}
          src={audioUrls[currentIndex]}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => {
            setIsPlaying(true)
            updateWordProgressFromAudio()
          }}
          onPause={() => setIsPlaying(false)}
          onSeeked={updateWordProgressFromAudio}
          className="hidden"
        />
      )}

      {/* Unified Sticky Audio Bar */}
      {showStickyBar && (
        <div
          className="fixed left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 transition-[top] duration-100"
          style={{ top: `${stickyTop}px` }}
        >
          <div className="mx-auto max-w-[800px] px-4 py-2">
            <div className="flex items-center gap-2">
              {/* Playback controls - first for prominence */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={!hasAudio || currentIndex === 0}
                  className="p-1 rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous segment"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handlePlayPause}
                  disabled={!hasAudio}
                  className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(audioUrls.length - 1, prev + 1))}
                  disabled={!hasAudio || currentIndex >= audioUrls.length - 1}
                  className="p-1 rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next segment"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Progress bar section */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-muted-foreground tabular-nums w-8 text-right shrink-0">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={!hasAudio}
                  className="flex-1 h-1 appearance-none bg-border rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
                <span className="text-xs text-muted-foreground tabular-nums w-8 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Right section: Speed, segment, auto-scroll, actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Speed slider */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min={0}
                    max={PLAYBACK_RATE_OPTIONS.length - 1}
                    value={PLAYBACK_RATE_OPTIONS.indexOf(playbackRate as typeof PLAYBACK_RATE_OPTIONS[number])}
                    onChange={(e) => setPlaybackRate(PLAYBACK_RATE_OPTIONS[parseInt(e.target.value)])}
                    className="w-16 h-1 appearance-none bg-border rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                  <span className="text-xs text-muted-foreground tabular-nums w-16">
                    {playbackRate}×{playbackRate === RECOMMENDED_PLAYBACK_RATE ? ' recommended' : ''}
                  </span>
                </div>

                <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                  {hasAudio ? `${currentIndex + 1}/${audioUrls.length}` : ''}
                </span>

                {onAutoScrollToggle && (
                  <button
                    type="button"
                    onClick={onAutoScrollToggle}
                    className={`p-1 rounded-full transition-colors ${
                      autoScrollEnabled
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                    aria-label={autoScrollEnabled ? 'Disable auto-scroll' : 'Enable auto-scroll'}
                    title={autoScrollEnabled ? 'Auto-scroll: On' : 'Auto-scroll: Off'}
                  >
                    <ScrollText className="h-3.5 w-3.5" />
                  </button>
                )}

                {onReadAlongToggle && (
                  <button
                    type="button"
                    onClick={onReadAlongToggle}
                    className={`p-1 rounded-full transition-colors ${
                      readAlongEnabled
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                    aria-label={readAlongEnabled ? 'Disable read-along highlighting' : 'Enable read-along highlighting'}
                    title={readAlongEnabled ? 'Read-along: On' : 'Read-along: Off'}
                  >
                    <Highlighter className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="w-px h-4 bg-border mx-0.5 hidden sm:block" />

                {showRegenerateButton && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleGenerate}
                    disabled={isDisabled || isGenerating}
                    className="h-6 px-2 text-xs hidden sm:inline-flex"
                  >
                    {isGenerating ? 'Generating...' : 'Regenerate'}
                  </Button>
                )}
                {isGenerating ? (
                  <Button type="button" size="sm" variant="ghost" onClick={handleCancel} className="h-6 px-2 text-xs">
                    Cancel
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="ghost" onClick={clearAudio} className="h-6 px-2 text-xs">
                    Clear
                  </Button>
                )}

                {/* Voice selector - moved to end */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <div className="w-px h-4 bg-border mx-0.5" />
                  <select
                    className="h-6 rounded border border-border/60 bg-background px-1 text-xs cursor-pointer"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    disabled={isGenerating}
                  >
                    <option value="" disabled>Voice</option>
                    {VOICE_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {progressText && (
              <div className="mt-1 text-xs text-muted-foreground">
                {progressText}
              </div>
            )}

            {/* Error message if any */}
            {error && (
              <div className="mt-1 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
