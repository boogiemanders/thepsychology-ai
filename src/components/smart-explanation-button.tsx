'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface SmartExplanationButtonProps {
  question: string
  options: string[]
  correctAnswer: string
  selectedAnswer: string
  topicName: string
  domain: string
  userId?: string | null
}

export function SmartExplanationButton({
  question,
  options,
  correctAnswer,
  selectedAnswer,
  topicName,
  domain,
  userId,
}: SmartExplanationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateExplanation = useCallback(async () => {
    if (explanation) return // Already generated, use cached

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/smart-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          options,
          correctAnswer,
          selectedAnswer,
          topicName,
          domain,
          userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate explanation')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setExplanation(fullText)
      }
    } catch (err) {
      console.error('[SmartExplanationButton] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate explanation')
    } finally {
      setIsLoading(false)
    }
  }, [question, options, correctAnswer, selectedAnswer, topicName, domain, userId, explanation])

  return (
    <div className="mt-3">
      {!explanation && !isLoading && (
        <Button
          variant="outline"
          size="sm"
          onClick={generateExplanation}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Explain Why I Got This Wrong
        </Button>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating personalized explanation...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 py-2">
          {error}
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setError(null)
              setExplanation(null)
              generateExplanation()
            }}
            className="ml-2 text-red-500 underline"
          >
            Try again
          </Button>
        </div>
      )}

      {explanation && (
        <div className="mt-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
            Personalized Explanation
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
