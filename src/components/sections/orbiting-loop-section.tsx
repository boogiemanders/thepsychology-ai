"use client"

import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react"

import { SectionHeader } from "@/components/section-header"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import { Ripple } from "@/components/ui/ripple"
import { cn } from "@/lib/utils"

const Circle = forwardRef<
  HTMLDivElement,
  {
    className?: string
    children?: React.ReactNode
    rippleColor?: string
    rippleKey?: number
  }
>(({ className, children, rippleColor, rippleKey }, ref) => {
  const showRipple = rippleColor && rippleKey !== undefined
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-10 flex size-16 md:size-20 items-center justify-center rounded-full border-2 border-border bg-background px-4 py-3 text-xs md:text-sm font-semibold shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] overflow-visible transition-transform duration-300 ease-out transition-shadow",
        className
      )}
    >
      {showRipple && (
        <Ripple
          key={rippleKey}
          color={rippleColor}
          mainCircleSize={140}
          numCircles={3}
          mainCircleOpacity={0.45}
        />
      )}
      <span className="relative z-10">{children}</span>
    </div>
  )
})

Circle.displayName = "Circle"

export function OrbitingLoopSection() {
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
  const [activeNode, setActiveNode] = useState<
    "practice" | "prioritize" | "study" | "quiz" | null
  >(null)
  const [hitCounter, setHitCounter] = useState(0)

  const segments = useMemo(
    () => [
      {
        from: diagnoseRef,
        to: prioritizeRef,
        props: {
          curvature: -8,
          startYOffset: -2,
          endYOffset: -2,
        },
      },
      {
        from: prioritizeRef,
        to: studyRef,
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
        from: studyRef,
        to: quizRef,
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
        from: quizRef,
        to: studyRef,
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
        from: studyRef,
        to: quizRef,
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
        from: quizRef,
        to: studyRef,
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
        from: studyRef,
        to: diagnoseRef,
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
    []
  )

  const [activeStep, setActiveStep] = useState(0)
  const segmentDurationMs = 850
  const highlightDurationMs = 250
  const arrivalLeadMs = 120
  const travelDurationMs = Math.max(segmentDurationMs - highlightDurationMs, 0)

  useEffect(() => {
    const targetOrder: Array<"practice" | "prioritize" | "study" | "quiz"> = [
      "prioritize", // Practice -> Prioritize
      "study", // Prioritize -> Study
      "quiz", // Study -> Quiz
      "study", // Quiz -> Study
      "quiz", // Study -> Quiz
      "study", // Quiz -> Study
      "practice", // Study -> Practice
    ]

    const target = targetOrder[activeStep]
    const highlightDelay = Math.max(travelDurationMs - arrivalLeadMs, 0)
    const shrinkDelay = Math.min(
      highlightDelay + highlightDurationMs,
      segmentDurationMs
    )

    const timers: Array<ReturnType<typeof setTimeout>> = []

    if (highlightDelay === 0) {
      setActiveNode(target)
      setHitCounter((c) => c + 1)
    } else {
      timers.push(
        setTimeout(() => {
          setActiveNode(target)
          setHitCounter((c) => c + 1)
        }, highlightDelay)
      )
    }

    timers.push(
      setTimeout(() => {
        setActiveNode(null)
      }, shrinkDelay)
    )

    timers.push(
      setTimeout(() => {
        setActiveStep((prev) => (prev + 1) % segments.length)
      }, segmentDurationMs)
    )

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [
    activeStep,
    arrivalLeadMs,
    highlightDurationMs,
    segmentDurationMs,
    travelDurationMs,
    segments.length,
  ])

  return (
    <section className="flex flex-col items-center justify-center w-full relative px-5 md:px-10">
      <div className="border-x mx-5 md:mx-10 relative">
        <div className="absolute top-0 -left-4 md:-left-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>
        <div className="absolute top-0 -right-4 md:-right-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>

        <SectionHeader>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
            A continuous loop that adapts to you
          </h2>
          <p className="text-muted-foreground text-center text-balance font-medium">
            Study less. Score higher. Here’s how.
          </p>
        </SectionHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10 items-center">
          <div className="space-y-6">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
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
            className="relative flex w-full max-w-[420px] md:max-w-[520px] mx-auto items-center justify-center overflow-hidden py-10 h-[360px] md:h-[420px] -translate-x-2 md:-translate-x-4"
          >
            {/* Parallelogram layout for the four stages */}
            <Circle
              ref={diagnoseRef}
              className={cn(
                "absolute left-[18%] top-[22%] sm:left-[20%] sm:top-[20%] brand-olive-bg text-white",
                activeNode === "practice" &&
                  "scale-110 shadow-[0_0_30px_rgba(255,255,255,0.45)]"
              )}
              rippleColor={rippleColors.practice}
              rippleKey={activeNode === "practice" ? hitCounter : undefined}
            >
              Practice
            </Circle>
            <Circle
              ref={prioritizeRef}
              className={cn(
                "absolute right-[18%] top-[22%] sm:right-[20%] sm:top-[20%] brand-soft-blue-bg text-white",
                activeNode === "prioritize" &&
                  "scale-110 shadow-[0_0_30px_rgba(255,255,255,0.45)]"
              )}
              rippleColor={rippleColors.prioritize}
              rippleKey={activeNode === "prioritize" ? hitCounter : undefined}
            >
              Prioritize
            </Circle>
            <Circle
              ref={studyRef}
              className={cn(
                "absolute left-1/2 bottom-[18%] sm:left-1/2 sm:bottom-[20%] -translate-x-1/2 brand-coral-bg text-white",
                activeNode === "study" &&
                  "scale-110 shadow-[0_0_30px_rgba(255,255,255,0.45)]"
              )}
              rippleColor={rippleColors.study}
              rippleKey={activeNode === "study" ? hitCounter : undefined}
            >
              Study
            </Circle>
            <Circle
              ref={quizRef}
              className={cn(
                "absolute right-[6%] bottom-[18%] sm:right-[8%] sm:bottom-[20%] brand-dusty-rose-bg text-white",
                activeNode === "quiz" &&
                  "scale-110 shadow-[0_0_30px_rgba(255,255,255,0.45)]"
              )}
              rippleColor={rippleColors.quiz}
              rippleKey={activeNode === "quiz" ? hitCounter : undefined}
            >
              Quiz
            </Circle>

            {segments.map((segment, idx) => (
              <AnimatedBeam
                key={`base-${idx}`}
                containerRef={containerRef}
                fromRef={segment.from}
                toRef={segment.to}
                duration={6}
                pathOpacity={0.15}
                gradientStartColor="transparent"
                gradientStopColor="transparent"
                {...segment.props}
              />
            ))}

            {segments.map(
              (segment, idx) =>
                idx === activeStep && (
                  <AnimatedBeam
                    key={`active-${idx}`}
                    containerRef={containerRef}
                    fromRef={segment.from}
                    toRef={segment.to}
                    duration={Math.max(travelDurationMs, 0) / 1000}
                    pathOpacity={0}
                    repeat={0}
                    {...segment.props}
                  />
                )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
