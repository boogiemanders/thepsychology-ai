"use client"

import { useEffect, useRef } from "react"
import { motion } from "motion/react"

interface NumberTickerProps {
  value: number
  startValue?: number
  duration?: number
  decimals?: number
  className?: string
}

export function NumberTicker({
  value,
  startValue = 0,
  duration = 2,
  decimals = 0,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const start = startValue
    const end = value
    const range = end - start
    const totalSteps = duration * 60
    const increment = range / totalSteps
    let current = start
    let step = 0

    const timer = setInterval(() => {
      step++
      current = start + (range * step) / totalSteps
      if (step >= totalSteps) {
        current = end
        clearInterval(timer)
      }
      element.innerText = Math.round(current).toFixed(decimals)
    }, 1000 / 60)

    return () => clearInterval(timer)
  }, [value, startValue, duration, decimals])

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {startValue}
    </motion.span>
  )
}
