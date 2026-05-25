'use client'

import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { VF_STIMULI } from './prompts'
import { VfRecorder } from './recorder'
import { scoreFromTyped, scoreFromWhisper, summarize } from './scorer'
import type {
  VfPhase,
  VfRecordingPayload,
  VfScoredWord,
  VfSessionResult,
  VfTrial,
  VfTrialResult,
} from './types'

function formatSeconds(ms: number) {
  return (ms / 1000).toFixed(1)
}

function newSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `vf-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

async function transcribe(
  blob: Blob,
  trial: VfTrial,
  prompt: string,
  sessionId: string,
): Promise<{ words: Array<{ word: string; start: number; end: number }>; fullText: string }> {
  const fd = new FormData()
  fd.append('audio', blob, 'fluency.webm')
  fd.append('trial', trial)
  fd.append('prompt', prompt)
  fd.append('sessionId', sessionId)
  const res = await fetch('/api/ef-battery/transcribe-fluency', {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `Transcription failed (${res.status})`)
  }
  return res.json()
}

export function VerbalFluencyClient() {
  const [phase, setPhase] = useState<VfPhase>('intro-letter')
  const [trialLetter, setTrialLetter] = useState<VfTrialResult | null>(null)
  const [trialCategory, setTrialCategory] = useState<VfTrialResult | null>(null)
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null)

  const pendingLetterRef = useRef<VfRecordingPayload | null>(null)
  const pendingCategoryRef = useRef<VfRecordingPayload | null>(null)
  const sessionIdRef = useRef<string>(newSessionId())
  const sessionStartRef = useRef<number>(0)

  const buildResult = useCallback(
    async (
      trial: VfTrial,
      payload: VfRecordingPayload,
    ): Promise<VfTrialResult> => {
      const stim = VF_STIMULI[trial]
      if (payload.input === 'voice' && payload.audio?.blob) {
        const { words, fullText } = await transcribe(
          payload.audio.blob,
          trial,
          stim.prompt,
          sessionIdRef.current,
        )
        const scored = scoreFromWhisper(words, trial, stim.prompt)
        const summary = summarize(scored)
        return {
          trial,
          prompt: stim.prompt,
          input: 'voice',
          startedAt: payload.startedAt,
          completedAt: payload.completedAt,
          durationMs: payload.durationMs,
          audio: { mimeType: payload.audio.mimeType, base64: payload.audio.base64 },
          amplitude: payload.amplitude,
          whisperWords: words,
          transcript: fullText,
          words: scored,
          ...summary,
        }
      }
      const typedText = payload.typedText ?? ''
      const scored = scoreFromTyped(
        { text: typedText, keystrokes: payload.keystrokes ?? [] },
        trial,
        stim.prompt,
      )
      const summary = summarize(scored)
      return {
        trial,
        prompt: stim.prompt,
        input: 'typed',
        startedAt: payload.startedAt,
        completedAt: payload.completedAt,
        durationMs: payload.durationMs,
        keystrokes: payload.keystrokes,
        transcript: typedText,
        words: scored,
        ...summary,
      }
    },
    [],
  )

  const handleLetterRecorded = useCallback(
    async (payload: VfRecordingPayload) => {
      pendingLetterRef.current = payload
      sessionStartRef.current = payload.startedAt
      // Score typed immediately; defer voice transcription to after category trial finishes
      // so user isn't blocked on network.
      setPhase('intro-category')
    },
    [],
  )

  const handleCategoryRecorded = useCallback(
    async (payload: VfRecordingPayload) => {
      pendingCategoryRef.current = payload
      setPhase('transcribing')
      setTranscriptionError(null)

      const letterPayload = pendingLetterRef.current
      if (!letterPayload) {
        setTranscriptionError('Missing letter-trial data.')
        return
      }

      try {
        const [letterResult, categoryResult] = await Promise.all([
          buildResult('letter', letterPayload),
          buildResult('category', payload),
        ])
        setTrialLetter(letterResult)
        setTrialCategory(categoryResult)
        setPhase('results')
      } catch (err: any) {
        console.error('[vf] transcription/scoring failed', err)
        setTranscriptionError(err?.message ?? 'Transcription failed. Try again.')
      }
    },
    [buildResult],
  )

  const startLetter = useCallback(() => setPhase('running-letter'), [])
  const startCategory = useCallback(() => setPhase('running-category'), [])

  const retryTranscribe = useCallback(async () => {
    const letterPayload = pendingLetterRef.current
    const categoryPayload = pendingCategoryRef.current
    if (!letterPayload || !categoryPayload) return
    setTranscriptionError(null)
    setPhase('transcribing')
    try {
      const [letterResult, categoryResult] = await Promise.all([
        buildResult('letter', letterPayload),
        buildResult('category', categoryPayload),
      ])
      setTrialLetter(letterResult)
      setTrialCategory(categoryResult)
      setPhase('results')
    } catch (err: any) {
      setTranscriptionError(err?.message ?? 'Transcription failed. Try again.')
    }
  }, [buildResult])

  const restart = useCallback(() => {
    sessionIdRef.current = newSessionId()
    sessionStartRef.current = 0
    pendingLetterRef.current = null
    pendingCategoryRef.current = null
    setTrialLetter(null)
    setTrialCategory(null)
    setTranscriptionError(null)
    setPhase('intro-letter')
  }, [])

  const downloadResults = useCallback(() => {
    if (!trialLetter || !trialCategory) return
    const payload: VfSessionResult = {
      sessionId: sessionIdRef.current,
      startedAt: sessionStartRef.current || trialLetter.startedAt,
      completedAt: Date.now(),
      letter: trialLetter,
      category: trialCategory,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `verbal-fluency-${sessionIdRef.current}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }, [trialLetter, trialCategory])

  return (
    <div className="space-y-8">
      {phase === 'intro-letter' && (
        <IntroPanel
          trial="letter"
          onStart={startLetter}
        />
      )}

      {phase === 'running-letter' && (
        <RunningPanel trialLabel={VF_STIMULI.letter.promptLabel}>
          <VfRecorder trialLabel="letter trial" onComplete={handleLetterRecorded} />
        </RunningPanel>
      )}

      {phase === 'intro-category' && (
        <IntroPanel
          trial="category"
          onStart={startCategory}
          letterPrev={pendingLetterRef.current}
        />
      )}

      {phase === 'running-category' && (
        <RunningPanel trialLabel={VF_STIMULI.category.promptLabel}>
          <VfRecorder trialLabel="category trial" onComplete={handleCategoryRecorded} />
        </RunningPanel>
      )}

      {phase === 'transcribing' && (
        <TranscribingPanel error={transcriptionError} onRetry={retryTranscribe} onRestart={restart} />
      )}

      {phase === 'results' && trialLetter && trialCategory && (
        <ResultsPanel
          trialLetter={trialLetter}
          trialCategory={trialCategory}
          sessionId={sessionIdRef.current}
          onDownload={downloadResults}
          onRestart={restart}
        />
      )}
    </div>
  )
}

function IntroPanel({
  trial,
  onStart,
  letterPrev,
}: {
  trial: VfTrial
  onStart: () => void
  letterPrev?: VfRecordingPayload | null
}) {
  const stim = VF_STIMULI[trial]
  const trialNumber = trial === 'letter' ? '1 of 2' : '2 of 2'

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Trial {trialNumber}
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {stim.headline}
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          Prompt · {stim.promptLabel}
        </p>
      </div>

      {letterPrev && (
        <div className="flex flex-wrap items-center gap-6 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800/70">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Letter trial recorded
            </p>
            <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {formatSeconds(letterPrev.durationMs)}s ·{' '}
              {letterPrev.input === 'voice' ? 'voice captured' : 'typed'}
            </p>
          </div>
        </div>
      )}

      <ul className="space-y-2 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        {stim.rules.map((rule) => (
          <li key={rule} className="flex gap-3">
            <span
              aria-hidden
              className="mt-[8px] inline-block h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-600"
            />
            <span>{rule}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStart}
        className={cn(
          'inline-flex items-center rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2',
          'text-[11px] font-medium uppercase tracking-[0.14em] text-white',
          'transition-colors hover:bg-zinc-800',
          'dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
        )}
      >
        Begin trial
      </button>
    </section>
  )
}

function RunningPanel({
  trialLabel,
  children,
}: {
  trialLabel: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Running · {trialLabel}
        </p>
      </div>
      {children}
      <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
        Amplitude is sampled for pause-and-burst analysis. Audio is discarded after transcription.
      </p>
    </section>
  )
}

function TranscribingPanel({
  error,
  onRetry,
  onRestart,
}: {
  error: string | null
  onRetry: () => void
  onRestart: () => void
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Session
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {error ? 'Transcription failed' : 'Transcribing audio…'}
        </h2>
      </div>

      {!error && (
        <div className="rounded-md border border-dashed border-zinc-200 px-4 py-6 dark:border-zinc-800/70">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Sending both trials to Whisper in parallel…
          </p>
          <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400">
            Usually takes 10–20 seconds per minute of audio.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50/40 px-4 py-4 dark:border-red-900/60 dark:bg-red-950/20">
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              'inline-flex items-center rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2',
              'text-[11px] font-medium uppercase tracking-[0.14em] text-white',
              'transition-colors hover:bg-zinc-800',
              'dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
            )}
          >
            Retry transcription
          </button>
          <button
            type="button"
            onClick={onRestart}
            className={cn(
              'inline-flex items-center rounded-md border border-zinc-200 px-4 py-2',
              'text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600',
              'transition-colors hover:border-zinc-300 hover:text-zinc-900',
              'dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
            )}
          >
            New session
          </button>
        </div>
      )}
    </section>
  )
}

function ResultsPanel({
  trialLetter,
  trialCategory,
  sessionId,
  onDownload,
  onRestart,
}: {
  trialLetter: VfTrialResult
  trialCategory: VfTrialResult
  sessionId: string
  onDownload: () => void
  onRestart: () => void
}) {
  return (
    <section className="space-y-10">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Session complete
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Raw results</h2>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
          Pilot data only. No norms applied. Interpret with caution.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-0 border-y border-zinc-200 dark:border-zinc-800/70">
        <Metric label="Letter · valid" value={String(trialLetter.totalValid)} hint={trialLetter.prompt} />
        <Metric label="Category · valid" value={String(trialCategory.totalValid)} hint={trialCategory.prompt} />
        <Metric label="Letter · repetitions" value={String(trialLetter.repetitions)} />
        <Metric label="Category · repetitions" value={String(trialCategory.repetitions)} />
        <Metric label="Letter · intrusions" value={String(trialLetter.intrusions)} />
        <Metric label="Category · intrusions" value={String(trialCategory.intrusions)} />
        <Metric
          label="Letter duration"
          value={`${formatSeconds(trialLetter.durationMs)}s`}
          hint={trialLetter.input === 'voice' ? 'voice' : 'typed'}
        />
        <Metric
          label="Category duration"
          value={`${formatSeconds(trialCategory.durationMs)}s`}
          hint={trialCategory.input === 'voice' ? 'voice' : 'typed'}
        />
      </div>

      <TranscriptBlock label="Letter trial · M" words={trialLetter.words} transcript={trialLetter.transcript} />
      <TranscriptBlock label="Category trial · Animals" words={trialCategory.words} transcript={trialCategory.transcript} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onDownload}
          className={cn(
            'inline-flex items-center rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2',
            'text-[11px] font-medium uppercase tracking-[0.14em] text-white',
            'transition-colors hover:bg-zinc-800',
            'dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
          )}
        >
          Download raw JSON
        </button>
        <button
          type="button"
          onClick={onRestart}
          className={cn(
            'inline-flex items-center rounded-md border border-zinc-200 px-4 py-2',
            'text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600',
            'transition-colors hover:border-zinc-300 hover:text-zinc-900',
            'dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
          )}
        >
          New session
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          {sessionId.slice(0, 8)}
        </p>
      </div>
    </section>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-dashed border-zinc-100 px-4 py-4 last:border-b-0 dark:border-zinc-900 [&:nth-last-child(-n+2)]:border-b-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="font-mono text-lg text-zinc-900 dark:text-zinc-100">{value}</p>
      {hint && <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  )
}

function TranscriptBlock({
  label,
  words,
  transcript,
}: {
  label: string
  words: VfScoredWord[]
  transcript: string
}) {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      {transcript.trim().length === 0 ? (
        <p className="text-[13px] text-zinc-400 dark:text-zinc-500">No response captured.</p>
      ) : (
        <div className="flex flex-wrap gap-x-2 gap-y-1.5">
          {words.map((w, i) => (
            <span
              key={`${w.raw}-${i}`}
              title={
                w.valid
                  ? `valid · ${w.tMs !== null ? `${(w.tMs / 1000).toFixed(1)}s` : '—'}`
                  : w.repetition
                    ? 'repetition'
                    : `intrusion · ${w.intrusionReason ?? ''}`
              }
              className={cn(
                'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[12px]',
                w.valid && 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-100',
                w.repetition && 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                w.intrusion && 'bg-red-50 text-red-700 line-through decoration-red-400/60 dark:bg-red-950/30 dark:text-red-300',
              )}
            >
              {w.raw}
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        Gray = valid · amber = repetition · red strike = intrusion
      </p>
    </div>
  )
}
