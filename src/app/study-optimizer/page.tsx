import { Suspense } from 'react'
import { StudyOptimizerContent } from './study-optimizer-content'

function StudyOptimizerLoadingFallback() {
  return (
    <main className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading study optimizer...
          </p>
        </div>
      </div>
    </main>
  )
}

export default function StudyOptimizerPage() {
  return (
    <Suspense fallback={<StudyOptimizerLoadingFallback />}>
      <StudyOptimizerContent />
    </Suspense>
  )
}
