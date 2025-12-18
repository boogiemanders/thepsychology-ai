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

export function VariableStar({ className = "", onClick, title, color }: {
  className?: string
  onClick?: () => void
  title?: string
  color?: string
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

  // Determine if we should apply custom color
  const hasCustomColor = color && color !== '#000000'
  const imgClassName = hasCustomColor
    ? "inline-block w-8 h-8"
    : "inline-block w-8 h-8 dark:invert"

  // Convert hex to RGB for filter application
  const getColorFilter = (hexColor: string) => {
    // Simple approach: use drop-shadow with the color
    return `drop-shadow(0 0 0 ${hexColor})`
  }

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
        <span style={hasCustomColor ? { display: 'inline-block', backgroundColor: color, WebkitMaskImage: `url(${displaySrc})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskImage: `url(${displaySrc})`, maskSize: 'contain', maskRepeat: 'no-repeat', width: '32px', height: '32px' } : {}}>
          {!hasCustomColor && <img src={displaySrc} alt="Star" className={imgClassName} />}
        </span>
      </button>
    )
  }

  if (hasCustomColor) {
    return (
      <span
        style={{ display: 'inline-block', backgroundColor: color, WebkitMaskImage: `url(${displaySrc})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskImage: `url(${displaySrc})`, maskSize: 'contain', maskRepeat: 'no-repeat', width: '32px', height: '32px', cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    )
  }

  return (
    <img
      src={displaySrc}
      alt="Star"
      className={`${imgClassName} cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  )
}
