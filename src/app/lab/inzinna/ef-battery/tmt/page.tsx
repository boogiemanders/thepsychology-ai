import type { Metadata } from 'next'
import Link from 'next/link'
import { TmtClient } from './tmt-client'

export const metadata: Metadata = {
  title: 'Trail Making (EF Battery) | thePsychology.ai',
  description:
    'Web-based Trail Making Test with pointer-level kinematic capture. Research prototype for an executive-functioning assessment battery.',
}

export default function TmtPage() {
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

      <header className="mb-16">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          EF Battery · Test 01
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Trail Making (A + B)
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          A digital Trail Making Test prototype. Trial A measures processing speed; Trial B adds a
          set-switching demand. Pointer movement is sampled at ~60 Hz alongside click accuracy and
          reaction times.
        </p>
      </header>

      <TmtClient />

      <footer className="mt-24 border-t border-zinc-100 pt-8 dark:border-zinc-800/50">
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Research prototype. Not a diagnostic device. Stimuli and layouts are original and not
          copied from any copyrighted test. Participant kinematics are stored only in browser
          memory and included in the downloadable JSON for offline analysis; no data leaves this
          device unless you export it.
        </p>
      </footer>
    </main>
  )
}
