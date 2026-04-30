'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { DigitSpanTrial } from './digit-span-trial'
import { deriveTrialSeed } from './sequences'
import { primeSpeech } from './speech'
import type {
  DigitSpanCondition,
  DigitSpanConditionResult,
  DigitSpanPhase,
  DigitSpanSessionResult,
  DigitSpanTrialResult,
} from './types'

const FORWARD_MIN = 2
const FORWARD_MAX = 9
const BACKWARD_MIN = 2
const BACKWARD_MAX = 8

function makeSessionId(): string {
  const t = Date.now().toString(36)
  const r = Math.floor(Math.random() * 0xffff).toString(36)
  return `ds-${t}-${r}`
}

function makeSessionSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

function summarize(trials: DigitSpanTrialResult[]): {
  longestCorrectSpan: number
  totalCorrect: number
} {
  let longestCorrectSpan = 0
  let totalCorrect = 0
  for (const t of trials) {
    if (t.correct) {
      totalCorrect += 1
      if (t.spanLength > longestCorrectSpan) longestCorrectSpan = t.spanLength
    }
  }
  return { longestCorrectSpan, totalCorrect }
}

export function DigitSpanClient() {
  const [phase, setPhase] = useState<DigitSpanPhase>('intro-forward')
  const [sessionId] = useState(makeSessionId)
  const [sessionSeed] = useState(makeSessionSeed)
  const [startedAt] = useState(() => Date.now())

  const [forwardTrials, setForwardTrials] = useState<DigitSpanTrialResult[]>([])
  const [backwardTrials, setBackwardTrials] = useState<DigitSpanTrialResult[]>([])
  const [forwardResult, setForwardResult] = useState<DigitSpanConditionResult | null>(null)
  const [backwardResult, setBackwardResult] = useState<DigitSpanConditionResult | null>(null)

  const [currentCondition, setCurrentCondition] = useState<DigitSpanCondition>('forward')
  const [currentLength, setCurrentLength] = useState<number>(FORWARD_MIN)
  const [currentTrialIndex, setCurrentTrialIndex] = useState<1 | 2>(1)
  const [conditionStartedAt, setConditionStartedAt] = useState<number>(0)

  const finishCondition = useCallback(
    (
      condition: DigitSpanCondition,
      trials: DigitSpanTrialResult[],
      stoppedAtLength: number | null,
    ) => {
      const { longestCorrectSpan, totalCorrect } = summarize(trials)
      const now = Date.now()
      const result: DigitSpanConditionResult = {
        condition,
        seed: sessionSeed,
        trials,
        longestCorrectSpan,
        totalCorrect,
        stoppedAtLength,
        startedAt: conditionStartedAt,
        completedAt: now,
        durationMs: now - conditionStartedAt,
      }
      if (condition === 'forward') {
        setForwardResult(result)
        setCurrentCondition('backward')
        setCurrentLength(BACKWARD_MIN)
        setCurrentTrialIndex(1)
        setPhase('intro-backward')
      } else {
        setBackwardResult(result)
        setPhase('results')
      }
    },
    [conditionStartedAt, sessionSeed],
  )

  const handleTrialComplete = useCallback(
    (result: DigitSpanTrialResult) => {
      const isForward = result.condition === 'forward'
      const maxLength = isForward ? FORWARD_MAX : BACKWARD_MAX
      const trialsSoFar = isForward
        ? [...forwardTrials, result]
        : [...backwardTrials, result]
      if (isForward) setForwardTrials(trialsSoFar)
      else setBackwardTrials(trialsSoFar)

      if (currentTrialIndex === 1) {
        setCurrentTrialIndex(2)
        return
      }

      const trial1 = trialsSoFar[trialsSoFar.length - 2]
      const trial2 = trialsSoFar[trialsSoFar.length - 1]
      const bothFailed = !trial1.correct && !trial2.correct

      if (bothFailed) {
        finishCondition(result.condition, trialsSoFar, currentLength)
        return
      }

      if (currentLength >= maxLength) {
        finishCondition(result.condition, trialsSoFar, null)
        return
      }

      setCurrentLength(currentLength + 1)
      setCurrentTrialIndex(1)
    },
    [backwardTrials, currentLength, currentTrialIndex, finishCondition, forwardTrials],
  )

  const startForward = () => {
    primeSpeech()
    setConditionStartedAt(Date.now())
    setPhase('running-forward')
  }

  const startBackward = () => {
    primeSpeech()
    setConditionStartedAt(Date.now())
    setPhase('running-backward')
  }

  const downloadJSON = () => {
    if (!forwardResult || !backwardResult) return
    const session: DigitSpanSessionResult = {
      sessionId,
      startedAt,
      completedAt: Date.now(),
      forward: forwardResult,
      backward: backwardResult,
    }
    const blob = new Blob([JSON.stringify(session, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digit-span-${sessionId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (phase === 'intro-forward') {
    return (
      <IntroPanel
        label="Part 1 of 2"
        title="Forward Digit Span"
        body={[
          "You'll hear a short sequence of digits, one per second.",
          'When it stops, type them back in the same order.',
          'Sequences get one digit longer each round until you miss two in a row.',
        ]}
        buttonLabel="Start forward"
        onStart={startForward}
      />
    )
  }

  if (phase === 'intro-backward') {
    return (
      <IntroPanel
        label="Part 2 of 2"
        title="Backward Digit Span"
        body={[
          'Same rules, but type the digits in reverse.',
          "If you hear '4, 1, 8', type '8 1 4'.",
          'Sequences get longer until you miss two in a row.',
        ]}
        buttonLabel="Start backward"
        onStart={startBackward}
      />
    )
  }

  if (phase === 'running-forward' || phase === 'running-backward') {
    const seed = deriveTrialSeed(
      sessionSeed,
      currentCondition,
      currentLength,
      currentTrialIndex,
    )
    const trialKey = `${currentCondition}-${currentLength}-${currentTrialIndex}`
    return (
      <DigitSpanTrial
        key={trialKey}
        condition={currentCondition}
        spanLength={currentLength}
        trialIndexAtLength={currentTrialIndex}
        seed={seed}
        onComplete={handleTrialComplete}
      />
    )
  }

  return (
    <ResultsPanel
      forward={forwardResult}
      backward={backwardResult}
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
}: {
  label: string
  title: string
  body: string[]
  buttonLabel: string
  onStart: () => void
}) {
  return (
    <div className="space-y-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="mx-auto max-w-md space-y-2 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        {body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="pt-2">
        <button
          type="button"
          onClick={onStart}
          className={cn(
            'h-11 rounded-md bg-zinc-900 px-8 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-50 transition-colors',
            'hover:bg-zinc-800',
            'dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
          )}
        >
          {buttonLabel}
        </button>
      </div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        Tip: turn your volume up. Digits are spoken by the browser.
      </p>
    </div>
  )
}

function ResultsPanel({
  forward,
  backward,
  onDownload,
}: {
  forward: DigitSpanConditionResult | null
  backward: DigitSpanConditionResult | null
  onDownload: () => void
}) {
  if (!forward || !backward) return null
  return (
    <div className="space-y-10">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Complete
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Results
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ResultStat
          label="Forward · LDSF"
          value={forward.longestCorrectSpan}
          subtitle={`${forward.totalCorrect} of ${forward.trials.length} trials correct`}
        />
        <ResultStat
          label="Backward · LDSB"
          value={backward.longestCorrectSpan}
          subtitle={`${backward.totalCorrect} of ${backward.trials.length} trials correct`}
        />
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onDownload}
          className={cn(
            'h-11 rounded-md border border-zinc-200 px-8 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-900 transition-colors',
            'hover:bg-zinc-50',
            'dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-900',
          )}
        >
          Download JSON
        </button>
        <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          Full keystroke timing, audio timestamps, and per-trial data.
        </p>
      </div>
    </div>
  )
}

function ResultStat({
  label,
  value,
  subtitle,
}: {
  label: string
  value: number
  subtitle: string
}) {
  return (
    <div className="rounded-md border border-zinc-200 px-5 py-4 dark:border-zinc-800">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-4xl font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        {subtitle}
      </p>
    </div>
  )
}
