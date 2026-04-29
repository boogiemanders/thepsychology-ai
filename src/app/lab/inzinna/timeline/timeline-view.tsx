'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { cn } from '@/lib/utils'
import { Accordion, AccordionItem, AccordionContent } from '@/components/ui/accordion'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Hammer, FlaskConical, Rocket, Radio, Clock } from 'lucide-react'
import { useTimeline, type TimelineProject, type TimelineCollaborator, type TimelinePhase, type TimelineStep } from './use-timeline'
import { MONTH_META, fractionToDate, dateToFraction, daysInMonth } from './date-utils'
import { UserPicker } from './user-picker'
import { GoogleConnect } from './google-connect'
import { AddProjectForm } from './add-project-form'

// ---------- Types ----------

type PriorityLevel = 'high' | 'medium' | 'low'

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
  live:     { label: 'Live',     dot: 'bg-[#8AE08D]', text: 'text-[#8AE08D]' },
  building: { label: 'Building', dot: 'bg-[#9DADE5]', text: 'text-[#9DADE5]' },
  blocked:  { label: 'Blocked',  dot: 'bg-[#FFB990]', text: 'text-[#FFB990]' },
  idea:     { label: 'Idea',     dot: 'bg-white/30',  text: 'text-white/45' },
  done:     { label: 'Done',     dot: 'bg-[#8AE08D]', text: 'text-[#8AE08D]' },
}

function priorityBorderColor(p: PriorityLevel): string {
  return p === 'high' ? '#d87758' : p === 'medium' ? '#788c5d' : '#6a9bcc'
}

// Inzinna brand palette — drives lead-color of phase bars + contributor chips.
const COLLAB_COLORS: Record<string, string> = {
  AC: '#FFB990', // peach
  BR: '#9DADE5', // peri
  CA: '#F1E29D', // sun
  FI: '#8AE08D', // mint
  GI: '#3362FF', // royal
  LO: '#5F396D', // plum
  TM: '#F1E29D', // sun (reuse)
  JC: '#5F396D', // plum (reuse)
}

function isLightHex(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160
}

function leadColors(lead: TimelineCollaborator | null) {
  if (!lead || lead.neutral) {
    return {
      bg: 'hsl(0 0% 50% / 0.25)',
      bgOpaque: 'hsl(0 0% 22%)',
      border: 'hsl(0 0% 55%)',
      text: 'hsl(0 0% 85%)',
      solid: 'hsl(0 0% 55%)',
      hoverBg: 'hsl(0 0% 55%)',
      hoverText: '#fff',
    }
  }
  const hex = COLLAB_COLORS[lead.initials]
  if (hex) {
    const contrast = isLightHex(hex) ? '#111' : '#fff'
    return {
      bg: hex,
      bgOpaque: hex,
      border: hex,
      text: contrast,
      solid: hex,
      hoverBg: hex,
      hoverText: contrast,
    }
  }
  return {
    bg: `hsl(${lead.hue} 32% 40% / 0.35)`,
    bgOpaque: `hsl(${lead.hue} 32% 22%)`,
    border: `hsl(${lead.hue} 42% 55%)`,
    text: `hsl(${lead.hue} 45% 85%)`,
    solid: `hsl(${lead.hue} 42% 55%)`,
    hoverBg: `hsl(${lead.hue} 42% 55%)`,
    hoverText: '#fff',
  }
}

// Map steps onto phases by index proportion. If a phase gets zero steps
// (more phases than steps), fall back to overall project progress so every
// bar still moves when something gets checked off.
function phaseProgress(phaseIndex: number, totalPhases: number, steps: TimelineStep[]): number {
  if (steps.length === 0 || totalPhases === 0) return 0
  const overall = steps.filter(s => s.done).length / steps.length
  const stepsPerPhase = steps.length / totalPhases
  const startIdx = Math.floor(phaseIndex * stepsPerPhase)
  const endIdx = Math.max(startIdx, Math.floor((phaseIndex + 1) * stepsPerPhase))
  const phaseSteps = steps.slice(startIdx, endIdx)
  if (phaseSteps.length === 0) return overall
  return phaseSteps.filter(s => s.done).length / phaseSteps.length
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
  const [showAddForm, setShowAddForm] = useState(false)
  const [myOnly, setMyOnly] = useState(false)
  const [viewingFilter, setViewingFilter] = useState<string | null>(null)

  const today = useMemo(() => isoToPosition(todayIso, months), [todayIso, months])

  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }
  // Blocked work surfaces first so unsticking it isn't buried under "building" rows.
  const STATUS_ORDER: Record<string, number> = { blocked: 0, building: 1, live: 2, idea: 3, done: 4 }
  const visible = useMemo(() => {
    let filtered = timeline.projects
    if (myOnly && timeline.activeUser) {
      filtered = filtered.filter(p => p.contributors.includes(timeline.activeUser!))
    }
    if (viewingFilter) {
      filtered = filtered.filter(p => p.contributors.includes(viewingFilter))
    }
    return [...filtered].sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 5
      const sb = STATUS_ORDER[b.status] ?? 5
      if (sa !== sb) return sa - sb
      const pa = PRIORITY_ORDER[a.priority] ?? 2
      const pb = PRIORITY_ORDER[b.priority] ?? 2
      if (pa !== pb) return pa - pb
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })
  }, [timeline.projects, timeline.activeUser, myOnly, viewingFilter])

  // Build contributor lookup for chips
  const collabLookup = useMemo(() => {
    const map: Record<string, TimelineCollaborator> = {}
    for (const c of timeline.collaborators) map[c.initials] = c
    return map
  }, [timeline.collaborators])

  return (
    <div className="inz-shell">
      {/* Top crumb bar with Inzinna brand logo */}
      <div className="flex items-center justify-between px-10 py-3.5 border-b border-white/[0.08]">
        <Link href="/lab#projects" aria-label="Back to Lab" className="inline-flex items-center transition-opacity hover:opacity-80">
          <img src="/inzinna/inzinna-primary-light.svg" alt="Inzinna Therapy Group" className="h-9 w-auto object-contain" />
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/45">
          Lab · Timeline
        </span>
      </div>

      {/* Hero */}
      <section className="px-10 pt-12 pb-7">
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#9DADE5] mb-3.5">
          Inzinna Practice Automation
        </p>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[48px] font-bold tracking-[-1.4px] leading-[1.05] mb-3 text-white">
              Leadership Timeline
            </h1>
            <p className="text-[14px] text-white/65 leading-[1.55] max-w-[560px]">
              Every leadership project, month by month. Pick your name to start checking things off and editing dates.
            </p>
          </div>
          {timeline.activeUser && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMyOnly(v => !v)}
                className={cn(
                  'px-4 py-2 text-[11px] font-mono uppercase tracking-[0.16em] border rounded-full transition-colors cursor-pointer',
                  myOnly
                    ? 'border-[#9DADE5] text-white bg-[rgba(157,173,229,0.10)]'
                    : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'
                )}
              >
                My projects
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(v => !v)}
                className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.16em] border border-white/15 text-white/70 rounded-full hover:border-white/40 hover:text-white transition-colors cursor-pointer"
              >
                + Add project
              </button>
            </div>
          )}
        </div>

        {/* Viewing filter — show one person's slate */}
        <div className="mt-7 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9DADE5] mr-1">
            Viewing
          </span>
          {timeline.collaborators.filter(c => !c.neutral).map(c => {
            const active = viewingFilter === c.initials
            return (
              <button
                key={c.initials}
                type="button"
                onClick={() => setViewingFilter(active ? null : c.initials)}
                className={cn(
                  'inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-[11px] font-mono transition-colors cursor-pointer',
                  active
                    ? 'border-[#9DADE5] bg-[rgba(157,173,229,0.10)] text-white'
                    : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'
                )}
              >
                <ContribChip c={c} size="sm" />
                <span>{c.name}</span>
              </button>
            )
          })}
          {viewingFilter && (
            <button
              type="button"
              onClick={() => setViewingFilter(null)}
              className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45 hover:text-white ml-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* User picker */}
        <div className="mt-5 pb-7 border-b border-white/[0.08]">
          <UserPicker
            collaborators={timeline.collaborators}
            activeUser={timeline.activeUser}
            onPick={timeline.pickUser}
            projects={timeline.projects}
          />
          <GoogleConnect activeUser={timeline.activeUser} />
        </div>
      </section>

      {/* Add project form */}
      {timeline.activeUser && (
        <Accordion
          type="single"
          collapsible
          value={showAddForm ? 'add' : ''}
          onValueChange={(v) => setShowAddForm(v === 'add')}
          className="px-10 mb-2"
        >
          <AccordionItem value="add" className="border-0">
            <AccordionContent className="pt-0 pb-0">
              <AddProjectForm
                collaborators={timeline.collaborators}
                activeUser={timeline.activeUser}
                onSubmit={timeline.addProject}
                onClose={() => setShowAddForm(false)}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Desktop timeline grid */}
      <div className="hidden md:block">
        <MonthHeader months={months} today={today} />
        {visible.length === 0 && (
          <div className="px-10 py-14 text-center text-[12px] font-mono uppercase tracking-[0.2em] text-white/45">
            No projects {viewingFilter ? `for ${timeline.collaborators.find(c => c.initials === viewingFilter)?.name ?? viewingFilter}` : 'match this filter'}
          </div>
        )}
        <Accordion type="single" collapsible>
          {visible.map(p => (
            <TimelineRow
              key={p.id}
              project={p}
              months={months}
              today={today}
              collabLookup={collabLookup}
              canEdit={!!timeline.activeUser}
              onToggleStep={(idx) => timeline.toggleStep(p.id, idx)}
              onUpdateStep={(idx, patch) => timeline.updateStep(p.id, idx, patch)}
              onPhasesCommit={(phases) => timeline.updatePhases(p.id, phases)}
              onMilestoneCommit={(ms) => timeline.updateMilestone(p.id, ms)}
              onPriorityCommit={(priority) => timeline.updatePriority(p.id, priority)}
              onContributorsCommit={(contributors) => timeline.updateContributors(p.id, contributors)}
              onLeadCommit={(lead) => timeline.updateLead(p.id, lead)}
              allCollaborators={timeline.collaborators}
            />
          ))}
        </Accordion>
      </div>

      {/* Mobile month-stacked */}
      <div className="md:hidden px-6 py-6 space-y-10">
        {months.map((m, mIdx) => {
          const start = mIdx / months.length
          const end = (mIdx + 1) / months.length
          const inMonth = visible.filter(p => p.phases.some(ph => ph.end > start && ph.start < end))
          if (!inMonth.length) return null
          return (
            <section key={m.key}>
              <div className="flex items-baseline justify-between mb-3 border-b border-white/[0.08] pb-2">
                <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/65">{m.label} 2026</h2>
                <span className="text-[10px] font-mono text-white/25">{inMonth.length} active</span>
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

      {/* Contributors / legend */}
      <section className="px-10 pt-7 pb-14 border-t border-white/[0.08]">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45 mb-4">Contributors</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {timeline.collaborators.map(c => (
            <div key={c.initials} className="flex items-center gap-2">
              <ContribChip c={c} size="md" />
              <span className="text-[13px] text-white/75">{c.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ---------- Small pieces ----------

function MonthHeader({ months, today }: { months: Month[]; today: number }) {
  return (
    <div className="grid grid-cols-[320px_1fr] border-y border-white/[0.08] bg-white/[0.02]">
      <div className="px-4 py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">Project</div>
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
        {months.map(m => (
          <div key={m.key} className="px-4 py-3.5 border-l border-white/[0.08] flex items-baseline justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/85">{m.short}</span>
            <span className="text-[10px] font-mono text-white/25">{m.days}d</span>
          </div>
        ))}
        <TodayMarker position={today} variant="header" />
      </div>
    </div>
  )
}

// ---------- Row ----------

function TimelineRow({
  project, months, today, collabLookup, canEdit,
  onToggleStep, onUpdateStep, onPhasesCommit, onMilestoneCommit, onPriorityCommit, onContributorsCommit, onLeadCommit,
  allCollaborators,
}: {
  project: TimelineProject
  months: Month[]
  today: number
  collabLookup: Record<string, TimelineCollaborator>
  canEdit: boolean
  onToggleStep: (idx: number) => void
  onUpdateStep: (idx: number, patch: Partial<TimelineStep>) => void
  onPhasesCommit: (phases: TimelinePhase[]) => void
  onMilestoneCommit: (ms: { at: number; label: string } | null) => void
  onPriorityCommit: (priority: PriorityLevel) => void
  onContributorsCommit: (contributors: string[]) => void
  onLeadCommit: (lead: string | null) => void
  allCollaborators: TimelineCollaborator[]
}) {
  const pri = PRIORITY[project.priority as PriorityLevel] ?? PRIORITY.medium
  const status = STATUS_CFG[project.status] ?? STATUS_CFG.idea
  const doneCount = project.steps.filter(s => s.done).length
  const totalSteps = project.steps.length
  const leadId = project.lead ?? project.contributors[0] ?? null
  const lead = leadId ? collabLookup[leadId] ?? null : null
  const leadCol = leadColors(lead)
  const isStale = (() => {
    if (!project.updated_at) return false
    const days = (Date.now() - new Date(project.updated_at).getTime()) / 86_400_000
    return days > 14 && project.status !== 'done' && project.status !== 'idea'
  })()
  const needsMilestone = project.priority === 'high' && !project.milestone && project.status !== 'done'
  // Render phases. If phases is empty but the project is live, derive a single
  // bar from step start/due so project 05 (Assessment) doesn't render as a void.
  const renderPhases: TimelinePhase[] = useMemo(() => {
    if (project.phases.length > 0) return project.phases
    if (project.status === 'live') {
      const starts = project.steps.map(s => s.start_at).filter((x): x is number => typeof x === 'number')
      const dues = project.steps.map(s => s.due_at).filter((x): x is number => typeof x === 'number')
      if (starts.length || dues.length) {
        const start = starts.length ? Math.min(...starts) : 0
        const end = dues.length ? Math.max(...dues) : 1
        if (end > start) return [{ kind: 'live', start, end, label: 'Live' }]
      }
      return [{ kind: 'live', start: 0, end: 1, label: 'Live' }]
    }
    return []
  }, [project.phases, project.steps, project.status])

  return (
    <AccordionItem
      value={project.id}
      className="border-b-0 border-t border-white/[0.08] first:border-t-0 transition-colors hover:bg-white/[0.025] data-[state=open]:bg-white/[0.04]"
    >
      <div className="grid grid-cols-[320px_1fr]">
        {/* Label (accordion trigger) */}
        <AccordionPrimitive.Header className="flex">
          <AccordionPrimitive.Trigger
            className="group/trigger flex-1 text-left px-4 py-[18px] flex items-start gap-3 min-w-0 border-l-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#9DADE5]/40"
            style={{ borderLeftColor: leadCol.solid }}
          >
            <span className="font-mono text-[11px] text-white/25 tabular-nums mt-[2px] shrink-0">{project.num}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-medium tracking-[-0.1px] text-white/92 leading-[1.35] line-clamp-2" title={project.name}>{project.name}</h3>
                <span className={cn('inline-block h-1.5 w-1.5 rounded-full shrink-0', status.dot)} title={status.label} />
                {isStale && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0 bg-red-400 animate-pulse" title={`Stale. Last edit ${relativeTime(project.updated_at)}`} />
                )}
                {needsMilestone && (
                  <span className="text-[9px] font-mono uppercase tracking-[0.12em] px-1.5 py-px rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 shrink-0" title="High priority but no milestone set">
                    No milestone
                  </span>
                )}
                {totalSteps > 0 && (
                  <span className={cn(
                    'text-[10px] font-mono tabular-nums',
                    doneCount === totalSteps ? 'text-[#8AE08D]' : 'text-white/40'
                  )}>
                    {doneCount}/{totalSteps}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <ContribStack ids={project.contributors} leadId={leadId} lookup={collabLookup} />
              </div>
            </div>
            <span className="text-white/30 mt-0.5 shrink-0 transition-transform duration-200 group-data-[state=open]/trigger:rotate-90" aria-hidden="true">›</span>
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>

        {/* Timeline track */}
        <div className="relative border-l border-white/[0.08]" style={{ minHeight: '88px' }}>
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }} aria-hidden="true">
            {months.map((m, i) => (<div key={m.key} className={cn('h-full', i > 0 && 'border-l border-white/[0.05]')} />))}
          </div>
          <TodayMarker position={today} variant="row" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-9">
            {renderPhases.map((ph, phIdx) => (
              <PhaseBar
                key={phIdx}
                phase={ph}
                phases={renderPhases}
                phaseIndex={phIdx}
                leadCol={leadCol}
                canEdit={canEdit && project.phases.length > 0}
                onCommit={onPhasesCommit}
                progress={phaseProgress(phIdx, renderPhases.length, project.steps)}
              />
            ))}
            {project.steps.map((step, i) => (
              step.due_at !== undefined ? (
                <StepDot
                  key={`step-${i}`}
                  step={step}
                  leadCol={leadCol}
                  canEdit={canEdit}
                  onUpdateStep={(patch) => onUpdateStep(i, patch)}
                />
              ) : null
            ))}
          </div>
        </div>
      </div>

      <AccordionContent className="border-t border-dashed border-white/[0.06] px-6 py-5 bg-black/20">
        <ExpandedDetail project={project} collabLookup={collabLookup} canEdit={canEdit} onToggleStep={onToggleStep} onUpdateStep={onUpdateStep} onPriorityCommit={onPriorityCommit} onContributorsCommit={onContributorsCommit} onLeadCommit={onLeadCommit} allCollaborators={allCollaborators} />
      </AccordionContent>
    </AccordionItem>
  )
}

// ---------- Phase bar with click-to-edit popover ----------

function PhaseBar({
  phase, phases, phaseIndex, leadCol, canEdit, onCommit, progress,
}: {
  phase: TimelinePhase
  phases: TimelinePhase[]
  phaseIndex: number
  leadCol: { bg: string; bgOpaque: string; border: string; text: string; solid: string; hoverBg: string; hoverText: string }
  canEdit: boolean
  onCommit: (phases: TimelinePhase[]) => void
  progress: number
}) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [expandedPx, setExpandedPx] = useState<number | null>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const left = `${phase.start * 100}%`
  const width = `${(phase.end - phase.start) * 100}%`
  const base = 'absolute inset-y-0 flex items-center justify-start transition-[background-color,border-color] duration-200'

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const widthTransition = prefersReduced ? 'none' : 'width 180ms cubic-bezier(0.25, 1, 0.5, 1)'

  const handleMouseEnter = () => {
    setHovered(true)
    requestAnimationFrame(() => {
      const span = labelRef.current
      if (span && span.scrollWidth > span.clientWidth + 1) {
        setExpandedPx(span.scrollWidth + 18)
      } else {
        setExpandedPx(null)
      }
    })
  }
  const handleMouseLeave = () => setHovered(false)

  const isWait = phase.kind === 'wait'
  const kindClass = cn(
    'rounded-[3px] overflow-hidden text-[10px] font-mono border',
    isWait && 'border-dashed'
  )
  const kindStyle: React.CSSProperties = {
    backgroundColor: isWait ? 'transparent' : (hovered ? leadCol.hoverBg : leadCol.bg),
    borderColor: leadCol.border,
    color: isWait ? leadCol.solid : (hovered ? leadCol.hoverText : leadCol.text),
  }

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

  const barStyle: React.CSSProperties = {
    ...kindStyle,
    left,
    width: hovered && expandedPx ? `${expandedPx}px` : width,
    zIndex: hovered ? 20 : undefined,
    transition: widthTransition,
  }

  const KindIcon = phase.kind === 'build' ? Hammer
    : phase.kind === 'test' ? FlaskConical
    : phase.kind === 'rollout' ? Rocket
    : phase.kind === 'live' ? Radio
    : Clock

  const safeProgress = Math.max(0, Math.min(1, progress))
  const isComplete = safeProgress >= 1
  const bar = (
    <div
      className={cn(base, kindClass, canEdit && 'cursor-pointer hover:brightness-110')}
      style={barStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {safeProgress > 0 && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 pointer-events-none"
          style={{
            width: `${safeProgress * 100}%`,
            backgroundColor: isComplete ? 'rgba(138, 224, 141, 0.55)' : leadCol.solid,
            opacity: isComplete ? 1 : 0.5,
            transition: prefersReduced ? 'none' : 'width 240ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms',
          }}
        />
      )}
      <KindIcon className="size-[10px] shrink-0 ml-1.5 opacity-80 relative" aria-hidden="true" />
      <span ref={labelRef} className={cn('pl-1 pr-2 relative', hovered ? 'whitespace-nowrap' : 'truncate')}>{hovered && phase.description ? phase.description : phase.label}</span>
    </div>
  )

  if (!canEdit) return bar

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{bar}</PopoverTrigger>
        <PopoverContent className="w-auto p-3" side="top" align="center">
          <div className="space-y-3">
            {phase.label && (
              <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{phase.label}</p>
            )}
            <DateRow label="Start" edge="start" monthNum={startDate.monthNum} day={startDate.day} onChange={(m, d) => handleDateChange('start', m, d)} />
            <DateRow label="End" edge="end" monthNum={endDate.monthNum} day={endDate.day} onChange={(m, d) => handleDateChange('end', m, d)} />
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
    </>
  )
}

/** Month-only row — edge decides day-1 (start) vs last-day (end) */
function DateRow({ label, monthNum, day: _day, onChange, edge = 'start' }: {
  label: string
  monthNum: number
  day: number
  onChange: (monthNum: number, day: number) => void
  edge?: 'start' | 'end'
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 w-10">{label}</span>
      <Select value={String(monthNum)} onValueChange={(v) => {
        const m = Number(v)
        const d = edge === 'end' ? daysInMonth(m) : 1
        onChange(m, d)
      }}>
        <SelectTrigger className="h-7 w-[120px] text-[12px] font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_META.map(m => (
            <SelectItem key={m.num} value={String(m.num)} className="text-[12px] font-mono">{m.label}</SelectItem>
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
      {milestone.label && (
        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-[9px] font-mono uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400 whitespace-nowrap pointer-events-none">
          {milestone.label}
        </span>
      )}
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
      className={cn(
        'absolute top-0 bottom-0 z-[3] pointer-events-none border-l border-dashed',
        variant === 'header' ? 'border-[#FFB990]' : 'border-[#FFB990]/35'
      )}
      style={{ left: `${position * 100}%` }}
      aria-hidden="true"
    >
      {variant === 'header' && (
        <span className="absolute -top-[3px] left-1/2 -translate-x-1/2 -translate-y-full px-[7px] py-[2px] rounded-[3px] bg-[#FFB990] text-[8px] font-bold font-mono uppercase tracking-[0.16em] text-[#101032] whitespace-nowrap shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          Today
        </span>
      )}
    </div>
  )
}

// ---------- Expanded detail with checkboxes ----------

function ExpandedDetail({
  project, collabLookup, canEdit, onToggleStep, onUpdateStep, onPriorityCommit, onContributorsCommit, onLeadCommit, allCollaborators,
}: {
  project: TimelineProject
  collabLookup: Record<string, TimelineCollaborator>
  canEdit: boolean
  onToggleStep: (idx: number) => void
  onUpdateStep: (idx: number, patch: Partial<TimelineStep>) => void
  onPriorityCommit: (priority: PriorityLevel) => void
  onContributorsCommit: (contributors: string[]) => void
  onLeadCommit: (lead: string | null) => void
  allCollaborators: TimelineCollaborator[]
}) {
  const currentLead = project.lead ?? project.contributors[0] ?? null
  const projectStartFrac = project.phases.length ? Math.min(...project.phases.map(p => p.start)) : 0
  const projectEndFrac = project.phases.length ? Math.max(...project.phases.map(p => p.end)) : 1
  const projectStart = fractionToDate(projectStartFrac)
  const projectEnd = fractionToDate(projectEndFrac)

  return (
    <div className="space-y-4">
      {project.one_liner && (
        <p className="text-[13px] text-white/75 leading-relaxed">{project.one_liner}</p>
      )}
      {canEdit && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">Priority</span>
            <Select value={project.priority} onValueChange={(v) => onPriorityCommit(v as PriorityLevel)}>
              <SelectTrigger className="h-7 w-[110px] text-[12px] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high" className="text-[12px] font-mono">High</SelectItem>
                <SelectItem value="medium" className="text-[12px] font-mono">Medium</SelectItem>
                <SelectItem value="low" className="text-[12px] font-mono">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45" title="Directly Responsible Individual">Lead (DRI)</span>
            <Select value={currentLead ?? '__none__'} onValueChange={(v) => onLeadCommit(v === '__none__' ? null : v)}>
              <SelectTrigger className="h-7 w-[140px] text-[12px] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-[12px] font-mono">No lead</SelectItem>
                {allCollaborators.filter(c => !c.neutral).map(c => (
                  <SelectItem key={c.initials} value={c.initials} className="text-[12px] font-mono">
                    {c.initials} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {canEdit && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45 mb-2">Collaborators</p>
          <div className="flex flex-wrap gap-1.5">
            {allCollaborators.filter(c => !c.neutral).map(c => {
              const active = project.contributors.includes(c.initials)
              const leadCol = leadColors(c)
              return (
                <button
                  key={c.initials}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? project.contributors.filter(id => id !== c.initials)
                      : [...project.contributors, c.initials]
                    onContributorsCommit(next)
                  }}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-mono rounded-full border transition-colors cursor-pointer',
                    active
                      ? ''
                      : 'border-white/10 text-white/55 hover:border-white/30 hover:text-white/85'
                  )}
                  style={active ? { borderColor: leadCol.solid, color: leadCol.text, backgroundColor: leadCol.bg } : undefined}
                >
                  {c.initials} {c.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45 mb-2">Action Steps</p>
        <ul className="space-y-1">
          {project.steps.map((step, i) => (
            <StepRow
              key={i}
              step={step}
              index={i}
              canEdit={canEdit}
              collabLookup={collabLookup}
              onToggle={() => onToggleStep(i)}
              onUpdateStep={(patch) => onUpdateStep(i, patch)}
              defaultStart={projectStart}
              defaultDue={projectEnd}
            />
          ))}
        </ul>
      </div>
      {project.support && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45 mb-1">Support Needed</p>
          <p className="text-[12px] text-white/65 leading-relaxed">{project.support}</p>
        </div>
      )}
      {project.milestone && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45 mb-1">Milestone</p>
          <p className="text-[13px] text-white/92">{project.milestone.label}</p>
        </div>
      )}
      {project.href && (
        <Link href={project.href} className="inline-flex items-center gap-1 text-[13px] font-medium text-white hover:opacity-70 transition-opacity">
          Open project <span>&rarr;</span>
        </Link>
      )}
      {project.updated_by && (
        <p className="text-[11px] text-white/40">
          Last edit: {project.updated_by} · {relativeTime(project.updated_at)}
        </p>
      )}
    </div>
  )
}

// ---------- Step row with checkbox ----------

function StepRow({
  step, index, canEdit, collabLookup, onToggle, onUpdateStep, defaultStart, defaultDue,
}: {
  step: TimelineStep
  index: number
  canEdit: boolean
  collabLookup: Record<string, TimelineCollaborator>
  onToggle: () => void
  onUpdateStep: (patch: Partial<TimelineStep>) => void
  defaultStart: { monthNum: number; day: number }
  defaultDue: { monthNum: number; day: number }
}) {
  const doneByCollab = step.done_by ? collabLookup[step.done_by] : null
  const dateObj = step.due_at !== undefined ? fractionToDate(step.due_at) : null
  const startObj = step.start_at !== undefined ? fractionToDate(step.start_at) : null

  return (
    <li className="flex items-start gap-3">
      {canEdit ? (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'mt-[3px] shrink-0 h-4 w-4 rounded-[3px] border-[1.5px] transition-colors cursor-pointer flex items-center justify-center',
            step.done
              ? 'bg-[#FFB990] border-[#FFB990] text-[#101032]'
              : 'border-white/30 hover:border-white/55'
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
          'mt-[3px] shrink-0 h-4 w-4 rounded-[3px] border-[1.5px] flex items-center justify-center',
          step.done ? 'bg-[#FFB990] border-[#FFB990]' : 'border-white/20'
        )}>
          {step.done && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#101032]">
              <path d="M1 4l3 3 5-6" />
            </svg>
          )}
        </span>
      )}
      {canEdit ? (
        <input
          type="text"
          defaultValue={step.text}
          onBlur={(e) => {
            const v = e.target.value.trim()
            if (v && v !== step.text) onUpdateStep({ text: v })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') { (e.target as HTMLInputElement).value = step.text; (e.target as HTMLInputElement).blur() }
          }}
          className={cn(
            'flex-1 text-[13px] bg-transparent border-none outline-none focus:ring-0 px-0 py-0',
            'hover:bg-white/5 focus:bg-white/5 rounded-sm transition-colors',
            step.done ? 'line-through decoration-white/25 text-white/45' : 'text-white/85'
          )}
        />
      ) : (
        <span className={cn('flex-1 text-[13px]', step.done ? 'line-through decoration-white/25 text-white/45' : 'text-white/85')}>
          {step.text}
        </span>
      )}
      {canEdit ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              title={dateObj ? 'Edit deadline' : 'Set a deadline so this step shows on the timeline'}
              className={cn(
                'shrink-0 text-[10px] font-mono uppercase tracking-[0.12em] transition-colors cursor-pointer px-2 py-0.5 border rounded',
                dateObj
                  ? 'text-white/55 border-white/15 hover:text-white hover:border-[#9DADE5]'
                  : 'text-[#9DADE5] border-dashed border-[#9DADE5]/40 hover:text-white hover:bg-[rgba(157,173,229,0.10)] hover:border-[#9DADE5]'
              )}
            >
              {dateObj
                ? `${MONTH_META[dateObj.monthNum - 4]?.label ?? ''} ${dateObj.day}`
                : '+ Set deadline'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" side="top" align="end">
            <div className="space-y-2">
              <DateRow
                label="Start"
                edge="start"
                monthNum={startObj?.monthNum ?? defaultStart.monthNum}
                day={startObj?.day ?? defaultStart.day}
                onChange={(m, d) => onUpdateStep({ start_at: dateToFraction(m, d) })}
              />
              <DateRow
                label="Due"
                edge="end"
                monthNum={dateObj?.monthNum ?? defaultDue.monthNum}
                day={dateObj?.day ?? defaultDue.day}
                onChange={(m, d) => onUpdateStep({ due_at: dateToFraction(m, d) })}
              />
              {(startObj || dateObj) && (
                <button
                  type="button"
                  className="text-[10px] font-mono text-[#D67263] hover:text-[#FFB990] cursor-pointer pt-1 border-t border-white/10 w-full text-left"
                  onClick={() => onUpdateStep({ start_at: undefined, due_at: undefined })}
                >
                  Clear dates
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        dateObj && (
          <span className="shrink-0 text-[10px] font-mono text-white/45">
            {MONTH_META[dateObj.monthNum - 4]?.label} {dateObj.day}
          </span>
        )
      )}
      {doneByCollab && (
        <span className="shrink-0">
          <ContribChip c={doneByCollab} size="sm" />
        </span>
      )}
    </li>
  )
}

// ---------- Step dot on timeline ----------

function StepDot({ step, leadCol, canEdit, onUpdateStep }: {
  step: TimelineStep
  leadCol: { bg: string; bgOpaque: string; border: string; text: string; solid: string; hoverBg: string; hoverText: string }
  canEdit: boolean
  onUpdateStep: (patch: Partial<TimelineStep>) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const [expandedPx, setExpandedPx] = useState<number | null>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  if (step.due_at === undefined) return null
  const hasRange = step.start_at !== undefined && step.start_at < step.due_at
  const doneColor = '#8AE08D'
  const fill = step.done ? doneColor : leadCol.solid
  const edge = step.done ? doneColor : leadCol.border
  const fillBg = step.done ? 'rgba(138, 224, 141, 0.18)' : leadCol.bg
  const startObj = step.start_at !== undefined ? fractionToDate(step.start_at) : null
  const dueObj = fractionToDate(step.due_at)

  const handleMouseEnter = () => {
    setHovered(true)
    requestAnimationFrame(() => {
      const span = labelRef.current
      if (span && span.scrollWidth > span.clientWidth + 1) {
        setExpandedPx(span.scrollWidth + 16)
      } else {
        setExpandedPx(null)
      }
    })
  }
  const handleMouseLeave = () => setHovered(false)

  if (hasRange) {
    const left = `${step.start_at! * 100}%`
    const width = `${(step.due_at - step.start_at!) * 100}%`
    const bar = (
      <div
        className={cn(
          'absolute inset-y-0 rounded-[3px] border flex items-center text-[10px] font-mono overflow-hidden transition-[background-color,width] duration-200',
          canEdit ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
        )}
        style={{
          left,
          width: hovered && expandedPx ? `${expandedPx}px` : width,
          backgroundColor: hovered && !step.done ? leadCol.hoverBg : fillBg,
          borderColor: edge,
          color: hovered && !step.done ? leadCol.hoverText : leadCol.text,
          zIndex: hovered ? 20 : undefined,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span ref={labelRef} className={cn('px-2', hovered ? 'whitespace-nowrap' : 'truncate')}>{step.text}</span>
      </div>
    )

    if (!canEdit) return bar

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{bar}</PopoverTrigger>
        <PopoverContent className="w-auto p-3" side="top" align="center">
          <div className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{step.text}</p>
            <DateRow
              label="Start"
              edge="start"
              monthNum={startObj?.monthNum ?? 4}
              day={startObj?.day ?? 1}
              onChange={(m, d) => onUpdateStep({ start_at: dateToFraction(m, d) })}
            />
            <DateRow
              label="Due"
              edge="end"
              monthNum={dueObj.monthNum}
              day={dueObj.day}
              onChange={(m, d) => onUpdateStep({ due_at: dateToFraction(m, d) })}
            />
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
      style={{ left: `${step.due_at * 100}%` }}
      title={step.text}
    >
      <div
        className="h-2 w-2 rounded-full border"
        style={{ backgroundColor: fill, borderColor: edge }}
      />
    </div>
  )
}

// ---------- Mobile row ----------

function MobileRow({ project, collabLookup, monthStart, monthEnd }: {
  project: TimelineProject
  collabLookup: Record<string, TimelineCollaborator>
  monthStart: number
  monthEnd: number
}) {
  const status = STATUS_CFG[project.status] ?? STATUS_CFG.idea
  const monthSpan = monthEnd - monthStart
  const leadId = project.lead ?? project.contributors[0] ?? null
  const lead = leadId ? collabLookup[leadId] ?? null : null
  const leadCol = leadColors(lead)
  const totalPhases = project.phases.length
  const clipped = project.phases
    .map((ph, originalIndex) => ({
      ...ph,
      originalIndex,
      start: Math.max(ph.start, monthStart),
      end: Math.min(ph.end, monthEnd),
    }))
    .filter(ph => ph.end > ph.start)

  return (
    <li className="border-l-2 pl-3 py-2" style={{ borderLeftColor: leadCol.solid }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10px] text-white/25 tabular-nums">{project.num}</span>
        <h3 className="text-[14px] font-medium tracking-[-0.1px] text-white/92" title={project.name}>{project.name}</h3>
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full', status.dot)} />
      </div>
      {project.one_liner && <p className="text-[12px] text-white/65 leading-relaxed mb-2">{project.one_liner}</p>}
      <ContribStack ids={project.contributors} leadId={leadId} lookup={collabLookup} />
      <div className="relative mt-2 h-2 bg-white/[0.06] rounded-sm overflow-hidden">
        {clipped.map((ph, i) => {
          const l = ((ph.start - monthStart) / monthSpan) * 100
          const w = ((ph.end - ph.start) / monthSpan) * 100
          const bgColor = ph.kind === 'wait' ? 'rgba(255, 255, 255, 0.25)' : leadCol.solid
          const prog = phaseProgress(ph.originalIndex, totalPhases, project.steps)
          const isComplete = prog >= 1
          return (
            <div key={i} className="absolute inset-y-0" style={{ left: `${l}%`, width: `${w}%` }}>
              <div className="absolute inset-0 opacity-80" style={{ backgroundColor: bgColor }} />
              {prog > 0 && (
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${prog * 100}%`,
                    backgroundColor: isComplete ? '#8AE08D' : '#fff',
                    opacity: isComplete ? 0.85 : 0.55,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </li>
  )
}

// ---------- Contributor chips ----------

function ContribStack({ ids, leadId, lookup }: { ids: string[]; leadId?: string | null; lookup: Record<string, TimelineCollaborator> }) {
  // Render lead first so it sits at the front of the stack with a ring.
  const ordered = leadId && ids.includes(leadId) ? [leadId, ...ids.filter(id => id !== leadId)] : ids
  return (
    <div className="flex items-center" title={ordered.map(id => `${lookup[id]?.name ?? id}${id === leadId ? ' (lead)' : ''}`).join(', ')}>
      {ordered.map((id, i) => {
        const c = lookup[id]
        if (!c) return null
        const isLead = id === leadId
        return (
          <span key={id} style={{ marginLeft: i === 0 ? 0 : -6, zIndex: ordered.length - i }} className="relative">
            <ContribChip c={c} size="sm" isLead={isLead} />
          </span>
        )
      })}
    </div>
  )
}

function ContribChip({ c, size = 'sm', isLead = false }: { c: TimelineCollaborator; size?: 'sm' | 'md'; isLead?: boolean }) {
  const dim = size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-6 w-6 text-[10px]'
  const hex = COLLAB_COLORS[c.initials]
  let bg: string
  let fg: string
  if (c.neutral) {
    bg = 'rgba(255, 255, 255, 0.18)'
    fg = 'rgba(255, 255, 255, 0.78)'
  } else if (hex) {
    bg = hex
    fg = isLightHex(hex) ? '#101032' : '#fff'
  } else {
    bg = `hsl(${c.hue} 26% 36%)`
    fg = `hsl(${c.hue} 34% 88%)`
  }
  const base = 'items-center justify-center rounded-full font-mono uppercase tracking-[0.04em] border-[1.5px]'

  return (
    <span
      className={cn('inline-flex border-[#101032]', base, dim, isLead && 'ring-[1.5px] ring-white ring-offset-[1.5px] ring-offset-[#101032]')}
      style={{ backgroundColor: bg, color: fg }}
      aria-label={isLead ? `${c.name} (lead)` : c.name}
      title={isLead ? `${c.name} — Lead` : c.name}
    >{c.initials}</span>
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
