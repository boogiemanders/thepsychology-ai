'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { TMT_VIEWBOX } from './layouts'
import type {
  TmtClick,
  TmtKinematicFrame,
  TmtNode,
  TmtTrial,
  TmtTrialResult,
} from './types'

interface TmtCanvasProps {
  trial: TmtTrial
  seed: number
  nodes: TmtNode[]
  onComplete: (result: TmtTrialResult) => void
}

export function TmtCanvas({ trial, seed, nodes, onComplete }: TmtCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [nextOrder, setNextOrder] = useState(0)
  const [connected, setConnected] = useState<TmtNode[]>([])
  const [errorFlashId, setErrorFlashId] = useState<string | null>(null)

  const kinematicsRef = useRef<TmtKinematicFrame[]>([])
  const clicksRef = useRef<TmtClick[]>([])
  const startedAtPerfRef = useRef<number>(0)
  const startedAtWallRef = useRef<number>(0)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    startedAtPerfRef.current = performance.now()
    startedAtWallRef.current = Date.now()
    kinematicsRef.current = []
    clicksRef.current = []
    completedRef.current = false

    const tick = () => {
      if (pointerRef.current) {
        kinematicsRef.current.push({
          t: performance.now() - startedAtPerfRef.current,
          x: pointerRef.current.x,
          y: pointerRef.current.y,
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [trial, seed])

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

  const handlePointerMove = useCallback(
    (evt: React.PointerEvent<SVGSVGElement>) => {
      const coords = svgCoords(evt.clientX, evt.clientY)
      if (coords) pointerRef.current = coords
    },
    [svgCoords],
  )

  const handleNodeClick = useCallback(
    (node: TmtNode, clientX: number, clientY: number) => {
      if (completedRef.current) return
      const coords = svgCoords(clientX, clientY)
      const t = performance.now() - startedAtPerfRef.current
      const isCorrect = node.order === nextOrder

      clicksRef.current.push({
        t,
        nodeId: node.id,
        correct: isCorrect,
        expectedOrder: nextOrder,
        x: coords?.x ?? node.x,
        y: coords?.y ?? node.y,
      })

      if (!isCorrect) {
        setErrorFlashId(node.id)
        window.setTimeout(() => setErrorFlashId(null), 400)
        return
      }

      setConnected((prev) => [...prev, node])
      const newOrder = nextOrder + 1
      setNextOrder(newOrder)

      if (newOrder >= nodes.length) {
        completedRef.current = true
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

        const kin = kinematicsRef.current
        let pathLength = 0
        for (let i = 1; i < kin.length; i += 1) {
          const dx = kin[i].x - kin[i - 1].x
          const dy = kin[i].y - kin[i - 1].y
          pathLength += Math.hypot(dx, dy)
        }

        const errors = clicksRef.current.filter((c) => !c.correct).length
        onComplete({
          trial,
          seed,
          nodes,
          clicks: clicksRef.current.slice(),
          kinematics: kin.slice(),
          startedAt: startedAtWallRef.current,
          completedAt: Date.now(),
          durationMs: t,
          errors,
          pathLength,
        })
      }
    },
    [nextOrder, nodes, onComplete, seed, svgCoords, trial],
  )

  const polylinePoints = connected.map((n) => `${n.x},${n.y}`).join(' ')

  return (
    <div className="w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${TMT_VIEWBOX.width} ${TMT_VIEWBOX.height}`}
        className="block h-auto w-full touch-none select-none"
        onPointerMove={handlePointerMove}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Trail Making Test ${trial}`}
      >
        {connected.length > 1 && (
          <polyline
            points={polylinePoints}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-zinc-400 dark:stroke-zinc-500"
          />
        )}

        {nodes.map((node) => {
          const isDone = node.order < nextOrder
          const isError = errorFlashId === node.id

          return (
            <g
              key={node.id}
              onPointerUp={(evt) => {
                evt.preventDefault()
                handleNodeClick(node, evt.clientX, evt.clientY)
              }}
              className="cursor-pointer touch-none"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={36}
                className={cn(
                  'transition-colors duration-150',
                  isError &&
                    'fill-red-500/15 stroke-red-500 dark:fill-red-500/20 dark:stroke-red-400',
                  !isError &&
                    isDone &&
                    'fill-zinc-900 stroke-zinc-900 dark:fill-zinc-100 dark:stroke-zinc-100',
                  !isError &&
                    !isDone &&
                    'fill-background stroke-zinc-400 dark:stroke-zinc-600',
                )}
                strokeWidth={1.5}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  'pointer-events-none select-none font-mono text-[22px] font-medium',
                  isDone
                    ? 'fill-background'
                    : 'fill-zinc-700 dark:fill-zinc-200',
                )}
              >
                {node.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
