'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { ColorWordFixation, ColorWordTrial } from './color-word-trial'
import { deriveConditionSeed, generateStimuli } from './stimuli'
import {
  CW_ITI_MS,
  CW_TIMEOUT_MS,
  type CwCondition,
  type CwConditionResult,
  type CwPhase,
  type CwSessionResult,
  type CwTrialResult,
} from './types'

const CONDITION_ORDER: CwCondition[] = [
  'c1-color',
  'c2-word',
  'c3-inhibit',
  'c4-switch',
]

const CONDITION_LABEL: Record<CwCondition, string> = {
  'c1-color': 'Color naming',
  'c2-word': 'Word reading',
  'c3-inhibit': 'Inhibition',
  'c4-switch': 'Inhibition with switching',
}

const CONDITION_INTRO: Record<
  CwCondition,
  { label: string; title: string; body: string[]; buttonLabel: string }
> = {
  'c1-color': {
    label: 'Condition 1 of 4 · Color naming',
    title: 'Pick the color of the square',
    body: [
      'A solid colored square will appear. Pick the matching color button.',
      'Use the 3 buttons or press 1, 2, 3 on the keyboard.',
      'Three practice trials first with feedback. Then 30 for real.',
    ],
    buttonLabel: 'Start condition 1',
  },
  'c2-word': {
    label: 'Condition 2 of 4 · Word reading',
    title: 'Pick the word',
    body: [
      'A color word will appear in neutral ink. Pick the matching color button.',
      'Read the word. Ignore that it is dark-colored.',
      'Three practice trials, then 30 scored trials.',
    ],
    buttonLabel: 'Start condition 2',
  },
  'c3-inhibit': {
    label: 'Condition 3 of 4 · Inhibition',
    title: 'Pick the INK color, not the word',
    body: [
      'A color word will appear printed in a different-colored ink.',
      'Pick the color of the ink. Ignore what the word says.',
      'Three practice trials, then 30 scored trials.',
    ],
    buttonLabel: 'Start condition 3',
  },
  'c4-switch': {
    label: 'Condition 4 of 4 · Inhibition with switching',
    title: 'Switch between ink and word',
    body: [
      'Same mismatched words as before. But this time some are boxed.',
      'Boxed word: pick the word itself. Unboxed word: pick the ink color.',
      'Three practice trials, then 30 scored trials.',
    ],
    buttonLabel: 'Start condition 4',
  },
}

function makeSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `cw-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
}

function makeSessionSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1)
}

function formatSignedSeconds(ms: number): string {
  const sign = ms >= 0 ? '+' : ''
  return `${sign}${(ms / 1000).toFixed(1)}s`
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null
  const sorted = nums.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function aggregateCondition(
  condition: CwCondition,
  seed: number,
  trials: CwTrialResult[],
  startedAt: number,
  completedAt: number,
): CwConditionResult {
  const scoredTrials = trials.filter((t) => !t.stimulus.isPractice)
  const errors = scoredTrials.filter((t) => !t.correct).length
  const accuracy =
    scoredTrials.length > 0
      ? scoredTrials.filter((t) => t.correct).length / scoredTrials.length
      : 0

  const correctRts = scoredTrials
    .filter((t) => t.correct && t.rtMs !== null)
    .map((t) => t.rtMs as number)
  const medianRtMs = median(correctRts)

  const scoredResponseTimeMs = scoredTrials.reduce(
    (sum, t) => sum + (t.rtMs ?? CW_TIMEOUT_MS),
    0,
  )

  return {
    condition,
    seed,
    trials,
    scoredTrials,
    totalTimeMs: completedAt - startedAt,
    scoredResponseTimeMs,
    errors,
    medianRtMs,
    accuracy,
    startedAt,
    completedAt,
  }
}

export function ColorWordClient() {
  const [phase, setPhase] = useState<CwPhase>('intro-c1')
  const sessionIdRef = useRef<string>(makeSessionId())
  const sessionSeedRef = useRef<number>(makeSessionSeed())
  const sessionStartRef = useRef<number>(Date.now())

  const [conditionResults, setConditionResults] = useState<
    Partial<Record<CwCondition, CwConditionResult>>
  >({})

  const restart = useCallback(() => {
    sessionIdRef.current = makeSessionId()
    sessionSeedRef.current = makeSessionSeed()
    sessionStartRef.current = Date.now()
    setConditionResults({})
    setPhase('intro-c1')
  }, [])

  const handleConditionComplete = useCallback(
    (condition: CwCondition, result: CwConditionResult) => {
      setConditionResults((prev) => ({ ...prev, [condition]: result }))
      const nextIndex = CONDITION_ORDER.indexOf(condition) + 1
      if (nextIndex >= CONDITION_ORDER.length) {
        setPhase('results')
      } else {
        const next = CONDITION_ORDER[nextIndex]
        setPhase(`intro-${next.slice(0, 2)}` as CwPhase)
      }
    },
    [],
  )

  const downloadResults = useCallback(() => {
    const c1 = conditionResults['c1-color']
    const c2 = conditionResults['c2-word']
    const c3 = conditionResults['c3-inhibit']
    const c4 = conditionResults['c4-switch']
    if (!c1 || !c2 || !c3 || !c4) return

    const payload: CwSessionResult = {
      sessionId: sessionIdRef.current,
      sessionSeed: sessionSeedRef.current,
      startedAt: sessionStartRef.current,
      completedAt: Date.now(),
      c1,
      c2,
      c3,
      c4,
      interferenceMs: c3.scoredResponseTimeMs - c1.scoredResponseTimeMs,
      switchingCostMs: c4.scoredResponseTimeMs - c3.scoredResponseTimeMs,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `color-word-${sessionIdRef.current}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [conditionResults])

  const runningCondition: CwCondition | null = useMemo(() => {
    if (phase === 'running-c1') return 'c1-color'
    if (phase === 'running-c2') return 'c2-word'
    if (phase === 'running-c3') return 'c3-inhibit'
    if (phase === 'running-c4') return 'c4-switch'
    return null
  }, [phase])

  return (
    <div className="space-y-8">
      {phase === 'intro-c1' && (
        <IntroPanel
          intro={CONDITION_INTRO['c1-color']}
          onStart={() => setPhase('running-c1')}
        />
      )}
      {phase === 'intro-c2' && (
        <IntroPanel
          intro={CONDITION_INTRO['c2-word']}
          prev={conditionResults['c1-color']}
          onStart={() => setPhase('running-c2')}
        />
      )}
      {phase === 'intro-c3' && (
        <IntroPanel
          intro={CONDITION_INTRO['c3-inhibit']}
          prev={conditionResults['c2-word']}
          onStart={() => setPhase('running-c3')}
        />
      )}
      {phase === 'intro-c4' && (
        <IntroPanel
          intro={CONDITION_INTRO['c4-switch']}
          prev={conditionResults['c3-inhibit']}
          onStart={() => setPhase('running-c4')}
        />
      )}

      {runningCondition && (
        <ConditionRunner
          key={runningCondition}
          condition={runningCondition}
          sessionSeed={sessionSeedRef.current}
          onComplete={(result) => handleConditionComplete(runningCondition, result)}
        />
      )}

      {phase === 'results' && (
        <ResultsPanel
          sessionId={sessionIdRef.current}
          c1={conditionResults['c1-color']}
          c2={conditionResults['c2-word']}
          c3={conditionResults['c3-inhibit']}
          c4={conditionResults['c4-switch']}
          onDownload={downloadResults}
          onRestart={restart}
        />
      )}
    </div>
  )
}

interface ConditionRunnerProps {
  condition: CwCondition
  sessionSeed: number
  onComplete: (result: CwConditionResult) => void
}

function ConditionRunner({ condition, sessionSeed, onComplete }: ConditionRunnerProps) {
  const seed = useMemo(() => deriveConditionSeed(sessionSeed, condition), [condition, sessionSeed])
  const stimuli = useMemo(() => generateStimuli(condition, seed), [condition, seed])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFixation, setShowFixation] = useState(false)
  const trialsRef = useRef<CwTrialResult[]>([])
  const startedAtRef = useRef<number>(Date.now())
  const itiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    startedAtRef.current = Date.now()
    trialsRef.current = []
    completedRef.current = false
    return () => {
      if (itiTimeoutRef.current !== null) clearTimeout(itiTimeoutRef.current)
    }
  }, [condition, sessionSeed])

  const handleTrialComplete = useCallback(
    (result: CwTrialResult) => {
      if (completedRef.current) return
      trialsRef.current.push(result)

      const nextIndex = currentIndex + 1
      if (nextIndex >= stimuli.length) {
        completedRef.current = true
        const completedAt = Date.now()
        onComplete(
          aggregateCondition(
            condition,
            seed,
            trialsRef.current.slice(),
            startedAtRef.current,
            completedAt,
          ),
        )
        return
      }

      setShowFixation(true)
      itiTimeoutRef.current = setTimeout(() => {
        setShowFixation(false)
        setCurrentIndex(nextIndex)
      }, CW_ITI_MS)
    },
    [condition, currentIndex, onComplete, seed, stimuli.length],
  )

  const stimulus = stimuli[currentIndex]

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          {CONDITION_LABEL[condition]}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-300 dark:text-zinc-600">
          {stimulus.isPractice
            ? `Practice ${stimulus.index + 1} of 3`
            : `Item ${stimulus.index - 2} of 30`}
        </p>
      </div>

      {showFixation ? (
        <ColorWordFixation />
      ) : (
        <ColorWordTrial
          key={stimulus.index}
          stimulus={stimulus}
          onComplete={handleTrialComplete}
        />
      )}

      <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
        Pointer movement and response times are being recorded.
      </p>
    </section>
  )
}

interface IntroPanelProps {
  intro: {
    label: string
    title: string
    body: string[]
    buttonLabel: string
  }
  prev?: CwConditionResult
  onStart: () => void
}

function IntroPanel({ intro, prev, onStart }: IntroPanelProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          {intro.label}
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {intro.title}
        </h2>
      </div>

      {prev && (
        <div className="flex items-center gap-6 rounded-md border border-zinc-200 dark:border-zinc-800/70 px-4 py-3">
          <PrevStat label="Previous total RT" value={`${formatSeconds(prev.scoredResponseTimeMs)}s`} />
          <PrevStat label="Errors" value={String(prev.errors)} />
          <PrevStat
            label="Accuracy"
            value={`${Math.round(prev.accuracy * 100)}%`}
          />
        </div>
      )}

      <div className="space-y-3 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        {intro.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
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
        {intro.buttonLabel}
      </button>
    </section>
  )
}

function PrevStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  )
}

interface ResultsPanelProps {
  sessionId: string
  c1?: CwConditionResult
  c2?: CwConditionResult
  c3?: CwConditionResult
  c4?: CwConditionResult
  onDownload: () => void
  onRestart: () => void
}

function ResultsPanel({
  sessionId,
  c1,
  c2,
  c3,
  c4,
  onDownload,
  onRestart,
}: ResultsPanelProps) {
  if (!c1 || !c2 || !c3 || !c4) return null

  const interference = c3.scoredResponseTimeMs - c1.scoredResponseTimeMs
  const switching = c4.scoredResponseTimeMs - c3.scoredResponseTimeMs

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
        <ConditionStat label="C1 · Color" result={c1} />
        <ConditionStat label="C2 · Word" result={c2} />
        <ConditionStat label="C3 · Inhibit" result={c3} />
        <ConditionStat label="C4 · Switch" result={c4} />
        <Metric
          label="Interference (C3 − C1)"
          value={formatSignedSeconds(interference)}
          hint="Inhibition cost"
        />
        <Metric
          label="Switching cost (C4 − C3)"
          value={formatSignedSeconds(switching)}
          hint="Rule-switching cost"
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

function ConditionStat({ label, result }: { label: string; result: CwConditionResult }) {
  const median = result.medianRtMs !== null ? `${Math.round(result.medianRtMs)}ms median` : 'no correct'
  return (
    <div className="flex flex-col gap-1 border-b border-dashed border-zinc-100 px-4 py-4 dark:border-zinc-900">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="font-mono text-lg text-zinc-900 dark:text-zinc-100">
        {formatSeconds(result.scoredResponseTimeMs)}s
      </p>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        {result.errors} error{result.errors === 1 ? '' : 's'} · {Math.round(result.accuracy * 100)}% · {median}
      </p>
    </div>
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
