import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — ZocDoc to SimplePractice | thePsychology.ai',
  description: 'Privacy policy for the ZocDoc to SimplePractice Chrome extension.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
      <div className="mb-16">
        <Link
          href="/lab/zocdoc-simplepractice"
          className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          &larr; ZocDoc to SimplePractice
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
          Last updated April 29, 2026
        </p>
      </header>

      <div className="max-w-2xl space-y-14 text-[15px] leading-[1.75] text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            What we access
          </h2>
          <p>
            When you activate the extension on a ZocDoc tab, it reads the
            client intake fields on that page. Name, contact info, insurance
            details, intake questionnaire responses. This content may include
            Protected Health Information (PHI).
          </p>
          <p className="mt-3">
            On SimplePractice, the extension fills new client records with
            data you captured from ZocDoc.
          </p>
          <p className="mt-3">
            On Gmail, the extension only reads the compose window so it can
            pre-fill verification of benefits (VOB) emails for you. It does
            not read your inbox, sent mail, or any other Gmail content.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            Where your data lives
          </h2>
          <div className="space-y-4">
            <p>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">On your device.</span>{' '}
              Everything the extension captures stays in your browser. Chrome&rsquo;s
              session storage and local storage. That&rsquo;s it. No server,
              no cloud, no database on our end.
            </p>
            <p>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">No third-party APIs.</span>{' '}
              The extension does not send your data to OpenAI, analytics
              providers, or any external service. It only talks to the three
              sites you load it on: ZocDoc, SimplePractice, Gmail.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            Tracking and analytics
          </h2>
          <p>
            The extension has no analytics, no ad trackers, no telemetry.
            Nothing phones home.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            How long data sticks around
          </h2>
          <p>
            Captured intakes live in Chrome session and local storage until
            you transfer them or delete them yourself.
          </p>
          <p className="mt-3">
            Settings stay in Chrome local storage until you remove the
            extension or clear them manually.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
            Third-party services
          </h2>
          <p>
            None. The extension does not transmit your data to any third
            party.
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
          This policy covers the ZocDoc to SimplePractice Chrome extension,
          built for internal use by Dr. Inzinna Psychological Services PLLC.
        </p>
      </footer>
    </main>
  )
}
