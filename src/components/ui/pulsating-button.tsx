'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PulsatingButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  pulseColor?: string
  duration?: string
  active?: boolean
  style?: React.CSSProperties
}

export function PulsatingButton({
  className,
  children,
  pulseColor,
  duration,
  active = true,
  style,
  ...props
}: PulsatingButtonProps) {
  const styleVars: React.CSSProperties = { ...style }
  if (pulseColor) {
    styleVars['--pulse-color'] = pulseColor
  }
  if (duration) {
    styleVars['--pulse-duration'] = duration
  }

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={styleVars}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-1 rounded-full border transition-opacity duration-300',
          active ? 'opacity-90 animate-magic-pulse' : 'opacity-0'
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
