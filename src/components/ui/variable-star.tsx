'use client'

import { useRef, useEffect, useState } from 'react'

const STAR_COUNT = 8
const STAR_IMAGES = Array.from({ length: STAR_COUNT }, (_, i) => `/images/stars/star-${i + 1}.png`)

// Get a random star index different from the last one
function getNextStarIndex(lastIndex: number): number {
  let nextIndex = Math.floor(Math.random() * STAR_COUNT)
  while (nextIndex === lastIndex && STAR_COUNT > 1) {
    nextIndex = Math.floor(Math.random() * STAR_COUNT)
  }
  return nextIndex
}

export function VariableStar({ className = "", onClick, title }: {
  className?: string
  onClick?: () => void
  title?: string
}) {
  const lastIndexRef = useRef(-1)
  const [starSrc, setStarSrc] = useState('')

  useEffect(() => {
    const nextIndex = getNextStarIndex(lastIndexRef.current)
    lastIndexRef.current = nextIndex
    setStarSrc(STAR_IMAGES[nextIndex])
  }, [])

  if (!starSrc) return null

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        title={title}
      >
        <img src={starSrc} alt="Star" className="inline-block w-5 h-5 dark:invert" />
      </button>
    )
  }

  return <img src={starSrc} alt="Star" className={`inline-block w-5 h-5 dark:invert ${className}`} />
}
