import { Suspense } from 'react'
import { PulseSpinner } from '@/components/PulseSpinner'
import RecoverClient from './recover-client'

export default function RecoverPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-6 bg-background">
          <div className="max-w-3xl mx-auto">
            <PulseSpinner message="Loading Recover..." />
          </div>
        </main>
      }
    >
      <RecoverClient />
    </Suspense>
  )
}

