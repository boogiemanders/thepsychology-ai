'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { TOUR_STEPS } from '@/lib/onboarding/tour-steps'
import {
  shouldShowOnboarding,
  markOnboardingComplete,
  markOnboardingSkipped,
  getCurrentTourStep,
  saveCurrentTourStep,
  clearTourStep,
} from '@/lib/onboarding/onboarding-storage'
import { useAuth } from '@/context/auth-context'
import { OnboardingTour } from './OnboardingTour'

interface OnboardingContextType {
  isActive: boolean
  currentStep: number
  totalSteps: number
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  goToStep: (step: number) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasChecked, setHasChecked] = useState(false)

  const totalSteps = TOUR_STEPS.length

  // Check if we should auto-start the tour
  useEffect(() => {
    if (!user?.id || hasChecked) return

    const checkAndStart = async () => {
      const shouldShow = await shouldShowOnboarding(user.id)
      if (shouldShow) {
        // Check if there's a saved step
        const savedStep = getCurrentTourStep(user.id)
        if (savedStep > 0 && savedStep < totalSteps) {
          setCurrentStep(savedStep)
        }
        // We'll let the dashboard trigger the tour after it mounts
      }
      setHasChecked(true)
    }

    // Small delay to let the page render first
    const timeout = setTimeout(checkAndStart, 500)
    return () => clearTimeout(timeout)
  }, [user?.id, hasChecked, totalSteps])

  const startTour = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      if (user?.id) {
        saveCurrentTourStep(user.id, newStep)
      }
    } else {
      // Complete the tour
      setIsActive(false)
      if (user?.id) {
        markOnboardingComplete(user.id)
        clearTourStep(user.id)
      }
    }
  }, [currentStep, totalSteps, user?.id])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      if (user?.id) {
        saveCurrentTourStep(user.id, newStep)
      }
    }
  }, [currentStep, user?.id])

  const skipTour = useCallback(() => {
    setIsActive(false)
    if (user?.id) {
      markOnboardingSkipped(user.id)
      clearTourStep(user.id)
    }
  }, [user?.id])

  const completeTour = useCallback(() => {
    setIsActive(false)
    if (user?.id) {
      markOnboardingComplete(user.id)
      clearTourStep(user.id)
    }
  }, [user?.id])

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step)
        if (user?.id) {
          saveCurrentTourStep(user.id, step)
        }
      }
    },
    [totalSteps, user?.id]
  )

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        goToStep,
      }}
    >
      {children}
      {isActive && <OnboardingTour />}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
