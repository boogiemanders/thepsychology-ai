'use client'

import Link from 'next/link'
import { useWizard } from '@/components/wizard'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export function StepComplete() {
  const { goToStep } = useWizard()

  return (
    <div className="flex flex-col items-center text-center py-8 space-y-6">
      <CheckCircle2 className="w-16 h-16 text-green-500" />

      <div className="space-y-2">
        <h2 className="text-2xl font-medium">You&apos;re all set!</h2>
        <p className="text-muted-foreground max-w-md">
          We&apos;ll use your preferences to find therapist matches tailored to your needs.
          You&apos;ll be able to see match scores, insurance compatibility, and book directly.
        </p>
      </div>

      <div className="flex gap-4">
        <Link href="/find-therapist/results">
          <Button>View My Matches</Button>
        </Link>
        <Button variant="outline" onClick={() => goToStep(0)}>
          Update Preferences
        </Button>
      </div>
    </div>
  )
}
