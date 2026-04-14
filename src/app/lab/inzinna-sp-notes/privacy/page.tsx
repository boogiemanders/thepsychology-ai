import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Inzinna SP Notes | thePsychology.ai',
  description: 'Privacy policy for the Inzinna SP Notes Chrome extension.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
      <div className="mb-16">
        <Link
          href="/lab/inzinna-sp-notes"
          className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          &larr; Inzinna SP Notes
        </Link>
      </div>

      <header className="mb-16">
        <div className="mb-5 text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Legal
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
          Last updated April 14, 2026
        </p>
      </header>

      <div className="max-w-2xl space-y-14 text-[15px] leading-[1.75] text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            What we access
          </h2>
          <p>
            When you activate the extension on a SimplePractice tab, it reads
            what&rsquo;s on that page. Intake forms, treatment plans, progress
            notes, clinical documentation. This content may include Protected
            Health Information (PHI).
          </p>
          <p className="mt-3">
            The extension only reads pages you explicitly tell it to. It does
            not run in the background or scan tabs on its own.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            Where your data lives
          </h2>
          <div className="space-y-4">
            <p>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">On your device, by default.</span>{' '}
              Everything the extension captures stays in your browser. Chrome&rsquo;s
              session storage and local storage. That&rsquo;s it. No server, no
              cloud, no database on our end.
            </p>
            <p>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">OpenAI is optional.</span>{' '}
              If you turn on the OpenAI provider in settings, the extension
              strips out names, dates, and identifiers before anything leaves
              your browser. Only de-identified clinical text reaches OpenAI.
              You have to opt in. It&rsquo;s off by default.
            </p>
            <p>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Ollama stays fully local.</span>{' '}
              If you use Ollama instead, everything runs on your machine.
              Zero data goes anywhere.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            Tracking and analytics
          </h2>
          <p>
            Right now, the extension has no analytics, no ad trackers, no
            telemetry. Nothing phones home.
          </p>
          <p className="mt-3">
            We may add anonymous usage counts in a future update (things like
            &ldquo;how often is SOAP generation used&rdquo;). If we do, it will
            never include PHI or anything that could identify a patient.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            How long data sticks around
          </h2>
          <p>
            Session data (intakes, SOAP drafts, transcripts) lives in Chrome
            session storage. Close your browser, it&rsquo;s gone.
          </p>
          <p className="mt-3">
            Settings and uploaded reference files live in Chrome local storage.
            They stay until you delete them yourself.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            Third-party services
          </h2>
          <p>
            OpenAI is the only external service the extension talks to. And
            only if you set it up. No other third party gets your data. Period.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            Questions?
          </h2>
          <p>
            Reach Dr. Inzinna Psychological Services PLLC at{' '}
            <a
              href="mailto:dranders@drinzinna.com"
              className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 transition-colors hover:decoration-zinc-500 dark:text-zinc-200 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
            >
              dranders@drinzinna.com
            </a>
          </p>
        </section>
      </div>

      <footer className="mt-20 border-t border-zinc-200 pt-6 dark:border-zinc-900">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          This policy covers the Inzinna SP Notes Chrome extension, built for
          internal use by Dr. Inzinna Psychological Services PLLC.
        </p>
      </footer>
    </main>
  )
}
