'use client'

import { useState, useCallback } from 'react'

interface TranslateResult {
  translation: string
  model: string
}

export function useTranslate() {
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const translate = useCallback(async (text: string, targetVariant: string): Promise<TranslateResult | null> => {
    setIsTranslating(true)
    setError(null)

    try {
      const res = await fetch('/api/lab/calligraphy/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetVariant }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Translation failed.')
      }

      return data as TranslateResult
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed.')
      return null
    } finally {
      setIsTranslating(false)
    }
  }, [])

  return { translate, isTranslating, error }
}
