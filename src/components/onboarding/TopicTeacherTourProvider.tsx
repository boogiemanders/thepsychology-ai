'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { TOPIC_TEACHER_TOUR_STEPS } from '@/lib/onboarding/topic-teacher-tour-steps'
import {
  shouldShowTour,
  markTourComplete,
  markTourSkipped,
  getCurrentTourStep,
  saveCurrentTourStep,
  clearTourStep,
  resetTour,
} from '@/lib/onboarding/onboarding-storage'
import { useAuth } from '@/context/auth-context'
import { GenericTour } from './GenericTour'

interface TopicTeacherTourContextType {
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

const TopicTeacherTourContext = createContext<TopicTeacherTourContextType | undefined>(undefined)

export function TopicTeacherTourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasChecked, setHasChecked] = useState(false)

  const totalSteps = TOPIC_TEACHER_TOUR_STEPS.length

  // Check if we should auto-start the tour
  useEffect(() => {
    if (!user?.id || hasChecked) return

    const checkAndStart = async () => {
      const shouldShow = await shouldShowTour(user.id, 'topic-teacher')
      if (shouldShow) {
        // Check if there's a saved step
        const savedStep = getCurrentTourStep(user.id, 'topic-teacher')
        if (savedStep > 0 && savedStep < totalSteps) {
          setCurrentStep(savedStep)
        }
        // Auto-start the tour after a delay for elements to render
        setTimeout(() => {
          setIsActive(true)
        }, 1000)
      }
      setHasChecked(true)
    }

    // Small delay to let the page render first
    const timeout = setTimeout(checkAndStart, 500)
    return () => clearTimeout(timeout)
  }, [user?.id, hasChecked, totalSteps])

  const startTour = useCallback(() => {
    if (user?.id) {
      // Reset tour state first
      resetTour(user.id, 'topic-teacher')
    }
    setCurrentStep(0)
    setIsActive(true)
  }, [user?.id])

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      if (user?.id) {
        saveCurrentTourStep(user.id, newStep, 'topic-teacher')
      }
    } else {
      // Complete the tour
      setIsActive(false)
      if (user?.id) {
        markTourComplete(user.id, 'topic-teacher')
        clearTourStep(user.id, 'topic-teacher')
      }
    }
  }, [currentStep, totalSteps, user?.id])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      if (user?.id) {
        saveCurrentTourStep(user.id, newStep, 'topic-teacher')
      }
    }
  }, [currentStep, user?.id])

  const skipTour = useCallback(() => {
    setIsActive(false)
    if (user?.id) {
      markTourSkipped(user.id, 'topic-teacher')
      clearTourStep(user.id, 'topic-teacher')
    }
  }, [user?.id])

  const completeTour = useCallback(() => {
    setIsActive(false)
    if (user?.id) {
      markTourComplete(user.id, 'topic-teacher')
      clearTourStep(user.id, 'topic-teacher')
    }
  }, [user?.id])

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step)
        if (user?.id) {
          saveCurrentTourStep(user.id, step, 'topic-teacher')
        }
      }
    },
    [totalSteps, user?.id]
  )

  return (
    <TopicTeacherTourContext.Provider
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
      {isActive && (
        <GenericTour
          steps={TOPIC_TEACHER_TOUR_STEPS}
          currentStep={currentStep}
          totalSteps={totalSteps}
          nextStep={nextStep}
          prevStep={prevStep}
          skipTour={skipTour}
          completeTour={completeTour}
          finishButtonText="Got It!"
        />
      )}
    </TopicTeacherTourContext.Provider>
  )
}

export function useTopicTeacherTour() {
  const context = useContext(TopicTeacherTourContext)
  if (context === undefined) {
    throw new Error('useTopicTeacherTour must be used within a TopicTeacherTourProvider')
  }
  return context
}
