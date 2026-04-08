import Link from 'next/link'

interface AssessmentToolPlaceholderProps {
  title: string
  description: string
  versionLabel: string
  audienceLabel: string
  buildItems: string[]
  differentiators: string[]
  note: string
}

export function AssessmentToolPlaceholder({
  title,
  description,
  versionLabel,
  audienceLabel,
  buildItems,
  differentiators,
  note,
}: AssessmentToolPlaceholderProps) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <div className="mb-10">
        <Link
          href="/lab"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Lab
        </Link>
      </div>

      <div className="mb-10">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Psychologist Tools
          </span>
          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Building
          </span>
          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            {versionLabel}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-3">{title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          What We&apos;re Building First
        </h2>
        <ol className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
          {buildItems.map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Why This Tool
        </h2>
        <div className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            Intended workflow: {audienceLabel}
          </p>
          {differentiators.map(item => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
        {note}
      </p>
    </main>
  )
}
