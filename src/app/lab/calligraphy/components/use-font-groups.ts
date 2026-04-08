'use client'

import { useState, useCallback, useEffect } from 'react'
import type { CalligraphyFont } from './fonts'

const STORAGE_KEY = 'calligraphy-font-groups'

export function useFontGroups(fonts: CalligraphyFont[]) {
  const [groupMap, setGroupMap] = useState<Record<string, 'brush' | 'pen'>>(() => {
    const defaults: Record<string, 'brush' | 'pen'> = {}
    for (const f of fonts) defaults[f.family] = f.style
    return defaults
  })

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as Record<string, string>
      setGroupMap(prev => {
        const next = { ...prev }
        for (const [family, style] of Object.entries(saved)) {
          if (next[family] && (style === 'brush' || style === 'pen')) {
            next[family] = style
          }
        }
        return next
      })
    } catch {}
  }, [])

  const moveFont = useCallback((family: string, newStyle: 'brush' | 'pen') => {
    setGroupMap(prev => {
      const next = { ...prev, [family]: newStyle }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getFontsByGroup = useCallback(
    (groupKey: 'brush' | 'pen') => fonts.filter(f => groupMap[f.family] === groupKey),
    [fonts, groupMap],
  )

  return { groupMap, getFontsByGroup, moveFont }
}
