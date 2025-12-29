import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PulseSpinner } from '@/components/PulseSpinner'
import { CaseBankClient } from './case-bank-client'

export const metadata: Metadata = {
  title: 'Branching Case Vignettes',
  description: 'Interactive EPPP-style ethics, diagnosis, and treatment scenarios with scoring and rationales.',
  alternates: {
    canonical: '/case-bank',
  },
}

export default function CaseBankPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-6 bg-background">
          <div className="max-w-3xl mx-auto">
            <PulseSpinner message="Loading case bank..." />
          </div>
        </main>
      }
    >
      <CaseBankClient />
    </Suspense>
  )
}
