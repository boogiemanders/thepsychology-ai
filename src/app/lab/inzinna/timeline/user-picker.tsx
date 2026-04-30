'use client'

import { cn } from '@/lib/utils'
import type { TimelineCollaborator, TimelineProject } from './use-timeline'

// Inzinna brand palette (matches the VIEWING row pastels)
const COLLAB_COLORS: Record<string, string> = {
  AC: '#FFB990', // peach
  BR: '#9DADE5', // peri (periwinkle)
  CA: '#F1E29D', // sun
  FI: '#8AE08D', // mint
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
  projects?: TimelineProject[]
}

interface Workload {
  total: number   // projects this person is on
  leading: number // projects this person leads
  steps: number   // total open steps assigned to them
  done: number    // total steps already done by them
}

function computeWorkload(initials: string, projects: TimelineProject[]): Workload {
  let total = 0
  let leading = 0
  let steps = 0
  let done = 0
  for (const p of projects) {
    if (p.contributors.includes(initials)) total++
    const leadId = p.lead ?? p.contributors[0] ?? null
    if (leadId === initials) leading++
    for (const s of p.steps) {
      if (s.done && s.done_by === initials) done++
    }
    if (p.contributors.includes(initials)) {
      steps += p.steps.filter(s => !s.done).length
    }
  }
  return { total, leading, steps, done }
}

export function UserPicker({ collaborators, activeUser, onPick, projects = [] }: UserPickerProps) {
  const active = collaborators.find(c => c.initials === activeUser)
  const maxLoad = Math.max(1, ...collaborators.filter(c => !c.neutral).map(c => computeWorkload(c.initials, projects).total))

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mr-1">
        Editing as
      </span>
      <div className="flex items-center gap-1 flex-wrap">
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

          const load = c.neutral ? null : computeWorkload(c.initials, projects)
          const loadPct = load ? Math.round((load.total / maxLoad) * 100) : 0
          const overloaded = load && load.total >= 8

          return (
            <button
              key={c.initials}
              type="button"
              onClick={() => onPick(isActive ? null : c.initials)}
              title={
                load
                  ? `${c.name} — on ${load.total} project${load.total === 1 ? '' : 's'}, leads ${load.leading}, ${load.steps} open steps, ${load.done} done`
                  : isActive ? `Signed in as ${c.name} — click to sign out` : `Edit as ${c.name}`
              }
              className={cn(
                'relative flex items-center gap-1.5 rounded-full border pl-1 pr-2.5 py-1 text-[11px] font-mono transition-all cursor-pointer',
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

              {load && (
                <>
                  {/* Project count + lead count */}
                  <span className={cn(
                    'tabular-nums text-[10px] font-mono ml-1',
                    overloaded ? 'text-red-400' : 'text-zinc-500 dark:text-zinc-400'
                  )}>
                    {load.total}{load.leading > 0 && <span className="text-white/55">·{load.leading}L</span>}
                  </span>
                  {/* Workload bar — width = projects relative to busiest person */}
                  <span className="hidden md:inline-block w-10 h-[3px] rounded bg-white/10 overflow-hidden ml-1">
                    <span
                      className={cn('block h-full', overloaded ? 'bg-red-400' : 'bg-white/55')}
                      style={{ width: `${loadPct}%` }}
                    />
                  </span>
                </>
              )}
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
