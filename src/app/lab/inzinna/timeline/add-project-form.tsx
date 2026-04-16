'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { TimelineCollaborator, TimelinePhase } from './use-timeline'
import { MONTH_META, dateToFraction, fractionToDate, daysInMonth } from './date-utils'

// ---------- Types ----------

type PhaseKind = 'build' | 'test' | 'rollout' | 'live' | 'wait'

interface TemplateOption {
  key: string
  label: string
  stages: { kind: PhaseKind; label: string; weight: number }[]
}

interface AddProjectFormProps {
  collaborators: TimelineCollaborator[]
  activeUser: string
  onSubmit: (data: {
    name: string
    one_liner: string
    priority: string
    status: string
    contributors: string[]
    phases: TimelinePhase[]
    steps: { text: string; done: boolean }[]
    support?: string
  }) => Promise<void>
  onClose: () => void
}

// ---------- Constants ----------

const PRIORITIES = [
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
]

const STATUSES = [
  { value: 'idea',     label: 'Idea' },
  { value: 'building', label: 'Building' },
  { value: 'blocked',  label: 'Blocked' },
  { value: 'live',     label: 'Live' },
]

const TEMPLATES: TemplateOption[] = [
  { key: 'build', label: 'Build only', stages: [{ kind: 'build', label: 'Build', weight: 1 }] },
  { key: 'btr',   label: 'Build > Test > Rollout', stages: [
    { kind: 'build',   label: 'Build',   weight: 0.6 },
    { kind: 'test',    label: 'Test',    weight: 0.2 },
    { kind: 'rollout', label: 'Rollout', weight: 0.2 },
  ]},
  { key: 'btl',   label: 'Build > Test > Launch', stages: [
    { kind: 'build', label: 'Build', weight: 0.5 },
    { kind: 'test',  label: 'Test',  weight: 0.25 },
    { kind: 'live',  label: 'Live',  weight: 0.25 },
  ]},
  { key: 'custom', label: 'Custom', stages: [{ kind: 'build', label: 'Build', weight: 1 }] },
]

const KIND_OPTIONS: { value: PhaseKind; label: string }[] = [
  { value: 'build',   label: 'Build' },
  { value: 'test',    label: 'Test' },
  { value: 'rollout', label: 'Rollout' },
  { value: 'live',    label: 'Live' },
  { value: 'wait',    label: 'Wait' },
]

// ---------- Phase color lookup (matches timeline-view) ----------

const PHASE_COLORS: Record<PhaseKind, string> = {
  build:   'bg-zinc-800 dark:bg-zinc-200',
  test:    'bg-zinc-800/40 dark:bg-zinc-200/40',
  rollout: 'bg-zinc-800/60 dark:bg-zinc-200/60',
  live:    'bg-emerald-500/60',
  wait:    'bg-zinc-300/60 dark:bg-zinc-700/60',
}

// ---------- Helpers ----------

function buildPhasesFromTemplate(
  template: TemplateOption,
  startFrac: number,
  endFrac: number
): TimelinePhase[] {
  const span = endFrac - startFrac
  let cursor = startFrac
  return template.stages.map((s) => {
    const phaseSpan = span * s.weight
    const phase: TimelinePhase = {
      kind: s.kind,
      start: cursor,
      end: cursor + phaseSpan,
      label: s.label,
    }
    cursor += phaseSpan
    return phase
  })
}

// ---------- Component ----------

export function AddProjectForm({ collaborators, activeUser, onSubmit, onClose }: AddProjectFormProps) {
  const [name, setName] = useState('')
  const [oneLiner, setOneLiner] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('idea')
  const [selectedContributors, setSelectedContributors] = useState<string[]>([activeUser])
  const [startMonth, setStartMonth] = useState(5)
  const [startDay, setStartDay] = useState(1)
  const [endMonth, setEndMonth] = useState(6)
  const [endDay, setEndDay] = useState(30)
  const [templateKey, setTemplateKey] = useState('build')
  const [phases, setPhases] = useState<TimelinePhase[]>(() =>
    buildPhasesFromTemplate(TEMPLATES[0], dateToFraction(5, 1), dateToFraction(6, 30))
  )
  const [stepsText, setStepsText] = useState('')
  const [support, setSupport] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const startFrac = dateToFraction(startMonth, startDay)
  const endFrac = dateToFraction(endMonth, endDay)

  // When template or overall dates change, regenerate phases from template
  const handleTemplateChange = (key: string) => {
    setTemplateKey(key)
    const t = TEMPLATES.find(tt => tt.key === key) ?? TEMPLATES[0]
    setPhases(buildPhasesFromTemplate(t, startFrac, endFrac))
  }

  // When overall start/end dates change, redistribute phases proportionally
  const handleDateRangeChange = (newStartFrac: number, newEndFrac: number) => {
    if (newEndFrac <= newStartFrac) return
    const oldStart = phases[0]?.start ?? startFrac
    const oldEnd = phases[phases.length - 1]?.end ?? endFrac
    const oldSpan = oldEnd - oldStart || 1
    const newSpan = newEndFrac - newStartFrac
    setPhases(prev => prev.map(ph => ({
      ...ph,
      start: newStartFrac + ((ph.start - oldStart) / oldSpan) * newSpan,
      end: newStartFrac + ((ph.end - oldStart) / oldSpan) * newSpan,
    })))
  }

  const toggleContributor = (initials: string) => {
    setSelectedContributors(prev =>
      prev.includes(initials) ? prev.filter(c => c !== initials) : [...prev, initials]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || endFrac <= startFrac) return

    setSubmitting(true)
    const steps = stepsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .map(text => ({ text, done: false }))

    await onSubmit({
      name: name.trim(),
      one_liner: oneLiner.trim(),
      priority,
      status,
      contributors: selectedContributors,
      phases,
      steps,
      support: support.trim() || undefined,
    })
    setSubmitting(false)
    onClose()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 p-6 space-y-5"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Add Project
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-sm cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Name */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-1.5">
          Project Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          placeholder="e.g. Website Redesign"
        />
      </div>

      {/* One-liner */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-1.5">
          One-liner
        </label>
        <input
          type="text"
          value={oneLiner}
          onChange={e => setOneLiner(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          placeholder="Short description"
        />
      </div>

      {/* Priority + Status row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-1.5">
            Priority
          </label>
          <div className="flex gap-1">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={cn(
                  'flex-1 px-2 py-1.5 text-[11px] font-mono border rounded-md transition-colors cursor-pointer',
                  priority === p.value
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-1.5">
            Status
          </label>
          <div className="flex gap-1">
            {STATUSES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={cn(
                  'flex-1 px-2 py-1.5 text-[11px] font-mono border rounded-md transition-colors cursor-pointer',
                  status === s.value
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contributors */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-1.5">
          Contributors
        </label>
        <div className="flex flex-wrap gap-1.5">
          {collaborators.map(c => (
            <button
              key={c.initials}
              type="button"
              onClick={() => toggleContributor(c.initials)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-mono border rounded-full transition-colors cursor-pointer',
                selectedContributors.includes(c.initials)
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600'
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-1.5">
            Starts
          </label>
          <div className="flex items-center gap-1.5">
            <Select value={String(startMonth)} onValueChange={(v) => {
              const m = Number(v)
              const d = Math.min(startDay, daysInMonth(m))
              setStartMonth(m)
              setStartDay(d)
              handleDateRangeChange(dateToFraction(m, d), endFrac)
            }}>
              <SelectTrigger className="h-8 w-[72px] text-[12px] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_META.map(m => (
                  <SelectItem key={m.num} value={String(m.num)} className="text-[12px] font-mono">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(startDay)} onValueChange={(v) => {
              const d = Number(v)
              setStartDay(d)
              handleDateRangeChange(dateToFraction(startMonth, d), endFrac)
            }}>
              <SelectTrigger className="h-8 w-[56px] text-[12px] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: daysInMonth(startMonth) }, (_, i) => i + 1).map(d => (
                  <SelectItem key={d} value={String(d)} className="text-[12px] font-mono">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-1.5">
            Ends
          </label>
          <div className="flex items-center gap-1.5">
            <Select value={String(endMonth)} onValueChange={(v) => {
              const m = Number(v)
              const d = Math.min(endDay, daysInMonth(m))
              setEndMonth(m)
              setEndDay(d)
              handleDateRangeChange(startFrac, dateToFraction(m, d))
            }}>
              <SelectTrigger className="h-8 w-[72px] text-[12px] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_META.map(m => (
                  <SelectItem key={m.num} value={String(m.num)} className="text-[12px] font-mono">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(endDay)} onValueChange={(v) => {
              const d = Number(v)
              setEndDay(d)
              handleDateRangeChange(startFrac, dateToFraction(endMonth, d))
            }}>
              <SelectTrigger className="h-8 w-[56px] text-[12px] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: daysInMonth(endMonth) }, (_, i) => i + 1).map(d => (
                  <SelectItem key={d} value={String(d)} className="text-[12px] font-mono">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stage template picker + editable rows */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-2">
          Stages
        </label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TEMPLATES.filter(t => t.key !== 'custom').map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTemplateChange(t.key)}
              className={cn(
                'px-3 py-1.5 text-[11px] font-mono border rounded-md transition-colors cursor-pointer',
                templateKey === t.key
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Editable stage rows — always visible */}
        <div className="space-y-2 mb-3">
          {phases.map((ph, i) => {
            const sd = fractionToDate(ph.start)
            const ed = fractionToDate(ph.end)
            return (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <Select value={ph.kind} onValueChange={(v) => {
                  const next = [...phases]
                  next[i] = { ...next[i], kind: v as PhaseKind, label: KIND_OPTIONS.find(k => k.value === v)?.label ?? v }
                  setPhases(next)
                }}>
                  <SelectTrigger className="h-7 w-[80px] text-[11px] font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_OPTIONS.map(k => (
                      <SelectItem key={k.value} value={k.value} className="text-[11px] font-mono">{k.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(sd.monthNum)} onValueChange={(v) => {
                  const m = Number(v)
                  const next = [...phases]
                  next[i] = { ...next[i], start: dateToFraction(m, Math.min(sd.day, daysInMonth(m))) }
                  setPhases(next)
                }}>
                  <SelectTrigger className="h-7 w-[60px] text-[11px] font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_META.map(m => (
                      <SelectItem key={m.num} value={String(m.num)} className="text-[11px] font-mono">{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(sd.day)} onValueChange={(v) => {
                  const next = [...phases]
                  next[i] = { ...next[i], start: dateToFraction(sd.monthNum, Number(v)) }
                  setPhases(next)
                }}>
                  <SelectTrigger className="h-7 w-[48px] text-[11px] font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: daysInMonth(sd.monthNum) }, (_, j) => j + 1).map(d => (
                      <SelectItem key={d} value={String(d)} className="text-[11px] font-mono">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-zinc-400">to</span>
                <Select value={String(ed.monthNum)} onValueChange={(v) => {
                  const m = Number(v)
                  const next = [...phases]
                  next[i] = { ...next[i], end: dateToFraction(m, Math.min(ed.day, daysInMonth(m))) }
                  setPhases(next)
                }}>
                  <SelectTrigger className="h-7 w-[60px] text-[11px] font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_META.map(m => (
                      <SelectItem key={m.num} value={String(m.num)} className="text-[11px] font-mono">{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(ed.day)} onValueChange={(v) => {
                  const next = [...phases]
                  next[i] = { ...next[i], end: dateToFraction(ed.monthNum, Number(v)) }
                  setPhases(next)
                }}>
                  <SelectTrigger className="h-7 w-[48px] text-[11px] font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: daysInMonth(ed.monthNum) }, (_, j) => j + 1).map(d => (
                      <SelectItem key={d} value={String(d)} className="text-[11px] font-mono">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {phases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPhases(prev => prev.filter((_, j) => j !== i))}
                    className="text-[10px] font-mono text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    x
                  </button>
                )}
              </div>
            )
          })}
          <button
            type="button"
            onClick={() => {
              const last = phases[phases.length - 1]
              const newStart = last?.end ?? startFrac
              const newEnd = Math.min(newStart + 0.06, endFrac, 1)
              setPhases(prev => [...prev, { kind: 'build', start: newStart, end: newEnd, label: 'Build' }])
            }}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            + Add stage
          </button>
        </div>

        {/* Visual preview */}
        {endFrac > startFrac && (
          <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-sm overflow-hidden">
            {phases.map((ph, i) => {
              const span = endFrac - startFrac
              const l = ((ph.start - startFrac) / span) * 100
              const w = ((ph.end - ph.start) / span) * 100
              return (
                <div
                  key={i}
                  className={cn('absolute inset-y-0 rounded-[1px]', PHASE_COLORS[ph.kind as PhaseKind] ?? PHASE_COLORS.build)}
                  style={{ left: `${Math.max(0, l)}%`, width: `${Math.max(0, w)}%` }}
                  title={ph.label}
                />
              )
            })}
          </div>
        )}
        {endFrac > startFrac && (
          <div className="flex justify-between mt-1">
            {phases.map((ph, i) => {
              const d = fractionToDate(ph.start)
              const m = MONTH_META.find(mm => mm.num === d.monthNum)
              return (
                <span key={i} className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                  {m?.label} {d.day}
                </span>
              )
            })}
            {phases.length > 0 && (() => {
              const last = phases[phases.length - 1]
              const d = fractionToDate(last.end)
              const m = MONTH_META.find(mm => mm.num === d.monthNum)
              return (
                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                  {m?.label} {d.day}
                </span>
              )
            })()}
          </div>
        )}
      </div>

      {/* Steps */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-1.5">
          Action Steps (one per line)
        </label>
        <textarea
          value={stepsText}
          onChange={e => setStepsText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors resize-none"
          placeholder={"Step 1\nStep 2\nStep 3"}
        />
      </div>

      {/* Support */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-1.5">
          Support Needed
        </label>
        <input
          type="text"
          value={support}
          onChange={e => setSupport(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          placeholder="Who or what do you need?"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim() || endFrac <= startFrac || submitting}
        className={cn(
          'w-full py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer',
          'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
          'hover:bg-zinc-800 dark:hover:bg-zinc-200',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        {submitting ? 'Adding...' : 'Add Project'}
      </button>
    </form>
  )
}
