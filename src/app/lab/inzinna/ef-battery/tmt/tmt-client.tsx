'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { generateLayout } from './layouts'
import { TmtCanvas } from './tmt-canvas'
import type { TmtPhase, TmtSessionResult, TmtTrialResult } from './types'

function formatSeconds(ms: number) {
  return (ms / 1000).toFixed(1)
}

function formatPath(units: number) {
  return Math.round(units).toLocaleString()
}

function newSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `tmt-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

function newSeed() {
  return Math.floor(Math.random() * 2 ** 31)
}

export function TmtClient() {
  const [phase, setPhase] = useState<TmtPhase>('intro-a')
  const [trialA, setTrialA] = useState<TmtTrialResult | null>(null)
  const [trialB, setTrialB] = useState<TmtTrialResult | null>(null)

  const sessionIdRef = useRef<string>(newSessionId())
  const sessionStartRef = useRef<number>(0)
  const seedsRef = useRef<{ a: number; b: number }>({ a: newSeed(), b: newSeed() })

  const layoutA = useMemo(
    () => generateLayout('A', seedsRef.current.a),
    // Layouts are deterministic per seed; seeds are fixed for the session.
    [],
  )
  const layoutB = useMemo(
    () => generateLayout('B', seedsRef.current.b),
    [],
  )

  const startTrialA = useCallback(() => {
    sessionStartRef.current = Date.now()
    setPhase('running-a')
  }, [])

  const startTrialB = useCallback(() => {
    setPhase('running-b')
  }, [])

  const handleTrialAComplete = useCallback((result: TmtTrialResult) => {
    setTrialA(result)
    setPhase('intro-b')
  }, [])

  const handleTrialBComplete = useCallback((result: TmtTrialResult) => {
    setTrialB(result)
    setPhase('results')
  }, [])

  const restart = useCallback(() => {
    sessionIdRef.current = newSessionId()
    seedsRef.current = { a: newSeed(), b: newSeed() }
    setTrialA(null)
    setTrialB(null)
    setPhase('intro-a')
  }, [])

  const downloadResults = useCallback(() => {
    if (!trialA || !trialB) return
    const payload: TmtSessionResult = {
      sessionId: sessionIdRef.current,
      startedAt: sessionStartRef.current,
      completedAt: Date.now(),
      a: trialA,
      b: trialB,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `tmt-${sessionIdRef.current}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }, [trialA, trialB])

  return (
    <div className="space-y-8">
      {phase === 'intro-a' && (
        <IntroPanel
          trial="A"
          onStart={startTrialA}
          instructions={
            <>
              <p>
                You will see <span className="font-medium text-zinc-900 dark:text-zinc-100">25 circles</span>{' '}
                numbered 1 through 25, scattered across the screen.
              </p>
              <p>
                Click the circles in order: <span className="font-mono">1</span> →{' '}
                <span className="font-mono">2</span> → <span className="font-mono">3</span> → … →{' '}
                <span className="font-mono">25</span>, as quickly and accurately as you can.
              </p>
              <p>If you click the wrong circle, it will flash red. Keep going from where you left off.</p>
            </>
          }
        />
      )}

      {phase === 'running-a' && (
        <RunningPanel trial="A" nextCount={layoutA.length}>
          <TmtCanvas
            trial="A"
            seed={seedsRef.current.a}
            nodes={layoutA}
            onComplete={handleTrialAComplete}
          />
        </RunningPanel>
      )}

      {phase === 'intro-b' && trialA && (
        <IntroPanel
          trial="B"
          onStart={startTrialB}
          showPrev={{ label: 'Trial A time', value: `${formatSeconds(trialA.durationMs)}s`, errors: trialA.errors }}
          instructions={
            <>
              <p>
                This time you will see numbers <span className="font-mono">1–13</span> and letters{' '}
                <span className="font-mono">A–L</span>.
              </p>
              <p>
                Alternate between them in order:{' '}
                <span className="font-mono">1 → A → 2 → B → 3 → C → …</span> ending on{' '}
                <span className="font-mono">13</span>.
              </p>
              <p>Go as quickly and accurately as you can.</p>
            </>
          }
        />
      )}

      {phase === 'running-b' && (
        <RunningPanel trial="B" nextCount={layoutB.length}>
          <TmtCanvas
            trial="B"
            seed={seedsRef.current.b}
            nodes={layoutB}
            onComplete={handleTrialBComplete}
          />
        </RunningPanel>
      )}

      {phase === 'results' && trialA && trialB && (
        <ResultsPanel
          trialA={trialA}
          trialB={trialB}
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
  instructions,
  onStart,
  showPrev,
}: {
  trial: 'A' | 'B'
  instructions: React.ReactNode
  onStart: () => void
  showPrev?: { label: string; value: string; errors: number }
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Trial {trial}
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {trial === 'A' ? 'Numbers in order' : 'Switch between numbers and letters'}
        </h2>
      </div>

      {showPrev && (
        <div className="flex items-center gap-6 rounded-md border border-zinc-200 dark:border-zinc-800/70 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              {showPrev.label}
            </p>
            <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{showPrev.value}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Errors
            </p>
            <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{showPrev.errors}</p>
          </div>
        </div>
      )}

      <div className="space-y-3 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        {instructions}
      </div>

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
        Start trial {trial}
      </button>
    </section>
  )
}

function RunningPanel({
  trial,
  nextCount,
  children,
}: {
  trial: 'A' | 'B'
  nextCount: number
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Trial {trial} · {nextCount} targets
        </p>
      </div>
      {children}
      <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
        Pointer movement is being recorded for kinematic analysis.
      </p>
    </section>
  )
}

function ResultsPanel({
  trialA,
  trialB,
  sessionId,
  onDownload,
  onRestart,
}: {
  trialA: TmtTrialResult
  trialB: TmtTrialResult
  sessionId: string
  onDownload: () => void
  onRestart: () => void
}) {
  const bMinusA = trialB.durationMs - trialA.durationMs
  const ratio = trialA.durationMs > 0 ? trialB.durationMs / trialA.durationMs : 0

  return (
    <section className="space-y-8">
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
        <Metric label="Trial A time" value={`${formatSeconds(trialA.durationMs)}s`} />
        <Metric label="Trial B time" value={`${formatSeconds(trialB.durationMs)}s`} />
        <Metric label="A errors" value={String(trialA.errors)} />
        <Metric label="B errors" value={String(trialB.errors)} />
        <Metric
          label="B − A"
          value={`${bMinusA >= 0 ? '+' : ''}${formatSeconds(bMinusA)}s`}
          hint="EF switching cost"
        />
        <Metric
          label="B / A ratio"
          value={ratio.toFixed(2)}
          hint="Higher = more switching cost"
        />
        <Metric
          label="Path A"
          value={formatPath(trialA.pathLength)}
          hint="SVG units traveled"
        />
        <Metric
          label="Path B"
          value={formatPath(trialB.pathLength)}
          hint="SVG units traveled"
        />
      </div>

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
