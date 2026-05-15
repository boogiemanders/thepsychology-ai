'use client'

import { useAuth } from '@/context/auth-context'
import Link from 'next/link'
import { type ReactNode } from 'react'

const ALLOWED_EMAILS = ['chanders0@yahoo.com']

export default function AccessGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <p className="text-[12px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        Checking access…
      </p>
    )
  }

  if (!user) {
    return (
      <div className="rounded border border-zinc-200 dark:border-zinc-800 p-6 text-center">
        <p className="mb-3 text-[14px] text-zinc-700 dark:text-zinc-300">
          Sign in to access the WAIS-5 record form.
        </p>
        <Link
          href="/login?next=/lab/wais5"
          className="inline-block rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-[12px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Sign in
        </Link>
      </div>
    )
  }

  if (!ALLOWED_EMAILS.includes((user.email || '').toLowerCase())) {
    return (
      <div className="rounded border border-zinc-200 dark:border-zinc-800 p-6 text-center">
        <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#E7437D]">
          Access restricted
        </p>
        <p className="text-[14px] text-zinc-700 dark:text-zinc-300">
          This page is private. Signed in as {user.email}.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
