'use client'

import React from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimplePromptInputProps {
  onSubmit: (message: string) => void
  placeholder?: string
  isLoading?: boolean
  className?: string
}

export const SimplePromptInput = React.forwardRef<HTMLDivElement, SimplePromptInputProps>(
  (
    {
      onSubmit,
      placeholder = "Ask a follow-up question...",
      isLoading = false,
      className
    },
    ref
  ) => {
    const [value, setValue] = React.useState('')
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Auto-expand textarea based on content
    React.useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        const scrollHeight = textareaRef.current.scrollHeight
        const maxHeight = 240 // 6 lines max
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
      }
    }, [value])

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

    return (
    <div
      ref={ref}
      className={cn(
        'flex items-end gap-3 rounded-2xl border border-brand-soft-blue/70 bg-brand-soft-blue/10 p-4 transition-all duration-200 shadow-lg',
        isLoading && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-lg bg-transparent text-white placeholder:text-brand-soft-blue/80',
          'border-none outline-none focus:ring-0',
          'max-h-[240px] overflow-y-auto',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'scrollbar-thin scrollbar-thumb-[#444444] scrollbar-track-transparent'
        )}
          style={{
            height: 'auto',
            minHeight: '44px'
          }}
        />

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !hasContent}
        className={cn(
          'flex-shrink-0 rounded-full p-2 transition-all duration-200',
          'flex items-center justify-center shadow',
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
