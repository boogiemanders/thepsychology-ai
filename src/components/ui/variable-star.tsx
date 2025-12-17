'use client'

import { useRef, useEffect, useState } from 'react'

const STAR_COUNT = 8
const STAR_IMAGES = Array.from({ length: STAR_COUNT }, (_, i) => `/images/stars/star-${i + 1}.png`)
const STAR_HOVER_GIF = '/images/stars/star-hover.gif'

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
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const nextIndex = getNextStarIndex(lastIndexRef.current)
    lastIndexRef.current = nextIndex
    setStarSrc(STAR_IMAGES[nextIndex])
  }, [])

  if (!starSrc) return null

  const displaySrc = isHovered ? STAR_HOVER_GIF : starSrc

  if (onClick) {
    return (
      <button
        type="button"
        className={`cursor-pointer ${className}`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={title}
      >
        <img src={displaySrc} alt="Star" className="inline-block w-5 h-5 dark:invert" />
      </button>
    )
  }

  return (
    <img
      src={displaySrc}
      alt="Star"
      className={`inline-block w-5 h-5 dark:invert cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  )
}
