import type { Metadata } from 'next'
import Link from 'next/link'
import { BaarsDemo } from './baars-demo'
import { BAARS_SELF_REPORT_CURRENT_SYMPTOMS } from './baars-config'

export const metadata: Metadata = {
  title: 'BAARS 2E | thePsychology.ai',
  description: 'Source-backed BAARS-IV demo configuration for the lab assessment engine.',
}

export default function BaarsPage() {
  const instrument = BAARS_SELF_REPORT_CURRENT_SYMPTOMS
  const totalQuestions = instrument.sections.reduce((sum, section) => sum + section.questions.length, 0)
  const symptomQuestions = instrument.sections
    .filter(section => section.id !== 'follow_up')
    .reduce((sum, section) => sum + section.questions.length, 0)

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
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
            BAARS 2E
          </span>
          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Source Locked Demo
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-3">{instrument.title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {instrument.description}
        </p>
      </div>

      <section className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Demo Scope
        </h2>
        <div className="grid gap-3 sm:grid-cols-4 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">Respondent</p>
            <p>{instrument.respondentType}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">Sections</p>
            <p>{instrument.sections.length}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">Symptom Items</p>
            <p>{symptomQuestions}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">Total Questions</p>
            <p>{totalQuestions}</p>
          </div>
        </div>
      </section>

      <BaarsDemo instrument={instrument} />
    </main>
  )
}
