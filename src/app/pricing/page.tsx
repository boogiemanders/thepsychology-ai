'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Constants (update these to change pricing or time estimates) ──────────────

const MINUTES_SAVED_PER_PATIENT = 20
const WEEKS_PER_MONTH = 4.33

const TIERS = [
  { name: 'Solo',          maxClinicians: 1,        price: 39  },
  { name: 'Small Group',   maxClinicians: 5,        price: 149 },
  { name: 'Mid Practice',  maxClinicians: 10,       price: 299 },
  { name: 'Enterprise',    maxClinicians: Infinity,  price: null },
] as const

// ─────────────────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function getSuggestedTier(clinicians: number) {
  return TIERS.find((t) => clinicians <= t.maxClinicians) ?? TIERS[TIERS.length - 1]
}

export default function PricingPage() {
  const [clinicians, setClinicians]           = useState(3)
  const [patientsPerWeek, setPatientsPerWeek] = useState(5)
  const [billingRate, setBillingRate]         = useState(200)

  const hoursPerMonth =
    (clinicians * patientsPerWeek * MINUTES_SAVED_PER_PATIENT * WEEKS_PER_MONTH) / 60

  const valuePerMonth = hoursPerMonth * billingRate
  const tier          = getSuggestedTier(clinicians)
  const roiRatio      = tier.price ? Math.round(valuePerMonth / tier.price) : null

  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-2xl space-y-10">

        {/* Header */}
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-600">
            Inzinna Extensions
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            How much time could you save?
          </h1>
          <p className="text-muted-foreground">
            Enter your practice details below to see your estimated monthly ROI.
          </p>
        </header>

        {/* Calculator inputs */}
        <section className="rounded-xl border border-border bg-accent/40 p-6 space-y-5">
          <h2 className="text-base font-semibold">Your practice</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Clinicians</span>
              <input
                type="number"
                min={1}
                max={50}
                value={clinicians}
                onChange={(e) => setClinicians(clamp(Number(e.target.value), 1, 50))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">New patients / week</span>
              <input
                type="number"
                min={1}
                max={100}
                value={patientsPerWeek}
                onChange={(e) => setPatientsPerWeek(clamp(Number(e.target.value), 1, 100))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Billing rate ($/hr)</span>
              <input
                type="number"
                min={50}
                max={500}
                step={10}
                value={billingRate}
                onChange={(e) => setBillingRate(clamp(Number(e.target.value), 50, 500))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Based on ~{MINUTES_SAVED_PER_PATIENT} minutes of admin time saved per new patient
            (ZocDoc import + intake capture + note fill).
          </p>
        </section>

        {/* Results */}
        <section className="rounded-xl border border-purple-200 bg-purple-50 p-6 space-y-4">
          <h2 className="text-base font-semibold text-purple-900">Your estimated savings</h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-0.5">
              <p className="text-2xl font-bold text-purple-700">
                {hoursPerMonth < 1
                  ? `${Math.round(hoursPerMonth * 60)} min`
                  : `${hoursPerMonth.toFixed(1)} hrs`}
              </p>
              <p className="text-xs text-purple-600">saved per month</p>
            </div>

            <div className="space-y-0.5">
              <p className="text-2xl font-bold text-purple-700">
                ${Math.round(valuePerMonth).toLocaleString()}
              </p>
              <p className="text-xs text-purple-600">in clinician time</p>
            </div>

            {roiRatio !== null && (
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-purple-700">{roiRatio}×</p>
                <p className="text-xs text-purple-600">return on investment</p>
              </div>
            )}
          </div>
        </section>

        {/* Suggested plan */}
        <section className="rounded-xl border border-border bg-background p-6 space-y-4">
          <h2 className="text-base font-semibold">Suggested plan</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">
                {tier.name}
                {tier.price !== null && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    — ${tier.price}/month
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {tier.maxClinicians === Infinity
                  ? 'Unlimited clinicians · custom onboarding'
                  : `Up to ${tier.maxClinicians} clinician${tier.maxClinicians > 1 ? 's' : ''}`}
              </p>
            </div>

            {tier.price !== null && roiRatio !== null && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-center">
                <p className="text-xs text-green-700 font-medium">You keep</p>
                <p className="text-lg font-bold text-green-700">
                  ${Math.round(valuePerMonth - tier.price).toLocaleString()}
                </p>
                <p className="text-xs text-green-600">/ month</p>
              </div>
            )}
          </div>

          {/* All tiers */}
          <div className="mt-2 divide-y divide-border rounded-lg border border-border overflow-hidden">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`flex justify-between items-center px-4 py-3 text-sm ${
                  t.name === tier.name ? 'bg-purple-50 font-semibold' : 'bg-background'
                }`}
              >
                <span>{t.name}</span>
                <span className="text-muted-foreground">
                  {t.price !== null
                    ? `$${t.price}/mo · up to ${t.maxClinicians} clinician${t.maxClinicians > 1 ? 's' : ''}`
                    : 'Contact us'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 text-center">
          {tier.price !== null ? (
            <Link
              href="/app"
              className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-8 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              Start your free 30-day trial →
            </Link>
          ) : (
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-8 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              Contact us for Enterprise pricing →
            </Link>
          )}
          <p className="text-xs text-muted-foreground">
            No credit card required during trial. Cancel anytime.
          </p>
        </div>

      </div>
    </main>
  )
}
