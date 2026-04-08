import type { Metadata } from 'next'
import Link from 'next/link'
import { BaarsDemo } from './baars-demo'
import {
  BAARS_SELF_REPORT_CHILDHOOD_SYMPTOMS,
  BAARS_SELF_REPORT_CURRENT_SYMPTOMS,
} from './baars-config'

export const metadata: Metadata = {
  title: 'BAARS-IV Scorer | thePsychology.ai',
  description: 'Digital BAARS-IV scoring for current and childhood self-report forms, including raw scores, symptom counts, age-banded percentiles, and a clinician-ready summary.',
}

const FORM_OPTIONS = [
  {
    id: 'current',
    href: '/lab/baars',
    label: 'Current Symptoms',
    instrument: BAARS_SELF_REPORT_CURRENT_SYMPTOMS,
    summary: '27 symptom items. 3 follow-ups. Auto-scored subscales, SCT, symptom counts, and age-banded percentiles.',
  },
  {
    id: 'childhood',
    href: '/lab/baars?form=childhood',
    label: 'Childhood Symptoms',
    instrument: BAARS_SELF_REPORT_CHILDHOOD_SYMPTOMS,
    summary: '18 retrospective symptom items. 2 follow-ups. Auto-scored inattention, hyperactivity-impulsivity, total ADHD, and age-banded percentiles.',
  },
] as const

export default async function BaarsPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string | string[] | undefined }>
}) {
  const params = await searchParams
  const formParam = typeof params.form === 'string'
    ? params.form
    : Array.isArray(params.form)
      ? params.form[0]
      : undefined
  const activeFormId = formParam === 'childhood' ? 'childhood' : 'current'
  const activeForm = FORM_OPTIONS.find(option => option.id === activeFormId) ?? FORM_OPTIONS[0]
  const instrument = activeForm.instrument

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-12">
        <Link
          href="/lab"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Lab
        </Link>
      </div>

      <header className="mb-16">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
          Psychologist Tools
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
          BAARS-IV Self-Report Scorer
        </h1>
        <div className="mb-5 flex flex-wrap gap-2">
          {FORM_OPTIONS.map(option => {
            const isActive = option.id === activeForm.id
            return (
              <Link
                key={option.id}
                href={option.href}
                className={`rounded-md border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
                  isActive
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
                }`}
              >
                {option.label}
              </Link>
            )
          })}
        </div>
        <p className="text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-xl">
          {activeForm.summary} Generates a clinical summary you can drop straight into your notes.
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          {instrument.respondentType}
        </p>
      </header>

      <BaarsDemo key={instrument.id} instrument={instrument} />

      <footer className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          Demo output only. Interpret alongside clinical interview, collateral data, and official scoring materials. The BAARS-IV is published by Guilford Press.
        </p>
      </footer>
    </main>
  )
}
