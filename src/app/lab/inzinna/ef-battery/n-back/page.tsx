import type { Metadata } from 'next'
import Link from 'next/link'
import { NBackClient } from './n-back-client'

export const metadata: Metadata = {
  title: 'N-Back | EF Battery',
  description:
    'Visual shape N-Back working memory task. 1-back, 2-back, and 3-back in the browser.',
}

export default function NBackPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-12">
        <Link
          href="/lab/inzinna/ef-battery"
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          &larr; EF Battery
        </Link>
      </div>

      <header className="mb-12">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          EF Battery · 06
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          N-Back
        </h1>
        <p className="max-w-xl text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Shapes flash one at a time. Hit space when the current shape matches the one from 1, 2, or
          3 back. Tracks hits, false alarms, d&prime;, and response time at each level. Measures
          working memory updating.
        </p>
      </header>

      <NBackClient />

      <footer className="mt-20 border-t border-zinc-100 pt-8 dark:border-zinc-800/50">
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Research prototype. Not a diagnostic device. Data stays in your browser until you choose
          to export it.
        </p>
      </footer>
    </main>
  )
}
