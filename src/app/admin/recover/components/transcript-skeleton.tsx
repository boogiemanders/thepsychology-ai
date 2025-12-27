import { Skeleton } from '@/components/ui/skeleton'

export function TranscriptSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-end">
        <Skeleton className="h-12 w-3/4 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-20 w-4/5 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-2/3 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-3/4 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-8 w-1/2 rounded-2xl" />
      </div>
    </div>
  )
}
