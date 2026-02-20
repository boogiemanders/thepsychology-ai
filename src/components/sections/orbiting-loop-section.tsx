"use client"

import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"

import { SectionHeader } from "@/components/section-header"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import { Ripple } from "@/components/ui/ripple"
import { cn } from "@/lib/utils"

type NodeKey = "practice" | "prioritize" | "study" | "quiz"

const Circle = forwardRef<
  HTMLDivElement,
  {
    className?: string
    children?: React.ReactNode
    rippleColor?: string
    rippleKey?: number
    rippleSize?: number
    rippleSizeGap?: number
    rippleDurationMs?: number
    rippleCircles?: number
    rippleOpacity?: number
    rippleBlendMode?: React.CSSProperties["mixBlendMode"]
  }
>(
  (
    {
      className,
      children,
      rippleColor,
      rippleKey,
      rippleSize,
      rippleSizeGap,
      rippleDurationMs,
      rippleCircles,
      rippleOpacity,
      rippleBlendMode,
    },
    ref
  ) => {
  const showRipple = rippleColor && rippleKey !== undefined
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-10 flex size-16 md:size-20 items-center justify-center rounded-full border-2 border-border bg-background px-4 py-3 text-xs md:text-sm font-semibold shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] overflow-visible transition-transform transition-shadow duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
        className
      )}
    >
      {showRipple && (
        <Ripple
          key={rippleKey}
          color={rippleColor}
          mainCircleSize={rippleSize}
          circleSizeGap={rippleSizeGap}
          durationMs={rippleDurationMs}
          numCircles={rippleCircles}
          mainCircleOpacity={rippleOpacity}
          blendMode={rippleBlendMode}
        />
      )}
      <span className="relative z-10">{children}</span>
    </div>
  )
})

Circle.displayName = "Circle"

export function OrbitingLoopSection() {
  const prefersReducedMotion = useReducedMotion()
  const rippleColors = useMemo(
    () => ({
      practice: "#788c5d",
      prioritize: "#6a9bcc",
      study: "#d87758",
      quiz: "#c46685",
    }),
    []
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const diagnoseRef = useRef<HTMLDivElement>(null)
  const prioritizeRef = useRef<HTMLDivElement>(null)
  const studyRef = useRef<HTMLDivElement>(null)
  const quizRef = useRef<HTMLDivElement>(null)
  const [activeNode, setActiveNode] = useState<NodeKey | null>(null)
  const [hitCounter, setHitCounter] = useState(0)

  const activeNodeStyles: Record<NodeKey, string> = useMemo(
    () => ({
      practice:
        "scale-[1.12] shadow-[0_0_0_7px_rgba(120,140,93,0.2),0_0_35px_rgba(120,140,93,0.4)]",
      prioritize:
        "scale-[1.12] shadow-[0_0_0_7px_rgba(106,155,204,0.2),0_0_35px_rgba(106,155,204,0.4)]",
      study:
        "scale-[1.12] shadow-[0_0_0_7px_rgba(216,119,88,0.2),0_0_35px_rgba(216,119,88,0.4)]",
      quiz:
        "scale-[1.12] shadow-[0_0_0_7px_rgba(196,102,133,0.2),0_0_35px_rgba(196,102,133,0.4)]",
    }),
    []
  )

  const steps = useMemo(
    () => [
      {
        targetNode: "prioritize" as const,
        accent: rippleColors.prioritize,
        fromRef: diagnoseRef,
        toRef: prioritizeRef,
        props: {
          curvature: -8,
          startYOffset: -2,
          endYOffset: -2,
        },
      },
      {
        targetNode: "study" as const,
        accent: rippleColors.study,
        fromRef: prioritizeRef,
        toRef: studyRef,
        props: {
          curvature: -42,
          startXOffset: 0,
          endXOffset: 0,
          startYOffset: 4,
          endYOffset: -10,
          reverse: true,
        },
      },
      {
        targetNode: "quiz" as const,
        accent: rippleColors.quiz,
        fromRef: studyRef,
        toRef: quizRef,
        props: {
          startXOffset: 0,
          endXOffset: 0,
          startYOffset: 0,
          endYOffset: 0,
          useMidpointControlY: true,
          curvature: 0,
          controlXOffset: 72,
        },
      },
      {
        targetNode: "study" as const,
        accent: rippleColors.study,
        fromRef: quizRef,
        toRef: studyRef,
        props: {
          startXOffset: 0,
          endXOffset: 0,
          startYOffset: 0,
          endYOffset: 0,
          useMidpointControlY: true,
          curvature: 0,
          controlXOffset: -72,
          reverse: true,
        },
      },
      {
        targetNode: "quiz" as const,
        accent: rippleColors.quiz,
        fromRef: studyRef,
        toRef: quizRef,
        props: {
          startXOffset: 0,
          endXOffset: 0,
          startYOffset: 0,
          endYOffset: 0,
          useMidpointControlY: true,
          curvature: 0,
          controlXOffset: 80,
        },
      },
      {
        targetNode: "study" as const,
        accent: rippleColors.study,
        fromRef: quizRef,
        toRef: studyRef,
        props: {
          startXOffset: 0,
          endXOffset: 0,
          startYOffset: 0,
          endYOffset: 0,
          useMidpointControlY: true,
          curvature: 0,
          controlXOffset: -80,
          reverse: true,
        },
      },
      {
        targetNode: "practice" as const,
        accent: rippleColors.practice,
        fromRef: studyRef,
        toRef: diagnoseRef,
        props: {
          curvature: 42,
          startXOffset: 0,
          endXOffset: 0,
          startYOffset: -10,
          endYOffset: 4,
          reverse: true,
        },
      },
    ],
    [rippleColors]
  )

  const [activeStep, setActiveStep] = useState(0)
  const stepCount = steps.length
  const currentStepIndex = activeStep % stepCount
  const currentTargetNode = steps[currentStepIndex]?.targetNode ?? null
  const segmentDurationMs = prefersReducedMotion ? 1500 : 1260
  const beamTravelDurationMs = prefersReducedMotion ? 0 : 860

  useEffect(() => {
    if (!currentTargetNode) return

    const timers: Array<ReturnType<typeof setTimeout>> = []
    setActiveNode(null)

    if (beamTravelDurationMs === 0) {
      setActiveNode(currentTargetNode)
      setHitCounter((c) => c + 1)
    } else {
      timers.push(
        setTimeout(() => {
          setActiveNode(currentTargetNode)
          setHitCounter((c) => c + 1)
        }, beamTravelDurationMs)
      )
    }

    timers.push(
      setTimeout(() => {
        setActiveStep((prev) => (prev + 1) % stepCount)
      }, segmentDurationMs)
    )

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [
    activeStep,
    currentTargetNode,
    beamTravelDurationMs,
    segmentDurationMs,
    stepCount,
  ])

  return (
    <section className="flex flex-col items-center justify-center w-full relative px-5 md:px-10">
      <div className="border-x mx-5 md:mx-10 relative">
        <div className="absolute top-0 -left-4 md:-left-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>
        <div className="absolute top-0 -right-4 md:-right-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>

        <div className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
          >
            {!prefersReducedMotion && (
              <div className="relative h-[108px] w-[200px] sm:h-[128px] sm:w-[236px] md:h-[164px] md:w-[305px] overflow-hidden rounded-xl border border-border/30">
                <video
                  className="h-full w-full object-cover object-center dark:invert"
                  src="/animations/continuous-loop-adapts.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-background/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-background/68" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-transparent to-background/80" />
          </div>

          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              A continuous loop that adapts to you
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Study less. Score higher. Here’s how.
            </p>
          </SectionHeader>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10 items-center">
          <div className="order-2 lg:order-1 space-y-6">
            <p className="text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground max-w-xl">
              Your AI coach helps you study what you actually need.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm md:text-base">
              <div className="space-y-1.5">
                <h3 className="font-semibold tracking-tight">Practice</h3>
                <p className="text-muted-foreground">
                  Take practice exams to know where your EPPP readiness stands.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold tracking-tight">Prioritize</h3>
                <p className="text-muted-foreground">
                  Focus your limited study time on the topics that will move
                  your score the most right now.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold tracking-tight">Study</h3>
                <p className="text-muted-foreground">
                  Dive into tailored explanations that match your exact
                  knowledge gaps.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold tracking-tight">Quiz</h3>
                <p className="text-muted-foreground">
                  Get short adaptive quizzes that inform what to highlight
                  during next study session.
                </p>
              </div>
            </div>
          </div>

          <div
            ref={containerRef}
            className="order-1 lg:order-2 relative isolate flex w-full max-w-[440px] md:max-w-[560px] mx-auto items-center justify-center overflow-visible py-10 h-[360px] md:h-[420px] md:-translate-x-2"
          >
            {/* Parallelogram layout for the four stages */}
            <Circle
              ref={diagnoseRef}
              className={cn(
                "absolute left-[18%] top-[22%] sm:left-[20%] sm:top-[20%] brand-olive-bg text-white",
                activeNode === "practice" && activeNodeStyles.practice
              )}
              rippleColor={rippleColors.practice}
              rippleKey={
                activeNode === "practice" ? hitCounter : undefined
              }
              rippleSize={130}
              rippleSizeGap={64}
              rippleDurationMs={620}
              rippleCircles={3}
              rippleOpacity={0.45}
              rippleBlendMode="normal"
            >
              Practice
            </Circle>
            <Circle
              ref={prioritizeRef}
              className={cn(
                "absolute right-[18%] top-[22%] sm:right-[20%] sm:top-[20%] brand-soft-blue-bg text-white",
                activeNode === "prioritize" && activeNodeStyles.prioritize
              )}
              rippleColor={rippleColors.prioritize}
              rippleKey={
                activeNode === "prioritize" ? hitCounter : undefined
              }
              rippleSize={130}
              rippleSizeGap={64}
              rippleDurationMs={620}
              rippleCircles={3}
              rippleOpacity={0.45}
              rippleBlendMode="normal"
            >
              Prioritize
            </Circle>
            <Circle
              ref={studyRef}
              className={cn(
                "absolute left-1/2 bottom-[18%] sm:left-1/2 sm:bottom-[20%] -translate-x-1/2 brand-coral-bg text-white",
                activeNode === "study" && activeNodeStyles.study
              )}
              rippleColor={rippleColors.study}
              rippleKey={
                activeNode === "study" ? hitCounter : undefined
              }
              rippleSize={130}
              rippleSizeGap={64}
              rippleDurationMs={620}
              rippleCircles={3}
              rippleOpacity={0.45}
              rippleBlendMode="normal"
            >
              Study
            </Circle>
            <Circle
              ref={quizRef}
              className={cn(
                "absolute right-[10%] bottom-[18%] sm:right-[13%] sm:bottom-[20%] brand-dusty-rose-bg text-white",
                activeNode === "quiz" && activeNodeStyles.quiz
              )}
              rippleColor={rippleColors.quiz}
              rippleKey={
                activeNode === "quiz" ? hitCounter : undefined
              }
              rippleSize={116}
              rippleSizeGap={56}
              rippleDurationMs={620}
              rippleCircles={3}
              rippleOpacity={0.42}
              rippleBlendMode="normal"
            >
              Quiz
            </Circle>

            {steps.map((step, idx) => (
              <AnimatedBeam
                key={`base-${idx}`}
                containerRef={containerRef}
                fromRef={step.fromRef}
                toRef={step.toRef}
                duration={6}
                pathOpacity={0.15}
                pathColor="#8f8f97"
                gradientStartColor="transparent"
                gradientStopColor="transparent"
                {...step.props}
              />
            ))}

            {!prefersReducedMotion &&
              steps.map(
                (step, idx) =>
                  idx === activeStep && (
                  <AnimatedBeam
                    key={`active-${idx}`}
                    containerRef={containerRef}
                    fromRef={step.fromRef}
                    toRef={step.toRef}
                    duration={beamTravelDurationMs / 1000}
                    pathWidth={3}
                    pathOpacity={0}
                    repeat={0}
                    gradientStartColor={step.accent}
                    gradientStopColor={step.accent}
                    {...step.props}
                  />
                )
              )}
          </div>
        </div>
      </div>
    </section>
  )
}
