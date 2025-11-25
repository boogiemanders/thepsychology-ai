'use client'

import React from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'

interface SimplePromptInputProps {
  onSubmit: (message: string) => void
  placeholder?: string
  isLoading?: boolean
  className?: string
  compact?: boolean
  framed?: boolean
}

export const SimplePromptInput = React.forwardRef<HTMLDivElement, SimplePromptInputProps>(
  (
    {
      onSubmit,
      placeholder = "Ask a follow-up question...",
      isLoading = false,
      className,
      compact = false,
      framed = true
    },
    ref
  ) => {
    const [value, setValue] = React.useState('')
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const [hasShinyRun, setHasShinyRun] = React.useState(false)

    // Run shiny text animation once on mount
    React.useEffect(() => {
      if (hasShinyRun) return
      const timer = setTimeout(() => setHasShinyRun(true), 3200)
      return () => clearTimeout(timer)
    }, [hasShinyRun])

    // Auto-expand textarea based on content
    React.useEffect(() => {
      if (textareaRef.current) {
        const baseHeight = compact ? 36 : 48
        const maxHeight = compact ? baseHeight : 240 // keep compact close to a single line
        textareaRef.current.style.height = 'auto'
        const scrollHeight = textareaRef.current.scrollHeight
        const targetHeight = Math.min(Math.max(scrollHeight, baseHeight), maxHeight)
        textareaRef.current.style.height = `${targetHeight}px`
      }
    }, [value, compact])

    const handleSubmit = () => {
      if (value.trim()) {
        onSubmit(value.trim())
        setValue('')
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    }

    const hasContent = value.trim().length > 0
    const showShiny = !hasShinyRun && !isLoading && !hasContent

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-end gap-3 rounded-2xl transition-all duration-200',
          framed ? 'border border-brand-soft-blue/70 bg-brand-soft-blue/10 shadow-lg' : 'bg-transparent',
          compact ? 'px-3 py-1.5' : 'p-4',
          isLoading && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        {/* Textarea + shiny placeholder overlay */}
        <div className="relative flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={showShiny ? '' : placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg bg-transparent text-foreground dark:text-white placeholder:text-muted-foreground/70 dark:placeholder:text-brand-soft-blue/80 transition-all duration-200',
              'border-none outline-none focus:ring-0',
              'max-h-[240px] overflow-y-auto',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'scrollbar-thin scrollbar-thumb-[#444444] scrollbar-track-transparent',
              compact ? 'text-sm' : 'text-base'
            )}
            style={{
              height: 'auto',
              minHeight: compact ? '32px' : '48px',
              maxHeight: compact ? '32px' : undefined
            }}
          />

          {showShiny && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-0.5">
              <AnimatedShinyText className={cn('text-sm text-foreground/70 dark:text-white/80', compact ? '' : '')}>
                {placeholder}
              </AnimatedShinyText>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !hasContent}
          className={cn(
            'flex-shrink-0 rounded-full transition-all duration-200',
            'flex items-center justify-center shadow',
            compact ? 'p-1.5' : 'p-2.5',
            hasContent && !isLoading
              ? 'bg-brand-soft-blue text-white hover:bg-brand-soft-blue/90 cursor-pointer'
              : 'bg-border text-muted-foreground cursor-not-allowed',
            'disabled:opacity-50'
          )}
          title={isLoading ? 'Generating response...' : 'Send message (Enter)'}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    )
  }
)

SimplePromptInput.displayName = 'SimplePromptInput'
