import { Suspense } from 'react'
import { TopicTeacherContent } from './topic-teacher-content'

function TopicTeacherLoadingFallback() {
  return (
    <main className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <p className="text-muted-foreground animate-pulse">
            Loading your lesson...
          </p>
        </div>
      </div>
    </main>
  )
}

export default function TopicTeacherPage() {
  return (
    <Suspense fallback={<TopicTeacherLoadingFallback />}>
      <TopicTeacherContent />
    </Suspense>
  )
}
