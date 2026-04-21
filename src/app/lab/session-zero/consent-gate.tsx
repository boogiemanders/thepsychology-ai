'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onGranted: () => void
}

export function ConsentGate({ onGranted }: Props) {
  const [aiDisclosure, setAiDisclosure] = useState(false)
  const [crisisProtocol, setCrisisProtocol] = useState(false)
  const [ageVerified, setAgeVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const allRequired = aiDisclosure && crisisProtocol && ageVerified

  async function handleSubmit() {
    if (!allRequired) return
    setSubmitting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('You need to be signed in.')
        return
      }

      const res = await fetch('/api/therapy-chat/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          consented_to_ai_disclosure: aiDisclosure,
          consented_to_crisis_escalation_protocol: crisisProtocol,
          age_verified_adult: ageVerified,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Failed to save consent')
        return
      }

      onGranted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-3">
          Before we start
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Three things to confirm. All are required.
        </p>
      </div>

      <div className="space-y-3">
        <ConsentCheck
          checked={aiDisclosure}
          onChange={setAiDisclosure}
          label="I understand I am talking to an AI, not a licensed therapist."
          sub="Session Zero is software. It does not diagnose, does not prescribe, and is not therapy."
        />
        <ConsentCheck
          checked={crisisProtocol}
          onChange={setCrisisProtocol}
          label="I understand the crisis protocol."
          sub="If I mention self-harm, abuse, or intent to harm someone, the chat will surface 988 and the Crisis Text Line. In emergencies, I will call 911."
        />
        <ConsentCheck
          checked={ageVerified}
          onChange={setAgeVerified}
          label="I am 18 or older."
          sub="Session Zero is adults only while we validate safety."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allRequired || submitting}
        className="w-full rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity duration-150 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? 'Saving...' : 'Agree and continue'}
      </button>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed text-center">
        In crisis now? Call or text 988 (Suicide &amp; Crisis Lifeline) or 911.
      </p>
    </div>
  )
}

function ConsentCheck({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  sub: string
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer p-4 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors duration-150">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 cursor-pointer"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
        <span className="block text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
          {sub}
        </span>
      </span>
    </label>
  )
}
