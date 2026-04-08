import type { Metadata } from 'next'
import Link from 'next/link'
import { DentalExtractorForm } from './form'

export const metadata: Metadata = {
  title: 'Dental Figure Extractor | thePsychology.ai',
  description:
    'Upload a dental textbook PDF and get back a PowerPoint with every figure, one per slide.',
}

export default function DentalPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:py-24">
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
        <h1 className="text-2xl font-semibold tracking-tight mb-3">
          Dental Figure Extractor
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          The best figures in dental school are trapped inside 400-page PDFs.
          Upload your textbook chapter. Get back a PowerPoint with every figure
          on its own slide, captions included. Move them into your study decks.
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
            <span>Upload a PDF chapter (up to 50MB)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">02</span>
            <span>We match every figure caption to its image on the page</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">03</span>
            <span>You get a PowerPoint emailed to you — one slide per figure, ready to drag into your own decks</span>
          </li>
        </ol>
      </div>

      {/* Form */}
      <DentalExtractorForm />

      {/* Footer note */}
      <p className="mt-8 text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
        Free. Works best on textbooks that use &quot;Fig. X.Y&quot; caption format.
      </p>
    </main>
  )
}
