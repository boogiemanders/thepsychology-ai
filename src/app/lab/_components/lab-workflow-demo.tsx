'use client'

import { startTransition, useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  LabDetailTone,
  WorkflowBlock,
  WorkflowFieldState,
  WorkflowStep,
} from '../_lib/lab-detail-types'

const toneClasses: Record<
  LabDetailTone,
  {
    buttonActive: string
    buttonIdle: string
    chip: string
    stat: string
    panel: string
  }
> = {
  blue: {
    buttonActive:
      'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
    buttonIdle:
      'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
    chip:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
    stat:
      'border-sky-200/70 bg-sky-50/70 dark:border-sky-900/50 dark:bg-sky-950/20',
    panel:
      'border-sky-200/70 bg-sky-50/50 dark:border-sky-900/40 dark:bg-sky-950/15',
  },
  emerald: {
    buttonActive:
      'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    buttonIdle:
      'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
    chip:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
    stat:
      'border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20',
    panel:
      'border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/15',
  },
  amber: {
    buttonActive:
      'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    buttonIdle:
      'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
    chip:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
    stat:
      'border-amber-200/70 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20',
    panel:
      'border-amber-200/70 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/15',
  },
  rose: {
    buttonActive:
      'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    buttonIdle:
      'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
    chip:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
    stat:
      'border-rose-200/70 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20',
    panel:
      'border-rose-200/70 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/15',
  },
  zinc: {
    buttonActive:
      'border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
    buttonIdle:
      'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
    chip:
      'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
    stat:
      'border-zinc-200/70 bg-zinc-50/80 dark:border-zinc-800/60 dark:bg-zinc-900/60',
    panel:
      'border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-800/60 dark:bg-zinc-900/50',
  },
}

const fieldStateClasses: Record<WorkflowFieldState, string> = {
  complete:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
  active:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300',
  pending:
    'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
  watch:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
}

function renderBlock(block: WorkflowBlock, accent: LabDetailTone) {
  switch (block.type) {
    case 'metrics':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.items.map(item => (
            <div
              key={`${block.title ?? 'metric'}-${item.label}`}
              className={cn(
                'rounded-2xl border px-4 py-3',
                toneClasses[item.tone ?? accent].stat
              )}
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )

    case 'fields':
      return (
        <div className="rounded-2xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h4 className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              {block.title}
            </h4>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {block.items.map(item => (
              <div
                key={`${block.title}-${item.label}`}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[1.1fr_1.6fr_auto] sm:items-center"
              >
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </div>
                <div className="text-sm text-zinc-900 dark:text-zinc-100">
                  {item.value}
                </div>
                {item.state ? (
                  <span
                    className={cn(
                      'inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em]',
                      fieldStateClasses[item.state]
                    )}
                  >
                    {item.state}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )

    case 'pills':
      return (
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/70">
          <h4 className="mb-3 text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            {block.title}
          </h4>
          <div className="flex flex-wrap gap-2">
            {block.items.map(item => (
              <span
                key={`${block.title}-${item}`}
                className={cn(
                  'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium',
                  toneClasses[accent].chip
                )}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )

    case 'text':
      return (
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/70">
          <h4 className="mb-3 text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            {block.title}
          </h4>
          <p
            className={cn(
              'whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300',
              block.monospace && 'font-mono text-[12px] leading-6'
            )}
          >
            {block.body}
          </p>
        </div>
      )

    case 'transcript':
      return (
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/70">
          <h4 className="mb-3 text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            {block.title}
          </h4>
          <div className="space-y-3">
            {block.items.map((item, index) => (
              <div
                key={`${block.title}-${index}-${item.time ?? 'na'}`}
                className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em]',
                      item.speaker === 'client'
                        ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300'
                        : item.speaker === 'clinician'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                    )}
                  >
                    {item.speaker}
                  </span>
                  {item.time ? (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {item.time}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'sections':
      return (
        <div className="space-y-3">
          {block.title ? (
            <h4 className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              {block.title}
            </h4>
          ) : null}
          <div className="grid gap-3 lg:grid-cols-2">
            {block.items.map(item => (
              <div
                key={`${item.label}-${item.body.slice(0, 24)}`}
                className={cn(
                  'rounded-2xl border px-4 py-4',
                  toneClasses[accent].panel
                )}
              >
                <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'references':
      return (
        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/70">
          <h4 className="mb-3 text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            {block.title}
          </h4>
          <div className="space-y-3">
            {block.items.map(item => (
              <article
                key={`${item.title}-${item.meta}`}
                className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </div>
                <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                  {item.meta}
                </div>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {item.preview}
                </p>
              </article>
            ))}
          </div>
        </div>
      )
  }
}

export function LabWorkflowDemo({
  accent,
  steps,
}: {
  accent: LabDetailTone
  steps: WorkflowStep[]
}) {
  const [activeStepId, setActiveStepId] = useState(steps[0]?.id ?? '')
  const activeStep = steps.find(step => step.id === activeStepId) ?? steps[0]

  if (!activeStep) return null

  return (
    <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
      <div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
          {steps.map((step, index) => {
            const active = step.id === activeStep.id
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setActiveStepId(step.id)
                  })
                }}
                className={cn(
                  'min-w-[180px] rounded-2xl border px-4 py-3 text-left transition-colors xl:w-full',
                  active ? toneClasses[accent].buttonActive : toneClasses[accent].buttonIdle
                )}
              >
                <div className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em]">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="text-sm font-medium">{step.label}</div>
              </button>
            )
          })}
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/70">
          <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
            {activeStep.label}
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {activeStep.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {activeStep.summary}
          </p>
          <ul className="mt-5 space-y-3">
            {activeStep.bullets.map(item => (
              <li
                key={item}
                className="flex gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        {activeStep.blocks.map((block, index) => (
          <div key={`${activeStep.id}-block-${index}`}>
            {renderBlock(block, accent)}
          </div>
        ))}
      </div>
    </div>
  )
}
