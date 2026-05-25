'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { NBackShape } from './shapes'
import { generateNBackSequence } from './sequences'
import { summarizeBlock } from './scoring'
import type {
  NBackBlockKind,
  NBackBlockResult,
  NBackLevel,
  NBackTrial,
} from './types'

const STIMULUS_MS = 500
const ISI_MS = 2000

type Stage = 'countdown' | 'stimulus' | 'isi' | 'done'

interface FeedbackDot {
  kind: 'hit' | 'miss' | 'falseAlarm' | 'correctRejection'
}

export interface NBackBlockProps {
  kind: NBackBlockKind
  level: NBackLevel
  seed: number
  scorableCount: number
  targetCount: number
  shapeCount: number
  showFeedback: boolean
  onComplete: (result: NBackBlockResult) => void
}

export function NBackBlock({
  kind,
  level,
  seed,
  scorableCount,
  targetCount,
  shapeCount,
  showFeedback,
  onComplete,
}: NBackBlockProps) {
  const sequence = useMemo(
    () =>
      generateNBackSequence({
        level,
        scorableCount,
        targetCount,
        shapeCount,
        seed,
      }),
    [level, scorableCount, targetCount, shapeCount, seed],
  )

  const [stage, setStage] = useState<Stage>('countdown')
  const [countdown, setCountdown] = useState<number>(3)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [stimulusVisible, setStimulusVisible] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<FeedbackDot | null>(null)

  const trialsRef = useRef<NBackTrial[]>([])
  const currentTrialRef = useRef<{
    index: number
    isTarget: boolean
    isPrimer: boolean
    shapeIndex: number
    stimulusOnsetPerf: number
    stimulusOnsetWall: number
    responsePerf: number | null
    responseSource: 'key' | 'button' | null
  } | null>(null)
  const startedAtRef = useRef<number>(0)
  const stimulusTimeoutRef = useRef<number | null>(null)
  const isiTimeoutRef = useRef<number | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)
  const completedRef = useRef(false)

  const clearTimeouts = useCallback(() => {
    if (stimulusTimeoutRef.current !== null) {
      window.clearTimeout(stimulusTimeoutRef.current)
      stimulusTimeoutRef.current = null
    }
    if (isiTimeoutRef.current !== null) {
      window.clearTimeout(isiTimeoutRef.current)
      isiTimeoutRef.current = null
    }
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = null
    }
  }, [])

  const classifyTrial = useCallback((): NBackTrial => {
    const c = currentTrialRef.current
    if (!c) throw new Error('No current trial')
    let outcome: NBackTrial['outcome']
    if (c.isPrimer) outcome = 'primer'
    else if (c.isTarget) outcome = c.responsePerf !== null ? 'hit' : 'miss'
    else outcome = c.responsePerf !== null ? 'falseAlarm' : 'correctRejection'
    return {
      index: c.index,
      isPrimer: c.isPrimer,
      isTarget: c.isTarget,
      shapeIndex: c.shapeIndex,
      stimulusOnsetPerf: c.stimulusOnsetPerf,
      stimulusOnsetWall: c.stimulusOnsetWall,
      responsePerf: c.responsePerf,
      responseSource: c.responseSource,
      rtMs:
        c.responsePerf !== null
          ? c.responsePerf - c.stimulusOnsetPerf
          : null,
      outcome,
    }
  }, [])

  const finishTrial = useCallback(() => {
    if (!currentTrialRef.current) return
    const trial = classifyTrial()
    trialsRef.current.push(trial)

    if (showFeedback && !trial.isPrimer) {
      setFeedback({ kind: trial.outcome as FeedbackDot['kind'] })
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current)
      }
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setFeedback(null)
        feedbackTimeoutRef.current = null
      }, 400)
    }

    currentTrialRef.current = null
    const nextIndex = trial.index + 1
    if (nextIndex >= sequence.shapes.length) {
      setStage('done')
      if (completedRef.current) return
      completedRef.current = true
      const completedAt = Date.now()
      const result = summarizeBlock({
        kind,
        level,
        seed,
        trials: trialsRef.current,
        startedAt: startedAtRef.current,
        completedAt,
      })
      onComplete(result)
    } else {
      setCurrentIndex(nextIndex)
    }
  }, [classifyTrial, kind, level, onComplete, seed, sequence.shapes.length, showFeedback])

  useEffect(() => {
    if (stage !== 'countdown') return
    if (countdown <= 0) {
      startedAtRef.current = Date.now()
      setStage('stimulus')
      setCurrentIndex(0)
      return
    }
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [stage, countdown])

  useEffect(() => {
    if (stage !== 'stimulus') return
    if (completedRef.current) return

    const trial = {
      index: currentIndex,
      isTarget: sequence.isTarget[currentIndex],
      isPrimer: currentIndex < sequence.primerCount,
      shapeIndex: sequence.shapes[currentIndex],
      stimulusOnsetPerf: performance.now(),
      stimulusOnsetWall: Date.now(),
      responsePerf: null as number | null,
      responseSource: null as 'key' | 'button' | null,
    }
    currentTrialRef.current = trial
    setStimulusVisible(true)

    stimulusTimeoutRef.current = window.setTimeout(() => {
      setStimulusVisible(false)
      stimulusTimeoutRef.current = null
      isiTimeoutRef.current = window.setTimeout(() => {
        isiTimeoutRef.current = null
        finishTrial()
      }, ISI_MS)
    }, STIMULUS_MS)

    return () => {
      if (stimulusTimeoutRef.current !== null) {
        window.clearTimeout(stimulusTimeoutRef.current)
        stimulusTimeoutRef.current = null
      }
      if (isiTimeoutRef.current !== null) {
        window.clearTimeout(isiTimeoutRef.current)
        isiTimeoutRef.current = null
      }
    }
  }, [stage, currentIndex, sequence, finishTrial])

  useEffect(() => {
    return () => {
      clearTimeouts()
    }
  }, [clearTimeouts])

  const registerResponse = useCallback((source: 'key' | 'button') => {
    const c = currentTrialRef.current
    if (!c) return
    if (c.responsePerf !== null) return
    c.responsePerf = performance.now()
    c.responseSource = source
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (stage !== 'stimulus') return
      e.preventDefault()
      registerResponse('key')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [stage, registerResponse])

  const scorableTotal = sequence.shapes.length - sequence.primerCount
  const scorableSoFar = Math.max(
    0,
    Math.min(scorableTotal, currentIndex - sequence.primerCount + 1),
  )
  const inPrimerPhase = currentIndex < sequence.primerCount

  const levelLabel =
    kind === 'practice' ? 'Practice · 1-back' : `${level}-back`

  return (
    <section className="space-y-6">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          {levelLabel}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          {stage === 'countdown'
            ? 'Get ready'
            : inPrimerPhase
              ? 'Priming'
              : `${scorableSoFar} / ${scorableTotal}`}
        </p>
      </div>

      <div className="relative mx-auto flex aspect-square w-full max-w-xs items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800/70">
        {stage === 'countdown' && (
          <div className="font-mono text-6xl text-zinc-900 dark:text-zinc-100">
            {countdown > 0 ? countdown : 'Go'}
          </div>
        )}
        {stage === 'stimulus' && stimulusVisible && (
          <div className="h-2/5 w-2/5">
            <NBackShape
              index={sequence.shapes[currentIndex] ?? 0}
            />
          </div>
        )}

        {feedback && (
          <span
            className={cn(
              'absolute bottom-3 right-3 inline-block h-2 w-2 rounded-full',
              feedback.kind === 'hit' || feedback.kind === 'correctRejection'
                ? 'bg-emerald-500'
                : 'bg-rose-500',
            )}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (stage !== 'stimulus') return
            registerResponse('button')
          }}
          disabled={stage !== 'stimulus'}
          className={cn(
            'h-12 w-full max-w-xs rounded-md border',
            stage === 'stimulus'
              ? 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
              : 'border-zinc-200 bg-transparent text-zinc-400 dark:border-zinc-800 dark:text-zinc-600',
            'text-[11px] font-medium uppercase tracking-[0.14em] transition-colors',
          )}
        >
          Match
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          Press space or tap Match when current shape = {level}-back
        </p>
      </div>
    </section>
  )
}
