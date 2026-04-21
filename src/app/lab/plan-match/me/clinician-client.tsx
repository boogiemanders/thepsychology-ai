'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { INSURANCE_PAYERS, LAUNCH_STATES } from '@/lib/matching-constants'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const STATE_LABELS: Record<string, string> = {
  CA: 'California',
  NY: 'New York',
}

export function ClinicianClient() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [networks, setNetworks] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [profileStatus, setProfileStatus] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchCurrent() {
      if (!user) {
        setLoading(false)
        return
      }
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/plan-match/provider-networks', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setNetworks(data.networks ?? [])
          setStates(data.states ?? [])
          setProfileStatus(data.status ?? null)
        }
      } catch (err) {
        console.error('Failed to load networks:', err)
      }
      setLoading(false)
    }

    if (!authLoading) fetchCurrent()
  }, [user, authLoading])

  function togglePayer(payer: string) {
    setNetworks((prev) =>
      prev.includes(payer) ? prev.filter((p) => p !== payer) : [...prev, payer]
    )
    setSaveState('idle')
  }

  function toggleState(state: string) {
    setStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    )
    setSaveState('idle')
  }

  async function handleSave() {
    setSaveState('saving')
    setError('')

    const { data: session } = await supabase.auth.getSession()
    const token = session?.session?.access_token
    if (!token) {
      setError('Not signed in')
      setSaveState('error')
      return
    }

    try {
      const res = await fetch('/api/plan-match/provider-networks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ networks, states }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Save failed')
      }

      setSaveState('saved')
      // Refetch to pick up any new status
      const refresh = await fetch('/api/plan-match/provider-networks', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (refresh.ok) {
        const data = await refresh.json()
        setProfileStatus(data.status ?? null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaveState('error')
    }
  }

  if (authLoading || loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
  }

  if (!user) {
    return (
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 text-center">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Sign in to set your networks
        </p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-4">
          This tool is for psychologists on the platform.
        </p>
        <Link
          href="/login?next=/lab/plan-match/me"
          className="inline-block rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity duration-150 hover:opacity-80"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {profileStatus && profileStatus !== 'active' && (
        <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-[13px] text-amber-900 dark:text-amber-200">
          Your profile status is <strong>{profileStatus}</strong>. Patients won&apos;t see you in search until it&apos;s{' '}
          <strong>active</strong>. Finish{' '}
          <Link href="/provider/onboard" className="underline">
            provider onboarding
          </Link>{' '}
          to get reviewed.
        </div>
      )}

      <section>
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Insurance networks I accept
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INSURANCE_PAYERS.map((payer) => {
            const checked = networks.includes(payer)
            return (
              <label
                key={payer}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  checked
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePayer(payer)}
                  className="sr-only"
                />
                <span className="text-[13px]">{payer}</span>
              </label>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          States I&apos;m licensed in (telehealth)
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {LAUNCH_STATES.map((s) => {
            const checked = states.includes(s)
            return (
              <label
                key={s}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  checked
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleState(s)}
                  className="sr-only"
                />
                <span className="text-[13px]">{STATE_LABELS[s] ?? s}</span>
              </label>
            )
          })}
        </div>
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity duration-150 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {saveState === 'saving' ? 'Saving...' : 'Save'}
        </button>
        {saveState === 'saved' && (
          <span className="text-[13px] text-emerald-600 dark:text-emerald-400">Saved</span>
        )}
      </div>
    </div>
  )
}
