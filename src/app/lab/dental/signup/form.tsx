'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  clearStoredUTMParams,
  formatUTMForAPI,
  getStoredUTMParams,
  storeUTMParams,
} from '@/lib/utm-tracking'
import {
  DENTAL_REFERRAL_SOURCE,
  DENTAL_SIGNUP_SOURCE,
} from '@/lib/signup-provisioning'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await fetch(url, options)
    if (response.ok) return response
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  return fetch(url, options)
}

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/')) return '/lab/dental'
  return value
}

export function DentalSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => getSafeNextPath(searchParams.get('next')), [searchParams])
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    storeUTMParams()
  }, [])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session?.user) {
        router.replace(nextPath)
        return
      }
      setCheckingSession(false)
    })

    return () => {
      cancelled = true
    }
  }, [nextPath, router])

  const isSubmitting = state === 'submitting'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!formData.email || !formData.password) {
      setError('Email and password are required.')
      setState('error')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      setState('error')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      setState('error')
      return
    }

    setState('submitting')

    try {
      const utmParams = formatUTMForAPI(getStoredUTMParams())
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName || null,
            referral_source: DENTAL_REFERRAL_SOURCE,
            signup_source: DENTAL_SIGNUP_SOURCE,
            skip_trial: true,
            subscription_tier: 'free',
            ...utmParams,
          },
        },
      })

      if (authError) throw new Error(authError.message)

      const userId = data.user?.id
      if (!userId) {
        throw new Error('Unable to create account. Please try again.')
      }

      const profileResponse = await fetchWithRetry('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: formData.email,
          fullName: formData.fullName || null,
          subscriptionTier: 'free',
          signupSource: DENTAL_SIGNUP_SOURCE,
          skipTrial: true,
          authCreatedAt: data.user?.created_at || null,
          promoCodeUsed: null,
          referralSource: DENTAL_REFERRAL_SOURCE,
          ...utmParams,
        }),
      })

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => null)
        throw new Error(`Failed to create profile: ${errorData?.error || 'Please try again.'}`)
      }

      clearStoredUTMParams()

      if (data.session?.access_token) {
        router.replace(nextPath)
        return
      }

      setState('success')
      setSuccessMessage('Account created. Redirecting you back to log in for Dental Figure Extractor...')
      window.setTimeout(() => {
        router.push(`/login?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(formData.email)}`)
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.')
      setState('error')
    }
  }

  if (checkingSession) {
    return (
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <p className="text-[13px] text-zinc-400 dark:text-zinc-500">Checking sign-in…</p>
      </div>
    )
  }

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        This creates a free account just for Dental Figure Extractor. It does not start the EPPP
        trial or any paid plan.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5"
          >
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Optional"
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            minLength={6}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
          />
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {successMessage ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{successMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-opacity duration-150 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating account…' : 'Create free account'}
        </button>
      </form>

      <p className="mt-5 text-[13px] text-zinc-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
