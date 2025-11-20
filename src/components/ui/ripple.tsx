"use client"

import React, { ComponentPropsWithoutRef, CSSProperties } from "react"

import { cn } from "@/lib/utils"

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
  color?: string
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 60,
  mainCircleOpacity = 0.22,
  numCircles = 3,
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
        const size = mainCircleSize + i * 80
        const opacity = Math.max(mainCircleOpacity - i * 0.08, 0.05)
        const animationDelay = `${i * 0.05}s`

        return (
          <div
            key={i}
              className="absolute rounded-full border animate-ripple"
              style={
                {
                  width: `${size}px`,
                  height: `${size}px`,
                  opacity,
                  animationDelay,
                  borderColor: colorValue,
                  top: "50%",
                  left: "50%",
                } as CSSProperties
              }
            />
        )
      })}
    </div>
  )
})

Ripple.displayName = "Ripple"
