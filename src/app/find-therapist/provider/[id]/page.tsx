import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-server'
import type { ProviderProfile } from '@/types/matching'

export const metadata: Metadata = {
  title: 'Provider | thepsychology.ai',
  description: 'Psychologist profile',
}

function formatRate(cents: number | null) {
  if (!cents) return null
  return `$${Math.round(cents / 100)}`
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return notFound()

  const { data } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!data) return notFound()
  const p = data as ProviderProfile
  const rate = formatRate(p.self_pay_rate_cents)

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-10">
        <Link
          href="/find-therapist/results"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Matches
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          {p.license_type || 'Licensed Psychologist'}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Licensed in {p.licensed_states?.length ? p.licensed_states.join(', ') : p.license_state}
          {rate ? ` . ${rate} self-pay${p.sliding_scale_available ? ' . sliding scale' : ''}` : ''}
        </p>
      </div>

      {p.bio_text && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-3">
            About
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
            {p.bio_text}
          </p>
        </section>
      )}

      {p.approach_text && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-3">
            Approach
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
            {p.approach_text}
          </p>
        </section>
      )}

      <section className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8 grid gap-6 sm:grid-cols-2">
        {p.conditions_treated.length > 0 && (
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-2">
              Conditions
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {p.conditions_treated.join(', ')}
            </p>
          </div>
        )}
        {p.modalities.length > 0 && (
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-2">
              Modalities
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {p.modalities.join(', ')}
            </p>
          </div>
        )}
        {p.populations_served.length > 0 && (
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-2">
              Populations
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {p.populations_served.join(', ')}
            </p>
          </div>
        )}
        {p.languages_spoken.length > 0 && (
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-2">
              Languages
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {p.languages_spoken.join(', ')}
            </p>
          </div>
        )}
        {p.insurance_networks.length > 0 && (
          <div className="sm:col-span-2">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-2">
              Insurance
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {p.insurance_networks.join(', ')}
            </p>
          </div>
        )}
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-5 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Booking is coming soon
          </p>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
            We verify your plan and connect you directly. For now, note the match and we&apos;ll reach out when booking opens.
          </p>
          <Link
            href="/find-therapist/results"
            className="inline-block rounded-md border border-zinc-900 dark:border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 transition-colors"
          >
            Back to matches
          </Link>
        </div>
      </section>
    </main>
  )
}
