'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DigitPad } from './digit-pad'
import { expectedResponse, generateDigitSequence } from './sequences'
import { canSpeak, speakSequence } from './speech'
import type {
  DigitSpanCondition,
  DigitSpanKeystroke,
  DigitSpanTrialResult,
} from './types'

interface DigitSpanTrialProps {
  condition: DigitSpanCondition
  spanLength: number
  trialIndexAtLength: 1 | 2
  seed: number
  onComplete: (result: DigitSpanTrialResult) => void
}

type TrialPhase = 'playing' | 'responding'

export function DigitSpanTrial({
  condition,
  spanLength,
  trialIndexAtLength,
  seed,
  onComplete,
}: DigitSpanTrialProps) {
  const [phase, setPhase] = useState<TrialPhase>('playing')
  const [response, setResponse] = useState<number[]>([])
  const [audioError, setAudioError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const padRef = useRef<HTMLDivElement | null>(null)

  const sequenceRef = useRef<number[]>(generateDigitSequence(spanLength, seed))
  const keystrokesRef = useRef<DigitSpanKeystroke[]>([])

  const audioStartedPerfRef = useRef(0)
  const audioStartedWallRef = useRef(0)
  const audioEndedPerfRef = useRef(0)
  const firstKeyPerfRef = useRef<number | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    // Guard against React StrictMode double-invoke. A cancel+speak collision
    // from the first cleanup running before the second mount wedges Chrome's
    // TTS queue and audio never plays.
    if (startedRef.current) return
    startedRef.current = true

    audioStartedPerfRef.current = performance.now()
    audioStartedWallRef.current = Date.now()

    if (!canSpeak()) {
      audioEndedPerfRef.current = audioStartedPerfRef.current
      setPhase('responding')
      return
    }

    const cancel = speakSequence({
      digits: sequenceRef.current,
      digitDurationMs: 1000,
      onDone: () => {
        audioEndedPerfRef.current = performance.now()
        setPhase('responding')
      },
      onError: (err) => {
        audioEndedPerfRef.current = performance.now()
        setAudioError(err)
        setPhase('responding')
      },
    })

    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    return cancel
  }, [])

  useEffect(() => {
    if (phase === 'responding') {
      padRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [phase])

  const handleDigit = useCallback(
    (digit: number, source: 'keyboard' | 'pad') => {
      if (phase !== 'responding') return
      const t = performance.now() - audioEndedPerfRef.current
      if (firstKeyPerfRef.current === null) {
        firstKeyPerfRef.current = performance.now()
      }
      keystrokesRef.current.push({ t, digit, source })
      setResponse((prev) => [...prev, digit])
    },
    [phase],
  )

  const handleBackspace = useCallback(() => {
    if (phase !== 'responding') return
    setResponse((prev) => prev.slice(0, -1))
  }, [phase])

  const handleSubmit = useCallback(() => {
    if (phase !== 'responding') return
    if (response.length === 0) return

    const submitPerf = performance.now()
    const expected = expectedResponse(sequenceRef.current, condition)
    const correct =
      response.length === expected.length &&
      response.every((d, i) => d === expected[i])

    const firstKeyLatencyMs =
      firstKeyPerfRef.current !== null
        ? firstKeyPerfRef.current - audioEndedPerfRef.current
        : null

    const perfToWall = (perf: number) =>
      audioStartedWallRef.current + (perf - audioStartedPerfRef.current)

    onComplete({
      condition,
      spanLength,
      trialIndexAtLength,
      sequence: sequenceRef.current,
      expectedResponse: expected,
      response,
      keystrokes: keystrokesRef.current.slice(),
      audioStartedAt: audioStartedWallRef.current,
      audioEndedAt: perfToWall(audioEndedPerfRef.current),
      responseCompletedAt: perfToWall(submitPerf),
      firstKeyLatencyMs,
      totalResponseMs: submitPerf - audioEndedPerfRef.current,
      correct,
    })
  }, [condition, onComplete, phase, response, spanLength, trialIndexAtLength])

  return (
    <div ref={containerRef} className="space-y-6 scroll-mt-8">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          {condition === 'forward' ? 'Forward' : 'Backward'} · Span {spanLength}{' '}
          · Trial {trialIndexAtLength} of 2
        </p>
      </div>

      {phase === 'playing' ? (
        <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Listening...
            </p>
          </div>
        </div>
      ) : (
        <div ref={padRef} className="space-y-4 scroll-mt-8">
          {audioError && (
            <div className="rounded-md border border-dashed border-amber-400/60 bg-amber-50 px-4 py-3 text-center text-[12px] leading-relaxed text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
              Audio failed ({audioError}). Sequence was:{' '}
              <span className="font-mono font-semibold">
                {sequenceRef.current.join(' ')}
              </span>
            </div>
          )}
          <DigitPad
            value={response}
            maxLength={spanLength}
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            onSubmit={handleSubmit}
          />
          {condition === 'backward' && (
            <p className="text-center text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Type them in <span className="font-medium text-zinc-900 dark:text-zinc-100">reverse</span> order.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
