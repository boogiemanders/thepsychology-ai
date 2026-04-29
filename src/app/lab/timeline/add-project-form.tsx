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

interface StepDraft {
  text: string
  due_at?: number
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
    steps: { text: string; done: boolean; due_at?: number; start_at?: number }[]
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
  { key: 'btr',   label: 'Build, Test, Rollout', stages: [
    { kind: 'build',   label: 'Build',   weight: 0.6 },
    { kind: 'test',    label: 'Test',    weight: 0.2 },
    { kind: 'rollout', label: 'Rollout', weight: 0.2 },
  ]},
  { key: 'btl',   label: 'Build, Test, Launch', stages: [
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

const PHASE_COLORS: Record<PhaseKind, string> = {
  build:   'bg-[#FFB990]',
  test:    'bg-[#9DADE5]',
  rollout: 'bg-[#3362FF]',
  live:    'bg-[#8AE08D]',
  wait:    'bg-white/30',
}

const INPUT_CLS = 'w-full px-3 py-2 text-sm bg-transparent border border-white/15 text-white placeholder:text-white/30 rounded-md focus:outline-none focus:border-[#9DADE5] transition-colors'
const LABEL_CLS = 'block text-[10px] font-mono uppercase tracking-[0.18em] text-white/45 mb-1.5'
const PILL_BASE = 'px-2.5 py-1 text-[11px] font-mono border rounded-full transition-colors cursor-pointer'
const PILL_ACTIVE = 'border-[#9DADE5] bg-[rgba(157,173,229,0.10)] text-white'
const PILL_INACTIVE = 'border-white/15 text-white/65 hover:border-white/40 hover:text-white'
const TOGGLE_BTN_BASE = 'flex-1 px-2 py-1.5 text-[11px] font-mono border rounded-md transition-colors cursor-pointer'

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
  const [steps, setSteps] = useState<StepDraft[]>([{ text: '' }])
  const [support, setSupport] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const startFrac = dateToFraction(startMonth, startDay)
  const endFrac = dateToFraction(endMonth, endDay)

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key)
    const t = TEMPLATES.find(tt => tt.key === key) ?? TEMPLATES[0]
    setPhases(buildPhasesFromTemplate(t, startFrac, endFrac))
  }

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

  const updateStep = (idx: number, patch: Partial<StepDraft>) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }
  const removeStep = (idx: number) => {
    setSteps(prev => prev.filter((_, i) => i !== idx))
  }
  const addStep = () => {
    setSteps(prev => [...prev, { text: '' }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || endFrac <= startFrac) return

    setSubmitting(true)

    const filled = steps.map(s => ({ ...s, text: s.text.trim() })).filter(s => s.text)
    const span = endFrac - startFrac
    const stepsOut = filled.map((s, i) => ({
      text: s.text,
      done: false,
      due_at: s.due_at ?? (filled.length > 0 ? startFrac + ((i + 1) / filled.length) * span : undefined),
    }))

    await onSubmit({
      name: name.trim(),
      one_liner: oneLiner.trim(),
      priority,
      status,
      contributors: selectedContributors,
      phases,
      steps: stepsOut,
      support: support.trim() || undefined,
    })
    setSubmitting(false)
    onClose()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-white/[0.08] rounded-lg bg-white/[0.03] p-6 space-y-5"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#9DADE5]">
          Add Project
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-white/45 hover:text-white transition-colors text-sm cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className={LABEL_CLS}>Project Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className={INPUT_CLS}
          placeholder="e.g. Website Redesign"
        />
      </div>

      <div>
        <label className={LABEL_CLS}>One-liner</label>
        <input
          type="text"
          value={oneLiner}
          onChange={e => setOneLiner(e.target.value)}
          className={INPUT_CLS}
          placeholder="Short description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Priority</label>
          <div className="flex gap-1">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={cn(TOGGLE_BTN_BASE, priority === p.value ? PILL_ACTIVE : PILL_INACTIVE)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Status</label>
          <div className="flex gap-1">
            {STATUSES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={cn(TOGGLE_BTN_BASE, status === s.value ? PILL_ACTIVE : PILL_INACTIVE)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={LABEL_CLS}>Contributors</label>
        <div className="flex flex-wrap gap-1.5">
          {collaborators.map(c => (
            <button
              key={c.initials}
              type="button"
              onClick={() => toggleContributor(c.initials)}
              className={cn(PILL_BASE, selectedContributors.includes(c.initials) ? PILL_ACTIVE : PILL_INACTIVE)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Starts</label>
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
          <label className={LABEL_CLS}>Ends</label>
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

      <div>
        <label className={cn(LABEL_CLS, 'mb-2')}>Stages</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TEMPLATES.filter(t => t.key !== 'custom').map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTemplateChange(t.key)}
              className={cn('px-3 py-1.5 text-[11px] font-mono border rounded-md transition-colors cursor-pointer',
                templateKey === t.key ? PILL_ACTIVE : PILL_INACTIVE
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

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
                <span className="text-[10px] text-white/40">to</span>
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
                    className="text-[10px] font-mono text-[#D67263] hover:text-[#FFB990] transition-colors cursor-pointer"
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
            className="text-[11px] font-mono text-[#9DADE5] hover:text-white transition-colors cursor-pointer"
          >
            + Add stage
          </button>
        </div>

        {endFrac > startFrac && (
          <div className="relative h-3 bg-white/[0.06] rounded-sm overflow-hidden">
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
                <span key={i} className="text-[9px] font-mono text-white/40">
                  {m?.label} {d.day}
                </span>
              )
            })}
            {phases.length > 0 && (() => {
              const last = phases[phases.length - 1]
              const d = fractionToDate(last.end)
              const m = MONTH_META.find(mm => mm.num === d.monthNum)
              return (
                <span className="text-[9px] font-mono text-white/40">
                  {m?.label} {d.day}
                </span>
              )
            })()}
          </div>
        )}
      </div>

      <div>
        <label className={cn(LABEL_CLS, 'mb-2')}>Action Steps</label>
        <p className="text-[10px] font-mono text-white/40 mb-2">
          Steps without a date get spaced evenly across the project span.
        </p>
        <div className="space-y-2">
          {steps.map((s, i) => {
            const dueObj = s.due_at !== undefined ? fractionToDate(s.due_at) : null
            return (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={s.text}
                  onChange={e => updateStep(i, { text: e.target.value })}
                  className={cn(INPUT_CLS, 'flex-1')}
                  placeholder={`Step ${i + 1}`}
                />
                <Select
                  value={dueObj ? String(dueObj.monthNum) : ''}
                  onValueChange={(v) => {
                    const m = Number(v)
                    updateStep(i, { due_at: dateToFraction(m, daysInMonth(m)) })
                  }}
                >
                  <SelectTrigger className="h-9 w-[88px] text-[11px] font-mono">
                    <SelectValue placeholder="Due" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_META.map(m => (
                      <SelectItem key={m.num} value={String(m.num)} className="text-[11px] font-mono">{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="text-[10px] font-mono text-[#D67263] hover:text-[#FFB990] transition-colors cursor-pointer px-1"
                    aria-label="Remove step"
                  >
                    x
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-2 text-[11px] font-mono text-[#9DADE5] hover:text-white transition-colors cursor-pointer"
        >
          + Add step
        </button>
      </div>

      <div>
        <label className={LABEL_CLS}>Support Needed</label>
        <input
          type="text"
          value={support}
          onChange={e => setSupport(e.target.value)}
          className={INPUT_CLS}
          placeholder="Who or what do you need?"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim() || endFrac <= startFrac || submitting}
        className={cn(
          'w-full py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer',
          'bg-[#FFB990] text-[#101032] hover:bg-[#FFE7DA]',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        {submitting ? 'Adding...' : 'Add Project'}
      </button>
    </form>
  )
}
