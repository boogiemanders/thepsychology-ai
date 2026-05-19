'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  SUBTESTS,
  PRIMARY_INDEXES,
  ANCILLARY_INDEXES,
  PAIRWISE_COMPARISONS,
  ANCILLARY_PAIRWISE_COMPARISONS,
  PROCESS_PAIRWISE_COMPARISONS,
  PROCESS_SCORES_BASE_RATE,
  DISCREPANCY_COMPARISONS,
  PRIMARY_SUBTESTS_10,
  FSIQ_SUBTESTS_7,
  type Subtest,
  type Item,
  type ScoreKind,
  type Tag,
} from './wais5-config'
import { SCRIPTS, SUBTEST_INTROS, GENERAL_TEST_INTRO } from './wais5-scripts'
import { supabase } from '@/lib/supabase'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

const STORAGE_KEY = 'wais5-form-v1'

const SUMMARY_SUBTESTS: Array<[string, string, string]> = [
  ['Similarities', 'similarities', 'SI'],
  ['Block Design', 'blockdesign', 'BD'],
  ['Matrix Reasoning', 'matrix', 'MR'],
  ['Digits Forward', 'digitsforward', 'DF'],
  ['Digit Sequencing', 'digitseq', 'DQ'],
  ['Coding', 'coding', 'CD'],
  ['Vocabulary', 'vocab', 'VC'],
  ['Figure Weights', 'figw', 'FW'],
  ['Visual Puzzles', 'vpuzzles', 'VP'],
  ['Running Digits', 'rundigits', 'RD'],
  ['Symbol Search', 'symsearch', 'SS'],
  ['Information', 'info', 'IN'],
  ['Arithmetic', 'arith', 'AR'],
  ['Digits Backward', 'digitsback', 'DB'],
  ['Symbol Span', 'symspan', 'SSP'],
  ['Naming Speed Quantity', 'nsq', 'NSQ'],
  ['Comprehension', 'comp', 'CO'],
  ['Set Relations', 'setrel', 'SR'],
  ['Spatial Addition', 'spadd', 'SA'],
  ['Letter-Number Sequencing', 'lns', 'LN'],
]

const SW_ROWS = [
  'VCI', 'VSI', 'FRI', 'WMI', 'PSI',
  'Similarities', 'Vocabulary', 'Block Design', 'Visual Puzzles',
  'Matrix Reasoning', 'Figure Weights', 'Digit Sequencing', 'Running Digits',
  'Coding', 'Symbol Search',
]

type FormData = Record<string, string>

const range = (a: number, b: number) => {
  const r: number[] = []
  for (let i = a; i <= b; i++) r.push(i)
  return r
}

const scoreValues = (kind: ScoreKind): number[] => {
  if (kind === '01') return [0, 1]
  if (kind === '02') return [0, 2]
  if (kind === '012') return [0, 1, 2]
  return []
}

function tagBadge(t: Tag) {
  if (!t) return null
  if (t === 'AA') return <span className="mr-1 inline-block rounded bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 text-[9px] font-mono uppercase tracking-wide text-zinc-700 dark:text-zinc-300">All Ages</span>
  if (t === 'SIG') return <span className="mr-1 inline-block rounded bg-[#F39E3A]/15 px-1 py-0.5 text-[9px] font-mono uppercase tracking-wide text-[#F39E3A]">SIG</span>
  if (t === 'TRIPLE') return <span className="mr-1 inline-block rounded bg-[#F39E3A]/15 px-1 py-0.5 text-[9px] font-mono uppercase tracking-wide text-[#F39E3A]" title="Prior to Item 20, say: now look at all three scales">**</span>
  return null
}

// Block Design trial row: Start button → live timer → ✓/✗ buttons that stop
// the timer and store elapsed seconds in `${name}-${suffix}time`.
function BdTrialRow({
  label, name, suffix, data, setData, withOk = false,
}: {
  label: string
  name: string
  suffix: string
  data: Record<string, string>
  setData: (updater: (prev: Record<string, string>) => Record<string, string>) => void
  withOk?: boolean
}) {
  const startKey = `${name}-${suffix}start`
  const timeKey = `${name}-${suffix}time`
  const okKey = `${name}-${suffix}ok`
  const startedAt = Number(data[startKey] || 0)
  const elapsed = startedAt ? Math.max(0, (Date.now() - startedAt) / 1000) : 0
  const storedTime = data[timeKey] || ''
  const okVal = data[okKey] || ''
  const start = () => setData(prev => ({ ...prev, [startKey]: String(Date.now()) }))
  const stop = (ok: '✓' | '✗') => setData(prev => {
    const at = Number(prev[startKey] || 0)
    const sec = at ? ((Date.now() - at) / 1000).toFixed(1) : (prev[timeKey] || '')
    return { ...prev, [timeKey]: sec, [okKey]: ok, [startKey]: '' }
  })
  const reset = () => setData(prev => ({ ...prev, [startKey]: '', [timeKey]: '', [okKey]: '' }))
  const running = startedAt > 0
  const display = running ? elapsed.toFixed(1) : storedTime
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 first:mt-0">
      {label ? <span className="w-6 text-[11px] text-slate-500 dark:text-zinc-400">{label}</span> : null}
      {running ? (
        <span className="rounded border border-[#4EBFD4] bg-[#4EBFD4]/10 px-2 py-0.5 font-mono text-[12px] text-[#4EBFD4]">{display}s</span>
      ) : storedTime ? (
        <button type="button" onClick={reset} className="rounded border border-slate-300 dark:border-zinc-700 px-2 py-0.5 font-mono text-[12px] text-slate-700 dark:text-zinc-300 hover:border-slate-400" title="Reset">{storedTime}s</button>
      ) : (
        <button type="button" onClick={start} className="rounded border border-slate-300 dark:border-zinc-700 px-2 py-0.5 text-[11px] text-slate-700 dark:text-zinc-300 hover:border-[#4EBFD4] hover:text-[#4EBFD4]">Start</button>
      )}
      {withOk ? (
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!running && !storedTime}
            onClick={() => stop('✓')}
            className={`min-w-[28px] rounded-full border px-2 py-0.5 text-[12px] ${okVal === '✓' ? 'border-[#B6D458] bg-[#B6D458] text-white' : 'border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-[#B6D458] disabled:opacity-40'}`}
          >✓</button>
          <button
            type="button"
            disabled={!running && !storedTime}
            onClick={() => stop('✗')}
            className={`min-w-[28px] rounded-full border px-2 py-0.5 text-[12px] ${okVal === '✗' ? 'border-[#E7437D] bg-[#E7437D] text-white' : 'border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-[#E7437D] disabled:opacity-40'}`}
          >✗</button>
        </div>
      ) : null}
    </div>
  )
}

export default function Wais5Form() {
  const [data, setData] = useState<FormData>({})
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null)
  const [stimUrls, setStimUrls] = useState<Record<string, string>>({})
  const [, setTick] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const hydrated = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setData(JSON.parse(raw))
    } catch {}
    hydrated.current = true
  }, [])

  // Fetch signed URLs for every item that has a `stim` asset (one round trip, 1h expiry).
  useEffect(() => {
    const paths: string[] = []
    for (const sub of Object.values(SCRIPTS)) {
      if (!sub) continue
      for (const item of Object.values(sub)) {
        if (item.stim) paths.push(item.stim)
      }
    }
    if (paths.length === 0) return
    supabase.storage
      .from('wais5-stim')
      .createSignedUrls(paths, 60 * 60)
      .then(({ data: urls, error }) => {
        if (error || !urls) return
        const map: Record<string, string> = {}
        for (const u of urls) if (u.path && u.signedUrl) map[u.path] = u.signedUrl
        setStimUrls(map)
      })
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
  }, [data])

  // Re-render every 200ms while any BD trial timer is running.
  const anyTimerRunning = Object.keys(data).some(k => /-(t1|t2|t)start$/.test(k) && data[k])
  useEffect(() => {
    if (!anyTimerRunning) return
    const id = window.setInterval(() => setTick(t => t + 1), 200)
    return () => window.clearInterval(id)
  }, [anyTimerRunning])

  const set = useCallback((name: string, value: string) => {
    setData(prev => ({ ...prev, [name]: value }))
  }, [])

  // Render a scripted line with the WAIS-5 manual's blue/black split.
  // If the text contains **...** markers, ONLY those segments are styled as
  // read-aloud (blue). Otherwise fall back to "everything except parentheticals
  // is read-aloud" for legacy intro strings.
  function renderScriptedInstruction(text: string) {
    if (text.includes('**')) {
      const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
      return (
        <>
          {parts.map((seg, i) =>
            seg.startsWith('**') && seg.endsWith('**') ? (
              <span key={i} className="font-semibold text-[#4EBFD4]">{seg.slice(2, -2)}</span>
            ) : (
              <span key={i} className="text-zinc-700 dark:text-zinc-300">{seg}</span>
            )
          )}
        </>
      )
    }
    const parts = text.split(/(\([^)]*\))/g).filter(Boolean)
    return (
      <>
        {parts.map((seg, i) =>
          seg.startsWith('(') && seg.endsWith(')') ? (
            <span key={i} className="italic text-zinc-500 dark:text-zinc-400">{seg}</span>
          ) : (
            <span key={i} className="font-semibold text-[#4EBFD4]">{seg}</span>
          )
        )}
      </>
    )
  }

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1500)
  }

  const ageStr = useMemo(() => {
    const ty = +(data['td-y'] || 0), tm = +(data['td-m'] || 0), td = +(data['td-d'] || 0)
    const by = +(data['bd-y'] || 0), bm = +(data['bd-m'] || 0), bd = +(data['bd-d'] || 0)
    if (!ty || !tm || !td || !by || !bm || !bd) return { y: '—', m: '—', d: '—' }
    let y = ty - by, m = tm - bm, d = td - bd
    if (d < 0) { m--; const prev = new Date(ty, tm - 1, 0).getDate(); d += prev }
    if (m < 0) { y--; m += 12 }
    return { y: String(y), m: String(m), d: String(d) }
  }, [data])

  const totals = useMemo(() => {
    const out: Record<string, number> = {}
    for (const st of SUBTESTS) {
      let total = 0
      if (st.type === 'verbal' || st.type === 'mcq' || st.type === 'mcq3of6' || st.type === 'arith') {
        for (const it of (st.items || [])) {
          if (it.sample) continue
          if (it.score === '-') continue
          const v = data[`${st.id}-${it.k}`]
          if (v) total += +v
        }
      } else if (st.type === 'twotrial') {
        for (const it of (st.items || [])) {
          if (it.sm === 0) continue
          const v = data[`${st.id}-${it.k}-it`]
          if (v) total += +v
        }
      } else if (st.type === 'blockdesign') {
        for (const it of (st.items || [])) {
          const v = data[`${st.id}-${it.k}`]
          if (v) total += +v
        }
      } else if (st.type === 'rundigits') {
        for (const it of (st.items || [])) {
          if (it.sample) continue
          const v = +(data[`${st.id}-${it.k}`] || 0)
          total += v
        }
      } else if (st.type === 'timed') {
        const idx = (st.fields || []).findIndex(f => /total/i.test(f))
        if (idx >= 0) total = +(data[`${st.id}-f${idx}`] || 0)
      }
      out[st.id] = total
    }
    return out
  }, [data])

  // Derived process / analysis values
  const derived = useMemo(() => {
    const sumPrimaryScaled = PRIMARY_SUBTESTS_10.reduce(
      (acc, id) => acc + (+(data[`scaled-${id}`] || 0)), 0,
    )
    const sumFsiqScaled = FSIQ_SUBTESTS_7.reduce(
      (acc, id) => acc + (+(data[`scaled-${id}`] || 0)), 0,
    )
    const sumIndex = PRIMARY_INDEXES.filter(i => i !== 'FSIQ').reduce(
      (acc, ix) => acc + (+(data[`ix-score-${ix}`] || 0)), 0,
    )
    const mssP = sumPrimaryScaled / 10
    const mssF = sumFsiqScaled / 7
    const mis = sumIndex / 5
    // DSp = Digits Forward + Digit Sequencing + Digits Backward raw
    const dsp = (totals.digitsforward || 0) + (totals.digitseq || 0) + (totals.digitsback || 0)
    return {
      mis: mis ? mis.toFixed(2) : '',
      mssP: mssP ? mssP.toFixed(2) : '',
      mssF: mssF ? mssF.toFixed(2) : '',
      dsp,
    }
  }, [data, totals])

  const handleSave = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); showToast('Saved locally') } catch {}
  }

  const handleExport = () => {
    const name = (data['id-examinee'] || 'examinee').replace(/[^a-z0-9-_]/gi, '_')
    const date = (data['td-y'] && data['td-m'] && data['td-d'])
      ? `${data['td-y']}-${String(data['td-m']).padStart(2, '0')}-${String(data['td-d']).padStart(2, '0')}`
      : new Date().toISOString().slice(0, 10)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `wais5_${name}_${date}.json`; a.click()
    URL.revokeObjectURL(url)
    showToast('Exported')
  }

  const handleImport = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = e => {
      try {
        const parsed = JSON.parse(String(e.target?.result || ''))
        setData(parsed)
        showToast('Imported')
      } catch (err) {
        alert('Bad JSON: ' + (err as Error).message)
      }
    }
    r.readAsText(f)
    ev.target.value = ''
  }

  const handleClear = () => {
    if (!confirm('Clear all responses?')) return
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setData({})
    showToast('Cleared')
  }

  // ---------- shared input/control components ----------

  const TextField = ({ name, placeholder, className }: { name: string; placeholder?: string; className?: string }) => (
    <input
      value={data[name] || ''}
      onChange={e => set(name, e.target.value)}
      placeholder={placeholder}
      className={`rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[13px] outline-none focus:border-zinc-900 dark:focus:border-zinc-100 ${className || ''}`}
    />
  )

  const NumField = ({ name, placeholder, className, step }: { name: string; placeholder?: string; className?: string; step?: string }) => (
    <input
      type="number"
      step={step}
      value={data[name] || ''}
      onChange={e => set(name, e.target.value)}
      placeholder={placeholder}
      className={`rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[13px] outline-none focus:border-zinc-900 dark:focus:border-zinc-100 ${className || ''}`}
    />
  )

  const TextArea = ({ name, className, onFocus, onKeyDown }: { name: string; className?: string; onFocus?: () => void; onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void }) => (
    <textarea
      value={data[name] || ''}
      onChange={e => set(name, e.target.value)}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      data-form-name={name}
      className={`w-full resize-y rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[13px] outline-none focus:border-zinc-900 dark:focus:border-zinc-100 min-h-[28px] ${className || ''}`}
    />
  )

  const TinyInput = ({ name, placeholder, className }: { name: string; placeholder?: string; className?: string }) => (
    <input
      value={data[name] || ''}
      onChange={e => set(name, e.target.value)}
      placeholder={placeholder}
      className={`flex-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 font-mono text-[12px] outline-none focus:border-zinc-900 dark:focus:border-zinc-100 ${className || ''}`}
    />
  )

  const ScorePills = ({ name, kind }: { name: string; kind: ScoreKind }) => {
    const opts = scoreValues(kind)
    if (opts.length === 0) return null
    const selected = data[name]
    return (
      <div className="flex flex-wrap items-center gap-1">
        {opts.map(v => {
          const isSelected = selected === String(v)
          const isZero = v === 0
          return (
            <button
              key={v}
              type="button"
              onClick={() => set(name, isSelected ? '' : String(v))}
              className={[
                'min-w-[24px] rounded-full border px-2 py-0.5 text-[12px] transition-colors',
                isSelected && isZero
                  ? 'border-[#E7437D] bg-[#E7437D] text-white'
                  : isSelected
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-600',
              ].join(' ')}
            >
              {v}
            </button>
          )
        })}
      </div>
    )
  }

  const ChoicePills = ({ name, count }: { name: string; count: number }) => {
    if (count <= 0) return <TextField name={`${name}-r`} placeholder="response" className="w-40" />
    const selected = data[name + '-choice']
    return (
      <div className="flex flex-wrap items-center gap-1">
        {range(1, count).map(v => {
          const isSelected = selected === String(v)
          return (
            <button
              key={v}
              type="button"
              onClick={() => set(name + '-choice', isSelected ? '' : String(v))}
              className={[
                'min-w-[24px] rounded-full border px-2 py-0.5 text-[12px] transition-colors',
                isSelected
                  ? 'border-[#534D8A] bg-[#534D8A] text-white'
                  : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-600',
              ].join(' ')}
            >
              {v}
            </button>
          )
        })}
      </div>
    )
  }

  // ---------- subtest renderers ----------

  const renderVerbal = (st: Subtest) => {
    const def: ScoreKind = (st.score as ScoreKind) || '012'
    const subtestScripts = SCRIPTS[st.id]
    return (
      <div className="space-y-2">
        {(st.items || []).map(it => {
          const kind: ScoreKind = (it.score as ScoreKind) || def
          const name = `${st.id}-${it.k}`
          const script = subtestScripts?.[it.k]
          return (
            <div key={it.k} className="rounded border border-slate-200 dark:border-zinc-800 p-3">
              <div className="mb-2 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="w-12 font-semibold text-slate-500 dark:text-zinc-400">{tagBadge(it.tag ?? null)}{it.k}.</span>
                    {script
                      ? <span className="text-[15px] font-semibold leading-snug text-[#4EBFD4]">{script.prompt}</span>
                      : it.label
                        ? <span className="text-[14px] font-semibold text-slate-700 dark:text-zinc-300">{it.label}</span>
                        : null}
                  </div>
                  {script?.stageDirection ? (
                    <p className="mt-1 pl-14 text-[11px] italic text-zinc-500 dark:text-zinc-400">
                      {script.stageDirection}
                    </p>
                  ) : null}
                </div>
                {script?.stim && stimUrls[script.stim] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stimUrls[script.stim]}
                    alt=""
                    className="w-32 sm:w-40 h-auto rounded border border-zinc-200 dark:border-zinc-800 shrink-0"
                  />
                ) : null}
              </div>

              {script && (script.scoring['2'].length + script.scoring['1'].length + script.scoring['0'].length > 0) ? (
                <Accordion
                  type="single"
                  collapsible
                  className="mb-2 print:hidden"
                  value={activeItemKey === `${st.id}-${it.k}` ? `${st.id}-${it.k}-rubric` : ''}
                  onValueChange={(v) => {
                    if (v) setActiveItemKey(`${st.id}-${it.k}`)
                    else if (activeItemKey === `${st.id}-${it.k}`) setActiveItemKey(null)
                  }}
                >
                  <AccordionItem value={`${st.id}-${it.k}-rubric`} className="border-0">
                    <AccordionTrigger className="py-1 text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:no-underline">
                      show scoring rubric
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="grid grid-cols-1 gap-2 text-[12px] sm:grid-cols-3">
                        {(['2','1','0'] as const).map(sec => (
                          <div key={sec} className="p-2">
                            <p className={`mb-1 text-[10px] font-mono uppercase tracking-[0.12em] ${sec==='2'?'text-[#B6D458]':sec==='1'?'text-[#F39E3A]':'text-[#E7437D]'}`}>
                              {sec} {sec === '1' ? 'point' : 'points'}
                            </p>
                            <ul className="space-y-1 text-zinc-700 dark:text-zinc-300">
                              {script.scoring[sec].map((e, i) => {
                                const pickKey = `${name}-pick-${sec}-${i}`
                                const picked = data[pickKey] === '1'
                                return (
                                  <li key={i}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Toggle this pick, then rebuild text + score from all active picks.
                                        const next: FormData = { ...data, [pickKey]: picked ? '' : '1' }
                                        const texts: string[] = []
                                        let maxSec = -1
                                        for (const s of ['2','1','0'] as const) {
                                          script.scoring[s].forEach((entry, idx) => {
                                            if (next[`${name}-pick-${s}-${idx}`] === '1') {
                                              texts.push(entry.replace(/\s*\(Q\)\s*/g, '').trim())
                                              const sNum = parseInt(s, 10)
                                              if (sNum > maxSec) maxSec = sNum
                                            }
                                          })
                                        }
                                        next[`${name}-r`] = texts.join('; ')
                                        const allowed = scoreValues(kind)
                                        if (maxSec >= 0 && allowed.includes(maxSec)) {
                                          next[name] = String(maxSec)
                                        } else {
                                          next[name] = ''
                                        }
                                        setData(next)
                                      }}
                                      className={`text-left leading-snug cursor-pointer ${picked ? 'underline decoration-2 text-zinc-900 dark:text-zinc-100' : 'hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline'}`}
                                    >
                                      {e}
                                    </button>
                                  </li>
                                )
                              })}
                              {script.scoring[sec].length === 0 ? <li className="italic text-zinc-400 dark:text-zinc-500">—</li> : null}
                            </ul>
                          </div>
                        ))}
                      </div>
                      {script.corrective ? (
                        <p className="mt-2 rounded border-l-2 border-[#4EBFD4] p-2 text-[12px] text-zinc-700 dark:text-zinc-300">
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Corrective feedback: </span>
                          Say, &ldquo;{script.corrective}&rdquo;
                        </p>
                      ) : null}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : null}

              <div className="flex flex-wrap items-start gap-3">
                <TextArea
                  name={`${name}-r`}
                  className="min-w-[200px] flex-1"
                  onFocus={() => setActiveItemKey(`${st.id}-${it.k}`)}
                  onKeyDown={(e) => {
                    // Tab / Shift+Tab / Cmd+Arrow = navigate items
                    const goNext = (e.key === 'Tab' && !e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.key === 'ArrowDown')
                    const goPrev = (e.key === 'Tab' && e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp')
                    if (goNext || goPrev) {
                      const items = st.items || []
                      const idx = items.findIndex(x => x.k === it.k)
                      const nextIdx = goNext ? idx + 1 : idx - 1
                      const next = items[nextIdx]
                      if (next) {
                        e.preventDefault()
                        const nextEl = document.querySelector<HTMLTextAreaElement>(`[data-form-name="${st.id}-${next.k}-r"]`)
                        nextEl?.focus()
                      }
                    }
                    // Cmd/Ctrl + 0/1/2 = score
                    if ((e.metaKey || e.ctrlKey) && ['0', '1', '2'].includes(e.key)) {
                      const allowed = scoreValues(kind)
                      const v = parseInt(e.key, 10)
                      if (allowed.includes(v)) {
                        e.preventDefault()
                        set(name, String(v))
                      }
                    }
                  }}
                />
                <ScorePills name={name} kind={kind} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMcq = (st: Subtest) => {
    const subtestScripts = SCRIPTS[st.id]
    const showOnExaminee = (stim: string) => {
      try { localStorage.setItem('wais5-present-stim', stim) } catch {}
      try { const ch = new BroadcastChannel('wais5-present'); ch.postMessage({ stim }); ch.close() } catch {}
    }
    const openExamineeWindow = () => {
      window.open('/lab/wais5/present', 'wais5-examinee', 'popup,width=1280,height=900')
    }
    const hasStim = !!subtestScripts && Object.values(subtestScripts).some(s => s?.stim)
    return (
    <>
      {hasStim ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={openExamineeWindow}
            className="rounded border border-[#4EBFD4] px-3 py-1 text-[12px] font-medium text-[#4EBFD4] hover:bg-[#4EBFD4]/10"
          >
            Open examinee window
          </button>
        </div>
      ) : null}
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            <th className="px-2 py-1 text-left">Item</th>
            {hasStim ? <th className="px-2 py-1 text-left">Stim</th> : null}
            <th className="px-2 py-1 text-left">Response</th>
            <th className="px-2 py-1 text-left">Score</th>
          </tr>
        </thead>
        <tbody>
          {(st.items || []).map(it => {
            const kind: ScoreKind = (it.score as ScoreKind) || '01'
            const name = `${st.id}-${it.k}`
            const script = subtestScripts?.[it.k]
            return (
              <tr key={it.k} className="border-b border-slate-200 dark:border-zinc-800 align-top">
                <td className="w-12 px-2 py-1 font-semibold text-slate-500 dark:text-zinc-400">{tagBadge(it.tag ?? null)}{it.k}.</td>
                {hasStim ? (
                  <td className="w-36 px-2 py-1">
                    {script?.stim && stimUrls[script.stim] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={stimUrls[script.stim]} alt="" className="w-28 h-auto rounded border border-zinc-200 dark:border-zinc-800" />
                        <button
                          type="button"
                          onClick={() => script.stim && showOnExaminee(script.stim)}
                          className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[#4EBFD4] hover:underline"
                        >
                          Show to examinee
                        </button>
                      </>
                    ) : null}
                  </td>
                ) : null}
                <td className="px-2 py-1"><ChoicePills name={name} count={st.choices || 0} /></td>
                <td className="w-32 px-2 py-1"><ScorePills name={name} kind={kind} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
    )
  }

  const renderMcq3of6 = (st: Subtest) => (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          <th className="px-2 py-1 text-left">Item</th>
          <th className="px-2 py-1 text-left">Time</th>
          <th className="px-2 py-1 text-left">Choices (select 3)</th>
          <th className="px-2 py-1 text-left">Score</th>
        </tr>
      </thead>
      <tbody>
        {(st.items || []).map(it => {
          const name = `${st.id}-${it.k}`
          const isSample = it.k === 'D' || it.k === 'S'
          return (
            <tr key={it.k} className="border-b border-slate-200 dark:border-zinc-800 align-top">
              <td className="w-12 px-2 py-1 font-semibold text-slate-500 dark:text-zinc-400">{tagBadge(it.tag ?? null)}{it.k}.</td>
              <td className="w-20 px-2 py-1"><NumField name={`${name}-time`} placeholder="sec" className="w-16" /></td>
              <td className="px-2 py-1">
                <div className="flex flex-wrap gap-2">
                  {range(1, 6).map(v => {
                    const checkedKey = `${name}-c${v}`
                    return (
                      <label key={v} className="flex items-center gap-1 text-[12px] text-slate-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={data[checkedKey] === '1'}
                          onChange={e => set(checkedKey, e.target.checked ? '1' : '')}
                        />
                        {v}
                      </label>
                    )
                  })}
                </div>
              </td>
              <td className="w-32 px-2 py-1">
                {isSample
                  ? <span className="text-[11px] text-slate-400 dark:text-zinc-500">sample</span>
                  : <ScorePills name={name} kind="01" />}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  const renderTwoTrial = (st: Subtest) => (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          <th className="px-2 py-1 text-left">Item</th>
          <th className="px-2 py-1 text-left">Trial / Response</th>
          <th className="px-2 py-1 text-left">Trial Score</th>
          <th className="px-2 py-1 text-left">Item Score</th>
        </tr>
      </thead>
      <tbody>
        {(st.items || []).map(it => {
          const name = `${st.id}-${it.k}`
          const isSample = it.sm === 0
          const trialKind: ScoreKind = isSample ? '-' : (it.sm === 2 ? '02' : '01')
          const itemOpts = isSample ? [] : (it.sm === 2 ? [0, 2, 4] : [0, 1, 2])
          return (
            <tr key={it.k} className="border-b border-slate-200 dark:border-zinc-800 align-top">
              <td className="w-12 px-2 py-1 font-semibold text-slate-500 dark:text-zinc-400">{tagBadge(it.tag ?? null)}{it.k}.</td>
              <td className="px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="min-w-[120px] font-mono text-[11px] text-slate-500 dark:text-zinc-400">{it.t1 || ''}</span>
                  <TinyInput name={`${name}-t1r`} placeholder="response" />
                </div>
                {it.t2 ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="min-w-[120px] font-mono text-[11px] text-slate-500 dark:text-zinc-400">{it.t2}</span>
                    <TinyInput name={`${name}-t2r`} placeholder="response" />
                  </div>
                ) : null}
              </td>
              <td className="w-36 px-2 py-1">
                {isSample
                  ? <span className="text-[11px] text-slate-400 dark:text-zinc-500">sample</span>
                  : (
                    <div className="flex flex-col gap-1">
                      <ScorePills name={`${name}-t1`} kind={trialKind} />
                      {it.t2 ? <ScorePills name={`${name}-t2`} kind={trialKind} /> : null}
                    </div>
                  )}
              </td>
              <td className="w-32 px-2 py-1">
                {isSample
                  ? null
                  : (
                    <div className="flex flex-wrap items-center gap-1">
                      {itemOpts.map(v => {
                        const isSelected = data[`${name}-it`] === String(v)
                        const isZero = v === 0
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => set(`${name}-it`, isSelected ? '' : String(v))}
                            className={[
                              'min-w-[24px] rounded-full border px-2 py-0.5 text-[12px] transition-colors',
                              isSelected && isZero
                                ? 'border-[#E7437D] bg-[#E7437D] text-white'
                                : isSelected
                                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                                : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-600',
                            ].join(' ')}
                          >
                            {v}
                          </button>
                        )
                      })}
                    </div>
                  )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  const bdTimeRange = (k: string, v: number): string | null => {
    if (v === 0) return null
    if (k === '9') {
      if (v === 4) return '31-60'
      if (v === 5) return '21-30'
      if (v === 6) return '11-20'
      if (v === 7) return '1-10'
    }
    if (['10','11','12','13','14'].includes(k)) {
      if (v === 4) return '71-120'
      if (v === 5) return '51-70'
      if (v === 6) return '31-50'
      if (v === 7) return '1-30'
    }
    return null
  }
  const renderBlockDesign = (st: Subtest) => {
    const subtestScripts = SCRIPTS[st.id]
    const groups = SUBTEST_INTROS[st.id]?.itemGroups || []
    // Map first-item key for each group → group, so we can inject the script row
    // right before that item in the table body.
    const groupAt: Record<string, typeof groups[number]> = {}
    for (const g of groups) {
      const m = g.label.match(/(\d+)/)
      if (m) groupAt[m[1]] = g
    }
    const showOnExaminee = (stim: string) => {
      try { localStorage.setItem('wais5-present-stim', stim) } catch {}
      try {
        const ch = new BroadcastChannel('wais5-present')
        ch.postMessage({ stim })
        ch.close()
      } catch {}
    }
    const openExamineeWindow = () => {
      window.open('/lab/wais5/present', 'wais5-examinee', 'popup,width=1280,height=900')
    }
    return (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded border border-zinc-200 dark:border-zinc-800 p-2">
            <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Items 1-4 · two trials</p>
            <ul className="space-y-0.5 text-[11px] text-slate-700 dark:text-zinc-300">
              <li><span className="font-mono text-[#B6D458]">2</span> = correct on Trial 1</li>
              <li><span className="font-mono text-[#F39E3A]">1</span> = correct on Trial 2</li>
              <li><span className="font-mono text-[#E7437D]">0</span> = both trials fail</li>
            </ul>
          </div>
          <div className="rounded border border-zinc-200 dark:border-zinc-800 p-2">
            <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Items 5-8 · no time bonus</p>
            <ul className="space-y-0.5 text-[11px] text-slate-700 dark:text-zinc-300">
              <li><span className="font-mono text-[#B6D458]">4</span> = correct within time limit</li>
              <li><span className="font-mono text-[#E7437D]">0</span> = incorrect or time expired</li>
            </ul>
          </div>
          <div className="rounded border border-zinc-200 dark:border-zinc-800 p-2">
            <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Items 9-14 · time bonus</p>
            <ul className="space-y-0.5 text-[11px] text-slate-700 dark:text-zinc-300">
              <li><span className="font-mono text-[#B6D458]">7 / 6 / 5</span> = correct, faster = higher</li>
              <li><span className="font-mono text-[#F39E3A]">4</span> = correct, no time bonus</li>
              <li><span className="font-mono text-[#E7437D]">0</span> = incorrect or time expired</li>
            </ul>
            <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              Item 9: 1-10s=7, 11-20s=6, 21-30s=5, 31-60s=4.<br/>
              Items 10-14: 1-30s=7, 31-50s=6, 51-70s=5, 71-120s=4.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openExamineeWindow}
          className="shrink-0 rounded border border-[#4EBFD4] px-3 py-1 text-[12px] font-medium text-[#4EBFD4] hover:bg-[#4EBFD4]/10"
        >
          Open examinee window
        </button>
      </div>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            <th className="px-2 py-1 text-left">Item</th>
            <th className="px-2 py-1 text-left">Design</th>
            <th className="px-2 py-1 text-left">Trial / Time</th>
            <th className="px-2 py-1 text-left">Score</th>
          </tr>
        </thead>
        <tbody>
          {(st.items || []).map(it => {
            const name = `${st.id}-${it.k}`
            const script = subtestScripts?.[it.k]
            const group = groupAt[it.k]
            const opts = it.validScores
              ? it.validScores
              : it.scoreMax === 2 ? [0, 1, 2]
              : it.scoreMax === 4 ? [0, 1, 2, 3, 4]
              : [0, 1, 2, 3, 4, 5, 6, 7]
            return (
              <Fragment key={it.k}>
                {group ? (
                  <tr>
                    <td colSpan={4} className="px-2 pt-4 pb-2">
                      <div className="rounded border border-zinc-200 dark:border-zinc-800 border-l-2 border-l-[#4EBFD4] p-3">
                        <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-300">
                          {group.label}
                        </p>
                        {group.single ? (
                          <p className="whitespace-pre-line text-[13px] leading-snug">
                            {renderScriptedInstruction(group.single)}
                          </p>
                        ) : null}
                        {group.trial1 || group.trial2 ? (
                          <div className="space-y-2">
                            {group.trial1 ? (
                              <div>
                                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-300">Trial 1</p>
                                <p className="whitespace-pre-line text-[13px] leading-snug">
                                  {renderScriptedInstruction(group.trial1)}
                                </p>
                              </div>
                            ) : null}
                            {group.trial2 ? (
                              <div>
                                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-300">Trial 2</p>
                                <p className="whitespace-pre-line text-[13px] leading-snug">
                                  {renderScriptedInstruction(group.trial2)}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
                <tr className="border-b border-slate-200 dark:border-zinc-800 align-top">
                <td className="w-12 px-2 py-1 font-semibold text-slate-500 dark:text-zinc-400">{tagBadge(it.tag ?? null)}{it.k}.</td>
                <td className="w-36 px-2 py-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  <div>{it.blocks} blocks · {it.t}</div>
                  {script?.stim && stimUrls[script.stim] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={stimUrls[script.stim]}
                        alt=""
                        className="mt-1 w-28 h-auto rounded border border-zinc-200 dark:border-zinc-800"
                      />
                      <button
                        type="button"
                        onClick={() => script.stim && showOnExaminee(script.stim)}
                        className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[#4EBFD4] hover:underline"
                      >
                        Show to examinee
                      </button>
                    </>
                  ) : null}
                </td>
                <td className="px-2 py-1">
                  {it.trials ? (
                    <>
                      <BdTrialRow label="T1" name={name} suffix="t1" data={data} setData={setData} withOk />
                      <BdTrialRow label="T2" name={name} suffix="t2" data={data} setData={setData} withOk />
                    </>
                  ) : (
                    <BdTrialRow label="" name={name} suffix="t" data={data} setData={setData} />
                  )}
                </td>
                <td className="px-2 py-1">
                  <div className="flex flex-wrap items-end gap-1">
                    {opts.map(v => {
                      const isSelected = data[name] === String(v)
                      const isZero = v === 0
                      const range = bdTimeRange(it.k, v)
                      return (
                        <div key={v} className="flex flex-col items-center">
                          {range ? (
                            <span className="mb-0.5 font-mono text-[9px] leading-none text-zinc-500 dark:text-zinc-400">{range}</span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => set(name, isSelected ? '' : String(v))}
                            className={[
                              'min-w-[24px] rounded-full border px-2 py-0.5 text-[12px] transition-colors',
                              isSelected && isZero
                                ? 'border-[#E7437D] bg-[#E7437D] text-white'
                                : isSelected
                                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                                : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-600',
                            ].join(' ')}
                          >
                            {v}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </td>
              </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
      {st.extras && st.extras.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-4">
          {st.extras.map(e => (
            <label key={e} className="flex flex-col text-[11px] text-slate-500 dark:text-zinc-400">
              {e}
              <NumField name={`${st.id}-x-${e.split(' ')[0]}`} className="w-20" />
            </label>
          ))}
        </div>
      ) : null}
    </>
    )
  }

  const renderRunDigits = (st: Subtest) => (
    <>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            <th className="px-2 py-1 text-left">Item</th>
            <th className="px-2 py-1 text-left">String</th>
            <th className="px-2 py-1 text-left">Recall</th>
            <th className="px-2 py-1 text-left">Response</th>
            <th className="px-2 py-1 text-left">Score</th>
          </tr>
        </thead>
        <tbody>
          {(st.items || []).map(it => {
            const name = `${st.id}-${it.k}`
            return (
              <tr key={it.k} className="border-b border-slate-200 dark:border-zinc-800 align-top">
                <td className="w-12 px-2 py-1 font-semibold text-slate-500 dark:text-zinc-400">{tagBadge(it.tag ?? null)}{it.k}.</td>
                <td className="px-2 py-1 font-mono text-[11px] text-slate-500 dark:text-zinc-400">{it.string}</td>
                <td className="w-20 px-2 py-1 text-[11px] text-slate-500 dark:text-zinc-400">{String(it.recall)}</td>
                <td className="px-2 py-1"><TinyInput name={`${name}-r`} placeholder="response (digits in order recalled)" /></td>
                <td className="w-24 px-2 py-1">
                  {it.sample
                    ? <span className="text-[11px] text-slate-400 dark:text-zinc-500">sample</span>
                    : <NumField name={name} placeholder="0" className="w-16" />}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {st.extras && st.extras.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-4">
          {st.extras.map(e => (
            <label key={e} className="flex flex-col text-[11px] text-slate-500 dark:text-zinc-400">
              {e}
              <NumField name={`${st.id}-x-${e.split(' ')[0]}`} className="w-20" />
            </label>
          ))}
        </div>
      ) : null}
    </>
  )

  const renderArith = (st: Subtest) => (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          <th className="px-2 py-1 text-left">Item</th>
          <th className="px-2 py-1 text-left"></th>
          <th className="px-2 py-1 text-left">Time</th>
          <th className="px-2 py-1 text-left">Correct</th>
          <th className="px-2 py-1 text-left">Response</th>
          <th className="px-2 py-1 text-left">Score</th>
        </tr>
      </thead>
      <tbody>
        {(st.items || []).map(it => {
          const name = `${st.id}-${it.k}`
          const kind: ScoreKind = (it.score as ScoreKind) || '01'
          return (
            <tr key={it.k} className="border-b border-slate-200 dark:border-zinc-800 align-top">
              <td className="w-12 px-2 py-1 font-semibold text-slate-500 dark:text-zinc-400">{tagBadge(it.tag ?? null)}{it.k}.</td>
              <td className="w-24 px-2 py-1">{it.label}</td>
              <td className="w-20 px-2 py-1"><NumField name={`${name}-time`} placeholder="sec" className="w-16" /></td>
              <td className="w-20 px-2 py-1 text-[11px] text-slate-500 dark:text-zinc-400">{it.correct || ''}</td>
              <td className="px-2 py-1"><TextField name={`${name}-r`} placeholder="response" className="w-full" /></td>
              <td className="w-32 px-2 py-1">
                {it.sample
                  ? <span className="text-[11px] text-slate-400 dark:text-zinc-500">sample</span>
                  : <ScorePills name={name} kind={kind} />}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  const renderTimed = (st: Subtest) => (
    <div className="flex flex-wrap gap-4">
      {(st.fields || []).map((f, i) => (
        <label key={f} className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-zinc-400">
          {f}
          <NumField name={`${st.id}-f${i}`} step="0.01" className="w-36" />
        </label>
      ))}
    </div>
  )

  const renderSubtest = (st: Subtest) => {
    switch (st.type) {
      case 'verbal': return renderVerbal(st)
      case 'mcq': return renderMcq(st)
      case 'mcq3of6': return renderMcq3of6(st)
      case 'twotrial': return renderTwoTrial(st)
      case 'blockdesign': return renderBlockDesign(st)
      case 'rundigits': return renderRunDigits(st)
      case 'arith': return renderArith(st)
      case 'timed': return renderTimed(st)
      default: return null
    }
  }

  // ---------- behavioral fields ----------
  const BX_FIELDS: Array<[string, string]> = [
    ['bx-referral', 'Referral source / Reason for referral / Presenting complaint(s)'],
    ['bx-language', 'Language (first/primary, English fluency, expressive & receptive, articulation)'],
    ['bx-appearance', 'Physical appearance'],
    ['bx-sensory', 'Visual / Auditory / Motor problems (corrected with glasses, hearing aid?)'],
    ['bx-attention', 'Attention and concentration'],
    ['bx-attitude', 'Attitude toward testing (rapport, eagerness, motivation, reaction to success/failure)'],
    ['bx-affect', 'Affect / Mood'],
    ['bx-unusual', 'Unusual behaviors / Verbalizations'],
    ['bx-other', 'Other notes'],
  ]

  // ---------- render ----------

  return (
    <div className="space-y-5">
      {/* sticky action bar */}
      <div className="sticky top-0 z-40 -mx-4 flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 print:hidden">
        <p className="mr-auto text-[11px] font-mono uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-400">WAIS-5 Record Form</p>
        <button type="button" onClick={handleSave} className="rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Save</button>
        <button type="button" onClick={handleExport} className="rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Export JSON</button>
        <button type="button" onClick={() => importInputRef.current?.click()} className="rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Import JSON</button>
        <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        <button type="button" onClick={() => window.print()} className="rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Print</button>
        <button type="button" onClick={handleClear} className="rounded border border-[#E7437D] bg-[#E7437D] px-3 py-1 text-[12px] text-white hover:opacity-90">New</button>
      </div>

      {/* jump nav — fixed on left, hover/focus expands */}
      <nav className="group fixed left-2 top-1/2 z-30 -translate-y-1/2 print:hidden">
        <button
          type="button"
          tabIndex={0}
          className="rounded border border-zinc-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
          aria-label="Jump to section"
        >
          Jump
        </button>
        <div className="invisible absolute left-full top-1/2 ml-1 w-64 max-h-[calc(100vh-2rem)] -translate-x-1 -translate-y-1/2 overflow-y-auto rounded border border-zinc-200 dark:border-zinc-800 bg-white/98 dark:bg-zinc-900/98 backdrop-blur p-2 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-x-0 group-focus-within:opacity-100">
          <p className="px-1 pb-1 text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Jump to</p>
          <div className="flex flex-col">
            {SUBTESTS.map(st => (
              <a key={st.id} href={`#st-${st.id}`} className="rounded px-2 py-1 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100">
                <span className="inline-block w-5 text-zinc-400 dark:text-zinc-500">{st.n}.</span>
                {st.name}
              </a>
            ))}
            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
            <a href="#bx" className="rounded px-2 py-1 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100">Behavioral</a>
            <a href="#summary" className="rounded px-2 py-1 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100">Summary</a>
            <a href="#analysis" className="rounded px-2 py-1 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100">Analysis</a>
          </div>
        </div>
      </nav>

      {/* identifying info */}
      <section className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-3 flex items-baseline gap-2 text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
          <span className="font-bold">0</span> Identifying Information
        </h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <label className="flex flex-col text-[12px] text-slate-500 dark:text-zinc-400">Examinee&apos;s Name<TextField name="id-examinee" className="mt-1" /></label>
          <label className="flex flex-col text-[12px] text-slate-500 dark:text-zinc-400">Examiner&apos;s Name<TextField name="id-examiner" className="mt-1" /></label>
          <label className="flex flex-col text-[12px] text-slate-500 dark:text-zinc-400">ID<TextField name="id-id" className="mt-1" /></label>
          <label className="flex flex-col text-[12px] text-slate-500 dark:text-zinc-400">Handedness
            <select
              value={data['id-handedness'] || ''}
              onChange={e => set('id-handedness', e.target.value)}
              className="mt-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[13px]"
            >
              <option value="">—</option>
              <option value="R">R</option>
              <option value="L">L</option>
            </select>
          </label>
          <label className="flex flex-col text-[12px] text-slate-500 dark:text-zinc-400">Testing Site<TextField name="id-site" className="mt-1" /></label>
          <label className="flex flex-col text-[12px] text-slate-500 dark:text-zinc-400">Referral Source<TextField name="id-referral" className="mt-1" /></label>
        </div>
        <div className="mt-4 grid grid-cols-[auto_auto_auto_auto] gap-x-3 gap-y-1 text-[12px] text-slate-500 dark:text-zinc-400">
          <div></div><div>Year</div><div>Month</div><div>Day</div>
          <div className="self-center">Test Date</div>
          <NumField name="td-y" placeholder="YYYY" className="w-20" />
          <NumField name="td-m" placeholder="MM" className="w-16" />
          <NumField name="td-d" placeholder="DD" className="w-16" />
          <div className="self-center">Birth Date</div>
          <NumField name="bd-y" placeholder="YYYY" className="w-20" />
          <NumField name="bd-m" placeholder="MM" className="w-16" />
          <NumField name="bd-d" placeholder="DD" className="w-16" />
          <div className="self-center">Test Age</div>
          <div className="font-semibold text-slate-900 dark:text-zinc-100">{ageStr.y}</div>
          <div className="font-semibold text-slate-900 dark:text-zinc-100">{ageStr.m}</div>
          <div className="font-semibold text-slate-900 dark:text-zinc-100">{ageStr.d}</div>
        </div>
      </section>

      {/* composite ref */}
      <section className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 print:hidden">
        <h2 className="mb-1 flex items-baseline gap-2 text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
          <span className="font-bold">REF</span> Composite Structure (reference)
        </h2>
        <details>
          <summary className="cursor-pointer text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">show composite → subtest map</summary>
          <div className="mt-2 text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
            <p><b className="text-slate-900 dark:text-zinc-100">Full Scale:</b> SI, VC, BD, MR, FW, DQ, CD</p>
            <p><b className="text-slate-900 dark:text-zinc-100">VCI (Verbal Comprehension):</b> SI, VC &nbsp; <b className="text-slate-900 dark:text-zinc-100">VSI (Visual Spatial):</b> BD, VP &nbsp; <b className="text-slate-900 dark:text-zinc-100">FRI (Fluid Reasoning):</b> MR, FW</p>
            <p><b className="text-slate-900 dark:text-zinc-100">WMI (Working Memory):</b> DQ, RD &nbsp; <b className="text-slate-900 dark:text-zinc-100">PSI (Processing Speed):</b> CD, SS</p>
            <p className="italic">Ancillary indexes use additional combos — see Summary section.</p>
          </div>
        </details>
      </section>

      {/* general intro */}
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 border-l-2 border-l-[#4EBFD4] p-4 print:hidden">
        <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-700 dark:text-zinc-300">
          Read aloud · General introduction
        </p>
        <p className="text-[15px] font-semibold leading-relaxed text-[#4EBFD4]">
          &ldquo;{GENERAL_TEST_INTRO}&rdquo;
        </p>
      </section>

      {/* subtests */}
      {SUBTESTS.map(st => {
        const intro = SUBTEST_INTROS[st.id]
        return (
        <section key={st.id} id={`st-${st.id}`} className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="mb-2 flex items-baseline gap-2 text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="font-bold">{st.n}.</span> {st.name}
          </h2>
          <p className="mb-3 text-[11px] text-slate-500 dark:text-zinc-400">{st.rules}</p>
          {intro?.instruction ? (
            <div className="mb-4 rounded border-l-2 border-l-[#4EBFD4] p-3">
              <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-700 dark:text-zinc-300">
                Read aloud · Instructions
              </p>
              <p className="text-[14px] leading-snug">
                {renderScriptedInstruction(intro.instruction)}
              </p>
            </div>
          ) : null}
          {intro?.sample ? (
            <div className="mb-4 rounded border border-zinc-200 dark:border-zinc-800 border-l-2 border-l-[#4EBFD4] p-3">
              <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-700 dark:text-zinc-300">
                Sample item · Read aloud
              </p>
              <p className="text-[14px] font-semibold leading-snug text-[#4EBFD4]">
                &ldquo;{intro.sample.prompt}&rdquo;
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {intro.sample.onCorrect ? (
                  <div className="text-[12px] text-zinc-600 dark:text-zinc-400">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#4EBFD4]">If correct: </span>
                    Say, &ldquo;{intro.sample.onCorrect}&rdquo;
                  </div>
                ) : null}
                {intro.sample.onIncorrect ? (
                  <div className="text-[12px] text-zinc-600 dark:text-zinc-400">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F39E3A]">If incorrect: </span>
                    Say, &ldquo;{intro.sample.onIncorrect}&rdquo;
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          {intro?.notes && intro.notes.length > 0 ? (
            <details className="mb-4 print:hidden">
              <summary className="cursor-pointer text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                Examiner notes ({intro.notes.length})
              </summary>
              <ul className="mt-2 space-y-1 pl-4 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400 list-disc">
                {intro.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </details>
          ) : null}
          {renderSubtest(st)}
          {/* extras for twotrial */}
          {(st.type === 'twotrial' || st.type === 'arith') && st.extras && st.extras.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-4">
              {st.extras.map(e => (
                <label key={e} className="flex flex-col text-[11px] text-slate-500 dark:text-zinc-400">
                  {e}
                  <NumField name={`${st.id}-x-${e.split(' ')[0]}`} className="w-20" />
                </label>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-end gap-3 text-[13px] text-slate-500 dark:text-zinc-400">
            {st.name} Total Raw Score (Max {st.max}):
            <span className="inline-block min-w-[48px] px-2 py-1 text-center text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
              {totals[st.id] || 0}
            </span>
          </div>
        </section>
        )
      })}

      {/* behavioral */}
      <section id="bx" className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-2 flex items-baseline gap-2 text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
          <span className="font-bold">BX</span> Behavioral Observations
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {BX_FIELDS.map(([name, label]) => (
            <label key={name} className="flex flex-col gap-1 text-[12px] text-slate-500 dark:text-zinc-400">
              {label}
              <TextArea name={name} className="min-h-[50px]" />
            </label>
          ))}
        </div>
      </section>

      {/* summary */}
      <section id="summary" className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-2 flex items-baseline gap-2 text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
          <span className="font-bold">SUM</span> Summary — Raw → Scaled Score Conversion
        </h2>
        <p className="mb-3 text-[11px] text-slate-500 dark:text-zinc-400">
          Look up scaled scores in WAIS-5 Admin &amp; Scoring Manual tables. Enter manually. Raw totals auto-fill from above.
        </p>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Subtest</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Raw</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Scaled</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Ref. Group Scaled</th>
            </tr>
          </thead>
          <tbody>
            {SUMMARY_SUBTESTS.map(([name, id, abbr]) => (
              <tr key={id}>
                <td className="border border-slate-300 bg-slate-50 dark:bg-zinc-950 px-2 py-1 font-medium">{name} ({abbr})</td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center font-semibold">{totals[id] || 0}</td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`scaled-${id}`} placeholder="—" className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`refgroup-${id}`} placeholder="—" className="w-16 text-center" /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mt-5 mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Primary Index Scores</h3>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Scale</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Sum Scaled</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Index</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">%ile</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">CI</th>
            </tr>
          </thead>
          <tbody>
            {PRIMARY_INDEXES.map(ix => (
              <tr key={ix}>
                <td className="border border-slate-300 bg-slate-50 dark:bg-zinc-950 px-2 py-1 font-medium">{ix}</td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`ix-sum-${ix}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`ix-score-${ix}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`ix-pct-${ix}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`ix-ci-${ix}`} placeholder="90% / 95%" className="w-28 text-center" /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mt-5 mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Ancillary / Process Index Scores</h3>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Scale</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Sum Scaled</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Index</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">%ile</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">CI</th>
            </tr>
          </thead>
          <tbody>
            {ANCILLARY_INDEXES.map(ix => (
              <tr key={ix}>
                <td className="border border-slate-300 bg-slate-50 dark:bg-zinc-950 px-2 py-1 font-medium">{ix}</td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`anc-sum-${ix}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`anc-score-${ix}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`anc-pct-${ix}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`anc-ci-${ix}`} className="w-28 text-center" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* analysis */}
      <section id="analysis" className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-2 flex items-baseline gap-2 text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
          <span className="font-bold">ANL</span> Primary &amp; Pairwise Analysis
        </h2>
        <p className="mb-3 text-[11px] text-slate-500 dark:text-zinc-400">
          Look up critical values &amp; base rates in WAIS-5 manual tables B.1–B.8. All values entered manually.
        </p>

        {/* auto-computed means + comparison selection toggles */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50 dark:bg-zinc-950 p-3">
            <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-400">Comparison Score</p>
            <div className="grid grid-cols-3 gap-2 text-[12px]">
              <div>
                <p className="text-slate-500 dark:text-zinc-400">MIS (Sum of 5 Idx ÷ 5)</p>
                <p className="font-semibold text-slate-900 dark:text-zinc-100">{derived.mis || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-zinc-400">MSS-P (10 Primary ÷ 10)</p>
                <p className="font-semibold text-slate-900 dark:text-zinc-100">{derived.mssP || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-zinc-400">MSS-F (7 FSIQ ÷ 7)</p>
                <p className="font-semibold text-slate-900 dark:text-zinc-100">{derived.mssF || '—'}</p>
              </div>
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 dark:bg-zinc-950 p-3">
            <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-400">Comparison Selections</p>
            <div className="flex flex-wrap gap-4 text-[12px]">
              <label className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-zinc-400">Critical Value:</span>
                <select
                  value={data['anl-sig'] || ''}
                  onChange={e => set('anl-sig', e.target.value)}
                  className="rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1 py-0.5"
                >
                  <option value="">—</option>
                  <option value=".01">.01</option>
                  <option value=".05">.05</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-zinc-400">Base Rate Ref:</span>
                <select
                  value={data['anl-ref'] || ''}
                  onChange={e => set('anl-ref', e.target.value)}
                  className="rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1 py-0.5"
                >
                  <option value="">—</option>
                  <option value="overall">Overall Sample</option>
                  <option value="ability">Ability Level</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <h3 className="mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Strengths and Weaknesses</h3>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Index / Subtest</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Score</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Comp.</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Diff.</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Crit.</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">S/W</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Base Rate</th>
            </tr>
          </thead>
          <tbody>
            {SW_ROWS.map(c => (
              <tr key={c}>
                <td className="border border-slate-300 bg-slate-50 dark:bg-zinc-950 px-2 py-1 font-medium">{c}</td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`sw-score-${c}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`sw-comp-${c}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`sw-diff-${c}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`sw-crit-${c}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center">
                  <select
                    value={data[`sw-sw-${c}`] || ''}
                    onChange={e => set(`sw-sw-${c}`, e.target.value)}
                    className="rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1 py-0.5 text-[12px]"
                  >
                    <option value="">—</option>
                    <option value="S">S</option>
                    <option value="W">W</option>
                  </select>
                </td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`sw-base-${c}`} className="w-16 text-center" /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mt-5 mb-2 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Pairwise Difference Comparisons</h3>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Comparison</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Score 1</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Score 2</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Diff.</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Crit.</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Sig.</th>
              <th className="border border-slate-300 dark:border-zinc-700 px-2 py-1">Base Rate</th>
            </tr>
          </thead>
          <tbody>
            {PAIRWISE_COMPARISONS.map(([a, b]) => (
              <tr key={`${a}-${b}`}>
                <td className="border border-slate-300 bg-slate-50 dark:bg-zinc-950 px-2 py-1 font-medium">{a} − {b}</td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`pw-a-${a}-${b}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`pw-b-${a}-${b}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`pw-diff-${a}-${b}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`pw-crit-${a}-${b}`} className="w-16 text-center" /></td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center">
                  <select
                    value={data[`pw-sig-${a}-${b}`] || ''}
                    onChange={e => set(`pw-sig-${a}-${b}`, e.target.value)}
                    className="rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1 py-0.5 text-[12px]"
                  >
                    <option value="">—</option>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </td>
                <td className="border border-slate-300 dark:border-zinc-700 px-2 py-1 text-center"><TextField name={`pw-base-${a}-${b}`} className="w-16 text-center" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded bg-slate-900 px-3 py-2 text-[12px] text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
