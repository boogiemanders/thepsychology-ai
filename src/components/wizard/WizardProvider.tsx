'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface WizardContextType {
  currentStep: number
  totalSteps: number
  stepTitles: string[]
  data: Record<string, unknown>
  setStepData: (values: Record<string, unknown>) => void
  next: () => void
  prev: () => void
  goToStep: (step: number) => void
  isFirstStep: boolean
  isLastStep: boolean
}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

interface WizardProviderProps {
  children: ReactNode
  stepTitles: string[]
  onComplete: (data: Record<string, unknown>) => Promise<void>
  initialData?: Record<string, unknown>
}

export function WizardProvider({ children, stepTitles, onComplete, initialData }: WizardProviderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<Record<string, unknown>>(initialData ?? {})
  const totalSteps = stepTitles.length

  const setStepData = useCallback((values: Record<string, unknown>) => {
    setData((prev) => ({ ...prev, ...values }))
  }, [])

  const next = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      void onComplete(data)
    }
  }, [currentStep, totalSteps, onComplete, data])

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) setCurrentStep(step)
    },
    [totalSteps]
  )

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        totalSteps,
        stepTitles,
        data,
        setStepData,
        next,
        prev,
        goToStep,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === totalSteps - 1,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used within WizardProvider')
  return ctx
}
