'use client'

import { useEffect, useRef } from 'react'

const COLS = 3
const DOT_RADIUS = 1.2
const DOT_GAP = 8
const PARTICLE_COUNT = 12

interface Particle {
  x: number
  y: number
  progress: number
  speed: number
  startY: number
  amplitude: number
  phase: number
}

interface Theme {
  r: number
  g: number
  b: number
  label: string
  boost: number // alpha multiplier for light mode visibility
}

function getTheme(): Theme {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    || document.documentElement.classList.contains('dark')
  return isDark
    ? { r: 16, g: 185, b: 129, label: 'rgba(113, 113, 122, 0.7)', boost: 1 }
    : { r: 5, g: 115, b: 80, label: 'rgba(63, 63, 70, 0.8)', boost: 2.2 }
}

function rgba(th: Theme, alpha: number) {
  return `rgba(${th.r}, ${th.g}, ${th.b}, ${Math.min(1, alpha * th.boost)})`
}

export function ProcessVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    let theme = getTheme()

    // Re-check theme on class changes (for Tailwind dark mode toggle)
    const observer = new MutationObserver(() => { theme = getTheme() })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // Also listen to system preference changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onMediaChange = () => { theme = getTheme() }
    mq.addEventListener('change', onMediaChange)

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = 160 * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = '160px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: 0, y: 0,
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
        startY: 40 + Math.random() * 80,
        amplitude: 8 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
      })
    }

    const draw = (time: number) => {
      const th = theme
      const t = time * 0.001
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)

      const colW = w / COLS
      const iconSize = 32
      const iconY = h / 2

      const pdf_cx = colW * 0.5
      const ext_cx = colW * 1.5
      const slide_cx = colW * 2.5

      drawPdfIcon(ctx, th, pdf_cx, iconY, iconSize, t)
      drawExtractIcon(ctx, th, ext_cx, iconY, iconSize, t)
      drawSlidesIcon(ctx, th, slide_cx, iconY, iconSize, t)

      // Labels
      ctx.font = '10px "SF Mono", "Fira Code", monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = th.label
      ctx.fillText('UPLOAD PDF', pdf_cx, iconY + iconSize + 16)
      ctx.fillText('EXTRACT', ext_cx, iconY + iconSize + 16)
      ctx.fillText('GET SLIDES', slide_cx, iconY + iconSize + 16)

      // Particle streams
      drawParticleStream(ctx, th, particles, 0, PARTICLE_COUNT / 2,
        pdf_cx + iconSize, iconY, ext_cx - iconSize, iconY, t)
      drawParticleStream(ctx, th, particles, PARTICLE_COUNT / 2, PARTICLE_COUNT,
        ext_cx + iconSize, iconY, slide_cx - iconSize, iconY, t)

      // Dot grids
      for (let col = 0; col < COLS; col++) {
        drawDotGrid(ctx, th, col * colW, 0, colW, h, t, col)
      }

      for (const p of particles) {
        p.progress += p.speed
        if (p.progress > 1) p.progress -= 1
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      observer.disconnect()
      mq.removeEventListener('change', onMediaChange)
    }
  }, [])

  return (
    <div ref={containerRef} className="mb-8 relative">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  )
}

function drawDotGrid(
  ctx: CanvasRenderingContext2D, th: Theme,
  x: number, y: number, w: number, h: number,
  t: number, colIdx: number
) {
  const offsetX = x + 20
  const offsetY = y + 10
  const cols = Math.floor((w - 40) / DOT_GAP)
  const rows = Math.floor((h - 20) / DOT_GAP)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = offsetX + c * DOT_GAP
      const dy = offsetY + r * DOT_GAP
      const dist = Math.sqrt(Math.pow(c - cols / 2, 2) + Math.pow(r - rows / 2, 2))
      const wave = Math.sin(dist * 0.4 - t * 1.5 + colIdx * 2) * 0.5 + 0.5
      const alpha = 0.03 + wave * 0.06

      ctx.beginPath()
      ctx.arc(dx, dy, DOT_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = rgba(th, alpha)
      ctx.fill()
    }
  }
}

function drawPdfIcon(
  ctx: CanvasRenderingContext2D, th: Theme,
  cx: number, cy: number, size: number, t: number
) {
  const half = size / 2
  const x = cx - half * 0.7
  const y = cy - half

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + size * 0.5, y)
  ctx.lineTo(x + size * 0.7, y + size * 0.2)
  ctx.lineTo(x + size * 0.7, y + size)
  ctx.lineTo(x, y + size)
  ctx.closePath()
  ctx.strokeStyle = rgba(th, 0.5)
  ctx.lineWidth = 1.2
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x + size * 0.5, y)
  ctx.lineTo(x + size * 0.5, y + size * 0.2)
  ctx.lineTo(x + size * 0.7, y + size * 0.2)
  ctx.strokeStyle = rgba(th, 0.3)
  ctx.lineWidth = 0.8
  ctx.stroke()

  for (let i = 0; i < 4; i++) {
    const lineY = y + size * 0.35 + i * 6
    const lineW = size * (0.3 + Math.sin(t * 2 + i) * 0.1)
    const alpha = 0.15 + Math.sin(t * 1.5 + i * 0.8) * 0.1
    ctx.fillStyle = rgba(th, alpha)
    ctx.fillRect(x + 5, lineY, lineW, 1.5)
  }

  const figAlpha = 0.2 + Math.sin(t * 2) * 0.1
  ctx.fillStyle = rgba(th, figAlpha)
  ctx.fillRect(x + size * 0.4, y + size * 0.4, 8, 6)
  ctx.fillRect(x + size * 0.4, y + size * 0.65, 8, 6)
}

function drawExtractIcon(
  ctx: CanvasRenderingContext2D, th: Theme,
  cx: number, cy: number, size: number, t: number
) {
  const radius = size * 0.5

  ctx.save()
  ctx.translate(cx, cy)

  const dashCount = 16
  for (let i = 0; i < dashCount; i++) {
    const angle = (i / dashCount) * Math.PI * 2 + t * 0.8
    const alpha = 0.15 + Math.sin(angle + t) * 0.15
    const x1 = Math.cos(angle) * (radius - 4)
    const y1 = Math.sin(angle) * (radius - 4)
    const x2 = Math.cos(angle) * radius
    const y2 = Math.sin(angle) * radius

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = rgba(th, alpha)
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  const chSize = 6
  const chAlpha = 0.3 + Math.sin(t * 3) * 0.15
  ctx.strokeStyle = rgba(th, chAlpha)
  ctx.lineWidth = 0.8

  ctx.beginPath()
  ctx.moveTo(-chSize, 0)
  ctx.lineTo(chSize, 0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, -chSize)
  ctx.lineTo(0, chSize)
  ctx.stroke()

  const bSize = 5
  const bOffset = radius * 0.55

  ctx.save()
  ctx.rotate(-t * 0.4)
  ctx.strokeStyle = rgba(th, 0.5)
  ctx.lineWidth = 1.2

  ctx.beginPath()
  ctx.moveTo(-bOffset, -bOffset + bSize)
  ctx.lineTo(-bOffset, -bOffset)
  ctx.lineTo(-bOffset + bSize, -bOffset)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(bOffset - bSize, -bOffset)
  ctx.lineTo(bOffset, -bOffset)
  ctx.lineTo(bOffset, -bOffset + bSize)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(-bOffset, bOffset - bSize)
  ctx.lineTo(-bOffset, bOffset)
  ctx.lineTo(-bOffset + bSize, bOffset)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(bOffset - bSize, bOffset)
  ctx.lineTo(bOffset, bOffset)
  ctx.lineTo(bOffset, bOffset - bSize)
  ctx.stroke()

  ctx.restore()
  ctx.restore()
}

function drawSlidesIcon(
  ctx: CanvasRenderingContext2D, th: Theme,
  cx: number, cy: number, size: number, t: number
) {
  const slideW = size * 0.55
  const slideH = size * 0.7

  for (let i = 2; i >= 0; i--) {
    const offset = i * 5
    const breathe = Math.sin(t * 1.2 + i * 0.6) * 1.5
    const x = cx - slideW / 2 + offset + breathe
    const y = cy - slideH / 2 - offset * 0.5

    ctx.strokeStyle = rgba(th, 0.2 + (2 - i) * 0.15)
    ctx.lineWidth = 1.2
    ctx.strokeRect(x, y, slideW, slideH)

    if (i === 0) {
      const figAlpha = 0.15 + Math.sin(t * 2) * 0.08
      ctx.fillStyle = rgba(th, figAlpha)
      ctx.fillRect(x + 4, y + 4, slideW - 8, slideH * 0.5)

      ctx.fillStyle = rgba(th, 0.2)
      ctx.fillRect(x + 4, y + slideH * 0.6, slideW * 0.7, 1.5)
      ctx.fillRect(x + 4, y + slideH * 0.7, slideW * 0.5, 1.5)
    }
  }
}

function drawParticleStream(
  ctx: CanvasRenderingContext2D, th: Theme,
  particles: Particle[],
  startIdx: number, endIdx: number,
  x1: number, y1: number,
  x2: number, y2: number,
  t: number
) {
  for (let i = startIdx; i < endIdx; i++) {
    const p = particles[i]
    const px = x1 + (x2 - x1) * p.progress
    const py = p.startY + Math.sin(p.progress * Math.PI * 2 + p.phase + t) * p.amplitude * 0.3

    const trailLen = 3
    for (let j = 0; j < trailLen; j++) {
      const tp = p.progress - j * 0.015
      if (tp < 0) continue
      const tx = x1 + (x2 - x1) * tp
      const ty = p.startY + Math.sin(tp * Math.PI * 2 + p.phase + t) * p.amplitude * 0.3
      const alpha = (0.3 - j * 0.1) * (0.5 + Math.sin(t * 3 + i) * 0.3)

      ctx.beginPath()
      ctx.arc(tx, ty, 1.5 - j * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = rgba(th, Math.max(0.05, alpha))
      ctx.fill()
    }

    const mainAlpha = 0.4 + Math.sin(t * 2 + i) * 0.2
    ctx.beginPath()
    ctx.arc(px, py, 2, 0, Math.PI * 2)
    ctx.fillStyle = rgba(th, mainAlpha)
    ctx.fill()
  }
}
