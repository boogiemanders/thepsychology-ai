'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { VF_TRIAL_DURATION_MS } from './prompts'
import type {
  VfAmplitudeFrame,
  VfInputMode,
  VfRecordingPayload,
  VfTypedKeystroke,
} from './types'

type RecorderPhase = 'requesting' | 'ready-voice' | 'ready-typed' | 'recording' | 'finalizing' | 'done'

interface RecorderProps {
  trialLabel: string
  onComplete: (payload: VfRecordingPayload) => void
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as number[])
  }
  return btoa(binary)
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c
    } catch {
      // ignore
    }
  }
  return ''
}

export function VfRecorder({ trialLabel, onComplete }: RecorderProps) {
  const [phase, setPhase] = useState<RecorderPhase>('requesting')
  const [mode, setMode] = useState<VfInputMode>('voice')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [amplitudeLevel, setAmplitudeLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [waveform, setWaveform] = useState<number[]>([])
  const [typedText, setTypedText] = useState('')

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const amplitudeFramesRef = useRef<VfAmplitudeFrame[]>([])
  const keystrokesRef = useRef<VfTypedKeystroke[]>([])
  const startPerfRef = useRef<number>(0)
  const startWallRef = useRef<number>(0)
  const timerIdRef = useRef<number | null>(null)
  const stopTimeoutRef = useRef<number | null>(null)
  const completedRef = useRef(false)

  const stopTracks = useCallback(() => {
    const stream = streamRef.current
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
    }
    streamRef.current = null
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      void audioCtxRef.current.close().catch(() => {})
    }
    audioCtxRef.current = null
    analyserRef.current = null
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  const finishVoice = useCallback(
    async (blob: Blob) => {
      if (completedRef.current) return
      completedRef.current = true
      const completedAt = Date.now()
      const durationMs = performance.now() - startPerfRef.current
      let base64 = ''
      try {
        base64 = arrayBufferToBase64(await blob.arrayBuffer())
      } catch (err) {
        console.warn('[vf-recorder] base64 conversion failed', err)
      }
      onComplete({
        input: 'voice',
        startedAt: startWallRef.current,
        completedAt,
        durationMs,
        audio: { mimeType: blob.type || 'audio/webm', base64, blob },
        amplitude: amplitudeFramesRef.current.slice(),
      })
      stopTracks()
      setPhase('done')
    },
    [onComplete, stopTracks],
  )

  const stopRecording = useCallback(
    (reason: 'auto' | 'manual') => {
      if (completedRef.current) return
      if (stopTimeoutRef.current !== null) {
        window.clearTimeout(stopTimeoutRef.current)
        stopTimeoutRef.current = null
      }
      if (timerIdRef.current !== null) {
        window.clearInterval(timerIdRef.current)
        timerIdRef.current = null
      }
      setPhase('finalizing')
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      } else if (mode === 'voice') {
        const blob = new Blob(chunksRef.current, { type: pickMimeType() || 'audio/webm' })
        void finishVoice(blob)
      }
      // For typed mode, finalize directly
      if (mode === 'typed') {
        completedRef.current = true
        const completedAt = Date.now()
        const durationMs = performance.now() - startPerfRef.current
        onComplete({
          input: 'typed',
          startedAt: startWallRef.current,
          completedAt,
          durationMs,
          keystrokes: keystrokesRef.current.slice(),
          typedText,
        })
        setPhase('done')
      }
      if (reason === 'manual') {
        // no-op; just for readability
      }
    },
    [finishVoice, mode, onComplete, typedText],
  )

  const beginVoiceSetup = useCallback(async () => {
    setError(null)
    setPhase('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      analyserRef.current = analyser

      const mimeType = pickMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        void finishVoice(blob)
      }
      recorder.onerror = () => {
        setError('Recording error. Try again.')
      }

      setMode('voice')
      setPhase('ready-voice')
    } catch (err: any) {
      console.warn('[vf-recorder] mic denied or unavailable:', err?.message ?? err)
      stopTracks()
      setMode('typed')
      setPhase('ready-typed')
      setError('Microphone unavailable. You can type responses instead.')
    }
  }, [finishVoice, stopTracks])

  useEffect(() => {
    void beginVoiceSetup()
    return () => {
      completedRef.current = true
      if (timerIdRef.current !== null) window.clearInterval(timerIdRef.current)
      if (stopTimeoutRef.current !== null) window.clearTimeout(stopTimeoutRef.current)
      stopTracks()
    }
  }, [beginVoiceSetup, stopTracks])

  const startRecording = useCallback(() => {
    if (completedRef.current) return
    startPerfRef.current = performance.now()
    startWallRef.current = Date.now()
    amplitudeFramesRef.current = []
    keystrokesRef.current = []
    setElapsedMs(0)
    setWaveform([])

    if (mode === 'voice' && recorderRef.current) {
      recorderRef.current.start(250)

      const analyser = analyserRef.current
      if (analyser) {
        const dataArr = new Uint8Array(analyser.fftSize)
        const tick = () => {
          if (completedRef.current) return
          analyser.getByteTimeDomainData(dataArr)
          let sumSq = 0
          for (let i = 0; i < dataArr.length; i += 1) {
            const v = (dataArr[i] - 128) / 128
            sumSq += v * v
          }
          const rms = Math.sqrt(sumSq / dataArr.length)
          const level = Math.min(1, rms * 2.2)
          const t = performance.now() - startPerfRef.current
          amplitudeFramesRef.current.push({ t, level })
          setAmplitudeLevel(level)
          setWaveform((prev) => {
            const next = prev.slice(-119)
            next.push(level)
            return next
          })
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    timerIdRef.current = window.setInterval(() => {
      const t = performance.now() - startPerfRef.current
      setElapsedMs(Math.min(t, VF_TRIAL_DURATION_MS))
    }, 100)

    stopTimeoutRef.current = window.setTimeout(() => {
      stopRecording('auto')
    }, VF_TRIAL_DURATION_MS)

    setPhase('recording')
  }, [mode, stopRecording])

  const switchToTyped = useCallback(() => {
    stopTracks()
    recorderRef.current = null
    chunksRef.current = []
    setMode('typed')
    setPhase('ready-typed')
    setError(null)
  }, [stopTracks])

  const onTypedChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (phase !== 'recording') return
      const prev = typedText
      const next = evt.target.value
      const t = performance.now() - startPerfRef.current

      if (next.length > prev.length) {
        const addedChar = next.slice(prev.length)
        for (const c of addedChar) {
          if (c === '\n') keystrokesRef.current.push({ t, char: c, kind: 'enter' })
          else if (c === ' ') keystrokesRef.current.push({ t, char: c, kind: 'space' })
          else keystrokesRef.current.push({ t, char: c, kind: 'char' })
        }
      } else if (next.length < prev.length) {
        const deleted = prev.length - next.length
        for (let i = 0; i < deleted; i += 1) {
          keystrokesRef.current.push({ t, char: '', kind: 'backspace' })
        }
      }
      setTypedText(next)
    },
    [phase, typedText],
  )

  const remainingMs = useMemo(
    () => Math.max(0, VF_TRIAL_DURATION_MS - elapsedMs),
    [elapsedMs],
  )
  const secondsRemaining = Math.ceil(remainingMs / 1000)

  if (phase === 'requesting') {
    return (
      <div className="rounded-md border border-dashed border-zinc-200 px-4 py-6 text-[13px] text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-400">
        Requesting microphone access…
      </div>
    )
  }

  if (phase === 'ready-voice' || phase === 'ready-typed') {
    return (
      <div className="space-y-4">
        {error && (
          <p className="text-[12px] text-red-500 dark:text-red-400">{error}</p>
        )}
        <div className="rounded-md border border-zinc-200 bg-zinc-50/50 px-4 py-5 dark:border-zinc-800/70 dark:bg-zinc-900/30">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
            {mode === 'voice' ? 'Voice · ready' : 'Typed · ready'}
          </p>
          <p className="mt-2 text-[13.5px] text-zinc-600 dark:text-zinc-300">
            {mode === 'voice'
              ? 'When you hit start, the 60-second timer begins. Speak your answers out loud. Audio records until you stop or time runs out.'
              : 'When you hit start, the 60-second timer begins. Type one word per line or separated by spaces.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startRecording}
            className={cn(
              'inline-flex items-center rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2',
              'text-[11px] font-medium uppercase tracking-[0.14em] text-white',
              'transition-colors hover:bg-zinc-800',
              'dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
            )}
          >
            Start {trialLabel} · 60s
          </button>
          {mode === 'voice' && (
            <button
              type="button"
              onClick={switchToTyped}
              className={cn(
                'inline-flex items-center rounded-md border border-zinc-200 px-4 py-2',
                'text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600',
                'transition-colors hover:border-zinc-300 hover:text-zinc-900',
                'dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
              )}
            >
              Type instead
            </button>
          )}
          {mode === 'typed' && (
            <button
              type="button"
              onClick={() => void beginVoiceSetup()}
              className={cn(
                'inline-flex items-center rounded-md border border-zinc-200 px-4 py-2',
                'text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600',
                'transition-colors hover:border-zinc-300 hover:text-zinc-900',
                'dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
              )}
            >
              Try microphone
            </button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'recording') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800/70 dark:bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'inline-block h-2 w-2 rounded-full',
                mode === 'voice' ? 'bg-red-500 animate-pulse' : 'bg-zinc-500',
              )}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              {mode === 'voice' ? 'Recording' : 'Typing'}
            </p>
          </div>
          <p className="font-mono text-[22px] tabular-nums text-zinc-900 dark:text-zinc-100">
            {secondsRemaining}s
          </p>
        </div>

        {mode === 'voice' ? (
          <Waveform levels={waveform} currentLevel={amplitudeLevel} />
        ) : (
          <textarea
            autoFocus
            value={typedText}
            onChange={onTypedChange}
            placeholder={`Type each ${trialLabel.toLowerCase().includes('letter') ? 'word' : 'animal'} and press space or enter…`}
            className={cn(
              'block h-48 w-full resize-none rounded-md border border-zinc-200 bg-background px-4 py-3',
              'font-mono text-[14px] leading-relaxed text-zinc-900',
              'focus:border-zinc-400 focus:outline-none',
              'dark:border-zinc-800/70 dark:text-zinc-100 dark:focus:border-zinc-600',
            )}
          />
        )}

        <div>
          <button
            type="button"
            onClick={() => stopRecording('manual')}
            className={cn(
              'inline-flex items-center rounded-md border border-zinc-200 px-4 py-2',
              'text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600',
              'transition-colors hover:border-zinc-300 hover:text-zinc-900',
              'dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
            )}
          >
            Stop early
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'finalizing') {
    return (
      <div className="rounded-md border border-dashed border-zinc-200 px-4 py-6 text-[13px] text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-400">
        Finalizing recording…
      </div>
    )
  }

  return null
}

function Waveform({ levels, currentLevel }: { levels: number[]; currentLevel: number }) {
  const barCount = 120
  const padded = levels.length >= barCount ? levels.slice(-barCount) : [...new Array(barCount - levels.length).fill(0), ...levels]

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50/50 px-4 py-6 dark:border-zinc-800/70 dark:bg-zinc-900/30">
      <svg
        viewBox="0 0 600 80"
        className="block h-20 w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        {padded.map((level, i) => {
          const h = Math.max(1, level * 70)
          const x = i * 5
          const y = 40 - h / 2
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={3}
              height={h}
              rx={1}
              className="fill-zinc-400 dark:fill-zinc-500"
            />
          )
        })}
      </svg>
      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
        Input level · {Math.round(currentLevel * 100)}%
      </p>
    </div>
  )
}
