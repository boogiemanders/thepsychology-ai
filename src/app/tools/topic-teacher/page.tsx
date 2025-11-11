import { Suspense } from 'react'
import { TopicTeacherContent } from './topic-teacher-content'
import { BookOpen } from 'lucide-react'

function TopicTeacherLoadingFallback() {
  return (
    <main className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} />
          </div>
          <p className="text-muted-foreground">
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
