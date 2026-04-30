import type { Metadata } from 'next'
import Link from 'next/link'
import { DigitSpanClient } from './digit-span-client'

export const metadata: Metadata = {
  title: 'Digit Span | EF Battery',
  description:
    'Forward and backward auditory digit span. Working memory test in the browser.',
}

export default function DigitSpanPage() {
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
          EF Battery · 02
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Digit Span
        </h1>
        <p className="max-w-xl text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Listen to a sequence of digits and type them back. First forward, then backward. Sequences
          get longer until you miss two in a row. Measures working memory.
        </p>
      </header>

      <DigitSpanClient />

      <footer className="mt-20 border-t border-zinc-100 pt-8 dark:border-zinc-800/50">
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Research prototype. Not a diagnostic device. Data stays in your browser until you choose
          to export it. Browser speech synthesis is used to play digits, so voice and pacing depend
          on your device.
        </p>
      </footer>
    </main>
  )
}
