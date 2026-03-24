'use client'

import { useEffect, useRef, type ComponentPropsWithoutRef, type FC } from 'react'
import { cn } from '@/lib/utils'

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<'span'> {
  shimmerWidth?: number
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  ...props
}) => {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.backgroundSize = `${shimmerWidth}px 100%`
    el.style.backgroundRepeat = 'no-repeat'
    el.style.backgroundImage =
      'linear-gradient(to right, transparent, rgba(255,255,255,0.8) 50%, transparent)'
    el.style.backgroundClip = 'text'
    el.style.setProperty('-webkit-background-clip', 'text')
    el.style.backgroundPosition = `calc(-100% - ${shimmerWidth}px) 0`

    const keyframes = [
      { backgroundPosition: `calc(-100% - ${shimmerWidth}px) 0` },
      { backgroundPosition: `calc(100% + ${shimmerWidth}px) 0`, offset: 0.3 },
      { backgroundPosition: `calc(100% + ${shimmerWidth}px) 0`, offset: 0.6 },
      { backgroundPosition: `calc(-100% - ${shimmerWidth}px) 0` },
    ]

    el.animate(keyframes, {
      duration: 4000,
      easing: 'ease-in-out',
      iterations: Infinity,
    })
  }, [shimmerWidth])

  return (
    <span
      ref={ref}
      className={cn(
        'mx-auto max-w-md text-neutral-600/70 dark:text-neutral-400/70',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
