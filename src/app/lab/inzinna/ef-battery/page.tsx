import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'EF Battery | thePsychology.ai',
  description:
    'Executive function tests in the browser. Well-validated tests with mouse-movement tracking. In development.',
}

interface BatteryTest {
  id: string
  index: string
  title: string
  href: string | null
  status: 'live' | 'dev' | 'soon'
  summary: string
  construct: string
}

const BATTERY: BatteryTest[] = [
  {
    id: 'tmt',
    index: '01',
    title: 'Trail Making (A + B)',
    href: '/lab/inzinna/ef-battery/tmt',
    status: 'dev',
    summary:
      'Connect numbered circles in order as fast as you can. Trial A is just numbers. Trial B switches between numbers and letters.',
    construct: 'Processing speed · Set shifting',
  },
  {
    id: 'digit-span',
    index: '02',
    title: 'Digit Span',
    href: '/lab/inzinna/ef-battery/digit-span',
    status: 'dev',
    summary:
      'Listen to a string of numbers and repeat them back. First forward, then backward. Digital versions land within 0.1 SD of paper.',
    construct: 'Working memory',
  },
  {
    id: 'verbal-fluency',
    index: '03',
    title: 'Verbal Fluency',
    href: '/lab/inzinna/ef-battery/verbal-fluency',
    status: 'dev',
    summary:
      'Say as many words as you can in 60 seconds. One round by starting letter, one by category. Voice is recorded and transcribed. Of every EF test, this one matches paper best.',
    construct: 'Word retrieval · Lexical access',
  },
  {
    id: 'stroop',
    index: '04',
    title: 'Color-Word Interference',
    href: '/lab/inzinna/ef-battery/color-word',
    status: 'dev',
    summary:
      'Name the ink color of color words when word and ink disagree. Four conditions: color alone, word alone, mismatched, and mixed with rule switches.',
    construct: 'Inhibition · Cognitive control',
  },
  {
    id: 'tower',
    index: '05',
    title: 'Tower',
    href: '/lab/inzinna/ef-battery/tower',
    status: 'dev',
    summary:
      'Move stacked discs from one peg to another without putting a big disc on a small one. Puzzles get harder each round. Scores time to first move, extra moves past the shortest path, rule breaks, and pauses mid-drag.',
    construct: 'Planning · Working memory · Inhibition',
  },
  {
    id: 'n-back',
    index: '06',
    title: 'N-Back',
    href: '/lab/inzinna/ef-battery/n-back',
    status: 'dev',
    summary:
      'Shapes flash on the screen one at a time. Hit a key when the current one matches the shape from 1, 2, or 3 back. Tracks hits, false alarms, d-prime, and response time at each level.',
    construct: 'Working memory updating',
  },
]

const STATUS_LABEL: Record<BatteryTest['status'], string> = {
  live: 'Live',
  dev: 'In development',
  soon: 'Planned',
}

const STATUS_DOT: Record<BatteryTest['status'], string> = {
  live: 'bg-emerald-600 dark:bg-emerald-500',
  dev: 'bg-zinc-400 dark:bg-zinc-500',
  soon: 'bg-zinc-200 dark:bg-zinc-700',
}

export default function EfBatteryPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-12">
        <Link
          href="/lab"
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          &larr; Lab
        </Link>
      </div>

      <header className="mb-16">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
          Psychologist Tools · EF Battery
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Executive Function Battery
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Executive function tests in the browser. We only picked tests that match paper versions
          closely in the research. Each test also tracks how the mouse moves. Speed, pauses,
          wobbles. Research tool, not a diagnosis.
        </p>
      </header>

      <section className="mb-16">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
            Tests
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
            {BATTERY.length} planned
          </p>
        </div>

        <div className="border-y border-zinc-200 dark:border-zinc-800/70">
          {BATTERY.map((test) => {
            const content = (
              <div className="flex items-start gap-4 px-1 py-5">
                <span className="pt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-300 dark:text-zinc-600">
                  {test.index}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
                      {test.title}
                    </h3>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('inline-block h-1.5 w-1.5 rounded-full', STATUS_DOT[test.status])} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                        {STATUS_LABEL[test.status]}
                      </span>
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                    {test.construct}
                  </p>
                  <p className="mt-2 text-[13.5px] leading-[1.55] text-zinc-600 dark:text-zinc-300">
                    {test.summary}
                  </p>
                </div>
                {test.href && (
                  <span className="pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                    Open &rarr;
                  </span>
                )}
              </div>
            )

            return test.href ? (
              <Link
                key={test.id}
                href={test.href}
                className="block border-b border-dashed border-zinc-100 transition-colors hover:bg-zinc-50/40 last:border-b-0 dark:border-zinc-900 dark:hover:bg-zinc-900/30"
              >
                {content}
              </Link>
            ) : (
              <div
                key={test.id}
                className="block border-b border-dashed border-zinc-100 opacity-70 last:border-b-0 dark:border-zinc-900"
              >
                {content}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
          Why this battery
        </h2>
        <div className="space-y-3 text-[13.5px] leading-[1.55] text-zinc-600 dark:text-zinc-300">
          <p>
            Current EF tests have real problems. CPT-3 gets the ADHD call right only about 52% of
            the time. TOVA&rsquo;s adult norms come from 250 mostly-White college students in 1993.
            Q-interactive crashes mid-test.
          </p>
          <p>
            This battery picks up where the research leaves off. Every test we included matches
            paper versions closely. Then we add what paper can&rsquo;t catch: how the mouse moves.
            Speed, hesitation, time to fix a wrong click, total path length.
          </p>
          <p>
            No diagnostic claims. Phase 0 asks two things. Do the tests hold up in a real practice?
            And does the mouse-movement data give clinicians anything they can actually use?
          </p>
        </div>
      </section>

      <footer className="mt-16 border-t border-zinc-100 pt-8 dark:border-zinc-800/50">
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Research prototype. Not a diagnostic device. All test items are original. Nothing is
          copied from any copyrighted test. Data stays in your browser until you choose to export
          it.
        </p>
      </footer>
    </main>
  )
}
