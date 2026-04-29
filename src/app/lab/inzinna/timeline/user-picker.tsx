'use client'

import { cn } from '@/lib/utils'
import type { TimelineCollaborator } from './use-timeline'

// Inzinna brand palette (matches the VIEWING row pastels)
const COLLAB_COLORS: Record<string, string> = {
  AC: '#FFE7DA', // peach-50
  BR: '#DFD7E2', // lavender
  CA: '#F1E29D', // sun
  FI: '#E8F9E8', // mint-50
  GI: '#3362FF', // royal
  LO: '#5F396D', // plum
  TM: '#F1E29D', // sun
  JC: '#5F396D', // plum
}

function isLightHex(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160
}

interface UserPickerProps {
  collaborators: TimelineCollaborator[]
  activeUser: string | null
  onPick: (initials: string | null) => void
}

export function UserPicker({ collaborators, activeUser, onPick }: UserPickerProps) {
  const active = collaborators.find(c => c.initials === activeUser)

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mr-1">
        Editing as
      </span>
      <div className="flex items-center gap-1">
        {collaborators.map(c => {
          const isActive = c.initials === activeUser
          const hex = COLLAB_COLORS[c.initials]
          const bgDark = c.neutral
            ? 'hsl(0 0% 22%)'
            : hex
              ? hex
              : `hsl(${c.hue} 26% 28%)`
          const fgDark = c.neutral
            ? 'hsl(0 0% 78%)'
            : hex
              ? (isLightHex(hex) ? '#111' : '#fff')
              : `hsl(${c.hue} 34% 82%)`

          return (
            <button
              key={c.initials}
              type="button"
              onClick={() => onPick(isActive ? null : c.initials)}
              title={isActive ? `Signed in as ${c.name} — click to sign out` : `Edit as ${c.name}`}
              className={cn(
                'relative flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-all cursor-pointer',
                isActive
                  ? 'border-zinc-900 dark:border-zinc-100 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
              )}
            >
              {/* Avatar chip */}
              <span
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] uppercase tracking-[0.04em] shrink-0',
                  isActive && 'ring-1 ring-zinc-900 dark:ring-zinc-100'
                )}
                style={{ backgroundColor: bgDark, color: fgDark }}
              >
                {c.initials}
              </span>

              <span className={cn(
                'hidden sm:inline',
                isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'
              )}>
                {c.name}
              </span>
            </button>
          )
        })}
      </div>
      {!active && (
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
          Pick a name to start editing
        </span>
      )}
    </div>
  )
}
