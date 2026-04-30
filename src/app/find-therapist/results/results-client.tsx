'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'

type Match = {
  id: string
  license_type: string | null
  bio_text: string | null
  approach_text: string | null
  modalities: string[]
  conditions_treated: string[]
  populations_served: string[]
  languages_spoken: string[]
  insurance_networks: string[]
  self_pay_rate_cents: number | null
  sliding_scale_available: boolean
  lgbtq_affirming: boolean
  score: number
  breakdown: {
    specialization: number
    modality: number
    style: number
    cultural: number
    practical: number
  }
  insurance_match: boolean
  reasons: string[]
}

const DIMENSION_LABELS: Record<keyof Match['breakdown'], string> = {
  specialization: 'Specialization',
  modality: 'Modality',
  style: 'Style',
  cultural: 'Cultural fit',
  practical: 'Practical',
}

function formatRate(cents: number | null) {
  if (!cents) return null
  return `$${Math.round(cents / 100)}`
}

export function ResultsClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [state, setState] = useState<string>('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'needs_intake' | 'error'>('loading')
  const [error, setError] = useState('')
  const [inNetworkOnly, setInNetworkOnly] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/find-therapist/intake')
      return
    }

    const load = async () => {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) {
        router.push('/find-therapist/intake')
        return
      }

      try {
        const res = await fetch('/api/matching/find-matches', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const body = await res.json()
        if (!res.ok) {
          if (body.redirect) {
            router.push(body.redirect)
            return
          }
          setError(body.error || 'Failed to load matches')
          setStatus('error')
          return
        }
        setMatches(body.matches ?? [])
        setState(body.intake_state ?? '')
        setStatus('ready')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches')
        setStatus('error')
      }
    }
    load()
  }, [user, authLoading, router])

  if (status === 'loading' || authLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Scoring your matches...</p>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </main>
    )
  }

  const visible = inNetworkOnly ? matches.filter((m) => m.insurance_match) : matches

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-10">
        <Link
          href="/find-therapist/intake"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Intake
        </Link>
      </div>

      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-3">Your matches</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {matches.length} psychologists in {state} ranked by clinical fit with your intake.
          Scores reflect specialization, modality, therapeutic style, cultural fit, and practical match.
        </p>
      </div>

      {matches.some((m) => m.insurance_match) && (
        <div className="mb-8">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={inNetworkOnly}
              onChange={(e) => setInNetworkOnly(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-700"
            />
            In-network with my plan only
          </label>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            No matches yet
          </p>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The platform is new. We&apos;re adding psychologists in California and New York first.
          </p>
        </div>
      ) : (
        <ul className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
          {visible.map((m) => {
            const rate = formatRate(m.self_pay_rate_cents)
            return (
              <li key={m.id} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5">
                <Link
                  href={`/find-therapist/provider/${m.id}`}
                  className="block hover:opacity-90 transition-opacity"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {m.license_type || 'Licensed Psychologist'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-zinc-900 dark:text-zinc-100">
                          {m.score}% match
                        </span>
                        {m.insurance_match && (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            In-network
                          </span>
                        )}
                      </div>
                    </div>
                    {rate && (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {rate} self-pay
                        {m.sliding_scale_available ? ' . sliding scale' : ''}
                      </span>
                    )}
                  </div>

                  {m.reasons.length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {m.reasons.map((r, i) => (
                        <li
                          key={i}
                          className="text-[12px] text-zinc-600 dark:text-zinc-400 flex gap-2"
                        >
                          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="grid grid-cols-5 gap-1 mt-4">
                    {(
                      Object.entries(m.breakdown) as Array<[
                        keyof Match['breakdown'],
                        number,
                      ]>
                    ).map(([dim, val]) => (
                      <div key={dim} className="flex flex-col gap-1">
                        <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-zinc-900 dark:bg-zinc-100"
                            style={{ width: `${Math.max(val, 4)}%` }}
                          />
                        </div>
                        <p className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          {DIMENSION_LABELS[dim]}
                        </p>
                      </div>
                    ))}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-8">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
          Match scores use structured intake data only. Semantic re-ranking on free-text bios is coming next.
        </p>
      </div>
    </main>
  )
}
