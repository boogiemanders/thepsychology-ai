import type { Metadata } from 'next'
import Link from 'next/link'
import { LicenseWatchForm } from './form'

export const metadata: Metadata = {
  title: 'NYSED Psych License Check | thePsychology.ai',
  description: 'Get notified the moment your psychology license appears in the NYSED system.',
}

export default function LicenseWatchPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:py-24">
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
        <h1 className="text-2xl font-semibold tracking-tight mb-3">
          NYSED Psych License Check
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Passed the EPPP and finished your hours? Stop refreshing the NYSED site.
          We&apos;ll email you the moment your license is posted.
        </p>
      </div>

      {/* How it works */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">How it works</h2>
        <ol className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">01</span>
            <span>Enter your name exactly as it would appear on your license</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">02</span>
            <span>We check the NYSED Office of Professions database daily</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">03</span>
            <span>The instant your name appears, you get an email with your license details</span>
          </li>
        </ol>
      </div>

      {/* Form */}
      <LicenseWatchForm />

      {/* Footer note */}
      <p className="mt-8 text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
        Free service. We only use your email for license notifications.
      </p>
    </main>
  )
}
