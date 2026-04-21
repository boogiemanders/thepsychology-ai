import type { Metadata } from 'next'
import Link from 'next/link'
import { PlanMatchClient } from './plan-match-client'

export const metadata: Metadata = {
  title: 'Plan Match | thePsychology.ai',
  description:
    'Pick your insurance and state. See the psychologists on thePsychology.ai who take your plan.',
}

export default function PlanMatchPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight mb-3">Plan Match</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Pick your insurance and state. We&apos;ll show the psychologists on thePsychology.ai who take your plan.
          No calling three offices to find out who&apos;s in-network.
        </p>
      </div>

      {/* How it works */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          How it works
        </h2>
        <ol className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">01</span>
            <span>Pick the insurance plan you have</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">02</span>
            <span>Pick the state you live in (California or New York)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">03</span>
            <span>See psychologists who self-report that network and work with your state</span>
          </li>
        </ol>
      </div>

      <PlanMatchClient />

      {/* Preview: what's coming */}
      <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-6">
          What we&apos;re building
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
          Today this is a simple in-network lookup. Next, real-time eligibility so you see your exact copay before you book,
          plus fit-based matching by what you&apos;re working on, modality, and style — not just who takes your plan.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
              Next · Real-time copay
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              Aetna · In-network · $25 copay
            </p>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Verified with your plan the moment you pick a psychologist. No more &quot;we think it&apos;s covered.&quot;
            </p>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
              Next · Fit match
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              94% match · CBT · Trauma
            </p>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Ranked by clinical fit — what you&apos;re working on, modality, style, cultural fit. Not pay-to-rank.
            </p>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
              Next · Book instantly
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              Tue, 7:30 PM · Telehealth
            </p>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Pick a real slot from their calendar. Video link generated. Reminders included.
            </p>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
              Next · Fair pricing
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              Free to find care · $8 platform fee to psychologists
            </p>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Patients pay the psychologist&apos;s normal rate. We take $8 per session — not 30% like Headway.
            </p>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-10 text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
        Psychologists self-report the plans they accept. We&apos;ll verify directly with your plan once you choose someone.
      </p>
    </main>
  )
}
