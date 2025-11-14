"use client"

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import confetti from "canvas-confetti"

export interface ConfettiRef {
  fire: (options?: confetti.Options) => void
}

interface ConfettiProps extends React.HTMLAttributes<HTMLCanvasElement> {}

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  ({ className, ...props }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const confettiRef = useRef<confetti.CreateTypes | null>(null)

    useEffect(() => {
      if (canvasRef.current) {
        confettiRef.current = confetti.create(canvasRef.current, {
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
        const defaultOptions: confetti.Options = {
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
