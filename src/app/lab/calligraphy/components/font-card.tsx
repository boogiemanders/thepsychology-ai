'use client'

import { useInView } from 'motion/react'
import { useCallback, useRef, type DragEvent } from 'react'
import type { CalligraphyFont } from './fonts'
import { loadCalligraphyFont, useCalligraphyFont } from './use-calligraphy-font'

interface FontCardProps {
  font: CalligraphyFont
  text: string
  isSelected: boolean
  onSelect: (family: string) => void
}

async function downloadFontImage(font: CalligraphyFont, text: string) {
  const isReady = await loadCalligraphyFont(font, { priority: true })
  if (!isReady) return

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const fontSize = 120
  const padding = 60
  const lineHeight = fontSize * 1.5
  const maxWidth = 800

  ctx.font = `${fontSize}px "${font.family}", serif`

  const chars = [...text]
  const lines: string[] = []
  let currentLine = ''

  for (const char of chars) {
    const testLine = currentLine + char
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine)
      currentLine = char
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const textWidth = Math.min(maxWidth, Math.max(...lines.map(l => ctx.measureText(l).width)))

  canvas.width = (textWidth + padding * 2) * 2
  canvas.height = (lines.length * lineHeight + padding * 2) * 2
  ctx.scale(2, 2)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.font = `${fontSize}px "${font.family}", serif`
  ctx.fillStyle = '#1a1a1a'
  ctx.textBaseline = 'top'

  lines.forEach((line, i) => {
    ctx.fillText(line, padding, padding + i * lineHeight)
  })

  ctx.font = '14px "Cormorant Garamond", Georgia, serif'
  ctx.fillStyle = '#a0a0a0'
  ctx.textBaseline = 'bottom'
  ctx.fillText(font.label, padding, canvas.height / 2 - 12)

  const link = document.createElement('a')
  link.download = `${font.family}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function FontCard({ font, text, isSelected, onSelect }: FontCardProps) {
  const cardRef = useRef<HTMLButtonElement | null>(null)
  const isInView = useInView(cardRef, { once: true, margin: '200px 0px 200px 0px' })
  const shouldLoadFont = isSelected || isInView
  const isFontLoaded = useCalligraphyFont(font, { enabled: shouldLoadFont, priority: isSelected })

  const handleDragStart = useCallback(
    (e: DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', font.family)
      ;(e.currentTarget as HTMLElement).classList.add('is-dragging')
    },
    [font.family],
  )

  const handleDragEnd = useCallback((e: DragEvent) => {
    ;(e.currentTarget as HTMLElement).classList.remove('is-dragging')
    document.querySelectorAll('.cs-font-grid.drag-over').forEach(el => el.classList.remove('drag-over'))
  }, [])

  return (
    <button
      ref={cardRef}
      type="button"
      className={`cs-font-card${isSelected ? ' is-selected' : ''}${shouldLoadFont && !isFontLoaded ? ' is-font-loading' : ''}`}
      draggable
      aria-pressed={isSelected}
      aria-busy={shouldLoadFont && !isFontLoaded}
      onClick={() => onSelect(font.family)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <h3>
        {font.label}
        {font.note && <p className="cs-font-card-note">{font.note}</p>}
      </h3>
      <div className="cs-font-sample" style={{ fontFamily: `"${font.family}", serif` }}>
        {text}
      </div>
      <div className="cs-font-card-actions">
        <button
          type="button"
          className="cs-font-card-download"
          title="Download as PNG"
          onClick={async e => {
            e.stopPropagation()
            await downloadFontImage(font, text)
          }}
        >
          PNG
        </button>
      </div>
    </button>
  )
}
