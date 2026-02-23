"use client"

import React from "react"
import dynamic from "next/dynamic"
import { useReducedMotion } from "motion/react"

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
})

import { SectionHeader } from "@/components/section-header"

export function OrbitingLoopSection() {
  const prefersReducedMotion = useReducedMotion()

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
              <div className="relative h-[118px] w-[216px] sm:h-[138px] sm:w-[252px] md:h-[180px] md:w-[328px] overflow-hidden rounded-xl border border-border/30">
                <video
                  className="h-full w-full object-cover object-center dark:invert dark:opacity-92"
                  src="/animations/continuous-loop-adapts.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-background/30 dark:bg-white/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-background/68 dark:bg-background/62" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-transparent to-background/80" />
          </div>

          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              A continuous loop that adapts to you
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              Study less. Score higher. Here&apos;s how.
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

          <div className="order-1 lg:order-2 relative flex w-full max-w-[440px] md:max-w-[560px] mx-auto items-center justify-center h-[360px] md:h-[420px] overflow-hidden bg-background">
            <div
              className="absolute origin-center"
              style={{ width: "200%", height: "220%", top: "-59%", left: "-50%", transform: "scale(0.5)" }}
            >
              <Spline
                scene="https://prod.spline.design/5Vh4gTb7J89r4Q9n/scene.splinecode?v=11"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
