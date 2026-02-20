"use client"

import { useEffect, useRef, useState } from "react"
import { CompanyShowcase } from "@/components/sections/company-showcase"
import { FAQSection } from "@/components/sections/faq-section"
// import { FeatureSection } from "@/components/sections/feature-section"
import { FooterSection } from "@/components/sections/footer-section"
import { HeroSection } from "@/components/sections/hero-section"
import { OrbitingLoopSection } from "@/components/sections/orbiting-loop-section"
import { BentoSection } from "@/components/sections/bento-section"
import { PricingSection } from "@/components/sections/pricing-section"
import { TestimonialSection } from "@/components/sections/testimonial-section"

type HeroCopyOffsets = {
  tickerX: number
  tickerY: number
  titleX: number
  titleY: number
  ctaX: number
  ctaY: number
}

type HeroVideoLayout = {
  scale: number
  offsetX: number
  offsetY: number
  bottomCrop: number
}

const HERO_TUNER_STORAGE_KEY = "hero-video-tuner"
const CONTENT_LIFT_STORAGE_KEY = "home-content-lift"
const HERO_COPY_LIFT_STORAGE_KEY = "home-hero-copy-lift"

const DEFAULT_HERO_COPY_OFFSETS: HeroCopyOffsets = {
  tickerX: 0,
  tickerY: 0,
  titleX: 0,
  titleY: 0,
  ctaX: 0,
  ctaY: 0,
}

const DEFAULT_HERO_VIDEO_LAYOUT: HeroVideoLayout = {
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  bottomCrop: 0,
}

export default function HomeClient() {
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false)
  const [heroCopyOffsets, setHeroCopyOffsets] = useState<HeroCopyOffsets>(DEFAULT_HERO_COPY_OFFSETS)
  const [heroVideoLayout, setHeroVideoLayout] = useState<HeroVideoLayout>(DEFAULT_HERO_VIDEO_LAYOUT)
  const [contentLift, setContentLift] = useState(0)
  const [heroCopyLiftY, setHeroCopyLiftY] = useState(0)
  const [showContentLiftControl, setShowContentLiftControl] = useState(false)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }

    const shouldForceTop = () => !window.location.hash && window.location.pathname === "/"

    const forceTop = () => {
      if (!shouldForceTop()) return
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    }

    forceTop()

    // Mobile browsers (esp. iOS) can restore scroll position or "anchor" the viewport
    // after hydration/layout shifts. Re-assert top a few times early on.
    const timers: Array<number> = []
    timers.push(window.setTimeout(forceTop, 50))
    timers.push(window.setTimeout(forceTop, 250))
    timers.push(window.setTimeout(forceTop, 900))

    const handlePageShow = () => forceTop()
    window.addEventListener("pageshow", handlePageShow)

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [])


  useEffect(() => {
    setIsHeroVideoReady(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const saved = window.localStorage.getItem(HERO_TUNER_STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as {
        scale?: number
        offsetX?: number
        offsetY?: number
        bottomCrop?: number
        tickerX?: number
        tickerY?: number
        titleX?: number
        titleY?: number
        ctaX?: number
        ctaY?: number
      }

      setHeroVideoLayout({
        scale: typeof parsed.scale === "number" ? parsed.scale : DEFAULT_HERO_VIDEO_LAYOUT.scale,
        offsetX: typeof parsed.offsetX === "number" ? parsed.offsetX : DEFAULT_HERO_VIDEO_LAYOUT.offsetX,
        offsetY: typeof parsed.offsetY === "number" ? parsed.offsetY : DEFAULT_HERO_VIDEO_LAYOUT.offsetY,
        bottomCrop:
          typeof parsed.bottomCrop === "number" ? parsed.bottomCrop : DEFAULT_HERO_VIDEO_LAYOUT.bottomCrop,
      })

      setHeroCopyOffsets({
        tickerX: typeof parsed.tickerX === "number" ? parsed.tickerX : DEFAULT_HERO_COPY_OFFSETS.tickerX,
        tickerY: typeof parsed.tickerY === "number" ? parsed.tickerY : DEFAULT_HERO_COPY_OFFSETS.tickerY,
        titleX: typeof parsed.titleX === "number" ? parsed.titleX : DEFAULT_HERO_COPY_OFFSETS.titleX,
        titleY: typeof parsed.titleY === "number" ? parsed.titleY : DEFAULT_HERO_COPY_OFFSETS.titleY,
        ctaX: typeof parsed.ctaX === "number" ? parsed.ctaX : DEFAULT_HERO_COPY_OFFSETS.ctaX,
        ctaY: typeof parsed.ctaY === "number" ? parsed.ctaY : DEFAULT_HERO_COPY_OFFSETS.ctaY,
      })
    } catch {
      // Ignore malformed persisted layout.
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const shouldShow = process.env.NODE_ENV !== "production" || params.get("layoutTuner") === "1"
    setShowContentLiftControl(shouldShow)

    const saved = window.sessionStorage.getItem(CONTENT_LIFT_STORAGE_KEY)
    if (saved) {
      const parsed = Number(saved)
      if (Number.isFinite(parsed)) {
        setContentLift(Math.max(0, Math.min(900, parsed)))
      }
    }

    const savedHeroCopyLift = window.sessionStorage.getItem(HERO_COPY_LIFT_STORAGE_KEY)
    if (savedHeroCopyLift) {
      const parsedHeroCopyLift = Number(savedHeroCopyLift)
      if (Number.isFinite(parsedHeroCopyLift)) {
        setHeroCopyLiftY(Math.max(-240, Math.min(240, parsedHeroCopyLift)))
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.sessionStorage.setItem(CONTENT_LIFT_STORAGE_KEY, String(contentLift))
  }, [contentLift])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.sessionStorage.setItem(HERO_COPY_LIFT_STORAGE_KEY, String(heroCopyLiftY))
  }, [heroCopyLiftY])

  useEffect(() => {
    if (!isHeroVideoReady) return
    const video = heroVideoRef.current
    if (!video) return

    video.defaultMuted = true
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")
    video.setAttribute("muted", "")

    let attemptTimeout: number | null = null
    let gestureListenersAttached = false

    const cleanupAttemptTimeout = () => {
      if (attemptTimeout) {
        window.clearTimeout(attemptTimeout)
        attemptTimeout = null
      }
    }

    const handleUserResume = () => {
      video.play().catch(() => null)
      window.removeEventListener("touchstart", handleUserResume)
      window.removeEventListener("click", handleUserResume)
    }

    const attachGestureListeners = () => {
      if (gestureListenersAttached) return
      gestureListenersAttached = true
      window.addEventListener("touchstart", handleUserResume, { once: true })
      window.addEventListener("click", handleUserResume, { once: true })
    }

    const tryPlay = (attempt = 0) => {
      if (!video.paused) return
      const playPromise = video.play()
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            cleanupAttemptTimeout()
          })
          .catch(() => {
            if (attempt < 5) {
              attemptTimeout = window.setTimeout(() => tryPlay(attempt + 1), 800)
            } else {
              attachGestureListeners()
            }
          })
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && video.paused) {
        tryPlay()
      }
    }

    const handleEnded = () => {
      tryPlay()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    video.addEventListener("ended", handleEnded)
    tryPlay()

    return () => {
      cleanupAttemptTimeout()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      video.removeEventListener("ended", handleEnded)
      window.removeEventListener("touchstart", handleUserResume)
      window.removeEventListener("click", handleUserResume)
    }
  }, [isHeroVideoReady])


  return (
    <>
      <main
        className="flex flex-col items-center justify-center min-h-screen w-full"
      >
        <section className="relative w-full min-h-screen overflow-hidden">
          <div className="absolute inset-0 -z-10 pointer-events-none bg-black flex items-start justify-center">
            {isHeroVideoReady ? (
              <video
                id="hero-video"
                ref={heroVideoRef}
                className="w-full h-auto object-contain object-top lg:h-full lg:min-h-[750px] lg:w-full lg:min-w-full lg:object-cover lg:object-center"
                style={{
                  transform: `translate(${heroVideoLayout.offsetX}px, ${heroVideoLayout.offsetY}px) scale(${heroVideoLayout.scale / 100})`,
                  transformOrigin: "center center",
                  clipPath: `inset(0 0 ${heroVideoLayout.bottomCrop}px 0)`,
                  WebkitClipPath: `inset(0 0 ${heroVideoLayout.bottomCrop}px 0)`,
                }}
                src="/hero-background.mp4?v=refresh5"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                controls={false}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
          </div>
          <div className="relative z-10">
            <HeroSection
              offsets={{
                ...heroCopyOffsets,
                tickerY: heroCopyOffsets.tickerY + heroCopyLiftY,
                titleY: heroCopyOffsets.titleY + heroCopyLiftY,
                ctaY: heroCopyOffsets.ctaY + heroCopyLiftY,
              }}
            />
          </div>
        </section>
        <div
          className="relative z-20 w-full bg-background border-t border-border divide-y divide-border"
          style={contentLift > 0 ? { marginTop: -contentLift } : undefined}
        >
          <OrbitingLoopSection />
          <BentoSection />
          <TestimonialSection />
          {/* <FeatureSection /> */}
          {/* <GrowthSection /> */}
          <PricingSection />
          <FAQSection />
          <CompanyShowcase />
          {/* <CTASection /> */}
          <FooterSection />
        </div>
      </main>
      {showContentLiftControl ? (
        <div className="fixed bottom-4 right-4 z-50 w-72 rounded-md border border-white/25 bg-black/70 p-3 text-white backdrop-blur-sm">
          <p className="text-xs font-semibold tracking-wide uppercase">Layout Tuner</p>
          <p className="mt-1 text-[11px] text-white/75">Temporary layout control</p>
          <label className="mt-3 block text-xs">
            Move sections up: {contentLift}px
            <input
              type="range"
              min={0}
              max={900}
              value={contentLift}
              onChange={(event) => setContentLift(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="mt-3 block text-xs">
            Hero copy Y (negative = up): {heroCopyLiftY}px
            <input
              type="range"
              min={-240}
              max={240}
              value={heroCopyLiftY}
              onChange={(event) => setHeroCopyLiftY(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setHeroCopyLiftY(0)}
              className="inline-flex h-8 items-center justify-center rounded border border-white/30 px-3 text-xs text-white hover:bg-white/10"
            >
              Reset Hero
            </button>
            <button
              type="button"
              onClick={() => setContentLift(0)}
              className="inline-flex h-8 items-center justify-center rounded border border-white/30 px-3 text-xs text-white hover:bg-white/10"
            >
              Reset Sections
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
