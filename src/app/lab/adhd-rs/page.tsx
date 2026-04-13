import type { Metadata } from 'next'
import Link from 'next/link'
import { DSM5_DISORDER_MAP } from '../../../../content/Inzinna/SimplePractice Notes/src/data/dsm5-criteria'
import { AdhdRsDemo, type AdhdRsAdhdCriteriaMeta } from './adhd-rs-demo'
import { ADHD_RS_HOME_PARENT } from './adhd-rs-config'

export const metadata: Metadata = {
  title: 'ADHD-RS-5 Scorer | thePsychology.ai',
  description: 'Digital ADHD-RS-5 home parent scoring with raw scores, symptom counts, home symptom norms, home impairment norms, and a note-ready summary.',
}

const FORM_OPTIONS = [
  {
    id: 'home_parent',
    label: 'Home Parent',
    status: 'Live',
    active: true,
  },
  {
    id: 'school',
    label: 'School',
    status: 'Planned',
    active: false,
  },
  {
    id: 'compare',
    label: 'Agreement View',
    status: 'Planned',
    active: false,
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
  adjustment => adjustment.minAge === 17 && adjustment.requiredCounts.some(
    requirement => requirement.criterion === 'A1' || requirement.criterion === 'A2',
  ),
)
const ADHD_ADULT_INATTENTION_THRESHOLD = ADHD_ADULT_ADJUSTMENT?.requiredCounts.find(
  requirement => requirement.criterion === 'A1',
)?.required ?? ADHD_INATTENTION_THRESHOLD
const ADHD_ADULT_HYPERIMP_THRESHOLD = ADHD_ADULT_ADJUSTMENT?.requiredCounts.find(
  requirement => requirement.criterion === 'A2',
)?.required ?? ADHD_HYPERIMP_THRESHOLD

const ADHD_RS_ADHD_CRITERIA: AdhdRsAdhdCriteriaMeta = {
  childThreshold: Math.max(ADHD_INATTENTION_THRESHOLD, ADHD_HYPERIMP_THRESHOLD),
  adultThreshold: Math.max(ADHD_ADULT_INATTENTION_THRESHOLD, ADHD_ADULT_HYPERIMP_THRESHOLD),
  disorderName: ADHD_DSM.name,
  durationRequirement: ADHD_DSM.durationRequirement ?? null,
}

export default function AdhdRsPage() {
  const instrument = ADHD_RS_HOME_PARENT

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
          ADHD-RS-5 Parent Scorer
        </h1>
        <div className="mb-5 flex flex-wrap gap-2">
          {FORM_OPTIONS.map(option => {
            const isActive = option.active
            return (
              <span
                key={option.id}
                className={`rounded-md border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
                  isActive
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400'
                }`}
              >
                {option.label}
              </span>
            )
          })}
        </div>
        <p className="text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-xl">
          Fill in 18 symptom items and 8 impairment items, get subscale scores with sex-specific
          age-banded norms, and copy a ready-to-paste clinical summary straight into your notes.
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          {instrument.respondentType}
        </p>
      </header>

      <AdhdRsDemo instrument={instrument} adhdCriteria={ADHD_RS_ADHD_CRITERIA} />

      <footer className="mt-16 border-t border-zinc-100 pt-8 dark:border-zinc-800/50">
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Demo output only. Interpret alongside clinical interview, collateral data, and official
          scoring materials. The ADHD-RS-5 is published by Guilford Press.
        </p>
      </footer>
    </main>
  )
}
