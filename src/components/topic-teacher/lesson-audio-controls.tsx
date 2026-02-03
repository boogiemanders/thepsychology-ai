'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { chunkTextForTts, markdownToSpeakableText, normalizeTextForReadAlong, prepareTextForTts } from '@/lib/speech-text'
import { Highlighter, Pause, Play, ScrollText, SkipBack, SkipForward } from 'lucide-react'

type MetaphorRange = { start: number; end: number }
type WordTiming = { word: string; start: number; end: number }

// Manifest types for MFA pre-generated audio
type ManifestChunk = {
  chunkId: string
  text: string
  audioUrl: string
  timingsUrl: string
  duration: number
  // Section navigation info
  sectionIdx: number
  sectionTitle: string
  sectionStart: boolean
}

type ManifestSection = {
  idx: number
  title: string
  startChunkIdx: number
}

type ManifestResponse = {
  lessonId: string
  hobby: string | null
  sections: ManifestSection[]
  chunks: ManifestChunk[]
  totalDuration: number
  version: number
  schemaVersion: number
}

type MarkdownSection = {
  title: string | null
  level: number
  start: number
  end: number
  markdown: string
}

const DEFAULT_VOICE = 'alloy'

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
const VOWEL_GROUP_REGEX = /[aeiouy]+/gi

function estimateSyllables(word: string): number {
  const matches = word.toLowerCase().match(VOWEL_GROUP_REGEX)
  return matches ? Math.max(1, matches.length) : 1
}

function extractAudioKeyFromPublicUrl(url: string): string | null {
  if (!url) return null
  const base = url.split('#')[0]?.split('?')[0] ?? ''
  const file = base.split('/').pop() ?? ''
  const match = file.match(/^([a-f0-9]{64})\.mp3$/i)
  return match?.[1] ?? null
}

function computeWordProgressMap(text: string): number[] {
  const matches = Array.from(text.matchAll(WORD_REGEX))
  if (matches.length === 0) return []

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const tableLike =
    lines.length >= 2 &&
    lines.filter((line) => line.includes(',')).length / lines.length >= 0.6 &&
    lines.some((line) => /\d/.test(line))
  const tableLineWordCounts = tableLike
    ? lines
        .map((line) => (line.match(WORD_REGEX) || []).length)
        .filter((count) => count > 0)
    : []
  const avgWordsPerTableLine =
    tableLineWordCounts.length > 0
      ? tableLineWordCounts.reduce((sum, count) => sum + count, 0) / tableLineWordCounts.length
      : 0
  const tableRowPauseBoost = tableLike
    ? Math.min(3.5, Math.max(1.4, avgWordsPerTableLine * 0.5))
    : 0
  const tableCommaBoost = tableLike ? 0.9 : 0
  const tableWordMultiplier = tableLike ? 1.35 : 1

  const weights: number[] = []
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i]
    const word = match[0] ?? ''
    const start = (match.index ?? 0) + word.length
    const nextIndex = matches[i + 1]?.index ?? text.length
    const gap = text.slice(start, nextIndex)

    const syllables = estimateSyllables(word) * tableWordMultiplier
    let pauseWeight = 0

    if (gap.includes('\n\n')) {
      pauseWeight += 1.2 + tableRowPauseBoost
    } else if (gap.includes('\n')) {
      pauseWeight += 0.8 + tableRowPauseBoost
    }
    if (/[.!?]/.test(gap)) pauseWeight += 0.9
    if (/[,:;]/.test(gap)) pauseWeight += 0.5 + (tableLike && /,/.test(gap) ? tableCommaBoost : 0)
    if (/(?:--|\u2014|\u2013)/.test(gap)) pauseWeight += 0.3

    weights.push(Math.max(0.9, syllables) + pauseWeight)
  }

  const total = weights.reduce((acc, w) => acc + w, 0)
  if (!Number.isFinite(total) || total <= 0) return []

  let cumulative = 0
  return weights.map((w) => {
    cumulative += w
    return Math.min(1, cumulative / total)
  })
}

function findWordIndexForRatio(progressMap: number[], ratio: number): number {
  if (progressMap.length === 0) return 0
  if (ratio <= progressMap[0]) return 0
  const lastIndex = progressMap.length - 1
  if (ratio >= progressMap[lastIndex]) return lastIndex

  let lo = 0
  let hi = lastIndex
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (progressMap[mid] < ratio) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return Math.min(Math.max(lo, 0), lastIndex)
}

function findWordIndexForEndTimes(endTimes: number[], seconds: number): number {
  if (endTimes.length === 0) return 0
  if (!Number.isFinite(seconds) || seconds <= 0) return 0

  const lastIndex = endTimes.length - 1
  if (seconds >= (endTimes[lastIndex] ?? 0)) return lastIndex

  let lo = 0
  let hi = lastIndex
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const end = endTimes[mid] ?? 0
    if (end < seconds) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return Math.min(Math.max(lo, 0), lastIndex)
}

function countWords(text: string): number {
  const matches = text.match(WORD_REGEX)
  return matches ? matches.length : 0
}

function getEffectiveDurationSeconds(audio: HTMLAudioElement): number {
  const direct = audio.duration
  if (Number.isFinite(direct) && direct > 0) return direct

  const seekable = audio.seekable
  if (seekable && seekable.length > 0) {
    try {
      const end = seekable.end(seekable.length - 1)
      if (Number.isFinite(end) && end > 0) return end
    } catch {
      // ignore
    }
  }

  return NaN
}

async function loadAudioDurationSeconds(url: string, signal?: AbortSignal): Promise<number> {
  if (typeof window === 'undefined') return NaN
  if (!url) return NaN

  return await new Promise<number>((resolve) => {
    const audio = new Audio()
    audio.preload = 'metadata'

    let resolved = false
    let abortListener: (() => void) | null = null

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('error', handleError)
      if (abortListener && signal) {
        signal.removeEventListener('abort', abortListener)
      }
      abortListener = null
      try {
        audio.removeAttribute('src')
        audio.load()
      } catch {
        // ignore
      }
    }

    const finish = (value: number) => {
      if (resolved) return
      resolved = true
      cleanup()
      resolve(value)
    }

    const handleLoaded = () => finish(getEffectiveDurationSeconds(audio))
    const handleError = () => finish(NaN)

    audio.addEventListener('loadedmetadata', handleLoaded, { once: true })
    audio.addEventListener('error', handleError, { once: true })

    if (signal) {
      abortListener = () => finish(NaN)
      if (signal.aborted) {
        abortListener()
        return
      }
      signal.addEventListener('abort', abortListener, { once: true })
    }

    audio.src = url
  })
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

function splitMarkdownIntoSections(markdown: string, splitLevel: number): MarkdownSection[] {
  const input = typeof markdown === 'string' ? markdown : ''
  if (!input.trim()) return []

  const sections: MarkdownSection[] = []
  const lines = input.split('\n')
  let inFence = false

  let currentStart = 0
  let currentTitle: string | null = null
  let currentLevel = 0

  let offset = 0

  const flush = (end: number) => {
    if (end <= currentStart) return
    const slice = input.slice(currentStart, end)
    if (!slice.trim()) return

    const title = currentTitle ?? 'Intro'
    sections.push({
      title,
      level: currentLevel,
      start: currentStart,
      end,
      markdown: slice,
    })
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const lineStart = offset
    const hasNewline = i < lines.length - 1
    offset += line.length + (hasNewline ? 1 : 0)

    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (!match) continue
    const level = match[1]?.length ?? 0
    const title = match[2]?.trim() ?? ''
    if (!title) continue
    if (level !== splitLevel) continue

    flush(lineStart)
    currentStart = lineStart
    currentTitle = title
    currentLevel = level
  }

  flush(input.length)
  return sections
}

export type LessonAudioControlsHandle = {
  seekToWord: (wordIndex: number) => void
}

type LessonAudioControlsProps = {
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
  /** Lesson slug for manifest lookup (e.g., "3-social/persuasion") */
  lessonSlug?: string | null
  /** Whether to use MFA manifest if available (default: true) */
  useManifest?: boolean
  /** Callback when manifest text is loaded - used for accurate spokenWords alignment */
  onManifestText?: (text: string) => void
}

export const LessonAudioControls = forwardRef<LessonAudioControlsHandle, LessonAudioControlsProps>((props, ref) => {
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
    lessonSlug = null,
    useManifest = true,
    onManifestText,
  } = props

  const voice = DEFAULT_VOICE
  const [playbackRate, setPlaybackRate] = useState<number>(1)

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [sourceCounts, setSourceCounts] = useState<{ pregen: number; live: number }>({ pregen: 0, live: 0 })
  const [segmentSources, setSegmentSources] = useState<Array<'pregen' | 'live'>>([])
  const [isPreparingTimings, setIsPreparingTimings] = useState(false)

  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [readAlongWordIndex, setReadAlongWordIndex] = useState<number | null>(null)
  const [readAlongTotalWords, setReadAlongTotalWords] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const autoPlayNextRef = useRef(false)
  const isPlayingRef = useRef(false)
  const pendingAutoAdvanceIndexRef = useRef<number | null>(null)
  const audioUrlsRef = useRef<string[]>([])
  const segmentWordCountsRef = useRef<number[]>([]) // MFA-based counts for audio timing
  const segmentRegexWordCountsRef = useRef<number[]>([]) // Regex-based counts matching spokenWords
  const segmentWordProgressRef = useRef<number[][]>([])
  const segmentWordOffsetsRef = useRef<number[]>([]) // Regex-based offsets for progress reporting
  const segmentAudioKeysRef = useRef<Array<string | null>>([])
  const segmentTextsRef = useRef<string[]>([])
  const segmentWordStartTimesRef = useRef<number[][]>([])
  const segmentWordEndTimesRef = useRef<number[][]>([])
  const segmentDurationSecondsRef = useRef<number[]>([])
  const segmentStartSecondsRef = useRef<number[]>([])
  const totalDurationSecondsRef = useRef(0)
  const wordTimingsAbortRef = useRef<AbortController | null>(null)
  const wordTimingsInFlightRef = useRef<Set<number>>(new Set())
  const wordTimingsFailedRef = useRef<Set<number>>(new Set())
  const wordTimingsPromisesRef = useRef<Map<number, Promise<boolean>>>(new Map())
  const totalWordsRef = useRef(0)
  const lastWordIndexRef = useRef<number | null>(null)
  const pendingSeekRef = useRef<
    { segmentIndex: number; ratio?: number; timeSeconds?: number; autoplay?: boolean } | null
  >(null)
  const pendingSeekWordRef = useRef<number | null>(null)
  const seekRequestIdRef = useRef(0)
  const handleGenerateRef = useRef<(() => void) | null>(null)
  const segmentSectionIndexRef = useRef<number[]>([])
  const sectionStartIndexRef = useRef<number[]>([])
  const sectionWordStartIndexRef = useRef<number[]>([])
  const [sectionTitles, setSectionTitles] = useState<string[]>([])
  const [usedManifest, setUsedManifest] = useState(false)
  const manifestDataRef = useRef<ManifestResponse | null>(null)

  const lessonReady = Boolean(lessonMarkdown && lessonMarkdown.trim())
  const interestsActive = Boolean(userInterests && userInterests.trim())
  const canUsePregen = voice === DEFAULT_VOICE && !interestsActive && isEnglishish(languagePreference)
  const wordTimingsEnabled = !['0', 'false', 'no', 'off'].includes(
    (process.env.NEXT_PUBLIC_TOPIC_TEACHER_WORD_TIMINGS || '').trim().toLowerCase()
  )
  const continuousAudioEnabled = !['0', 'false', 'no', 'off'].includes(
    (process.env.NEXT_PUBLIC_TOPIC_TEACHER_CONTINUOUS_AUDIO || '').trim().toLowerCase()
  )
  const continuousModeActive = continuousAudioEnabled
  const baseContentReady = Boolean(baseLessonMarkdown && baseLessonMarkdown.trim())
  const pregenReady = !canUsePregen || baseContentReady
  const shouldAutoLoadPregenFullLesson =
    lessonReady && voice === DEFAULT_VOICE && !interestsActive && isEnglishish(languagePreference) && pregenReady
  const effectiveDisabledReason =
    disabledReason ??
    (!lessonReady
      ? 'Load a lesson to enable audio.'
      : !pregenReady
        ? 'Loading base content for pre-generated audio...'
        : null)
  const isDisabled = Boolean(effectiveDisabledReason)

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
    isPlayingRef.current = false
    setIsGenerating(false)
    setIsPreparingTimings(false)
    setIsPlaying(false)
    setProgress({ current: 0, total: 0 })
    setError(null)
    setCurrentIndex(0)
    setCurrentTime(0)
    setDuration(0)
    setSourceCounts({ pregen: 0, live: 0 })
    setSegmentSources([])
    setReadAlongWordIndex(null)
    setReadAlongTotalWords(0)
    audioUrlsRef.current = []
    setAudioUrls((prev) => {
      revokeUrls(prev)
      return []
    })
    segmentWordCountsRef.current = []
    segmentRegexWordCountsRef.current = []
    segmentWordProgressRef.current = []
    segmentWordOffsetsRef.current = []
    segmentAudioKeysRef.current = []
    segmentTextsRef.current = []
    segmentWordStartTimesRef.current = []
    segmentWordEndTimesRef.current = []
    segmentDurationSecondsRef.current = []
    segmentStartSecondsRef.current = []
    totalDurationSecondsRef.current = 0
    wordTimingsAbortRef.current?.abort()
    wordTimingsAbortRef.current = null
    wordTimingsInFlightRef.current.clear()
    wordTimingsFailedRef.current.clear()
    wordTimingsPromisesRef.current.clear()
    totalWordsRef.current = 0
    lastWordIndexRef.current = null
    pendingSeekRef.current = null
    pendingSeekWordRef.current = null
    seekRequestIdRef.current = 0
    pendingAutoAdvanceIndexRef.current = null
    segmentSectionIndexRef.current = []
    sectionStartIndexRef.current = []
    sectionWordStartIndexRef.current = []
    setSectionTitles([])
    onWordProgress?.({ wordIndex: null, totalWords: 0 })
    setUsedManifest(false)
    manifestDataRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
    }
  }

  /**
   * Try to fetch and use the MFA manifest for this lesson.
   * Returns true if successful, false if not available.
   */
  const tryLoadFromManifest = async (signal: AbortSignal): Promise<boolean> => {
    console.log('[manifest] Attempting to load manifest:', { useManifest, domain, topic, lessonSlug, canUsePregen })
    // Can use either domain+topic (preferred) or legacy lessonSlug
    if (!useManifest || (!lessonSlug && (!domain || !topic))) {
      console.log('[manifest] Skipped: useManifest is falsy or missing domain/topic/lessonSlug')
      return false
    }

    try {
      const hobby = userInterests?.trim() || ''
      const params = new URLSearchParams()
      // Prefer domain+topic as the API will resolve the correct lessonId
      if (domain && topic) {
        params.set('domain', domain)
        params.set('topic', topic)
      } else if (lessonSlug) {
        params.set('lessonId', lessonSlug)
      }
      if (hobby) params.set('hobby', hobby)

      const url = `/api/topic-teacher/lesson-manifest?${params}`
      console.log('[manifest] Fetching:', url)
      const response = await fetch(url, {
        signal,
      })

      console.log('[manifest] Response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown')
        console.log('[manifest] Response error:', errorText)
        return false
      }

      const manifest: ManifestResponse = await response.json()
      if (!manifest.chunks || manifest.chunks.length === 0) {
        return false
      }

      manifestDataRef.current = manifest

      // Load audio URLs from manifest
      const urls: string[] = []
      const sources: Array<'pregen' | 'live'> = []
      const counts: number[] = [] // MFA-based counts
      const regexCounts: number[] = [] // Regex-based counts matching spokenWords
      const offsets: number[] = [] // Regex-based offsets for progress reporting
      const progressMaps: number[][] = []
      const durations: number[] = []
      const texts: string[] = []
      const startTimes: number[][] = []
      const endTimes: number[][] = []
      const segmentSectionIndices: number[] = []
      let totalWords = 0 // Regex-based total for progress reporting
      let totalDurationSecs = 0

      for (const chunk of manifest.chunks) {
        // Fetch audio blob for each chunk
        const audioResponse = await fetch(chunk.audioUrl, { signal })
        if (!audioResponse.ok) {
          console.warn(`[manifest] Failed to fetch audio: ${chunk.audioUrl}`)
          return false
        }
        const blob = await audioResponse.blob()
        const url = URL.createObjectURL(blob)
        urls.push(url)
        sources.push('pregen')

        // Fetch timings for this chunk
        let timings: Array<{ word: string; start: number; end: number }> = []
        try {
          const timingsResponse = await fetch(chunk.timingsUrl, { signal })
          if (timingsResponse.ok) {
            const timingsData = await timingsResponse.json()
            if (Array.isArray(timingsData.words)) {
              timings = timingsData.words
            }
          }
        } catch {
          // Timing fetch failed, will use fallback
        }

        // Calculate regex-based word count (must match spokenWords tokenization)
        const regexWordCount = countWords(normalizeTextForReadAlong(chunk.text))
        // MFA word count for timing-based calculations within a segment
        const mfaWordCount = timings.length > 0 ? timings.length : regexWordCount
        counts.push(mfaWordCount)
        regexCounts.push(regexWordCount)
        // Use regex-based counts for offsets to align with spokenWords/displayWords
        offsets.push(totalWords)
        totalWords += regexWordCount
        texts.push(chunk.text)
        durations.push(chunk.duration)
        totalDurationSecs += chunk.duration

        // Use actual timings if available
        if (timings.length > 0) {
          startTimes.push(timings.map((t) => t.start))
          endTimes.push(timings.map((t) => t.end))
          progressMaps.push([]) // Not needed when we have actual timings
        } else {
          startTimes.push([])
          endTimes.push([])
          progressMaps.push(computeWordProgressMap(normalizeTextForReadAlong(chunk.text)))
        }

        // Track section info for navigation
        segmentSectionIndices.push(chunk.sectionIdx ?? 0)
      }

      // Update all the state and refs
      audioUrlsRef.current = urls
      setAudioUrls(urls)
      setSegmentSources(sources)
      setSourceCounts({ pregen: urls.length, live: 0 })

      segmentWordCountsRef.current = counts // MFA-based counts
      segmentRegexWordCountsRef.current = regexCounts // Regex-based counts
      segmentWordProgressRef.current = progressMaps
      segmentWordOffsetsRef.current = offsets // Regex-based offsets
      segmentTextsRef.current = texts
      segmentDurationSecondsRef.current = durations
      segmentWordStartTimesRef.current = startTimes
      segmentWordEndTimesRef.current = endTimes
      totalWordsRef.current = totalWords
      totalDurationSecondsRef.current = totalDurationSecs

      // Compute segment start times
      const starts: number[] = []
      let cumulative = 0
      for (const dur of durations) {
        starts.push(cumulative)
        cumulative += dur
      }
      segmentStartSecondsRef.current = starts

      setDuration(totalDurationSecs)
      setReadAlongTotalWords(totalWords)
      setUsedManifest(true)

      // Set up section navigation from manifest
      segmentSectionIndexRef.current = segmentSectionIndices

      if (manifest.sections && manifest.sections.length > 0) {
        // Use sections from manifest
        const titles = manifest.sections.map(s => s.title)
        const startIndices = manifest.sections.map(s => s.startChunkIdx)

        // Calculate word start indices for each section
        const wordStarts: number[] = []
        for (const section of manifest.sections) {
          const offset = offsets[section.startChunkIdx] ?? 0
          wordStarts.push(offset)
        }

        sectionStartIndexRef.current = startIndices
        sectionWordStartIndexRef.current = wordStarts
        setSectionTitles(titles)
      } else {
        // Derive sections from chunk data for backward compatibility
        const titlesMap = new Map<number, string>()
        const startIndicesMap = new Map<number, number>()
        const wordStartsMap = new Map<number, number>()

        manifest.chunks.forEach((chunk, idx) => {
          if (!titlesMap.has(chunk.sectionIdx ?? 0)) {
            titlesMap.set(chunk.sectionIdx ?? 0, chunk.sectionTitle ?? 'Introduction')
            startIndicesMap.set(chunk.sectionIdx ?? 0, idx)
            wordStartsMap.set(chunk.sectionIdx ?? 0, offsets[idx] ?? 0)
          }
        })

        const sectionIndices = Array.from(titlesMap.keys()).sort((a, b) => a - b)
        sectionStartIndexRef.current = sectionIndices.map(idx => startIndicesMap.get(idx) ?? 0)
        sectionWordStartIndexRef.current = sectionIndices.map(idx => wordStartsMap.get(idx) ?? 0)
        setSectionTitles(sectionIndices.map(idx => titlesMap.get(idx) ?? 'Introduction'))
      }

      if (onWordProgress) {
        onWordProgress({ wordIndex: null, totalWords })
      }

      // Emit manifest text for accurate spokenWords alignment
      // Join with double newlines to match section boundaries
      const manifestText = manifest.chunks.map(c => c.text).join('\n\n')
      onManifestText?.(manifestText)

      return true
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        throw err
      }
      console.warn('[manifest] Failed to load manifest:', err)
      return false
    }
  }

  useEffect(() => {
    clearAudio()
  }, [lessonMarkdown])

  useEffect(() => {
    audioUrlsRef.current = audioUrls
  }, [audioUrls])

  useEffect(() => {
    const pending = pendingAutoAdvanceIndexRef.current
    if (pending === null) return

    if (pending < audioUrls.length) {
      pendingAutoAdvanceIndexRef.current = null
      autoPlayNextRef.current = true
      setCurrentIndex(pending)
      return
    }

    if (!isGenerating) {
      pendingAutoAdvanceIndexRef.current = null
      autoPlayNextRef.current = false
    }
  }, [audioUrls.length, isGenerating])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      revokeUrls(audioUrlsRef.current)
    }
  }, [])

  // Track scroll position for dynamic sticky bar positioning
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Dynamic top position - starts at 120px (below breadcrumb), moves up to 76px as user scrolls
  const stickyTop = Math.max(120 - scrollY, 76)

  const handleEnded = () => {
    const next = currentIndex + 1
    const urls = audioUrlsRef.current

    if (next >= urls.length) {
      if (isGenerating) {
        pendingAutoAdvanceIndexRef.current = next
        autoPlayNextRef.current = true
        return
      }

      pendingAutoAdvanceIndexRef.current = null
      setIsPlaying(false)
      isPlayingRef.current = false
      return
    }

    pendingAutoAdvanceIndexRef.current = null
    autoPlayNextRef.current = true
    setCurrentIndex(next)
  }

  const fetchWordTimingsForSegment = useCallback(
    (segmentIndex: number): Promise<boolean> => {
      if (!wordTimingsEnabled) return Promise.resolve(false)
      if (!readAlongEnabled || !onWordProgress) return Promise.resolve(false)
      if (segmentIndex < 0) return Promise.resolve(false)

      const expectedWords = segmentWordCountsRef.current[segmentIndex] ?? 0
      if (expectedWords <= 0) return Promise.resolve(false)

      const existingEndTimes = segmentWordEndTimesRef.current[segmentIndex]
      if (existingEndTimes && existingEndTimes.length === expectedWords) return Promise.resolve(true)
      if (wordTimingsFailedRef.current.has(segmentIndex)) return Promise.resolve(false)

      const existingPromise = wordTimingsPromisesRef.current.get(segmentIndex)
      if (existingPromise) return existingPromise

      const audioKey = segmentAudioKeysRef.current[segmentIndex]
      const text = segmentTextsRef.current[segmentIndex]
      if (!audioKey || !text) return Promise.resolve(false)

      if (!wordTimingsAbortRef.current || wordTimingsAbortRef.current.signal.aborted) {
        wordTimingsAbortRef.current = new AbortController()
      }

      const promise = (async (): Promise<boolean> => {
        wordTimingsInFlightRef.current.add(segmentIndex)
        try {
          const response = await fetch('/api/topic-teacher/word-timings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: wordTimingsAbortRef.current.signal,
            body: JSON.stringify({ audioKey, text }),
          })

          if (!response.ok) {
            wordTimingsFailedRef.current.add(segmentIndex)
            return false
          }

          const data: any = await response.json().catch(() => null)
          const timings: WordTiming[] = Array.isArray(data?.timings) ? data.timings : []
          if (timings.length !== expectedWords) {
            wordTimingsFailedRef.current.add(segmentIndex)
            return false
          }

          const startTimes = timings.map((t) => (typeof t?.start === 'number' ? t.start : NaN))
          const endTimes = timings.map((t) => (typeof t?.end === 'number' ? t.end : NaN))
          if (!startTimes.every((t) => Number.isFinite(t)) || !endTimes.every((t) => Number.isFinite(t))) {
            wordTimingsFailedRef.current.add(segmentIndex)
            return false
          }

          segmentWordStartTimesRef.current[segmentIndex] = startTimes
          segmentWordEndTimesRef.current[segmentIndex] = endTimes
          return true
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return false
          wordTimingsFailedRef.current.add(segmentIndex)
          return false
        } finally {
          wordTimingsInFlightRef.current.delete(segmentIndex)
          wordTimingsPromisesRef.current.delete(segmentIndex)
        }
      })()

      wordTimingsPromisesRef.current.set(segmentIndex, promise)
      return promise
    },
    [onWordProgress, readAlongEnabled, wordTimingsEnabled]
  )

  useEffect(() => {
    if (!wordTimingsEnabled) return
    if (!readAlongEnabled || !onWordProgress) return
    if (!isPlaying) return
    if (audioUrls.length === 0) return
    void fetchWordTimingsForSegment(currentIndex)
    void fetchWordTimingsForSegment(currentIndex + 1)
  }, [
    audioUrls.length,
    currentIndex,
    fetchWordTimingsForSegment,
    isPlaying,
    onWordProgress,
    readAlongEnabled,
    wordTimingsEnabled,
  ])

  const updateWordProgressFromAudio = useCallback(() => {
    if (!onWordProgress) return
    const audio = audioRef.current
    if (!audio) return
    const counts = segmentWordCountsRef.current
    if (counts.length === 0) return
    const currentCount = counts[currentIndex] ?? 0
    if (currentCount <= 0) return

    const endTimes = segmentWordEndTimesRef.current[currentIndex]
    const durationSeconds = getEffectiveDurationSeconds(audio)
    const ratio =
      Number.isFinite(durationSeconds) && durationSeconds > 0
        ? Math.min(1, Math.max(0, audio.currentTime / durationSeconds))
        : null

    const progressMap = segmentWordProgressRef.current[currentIndex]
    // localIndex is in MFA space (based on timing data)
    const mfaLocalIndex =
      endTimes && endTimes.length === currentCount
        ? findWordIndexForEndTimes(endTimes, audio.currentTime)
        : ratio === null
          ? Math.min(currentCount - 1, Math.floor(audio.currentTime * 2.6))
          : progressMap && progressMap.length === currentCount
            ? findWordIndexForRatio(progressMap, ratio)
            : Math.min(currentCount - 1, Math.floor(ratio * currentCount))

    // Scale from MFA space to regex space to align with spokenWords/displayWords
    const regexCount = segmentRegexWordCountsRef.current[currentIndex] ?? 0
    const scaledLocalIndex = currentCount > 0 && regexCount > 0
      ? Math.min(regexCount - 1, Math.floor(mfaLocalIndex * regexCount / currentCount))
      : mfaLocalIndex

    const offset = segmentWordOffsetsRef.current[currentIndex] ?? 0
    const globalIndex = offset + scaledLocalIndex
    if (lastWordIndexRef.current === globalIndex) return
    lastWordIndexRef.current = globalIndex
    setReadAlongWordIndex(globalIndex)
    onWordProgress({ wordIndex: globalIndex, totalWords: totalWordsRef.current })
  }, [currentIndex, onWordProgress])

  const applyPendingSeek = useCallback(() => {
    const pending = pendingSeekRef.current
    const audio = audioRef.current
    if (!pending || !audio) return
    if (pending.segmentIndex !== currentIndex) return
    if (!audioUrls[pending.segmentIndex]) return

    const apply = () => {
      const durationSeconds = getEffectiveDurationSeconds(audio)
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return
      const hasTimeSeconds = typeof pending.timeSeconds === 'number' && Number.isFinite(pending.timeSeconds)
      const ratioRaw = typeof pending.ratio === 'number' && Number.isFinite(pending.ratio) ? pending.ratio : 0
      const clampedRatio = Math.min(1, Math.max(0, ratioRaw))
      const targetTime = hasTimeSeconds
        ? Math.min(durationSeconds, Math.max(0, pending.timeSeconds as number))
        : Math.min(durationSeconds, durationSeconds * clampedRatio)
      audio.currentTime = targetTime
      const globalOffset = continuousModeActive ? (segmentStartSecondsRef.current[pending.segmentIndex] ?? 0) : 0
      setCurrentTime(globalOffset + targetTime)
      updateWordProgressFromAudio()
      pendingSeekRef.current = null
      if (pending.autoplay ?? true) {
        audio.play().catch(() => {})
      }
    }

    const durationSeconds = getEffectiveDurationSeconds(audio)
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      let handled = false
      const handleReady = () => {
        if (handled) return
        handled = true
        apply()
      }
      audio.addEventListener('loadedmetadata', handleReady, { once: true })
      audio.addEventListener('loadeddata', handleReady, { once: true })
      audio.load()
      return
    }

    apply()
  }, [audioUrls, continuousModeActive, currentIndex, updateWordProgressFromAudio])

  const queueSeekToWord = useCallback(
    (wordIndex: number, autoplay: boolean) => {
      if (!Number.isFinite(wordIndex)) return
      const counts = segmentWordCountsRef.current
      if (counts.length === 0) {
        pendingSeekWordRef.current = Math.max(0, Math.floor(wordIndex))
        if (audioUrls.length === 0 && !isGenerating) {
          handleGenerateRef.current?.()
        }
        return
      }

      const totalWords =
        totalWordsRef.current || counts.reduce((sum, count) => sum + (Number.isFinite(count) ? count : 0), 0)
      if (totalWords <= 0) return

      const requestId = (seekRequestIdRef.current += 1)
      const clamped = Math.max(0, Math.min(Math.floor(wordIndex), totalWords - 1))
      let segmentIndex = counts.length - 1
      for (let i = 0; i < counts.length; i += 1) {
        const offset = segmentWordOffsetsRef.current[i] ?? 0
        const count = counts[i] ?? 0
        if (clamped >= offset && clamped < offset + count) {
          segmentIndex = i
          break
        }
      }

      const localIndex = Math.max(0, clamped - (segmentWordOffsetsRef.current[segmentIndex] ?? 0))
      const expectedCount = counts[segmentIndex] ?? 0
      const startTimes = segmentWordStartTimesRef.current[segmentIndex]

      const progressMap = segmentWordProgressRef.current[segmentIndex]
      const ratio =
        progressMap && progressMap.length > 0
          ? localIndex <= 0
            ? 0
            : Math.max(0, Math.min(1, progressMap[localIndex - 1] ?? 0))
          : expectedCount > 0
            ? Math.max(0, Math.min(1, localIndex / expectedCount))
            : 0

      if (startTimes && startTimes.length === expectedCount) {
        pendingSeekRef.current = {
          segmentIndex,
          timeSeconds: Math.max(0, startTimes[Math.min(localIndex, startTimes.length - 1)] ?? 0),
          autoplay,
        }
      } else if (
        autoplay &&
        wordTimingsEnabled &&
        readAlongEnabled &&
        onWordProgress &&
        !wordTimingsFailedRef.current.has(segmentIndex)
      ) {
        void (async () => {
          const ok = await fetchWordTimingsForSegment(segmentIndex)
          if (seekRequestIdRef.current !== requestId) return

          const updatedStartTimes = segmentWordStartTimesRef.current[segmentIndex]
          if (ok && updatedStartTimes && updatedStartTimes.length === expectedCount) {
            pendingSeekRef.current = {
              segmentIndex,
              timeSeconds: Math.max(
                0,
                updatedStartTimes[Math.min(localIndex, updatedStartTimes.length - 1)] ?? 0
              ),
              autoplay,
            }
          } else {
            pendingSeekRef.current = { segmentIndex, ratio, autoplay }
          }

          setCurrentIndex(segmentIndex)
          applyPendingSeek()
        })()
        return
      } else {
        pendingSeekRef.current = { segmentIndex, ratio, autoplay }
      }

      if (segmentIndex !== currentIndex) {
        setCurrentIndex(segmentIndex)
        return
      }

      applyPendingSeek()
    },
    [
      applyPendingSeek,
      audioUrls.length,
      currentIndex,
      fetchWordTimingsForSegment,
      isGenerating,
      onWordProgress,
      readAlongEnabled,
      wordTimingsEnabled,
    ]
  )

  const seekToWord = useCallback((wordIndex: number) => queueSeekToWord(wordIndex, true), [queueSeekToWord])

  useImperativeHandle(ref, () => ({ seekToWord }), [seekToWord])

  useEffect(() => {
    if (audioUrls.length > 0 || !isPlaying) return
    setIsPlaying(false)
  }, [audioUrls.length, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const urls = audioUrlsRef.current
    if (!urls[currentIndex]) return

    audio.load()
    audio.playbackRate = playbackRate
    const pendingSeek = pendingSeekRef.current
    const hasPendingSeek = pendingSeek?.segmentIndex === currentIndex
    if (!hasPendingSeek) {
      try {
        audio.currentTime = 0
      } catch {
        // ignore
      }
      const globalOffset = continuousModeActive ? (segmentStartSecondsRef.current[currentIndex] ?? 0) : 0
      setCurrentTime(globalOffset)
      updateWordProgressFromAudio()
    }

    const shouldPlay = !hasPendingSeek && (isPlayingRef.current || autoPlayNextRef.current)
    autoPlayNextRef.current = false
    if (shouldPlay) {
      if (wordTimingsEnabled && readAlongEnabled && onWordProgress) {
        void (async () => {
          setIsPreparingTimings(true)
          try {
            await fetchWordTimingsForSegment(currentIndex)
            void fetchWordTimingsForSegment(currentIndex + 1)
          } finally {
            setIsPreparingTimings(false)
          }
          audio.play().catch(() => {
            setIsPlaying(false)
            isPlayingRef.current = false
          })
        })()
        return
      }

      audio.play().catch(() => {
        setIsPlaying(false)
        isPlayingRef.current = false
      })
    }
  }, [
    continuousModeActive,
    currentIndex,
    fetchWordTimingsForSegment,
    onWordProgress,
    readAlongEnabled,
    updateWordProgressFromAudio,
    wordTimingsEnabled,
  ])

  useEffect(() => {
    applyPendingSeek()
  }, [applyPendingSeek, currentIndex, audioUrls])

  useEffect(() => {
    if (!isPlaying || audioUrls.length === 0) return
    let rafId = 0
    const tick = () => {
      updateWordProgressFromAudio()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [audioUrls.length, isPlaying, updateWordProgressFromAudio])

  const recomputeSegmentTimeline = useCallback(() => {
    const durations = segmentDurationSecondsRef.current
    const starts = new Array(durations.length).fill(0)
    let total = 0
    for (let i = 0; i < durations.length; i += 1) {
      starts[i] = total
      const durationSeconds = durations[i]
      if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
        total += durationSeconds
      }
    }
    segmentStartSecondsRef.current = starts
    totalDurationSecondsRef.current = total
    if (continuousModeActive) {
      setDuration(total)
    }
  }, [continuousModeActive])

  const generateAudioForSegments = async (
    segments: Array<{ text: string; voice: string; cacheable?: boolean }>,
    trackWords: boolean
  ) => {
    if (segments.length === 0) {
      throw new Error('No audio segments to generate.')
    }

    if (onWordProgress) {
      if (trackWords) {
        const counts = segments.map((segment) => countWords(normalizeTextForReadAlong(segment.text)))
        const progressMaps = segments.map((segment) =>
          computeWordProgressMap(normalizeTextForReadAlong(segment.text))
        )
        const offsets: number[] = []
        let total = 0
        counts.forEach((count) => {
          offsets.push(total)
          total += count
        })
        segmentWordCountsRef.current = counts
        segmentRegexWordCountsRef.current = counts // Same as MFA counts when no timings
        segmentWordProgressRef.current = progressMaps
        segmentWordOffsetsRef.current = offsets
        totalWordsRef.current = total
        lastWordIndexRef.current = null
        setReadAlongWordIndex(null)
        setReadAlongTotalWords(total)
        onWordProgress({ wordIndex: null, totalWords: total })

        if (pendingSeekWordRef.current !== null) {
          const pendingIndex = pendingSeekWordRef.current
          pendingSeekWordRef.current = null
          setTimeout(() => seekToWord(pendingIndex), 0)
        }
      } else {
        segmentWordCountsRef.current = []
        segmentRegexWordCountsRef.current = []
        segmentWordProgressRef.current = []
        segmentWordOffsetsRef.current = []
        totalWordsRef.current = 0
        lastWordIndexRef.current = null
        setReadAlongWordIndex(null)
        setReadAlongTotalWords(0)
        onWordProgress({ wordIndex: null, totalWords: 0 })
      }
    }

    const controller = new AbortController()
    abortRef.current = controller
    wordTimingsAbortRef.current?.abort()
    wordTimingsAbortRef.current = new AbortController()
    wordTimingsInFlightRef.current.clear()
    wordTimingsFailedRef.current.clear()
    wordTimingsPromisesRef.current.clear()
    segmentAudioKeysRef.current = []
    segmentTextsRef.current = []
    segmentWordStartTimesRef.current = []
    segmentWordEndTimesRef.current = []
    segmentDurationSecondsRef.current = new Array(segments.length).fill(NaN)
    segmentStartSecondsRef.current = new Array(segments.length).fill(0)
    totalDurationSecondsRef.current = 0
    if (continuousModeActive) {
      setDuration(0)
      setCurrentTime(0)
    }

    const urls: string[] = []
    audioUrlsRef.current = []
    setAudioUrls([])
    setCurrentIndex(0)
    setProgress({ current: 0, total: segments.length })

    setSourceCounts({ pregen: 0, live: 0 })
    setSegmentSources([])
    const sources: Array<'pregen' | 'live'> = []

    const incrementSource = (key: 'pregen' | 'live') => {
      setSourceCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }))
    }

  const registerSegment = async (options: {
      index: number
      url: string
      source: 'pregen' | 'live'
      audioKey: string | null
      text: string
    }) => {
      urls.push(options.url)
      const nextUrls = [...urls]
      audioUrlsRef.current = nextUrls
      setAudioUrls(nextUrls)
      sources.push(options.source)
      setSegmentSources([...sources])
      incrementSource(options.source)
      segmentAudioKeysRef.current.push(options.audioKey)
      segmentTextsRef.current.push(options.text)

      void (async () => {
        const durationSeconds = await loadAudioDurationSeconds(options.url, controller.signal)
        if (controller.signal.aborted) return
        segmentDurationSecondsRef.current[options.index] = durationSeconds
        recomputeSegmentTimeline()
      })()
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
            await registerSegment({
              index: i,
              url,
              source: 'pregen',
              audioKey: extractAudioKeyFromPublicUrl(primaryUrl),
              text: preparedText,
            })
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
            await registerSegment({
              index: i,
              url,
              source: 'pregen',
              audioKey: extractAudioKeyFromPublicUrl(fallbackUrl),
              text: preparedText,
            })
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
      await registerSegment({
        index: i,
        url,
        source: 'live',
        audioKey: response.headers.get('X-Topic-Teacher-Audio-Key')?.trim() || null,
        text: preparedText,
      })
    }

    setProgress({ current: segments.length, total: segments.length })
  }

	  const handleGenerate = async () => {
	    if (isDisabled || isGenerating) return
	    if (canUsePregen && !baseContentReady) return

    const maxCharsPerTtsRequest = readAlongEnabled ? 1400 : MAX_CHARS_PER_TTS_REQUEST
    const sectionSplitLevel = 2

	    setError(null)
	    setIsGenerating(true)
	    setIsPreparingTimings(false)
	    setProgress({ current: 0, total: 0 })
	    audioUrlsRef.current = []
	    setAudioUrls((prev) => {
	      revokeUrls(prev)
	      return []
	    })
	    setCurrentIndex(0)

	    try {
      // Try to load from MFA manifest first (if available)
      const controller = new AbortController()
      abortRef.current = controller

      // Manifest can be used even with interests (hobby variants supported)
      // Only require voice=default and English language
      const canUseManifest = voice === DEFAULT_VOICE && isEnglishish(languagePreference)
      console.log('[handleGenerate] Checking manifest conditions:', {
        useManifest,
        lessonSlug,
        canUseManifest,
        canUsePregen,
        voice,
        interestsActive,
        languagePreference,
      })

      if (useManifest && lessonSlug && canUseManifest) {
        const manifestLoaded = await tryLoadFromManifest(controller.signal)
        if (manifestLoaded) {
          console.log('[audio-controls] Loaded audio from MFA manifest')
          setIsGenerating(false)
          return
        }
      }

      // Fall back to existing audio generation
      const normalizedRanges =
        baseLessonMarkdown && metaphorRanges.length > 0 && isEnglishish(languagePreference)
          ? normalizeRanges(baseLessonMarkdown, metaphorRanges)
          : []

	      const segments: Array<{ text: string; voice: string; cacheable?: boolean }> = []
	      const nextSectionTitles: string[] = []
	      const nextSectionStarts: number[] = []
	      const nextSectionWordStarts: number[] = []
	      const nextSegmentSectionIndices: number[] = []
	      let segmentCursor = 0
	      let wordCursor = 0

	      const pushSpeakableChunks = (options: { sectionIndex: number; text: string; cacheable?: boolean }) => {
	        const chunks = chunkTextForTts(options.text, maxCharsPerTtsRequest)
	        chunks.forEach((text) => {
	          if (!text.trim()) return
	          segments.push({ text, voice, cacheable: options.cacheable })
	          nextSegmentSectionIndices.push(options.sectionIndex)
	          segmentCursor += 1
	          wordCursor += countWords(normalizeTextForReadAlong(text))
	        })
	      }

      if (baseLessonMarkdown && normalizedRanges.length > 0) {
        const sections = splitMarkdownIntoSections(baseLessonMarkdown, sectionSplitLevel)
        const staticPartsForExtraction = buildStaticPartsFromRanges(baseLessonMarkdown, normalizedRanges)
        const extractedMetaphors = extractMetaphorTextsFromLesson(lessonMarkdown, staticPartsForExtraction)
        const metaphorTexts =
          extractedMetaphors && extractedMetaphors.length === normalizedRanges.length
            ? extractedMetaphors
            : normalizedRanges.map((range) => baseLessonMarkdown.slice(range.start, range.end))
        const metaphorCacheable = !Boolean(userInterests && userInterests.trim())

	        for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
	          const section = sections[sectionIndex]
	          nextSectionTitles.push(section.title ?? 'Intro')
	          nextSectionStarts.push(segmentCursor)
	          nextSectionWordStarts.push(wordCursor)

          const sectionRangesIndices: number[] = []
          const sectionRanges: MetaphorRange[] = []
          for (let i = 0; i < normalizedRanges.length; i += 1) {
            const range = normalizedRanges[i]
            if (range.start < section.start || range.end > section.end) continue
            sectionRangesIndices.push(i)
            sectionRanges.push({
              start: range.start - section.start,
              end: range.end - section.start,
            })
          }

          if (sectionRanges.length === 0) {
            const speakable = prepareTextForTts(markdownToSpeakableText(section.markdown))
            if (speakable.trim()) {
              pushSpeakableChunks({ sectionIndex, text: speakable, cacheable: true })
            }
            continue
          }

          const baseSectionMarkdown = baseLessonMarkdown.slice(section.start, section.end)
          const staticParts = buildStaticPartsFromRanges(baseSectionMarkdown, sectionRanges)
          for (let partIndex = 0; partIndex < staticParts.length; partIndex += 1) {
            const staticMarkdown = staticParts[partIndex]
            if (staticMarkdown.trim()) {
              const speakable = prepareTextForTts(markdownToSpeakableText(staticMarkdown))
              if (speakable.trim()) {
                pushSpeakableChunks({ sectionIndex, text: speakable, cacheable: true })
              }
            }

            if (partIndex < sectionRangesIndices.length) {
              const metaphorMarkdown = metaphorTexts[sectionRangesIndices[partIndex]] ?? ''
              if (metaphorMarkdown.trim()) {
                const speakable = prepareTextForTts(markdownToSpeakableText(metaphorMarkdown))
                if (speakable.trim()) {
                  pushSpeakableChunks({
                    sectionIndex,
                    text: speakable,
                    cacheable: metaphorCacheable,
                  })
                }
              }
            }
          }
        }

        segmentSectionIndexRef.current = nextSegmentSectionIndices
        sectionStartIndexRef.current = nextSectionStarts
        sectionWordStartIndexRef.current = nextSectionWordStarts
        setSectionTitles(nextSectionTitles)

        await generateAudioForSegments(segments, true)
        return
      }

      const sections = splitMarkdownIntoSections(lessonMarkdown, sectionSplitLevel)
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
        const section = sections[sectionIndex]
        nextSectionTitles.push(section.title ?? 'Intro')
        nextSectionStarts.push(segmentCursor)
        nextSectionWordStarts.push(wordCursor)

        const speakable = prepareTextForTts(markdownToSpeakableText(section.markdown))
        if (!speakable.trim()) continue
        pushSpeakableChunks({ sectionIndex, text: speakable, cacheable: canUsePregen })
      }

      segmentSectionIndexRef.current = nextSegmentSectionIndices
      sectionStartIndexRef.current = nextSectionStarts
      sectionWordStartIndexRef.current = nextSectionWordStarts
      setSectionTitles(nextSectionTitles)

      await generateAudioForSegments(segments, true)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return
      }
      console.error('[LessonAudioControls] Error generating audio:', err)
      const message = err instanceof Error ? err.message : 'Failed to generate audio.'
      setError(message)
      audioUrlsRef.current = []
      setAudioUrls((prev) => {
        revokeUrls(prev)
        return []
      })
    } finally {
      setIsGenerating(false)
      abortRef.current = null
    }
  }

  handleGenerateRef.current = () => {
    void handleGenerate()
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsGenerating(false)
    setProgress({ current: 0, total: 0 })
  }

  const progressText =
    isGenerating && progress.total > 0
      ? `Generating audio ${Math.min(progress.current + 1, progress.total)}/${progress.total}…`
      : isPreparingTimings
        ? 'Preparing word timings…'
        : null
  const sourceTotal = sourceCounts.pregen + sourceCounts.live
  const sourceText =
    usedManifest
      ? `Audio source: MFA manifest (${sourceCounts.pregen} chunks)`
      : sourceTotal > 0
        ? `Audio source: ${sourceCounts.pregen} pre-generated · ${sourceCounts.live} live`
        : null

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const hasAudio = audioUrls.length > 0
  const sectionCount = sectionTitles.length
  const currentSectionIndex = (() => {
    if (!hasAudio) return 0
    if (!continuousModeActive) return segmentSectionIndexRef.current[currentIndex] ?? 0

    const starts = sectionWordStartIndexRef.current
    if (starts.length === 0) return 0
    const wordIndex = readAlongWordIndex ?? 0

    let lo = 0
    let hi = starts.length - 1
    let best = 0
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      const start = starts[mid] ?? 0
      if (wordIndex >= start) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return Math.max(0, Math.min(best, starts.length - 1))
  })()

  const jumpToSection = useCallback(
    (targetSectionIndex: number) => {
      if (!hasAudio) return

      if (continuousModeActive) {
        const starts = sectionWordStartIndexRef.current
        if (starts.length === 0) return
        const clampedSection = Math.max(0, Math.min(targetSectionIndex, starts.length - 1))
        const wordIndex = starts[clampedSection] ?? 0
        queueSeekToWord(wordIndex, isPlaying)
        return
      }

      const starts = sectionStartIndexRef.current
      if (starts.length === 0 || audioUrls.length === 0) {
        setCurrentIndex((prev) => Math.max(0, Math.min(audioUrls.length - 1, prev)))
        return
      }

      const clampedSection = Math.max(0, Math.min(targetSectionIndex, starts.length - 1))
      const targetSegment = starts[clampedSection] ?? 0
      const maxIndex = Math.max(0, audioUrls.length - 1)
      setCurrentIndex(Math.max(0, Math.min(targetSegment, maxIndex)))
    },
    [audioUrls.length, continuousModeActive, hasAudio, isPlaying, queueSeekToWord]
  )

  const handlePrevSection = () => {
    jumpToSection(currentSectionIndex - 1)
  }

  const handleNextSection = () => {
    jumpToSection(currentSectionIndex + 1)
  }

  const handlePlayPause = () => {
    if (audioUrls.length === 0) {
      if (isDisabled || isGenerating) return
      handleGenerateRef.current?.()
      return
    }
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      if (wordTimingsEnabled && readAlongEnabled && onWordProgress) {
        void (async () => {
          setIsPreparingTimings(true)
          try {
            await fetchWordTimingsForSegment(currentIndex)
            void fetchWordTimingsForSegment(currentIndex + 1)
          } finally {
            setIsPreparingTimings(false)
          }
          audio.play().catch(() => {})
        })()
        return
      }

      audio.play().catch(() => {})
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = Number.parseFloat(e.target.value)
    if (!Number.isFinite(newTime)) return

    if (!continuousModeActive) {
      audio.currentTime = newTime
      setCurrentTime(newTime)
      return
    }

    const total = totalDurationSecondsRef.current
    const targetGlobalTime = Math.min(Math.max(0, newTime), Number.isFinite(total) && total > 0 ? total : newTime)

    const starts = segmentStartSecondsRef.current
    const durations = segmentDurationSecondsRef.current
    const segmentCount = durations.length
    if (segmentCount === 0) {
      audio.currentTime = targetGlobalTime
      setCurrentTime(targetGlobalTime)
      return
    }

    let segmentIndex = segmentCount - 1
    for (let i = 0; i < segmentCount; i += 1) {
      const start = starts[i] ?? 0
      const durationSeconds = durations[i]
      const end = start + (Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0)
      if (i === segmentCount - 1 || targetGlobalTime < end) {
        segmentIndex = i
        break
      }
    }

    const segmentStart = starts[segmentIndex] ?? 0
    const localTime = Math.max(0, targetGlobalTime - segmentStart)
    pendingSeekRef.current = { segmentIndex, timeSeconds: localTime, autoplay: isPlaying }
    if (segmentIndex !== currentIndex) {
      setCurrentIndex(segmentIndex)
      return
    }
    applyPendingSeek()
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    const segmentOffset = continuousModeActive ? (segmentStartSecondsRef.current[currentIndex] ?? 0) : 0
    setCurrentTime(segmentOffset + audio.currentTime)
    const nextDuration = getEffectiveDurationSeconds(audio)
    if (Number.isFinite(nextDuration) && nextDuration > 0) {
      if (continuousModeActive) {
        const known = segmentDurationSecondsRef.current[currentIndex]
        if (!Number.isFinite(known) || Math.abs(known - nextDuration) > 0.05) {
          segmentDurationSecondsRef.current[currentIndex] = nextDuration
          recomputeSegmentTimeline()
        }
      } else {
        setDuration(nextDuration)
      }
    }
    updateWordProgressFromAudio()
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = playbackRate
    const nextDuration = getEffectiveDurationSeconds(audio)
    if (Number.isFinite(nextDuration) && nextDuration > 0) {
      if (continuousModeActive) {
        segmentDurationSecondsRef.current[currentIndex] = nextDuration
        recomputeSegmentTimeline()
      } else {
        setDuration(nextDuration)
      }
    }
    updateWordProgressFromAudio()
  }

  const currentSegmentSource = hasAudio && !continuousModeActive ? segmentSources[currentIndex] : null
  const showStickyBar = hasAudio || shouldAutoLoadPregenFullLesson
  const showGenerateButton = !shouldAutoLoadPregenFullLesson || voice !== DEFAULT_VOICE || interestsActive
  const showRegenerateButton = hasAudio && (interestsActive || voice !== DEFAULT_VOICE || !isEnglishish(languagePreference))

  useEffect(() => {
    if (!shouldAutoLoadPregenFullLesson) return
    if (isDisabled || isGenerating || hasAudio || error) return
    void handleGenerate()
  }, [shouldAutoLoadPregenFullLesson, isDisabled, isGenerating, hasAudio, error])

  // Temporary maintenance mode - set to true to show maintenance notice
  const audioMaintenanceMode = false

  return (
    <>
      {/* Spacer when unified audio bar is visible */}
      {showStickyBar && !audioMaintenanceMode && <div className="h-20" />}

      {/* Maintenance Notice */}
      {audioMaintenanceMode && (
        <Alert className="mb-4 max-w-2xl border-amber-500/50 bg-amber-500/10">
          <AlertDescription className="text-sm">
            Audio playback is temporarily unavailable while we improve word synchronization. Check back soon!
          </AlertDescription>
        </Alert>
      )}

      {/* Initial Settings Panel - only shown when NO audio exists and sticky bar is not visible */}
      {!hasAudio && !showStickyBar && !audioMaintenanceMode && (
        <div className="mb-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-background px-3 py-2">
            {/* Playback speed slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Speed</span>
              <input
                type="range"
                min={0}
                max={PLAYBACK_RATE_OPTIONS.length - 1}
                value={PLAYBACK_RATE_OPTIONS.indexOf(playbackRate as typeof PLAYBACK_RATE_OPTIONS[number])}
                onChange={(e) => setPlaybackRate(PLAYBACK_RATE_OPTIONS[parseInt(e.target.value)])}
                className="w-20 h-1 appearance-none bg-border rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="text-xs text-muted-foreground tabular-nums">
                {playbackRate}×
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
            if (audioRef.current) {
              audioRef.current.playbackRate = playbackRate
            }
            isPlayingRef.current = true
            setIsPlaying(true)
            updateWordProgressFromAudio()
          }}
          onPause={() => {
            isPlayingRef.current = false
            setIsPlaying(false)
          }}
          onSeeked={updateWordProgressFromAudio}
          className="hidden"
        />
      )}

      {/* Unified Sticky Audio Bar */}
      {showStickyBar && !audioMaintenanceMode && (
        <div
          className="fixed left-0 right-0 z-50 transition-[top] duration-100 pointer-events-none"
          style={{ top: `${stickyTop}px` }}
        >
          <div className="mx-auto max-w-[800px] px-4 py-2 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/40 pointer-events-auto">
            <div className="flex items-center gap-2">
              {/* Playback controls - first for prominence */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevSection}
                  disabled={!hasAudio || currentSectionIndex <= 0}
                  className="p-1 rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous section"
                  title={sectionCount > 0 ? `Previous section (${currentSectionIndex + 1}/${sectionCount})` : 'Previous section'}
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handlePlayPause}
                  disabled={!hasAudio && (isDisabled || isGenerating)}
                  className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  data-tour="audio-play"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleNextSection}
                  disabled={!hasAudio || currentSectionIndex >= sectionCount - 1}
                  className="p-1 rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next section"
                  title={sectionCount > 0 ? `Next section (${currentSectionIndex + 1}/${sectionCount})` : 'Next section'}
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
                <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Right section: Speed, segment, auto-scroll, actions */}
              <div className="flex items-center gap-2 shrink-0 ml-3 pl-3 border-l border-border/40">
                {/* Speed slider */}
                <div className="flex items-center gap-1.5" data-tour="playback-speed">
                  <span className="text-xs text-muted-foreground">Speed</span>
                  <input
                    type="range"
                    min={0}
                    max={PLAYBACK_RATE_OPTIONS.length - 1}
                    value={PLAYBACK_RATE_OPTIONS.indexOf(playbackRate as typeof PLAYBACK_RATE_OPTIONS[number])}
                    onChange={(e) => setPlaybackRate(PLAYBACK_RATE_OPTIONS[parseInt(e.target.value)])}
                    className="w-14 h-1 appearance-none bg-border rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {playbackRate}×
                  </span>
                </div>

                {hasAudio && sectionCount > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block" title={sectionTitles[currentSectionIndex] ?? ''}>
                    {`Section ${Math.min(sectionCount, currentSectionIndex + 1)}/${sectionCount}`}
                  </span>
                )}

                {usedManifest ? (
                  <span
                    className="hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium border-blue-400/40 text-blue-500"
                    title="Using MFA-aligned pre-generated audio with perfect word synchronization."
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    MFA
                  </span>
                ) : currentSegmentSource && (
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      currentSegmentSource === 'pregen'
                        ? 'border-emerald-400/40 text-emerald-500'
                        : 'border-amber-400/40 text-amber-500'
                    }`}
                    title={
                      currentSegmentSource === 'pregen'
                        ? 'This segment is pre-generated.'
                        : 'This segment was generated live.'
                    }
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        currentSegmentSource === 'pregen' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {currentSegmentSource === 'pregen' ? 'Pregen' : 'Live'}
                  </span>
                )}

                {readAlongEnabled && hasAudio && (
                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                    {readAlongTotalWords > 0
                      ? `Word ${readAlongWordIndex !== null ? readAlongWordIndex + 1 : 0}/${readAlongTotalWords}`
                      : 'Word —'}
                  </span>
                )}

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
                    data-tour="read-along"
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

            {/* Testing banner */}
            <div className="mt-2 px-2 py-1 text-xs text-center text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded">
              Audio sync is being tested. Please report any issues!
            </div>
          </div>
        </div>
      )}
    </>
  )
})
