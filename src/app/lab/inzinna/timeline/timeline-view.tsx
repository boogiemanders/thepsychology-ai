'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useTimeline, type TimelineProject, type TimelineCollaborator, type TimelinePhase, type TimelineStep } from './use-timeline'
import { MONTH_META, fractionToDate, dateToFraction, daysInMonth } from './date-utils'
import { UserPicker } from './user-picker'
import { AddProjectForm } from './add-project-form'

// ---------- Types ----------

type PriorityLevel = 'high' | 'medium' | 'low'
type PhaseKind = 'build' | 'test' | 'rollout' | 'live' | 'wait'

interface Month {
  key: string
  label: string
  short: string
  days: number
}

// ---------- Color tokens ----------

const PRIORITY: Record<PriorityLevel, { label: string; bar: string; fill: string; border: string; text: string }> = {
  high:   { label: 'High',   bar: 'bg-[#d87758]', fill: 'bg-[#d87758]/18 dark:bg-[#d87758]/22', border: 'border-[#d87758]/70', text: 'text-[#b3563a] dark:text-[#e89477]' },
  medium: { label: 'Medium', bar: 'bg-[#788c5d]', fill: 'bg-[#788c5d]/20 dark:bg-[#788c5d]/25', border: 'border-[#788c5d]/70', text: 'text-[#556a3f] dark:text-[#a3bc88]' },
  low:    { label: 'Low',    bar: 'bg-[#6a9bcc]', fill: 'bg-[#6a9bcc]/18 dark:bg-[#6a9bcc]/22', border: 'border-[#6a9bcc]/70', text: 'text-[#497aae] dark:text-[#93bce0]' },
}

const STATUS_CFG: Record<string, { label: string; dot: string; text: string }> = {
  live:     { label: 'Live',     dot: 'bg-emerald-500',               text: 'text-emerald-600 dark:text-emerald-500' },
  building: { label: 'Building', dot: 'bg-zinc-400 dark:bg-zinc-500', text: 'text-zinc-500 dark:text-zinc-400' },
  blocked:  { label: 'Blocked',  dot: 'bg-amber-500',                 text: 'text-amber-600 dark:text-amber-500' },
  idea:     { label: 'Idea',     dot: 'bg-zinc-300 dark:bg-zinc-700', text: 'text-zinc-400 dark:text-zinc-600' },
  done:     { label: 'Done',     dot: 'bg-emerald-500',               text: 'text-emerald-600 dark:text-emerald-500' },
}

function priorityBorderColor(p: PriorityLevel): string {
  return p === 'high' ? '#d87758' : p === 'medium' ? '#788c5d' : '#6a9bcc'
}

function isoToPosition(iso: string, months: Month[]): number {
  const parts = iso.split('-')
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  if (!m || !d) return 0
  const monthIndex = m - 4
  if (monthIndex < 0) return 0
  if (monthIndex >= months.length) return 1
  const frac = Math.min(1, (d - 1) / months[monthIndex].days)
  return (monthIndex + frac) / months.length
}

// ---------- Shell (entry point from page.tsx) ----------

interface ShellProps {
  initialProjects: TimelineProject[]
  initialCollaborators: TimelineCollaborator[]
  months: Month[]
  todayIso: string
}

export function TimelineShell({ initialProjects, initialCollaborators, months, todayIso }: ShellProps) {
  const timeline = useTimeline(initialProjects, initialCollaborators)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all')
  const [showAddForm, setShowAddForm] = useState(false)

  const today = useMemo(() => isoToPosition(todayIso, months), [todayIso, months])
  const visible = timeline.projects.filter(p => priorityFilter === 'all' || p.priority === priorityFilter)

  // Build contributor lookup for chips
  const collabLookup = useMemo(() => {
    const map: Record<string, TimelineCollaborator> = {}
    for (const c of timeline.collaborators) map[c.initials] = c
    return map
  }, [timeline.collaborators])

  const stepsDone = timeline.projects.reduce((sum, p) => sum + p.steps.filter(s => s.done).length, 0)
  const stepsTotal = timeline.projects.reduce((sum, p) => sum + p.steps.length, 0)

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Back */}
        <Link href="/lab#projects" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-10">
          &larr; Lab
        </Link>

        {/* Header */}
        <header className="mb-10">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3">
            Inzinna Practice Automation
          </p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 text-zinc-900 dark:text-zinc-50">
                Leadership Timeline
              </h1>
              <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
                Every leadership project, month by month. Pick your name to start checking things off and editing dates.
              </p>
            </div>
            {timeline.activeUser && (
              <button
                type="button"
                onClick={() => setShowAddForm(v => !v)}
                className="shrink-0 px-4 py-2 text-[12px] font-mono border border-zinc-200 dark:border-zinc-800 rounded-md hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
              >
                + Add project
              </button>
            )}
          </div>

          {/* User picker */}
          <div className="mt-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <UserPicker
              collaborators={timeline.collaborators}
              activeUser={timeline.activeUser}
              onPick={timeline.pickUser}
            />
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3">
            <Stat label="Projects" value={String(timeline.projects.length)} />
            <Stat label="Steps done" value={`${stepsDone} / ${stepsTotal}`} mono />
            <Stat label="Window" value="Apr – Jul 2026" mono />
            <Stat label="High priority" value={String(timeline.projects.filter(p => p.priority === 'high').length)} />
          </div>
        </header>

        {/* Add project form */}
        {showAddForm && timeline.activeUser && (
          <div className="mb-8">
            <AddProjectForm
              collaborators={timeline.collaborators}
              activeUser={timeline.activeUser}
              onSubmit={timeline.addProject}
              onClose={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Legend + filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
            <LegendSwatch cls={PRIORITY.high.bar} label="High" />
            <LegendSwatch cls={PRIORITY.medium.bar} label="Medium" />
            <LegendSwatch cls={PRIORITY.low.bar} label="Low" />
            <span className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <PhaseSwatchLegend kind="build" label="Build" />
            <PhaseSwatchLegend kind="test" label="Test" />
            <PhaseSwatchLegend kind="rollout" label="Rollout" />
            <PhaseSwatchLegend kind="wait" label="Waiting" />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.12em]">
            {(['all', 'high', 'medium', 'low'] as const).map(f => (
              <button
                key={f}
                onClick={() => setPriorityFilter(f)}
                className={cn(
                  'px-2.5 py-1 rounded-sm border transition-colors cursor-pointer',
                  priorityFilter === f
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop timeline grid */}
        <div className="hidden md:block">
          <MonthHeader months={months} today={today} />
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            {visible.map(p => (
              <TimelineRow
                key={p.id}
                project={p}
                months={months}
                today={today}
                collabLookup={collabLookup}
                isExpanded={expandedId === p.id}
                canEdit={!!timeline.activeUser}
                onToggle={() => setExpandedId(prev => (prev === p.id ? null : p.id))}
                onToggleStep={(idx) => timeline.toggleStep(p.id, idx)}
                onPhasesCommit={(phases) => timeline.updatePhases(p.id, phases)}
                onMilestoneCommit={(ms) => timeline.updateMilestone(p.id, ms)}
              />
            ))}
          </ul>
        </div>

        {/* Mobile month-stacked */}
        <div className="md:hidden mt-6 space-y-10">
          {months.map((m, mIdx) => {
            const start = mIdx / months.length
            const end = (mIdx + 1) / months.length
            const inMonth = visible.filter(p => p.phases.some(ph => ph.end > start && ph.start < end))
            if (!inMonth.length) return null
            return (
              <section key={m.key}>
                <div className="flex items-baseline justify-between mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{m.label} 2026</h2>
                  <span className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700">{inMonth.length} active</span>
                </div>
                <ul className="space-y-4">
                  {inMonth.map(p => (
                    <MobileRow key={`${m.key}-${p.id}`} project={p} collabLookup={collabLookup} monthStart={start} monthEnd={end} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        {/* Contributors */}
        <section className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-4">Contributors</h2>
          <div className="flex flex-wrap gap-3">
            {timeline.collaborators.map(c => (
              <div key={c.initials} className="flex items-center gap-2">
                <ContribChip c={c} size="md" />
                <span className="text-[13px] text-zinc-600 dark:text-zinc-400">{c.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

// ---------- Small pieces ----------

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-1">{label}</p>
      <p className={cn('text-[15px] text-zinc-900 dark:text-zinc-100 tabular-nums', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

function LegendSwatch({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
      <span className={cn('inline-block h-2 w-4 rounded-[1px]', cls)} />
      {label}
    </span>
  )
}

function PhaseSwatchLegend({ kind, label }: { kind: PhaseKind; label: string }) {
  const cls =
    kind === 'build'   ? 'bg-zinc-800 dark:bg-zinc-200' :
    kind === 'test'    ? 'border border-zinc-800 dark:border-zinc-200 border-dashed' :
    kind === 'rollout' ? 'bg-zinc-800 dark:bg-zinc-200 opacity-60' :
    kind === 'live'    ? 'bg-emerald-500' :
    'border border-zinc-400 dark:border-zinc-600 border-dashed'
  return (
    <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
      <span className={cn('inline-block h-2 w-4', cls)} />
      {label}
    </span>
  )
}

function MonthHeader({ months, today }: { months: Month[]; today: number }) {
  return (
    <div className="grid grid-cols-[260px_1fr] border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="px-4 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Project</div>
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
        {months.map(m => (
          <div key={m.key} className="px-4 py-3 border-l border-zinc-200 dark:border-zinc-800 flex items-baseline justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-600 dark:text-zinc-300">{m.short}</span>
            <span className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700">{m.days}d</span>
          </div>
        ))}
        <TodayMarker position={today} variant="header" />
      </div>
    </div>
  )
}

// ---------- Row ----------

function TimelineRow({
  project, months, today, collabLookup, isExpanded, canEdit,
  onToggle, onToggleStep, onPhasesCommit, onMilestoneCommit,
}: {
  project: TimelineProject
  months: Month[]
  today: number
  collabLookup: Record<string, TimelineCollaborator>
  isExpanded: boolean
  canEdit: boolean
  onToggle: () => void
  onToggleStep: (idx: number) => void
  onPhasesCommit: (phases: TimelinePhase[]) => void
  onMilestoneCommit: (ms: { at: number; label: string } | null) => void
}) {
  const pri = PRIORITY[project.priority as PriorityLevel] ?? PRIORITY.medium
  const status = STATUS_CFG[project.status] ?? STATUS_CFG.idea
  const doneCount = project.steps.filter(s => s.done).length
  const totalSteps = project.steps.length

  return (
    <li className={cn('transition-colors', isExpanded ? 'bg-zinc-50 dark:bg-zinc-900/40' : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-900/25')}>
      <div className="grid grid-cols-[260px_1fr]">
        {/* Label */}
        <button type="button" onClick={onToggle} className="group text-left px-4 py-4 flex items-start gap-3 min-w-0 border-l-2 cursor-pointer" style={{ borderLeftColor: priorityBorderColor(project.priority as PriorityLevel) }}>
          <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-700 mt-[2px] shrink-0">{project.num}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[14px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100 truncate">{project.name}</h3>
              <span className={cn('inline-block h-1.5 w-1.5 rounded-full shrink-0', status.dot)} />
              {totalSteps > 0 && (
                <span className={cn(
                  'text-[10px] font-mono tabular-nums',
                  doneCount === totalSteps ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-400 dark:text-zinc-500'
                )}>
                  {doneCount}/{totalSteps}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em]">
              <span className={pri.text}>{pri.label}</span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className={status.text}>{status.label}</span>
            </div>
            <div className="mt-2">
              <ContribStack ids={project.contributors} lookup={collabLookup} />
            </div>
          </div>
          <span className={cn('text-zinc-300 dark:text-zinc-700 mt-0.5 shrink-0 transition-transform', isExpanded && 'rotate-90')} aria-hidden="true">›</span>
        </button>

        {/* Timeline track */}
        <div className="relative border-l border-zinc-200 dark:border-zinc-800" style={{ minHeight: '76px' }}>
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }} aria-hidden="true">
            {months.map((m, i) => (<div key={m.key} className={cn('h-full', i > 0 && 'border-l border-zinc-200/70 dark:border-zinc-800/70')} />))}
          </div>
          <TodayMarker position={today} variant="row" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 mx-1">
            {project.phases.map((ph, phIdx) => (
              <PhaseBar
                key={phIdx}
                phase={ph}
                phases={project.phases}
                phaseIndex={phIdx}
                priority={project.priority as PriorityLevel}
                canEdit={canEdit}
                onCommit={onPhasesCommit}
              />
            ))}
            {project.milestone && (
              <MilestoneMarker
                milestone={project.milestone}
                priority={project.priority as PriorityLevel}
                canEdit={canEdit}
                onCommit={onMilestoneCommit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-5 bg-white/40 dark:bg-zinc-950/40">
          <ExpandedDetail project={project} collabLookup={collabLookup} canEdit={canEdit} onToggleStep={onToggleStep} />
        </div>
      )}
    </li>
  )
}

// ---------- Phase bar with click-to-edit popover ----------

function PhaseBar({
  phase, phases, phaseIndex, priority, canEdit, onCommit,
}: {
  phase: TimelinePhase
  phases: TimelinePhase[]
  phaseIndex: number
  priority: PriorityLevel
  canEdit: boolean
  onCommit: (phases: TimelinePhase[]) => void
}) {
  const [open, setOpen] = useState(false)
  const pri = PRIORITY[priority]
  const left = `${phase.start * 100}%`
  const width = `${(phase.end - phase.start) * 100}%`
  const base = 'absolute inset-y-0 flex items-center justify-center transition-[background-color,border-color] duration-200'

  const kindClass =
    phase.kind === 'wait'    ? 'border border-dashed border-zinc-300 dark:border-zinc-700 rounded-[3px] text-[10px] font-mono text-zinc-400 dark:text-zinc-600 overflow-hidden' :
    phase.kind === 'test'    ? cn('border border-dashed rounded-[3px] overflow-hidden text-[10px] font-mono', pri.border, pri.text) :
    phase.kind === 'live'    ? 'rounded-[3px] overflow-hidden text-[10px] font-mono text-emerald-900 dark:text-emerald-100 bg-emerald-500/30 border border-emerald-500/70' :
    cn('rounded-[3px] overflow-hidden text-[10px] font-mono border', pri.fill, pri.border, pri.text, phase.kind === 'rollout' ? 'opacity-70' : '')

  const startDate = fractionToDate(phase.start)
  const endDate = fractionToDate(phase.end)

  const handleDateChange = (edge: 'start' | 'end', monthNum: number, day: number) => {
    const frac = dateToFraction(monthNum, day)
    const next = [...phases]
    const updated = { ...next[phaseIndex] }
    if (edge === 'start') updated.start = Math.min(frac, updated.end - 0.008)
    else updated.end = Math.max(frac, updated.start + 0.008)
    next[phaseIndex] = updated
    onCommit(next)
  }

  const bar = (
    <div className={cn(base, kindClass, canEdit && 'cursor-pointer hover:brightness-110')} style={{ left, width }} title={phase.label}>
      <span className="px-2 truncate">{phase.label}</span>
    </div>
  )

  if (!canEdit) return bar

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{bar}</PopoverTrigger>
      <PopoverContent className="w-auto p-3" side="top" align="center">
        <div className="space-y-3">
          {phase.label && (
            <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{phase.label}</p>
          )}
          <DateRow label="Start" monthNum={startDate.monthNum} day={startDate.day} onChange={(m, d) => handleDateChange('start', m, d)} />
          <DateRow label="End" monthNum={endDate.monthNum} day={endDate.day} onChange={(m, d) => handleDateChange('end', m, d)} />
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                const next = [...phases]
                const afterEnd = phase.end
                const nextPhaseStart = phaseIndex < phases.length - 1 ? phases[phaseIndex + 1].start : 1
                const gap = nextPhaseStart - afterEnd
                const newEnd = gap > 0.02 ? afterEnd + gap / 2 : Math.min(afterEnd + 0.06, 1)
                next.splice(phaseIndex + 1, 0, { kind: 'build', start: afterEnd, end: newEnd, label: 'Build' })
                onCommit(next)
                setOpen(false)
              }}
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              + Add stage after
            </button>
            {phases.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const next = phases.filter((_, i) => i !== phaseIndex)
                  onCommit(next)
                  setOpen(false)
                }}
                className="text-[10px] font-mono text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Shared month + day select row */
function DateRow({ label, monthNum, day, onChange }: {
  label: string
  monthNum: number
  day: number
  onChange: (monthNum: number, day: number) => void
}) {
  const maxDay = daysInMonth(monthNum)

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 w-8">{label}</span>
      <Select value={String(monthNum)} onValueChange={(v) => {
        const newMonth = Number(v)
        const clampedDay = Math.min(day, daysInMonth(newMonth))
        onChange(newMonth, clampedDay)
      }}>
        <SelectTrigger className="h-7 w-[72px] text-[12px] font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_META.map(m => (
            <SelectItem key={m.num} value={String(m.num)} className="text-[12px] font-mono">{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(day)} onValueChange={(v) => onChange(monthNum, Number(v))}>
        <SelectTrigger className="h-7 w-[56px] text-[12px] font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
            <SelectItem key={d} value={String(d)} className="text-[12px] font-mono">{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ---------- Milestone with click-to-edit popover ----------

function MilestoneMarker({
  milestone, priority, canEdit, onCommit,
}: {
  milestone: { at: number; label: string }
  priority: PriorityLevel
  canEdit: boolean
  onCommit: (ms: { at: number; label: string } | null) => void
}) {
  const [open, setOpen] = useState(false)
  const pri = PRIORITY[priority]
  const date = fractionToDate(milestone.at)

  const diamond = (
    <div
      className={cn('absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-[2]', canEdit && 'cursor-pointer')}
      style={{ left: `${milestone.at * 100}%` }}
      title={milestone.label}
    >
      <div className={cn('w-2.5 h-2.5 rotate-45 border', pri.bar, pri.border)} />
    </div>
  )

  if (!canEdit) return diamond

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{diamond}</PopoverTrigger>
      <PopoverContent className="w-auto p-3" side="top" align="center">
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{milestone.label}</p>
          <DateRow label="Date" monthNum={date.monthNum} day={date.day} onChange={(m, d) => {
            onCommit({ ...milestone, at: dateToFraction(m, d) })
          }} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ---------- Today marker ----------

function TodayMarker({ position, variant }: { position: number; variant: 'header' | 'row' }) {
  return (
    <div
      className={cn('absolute top-0 bottom-0 w-px z-[3] pointer-events-none', variant === 'header' ? 'bg-[#d87758]/70' : 'bg-[#d87758]/40')}
      style={{ left: `${position * 100}%` }}
      aria-hidden="true"
    >
      {variant === 'header' && (
        <span className="absolute -top-[2px] left-1/2 -translate-x-1/2 -translate-y-full text-[9px] font-mono uppercase tracking-[0.14em] text-[#b3563a] dark:text-[#e89477] whitespace-nowrap">today</span>
      )}
    </div>
  )
}

// ---------- Expanded detail with checkboxes ----------

function ExpandedDetail({
  project, collabLookup, canEdit, onToggleStep,
}: {
  project: TimelineProject
  collabLookup: Record<string, TimelineCollaborator>
  canEdit: boolean
  onToggleStep: (idx: number) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        {project.one_liner && (
          <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">{project.one_liner}</p>
        )}
        {project.stage_line && (
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mr-2">Stage</span>
            {project.stage_line}
          </p>
        )}
        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-2">Action Steps</p>
          <ul className="space-y-1">
            {project.steps.map((step, i) => (
              <StepRow
                key={i}
                step={step}
                index={i}
                canEdit={canEdit}
                collabLookup={collabLookup}
                onToggle={() => onToggleStep(i)}
              />
            ))}
          </ul>
        </div>
        {project.href && (
          <Link href={project.href} className="inline-flex items-center gap-1 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity">
            Open project <span>&rarr;</span>
          </Link>
        )}
      </div>
      <aside className="md:border-l md:border-zinc-200 md:dark:border-zinc-800 md:pl-6">
        {project.support && (
          <div className="mb-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-2">Support Needed</p>
            <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{project.support}</p>
          </div>
        )}
        {project.milestone && (
          <div className="mb-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-2">Milestone</p>
            <p className="text-[13px] text-zinc-900 dark:text-zinc-100">{project.milestone.label}</p>
          </div>
        )}
        {project.updated_by && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-2">Last edit</p>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
              {project.updated_by} · {relativeTime(project.updated_at)}
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}

// ---------- Step row with checkbox ----------

function StepRow({
  step, index, canEdit, collabLookup, onToggle,
}: {
  step: TimelineStep
  index: number
  canEdit: boolean
  collabLookup: Record<string, TimelineCollaborator>
  onToggle: () => void
}) {
  const doneByCollab = step.done_by ? collabLookup[step.done_by] : null

  return (
    <li className="flex items-start gap-3">
      {canEdit ? (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'mt-[3px] shrink-0 h-4 w-4 rounded-sm border transition-colors cursor-pointer flex items-center justify-center',
            step.done
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-500'
          )}
        >
          {step.done && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4l3 3 5-6" />
            </svg>
          )}
        </button>
      ) : (
        <span className={cn(
          'mt-[3px] shrink-0 h-4 w-4 rounded-sm border flex items-center justify-center',
          step.done ? 'bg-emerald-500/20 border-emerald-500/40' : 'border-zinc-200 dark:border-zinc-800'
        )}>
          {step.done && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
              <path d="M1 4l3 3 5-6" />
            </svg>
          )}
        </span>
      )}
      <span className={cn('flex-1 text-[13px]', step.done ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-600 dark:text-zinc-300')}>
        {step.text}
      </span>
      {doneByCollab && (
        <span className="shrink-0">
          <ContribChip c={doneByCollab} size="sm" />
        </span>
      )}
    </li>
  )
}

// ---------- Mobile row ----------

function MobileRow({ project, collabLookup, monthStart, monthEnd }: {
  project: TimelineProject
  collabLookup: Record<string, TimelineCollaborator>
  monthStart: number
  monthEnd: number
}) {
  const pri = PRIORITY[project.priority as PriorityLevel] ?? PRIORITY.medium
  const status = STATUS_CFG[project.status] ?? STATUS_CFG.idea
  const monthSpan = monthEnd - monthStart
  const clipped = project.phases
    .map(ph => ({ ...ph, start: Math.max(ph.start, monthStart), end: Math.min(ph.end, monthEnd) }))
    .filter(ph => ph.end > ph.start)

  return (
    <li className="border-l-2 pl-3 py-2" style={{ borderLeftColor: priorityBorderColor(project.priority as PriorityLevel) }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10px] text-zinc-300 dark:text-zinc-700">{project.num}</span>
        <h3 className="text-[14px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">{project.name}</h3>
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full', status.dot)} />
      </div>
      {project.one_liner && <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">{project.one_liner}</p>}
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] mb-2">
        <span className={pri.text}>{pri.label}</span>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span className={status.text}>{status.label}</span>
      </div>
      <ContribStack ids={project.contributors} lookup={collabLookup} />
      <div className="relative mt-2 h-2 bg-zinc-100 dark:bg-zinc-800/60 rounded-sm overflow-hidden">
        {clipped.map((ph, i) => {
          const l = ((ph.start - monthStart) / monthSpan) * 100
          const w = ((ph.end - ph.start) / monthSpan) * 100
          const bg = ph.kind === 'wait' ? 'bg-zinc-300/60 dark:bg-zinc-700/60' : ph.kind === 'live' ? 'bg-emerald-500/60' : pri.bar + ' opacity-70'
          return <div key={i} className={cn('absolute inset-y-0', bg)} style={{ left: `${l}%`, width: `${w}%` }} />
        })}
      </div>
    </li>
  )
}

// ---------- Contributor chips ----------

function ContribStack({ ids, lookup }: { ids: string[]; lookup: Record<string, TimelineCollaborator> }) {
  return (
    <div className="flex items-center" title={ids.map(id => lookup[id]?.name ?? id).join(', ')}>
      {ids.map((id, i) => {
        const c = lookup[id]
        if (!c) return null
        return (
          <span key={id} style={{ marginLeft: i === 0 ? 0 : -6, zIndex: ids.length - i }} className="relative">
            <ContribChip c={c} size="sm" />
          </span>
        )
      })}
    </div>
  )
}

function ContribChip({ c, size = 'sm' }: { c: TimelineCollaborator; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-6 w-6 text-[10px]'
  const bgLight = c.neutral ? 'hsl(0 0% 88%)' : `hsl(${c.hue} 32% 82%)`
  const bgDark  = c.neutral ? 'hsl(0 0% 22%)' : `hsl(${c.hue} 26% 28%)`
  const fgLight = c.neutral ? 'hsl(0 0% 28%)' : `hsl(${c.hue} 38% 26%)`
  const fgDark  = c.neutral ? 'hsl(0 0% 78%)' : `hsl(${c.hue} 34% 82%)`
  const base = 'items-center justify-center rounded-full font-mono uppercase tracking-[0.04em] border'

  return (
    <>
      <span className={cn('inline-flex border-zinc-950', base, dim)} style={{ backgroundColor: bgDark, color: fgDark }} aria-label={c.name}>{c.initials}</span>
    </>
  )
}

// ---------- Helpers ----------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  return `${days}d ago`
}
