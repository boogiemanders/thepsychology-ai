'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SENSE_DOMAINS, RESPONSE_SCALE } from './sense-questions'

/* ═══════════════ chakra palette ═══════════════ */

interface ChakraColor {
  hex: string
  glow: string       // box-shadow for selected dot
  faintBg: string    // tailwind bg for answered items
  faintBgDark: string
  line: string       // constellation line rgba
}

/* Autumn earth tones — lifted for dark mode visibility */
const CHAKRA: Record<number, ChakraColor> = {
  1: { hex: '#C46B6B', glow: '0 0 14px rgba(196,107,107,0.45)',  faintBg: 'bg-red-50/30',     faintBgDark: 'dark:bg-red-950/10',     line: 'rgba(196,107,107,0.18)' },
  2: { hex: '#D49068', glow: '0 0 14px rgba(212,144,104,0.45)',  faintBg: 'bg-orange-50/30',  faintBgDark: 'dark:bg-orange-950/10',  line: 'rgba(212,144,104,0.18)' },
  3: { hex: '#C4A852', glow: '0 0 14px rgba(196,168,82,0.45)',   faintBg: 'bg-amber-50/30',   faintBgDark: 'dark:bg-amber-950/10',   line: 'rgba(196,168,82,0.18)' },
  4: { hex: '#5E9E78', glow: '0 0 14px rgba(94,158,120,0.45)',   faintBg: 'bg-emerald-50/30', faintBgDark: 'dark:bg-emerald-950/10', line: 'rgba(94,158,120,0.18)' },
  5: { hex: '#6A8CA8', glow: '0 0 14px rgba(106,140,168,0.45)',  faintBg: 'bg-slate-50/30',   faintBgDark: 'dark:bg-slate-950/10',   line: 'rgba(106,140,168,0.18)' },
  6: { hex: '#9A70A0', glow: '0 0 14px rgba(154,112,160,0.45)',  faintBg: 'bg-purple-50/30',  faintBgDark: 'dark:bg-purple-950/10',  line: 'rgba(154,112,160,0.18)' },
}

const LABELS = RESPONSE_SCALE.map(r => r.label)

/* ═══════════════ constellation patterns ═══════════════ */
// 4 organic point layouts (x,y in 0-48 viewBox), cycled per subscale
const CONSTELLATIONS: { x: number; y: number }[][] = [
  [{x:8,y:6},{x:18,y:10},{x:30,y:4},{x:40,y:12},{x:12,y:20},{x:24,y:18},{x:36,y:24},{x:8,y:34},{x:28,y:36},{x:42,y:40}],
  [{x:6,y:12},{x:16,y:4},{x:26,y:14},{x:38,y:8},{x:10,y:26},{x:22,y:22},{x:34,y:30},{x:44,y:20},{x:18,y:38},{x:36,y:42}],
  [{x:12,y:4},{x:4,y:16},{x:20,y:12},{x:32,y:6},{x:42,y:18},{x:14,y:28},{x:28,y:24},{x:38,y:34},{x:8,y:40},{x:24,y:42}],
  [{x:10,y:8},{x:22,y:4},{x:36,y:10},{x:6,y:22},{x:18,y:18},{x:30,y:20},{x:42,y:28},{x:12,y:36},{x:26,y:38},{x:40,y:44}],
]

function ConstellationMap({ subscaleIndex, answeredMask, chakra }: {
  subscaleIndex: number
  answeredMask: boolean[]
  chakra: ChakraColor
}) {
  const pts = CONSTELLATIONS[subscaleIndex % CONSTELLATIONS.length]
  const answeredCount = answeredMask.filter(Boolean).length
  const allDone = answeredCount === answeredMask.length

  // Build lines between consecutive answered items
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  let lastAnswered = -1
  for (let i = 0; i < answeredMask.length; i++) {
    if (answeredMask[i]) {
      if (lastAnswered >= 0) {
        lines.push({ x1: pts[lastAnswered].x, y1: pts[lastAnswered].y, x2: pts[i].x, y2: pts[i].y })
      }
      lastAnswered = i
    }
  }

  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('w-10 h-10 shrink-0', allDone && 'animate-[pulse_3s_ease-in-out_2]')}
      aria-hidden
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={chakra.hex}
          strokeWidth={0.6}
          opacity={0.2}
          className="transition-opacity duration-500"
        />
      ))}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y}
          r={answeredMask[i] ? 2 : 1.5}
          fill={answeredMask[i] ? chakra.hex : 'currentColor'}
          opacity={answeredMask[i] ? 0.8 : 0.12}
          className="transition-all duration-500 text-zinc-400"
        />
      ))}
    </svg>
  )
}

/* ═══════════════ chakra dots (5-point selector) ═══════════════ */

function ChakraDots({ value, onChange, chakra }: {
  value: number | undefined
  onChange: (v: number) => void
  chakra: ChakraColor
}) {
  return (
    <div role="radiogroup" className="flex items-end gap-0 w-full max-w-[260px]">
      {LABELS.map((label, i) => {
        const v = i + 1
        const isSelected = value === v
        return (
          <button
            key={v}
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            onClick={() => onChange(v)}
            className="flex-1 flex flex-col items-center gap-1.5 py-1 cursor-pointer group"
          >
            <span
              className={cn(
                'rounded-full transition-all duration-300 ease-out',
                isSelected ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5 bg-zinc-400 dark:bg-zinc-700 group-hover:bg-zinc-500 dark:group-hover:bg-zinc-600 group-hover:scale-110',
              )}
              style={isSelected ? { backgroundColor: chakra.hex, boxShadow: chakra.glow } : undefined}
            />
            <span
              className={cn(
                'text-[9px] leading-none transition-all duration-200 select-none',
                isSelected ? 'font-medium' : 'text-zinc-400 dark:text-zinc-600',
              )}
              style={isSelected ? { color: chakra.hex } : undefined}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ═══════════════ domain orbs nav ═══════════════ */

function DomainOrbs({ completionMap, onSelect }: {
  completionMap: Record<number, { answered: number; total: number }>
  onSelect: (n: number) => void
}) {
  // Build completion status array for connecting lines
  const doneFlags = SENSE_DOMAINS.map(d => {
    const c = completionMap[d.number] || { answered: 0, total: 1 }
    return c.total > 0 && c.answered === c.total
  })

  return (
    <div className="relative flex items-center justify-center gap-5 py-8">
      {/* Connecting lines between completed adjacent orbs */}
      {SENSE_DOMAINS.map((d, i) => {
        if (i === 0) return null
        const bothDone = doneFlags[i - 1] && doneFlags[i]
        if (!bothDone) return null
        return (
          <div
            key={`line-${i}`}
            className="absolute top-1/2 -translate-y-[3px] h-px bg-zinc-400/40 dark:bg-zinc-500/30 transition-opacity duration-700"
            style={{
              left: `calc(${((i - 0.5) / SENSE_DOMAINS.length) * 100}% - 10px)`,
              width: `calc(${(1 / SENSE_DOMAINS.length) * 100}%)`,
            }}
          />
        )
      })}
      {SENSE_DOMAINS.map(d => {
        const c = completionMap[d.number] || { answered: 0, total: 1 }
        const pct = c.total > 0 ? c.answered / c.total : 0
        const isDone = pct === 1
        const chakra = CHAKRA[d.number]
        return (
          <button
            key={d.number}
            onClick={() => onSelect(d.number)}
            className="group flex flex-col items-center gap-2"
            title={`${d.name} — ${Math.round(pct * 100)}%`}
          >
            <span className="relative flex items-center justify-center">
              {/* progress ring */}
              <svg className="w-11 h-11" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="19" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className="text-zinc-200 dark:text-zinc-800" />
                {pct > 0 && (
                  <circle
                    cx="22" cy="22" r="19" fill="none"
                    stroke={chakra.hex}
                    strokeWidth={isDone ? 2 : 1.5}
                    strokeDasharray={`${pct * 119.4} 119.4`}
                    strokeLinecap="round"
                    transform="rotate(-90 22 22)"
                    className="transition-all duration-500"
                  />
                )}
              </svg>
              {/* inner dot */}
              <span
                className={cn(
                  'absolute rounded-full transition-all duration-500',
                  isDone ? 'w-4 h-4' : 'w-2.5 h-2.5 bg-zinc-300 dark:bg-zinc-600',
                )}
                style={isDone ? { backgroundColor: chakra.hex, boxShadow: chakra.glow } : pct > 0 ? { backgroundColor: chakra.hex, opacity: 0.6 } : undefined}
              />
              {/* unlock pulse */}
              {isDone && (
                <span
                  className="absolute rounded-full animate-[ping_1s_ease-out_2]"
                  style={{ width: 16, height: 16, backgroundColor: chakra.hex, opacity: 0.3 }}
                />
              )}
            </span>
            <span className={cn(
              'text-[10px] font-medium transition-colors duration-300 hidden sm:block',
              isDone ? '' : 'text-zinc-400 dark:text-zinc-500',
            )} style={isDone ? { color: chakra.hex } : undefined}>
              {d.name.split(' ')[0]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ═══════════════ scoring protocol ═══════════════ */

interface ConstructScore { sum: number; count: number; missing: number; valid: boolean; score: number | null }
interface DomainScore { mean: number | null; valid: boolean; validCount: number; totalConstructs: number }
interface TotalScore { mean: number | null; valid: boolean; validCount: number }

function computeScores(responses: Record<string, number>) {
  const constructScores: Record<string, ConstructScore> = {}

  for (const domain of SENSE_DOMAINS) {
    for (const sub of domain.subscales) {
      let sum = 0, count = 0
      const total = sub.items.length
      for (let i = 0; i < total; i++) {
        const val = responses[`${sub.id}-${i}`]
        if (val !== undefined) { sum += val; count++ }
      }
      const missing = total - count
      const valid = missing <= 2
      const score = valid && count > 0 ? Math.round((sum / count) * total) : null
      constructScores[sub.id] = { sum, count, missing, valid, score }
    }
  }

  const domainScores: Record<number, DomainScore> = {}
  for (const domain of SENSE_DOMAINS) {
    const subs = domain.subscales.map(s => constructScores[s.id])
    const validSubs = subs.filter(c => c.valid && c.score !== null)
    const threshold = Math.ceil(subs.length * 0.75)
    const domainValid = validSubs.length >= threshold
    const mean = validSubs.length > 0 ? validSubs.reduce((a, c) => a + c.score!, 0) / validSubs.length : null
    domainScores[domain.number] = { mean, valid: domainValid, validCount: validSubs.length, totalConstructs: subs.length }
  }

  const allConstructs = Object.values(constructScores)
  const allValid = allConstructs.filter(c => c.valid && c.score !== null)
  const totalValid = allValid.length >= 11
  const totalMean = allValid.length > 0 ? allValid.reduce((a, c) => a + c.score!, 0) / allValid.length : null

  return { constructScores, domainScores, totalScore: { mean: totalMean, valid: totalValid, validCount: allValid.length } as TotalScore }
}

/* ═══════════════ results view ═══════════════ */

function ResultsView({ responses, onRetake }: { responses: Record<string, number>; onRetake: () => void }) {
  const { constructScores, domainScores, totalScore } = useMemo(() => computeScores(responses), [responses])

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-12">
      {/* Total */}
      <div className="text-center space-y-1">
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-400">Total SENSE Score</p>
        {totalScore.valid && totalScore.mean !== null ? (
          <p className="text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">{totalScore.mean.toFixed(1)}</p>
        ) : (
          <p className="text-sm text-zinc-400 italic">Insufficient data ({totalScore.validCount} of {SENSE_DOMAINS.reduce((s, d) => s + d.subscales.length, 0)} constructs valid)</p>
        )}
        <p className="text-[10px] text-zinc-400">Scale: 10–50 (mean of construct sums)</p>
      </div>

      {/* Domains */}
      <div className="space-y-10">
        {SENSE_DOMAINS.map((domain, di) => {
          const chakra = CHAKRA[domain.number]
          const ds = domainScores[domain.number]
          return (
            <motion.div key={domain.number} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: di * 0.06 }}>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: chakra.hex }}>{domain.number}. {domain.name}</h3>
                {ds.valid && ds.mean !== null ? (
                  <span className="text-lg font-mono font-light text-zinc-900 dark:text-zinc-100">{ds.mean.toFixed(1)}</span>
                ) : (
                  <span className="text-[11px] text-zinc-400 italic">Insufficient data</span>
                )}
              </div>
              <div className="space-y-1.5">
                {domain.subscales.map((sub, si) => {
                  const cs = constructScores[sub.id]
                  return (
                    <div key={sub.id} className="flex items-center gap-3">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 w-40 shrink-0 truncate">{sub.name}</span>
                      <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        {cs.valid && cs.score !== null ? (
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: chakra.hex }}
                            initial={{ width: 0 }}
                            animate={{ width: `${((cs.score - 10) / 40) * 100}%` }}
                            transition={{ delay: di * 0.06 + si * 0.03, duration: 0.5, ease: 'easeOut' }}
                          />
                        ) : (
                          <div className="h-full w-full border border-dashed border-zinc-300 dark:border-zinc-700 rounded-full" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 w-6 text-right">
                        {cs.valid && cs.score !== null ? cs.score : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      <button onClick={onRetake} className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700">
        Retake questionnaire
      </button>
    </motion.div>
  )
}

/* ═══════════════ main survey ═══════════════ */

export default function SenseSurvey() {
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const domainRefs = useRef<Record<number, HTMLElement | null>>({})
  const unlockedRef = useRef<Set<number>>(new Set())
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null)

  // Compute per-domain completion
  const completionMap = useMemo(() => {
    const map: Record<number, { answered: number; total: number }> = {}
    for (const d of SENSE_DOMAINS) {
      let answered = 0, total = 0
      for (const sub of d.subscales) {
        for (let i = 0; i < sub.items.length; i++) {
          total++
          if (responses[`${sub.id}-${i}`] !== undefined) answered++
        }
      }
      map[d.number] = { answered, total }
    }
    return map
  }, [responses])

  const totalItems = Object.values(completionMap).reduce((s, c) => s + c.total, 0)
  const answeredCount = Object.values(completionMap).reduce((s, c) => s + c.answered, 0)

  // Detect newly completed domains → fire unlock
  useEffect(() => {
    for (const d of SENSE_DOMAINS) {
      const c = completionMap[d.number]
      if (c && c.answered === c.total && c.total > 0 && !unlockedRef.current.has(d.number)) {
        unlockedRef.current.add(d.number)
        setJustUnlocked(d.number)
        const t = setTimeout(() => setJustUnlocked(null), 1500)
        return () => clearTimeout(t)
      }
    }
  }, [completionMap])

  function scrollToDomain(n: number) {
    domainRefs.current[n]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  let globalItemIndex = 0
  // Track subscale index globally for constellation pattern cycling
  let globalSubscaleIndex = 0

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb row — not sticky, blends into page */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        <Link href="/lab" className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
          &larr; Lab
        </Link>
        {!submitted && (
          <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
            {answeredCount} / {totalItems}
          </span>
        )}
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-10">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-[55px] pt-[34px]">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-[13px]">Mind-Body Assessment</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-[8px]">SENSE</h1>
          <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg">
            Developed by Dr. Neha Menon. Free to use. Rate each statement on a frequency scale. There are no trick questions.
          </p>
        </motion.div>

        {/* Orbs nav */}
        {!submitted && <DomainOrbs completionMap={completionMap} onSelect={scrollToDomain} />}

        <AnimatePresence mode="wait">
          {submitted ? (
            <ResultsView
              key="results"
              responses={responses}
              onRetake={() => { setSubmitted(false); setResponses({}); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          ) : (
            <motion.div key="survey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-[89px]">
              {SENSE_DOMAINS.map(domain => {
                const chakra = CHAKRA[domain.number]
                const isUnlocked = unlockedRef.current.has(domain.number)
                const isJustUnlocked = justUnlocked === domain.number

                return (
                  <section
                    key={domain.number}
                    ref={el => { domainRefs.current[domain.number] = el }}
                    className="scroll-mt-20"
                  >
                    {/* Domain header */}
                    <div className="relative mb-[34px]">
                      {/* Unlock flash */}
                      {isJustUnlocked && (
                        <motion.div
                          className="absolute inset-0 rounded-lg"
                          style={{ backgroundColor: chakra.hex }}
                          initial={{ opacity: 0.25 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 0.6 }}
                        />
                      )}
                      <div className="flex items-center gap-3 mb-1.5 relative">
                        <span className="relative">
                          {isUnlocked && (
                            <span
                              className="absolute -inset-2 rounded-full blur-md transition-opacity duration-700"
                              style={{ backgroundColor: chakra.hex, opacity: 0.2 }}
                            />
                          )}
                          <span
                            className={cn('relative text-[11px] font-mono font-bold transition-colors duration-500')}
                            style={isUnlocked ? { color: chakra.hex } : undefined}
                          >
                            0{domain.number}
                          </span>
                        </span>
                        <div
                          className="h-px flex-1 transition-opacity duration-500"
                          style={{ backgroundColor: chakra.hex, opacity: isUnlocked ? 0.5 : 0.2 }}
                        />
                      </div>
                      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {domain.name}
                      </h2>
                    </div>

                    {/* Subscales */}
                    <div className="space-y-[55px]">
                      {domain.subscales.map(subscale => {
                        const subIdx = globalSubscaleIndex++
                        const answeredMask = subscale.items.map((_, i) => responses[`${subscale.id}-${i}`] !== undefined)

                        return (
                          <div key={subscale.id}>
                            {/* Subscale header with constellation */}
                            <div className="flex items-start justify-between mb-[21px]">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-0.5">{subscale.name}</h3>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 italic leading-relaxed">{subscale.citation}</p>
                              </div>
                              <ConstellationMap subscaleIndex={subIdx} answeredMask={answeredMask} chakra={chakra} />
                            </div>

                            {/* Items */}
                            <div className="space-y-[8px]">
                              {subscale.items.map((item, itemIdx) => {
                                globalItemIndex++
                                const key = `${subscale.id}-${itemIdx}`
                                const value = responses[key]
                                const num = globalItemIndex

                                return (
                                  <div
                                    key={key}
                                    className={cn(
                                      'rounded-xl px-5 py-[13px] transition-all duration-300',
                                      value !== undefined
                                        ? `${chakra.faintBg} ${chakra.faintBgDark}`
                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30',
                                    )}
                                  >
                                    <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed mb-2">
                                      <span className="font-mono text-[10px] text-zinc-300 dark:text-zinc-700 mr-1.5 tabular-nums">{num}.</span>
                                      {item}
                                    </p>
                                    <ChakraDots
                                      value={value}
                                      onChange={v => setResponses(prev => ({ ...prev, [key]: v }))}
                                      chakra={chakra}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}

              {/* Submit */}
              <div className="pt-4 pb-24">
                <button
                  onClick={() => { setSubmitted(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={answeredCount === 0}
                  className={cn(
                    'px-8 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-200',
                    answeredCount > 0
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed',
                  )}
                >
                  View Results
                </button>
                {answeredCount > 0 && answeredCount < totalItems && (
                  <p className="text-[11px] text-zinc-400 mt-3">{totalItems - answeredCount} unanswered — will be excluded or prorated per scoring protocol.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
