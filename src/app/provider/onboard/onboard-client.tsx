'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { WizardProvider, WizardStep } from '@/components/wizard'
import { StepCredentials } from './steps/step-credentials'
import { StepSpecializations } from './steps/step-specializations'
import { StepStyle } from './steps/step-style'
import { StepCultural } from './steps/step-cultural'
import { StepPractical } from './steps/step-practical'
import { StepBio } from './steps/step-bio'
import { StepReview } from './steps/step-review'

const STEP_TITLES = [
  'Credentials',
  'Specializations',
  'Therapeutic Style',
  'Cultural Competencies',
  'Practice Details',
  'Bio & Approach',
  'Review & Submit',
]

export function ProviderOnboardClient() {
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
        <p className="text-muted-foreground">You need to be logged in to set up your provider profile.</p>
      </div>
    )
  }

  const handleComplete = async () => {
    router.push('/provider/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight">Set Up Your Profile</h1>
        <p className="text-muted-foreground mt-2">
          Complete your provider profile to start getting matched with clients.
        </p>
      </div>
      <WizardProvider stepTitles={STEP_TITLES} onComplete={handleComplete}>
        <WizardStep stepIndex={0}><StepCredentials /></WizardStep>
        <WizardStep stepIndex={1}><StepSpecializations /></WizardStep>
        <WizardStep stepIndex={2}><StepStyle /></WizardStep>
        <WizardStep stepIndex={3}><StepCultural /></WizardStep>
        <WizardStep stepIndex={4}><StepPractical /></WizardStep>
        <WizardStep stepIndex={5}><StepBio /></WizardStep>
        <WizardStep stepIndex={6}><StepReview /></WizardStep>
      </WizardProvider>
    </div>
  )
}
