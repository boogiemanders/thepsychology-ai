'use client'

import type { ReactNode } from 'react'
import { Progress } from '@/components/ui/progress'
import { useWizard } from './WizardProvider'

interface WizardStepProps {
  stepIndex: number
  children: ReactNode
}

export function WizardStep({ stepIndex, children }: WizardStepProps) {
  const { currentStep, totalSteps, stepTitles } = useWizard()
  if (currentStep !== stepIndex) return null

  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <span>{stepTitles[stepIndex]}</span>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </div>
      {children}
    </div>
  )
}
