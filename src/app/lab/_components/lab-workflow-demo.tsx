'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type {
  LabDetailTone,
  WorkflowBlock,
  WorkflowStep,
} from '../_lib/lab-detail-types'

const toneClasses: Record<
  LabDetailTone,
  {
    accentText: string
    accentBar: string
    chip: string
  }
> = {
  blue: {
    accentText: 'text-sky-700 dark:text-sky-300',
    accentBar: 'bg-sky-500 dark:bg-sky-400',
    chip:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
  },
  emerald: {
    accentText: 'text-emerald-700 dark:text-emerald-300',
    accentBar: 'bg-emerald-500 dark:bg-emerald-400',
    chip:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  amber: {
    accentText: 'text-amber-700 dark:text-amber-300',
    accentBar: 'bg-amber-500 dark:bg-amber-400',
    chip:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
  },
  rose: {
    accentText: 'text-rose-700 dark:text-rose-300',
    accentBar: 'bg-rose-500 dark:bg-rose-400',
    chip:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
  },
  zinc: {
    accentText: 'text-zinc-900 dark:text-zinc-100',
    accentBar: 'bg-zinc-500 dark:bg-zinc-400',
    chip:
      'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
  },
}

function BlockTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
      {children}
    </h4>
  )
}

function renderBlock(block: WorkflowBlock, accent: LabDetailTone) {
  switch (block.type) {
    case 'metrics':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.items.map(item => (
            <div
              key={`${block.title ?? 'metric'}-${item.label}`}
              className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40"
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
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              {block.title}
            </h4>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {block.items.map(item => (
              <div
                key={`${block.title}-${item.label}`}
                className="grid gap-3 px-4 py-2.5 sm:grid-cols-[1.1fr_1.6fr] sm:items-baseline"
              >
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </div>
                <div className="text-sm text-zinc-900 dark:text-zinc-100">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'pills':
      return (
        <div className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <BlockTitle>{block.title}</BlockTitle>
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
        <div className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <BlockTitle>{block.title}</BlockTitle>
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
        <div>
          <BlockTitle>{block.title}</BlockTitle>
          <div className="space-y-4">
            {block.items.map((item, index) => (
              <div
                key={`${block.title}-${index}-${item.time ?? 'na'}`}
                className="border-l border-zinc-200 pl-4 dark:border-zinc-800"
              >
                <div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  <span>{item.speaker}</span>
                  {item.time ? (
                    <span className="text-zinc-300 dark:text-zinc-700">
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
          {block.title ? <BlockTitle>{block.title}</BlockTitle> : null}
          <div className="grid gap-6 lg:grid-cols-2">
            {block.items.map(item => (
              <div
                key={`${item.label}-${item.body.slice(0, 24)}`}
                className="border-l border-zinc-200 pl-4 dark:border-zinc-800"
              >
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
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
        <div>
          <BlockTitle>{block.title}</BlockTitle>
          <div className="space-y-4">
            {block.items.map(item => (
              <article
                key={`${item.title}-${item.meta}`}
                className="border-l border-zinc-200 pl-4 dark:border-zinc-800"
              >
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </div>
                <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (steps.length === 0) return
    const compute = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const viewportH = window.innerHeight
      const total = rect.height - viewportH
      if (total <= 0) return
      const scrolled = Math.min(Math.max(-rect.top, 0), total)
      const progress = scrolled / total
      const idx = Math.min(
        steps.length - 1,
        Math.max(0, Math.floor(progress * steps.length * 0.9999))
      )
      setActive(prev => (prev !== idx ? idx : prev))
    }
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [steps.length])

  const jumpToStep = (i: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const total = rect.height - window.innerHeight
    if (total <= 0) return
    const target =
      window.scrollY + rect.top + (i + 0.5) * (total / steps.length)
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

  const activeStep = steps[active] ?? steps[0]
  if (!activeStep) return null
  const tone = toneClasses[accent]

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: `${steps.length * 85}vh` }}
    >
      <div className="sticky top-32 py-4">
        <div className="mb-10">
          <div className="relative h-[2px] w-full bg-zinc-200 dark:bg-zinc-800">
            <motion.div
              className={cn('absolute left-0 top-0 h-full w-full origin-left', tone.accentBar)}
              animate={{
                transform: `scaleX(${(active + 1) / steps.length})`,
              }}
              transition={{ type: 'spring', stiffness: 160, damping: 24, mass: 0.6 }}
            />
            <div className="absolute inset-x-0 top-0 flex justify-between">
              {steps.map((step, i) => {
                const done = i <= active
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => jumpToStep(i)}
                    aria-label={`Jump to step ${i + 1}: ${step.label}`}
                    className="group relative -mt-[5px] flex flex-col items-center outline-none active:[&>span]:scale-[0.85]"
                  >
                    <span
                      className={cn(
                        'h-3 w-3 rounded-full border-2 transition-[background-color,border-color,transform] duration-150 ease-out',
                        done
                          ? cn(tone.accentBar, 'border-transparent')
                          : 'border-zinc-300 bg-white group-hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:group-hover:border-zinc-500'
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 hidden justify-between text-[10px] font-mono uppercase tracking-[0.14em] sm:flex">
            {steps.map((step, i) => (
              <button
                key={`${step.id}-label`}
                type="button"
                onClick={() => jumpToStep(i)}
                className={cn(
                  'max-w-[15ch] truncate transition-[color,transform] duration-150 ease-out active:scale-[0.97]',
                  i === active
                    ? tone.accentText
                    : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400'
                )}
                style={{
                  textAlign:
                    i === 0 ? 'left' : i === steps.length - 1 ? 'right' : 'center',
                }}
              >
                {String(i + 1).padStart(2, '0')} {step.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative max-h-[calc(100vh-11rem)] overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(6px)' }}
              animate={{ opacity: 1, transform: 'translateY(0px)', filter: 'blur(0px)' }}
              exit={{ opacity: 0, transform: 'translateY(-8px)', filter: 'blur(6px)' }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            >
              <div
                className={cn(
                  'mb-2 text-[10px] font-mono uppercase tracking-[0.16em]',
                  tone.accentText
                )}
              >
                Step {String(active + 1).padStart(2, '0')} · {activeStep.label}
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {activeStep.title}
              </h3>
              {activeStep.summary ? (
                <p className="mt-2 mb-8 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {activeStep.summary}
                </p>
              ) : (
                <div className="mb-6" />
              )}
              <div className="space-y-5">
                {activeStep.blocks.map((block, index) => (
                  <div key={`${activeStep.id}-block-${index}`}>
                    {renderBlock(block, accent)}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
