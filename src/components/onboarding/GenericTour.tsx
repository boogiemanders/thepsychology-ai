'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TourStep } from '@/lib/onboarding/topic-teacher-tour-steps'

const TOOLTIP_WIDTH = 320
const TOOLTIP_OFFSET = 16
const VIEWPORT_PADDING = 16

interface TooltipPosition {
  top: number
  left: number
  arrowPosition: 'top' | 'bottom' | 'left' | 'right'
}

function calculateTooltipPosition(
  targetRect: DOMRect,
  placement: string,
  tooltipHeight: number = 180
): TooltipPosition {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  let top = 0
  let left = 0
  let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top'

  switch (placement) {
    case 'bottom':
      top = targetRect.bottom + TOOLTIP_OFFSET
      left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2
      arrowPosition = 'top'
      break
    case 'top':
      top = targetRect.top - tooltipHeight - TOOLTIP_OFFSET
      left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2
      arrowPosition = 'bottom'
      break
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
      left = targetRect.right + TOOLTIP_OFFSET
      arrowPosition = 'left'
      break
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
      left = targetRect.left - TOOLTIP_WIDTH - TOOLTIP_OFFSET
      arrowPosition = 'right'
      break
    default:
      top = targetRect.bottom + TOOLTIP_OFFSET
      left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2
      arrowPosition = 'top'
  }

  // Adjust if tooltip goes off screen horizontally
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING
  } else if (left + TOOLTIP_WIDTH > viewport.width - VIEWPORT_PADDING) {
    left = viewport.width - TOOLTIP_WIDTH - VIEWPORT_PADDING
  }

  // Adjust if tooltip goes off screen vertically
  if (top < VIEWPORT_PADDING) {
    top = targetRect.bottom + TOOLTIP_OFFSET
    arrowPosition = 'top'
  } else if (top + tooltipHeight > viewport.height - VIEWPORT_PADDING) {
    top = targetRect.top - tooltipHeight - TOOLTIP_OFFSET
    arrowPosition = 'bottom'
    if (top < VIEWPORT_PADDING) {
      top = targetRect.bottom + TOOLTIP_OFFSET
      arrowPosition = 'top'
    }
  }

  return { top, left, arrowPosition }
}

interface GenericTourProps {
  steps: TourStep[]
  currentStep: number
  totalSteps: number
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  finishButtonText?: string
}

export function GenericTour({
  steps,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  completeTour,
  finishButtonText = 'Get Started',
}: GenericTourProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const step = steps[currentStep]
  const isLastStep = currentStep === totalSteps - 1

  const updatePosition = useCallback(() => {
    if (!step?.targetSelector) return

    const element = document.querySelector(step.targetSelector) as HTMLElement
    if (!element) return

    const rect = element.getBoundingClientRect()
    setTargetRect(rect)
    setTooltipPosition(calculateTooltipPosition(rect, step.placement))
  }, [step?.targetSelector, step?.placement])

  // Find element and scroll to it
  useEffect(() => {
    setMounted(true)

    if (!step?.targetSelector) return

    const findAndScrollToElement = () => {
      const element = document.querySelector(step.targetSelector) as HTMLElement
      if (!element) return false

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Wait for scroll to complete, then calculate position
      setTimeout(() => {
        const rect = element.getBoundingClientRect()
        setTargetRect(rect)
        setTooltipPosition(calculateTooltipPosition(rect, step.placement))
        setIsReady(true)
      }, 400)

      return true
    }

    // Reset ready state when step changes (but keep showing tooltip at old position)
    if (!findAndScrollToElement()) {
      const timeouts = [100, 300, 600].map((delay) =>
        setTimeout(findAndScrollToElement, delay)
      )
      return () => timeouts.forEach(clearTimeout)
    }
  }, [step?.targetSelector, step?.placement, currentStep])

  // Update position on scroll/resize
  useEffect(() => {
    if (!isReady) return

    let timeout: NodeJS.Timeout
    const debouncedUpdate = () => {
      clearTimeout(timeout)
      timeout = setTimeout(updatePosition, 50)
    }

    window.addEventListener('scroll', debouncedUpdate, true)
    window.addEventListener('resize', debouncedUpdate)

    return () => {
      window.removeEventListener('scroll', debouncedUpdate, true)
      window.removeEventListener('resize', debouncedUpdate)
      clearTimeout(timeout)
    }
  }, [isReady, updatePosition])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour()
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        if (isLastStep) {
          completeTour()
        } else {
          nextStep()
        }
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        prevStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, isLastStep, nextStep, prevStep, skipTour, completeTour])

  if (!mounted || !step) return null

  // Arrow component
  const Arrow = ({ position }: { position: 'top' | 'bottom' | 'left' | 'right' }) => {
    const styles: Record<string, React.CSSProperties> = {
      top: {
        position: 'absolute',
        top: -8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderBottom: '8px solid hsl(var(--background))',
      },
      bottom: {
        position: 'absolute',
        bottom: -8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: '8px solid hsl(var(--background))',
      },
      left: {
        position: 'absolute',
        left: -8,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0,
        height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: '8px solid hsl(var(--background))',
      },
      right: {
        position: 'absolute',
        right: -8,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0,
        height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderLeft: '8px solid hsl(var(--background))',
      },
    }
    return <div style={styles[position]} />
  }

  return createPortal(
    <>
      {/* Backdrop with spotlight cutout - animates smoothly */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9998]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          clipPath: targetRect
            ? `polygon(
                0% 0%,
                0% 100%,
                ${targetRect.left - 8}px 100%,
                ${targetRect.left - 8}px ${targetRect.top - 8}px,
                ${targetRect.right + 8}px ${targetRect.top - 8}px,
                ${targetRect.right + 8}px ${targetRect.bottom + 8}px,
                ${targetRect.left - 8}px ${targetRect.bottom + 8}px,
                ${targetRect.left - 8}px 100%,
                100% 100%,
                100% 0%
              )`
            : undefined,
        }}
        onClick={skipTour}
      />

      {/* Highlight border - slides to new position */}
      {targetRect && (
        <motion.div
          className="fixed z-[9998] pointer-events-none rounded-xl"
          initial={false}
          animate={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            opacity: 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          style={{
            border: '2px solid hsl(var(--primary))',
            boxShadow: '0 0 0 4px hsl(var(--primary) / 0.3)',
          }}
        />
      )}

      {/* Tooltip - slides to new position */}
      {tooltipPosition && (
        <motion.div
          className="fixed z-[9999] rounded-xl border border-border bg-background p-4 shadow-2xl"
          initial={false}
          animate={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            opacity: 1,
            scale: 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          style={{
            width: TOOLTIP_WIDTH,
          }}
        >
          {/* Arrow */}
          <Arrow position={tooltipPosition.arrowPosition} />

          {/* Close button */}
          <button
            onClick={skipTour}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content - fades when changing */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="pr-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
          </motion.div>

          {/* Progress & Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep
                      ? 'bg-primary'
                      : idx < currentStep
                        ? 'bg-primary/50'
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" onClick={prevStep} className="h-8 px-2">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <Button size="sm" onClick={isLastStep ? completeTour : nextStep} className="h-8">
                {isLastStep ? finishButtonText : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </>,
    document.body
  )
}
