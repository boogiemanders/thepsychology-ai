'use client'

import { useState } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function LicenseWatchForm() {
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setError('')

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch('/api/license-watch/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.get('firstName'),
          lastName: data.get('lastName'),
          email: data.get('email'),
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Something went wrong')
      }

      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 text-center">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">You&apos;re on the list</p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
          We&apos;ll email you the moment your license appears in the NYSED system.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            placeholder="e.g. Jordan"
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow duration-150"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            placeholder="e.g. Smith"
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow duration-150"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow duration-150"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity duration-150 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {state === 'submitting' ? 'Signing up...' : 'Notify me when my license is posted'}
      </button>
    </form>
  )
}
