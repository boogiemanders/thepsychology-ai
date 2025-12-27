'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { chunkTextForTts, markdownToSpeakableText } from '@/lib/speech-text'

type AudioMode = 'full' | 'podcast'

type PodcastScriptResponse = {
  segments: Array<{
    speaker: 'host' | 'cohost'
    text: string
  }>
}

const DEFAULT_VOICE = 'alloy'
const DEFAULT_HOST_VOICE = 'alloy'
const DEFAULT_COHOST_VOICE = 'nova'

const VOICE_OPTIONS = ['alloy', 'nova', 'shimmer', 'onyx', 'fable', 'echo'] as const

const MAX_CHARS_PER_TTS_REQUEST = 3200

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

export function LessonAudioControls(props: {
  lessonMarkdown: string
  topic: string
  domain: string | null
  userId: string | null
  userInterests: string | null
  languagePreference: string | null
  disabledReason?: string | null
}) {
  const {
    lessonMarkdown,
    topic,
    domain,
    userId,
    userInterests,
    languagePreference,
    disabledReason,
  } = props

  const [mode, setMode] = useState<AudioMode>('podcast')
  const [voice, setVoice] = useState<string>(DEFAULT_VOICE)
  const [hostVoice, setHostVoice] = useState<string>(DEFAULT_HOST_VOICE)
  const [cohostVoice, setCohostVoice] = useState<string>(DEFAULT_COHOST_VOICE)

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const autoPlayNextRef = useRef(false)
  const audioUrlsRef = useRef<string[]>([])

  const lessonReady = Boolean(lessonMarkdown && lessonMarkdown.trim())
  const effectiveDisabledReason = disabledReason ?? (!lessonReady ? 'Load a lesson to enable audio.' : null)
  const isDisabled = Boolean(effectiveDisabledReason)

  const speakableFullText = useMemo(() => {
    if (!lessonReady) return ''
    return markdownToSpeakableText(lessonMarkdown)
  }, [lessonMarkdown, lessonReady])

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
    setAudioUrls((prev) => {
      revokeUrls(prev)
      return []
    })
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

  const handleEnded = () => {
    const next = currentIndex + 1
    if (next >= audioUrls.length) return
    autoPlayNextRef.current = true
    setCurrentIndex(next)
  }

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

  const generateAudioForSegments = async (segments: Array<{ text: string; voice: string }>) => {
    if (segments.length === 0) {
      throw new Error('No audio segments to generate.')
    }

    const controller = new AbortController()
    abortRef.current = controller

    const urls: string[] = []
    setAudioUrls([])
    setCurrentIndex(0)
    setProgress({ current: 0, total: segments.length })

    for (let i = 0; i < segments.length; i++) {
      if (controller.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      setProgress({ current: i, total: segments.length })

      const segment = segments[i]
      const response = await fetch('/api/topic-teacher/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          text: segment.text,
          voice: segment.voice,
          format: 'mp3',
          userId,
          topic,
          domain,
          mode,
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
      if (mode === 'podcast') {
        const scriptResponse = await fetch('/api/topic-teacher/audio-script', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonMarkdown,
            topic,
            domain,
            userInterests,
            languagePreference,
            userId,
          }),
        })

        if (!scriptResponse.ok) {
          throw new Error(await readApiErrorMessage(scriptResponse, 'Failed to create podcast script.'))
        }

        const script = (await scriptResponse.json()) as PodcastScriptResponse
        const segments = script.segments.flatMap((seg) => {
          const voiceForSpeaker = seg.speaker === 'host' ? hostVoice : cohostVoice
          return chunkTextForTts(seg.text, MAX_CHARS_PER_TTS_REQUEST).map((text) => ({
            text,
            voice: voiceForSpeaker,
          }))
        })

        await generateAudioForSegments(segments)
      } else {
        const chunks = chunkTextForTts(speakableFullText, MAX_CHARS_PER_TTS_REQUEST)
        const segments = chunks.map((text) => ({ text, voice }))
        await generateAudioForSegments(segments)
      }
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

  return (
    <div className="mb-6 max-w-2xl">
      <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === 'podcast' ? 'default' : 'outline'}
              onClick={() => setMode('podcast')}
              disabled={isGenerating}
            >
              Podcast
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'full' ? 'default' : 'outline'}
              onClick={() => setMode('full')}
              disabled={isGenerating}
            >
              Full Lesson
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={handleGenerate} disabled={isDisabled || isGenerating}>
              {audioUrls.length > 0 ? 'Regenerate Audio' : 'Generate Audio'}
            </Button>
            {isGenerating ? (
              <Button type="button" size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            ) : audioUrls.length > 0 ? (
              <Button type="button" size="sm" variant="outline" onClick={clearAudio}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {mode === 'podcast' ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              Host voice
              <select
                className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
                value={hostVoice}
                onChange={(e) => setHostVoice(e.target.value)}
                disabled={isGenerating}
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Cohost voice
              <select
                className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
                value={cohostVoice}
                onChange={(e) => setCohostVoice(e.target.value)}
                disabled={isGenerating}
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              Voice
              <select
                className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                disabled={isGenerating}
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {effectiveDisabledReason && (
          <div className="text-sm text-muted-foreground">{effectiveDisabledReason}</div>
        )}

        {progressText && (
          <div className="text-sm text-muted-foreground">{progressText}</div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {audioUrls.length > 0 && (
          <div className="flex flex-col gap-2">
            <audio
              ref={audioRef}
              controls
              src={audioUrls[currentIndex]}
              onEnded={handleEnded}
              className="w-full"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={currentIndex >= audioUrls.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(audioUrls.length - 1, prev + 1))}
                >
                  Next
                </Button>
                <span>
                  Segment {currentIndex + 1}/{audioUrls.length}
                </span>
              </div>

              <a
                className="underline underline-offset-2 hover:no-underline"
                href={audioUrls[currentIndex]}
                download={`topic-teacher-${topic || 'lesson'}-${mode}-${currentIndex + 1}.mp3`}
              >
                Download segment
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
