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

  useEffect(() => {
    // Load the animation JSON from public folder
    fetch('/animations/breathe-ripple.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load animation:', err))
  }, [])

  useEffect(() => {
    if (lottieRef.current) {
      // Set playback speed for 4 breaths per minute (15 seconds per cycle)
      // Original: 755 frames at 30fps = 25.17 seconds
      // Target: 15 seconds per cycle
      // Speed factor: 25.17 / 15 = 1.678, so reverse: 15 / 25.17 = 0.596
      lottieRef.current.setSpeed(speed)
      // Set direction: 1 = forward, -1 = reverse
      lottieRef.current.setDirection(isReversed ? -1 : 1)
    }
  }, [speed, animationData, isReversed])

  // Play animation and toggle reverse direction at the end
  useEffect(() => {
    if (!lottieRef.current) return

    const handleComplete = () => {
      // Animation completed, toggle direction for next cycle
      setIsReversed((prev) => !prev)
    }

    // Get the Lottie instance and add completion listener
    const lottie = lottieRef.current
    // Play the animation
    lottie.play()

    // Listen for animation completion
    const animationFrameId = setInterval(() => {
      if (lottie && lottie.currentFrame !== undefined) {
        // Check if we're at the end or beginning of the animation
        const totalFrames = lottie.getDuration(true) // Get total frames
        const currentFrame = lottie.currentFrame

        // If we're at the end of the animation (forward), reverse it
        if (isReversed && currentFrame <= 0) {
          setIsReversed(false)
        } else if (!isReversed && currentFrame >= totalFrames - 1) {
          setIsReversed(true)
        }
      }
    }, 100)

    return () => clearInterval(animationFrameId)
  }, [lottieRef, isReversed])

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
