'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { buildBatteryPuzzles } from './scorer'
import { TowerBoard } from './tower-board'
import type {
  TowerPhase,
  TowerPuzzleResult,
  TowerPuzzleSpec,
  TowerSessionResult,
} from './types'

function formatSeconds(ms: number) {
  return (ms / 1000).toFixed(1)
}

function newSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `tower-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

export function TowerClient() {
  const [phase, setPhase] = useState<TowerPhase>('intro')
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [results, setResults] = useState<TowerPuzzleResult[]>([])

  const sessionIdRef = useRef<string>(newSessionId())
  const sessionStartRef = useRef<number>(0)

  const puzzles = useMemo(() => buildBatteryPuzzles(), [])

  const startSession = useCallback(() => {
    sessionStartRef.current = Date.now()
    setPhase('running')
  }, [])

  const handlePuzzleComplete = useCallback(
    (result: TowerPuzzleResult) => {
      setResults((prev) => {
        const next = [...prev, result]
        if (next.length >= puzzles.length) {
          setPhase('results')
        } else {
          setPhase('between')
        }
        return next
      })
    },
    [puzzles.length],
  )

  const startNextPuzzle = useCallback(() => {
    setPuzzleIndex((i) => i + 1)
    setPhase('running')
  }, [])

  const restart = useCallback(() => {
    sessionIdRef.current = newSessionId()
    sessionStartRef.current = 0
    setResults([])
    setPuzzleIndex(0)
    setPhase('intro')
  }, [])

  const downloadResults = useCallback(() => {
    if (results.length === 0) return
    const payload: TowerSessionResult = {
      sessionId: sessionIdRef.current,
      startedAt: sessionStartRef.current,
      completedAt: Date.now(),
      puzzles: results,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `tower-${sessionIdRef.current}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }, [results])

  const currentPuzzle = puzzles[puzzleIndex]
  const lastResult = results[results.length - 1] ?? null

  return (
    <div className="space-y-8">
      {phase === 'intro' && <IntroPanel puzzles={puzzles} onStart={startSession} />}

      {phase === 'running' && currentPuzzle && (
        <RunningPanel puzzle={currentPuzzle} total={puzzles.length} index={puzzleIndex}>
          <TowerBoard
            key={currentPuzzle.id}
            puzzle={currentPuzzle}
            onComplete={handlePuzzleComplete}
          />
        </RunningPanel>
      )}

      {phase === 'between' && lastResult && (
        <BetweenPanel
          lastResult={lastResult}
          nextIndex={puzzleIndex + 1}
          nextPuzzle={puzzles[puzzleIndex + 1]}
          total={puzzles.length}
          onNext={startNextPuzzle}
        />
      )}

      {phase === 'results' && results.length > 0 && (
        <ResultsPanel
          results={results}
          sessionId={sessionIdRef.current}
          onDownload={downloadResults}
          onRestart={restart}
        />
      )}
    </div>
  )
}

function IntroPanel({
  puzzles,
  onStart,
}: {
  puzzles: TowerPuzzleSpec[]
  onStart: () => void
}) {
  const discCounts = puzzles.map((p) => p.discCount).join(', ')
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Five puzzles
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Move the discs to the right peg
        </h2>
      </div>

      <div className="space-y-3 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        <p>
          Each puzzle starts with a stack of discs on the{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">left peg</span>. Your goal
          is to rebuild the same stack on the{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">right peg</span>.
        </p>
        <p>
          Two rules. Move{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">one disc at a time</span>,
          always the top disc of a peg. Never place a{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">larger disc on a smaller one</span>.
        </p>
        <p>
          Drag discs with your mouse or finger. Illegal drops flash red and return. Try to use the
          fewest moves you can.
        </p>
        <p className="font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
          Disc counts: {discCounts}
        </p>
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
        Start puzzle 1
      </button>
    </section>
  )
}

function RunningPanel({
  puzzle,
  total,
  index,
  children,
}: {
  puzzle: TowerPuzzleSpec
  total: number
  index: number
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Puzzle {index + 1} of {total} · {puzzle.discCount} discs
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Optimal {puzzle.optimalMoves} moves
        </p>
      </div>
      {children}
      <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
        Pointer movement is being recorded for kinematic analysis.
      </p>
    </section>
  )
}

function BetweenPanel({
  lastResult,
  nextIndex,
  nextPuzzle,
  total,
  onNext,
}: {
  lastResult: TowerPuzzleResult
  nextIndex: number
  nextPuzzle: TowerPuzzleSpec | undefined
  total: number
  onNext: () => void
}) {
  const excess = lastResult.excessMoves
  const firstMoveMs = lastResult.firstMoveLatencyMs
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Puzzle complete
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {lastResult.solved ? 'Solved' : 'Skipped'} — {lastResult.discCount} discs
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-0 border-y border-zinc-200 dark:border-zinc-800/70">
        <Metric label="Time" value={`${formatSeconds(lastResult.durationMs)}s`} />
        <Metric
          label="First move"
          value={firstMoveMs === null ? '—' : `${formatSeconds(firstMoveMs)}s`}
          hint="Planning latency"
        />
        <Metric
          label="Valid moves"
          value={`${lastResult.validMoves} / ${lastResult.optimalMoves}`}
          hint="Of optimal"
        />
        <Metric
          label="Excess"
          value={excess.toString()}
          hint={excess === 0 ? 'Optimal path' : 'Moves past shortest path'}
        />
        <Metric
          label="Violations"
          value={lastResult.violations.toString()}
          hint="Larger-on-smaller attempts"
        />
        <Metric
          label="Drags"
          value={lastResult.drags.length.toString()}
          hint="Includes cancels"
        />
      </div>

      {nextPuzzle && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onNext}
            className={cn(
              'inline-flex items-center rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2',
              'text-[11px] font-medium uppercase tracking-[0.14em] text-white',
              'transition-colors hover:bg-zinc-800',
              'dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
            )}
          >
            Start puzzle {nextIndex + 1}
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            {nextPuzzle.discCount} discs · {total - nextIndex} left
          </p>
        </div>
      )}
    </section>
  )
}

function ResultsPanel({
  results,
  sessionId,
  onDownload,
  onRestart,
}: {
  results: TowerPuzzleResult[]
  sessionId: string
  onDownload: () => void
  onRestart: () => void
}) {
  const totalTime = results.reduce((acc, r) => acc + r.durationMs, 0)
  const totalValidMoves = results.reduce((acc, r) => acc + r.validMoves, 0)
  const totalOptimal = results.reduce((acc, r) => acc + r.optimalMoves, 0)
  const totalExcess = results.reduce((acc, r) => acc + r.excessMoves, 0)
  const totalViolations = results.reduce((acc, r) => acc + r.violations, 0)
  const solved = results.filter((r) => r.solved).length
  const firstMoveSamples = results
    .map((r) => r.firstMoveLatencyMs)
    .filter((v): v is number => v !== null)
  const avgFirstMove =
    firstMoveSamples.length === 0
      ? null
      : firstMoveSamples.reduce((a, b) => a + b, 0) / firstMoveSamples.length

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
        <Metric
          label="Puzzles solved"
          value={`${solved} / ${results.length}`}
          hint="Not skipped"
        />
        <Metric label="Total time" value={`${formatSeconds(totalTime)}s`} />
        <Metric
          label="Valid moves"
          value={`${totalValidMoves} / ${totalOptimal}`}
          hint="Of optimal total"
        />
        <Metric
          label="Total excess"
          value={totalExcess.toString()}
          hint="Past shortest path"
        />
        <Metric
          label="Total violations"
          value={totalViolations.toString()}
          hint="Rule breaks"
        />
        <Metric
          label="Avg first move"
          value={avgFirstMove === null ? '—' : `${formatSeconds(avgFirstMove)}s`}
          hint="Planning latency"
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          Per-puzzle
        </p>
        <div className="border-y border-zinc-200 dark:border-zinc-800/70">
          {results.map((r, i) => (
            <div
              key={r.puzzleId}
              className="flex items-center justify-between border-b border-dashed border-zinc-100 px-1 py-3 last:border-b-0 dark:border-zinc-900"
            >
              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                {String(i + 1).padStart(2, '0')} · {r.discCount} discs
              </span>
              <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-200">
                {r.solved ? 'solved' : 'skipped'} · {formatSeconds(r.durationMs)}s ·{' '}
                {r.validMoves}/{r.optimalMoves} moves · {r.excessMoves} excess ·{' '}
                {r.violations} viol.
              </span>
            </div>
          ))}
        </div>
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
