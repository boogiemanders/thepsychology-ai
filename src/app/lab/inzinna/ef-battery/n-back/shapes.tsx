import { cn } from '@/lib/utils'

export const SHAPE_COUNT = 6

const SHAPE_NAMES = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'pentagon',
  'star',
] as const

export type ShapeName = (typeof SHAPE_NAMES)[number]

export function shapeNameFor(index: number): ShapeName {
  return SHAPE_NAMES[index % SHAPE_COUNT]
}

export function NBackShape({
  index,
  className,
}: {
  index: number
  className?: string
}) {
  const fill = 'fill-zinc-900 dark:fill-zinc-100'
  const common = cn('h-full w-full', fill, className)
  switch (shapeNameFor(index)) {
    case 'circle':
      return (
        <svg viewBox="0 0 200 200" className={common} aria-hidden="true">
          <circle cx="100" cy="100" r="80" />
        </svg>
      )
    case 'square':
      return (
        <svg viewBox="0 0 200 200" className={common} aria-hidden="true">
          <rect x="25" y="25" width="150" height="150" rx="6" />
        </svg>
      )
    case 'triangle':
      return (
        <svg viewBox="0 0 200 200" className={common} aria-hidden="true">
          <polygon points="100,20 180,170 20,170" />
        </svg>
      )
    case 'diamond':
      return (
        <svg viewBox="0 0 200 200" className={common} aria-hidden="true">
          <polygon points="100,15 185,100 100,185 15,100" />
        </svg>
      )
    case 'pentagon':
      return (
        <svg viewBox="0 0 200 200" className={common} aria-hidden="true">
          <polygon points="100,20 185,80 152,180 48,180 15,80" />
        </svg>
      )
    case 'star':
      return (
        <svg viewBox="0 0 200 200" className={common} aria-hidden="true">
          <polygon
            points="100,15 124,78 190,78 137,118 157,183 100,143 43,183 63,118 10,78 76,78"
          />
        </svg>
      )
  }
}
