import type { Metadata } from 'next'
import Link from 'next/link'
import Wais5Form from './wais5-form'
import AccessGate from './access-gate'
import NavbarAutoHide from './navbar-autohide'

export const metadata: Metadata = {
  title: 'WAIS-5 Digital Record Form | thePsychology.ai',
  description: 'Digital WAIS-5 record form for clinicians. All 20 subtests, auto-totals, age calculation, JSON export/import, and print-friendly layout. Scaled scores entered manually from the WAIS-5 Admin & Scoring Manual.',
}

export default function Wais5Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <div className="mb-8 print:hidden">
        <Link
          href="/lab"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Lab
        </Link>
      </div>

      <header className="mb-10 print:hidden">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
          Psychologist Tools
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
          WAIS-5 Digital Record Form
        </h1>
        <p className="text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Single-page digital record form mirroring the paper WAIS-5 layout. All 20 subtests, running raw-score totals, age calculation, auto-save to your browser, JSON export and import, and a clean print layout. Scaled scores and index conversions are entered manually from the WAIS-5 Admin &amp; Scoring Manual.
        </p>
      </header>

      <NavbarAutoHide />
      <AccessGate>
        <Wais5Form />
      </AccessGate>

      <footer className="mt-12 border-t border-zinc-100 pt-6 dark:border-zinc-800/50 print:hidden">
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Demo only. Data is stored only in your browser&apos;s local storage. Interpret alongside the official WAIS-5 Admin &amp; Scoring Manual. WAIS-5 is published by Pearson.
        </p>
      </footer>
    </main>
  )
}
