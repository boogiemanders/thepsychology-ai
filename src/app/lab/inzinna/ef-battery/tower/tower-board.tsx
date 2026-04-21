'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { applyMove, isLegalMove, statesEqual } from './scorer'
import type {
  PegIndex,
  TowerDrag,
  TowerKinematicFrame,
  TowerMove,
  TowerPuzzleResult,
  TowerPuzzleSpec,
  TowerState,
  TowerViolationReason,
} from './types'

const VIEWBOX = { width: 800, height: 400 }
const PEG_X = [133, 400, 667] as const
const LANE_BOUNDS = [266, 533] as const
const PEG_Y_TOP = 60
const PEG_Y_BASE = 340
const DISC_HEIGHT = 22
const MIN_DISC_WIDTH = 50
const DISC_WIDTH_STEP = 16
const SOFT_CAP_MS_SMALL = 60_000
const SOFT_CAP_MS_LARGE = 180_000

function discWidth(size: number) {
  return MIN_DISC_WIDTH + size * DISC_WIDTH_STEP
}

function pegAtX(x: number): PegIndex {
  if (x < LANE_BOUNDS[0]) return 0
  if (x < LANE_BOUNDS[1]) return 1
  return 2
}

function softCapMs(discCount: number) {
  return discCount <= 4 ? SOFT_CAP_MS_SMALL : SOFT_CAP_MS_LARGE
}

interface TowerBoardProps {
  puzzle: TowerPuzzleSpec
  onComplete: (result: TowerPuzzleResult) => void
}

export function TowerBoard({ puzzle, onComplete }: TowerBoardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [state, setState] = useState<TowerState>(puzzle.initial)
  const [dragging, setDragging] = useState<{
    discSize: number
    fromPeg: PegIndex
    pointer: { x: number; y: number }
  } | null>(null)
  const [illegalFlashPeg, setIllegalFlashPeg] = useState<PegIndex | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  const startedAtPerfRef = useRef<number>(0)
  const startedAtWallRef = useRef<number>(0)
  const firstMoveLatencyRef = useRef<number | null>(null)
  const movesRef = useRef<TowerMove[]>([])
  const dragsRef = useRef<TowerDrag[]>([])
  const currentDragFramesRef = useRef<TowerKinematicFrame[]>([])
  const currentDragStartTRef = useRef<number>(0)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef<typeof dragging>(null)
  const rafRef = useRef<number | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    draggingRef.current = dragging
  }, [dragging])

  useEffect(() => {
    startedAtPerfRef.current = performance.now()
    startedAtWallRef.current = Date.now()
    movesRef.current = []
    dragsRef.current = []
    currentDragFramesRef.current = []
    firstMoveLatencyRef.current = null
    completedRef.current = false

    const tick = () => {
      if (pointerRef.current && draggingRef.current) {
        currentDragFramesRef.current.push({
          t: performance.now() - startedAtPerfRef.current,
          x: pointerRef.current.x,
          y: pointerRef.current.y,
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    const timerId = window.setInterval(() => {
      if (!completedRef.current) {
        setElapsedMs(performance.now() - startedAtPerfRef.current)
      }
    }, 500)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      window.clearInterval(timerId)
    }
  }, [puzzle.id])

  const svgCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const transformed = pt.matrixTransform(ctm.inverse())
    return { x: transformed.x, y: transformed.y }
  }, [])

  const finalizeAndComplete = useCallback(
    (resulting: TowerState, tNow: number, solved: boolean) => {
      if (completedRef.current) return
      completedRef.current = true
      const validMoves = movesRef.current.filter((m) => m.valid).length
      const violations = movesRef.current.filter(
        (m) => m.violationReason === 'larger-on-smaller',
      ).length
      const excessMoves = Math.max(0, validMoves - puzzle.optimalMoves)
      onComplete({
        puzzleId: puzzle.id,
        discCount: puzzle.discCount,
        initial: puzzle.initial,
        goal: puzzle.goal,
        optimalMoves: puzzle.optimalMoves,
        moves: movesRef.current.slice(),
        drags: dragsRef.current.slice(),
        startedAt: startedAtWallRef.current,
        completedAt: Date.now(),
        durationMs: tNow,
        firstMoveLatencyMs: firstMoveLatencyRef.current,
        totalMoves: movesRef.current.length,
        validMoves,
        violations,
        excessMoves,
        solved,
      })
    },
    [onComplete, puzzle],
  )

  const commitMove = useCallback(
    (from: PegIndex, to: PegIndex) => {
      const active = draggingRef.current
      if (!active) return
      const t = performance.now() - startedAtPerfRef.current

      let valid: boolean
      let violationReason: TowerViolationReason | undefined
      if (from === to) {
        valid = false
        violationReason = 'same-peg'
      } else {
        valid = isLegalMove(state, from, to)
        if (!valid) violationReason = 'larger-on-smaller'
      }

      const resulting = valid ? applyMove(state, from, to) : state

      const move: TowerMove = {
        t,
        discSize: active.discSize,
        fromPeg: from,
        toPeg: to,
        valid,
        violationReason,
        resultingState: resulting,
      }
      movesRef.current.push(move)

      const drag: TowerDrag = {
        discSize: active.discSize,
        fromPeg: from,
        toPeg: to,
        startT: currentDragStartTRef.current,
        endT: t,
        frames: currentDragFramesRef.current.slice(),
        completed: valid,
      }
      dragsRef.current.push(drag)
      currentDragFramesRef.current = []

      setDragging(null)

      if (valid) {
        if (firstMoveLatencyRef.current === null) {
          firstMoveLatencyRef.current = t
        }
        setState(resulting)
        if (statesEqual(resulting, puzzle.goal)) {
          finalizeAndComplete(resulting, t, true)
        }
      } else {
        setIllegalFlashPeg(to)
        window.setTimeout(() => setIllegalFlashPeg(null), 400)
      }
    },
    [state, puzzle.goal, finalizeAndComplete],
  )

  const handleDiscPointerDown = useCallback(
    (evt: React.PointerEvent<SVGRectElement>, discSize: number, fromPeg: PegIndex) => {
      if (completedRef.current) return
      if (draggingRef.current) return
      evt.preventDefault()
      const coords = svgCoords(evt.clientX, evt.clientY)
      if (!coords) return
      const t = performance.now() - startedAtPerfRef.current
      svgRef.current?.setPointerCapture(evt.pointerId)
      currentDragFramesRef.current = []
      currentDragStartTRef.current = t
      pointerRef.current = coords
      setDragging({ discSize, fromPeg, pointer: coords })
    },
    [svgCoords],
  )

  const handleSvgPointerMove = useCallback(
    (evt: React.PointerEvent<SVGSVGElement>) => {
      const coords = svgCoords(evt.clientX, evt.clientY)
      if (!coords) return
      pointerRef.current = coords
      if (draggingRef.current) {
        setDragging((d) => (d ? { ...d, pointer: coords } : null))
      }
    },
    [svgCoords],
  )

  const handleSvgPointerUp = useCallback(
    (evt: React.PointerEvent<SVGSVGElement>) => {
      const active = draggingRef.current
      if (!active) return
      const coords = svgCoords(evt.clientX, evt.clientY) ?? active.pointer
      const toPeg = pegAtX(coords.x)
      commitMove(active.fromPeg, toPeg)
    },
    [svgCoords, commitMove],
  )

  const handleSvgPointerCancel = useCallback(() => {
    const active = draggingRef.current
    if (!active) return
    const t = performance.now() - startedAtPerfRef.current
    dragsRef.current.push({
      discSize: active.discSize,
      fromPeg: active.fromPeg,
      toPeg: null,
      startT: currentDragStartTRef.current,
      endT: t,
      frames: currentDragFramesRef.current.slice(),
      completed: false,
    })
    currentDragFramesRef.current = []
    setDragging(null)
  }, [])

  const handleSkip = useCallback(() => {
    if (completedRef.current) return
    const t = performance.now() - startedAtPerfRef.current
    finalizeAndComplete(state, t, false)
  }, [finalizeAndComplete, state])

  const cap = softCapMs(puzzle.discCount)
  const showSkip = elapsedMs >= cap && !completedRef.current
  const elapsedSec = Math.floor(elapsedMs / 1000)

  return (
    <div className="space-y-3">
      <div className="w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          className="block h-auto w-full touch-none select-none"
          preserveAspectRatio="xMidYMid meet"
          role="application"
          aria-label={`Tower of Hanoi puzzle with ${puzzle.discCount} discs. Move all discs to the right peg.`}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerCancel={handleSvgPointerCancel}
        >
          <rect
            x={0}
            y={PEG_Y_BASE + 6}
            width={VIEWBOX.width}
            height={VIEWBOX.height - (PEG_Y_BASE + 6)}
            className="fill-transparent"
          />

          {PEG_X.map((x, i) => (
            <g key={`peg-${i}`}>
              <rect
                x={x - 3}
                y={PEG_Y_TOP}
                width={6}
                height={PEG_Y_BASE - PEG_Y_TOP}
                rx={2}
                className={cn(
                  'transition-colors duration-150',
                  illegalFlashPeg === i
                    ? 'fill-red-400 dark:fill-red-500'
                    : 'fill-zinc-300 dark:fill-zinc-700',
                )}
              />
              <rect
                x={x - 95}
                y={PEG_Y_BASE}
                width={190}
                height={6}
                rx={2}
                className="fill-zinc-400 dark:fill-zinc-600"
              />
              <text
                x={x}
                y={PEG_Y_BASE + 28}
                textAnchor="middle"
                className="pointer-events-none select-none fill-zinc-400 dark:fill-zinc-500 font-mono text-[12px] uppercase tracking-[0.16em]"
              >
                {i === 0 ? 'Start' : i === 2 ? 'Goal' : 'Spare'}
              </text>
            </g>
          ))}

          {puzzle.goal.pegs[2].map((size, idx) => {
            const w = discWidth(size)
            const x = PEG_X[2] - w / 2
            const y = PEG_Y_BASE - DISC_HEIGHT * (idx + 1)
            return (
              <rect
                key={`goal-${idx}`}
                x={x}
                y={y}
                width={w}
                height={DISC_HEIGHT - 2}
                rx={3}
                className="fill-none stroke-zinc-300 dark:stroke-zinc-700"
                strokeWidth={1}
                strokeDasharray="3 3"
                style={{ pointerEvents: 'none' }}
              />
            )
          })}

          {state.pegs.map((peg, pegIdx) =>
            peg.map((size, stackIdx) => {
              const isTop = stackIdx === peg.length - 1
              const isBeingDragged =
                dragging?.fromPeg === pegIdx && isTop && dragging.discSize === size
              if (isBeingDragged) return null
              const w = discWidth(size)
              const x = PEG_X[pegIdx] - w / 2
              const y = PEG_Y_BASE - DISC_HEIGHT * (stackIdx + 1)
              return (
                <rect
                  key={`disc-${pegIdx}-${stackIdx}`}
                  x={x}
                  y={y}
                  width={w}
                  height={DISC_HEIGHT - 2}
                  rx={3}
                  className={cn(
                    'fill-zinc-800 stroke-zinc-500 dark:fill-zinc-200 dark:stroke-zinc-600',
                    isTop && !completedRef.current && 'cursor-grab',
                  )}
                  strokeWidth={1}
                  style={{ pointerEvents: isTop ? 'auto' : 'none' }}
                  onPointerDown={
                    isTop
                      ? (evt) => handleDiscPointerDown(evt, size, pegIdx as PegIndex)
                      : undefined
                  }
                />
              )
            }),
          )}

          {dragging && (
            <rect
              x={dragging.pointer.x - discWidth(dragging.discSize) / 2}
              y={dragging.pointer.y - (DISC_HEIGHT - 2) / 2}
              width={discWidth(dragging.discSize)}
              height={DISC_HEIGHT - 2}
              rx={3}
              className="fill-zinc-900 stroke-zinc-600 dark:fill-zinc-100 dark:stroke-zinc-400"
              strokeWidth={1.5}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          {elapsedSec}s elapsed · optimal {puzzle.optimalMoves} moves
        </p>
        {showSkip && (
          <button
            type="button"
            onClick={handleSkip}
            className="cursor-pointer rounded-md border border-zinc-200 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            Skip puzzle
          </button>
        )}
      </div>
    </div>
  )
}
