import type { Metadata } from 'next'
import Link from 'next/link'
import { SessionZeroClient } from './session-zero-client'

export const metadata: Metadata = {
  title: 'Session Zero | thePsychology.ai',
  description:
    'A pre-therapy space to think through what you want to work on. Clinician-designed, adults only. Not a replacement for therapy.',
}

export default function SessionZeroPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      {/* Breadcrumb */}
      <div className="mb-10">
        <Link
          href="/lab"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Lab
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-3">Session Zero</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          A pre-therapy space to think through what you want to work on. Clinician-designed.
          Adults only. Not a replacement for therapy. If you&apos;re in crisis now, call or text 988.
        </p>
      </div>

      {/* AI disclosure banner (CA SB 243 baseline) */}
      <div className="mb-8 rounded-md border border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">AI disclosure.</span>{' '}
          You are talking to software, not a licensed therapist. Session Zero does not diagnose,
          prescribe, or replace clinical care.
        </p>
      </div>

      <SessionZeroClient />

      {/* Footer note */}
      <p className="mt-10 text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
        In crisis? Call or text 988 (Suicide &amp; Crisis Lifeline) or call 911.
      </p>
    </main>
  )
}
