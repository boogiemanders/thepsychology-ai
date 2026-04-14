import Link from 'next/link'
import { LabWorkflowDemo } from './lab-workflow-demo'
import type { LabDetailConfig, LabDetailTone } from '../_lib/lab-detail-types'

const accentDot: Record<LabDetailTone, string> = {
  blue: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  zinc: 'bg-zinc-500',
}

export function LabDetailPage({ config }: { config: LabDetailConfig }) {
  const dot = accentDot[config.accent]

  return (
    <main className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
      <div className="mb-16 animate-in fade-in duration-500">
        <Link
          href="/lab"
          className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          &larr; Lab
        </Link>
      </div>

      <header className="mb-20 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
        <div className="mb-5 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          <span>{config.categoryLabel}</span>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {config.statusLabel}
          </span>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          {config.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
          {config.description}
        </p>
      </header>

      <section className="mb-24 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out [animation-delay:100ms] [animation-fill-mode:backwards]">
        <LabWorkflowDemo accent={config.accent} steps={config.steps} />
      </section>

      <footer className="mt-20 border-t border-zinc-200 pt-6 dark:border-zinc-900">
        <p className="max-w-2xl text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          {config.note}
        </p>
        {config.privacyUrl && (
          <p className="mt-3">
            <Link
              href={config.privacyUrl}
              className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
            >
              Privacy Policy
            </Link>
          </p>
        )}
      </footer>
    </main>
  )
}
