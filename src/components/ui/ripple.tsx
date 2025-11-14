"use client"

import React from "react"

interface RippleProps {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
  duration?: number // duration in seconds for a complete cycle
}

export function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.3,
  numCircles = 8,
  duration = 15, // 15 seconds = 4 breaths per minute
}: RippleProps) {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          width: mainCircleSize,
          height: mainCircleSize,
          opacity: mainCircleOpacity,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
      </div>

      {Array.from({ length: numCircles }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
          style={{
            width: mainCircleSize + i * 60,
            height: mainCircleSize + i * 60,
            opacity: Math.max(0, mainCircleOpacity - i * 0.05),
            animation: `ripple ${duration + i * (duration * 0.1)}s ease-out infinite`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes ripple {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
