import type { Metadata } from 'next'
import Link from 'next/link'
import { PlanMatchClient } from './plan-match-client'
import { IntakePreview } from './intake-preview'

export const metadata: Metadata = {
  title: 'Plan Match | thePsychology.ai',
  description:
    'Pick your insurance and state. See the psychologists on thePsychology.ai who take your plan.',
}

export default function PlanMatchPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
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
        <h1 className="text-2xl font-semibold tracking-tight mb-3">Plan Match</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Only about 1 in 5 mental health providers is in any insurance network. Finding one who takes your plan
          shouldn&apos;t feel like a part-time job. Pick your insurance and state. We&apos;ll show the psychologists
          on thePsychology.ai who take it.
        </p>
      </div>

      {/* Two sides of the match: client + therapist, fully inline */}
      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12 lg:divide-x lg:divide-zinc-200 lg:dark:divide-zinc-800">
        {/* Left: patient intake */}
        <div className="lg:pr-10">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-3">
            For patients
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
            What we ask you
          </h2>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
            Start with plan and state. Then seven short questions. About five minutes.
          </p>

          <div className="mb-10">
            <PlanMatchClient />
          </div>

          <ol className="space-y-5 mb-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
            {[
              {
                q: 'In your own words, what brings you here?',
                note: 'Free text. Whatever feels true.',
              },
              {
                q: 'What are you seeking help with?',
                note: 'Anxiety, depression, trauma, ADHD, relationships, grief, and more. Plus severity 1 to 10.',
              },
              {
                q: 'Have you been in therapy before?',
                note: 'What worked. What didn’t. So we don’t send you back to it.',
              },
              {
                q: 'What style of therapy fits you?',
                note: 'Directive vs exploratory. Past vs present focused. Insight vs skills. Warm vs formal.',
              },
              {
                q: 'Any identity or cultural fit that matters?',
                note: 'Language, LGBTQ+ affirming, faith, cultural background.',
              },
              {
                q: 'Gender and age preference for your psychologist?',
                note: 'No preference is a valid answer.',
              },
              {
                q: 'When are you available?',
                note: 'Telehealth or in-person. Times of day that work.',
              },
            ].map((item, i) => (
              <li key={item.q} className="flex gap-4">
                <span className="font-mono text-[10px] text-zinc-300 dark:text-zinc-600 mt-1 shrink-0 w-5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug mb-1">
                    {item.q}
                  </p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {item.note}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href="/find-therapist/intake"
            className="inline-block w-full text-center rounded-md bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:opacity-80 transition-opacity cursor-pointer"
          >
            Start the full intake &rarr;
          </Link>
        </div>

        {/* Right: therapist onboarding */}
        <div className="lg:pl-10">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-3">
            For psychologists
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
            What we ask psychologists
          </h2>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
            $8 flat per session. No percentage cut. The profile is what the matcher ranks on.
          </p>

          <ol className="space-y-5 mb-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
            {[
              {
                q: 'Credentials and license',
                note: 'License type, number, state. NPI. Multi-state licensure.',
              },
              {
                q: 'What you treat',
                note: 'Modalities (CBT, DBT, EMDR, IFS, and so on). Conditions. Populations.',
              },
              {
                q: 'Your therapeutic style',
                note: 'Directive vs exploratory. Past vs present. Insight vs skills. Warm vs formal. Four sliders, 1 to 10.',
              },
              {
                q: 'Cultural competencies',
                note: 'Languages spoken. LGBTQ+ affirming. Faith-integrated. Cultural focus.',
              },
              {
                q: 'Practice details',
                note: 'Insurance networks. Self-pay rate. Sliding scale. Telehealth states.',
              },
              {
                q: 'Bio and approach',
                note: 'In your own words. How you work. Who you help.',
              },
              {
                q: 'Review and submit',
                note: 'Double-check, send for verification, go live.',
              },
            ].map((item, i) => (
              <li key={item.q} className="flex gap-4">
                <span className="font-mono text-[10px] text-zinc-300 dark:text-zinc-600 mt-1 shrink-0 w-5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug mb-1">
                    {item.q}
                  </p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {item.note}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href="/provider/onboard"
            className="inline-block w-full text-center rounded-md border border-zinc-900 dark:border-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Join as a psychologist &rarr;
          </Link>
        </div>
      </div>

      {/* Matching algorithm */}
      <div className="mt-20 border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-3">
          The matching algorithm
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
          How we turn two forms into one ranking
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-10 max-w-2xl">
          First we cut out anyone not licensed in your state. Then we score every remaining psychologist
          across five dimensions. Highest total wins. Insurance is a filter you control, not a ranking factor.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: 'Specialization',
              weight: 35,
              method: 'Overlap between what you want help with and what they treat.',
            },
            {
              label: 'Modality',
              weight: 20,
              method: 'Overlap between your preferred approaches (CBT, EMDR, etc) and theirs.',
            },
            {
              label: 'Style',
              weight: 20,
              method: 'Distance between your 4 style sliders and theirs. Closer is better.',
            },
            {
              label: 'Cultural fit',
              weight: 13,
              method: 'Language match. LGBTQ+ affirming. Faith fit if you want it.',
            },
            {
              label: 'Practical',
              weight: 12,
              method: 'Telehealth preference matches what they offer.',
            },
          ].map((dim) => (
            <div
              key={dim.label}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  {dim.label}
                </p>
                <p className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{dim.weight}%</p>
              </div>
              <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-3">
                <div
                  className="h-full bg-zinc-900 dark:bg-zinc-100"
                  style={{ width: `${dim.weight * 2.8}%` }}
                />
              </div>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {dim.method}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-md border border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-900/40">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-2">
            Insurance is a filter, not a rank
          </p>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
            The top clinical match shows up first regardless of who pays. You can flip a toggle to hide
            out-of-network psychologists if cost is the deciding factor. We don&apos;t bury the best match
            behind insurance politics.
          </p>
        </div>

        <details className="mt-8 group">
          <summary className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            Show the interactive preview (legacy)
          </summary>
          <div className="mt-6">
            <IntakePreview />
          </div>
        </details>
      </div>

      {/* Why matching matters: the science */}
      <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Why matching matters
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
          Matching isn&apos;t a luxury. A 2021 randomized trial in JAMA Psychiatry showed patients matched to
          therapists with proven strengths in their problem area got better faster, by a large margin
          (effect size d = 0.75, which is huge in psychotherapy research).
        </p>
        <ul className="space-y-2.5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">&rarr;</span>
            <span>Bigger gains for people with more severe symptoms and complex presentations.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">&rarr;</span>
            <span>Bigger gains for clients of color, a group most commercial platforms quietly fail.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">&rarr;</span>
            <span>Plan + state is step one. Real fit is what moves outcomes.</span>
          </li>
        </ul>
      </div>

      {/* What's different */}
      <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-6">
          What&apos;s different here
        </h2>
        <ul className="space-y-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <li>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Real matching, not keyword filters.</span>{' '}
            We rank by clinical fit. Psychology Today is a search bar with a subscription fee.
          </li>
          <li>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Verified insurance, not estimates.</span>{' '}
            Zocdoc, Headway, and Grow routinely tell patients the wrong copay. We verify with your plan before you book.
          </li>
          <li>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">No rate-squeeze on psychologists.</span>{' '}
            $8 flat per session. Headway and Alma take a percentage cut and keep cutting rates every year.
          </li>
          <li>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">We don&apos;t sell your intake data.</span>{' '}
            BetterHelp was fined $7.8M by the FTC for sharing therapy data with advertisers. Cerebral got fined $7M.
            That&apos;s not our model. Ever.
          </li>
        </ul>
      </div>

      {/* Preview: what's coming */}
      <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-6">
          What we&apos;re building
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
          Today this is a simple in-network lookup. Next, real-time eligibility so you see your exact copay before you book,
          plus fit-based matching across the 7 dimensions above, not just who takes your plan.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
              Next · Real-time copay
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              Aetna · In-network · $25 copay
            </p>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Verified with your plan the moment you pick a psychologist. No more &quot;we think it&apos;s covered.&quot;
            </p>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
              Next · Fit match
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              94% match · CBT · Trauma
            </p>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Ranked by clinical fit: what you&apos;re working on, modality, style, cultural fit. Not pay-to-rank.
            </p>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
              Next · Book instantly
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              Tue, 7:30 PM · Telehealth
            </p>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Pick a real slot from their calendar. Video link generated. Reminders included.
            </p>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
              Next · Fair pricing
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              Free to find care · $8 platform fee to psychologists
            </p>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Patients pay the psychologist&apos;s normal rate. We take $8 per session, not 30% like Headway.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-6">
          Questions
        </h2>
        <dl className="space-y-6">
          <div>
            <dt className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              Isn&apos;t this just Zocdoc for therapy?
            </dt>
            <dd className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              No. Zocdoc sorts by next available slot and charges therapists $35 to $110 per booking, no-shows
              included. We match on clinical fit and don&apos;t charge per booking.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              How do I know the insurance info is right?
            </dt>
            <dd className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Psychologists self-report their plans to get listed. Once you pick someone, we verify with your plan
              before the first session so you know your exact copay upfront.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
              What&apos;s the catch?
            </dt>
            <dd className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Patients pay the psychologist&apos;s normal rate through insurance. We charge the psychologist $8 per
              session. No per-booking fees, no rate cuts, no ads, no selling your data.
            </dd>
          </div>
        </dl>
      </div>

      {/* Footer note */}
      <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-8 space-y-3">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
          Psychologists self-report the plans they accept. We verify directly with your plan once you choose someone.
          We don&apos;t share intake data with advertisers.
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
          Research cited: Constantino MJ et al. Effect of Matching Therapists to Patients vs Assignment as Usual
          on Adult Psychotherapy Outcomes. <em>JAMA Psychiatry</em>. 2021;78(9):960&ndash;969. doi:10.1001/jamapsychiatry.2021.1221
        </p>
      </div>
    </main>
  )
}
