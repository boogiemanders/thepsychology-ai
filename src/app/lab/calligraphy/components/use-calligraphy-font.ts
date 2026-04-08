'use client'

import { useEffect, useState } from 'react'
import type { CalligraphyFont } from './fonts'

const MAX_CONCURRENT_FONT_LOADS = 1
const LOCAL_FONT_PREFIX = 'calligraphy-fonts-woff'

const loadedFontFamilies = new Set<string>()
const fontLoaders = new Map<string, Promise<boolean>>()
const pendingFontLoads: Array<() => void> = []
let activeFontLoads = 0

function getFontSource(font: CalligraphyFont) {
  if (font.storage === 'local') {
    return `url("/${LOCAL_FONT_PREFIX}/${encodeURIComponent(font.file)}") format("${font.format}")`
  }

  const params = new URLSearchParams({ file: font.file })
  return `url("/api/lab/calligraphy/font?${params.toString()}") format("${font.format}")`
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
  if (typeof window === 'undefined') {
    return false
  }

  if (loadedFontFamilies.has(font.family)) {
    return true
  }

  const existing = fontLoaders.get(font.family)
  if (existing) {
    return existing
  }

  // Keep the queue short so mobile Safari is not asked to fetch and parse the full wall at once.
  const promise = scheduleFontLoad(async () => {
    try {
      if (loadedFontFamilies.has(font.family)) {
        return true
      }

      const fontFace = new FontFace(font.family, getFontSource(font))
      const loadedFace = await fontFace.load()
      document.fonts.add(loadedFace)
      loadedFontFamilies.add(font.family)
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
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!enabled || !font) {
      setIsLoaded(false)
      return
    }

    if (loadedFontFamilies.has(font.family)) {
      setIsLoaded(true)
      return
    }

    let isActive = true
    setIsLoaded(false)

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
