import Link from 'next/link'
import { LabWorkflowDemo } from './lab-workflow-demo'
import type { LabDetailConfig, LabDetailTone } from '../_lib/lab-detail-types'

const accentClasses: Record<
  LabDetailTone,
  {
    badge: string
    heroPanel: string
    accentLine: string
  }
> = {
  blue: {
    badge:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300',
    heroPanel:
      'border-sky-200/70 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/15',
    accentLine: 'bg-sky-500/60',
  },
  emerald: {
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
    heroPanel:
      'border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/15',
    accentLine: 'bg-emerald-500/60',
  },
  amber: {
    badge:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
    heroPanel:
      'border-amber-200/70 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/15',
    accentLine: 'bg-amber-500/60',
  },
  rose: {
    badge:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300',
    heroPanel:
      'border-rose-200/70 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/15',
    accentLine: 'bg-rose-500/60',
  },
  zinc: {
    badge:
      'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
    heroPanel:
      'border-zinc-200/70 bg-zinc-50/80 dark:border-zinc-800/60 dark:bg-zinc-900/60',
    accentLine: 'bg-zinc-500/60',
  },
}

export function LabDetailPage({ config }: { config: LabDetailConfig }) {
  const accent = accentClasses[config.accent]

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <div className="mb-10">
        <Link
          href="/lab"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          &larr; Lab
        </Link>
      </div>

      <header className="mb-16 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {config.categoryLabel}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] ${accent.badge}`}
            >
              {config.statusLabel}
            </span>
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
            {config.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            {config.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {config.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={`rounded-3xl border p-6 ${accent.heroPanel}`}>
          <div className={`mb-5 h-1 w-16 rounded-full ${accent.accentLine}`} />
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                Intended User
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {config.audience}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                Why It Exists
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {config.whyItExists}
              </p>
            </div>
            <div className="space-y-3">
              {config.heroFacts.map(fact => (
                <div
                  key={`${fact.label}-${fact.value}`}
                  className="rounded-2xl border border-white/50 bg-white/70 px-4 py-3 dark:border-zinc-900/60 dark:bg-zinc-950/60"
                >
                  <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                    {fact.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {config.workflowHeading}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {config.workflowIntro}
          </p>
        </div>
        <LabWorkflowDemo accent={config.accent} steps={config.steps} />
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/70">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {config.proofHeading}
          </h2>
          <ul className="mt-5 space-y-3">
            {config.proofBullets.map(item => (
              <li
                key={item}
                className="flex gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/70">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {config.architectureHeading}
          </h2>
          <ul className="mt-5 space-y-3">
            {config.architectureBullets.map(item => (
              <li
                key={item}
                className="flex gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/70">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {config.researchHeading}
          </h2>
          <div className="mt-5 space-y-4">
            {config.researchCards.map(card => (
              <article
                key={card.title}
                className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {config.statusHeading}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {config.statusColumns.map(column => (
            <div
              key={column.title}
              className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/70"
            >
              <h3 className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                {column.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {column.items.map(item => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
                  >
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <p className="max-w-3xl text-[12px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          {config.note}
        </p>
      </footer>
    </main>
  )
}
