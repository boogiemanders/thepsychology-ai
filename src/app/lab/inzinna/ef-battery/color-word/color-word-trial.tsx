'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  CW_COLORS,
  CW_COLOR_HEX,
  CW_FEEDBACK_MS,
  CW_TIMEOUT_MS,
  type CwColor,
  type CwKinematicFrame,
  type CwResponseSource,
  type CwStimulus,
  type CwTrialResult,
} from './types'

interface ColorWordTrialProps {
  stimulus: CwStimulus
  onComplete: (result: CwTrialResult) => void
}

type Feedback = { kind: 'correct' } | { kind: 'wrong'; expected: CwColor }

export function ColorWordTrial({ stimulus, onComplete }: ColorWordTrialProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const settledRef = useRef(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const stimulusShownPerfRef = useRef(0)
  const stimulusShownWallRef = useRef(0)
  const kinematicsRef = useRef<CwKinematicFrame[]>([])
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const startPointerRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const settle = useCallback(
    (response: CwColor | null, source: CwResponseSource) => {
      if (settledRef.current) return
      settledRef.current = true

      const endPerf = performance.now()
      const rtMs = response === null ? null : endPerf - stimulusShownPerfRef.current

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const frames = kinematicsRef.current.slice()
      let pathLength = 0
      for (let i = 1; i < frames.length; i += 1) {
        pathLength += Math.hypot(frames[i].x - frames[i - 1].x, frames[i].y - frames[i - 1].y)
      }

      let timeToMovementOnsetMs: number | null = null
      if (startPointerRef.current) {
        const { x: x0, y: y0 } = startPointerRef.current
        for (const frame of frames) {
          if (Math.hypot(frame.x - x0, frame.y - y0) > 4) {
            timeToMovementOnsetMs = frame.t
            break
          }
        }
      }

      const correct = response !== null && response === stimulus.expected

      const result: CwTrialResult = {
        stimulus,
        stimulusShownAt: stimulusShownWallRef.current,
        response,
        responseSource: source,
        rtMs,
        correct,
        kinematics: frames,
        pathLength,
        timeToMovementOnsetMs,
      }

      const commit = () => onComplete(result)

      if (stimulus.isPractice) {
        setFeedback(correct ? { kind: 'correct' } : { kind: 'wrong', expected: stimulus.expected })
        feedbackTimeoutRef.current = setTimeout(() => {
          setFeedback(null)
          commit()
        }, CW_FEEDBACK_MS)
      } else {
        commit()
      }
    },
    [onComplete, stimulus],
  )

  useEffect(() => {
    settledRef.current = false
    kinematicsRef.current = []
    pointerRef.current = null
    startPointerRef.current = null
    stimulusShownPerfRef.current = performance.now()
    stimulusShownWallRef.current = Date.now()

    const tick = () => {
      if (pointerRef.current) {
        if (!startPointerRef.current) {
          startPointerRef.current = { ...pointerRef.current }
        }
        kinematicsRef.current.push({
          t: performance.now() - stimulusShownPerfRef.current,
          x: pointerRef.current.x,
          y: pointerRef.current.y,
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    timeoutRef.current = setTimeout(() => {
      settle(null, 'timeout')
    }, CW_TIMEOUT_MS)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
      if (feedbackTimeoutRef.current !== null) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [settle])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settledRef.current) return
      const idx = ['1', '2', '3'].indexOf(e.key)
      if (idx === -1) return
      e.preventDefault()
      settle(CW_COLORS[idx], 'keyboard')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settle])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handleButtonClick = useCallback(
    (color: CwColor) => {
      settle(color, 'mouse')
    },
    [settle],
  )

  const stimulusLabel =
    stimulus.word === null
      ? 'color patch'
      : `${stimulus.word.toUpperCase()} in ${stimulus.ink} ink`

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative select-none"
      aria-live="polite"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          {stimulus.isPractice ? 'Practice' : `Trial ${stimulus.index - 2} of 30`}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-300 dark:text-zinc-600">
          {stimulus.askFor === 'ink' ? 'Pick the ink color' : 'Pick the word'}
        </p>
      </div>

      <div className="flex h-64 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30">
        <StimulusDisplay stimulus={stimulus} label={stimulusLabel} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {CW_COLORS.map((color, i) => (
          <button
            key={color}
            type="button"
            onClick={() => handleButtonClick(color)}
            className={cn(
              'flex h-16 items-center justify-center rounded-md text-[14px] font-semibold uppercase tracking-[0.16em] text-white',
              'transition-transform active:scale-[0.98]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100',
            )}
            style={{ backgroundColor: CW_COLOR_HEX[color] }}
            aria-keyshortcuts={String(i + 1)}
          >
            <span className="mr-2 font-mono text-[10px] opacity-80">{i + 1}</span>
            {color}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'rounded-md px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em]',
              feedback.kind === 'correct'
                ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300'
                : 'bg-red-500/15 text-red-700 dark:bg-red-400/15 dark:text-red-300',
            )}
          >
            {feedback.kind === 'correct'
              ? 'Correct'
              : `Correct answer: ${feedback.expected.toUpperCase()}`}
          </div>
        </div>
      )}
    </div>
  )
}

function StimulusDisplay({ stimulus, label }: { stimulus: CwStimulus; label: string }) {
  if (stimulus.word === null) {
    const color = stimulus.ink === 'neutral' ? '#000000' : CW_COLOR_HEX[stimulus.ink]
    return (
      <div
        className="h-24 w-60 rounded-md"
        style={{ backgroundColor: color }}
        role="img"
        aria-label={label}
      />
    )
  }

  const inkStyle =
    stimulus.ink === 'neutral'
      ? undefined
      : { color: CW_COLOR_HEX[stimulus.ink] }

  const word = (
    <span
      className={cn(
        'select-none font-sans text-[64px] font-bold uppercase leading-none tracking-[0.04em]',
        stimulus.ink === 'neutral' && 'text-zinc-900 dark:text-zinc-100',
      )}
      style={inkStyle}
    >
      {stimulus.word}
    </span>
  )

  if (stimulus.boxed) {
    return (
      <div
        className="rounded-md border-4 border-zinc-900 px-8 py-4 dark:border-zinc-100"
        role="img"
        aria-label={label}
      >
        {word}
      </div>
    )
  }

  return (
    <div role="img" aria-label={label}>
      {word}
    </div>
  )
}

export function ColorWordFixation() {
  return (
    <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-zinc-200 dark:border-zinc-800/70">
      <span className="inline-block h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
    </div>
  )
}
