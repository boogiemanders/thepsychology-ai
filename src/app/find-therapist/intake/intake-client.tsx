'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { WizardProvider, WizardStep } from '@/components/wizard'
import { StepConsent } from './steps/step-consent'
import { StepConcerns } from './steps/step-concerns'
import { StepHistory } from './steps/step-history'
import { StepPreferences } from './steps/step-preferences'
import { StepInsurance } from './steps/step-insurance'
import { StepPractical } from './steps/step-practical'
import { StepComplete } from './steps/step-complete'

const STEP_TITLES = [
  'Consent',
  'Your Concerns',
  'Therapy History',
  'Preferences',
  'Insurance',
  'Location',
  'Complete',
]

export function IntakeClient() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <h1 className="text-2xl font-medium">Sign in to get started</h1>
        <p className="text-muted-foreground">You need to be logged in to find a therapist.</p>
      </div>
    )
  }

  const handleComplete = async () => {
    router.push('/find-therapist/results')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight">Find Your Therapist</h1>
        <p className="text-muted-foreground mt-2">
          Answer a few questions so we can match you with the right therapist. Takes about 5-10 minutes.
        </p>
      </div>
      <WizardProvider stepTitles={STEP_TITLES} onComplete={handleComplete}>
        <WizardStep stepIndex={0}><StepConsent /></WizardStep>
        <WizardStep stepIndex={1}><StepConcerns /></WizardStep>
        <WizardStep stepIndex={2}><StepHistory /></WizardStep>
        <WizardStep stepIndex={3}><StepPreferences /></WizardStep>
        <WizardStep stepIndex={4}><StepInsurance /></WizardStep>
        <WizardStep stepIndex={5}><StepPractical /></WizardStep>
        <WizardStep stepIndex={6}><StepComplete /></WizardStep>
      </WizardProvider>
    </div>
  )
}
