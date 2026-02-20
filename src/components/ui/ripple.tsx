"use client"

import React, { ComponentPropsWithoutRef, CSSProperties } from "react"

import { cn } from "@/lib/utils"

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
  circleSizeGap?: number
  durationMs?: number
  delayStepMs?: number
  blendMode?: CSSProperties["mixBlendMode"]
  color?: string
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 60,
  mainCircleOpacity = 0.22,
  numCircles = 3,
  circleSizeGap = 80,
  durationMs = 900,
  delayStepMs = 50,
  blendMode = "normal",
  color,
  className,
  style,
  ...props
}: RippleProps) {
  const circles = Array.from({ length: numCircles })
  const colorValue = color ?? "var(--foreground)"

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        className
      )}
      style={{ color: colorValue, ...style }}
      {...props}
    >
      {circles.map((_, i) => {
        const size = mainCircleSize + i * circleSizeGap
        const opacity = Math.max(mainCircleOpacity - i * 0.08, 0.05)
        const animationDelayS = (i * delayStepMs) / 1000

        return (
          <div
            key={i}
            className="absolute rounded-full border-2"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                mixBlendMode: blendMode,
                borderColor: colorValue,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.32), 0 0 20px ${colorValue}`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(0.58)",
                animationName: "ripple-pulse",
                animationDuration: `${durationMs}ms`,
                animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                animationDelay: `${animationDelayS}s`,
                animationFillMode: "forwards",
                willChange: "transform, opacity",
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
})

Ripple.displayName = "Ripple"
