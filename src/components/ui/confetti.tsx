"use client"

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import confetti from "canvas-confetti"

type ConfettiOptions = {
  particleCount?: number
  spread?: number
  origin?: { y?: number }
  [key: string]: unknown
}

type ConfettiInstance = ((options?: ConfettiOptions) => void) & {
  reset: () => void
}

type ConfettiModule = {
  create: (
    canvas: HTMLCanvasElement,
    options?: { resize?: boolean; useWorker?: boolean }
  ) => ConfettiInstance
}

const confettiModule = confetti as unknown as ConfettiModule

export interface ConfettiRef {
  fire: (options?: ConfettiOptions) => void
}

interface ConfettiProps extends React.HTMLAttributes<HTMLCanvasElement> {}

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  ({ className, ...props }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const confettiRef = useRef<ConfettiInstance | null>(null)

    useEffect(() => {
      if (canvasRef.current) {
        confettiRef.current = confettiModule.create(canvasRef.current, {
          resize: true,
          useWorker: true,
        })
      }

      return () => {
        confettiRef.current?.reset()
      }
    }, [])

    useImperativeHandle(ref, () => ({
      fire: (options = {}) => {
        const defaultOptions: ConfettiOptions = {
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          ...options,
        }
        confettiRef.current?.(defaultOptions)
      },
    }))

    return (
      <canvas
        ref={canvasRef}
        className={className}
        {...props}
      />
    )
  }
)

Confetti.displayName = "Confetti"
