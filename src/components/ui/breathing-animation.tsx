'use client'

import React, { useEffect, useRef, useState } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'

interface BreathingAnimationProps {
  speed?: number // 1 = normal speed, adjust for 4 breaths per minute
}

export function BreathingAnimation({ speed = 0.15 }: BreathingAnimationProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [animationData, setAnimationData] = useState<any>(null)
  const [isReversed, setIsReversed] = useState(false)
  const cycleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Load the animation JSON from public folder
    fetch('/animations/breathe-ripple.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load animation:', err))
  }, [])

  useEffect(() => {
    if (lottieRef.current) {
      // Set direction: 1 = forward, -1 = reverse
      lottieRef.current.setDirection(isReversed ? -1 : 1)
    }
  }, [isReversed])

  // Variable speed animation: normal for 6 seconds, then slow for last 1.5 seconds
  useEffect(() => {
    if (!lottieRef.current || !animationData) return

    const lottie = lottieRef.current
    const normalSpeed = speed
    const slowSpeed = speed * 0.4 // Slow down to 40% speed for natural hold at end

    // Start playing immediately
    lottie.stop()
    lottie.goToAndPlay(0, true)
    lottie.setSpeed(normalSpeed)

    // After 6 seconds, slow down for the last 1.5 seconds
    const slowdownTimeout = setTimeout(() => {
      lottie.setSpeed(slowSpeed)
    }, 6000)

    // After 7.5 seconds total, toggle direction (this triggers smooth transition)
    const reverseTimeout = setTimeout(() => {
      setIsReversed((prev) => !prev)
    }, 7500)

    return () => {
      clearTimeout(slowdownTimeout)
      clearTimeout(reverseTimeout)
    }
  }, [isReversed, animationData, speed])

  if (!animationData) {
    return <div className="w-full h-full" />
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
