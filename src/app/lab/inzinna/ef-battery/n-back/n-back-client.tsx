'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { NBackBlock } from './n-back-block'
import { deriveBlockSeed } from './sequences'
import { SHAPE_COUNT } from './shapes'
import type {
  NBackBlockResult,
  NBackPhase,
  NBackSessionResult,
} from './types'

const SCORABLE_COUNT = 20
const TARGET_COUNT = 8
const PRACTICE_SCORABLE = 10
const PRACTICE_TARGETS = 4

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `nb-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

function newSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—'
  return `${Math.round(ms)} ms`
}

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`
}

function formatD(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(2)
}

export function NBackClient() {
  const [phase, setPhase] = useState<NBackPhase>('intro')
  const [sessionId] = useState<string>(newSessionId)
  const [sessionSeed] = useState<number>(newSeed)
  const [startedAt] = useState<number>(() => Date.now())

  const [practice, setPractice] = useState<NBackBlockResult | null>(null)
  const [oneBack, setOneBack] = useState<NBackBlockResult | null>(null)
  const [twoBack, setTwoBack] = useState<NBackBlockResult | null>(null)
  const [threeBack, setThreeBack] = useState<NBackBlockResult | null>(null)

  const handlePracticeDone = useCallback((r: NBackBlockResult) => {
    setPractice(r)
    setPhase('intro-1back')
  }, [])
  const handleOneBackDone = useCallback((r: NBackBlockResult) => {
    setOneBack(r)
    setPhase('intro-2back')
  }, [])
  const handleTwoBackDone = useCallback((r: NBackBlockResult) => {
    setTwoBack(r)
    setPhase('intro-3back')
  }, [])
  const handleThreeBackDone = useCallback((r: NBackBlockResult) => {
    setThreeBack(r)
    setPhase('results')
  }, [])

  const downloadJSON = useCallback(() => {
    if (!practice || !oneBack || !twoBack || !threeBack) return
    const session: NBackSessionResult = {
      sessionId,
      sessionSeed,
      startedAt,
      completedAt: Date.now(),
      shapeCount: SHAPE_COUNT,
      stimulusMs: 500,
      isiMs: 2000,
      scorableCount: SCORABLE_COUNT,
      targetCount: TARGET_COUNT,
      practice,
      oneBack,
      twoBack,
      threeBack,
    }
    const blob = new Blob([JSON.stringify(session, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `n-back-${sessionId}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [oneBack, practice, sessionId, sessionSeed, startedAt, threeBack, twoBack])

  if (phase === 'intro') {
    return (
      <IntroPanel
        label="Before you start"
        title="How N-Back works"
        body={[
          'Shapes flash on the screen one at a time.',
          'Your job: hit space (or tap Match) when the current shape matches the one from N steps back.',
          'You will do three rounds. 1-back first, then 2-back, then 3-back. Each round is 20 trials.',
          'Before that, a short practice round with feedback so you get the hang of it.',
        ]}
        buttonLabel="Start practice"
        onStart={() => setPhase('practice')}
      />
    )
  }

  if (phase === 'practice') {
    return (
      <NBackBlock
        key="practice"
        kind="practice"
        level={1}
        seed={deriveBlockSeed(sessionSeed, 'practice')}
        scorableCount={PRACTICE_SCORABLE}
        targetCount={PRACTICE_TARGETS}
        shapeCount={SHAPE_COUNT}
        showFeedback={true}
        onComplete={handlePracticeDone}
      />
    )
  }

  if (phase === 'intro-1back') {
    return (
      <IntroPanel
        label="Round 1 of 3"
        title="1-back"
        body={[
          'Hit space when the current shape matches the shape you just saw.',
          `${SCORABLE_COUNT} trials. No feedback this time.`,
        ]}
        buttonLabel="Start 1-back"
        onStart={() => setPhase('running-1back')}
        prev={practice}
        prevLabel="Practice"
      />
    )
  }

  if (phase === 'running-1back') {
    return (
      <NBackBlock
        key="1back"
        kind="1back"
        level={1}
        seed={deriveBlockSeed(sessionSeed, '1back')}
        scorableCount={SCORABLE_COUNT}
        targetCount={TARGET_COUNT}
        shapeCount={SHAPE_COUNT}
        showFeedback={false}
        onComplete={handleOneBackDone}
      />
    )
  }

  if (phase === 'intro-2back') {
    return (
      <IntroPanel
        label="Round 2 of 3"
        title="2-back"
        body={[
          'Now hit space when the current shape matches the one from two steps back.',
          'You will need to hold more in memory. Focus on accuracy over speed.',
        ]}
        buttonLabel="Start 2-back"
        onStart={() => setPhase('running-2back')}
        prev={oneBack}
        prevLabel="1-back"
      />
    )
  }

  if (phase === 'running-2back') {
    return (
      <NBackBlock
        key="2back"
        kind="2back"
        level={2}
        seed={deriveBlockSeed(sessionSeed, '2back')}
        scorableCount={SCORABLE_COUNT}
        targetCount={TARGET_COUNT}
        shapeCount={SHAPE_COUNT}
        showFeedback={false}
        onComplete={handleTwoBackDone}
      />
    )
  }

  if (phase === 'intro-3back') {
    return (
      <IntroPanel
        label="Round 3 of 3"
        title="3-back"
        body={[
          'Last round. Hit space when the current shape matches the one from three steps back.',
          'This is the hardest. It is fine to miss some.',
        ]}
        buttonLabel="Start 3-back"
        onStart={() => setPhase('running-3back')}
        prev={twoBack}
        prevLabel="2-back"
      />
    )
  }

  if (phase === 'running-3back') {
    return (
      <NBackBlock
        key="3back"
        kind="3back"
        level={3}
        seed={deriveBlockSeed(sessionSeed, '3back')}
        scorableCount={SCORABLE_COUNT}
        targetCount={TARGET_COUNT}
        shapeCount={SHAPE_COUNT}
        showFeedback={false}
        onComplete={handleThreeBackDone}
      />
    )
  }

  return (
    <ResultsPanel
      sessionId={sessionId}
      oneBack={oneBack}
      twoBack={twoBack}
      threeBack={threeBack}
      onDownload={downloadJSON}
    />
  )
}

function IntroPanel({
  label,
  title,
  body,
  buttonLabel,
  onStart,
  prev,
  prevLabel,
}: {
  label: string
  title: string
  body: string[]
  buttonLabel: string
  onStart: () => void
  prev?: NBackBlockResult | null
  prevLabel?: string
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
      </div>

      {prev && prevLabel && (
        <div className="flex items-center gap-6 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800/70">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              {prevLabel} d&prime;
            </p>
            <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {formatD(prev.dPrime)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Accuracy
            </p>
            <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {formatPct(prev.accuracy)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Hits / FA
            </p>
            <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {prev.hits} / {prev.falseAlarms}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        {body.map((p) => (
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
        {buttonLabel}
      </button>
    </section>
  )
}

function ResultsPanel({
  sessionId,
  oneBack,
  twoBack,
  threeBack,
  onDownload,
}: {
  sessionId: string
  oneBack: NBackBlockResult | null
  twoBack: NBackBlockResult | null
  threeBack: NBackBlockResult | null
  onDownload: () => void
}) {
  if (!oneBack || !twoBack || !threeBack) return null
  const rows = [
    { label: '1-back', r: oneBack },
    { label: '2-back', r: twoBack },
    { label: '3-back', r: threeBack },
  ]

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Session complete
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Raw results
        </h2>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
          Pilot data only. No norms applied. Interpret with caution.
        </p>
      </div>

      <div className="border-y border-zinc-200 dark:border-zinc-800/70">
        <div className="grid grid-cols-6 gap-0 border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800/70 dark:bg-zinc-900/30">
          <HeaderCell>Level</HeaderCell>
          <HeaderCell>Hits / T</HeaderCell>
          <HeaderCell>FA / F</HeaderCell>
          <HeaderCell>Acc</HeaderCell>
          <HeaderCell>d&prime;</HeaderCell>
          <HeaderCell>RT hit</HeaderCell>
        </div>
        {rows.map(({ label, r }) => (
          <div
            key={label}
            className="grid grid-cols-6 gap-0 border-b border-dashed border-zinc-100 last:border-b-0 dark:border-zinc-900"
          >
            <Cell>{label}</Cell>
            <Cell>
              {r.hits} / {r.targets}
            </Cell>
            <Cell>
              {r.falseAlarms} / {r.foils}
            </Cell>
            <Cell>{formatPct(r.accuracy)}</Cell>
            <Cell>{formatD(r.dPrime)}</Cell>
            <Cell>{formatMs(r.medianRtHitMs)}</Cell>
          </div>
        ))}
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
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          {sessionId.slice(0, 8)}
        </p>
      </div>
    </section>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
      {children}
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-3 font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
      {children}
    </div>
  )
}
