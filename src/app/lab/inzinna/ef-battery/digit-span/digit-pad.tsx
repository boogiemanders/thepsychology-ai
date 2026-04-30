'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DigitPadProps {
  value: number[]
  maxLength: number
  disabled?: boolean
  onDigit: (digit: number, source: 'keyboard' | 'pad') => void
  onBackspace: () => void
  onSubmit: () => void
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export function DigitPad({
  value,
  maxLength,
  disabled,
  onDigit,
  onBackspace,
  onSubmit,
}: DigitPadProps) {
  useEffect(() => {
    if (disabled) return
    const handleKey = (evt: KeyboardEvent) => {
      if (evt.key >= '1' && evt.key <= '9') {
        if (value.length < maxLength) {
          evt.preventDefault()
          onDigit(Number(evt.key), 'keyboard')
        }
      } else if (evt.key === 'Backspace') {
        if (value.length > 0) {
          evt.preventDefault()
          onBackspace()
        }
      } else if (evt.key === 'Enter') {
        if (value.length > 0) {
          evt.preventDefault()
          onSubmit()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [disabled, maxLength, onBackspace, onDigit, onSubmit, value.length])

  return (
    <div className="space-y-4">
      <div className="flex min-h-[72px] items-center justify-center rounded-md border border-zinc-200 bg-zinc-50/50 px-4 py-3 font-mono text-3xl tracking-[0.3em] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-100">
        {value.length === 0 ? (
          <span className="font-sans text-[13px] tracking-normal text-zinc-400 dark:text-zinc-500">
            Type the digits you heard
          </span>
        ) : (
          value.join('')
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled || value.length >= maxLength}
            onClick={() => onDigit(d, 'pad')}
            className={cn(
              'aspect-[3/2] rounded-md border border-zinc-200 font-mono text-xl font-medium text-zinc-900 transition-colors',
              'hover:bg-zinc-100 active:bg-zinc-200',
              'dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800/60 dark:active:bg-zinc-800',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={onBackspace}
          className={cn(
            'h-11 rounded-md border border-zinc-200 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600 transition-colors',
            'hover:bg-zinc-100 active:bg-zinc-200',
            'dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          Backspace
        </button>
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={onSubmit}
          className={cn(
            'h-11 rounded-md bg-zinc-900 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-50 transition-colors',
            'hover:bg-zinc-800 active:bg-zinc-700',
            'dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          Submit
        </button>
      </div>
    </div>
  )
}
