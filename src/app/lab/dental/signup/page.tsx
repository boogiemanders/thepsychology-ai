import type { Metadata } from 'next'
import Link from 'next/link'
import { DentalSignupForm } from './form'

export const metadata: Metadata = {
  title: 'Create Dental Account | thePsychology.ai',
  description:
    'Create a free account for Dental Figure Extractor and return directly to your upload flow.',
}

export default function DentalSignupPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <div className="mb-10">
        <Link
          href="/lab/dental"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Dental Figure Extractor
        </Link>
      </div>

      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-3">
          Create your dental account
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Make a standalone account for Dental Figure Extractor, then go straight back to your PDF
          upload flow.
        </p>
      </div>

      <DentalSignupForm />
    </main>
  )
}
