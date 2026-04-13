import type { Metadata } from 'next'
import Link from 'next/link'
import { DSM5_DISORDER_MAP } from '../../../../content/Inzinna/SimplePractice Notes/src/data/dsm5-criteria'
import { BaarsDemo } from './baars-demo'
import type { BaarsAdhdCriteriaMeta } from './baars-demo'
import {
  BAARS_OTHER_REPORT_CHILDHOOD_SYMPTOMS,
  BAARS_OTHER_REPORT_CURRENT_SYMPTOMS,
  BAARS_SELF_REPORT_CHILDHOOD_SYMPTOMS,
  BAARS_SELF_REPORT_CURRENT_SYMPTOMS,
} from './baars-config'

export const metadata: Metadata = {
  title: 'BAARS-IV Scorer | thePsychology.ai',
  description: 'Digital BAARS-IV scoring for self-report and observer current and childhood forms, including raw scores, symptom counts, age-banded percentiles, and a clinician-ready summary.',
}

const FORM_OPTIONS = [
  {
    id: 'current-self',
    href: '/lab/baars',
    label: 'Current Symptoms',
    instrument: BAARS_SELF_REPORT_CURRENT_SYMPTOMS,
    summary: 'Adult self-report current symptoms form with 27 items, subscale scores, age-banded percentiles, and a ready-to-paste clinical summary.',
  },
  {
    id: 'childhood-self',
    href: '/lab/baars?form=childhood',
    label: 'Childhood Symptoms',
    instrument: BAARS_SELF_REPORT_CHILDHOOD_SYMPTOMS,
    summary: 'Adult retrospective self-report childhood form with 18 items, age-banded percentiles, and a clinical summary for charting.',
  },
  {
    id: 'current-observer',
    href: '/lab/baars?form=current-observer',
    label: 'Current Observer',
    instrument: BAARS_OTHER_REPORT_CURRENT_SYMPTOMS,
    summary: 'Observer / informant current symptoms form with 27 items, collateral raw scores, age-banded percentiles, and a third-person clinical summary.',
  },
  {
    id: 'childhood-observer',
    href: '/lab/baars?form=childhood-observer',
    label: 'Childhood Observer',
    instrument: BAARS_OTHER_REPORT_CHILDHOOD_SYMPTOMS,
    summary: 'Observer / informant childhood form with 18 items, collateral raw scores, age-banded percentiles, and a third-person clinical summary.',
  },
] as const

const ADHD_DSM = DSM5_DISORDER_MAP.adhd
const ADHD_INATTENTION_THRESHOLD = ADHD_DSM.requiredCounts.find(
  requirement => requirement.criterion === 'A1',
)?.required ?? 6
const ADHD_HYPERIMP_THRESHOLD = ADHD_DSM.requiredCounts.find(
  requirement => requirement.criterion === 'A2',
)?.required ?? 6
const ADHD_ADULT_ADJUSTMENT = ADHD_DSM.requiredCountAdjustments?.find(
  adjustment => adjustment.minAge === 17 && adjustment.requiredCounts.some(requirement => requirement.criterion === 'A1' || requirement.criterion === 'A2'),
)
const ADHD_ADULT_INATTENTION_THRESHOLD = ADHD_ADULT_ADJUSTMENT?.requiredCounts.find(
  requirement => requirement.criterion === 'A1',
)?.required ?? ADHD_INATTENTION_THRESHOLD
const ADHD_ADULT_HYPERIMP_THRESHOLD = ADHD_ADULT_ADJUSTMENT?.requiredCounts.find(
  requirement => requirement.criterion === 'A2',
)?.required ?? ADHD_HYPERIMP_THRESHOLD

const BAARS_ADHD_CRITERIA: BaarsAdhdCriteriaMeta = {
  disorderId: ADHD_DSM.id,
  disorderName: ADHD_DSM.name,
  durationRequirement: ADHD_DSM.durationRequirement ?? null,
  childhoodThreshold: Math.max(ADHD_INATTENTION_THRESHOLD, ADHD_HYPERIMP_THRESHOLD),
  adultThreshold: Math.max(ADHD_ADULT_INATTENTION_THRESHOLD, ADHD_ADULT_HYPERIMP_THRESHOLD),
  exclusions: ADHD_DSM.exclusions,
}

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
  const activeFormId =
    formParam === 'childhood'
      ? 'childhood-self'
      : formParam === 'current-observer'
        ? 'current-observer'
        : formParam === 'childhood-observer'
          ? 'childhood-observer'
          : 'current-self'
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
          BAARS-IV Scorer
        </h1>
        {(() => {
          const activeTimeframe = activeForm.id.startsWith('childhood') ? 'childhood' : 'current'
          const activeRater = activeForm.id.endsWith('observer') ? 'observer' : 'self'

          const hrefFor = (timeframe: 'current' | 'childhood', rater: 'self' | 'observer') => {
            if (timeframe === 'current' && rater === 'self') return '/lab/baars'
            if (timeframe === 'childhood' && rater === 'self') return '/lab/baars?form=childhood'
            if (timeframe === 'current' && rater === 'observer') return '/lab/baars?form=current-observer'
            return '/lab/baars?form=childhood-observer'
          }

          const segmentClass = (isActive: boolean, position: 'first' | 'last') =>
            `flex-1 px-4 py-1.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
              position === 'first' ? 'rounded-l-md border' : 'rounded-r-md border border-l-0'
            } ${
              isActive
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
            }`

          return (
            <div className="mb-5 grid gap-4 sm:grid-cols-2 sm:gap-5 max-w-md">
              <div>
                <p className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  Timeframe
                </p>
                <div className="flex">
                  <Link
                    href={hrefFor('current', activeRater)}
                    className={segmentClass(activeTimeframe === 'current', 'first')}
                  >
                    Current
                  </Link>
                  <Link
                    href={hrefFor('childhood', activeRater)}
                    className={segmentClass(activeTimeframe === 'childhood', 'last')}
                  >
                    Childhood
                  </Link>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  Rater
                </p>
                <div className="flex">
                  <Link
                    href={hrefFor(activeTimeframe, 'self')}
                    className={segmentClass(activeRater === 'self', 'first')}
                  >
                    Self
                  </Link>
                  <Link
                    href={hrefFor(activeTimeframe, 'observer')}
                    className={segmentClass(activeRater === 'observer', 'last')}
                  >
                    Observer
                  </Link>
                </div>
              </div>
            </div>
          )
        })()}
        <p className="text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-xl">
          {activeForm.summary}
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          {instrument.respondentType}
        </p>
      </header>

      <BaarsDemo key={instrument.id} instrument={instrument} adhdCriteria={BAARS_ADHD_CRITERIA} />

      <footer className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          Demo output only. Interpret alongside clinical interview, collateral data, and official scoring materials. The BAARS-IV is published by Guilford Press.
        </p>
      </footer>
    </main>
  )
}
