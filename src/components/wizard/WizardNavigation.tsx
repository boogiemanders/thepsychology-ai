'use client'

import { Button } from '@/components/ui/button'
import { useWizard } from './WizardProvider'
import { Loader2 } from 'lucide-react'

interface WizardNavigationProps {
  /** When true, the Continue button becomes type="submit" so it triggers form.handleSubmit */
  submitForm?: boolean
  onNext?: () => Promise<boolean>
  isSubmitting?: boolean
  nextLabel?: string
}

export function WizardNavigation({ submitForm, onNext, isSubmitting, nextLabel }: WizardNavigationProps) {
  const { prev, next, isFirstStep, isLastStep } = useWizard()

  const handleNext = async () => {
    if (onNext) {
      const canAdvance = await onNext()
      if (!canAdvance) return
    }
    next()
  }

  return (
    <div className="flex justify-between pt-4">
      {!isFirstStep ? (
        <Button type="button" variant="ghost" onClick={prev} disabled={isSubmitting}>
          Back
        </Button>
      ) : (
        <div />
      )}
      {submitForm ? (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLastStep ? (nextLabel ?? 'Submit') : 'Continue'}
        </Button>
      ) : (
        <Button type="button" onClick={handleNext} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLastStep ? (nextLabel ?? 'Submit') : 'Continue'}
        </Button>
      )}
    </div>
  )
}
