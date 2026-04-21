import type { Metadata } from 'next'
import Link from 'next/link'
import { ClinicianClient } from './clinician-client'

export const metadata: Metadata = {
  title: 'Plan Match — My Networks | thePsychology.ai',
  description: 'Set which insurance plans and states you accept.',
}

export default function PlanMatchMePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      {/* Breadcrumb */}
      <div className="mb-10">
        <Link
          href="/lab/plan-match"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Plan Match
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-3">My Networks</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Toggle the insurance plans you&apos;re in-network with and the states you&apos;re licensed to see
          telehealth patients in. You&apos;ll appear in Plan Match search for patients with those plans.
        </p>
      </div>

      <ClinicianClient />

      {/* Footer note */}
      <p className="mt-10 text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
        This is a quick shortcut. For the full onboarding flow (credentials, bio, specializations),
        use{' '}
        <Link
          href="/provider/onboard"
          className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          /provider/onboard
        </Link>
        .
      </p>
    </main>
  )
}
