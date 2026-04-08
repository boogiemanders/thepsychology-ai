'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type FormState = 'idle' | 'submitting' | 'success' | 'error'
type AuthState = 'loading' | 'signed-in' | 'signed-out'

interface SuccessResult {
  figureCount: number
  downloadUrl: string
  email: string
}

export function DentalExtractorForm() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<SuccessResult | null>(null)
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session?.user) {
        setAuthState('signed-in')
        setUserEmail(data.session.user.email ?? null)
      } else {
        setAuthState('signed-out')
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthState('signed-in')
        setUserEmail(session.user.email ?? null)
      } else {
        setAuthState('signed-out')
      }
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setError('')
    setResult(null)

    const form = e.currentTarget
    const data = new FormData(form)
    const file = data.get('pdf')
    if (!(file instanceof File) || file.size === 0) {
      setError('Please choose a PDF file')
      setState('error')
      return
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        setError('Your session expired. Please sign in again.')
        setState('error')
        return
      }

      const res = await fetch('/api/dental/orchestrate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || body.detail || `Request failed (${res.status})`)
      }

      const json = (await res.json()) as { figureCount: number; downloadUrl: string }
      setResult({
        figureCount: json.figureCount,
        downloadUrl: json.downloadUrl,
        email: userEmail ?? '',
      })
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  if (authState === 'loading') {
    return (
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <p className="text-[13px] text-zinc-400 dark:text-zinc-500">Checking sign-in…</p>
      </div>
    )
  }

  if (authState === 'signed-out') {
    return (
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 text-center">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Sign in to extract figures
        </p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-4">
          We email the PowerPoint to your account, so we need you logged in.
        </p>
        <Link
          href="/login?redirect=/lab/dental"
          className="inline-block rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity duration-150 hover:opacity-80"
        >
          Sign in
        </Link>
      </div>
    )
  }

  if (state === 'success' && result) {
    return (
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 text-center">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
          {result.figureCount} {result.figureCount === 1 ? 'figure' : 'figures'} extracted
        </p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-4">
          {result.email
            ? `We emailed the PowerPoint to ${result.email}.`
            : 'We emailed the PowerPoint to your account.'}
        </p>
        <a
          href={result.downloadUrl}
          className="inline-block rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity duration-150 hover:opacity-80"
        >
          Download PowerPoint
        </a>
        <button
          type="button"
          onClick={() => {
            setState('idle')
            setResult(null)
            setFileName('')
          }}
          className="block mx-auto mt-4 text-[12px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Extract another PDF
        </button>
      </div>
    )
  }

  const submitting = state === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="pdf"
          className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5"
        >
          PDF file
        </label>
        <label
          htmlFor="pdf"
          className="block w-full rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-500 transition-colors cursor-pointer"
        >
          {fileName || 'Click to choose a PDF (max 50MB)'}
          <input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf"
            required
            className="sr-only"
            onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? '')}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {submitting && (
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Extracting figures… this can take 30–90 seconds for a full textbook chapter.
          Don&apos;t close this tab.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity duration-150 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? 'Extracting…' : 'Extract figures'}
      </button>
    </form>
  )
}
