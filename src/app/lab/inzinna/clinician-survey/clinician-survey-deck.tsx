'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { cn } from '@/lib/utils'

// Emil's strong ease-out — stock CSS easings feel sluggish.
const EASE_OUT = [0.23, 1, 0.32, 1] as const

const slideVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.985 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: EASE_OUT, staggerChildren: 0.04, delayChildren: 0.05 },
  },
  exit: { opacity: 0, y: -6, scale: 0.99, transition: { duration: 0.16, ease: EASE_OUT } },
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } },
}

type BarTone = 'strong' | 'warn' | 'muted' | undefined

type Bar = { label: string; value: number; max: number; tone?: BarTone }

export type DeckSlide =
  | {
      kind: 'title'
      eyebrow: string
      title: string
      subtitle?: string
      meta?: string
    }
  | {
      kind: 'stats'
      eyebrow: string
      title: string
      stats: { value: string; label: string }[]
      footer?: string
    }
  | {
      kind: 'bars'
      eyebrow: string
      title: string
      intro?: string
      bars: Bar[]
      footer?: string
    }
  | {
      kind: 'list'
      eyebrow: string
      title: string
      intro?: string
      items: { tag: string; text: string }[]
    }
  | {
      kind: 'dealbreakers'
      eyebrow: string
      title: string
      intro?: string
      items: { rule: string; who: string }[]
      footer?: string
    }
  | {
      kind: 'quotes'
      eyebrow: string
      title: string
      quotes: { body: string; who: string }[]
    }
  | {
      kind: 'rules'
      eyebrow: string
      title: string
      intro?: string
      rules: { n: string; rule: string; detail: string }[]
    }

export function ClinicianSurveyDeck({ slides }: { slides: DeckSlide[] }) {
  const [index, setIndex] = useState(0)
  const total = slides.length

  const go = useCallback(
    (delta: number) => {
      setIndex(prev => Math.max(0, Math.min(total - 1, prev + delta)))
    },
    [total],
  )

  const jump = useCallback((i: number) => setIndex(Math.max(0, Math.min(total - 1, i))), [total])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        jump(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        jump(total - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, jump, total])

  const slide = slides[index]

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            02 Inzinna
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            Live
          </span>
        </div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </header>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white px-6 py-10 sm:px-12 sm:py-16 dark:border-zinc-800 dark:bg-zinc-950 min-h-[520px] flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            variants={slideVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="flex flex-1 flex-col"
          >
            <SlideBody slide={slide} />
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="text-[12px] font-medium uppercase tracking-[0.15em] text-zinc-500 transition-[color,transform] duration-150 ease-out hover:text-zinc-900 active:scale-[0.97] disabled:opacity-30 disabled:hover:text-zinc-500 disabled:active:scale-100 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          &larr; Prev
        </button>

        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => jump(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index
                  ? 'w-6 bg-zinc-900 dark:bg-zinc-100'
                  : 'w-1.5 bg-zinc-300 hover:bg-zinc-500 dark:bg-zinc-700 dark:hover:bg-zinc-500',
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === total - 1}
          className="text-[12px] font-medium uppercase tracking-[0.15em] text-zinc-500 transition-[color,transform] duration-150 ease-out hover:text-zinc-900 active:scale-[0.97] disabled:opacity-30 disabled:hover:text-zinc-500 disabled:active:scale-100 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Next &rarr;
        </button>
      </footer>

      <p className="mt-4 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
        Use &larr; &rarr; keys to navigate.
      </p>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
      {children}
    </p>
  )
}

function SlideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
      {children}
    </h2>
  )
}

function Intro({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
      {children}
    </p>
  )
}

function SlideBody({ slide }: { slide: DeckSlide }) {
  if (slide.kind === 'title') {
    return (
      <div className="flex h-full flex-1 flex-col justify-center">
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-100">
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
            {slide.subtitle}
          </p>
        )}
        {slide.meta && (
          <p className="mt-10 text-[12px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600">
            {slide.meta}
          </p>
        )}
      </div>
    )
  }

  if (slide.kind === 'stats') {
    return (
      <div>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <SlideTitle>{slide.title}</SlideTitle>
        <motion.div
          className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4"
          variants={{ enter: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
          initial="initial"
          animate="enter"
        >
          {slide.stats.map(s => (
            <motion.div
              key={s.label}
              variants={itemVariants}
              className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <div className="text-4xl font-semibold text-zinc-900 dark:text-zinc-100">{s.value}</div>
              <div className="mt-2 text-[12px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
        {slide.footer && (
          <p className="mt-8 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{slide.footer}</p>
        )}
      </div>
    )
  }

  if (slide.kind === 'bars') {
    return (
      <div>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <SlideTitle>{slide.title}</SlideTitle>
        {slide.intro && <Intro>{slide.intro}</Intro>}
        <motion.ul
          className="mt-8 space-y-3"
          variants={{ enter: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
          initial="initial"
          animate="enter"
        >
          {slide.bars.map(b => {
            const pct = Math.round((b.value / b.max) * 100)
            return (
              <motion.li key={b.label} variants={itemVariants}>
                <div className="mb-1 flex items-baseline justify-between gap-4">
                  <span
                    className={cn(
                      'text-[14px]',
                      b.tone === 'muted'
                        ? 'text-zinc-400 dark:text-zinc-600'
                        : 'text-zinc-700 dark:text-zinc-300',
                    )}
                  >
                    {b.label}
                  </span>
                  <span className="font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
                    {formatBarValue(b)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <motion.div
                    className={cn('h-1.5 rounded-full origin-left', barToneClass(b.tone))}
                    style={{ width: `${pct}%` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.15 }}
                  />
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
        {slide.footer && (
          <p className="mt-8 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{slide.footer}</p>
        )}
      </div>
    )
  }

  if (slide.kind === 'list') {
    return (
      <div>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <SlideTitle>{slide.title}</SlideTitle>
        {slide.intro && <Intro>{slide.intro}</Intro>}
        <motion.ul
          className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800"
          variants={{ enter: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } } }}
          initial="initial"
          animate="enter"
        >
          {slide.items.map((item, i) => (
            <motion.li key={i} variants={itemVariants} className="flex items-start gap-4 py-3.5">
              <span className="mt-0.5 inline-flex min-w-[64px] items-center rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {item.tag}
              </span>
              <span className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{item.text}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    )
  }

  if (slide.kind === 'dealbreakers') {
    return (
      <div>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <SlideTitle>{slide.title}</SlideTitle>
        {slide.intro && <Intro>{slide.intro}</Intro>}
        <motion.ul
          className="mt-8 space-y-3"
          variants={{ enter: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
          initial="initial"
          animate="enter"
        >
          {slide.items.map((item, i) => (
            <motion.li
              key={i}
              variants={itemVariants}
              className="rounded-xl border border-rose-200 bg-rose-50/50 px-5 py-4 dark:border-rose-900/50 dark:bg-rose-950/15"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-[15px] text-zinc-800 dark:text-zinc-200">{item.rule}</p>
                <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-rose-700 dark:text-rose-400">
                  {item.who}
                </span>
              </div>
            </motion.li>
          ))}
        </motion.ul>
        {slide.footer && (
          <p className="mt-8 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{slide.footer}</p>
        )}
      </div>
    )
  }

  if (slide.kind === 'quotes') {
    return (
      <div>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <SlideTitle>{slide.title}</SlideTitle>
        <motion.div
          className="mt-8 grid gap-4 sm:grid-cols-2"
          variants={{ enter: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
          initial="initial"
          animate="enter"
        >
          {slide.quotes.map((q, i) => (
            <motion.figure
              key={i}
              variants={itemVariants}
              className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <blockquote className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-200">
                &ldquo;{q.body}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                {q.who}
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    )
  }

  if (slide.kind === 'rules') {
    return (
      <div>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <SlideTitle>{slide.title}</SlideTitle>
        {slide.intro && <Intro>{slide.intro}</Intro>}
        <motion.ul
          className="mt-8 space-y-3"
          variants={{ enter: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
          initial="initial"
          animate="enter"
        >
          {slide.rules.map(r => (
            <motion.li
              key={r.n}
              variants={itemVariants}
              className="flex items-start gap-5 rounded-xl border border-zinc-200 px-5 py-4 dark:border-zinc-800"
            >
              <span className="font-mono text-[12px] text-zinc-400 dark:text-zinc-600">{r.n}</span>
              <div>
                <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">{r.rule}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{r.detail}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    )
  }

  return null
}

function barToneClass(tone: BarTone) {
  if (tone === 'strong') return 'bg-emerald-500 dark:bg-emerald-400'
  if (tone === 'warn') return 'bg-rose-400 dark:bg-rose-500'
  if (tone === 'muted') return 'bg-zinc-300 dark:bg-zinc-700'
  return 'bg-zinc-700 dark:bg-zinc-300'
}

function formatBarValue(b: Bar) {
  if (b.max === 7) return `${b.value} / 7`
  if (b.max === 5) return `${b.value.toFixed(2)}`
  return `${b.value} / ${b.max}`
}
