import { Suspense } from 'react'
import { QuizzerContent } from './quizzer-content'
import { PulseSpinner } from '@/components/PulseSpinner'

function QuizzerLoadingFallback() {
  return (
    <main className="min-h-screen p-6 bg-background exam-ui">
      <div className="max-w-2xl mx-auto">
        <PulseSpinner message="Loading quiz..." />
      </div>
    </main>
  )
}

export default function QuizzerPage() {
  return (
    <Suspense fallback={<QuizzerLoadingFallback />}>
      <QuizzerContent />
    </Suspense>
  )
}
