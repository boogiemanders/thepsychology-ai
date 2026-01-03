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

  // Modify SVG to be responsive - add width="100%" height="auto" and preserve aspect ratio
  const responsiveSvg = svgContent
    .replace(/<svg([^>]*)width="[^"]*"/, '<svg$1width="100%"')
    .replace(/<svg([^>]*)height="[^"]*"/, '<svg$1height="auto"')
    // If no width attribute, add it after <svg
    .replace(/<svg(?![^>]*width=)/, '<svg width="100%" height="auto" ')

  return (
    <span
      className={`inline-svg-container block w-full max-w-full overflow-hidden ${className || ''}`}
      role="img"
      aria-label={alt}
      dangerouslySetInnerHTML={{ __html: responsiveSvg }}
      style={{ maxWidth: '100%' }}
    />
  )
}
