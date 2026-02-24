"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useReducedMotion } from "motion/react"

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
})

import { SectionHeader } from "@/components/section-header"

const MOBILE_LAYOUT_BREAKPOINT = 768
// app.spline.design/file URLs are editor pages; runtime needs a direct .splinecode scene URL.
const MOBILE_SPLINE_SCENE = "https://prod.spline.design/GQqJTPWg2mZ38Ew0/scene.splinecode?v=mobile-refresh-20260224-2"
const DESKTOP_SPLINE_SCENE = "https://prod.spline.design/5Vh4gTb7J89r4Q9n/scene.splinecode?v=11"

type SplineTunerState = {
  x: number
  y: number
  zoom: number
  cropLeft: number
  cropRight: number
  cropTop: number
  cropBottom: number
}

function SplineTuner({
  x,
  y,
  zoom,
  cropLeft,
  cropRight,
  cropTop,
  cropBottom,
  onChange,
}: SplineTunerState & { onChange: (patch: Partial<SplineTunerState>) => void }) {
  const rowClassName = "flex items-center gap-2 text-xs font-mono"

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-80 space-y-2.5 rounded-xl bg-black/90 p-4 text-white shadow-2xl backdrop-blur">
      <div className="border-b border-white/20 pb-2 text-sm font-semibold">Spline Mobile Tuner</div>
      <div className={rowClassName}>
        <label className="w-20 shrink-0">X Pos</label>
        <input
          type="range"
          min={-120}
          max={120}
          step={1}
          value={x}
          onChange={(event) => onChange({ x: Number(event.target.value) })}
          className="flex-1 accent-orange-500"
        />
        <span className="w-12 text-right tabular-nums">{x}px</span>
      </div>
      <div className={rowClassName}>
        <label className="w-20 shrink-0">Y Pos</label>
        <input
          type="range"
          min={-120}
          max={120}
          step={1}
          value={y}
          onChange={(event) => onChange({ y: Number(event.target.value) })}
          className="flex-1 accent-green-500"
        />
        <span className="w-12 text-right tabular-nums">{y}px</span>
      </div>
      <div className={rowClassName}>
        <label className="w-20 shrink-0">Zoom</label>
        <input
          type="range"
          min={60}
          max={140}
          step={1}
          value={zoom}
          onChange={(event) => onChange({ zoom: Number(event.target.value) })}
          className="flex-1 accent-blue-500"
        />
        <span className="w-12 text-right tabular-nums">{zoom}%</span>
      </div>
      <div className="border-t border-white/10 pt-2 text-[10px] uppercase tracking-wider text-white/50">
        Crop
      </div>
      <div className={rowClassName}>
        <label className="w-20 shrink-0">Crop Left</label>
        <input
          type="range"
          min={-20}
          max={35}
          step={1}
          value={cropLeft}
          onChange={(event) => onChange({ cropLeft: Number(event.target.value) })}
          className="flex-1 accent-red-500"
        />
        <span className="w-12 text-right tabular-nums">{cropLeft}%</span>
      </div>
      <div className={rowClassName}>
        <label className="w-20 shrink-0">Crop Right</label>
        <input
          type="range"
          min={-20}
          max={35}
          step={1}
          value={cropRight}
          onChange={(event) => onChange({ cropRight: Number(event.target.value) })}
          className="flex-1 accent-red-500"
        />
        <span className="w-12 text-right tabular-nums">{cropRight}%</span>
      </div>
      <div className={rowClassName}>
        <label className="w-20 shrink-0">Crop Top</label>
        <input
          type="range"
          min={-20}
          max={35}
          step={1}
          value={cropTop}
          onChange={(event) => onChange({ cropTop: Number(event.target.value) })}
          className="flex-1 accent-red-500"
        />
        <span className="w-12 text-right tabular-nums">{cropTop}%</span>
      </div>
      <div className={rowClassName}>
        <label className="w-20 shrink-0">Crop Bottom</label>
        <input
          type="range"
          min={-20}
          max={35}
          step={1}
          value={cropBottom}
          onChange={(event) => onChange({ cropBottom: Number(event.target.value) })}
          className="flex-1 accent-red-500"
        />
        <span className="w-12 text-right tabular-nums">{cropBottom}%</span>
      </div>
    </div>
  )
}

export function OrbitingLoopSection() {
  const prefersReducedMotion = useReducedMotion()
  const [hasMounted, setHasMounted] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(false)
  const [tuner, setTuner] = useState<SplineTunerState>({
    x: 30,
    y: 0,
    zoom: 131,
    cropLeft: -15,
    cropRight: 24,
    cropTop: 0,
    cropBottom: 28,
  })

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_BREAKPOINT - 1}px)`)
    const updateLayoutMode = () => setIsMobileLayout(mediaQuery.matches)

    updateLayoutMode()
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateLayoutMode)
    } else {
      mediaQuery.addListener(updateLayoutMode)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", updateLayoutMode)
      } else {
        mediaQuery.removeListener(updateLayoutMode)
      }
    }
  }, [])

  const updateTuner = (patch: Partial<SplineTunerState>) => {
    setTuner((prev) => ({ ...prev, ...patch }))
  }

  const activeScene = isMobileLayout ? MOBILE_SPLINE_SCENE : DESKTOP_SPLINE_SCENE

  const frameVars = {
    "--orbit-x": `${tuner.x}px`,
    "--orbit-y": `${tuner.y}px`,
    "--orbit-mobile-scale": String((0.32 * tuner.zoom) / 100),
    "--orbit-sm-scale": String((0.4 * tuner.zoom) / 100),
    "--orbit-crop-left": `${tuner.cropLeft}%`,
    "--orbit-crop-right": `${tuner.cropRight}%`,
    "--orbit-crop-top": `${tuner.cropTop}%`,
    "--orbit-crop-bottom": `${tuner.cropBottom}%`,
  } as React.CSSProperties

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
            {hasMounted && !prefersReducedMotion && (
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
              Your AI Study Coach
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium">
              A continuous loop that adapts to you — study less, score higher.
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
            className="orbit-frame order-1 lg:order-2 relative flex w-[calc(100vw-2rem)] md:w-full md:max-w-[560px] mx-auto items-center justify-center aspect-[4/3] md:aspect-auto md:h-[420px] overflow-hidden bg-background"
            style={frameVars}
          >
            <style>{`
              .orbit-frame {
                clip-path: inset(
                  var(--orbit-crop-top)
                  var(--orbit-crop-right)
                  var(--orbit-crop-bottom)
                  var(--orbit-crop-left)
                );
              }

              .orbit-spline-wrap {
                width: 200%;
                height: 220%;
                left: calc(-58% - 20px + var(--orbit-x));
                top: calc(-71% + var(--orbit-y));
                transform: scale(var(--orbit-mobile-scale));
              }

              .orbit-spline-wrap a[href*="spline.design"] {
                display: none !important;
              }

              @media (min-width: 640px) {
                .orbit-spline-wrap {
                  left: calc(-54% - 20px + var(--orbit-x));
                  top: calc(-71% + var(--orbit-y));
                  transform: scale(var(--orbit-sm-scale));
                }
              }

              @media (min-width: 768px) {
                .orbit-frame {
                  clip-path: inset(0 0 0 0);
                }

                .orbit-spline-wrap {
                  width: 200%;
                  height: 220%;
                  left: -50%;
                  top: -71%;
                  transform: scale(0.51);
                }
              }
            `}</style>
            <div className="orbit-spline-wrap absolute z-[1] origin-center">
              <Spline
                key={activeScene}
                scene={activeScene}
              />
            </div>
            {/* Hide Spline watermark */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 hidden h-12 bg-background md:block" />
          </div>
        </div>
      </div>
      <SplineTuner {...tuner} onChange={updateTuner} />
    </section>
  )
}
