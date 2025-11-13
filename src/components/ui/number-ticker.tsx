"use client"

import { useEffect, useRef } from "react"
import { motion } from "motion/react"

interface NumberTickerProps {
  value: number
  duration?: number
  decimals?: number
  className?: string
}

export function NumberTicker({
  value,
  duration = 2,
  decimals = 0,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const animationRef = useRef<{ current: number }>({ current: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const start = parseFloat(element.innerText)
    const end = value
    const range = end - start
    const increment = range / (duration * 100)
    let current = start

    const timer = setInterval(() => {
      current += increment
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end
        clearInterval(timer)
      }
      element.innerText = current.toFixed(decimals)
    }, duration * 10)

    return () => clearInterval(timer)
  }, [value, duration, decimals])

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {value}
    </motion.span>
  )
}
