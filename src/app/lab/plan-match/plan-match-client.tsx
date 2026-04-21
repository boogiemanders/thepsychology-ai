'use client'

import { useState } from 'react'
import { INSURANCE_PAYERS, LAUNCH_STATES } from '@/lib/matching-constants'

type Provider = {
  id: string
  license_type: string | null
  bio_text: string | null
  approach_text: string | null
  modalities: string[]
  conditions_treated: string[]
  populations_served: string[]
  languages_spoken: string[]
  insurance_networks: string[]
  telehealth_states: string[]
  self_pay_rate_cents: number | null
  sliding_scale_available: boolean
}

type SearchState = 'idle' | 'searching' | 'success' | 'error'

const STATE_LABELS: Record<string, string> = {
  CA: 'California',
  NY: 'New York',
}

function formatRate(cents: number | null) {
  if (!cents) return null
  return `$${Math.round(cents / 100)}`
}

export function PlanMatchClient() {
  const [payer, setPayer] = useState<string>('')
  const [state, setState] = useState<string>('')
  const [status, setStatus] = useState<SearchState>('idle')
  const [providers, setProviders] = useState<Provider[]>([])
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!payer || !state) return

    setStatus('searching')
    setError('')

    try {
      const res = await fetch('/api/plan-match/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payer, state }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Search failed')
      }

      const data = await res.json()
      setProviders(data.providers ?? [])
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="payer"
              className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5"
            >
              Insurance plan
            </label>
            <select
              id="payer"
              name="payer"
              required
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow duration-150"
            >
              <option value="">Pick a plan</option>
              {INSURANCE_PAYERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="state"
              className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5"
            >
              State
            </label>
            <select
              id="state"
              name="state"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow duration-150"
            >
              <option value="">Pick a state</option>
              {LAUNCH_STATES.map((s) => (
                <option key={s} value={s}>
                  {STATE_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={!payer || !state || status === 'searching'}
          className="w-full rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity duration-150 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {status === 'searching' ? 'Searching...' : 'Show psychologists who take this plan'}
        </button>
      </form>

      {status === 'success' && providers.length === 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            No psychologists yet for that plan in that state
          </p>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The platform is new. We&apos;re adding psychologists in California and New York first.
            Check back soon, or try a different plan.
          </p>
        </div>
      )}

      {status === 'success' && providers.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 space-y-6">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
            {providers.length} {providers.length === 1 ? 'psychologist' : 'psychologists'} take{' '}
            {payer} in {STATE_LABELS[state] ?? state}
          </p>
          <ul className="space-y-4">
            {providers.map((p) => {
              const rate = formatRate(p.self_pay_rate_cents)
              return (
                <li
                  key={p.id}
                  className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {p.license_type || 'Licensed Psychologist'}
                    </p>
                    {rate && (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {rate} self-pay
                        {p.sliding_scale_available ? ' · sliding scale' : ''}
                      </span>
                    )}
                  </div>

                  {p.bio_text && (
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3 line-clamp-3">
                      {p.bio_text}
                    </p>
                  )}

                  {p.modalities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {p.modalities.slice(0, 4).map((m) => (
                        <span
                          key={m}
                          className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-0.5"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {p.conditions_treated.length > 0 && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {p.conditions_treated.slice(0, 5).join(' · ')}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
