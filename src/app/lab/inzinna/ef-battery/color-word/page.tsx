import type { Metadata } from 'next'
import Link from 'next/link'
import { ColorWordClient } from './color-word-client'

export const metadata: Metadata = {
  title: 'Color-Word Interference | EF Battery',
  description:
    'Four-condition digital Color-Word Interference test with reaction times and mouse kinematics. Research prototype.',
}

export default function ColorWordPage() {
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
          EF Battery · 04
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Color-Word Interference
        </h1>
        <p className="max-w-xl text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Four conditions. First just color, then just words, then mismatched where you pick the ink,
          then mixed where boxed items flip the rule. Measures inhibition and set-shifting. Response
          times and mouse movement are recorded per trial.
        </p>
      </header>

      <ColorWordClient />

      <footer className="mt-20 border-t border-zinc-100 pt-8 dark:border-zinc-800/50">
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Research prototype. Not a diagnostic device. Stimuli are original and not copied from any
          copyrighted test. Palette is red, blue, and yellow, chosen to stay distinguishable for
          the most common forms of color vision deficiency (red-green deuteranopia and protanopia).
          Data stays in your browser until you choose to export it.
        </p>
      </footer>
    </main>
  )
}
