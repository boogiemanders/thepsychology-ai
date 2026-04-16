'use client'

import { cn } from '@/lib/utils'
import type { TimelineCollaborator } from './use-timeline'

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
          const bgLight = c.neutral ? 'hsl(0 0% 88%)' : `hsl(${c.hue} 32% 82%)`
          const bgDark = c.neutral ? 'hsl(0 0% 22%)' : `hsl(${c.hue} 26% 28%)`
          const fgLight = c.neutral ? 'hsl(0 0% 28%)' : `hsl(${c.hue} 38% 26%)`
          const fgDark = c.neutral ? 'hsl(0 0% 78%)' : `hsl(${c.hue} 34% 82%)`

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
