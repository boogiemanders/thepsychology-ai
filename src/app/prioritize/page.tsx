import { Suspense } from 'react'
import { PrioritizeContent } from './prioritize-content'

function PrioritizeLoadingFallback() {
  return (
    <main className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading prioritizer...
          </p>
        </div>
      </div>
    </main>
  )
}

export default function PrioritizePage() {
  return (
    <Suspense fallback={<PrioritizeLoadingFallback />}>
      <PrioritizeContent />
    </Suspense>
  )
}
