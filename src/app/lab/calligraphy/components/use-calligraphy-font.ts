'use client'

import { useEffect, useState } from 'react'
import type { CalligraphyFont } from './fonts'

const R2_BASE = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || ''
const FONT_PREFIX = 'calligraphy-fonts'
const MAX_CONCURRENT_FONT_LOADS = 2

const fontLoaders = new Map<string, Promise<boolean>>()
const pendingFontLoads: Array<() => void> = []
let activeFontLoads = 0

function getFontSource(font: CalligraphyFont) {
  return `url("${R2_BASE}/${FONT_PREFIX}/${encodeURIComponent(font.file)}") format("${font.format}")`
}

function isFontAvailable(family: string) {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return false
  }

  return document.fonts.check(`16px "${family}"`)
}

function runNextFontLoad() {
  if (activeFontLoads >= MAX_CONCURRENT_FONT_LOADS) {
    return
  }

  const next = pendingFontLoads.shift()
  if (next) {
    next()
  }
}

function scheduleFontLoad(task: () => Promise<boolean>, priority: boolean) {
  return new Promise<boolean>(resolve => {
    const run = () => {
      activeFontLoads += 1

      void task()
        .then(resolve)
        .finally(() => {
          activeFontLoads = Math.max(0, activeFontLoads - 1)
          runNextFontLoad()
        })
    }

    if (activeFontLoads < MAX_CONCURRENT_FONT_LOADS) {
      run()
      return
    }

    if (priority) {
      pendingFontLoads.unshift(run)
      return
    }

    pendingFontLoads.push(run)
  })
}

export async function loadCalligraphyFont(
  font: CalligraphyFont,
  options: { priority?: boolean } = {},
) {
  if (typeof window === 'undefined' || !R2_BASE) {
    return false
  }

  if (isFontAvailable(font.family)) {
    return true
  }

  const existing = fontLoaders.get(font.family)
  if (existing) {
    return existing
  }

  // Keep the queue short so mobile Safari is not asked to fetch and parse the full wall at once.
  const promise = scheduleFontLoad(async () => {
    try {
      if (isFontAvailable(font.family)) {
        return true
      }

      const fontFace = new FontFace(font.family, getFontSource(font))
      const loadedFace = await fontFace.load()
      document.fonts.add(loadedFace)
      return true
    } catch {
      fontLoaders.delete(font.family)
      return false
    }
  }, options.priority ?? false)

  fontLoaders.set(font.family, promise)
  return promise
}

export function useCalligraphyFont(
  font: CalligraphyFont | null,
  options: { enabled?: boolean; priority?: boolean } = {},
) {
  const enabled = options.enabled ?? true
  const priority = options.priority ?? false
  const family = font?.family ?? null
  const [isLoaded, setIsLoaded] = useState(() => (family ? isFontAvailable(family) : false))

  useEffect(() => {
    if (!enabled || !font) {
      setIsLoaded(false)
      return
    }

    let isActive = true
    setIsLoaded(isFontAvailable(font.family))

    void loadCalligraphyFont(font, { priority }).then(loaded => {
      if (isActive) {
        setIsLoaded(loaded)
      }
    })

    return () => {
      isActive = false
    }
  }, [enabled, font, priority])

  return isLoaded
}
