'use client'

import { useEffect, useState } from 'react'

interface InlineSvgProps {
  src: string
  alt?: string
  className?: string
}

export function InlineSvg({ src, alt, className }: InlineSvgProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!src.endsWith('.svg')) {
      setError(true)
      return
    }

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch SVG')
        return res.text()
      })
      .then((text) => {
        setSvgContent(text)
      })
      .catch(() => {
        setError(true)
      })
  }, [src])

  if (error) {
    // Fallback to regular img tag
    return <img src={src} alt={alt || ''} className={className} />
  }

  if (!svgContent) {
    // Loading placeholder - use span to avoid hydration errors when inside <p> tags
    return <span className={`block animate-pulse bg-muted rounded-lg h-48 ${className || ''}`} />
  }

  return (
    <span
      className={`inline-svg-container block ${className || ''}`}
      role="img"
      aria-label={alt}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
