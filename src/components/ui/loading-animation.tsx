'use client'

import React, { useEffect, useRef, useState } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingAnimation({ size = 'md' }: LoadingAnimationProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [animationData, setAnimationData] = useState<any>(null)

  useEffect(() => {
    // Load the animation JSON from public folder
    fetch('/animations/loading.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load animation:', err))
  }, [])

  const sizeMap = {
    sm: '80px',
    md: '120px',
    lg: '160px',
  }

  if (!animationData) {
    return <div style={{ width: sizeMap[size], height: sizeMap[size] }} />
  }

  return (
    <div style={{ width: sizeMap[size], height: sizeMap[size] }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
