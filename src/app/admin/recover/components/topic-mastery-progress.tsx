import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type TopicMastery = {
  topic: string
  section: string
  total_attempts: number
  correct_attempts: number
  wrong_attempts: number
  last_attempted: string | null
}

interface TopicMasteryProgressProps {
  topics: TopicMastery[]
  maxDisplay?: number
}

export function TopicMasteryProgress({ topics, maxDisplay = 4 }: TopicMasteryProgressProps) {
  if (!topics.length) {
    return <p className="text-sm text-muted-foreground">No topic data yet.</p>
  }

  return (
    <div className="space-y-3">
      {topics.slice(0, maxDisplay).map((t) => {
        const accuracy = t.total_attempts > 0 ? Math.round((t.correct_attempts / t.total_attempts) * 100) : 0

        return (
          <div key={`${t.topic}-${t.section}`} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate max-w-[140px]" title={t.section}>
                {t.section}
              </span>
              <span
                className={cn(
                  'tabular-nums font-medium',
                  accuracy >= 70 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                )}
              >
                {accuracy}%
              </span>
            </div>
            <Progress
              value={accuracy}
              className={cn(
                'h-1.5',
                accuracy >= 70
                  ? '[&>div]:bg-green-500'
                  : accuracy >= 50
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-red-500'
              )}
            />
          </div>
        )
      })}
      {topics.length > maxDisplay && (
        <p className="text-xs text-muted-foreground">+{topics.length - maxDisplay} more topics</p>
      )}
    </div>
  )
}
