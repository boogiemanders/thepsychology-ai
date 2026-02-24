"use client"

import { cn } from "@/lib/utils"
import { ComponentPropsWithoutRef, useCallback, useEffect, useRef, useState } from "react"

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string;
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean;
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean;
  /**
   * Content to be displayed in the marquee
   */
  children: React.ReactNode;
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean;
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number;
  /**
   * Enables press-to-pause and drag-to-scroll behavior with auto-scroll resume on release.
   * @default false
   */
  dragToScroll?: boolean;
}

const DEFAULT_DURATION_MS = 40_000
const INTERACTIVE_REPEAT = 3
const DRAG_THRESHOLD_PX = 4

function parseDurationToMs(rawValue: string): number | null {
  const value = rawValue.trim()
  if (!value) return null

  if (value.endsWith("ms")) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value.endsWith("s")) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed * 1_000 : null
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  dragToScroll = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  style,
  ...props
}: MarqueeProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const copySizeRef = useRef(0)
  const speedPxPerMsRef = useRef(0)
  const pointerIdRef = useRef<number | null>(null)
  const dragStartXRef = useRef(0)
  const dragStartScrollRef = useRef(0)
  const hasDraggedRef = useRef(false)
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const [isPressed, setIsPressed] = useState(false)

  const interactiveEnabled = dragToScroll && !vertical

  const normalizeScrollPosition = useCallback((viewport: HTMLDivElement) => {
    const copySize = copySizeRef.current
    if (!copySize) return

    while (viewport.scrollLeft <= 0) {
      viewport.scrollLeft += copySize
    }

    while (viewport.scrollLeft >= copySize * 2) {
      viewport.scrollLeft -= copySize
    }
  }, [])

  useEffect(() => {
    if (!interactiveEnabled) return

    const viewport = viewportRef.current
    if (!viewport) return

    const getFirstCopy = () =>
      viewport.querySelector<HTMLElement>('[data-marquee-copy="0"]')

    const recalculateMetrics = () => {
      const firstCopy = getFirstCopy()
      if (!firstCopy) return

      const copySize = firstCopy.scrollWidth
      if (!copySize) return

      copySizeRef.current = copySize

      const durationFromCss = parseDurationToMs(
        getComputedStyle(viewport).getPropertyValue("--duration")
      )
      const durationMs = durationFromCss ?? DEFAULT_DURATION_MS
      speedPxPerMsRef.current = copySize / durationMs

      if (viewport.scrollLeft === 0) {
        viewport.scrollLeft = copySize
      } else {
        normalizeScrollPosition(viewport)
      }
    }

    recalculateMetrics()

    const resizeObserver = new ResizeObserver(() => {
      recalculateMetrics()
    })

    const firstCopy = getFirstCopy()
    if (firstCopy) {
      resizeObserver.observe(firstCopy)
    }
    resizeObserver.observe(viewport)

    const tick = (timestamp: number) => {
      const previous = lastTimestampRef.current ?? timestamp
      const delta = timestamp - previous
      lastTimestampRef.current = timestamp

      if (!isPausedRef.current && !isDraggingRef.current) {
        const direction = reverse ? -1 : 1
        viewport.scrollLeft += direction * speedPxPerMsRef.current * delta
        normalizeScrollPosition(viewport)
      }

      rafIdRef.current = window.requestAnimationFrame(tick)
    }

    rafIdRef.current = window.requestAnimationFrame(tick)

    return () => {
      resizeObserver.disconnect()
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current)
      }
      rafIdRef.current = null
      lastTimestampRef.current = null
      pointerIdRef.current = null
      isDraggingRef.current = false
      isPausedRef.current = false
      hasDraggedRef.current = false
    }
  }, [interactiveEnabled, normalizeScrollPosition, reverse])

  const endPointerInteraction = useCallback((pointerId: number) => {
    if (pointerIdRef.current !== pointerId) return

    const viewport = viewportRef.current
    if (viewport && viewport.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId)
    }

    pointerIdRef.current = null
    isDraggingRef.current = false
    isPausedRef.current = false
    hasDraggedRef.current = false
    setIsPressed(false)
  }, [])

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (interactiveEnabled && pointerIdRef.current === null) {
      const viewport = viewportRef.current
      if (viewport) {
        pointerIdRef.current = event.pointerId
        dragStartXRef.current = event.clientX
        dragStartScrollRef.current = viewport.scrollLeft
        hasDraggedRef.current = false
        isDraggingRef.current = true
        isPausedRef.current = true
        setIsPressed(true)
        viewport.setPointerCapture(event.pointerId)
      }
    }

    onPointerDown?.(event)
  }

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (interactiveEnabled && pointerIdRef.current === event.pointerId) {
      const viewport = viewportRef.current
      if (viewport) {
        const deltaX = event.clientX - dragStartXRef.current
        if (!hasDraggedRef.current && Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
          hasDraggedRef.current = true
        }

        if (hasDraggedRef.current) {
          event.preventDefault()
          viewport.scrollLeft = dragStartScrollRef.current - deltaX
          normalizeScrollPosition(viewport)
        }
      }
    }

    onPointerMove?.(event)
  }

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    endPointerInteraction(event.pointerId)
    onPointerUp?.(event)
  }

  const handlePointerCancel: React.PointerEventHandler<HTMLDivElement> = (event) => {
    endPointerInteraction(event.pointerId)
    onPointerCancel?.(event)
  }

  const handleLostPointerCapture: React.PointerEventHandler<HTMLDivElement> = (event) => {
    endPointerInteraction(event.pointerId)
    onLostPointerCapture?.(event)
  }

  if (interactiveEnabled) {
    return (
      <div
        {...props}
        ref={viewportRef}
        style={{
          ...style,
          touchAction: "pan-y",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
        className={cn(
          "group flex overflow-x-auto overflow-y-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)] select-none",
          "[&::-webkit-scrollbar]:hidden",
          {
            "cursor-grab": !isPressed,
            "cursor-grabbing": isPressed,
          },
          className
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
      >
        <div className="flex [gap:var(--gap)]">
          {Array(INTERACTIVE_REPEAT)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                data-marquee-copy={i}
                className="flex shrink-0 justify-around [gap:var(--gap)]"
              >
                {children}
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div
      {...props}
      style={style}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onLostPointerCapture}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
              "animate-marquee flex-row": !vertical,
              "animate-marquee-vertical flex-col": vertical,
              "group-hover:[animation-play-state:paused]": pauseOnHover,
              "[animation-direction:reverse]": reverse,
            })}
          >
            {children}
          </div>
        ))}
    </div>
  );
}
