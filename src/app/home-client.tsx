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

const MOBILE_LAYOUT_BREAKPOINT = 768
const FINAL_CONTINUOUS_LOOP_BELOW_Y = 316
const MOBILE_CONTINUOUS_LOOP_BELOW_Y = -64
const CONTENT_LIFT_TUNER_STORAGE_KEY = "home-layout-tuner-content-lift-y"
const HERO_TICKER_TUNER_STORAGE_KEY = "home-layout-tuner-ticker-lift-y"
const HERO_TITLE_TUNER_STORAGE_KEY = "home-layout-tuner-title-lift-y"
const HERO_CTA_TUNER_STORAGE_KEY = "home-layout-tuner-cta-lift-y"
const HERO_VIDEO_TUNER_STORAGE_KEY = "home-layout-tuner-video-lift-y"
const HERO_VIDEO_ZOOM_TUNER_STORAGE_KEY = "home-layout-tuner-video-zoom"
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const getLayoutScopedStorageKey = (baseKey: string, isMobile: boolean) =>
  `${baseKey}-${isMobile ? "mobile" : "desktop"}`

type HeroCopyOffsets = {
  tickerX: number
  tickerY: number
  titleX: number
  titleY: number
  ctaX: number
  ctaY: number
}

const FINAL_HERO_COPY_OFFSETS: HeroCopyOffsets = {
  tickerX: 0,
  tickerY: 630,
  titleX: 0,
  titleY: 352,
  ctaX: 0,
  ctaY: 379,
}

const MOBILE_HERO_COPY_OFFSETS: HeroCopyOffsets = {
  tickerX: 0,
  tickerY: 200,
  titleX: 0,
  titleY: 29,
  ctaX: 0,
  ctaY: 57,
}

const FINAL_CONTENT_LIFT = 659
const FINAL_HERO_VIDEO_START_AT = 9
const MOBILE_HERO_VIDEO_START_AT = 0
const MOBILE_HERO_VIDEO_LOOP_END_AT = 8.8
const MOBILE_CONTENT_LIFT = 0

const HARD_CODED_HERO_LAYOUT = {
  bannerTextY: -65,
  buttonsY: -40,
  videoY: 0,
  videoBottomCrop: 0,
  contentGroupY: 199,
  videoOffsetX: 0,
  videoOffsetY: 0,
} as const

const MOBILE_HERO_LAYOUT = {
  bannerTextY: 0,
  buttonsY: 0,
  videoY: 0,
  videoBottomCrop: 0,
  contentGroupY: -430,
  videoOffsetX: 0,
  videoOffsetY: 0,
} as const

export default function HomeClient() {
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(false)
  const [showLayoutTuner, setShowLayoutTuner] = useState(false)
  const [didCopyCopyValues, setDidCopyCopyValues] = useState(false)
  const [contentLiftTuner, setContentLiftTuner] = useState(0)
  const [heroTickerLiftY, setHeroTickerLiftY] = useState(0)
  const [heroTitleLiftY, setHeroTitleLiftY] = useState(0)
  const [heroCtaLiftY, setHeroCtaLiftY] = useState(0)
  const [heroVideoLiftY, setHeroVideoLiftY] = useState(0)
  const [heroVideoZoom, setHeroVideoZoom] = useState(100)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_LAYOUT_BREAKPOINT}px)`)
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

    const params = new URLSearchParams(window.location.search)
    const shouldShowLayoutTuner = params.get("layoutTuner") === "1"
    const shouldRestoreTunerValues = params.get("restoreTuner") === "1"
    setShowLayoutTuner(shouldShowLayoutTuner)

    if (!shouldShowLayoutTuner || !shouldRestoreTunerValues) {
      setContentLiftTuner(0)
      setHeroTickerLiftY(0)
      setHeroTitleLiftY(0)
      setHeroCtaLiftY(0)
      setHeroVideoLiftY(0)
      setHeroVideoZoom(100)
      return
    }

    const readStoredValue = (key: string, min: number, max: number) => {
      const layoutScopedKey = getLayoutScopedStorageKey(key, isMobileLayout)
      let rawValue = window.sessionStorage.getItem(layoutScopedKey)
      if (!rawValue) {
        const legacyRawValue = window.sessionStorage.getItem(key)
        if (legacyRawValue) {
          rawValue = legacyRawValue
          window.sessionStorage.setItem(layoutScopedKey, legacyRawValue)
        }
      }
      if (!rawValue) return 0
      const parsed = Number(rawValue)
      if (!Number.isFinite(parsed)) return 0
      return clamp(parsed, min, max)
    }

    setContentLiftTuner(readStoredValue(CONTENT_LIFT_TUNER_STORAGE_KEY, -900, 900))
    setHeroTickerLiftY(readStoredValue(HERO_TICKER_TUNER_STORAGE_KEY, -240, 600))
    setHeroTitleLiftY(readStoredValue(HERO_TITLE_TUNER_STORAGE_KEY, -240, 240))
    setHeroCtaLiftY(readStoredValue(HERO_CTA_TUNER_STORAGE_KEY, -240, 600))
    setHeroVideoLiftY(readStoredValue(HERO_VIDEO_TUNER_STORAGE_KEY, -320, 320))
    setHeroVideoZoom(readStoredValue(HERO_VIDEO_ZOOM_TUNER_STORAGE_KEY, 50, 200) || 100)
  }, [isMobileLayout])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!showLayoutTuner) return

    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(CONTENT_LIFT_TUNER_STORAGE_KEY, isMobileLayout),
      String(contentLiftTuner),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_TICKER_TUNER_STORAGE_KEY, isMobileLayout),
      String(heroTickerLiftY),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_TITLE_TUNER_STORAGE_KEY, isMobileLayout),
      String(heroTitleLiftY),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_CTA_TUNER_STORAGE_KEY, isMobileLayout),
      String(heroCtaLiftY),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_VIDEO_TUNER_STORAGE_KEY, isMobileLayout),
      String(heroVideoLiftY),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_VIDEO_ZOOM_TUNER_STORAGE_KEY, isMobileLayout),
      String(heroVideoZoom),
    )
  }, [
    showLayoutTuner,
    isMobileLayout,
    contentLiftTuner,
    heroTickerLiftY,
    heroTitleLiftY,
    heroCtaLiftY,
    heroVideoLiftY,
    heroVideoZoom,
  ])

  useEffect(() => {
    if (!isHeroVideoReady) return
    const video = heroVideoRef.current
    if (!video) return

    const preferredStartAt = isMobileLayout ? MOBILE_HERO_VIDEO_START_AT : FINAL_HERO_VIDEO_START_AT
    const preferredLoopEndAt = isMobileLayout ? MOBILE_HERO_VIDEO_LOOP_END_AT : null

    const seekToPreferredStart = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      const maxStart = duration > 0 ? Math.max(0, duration - 0.1) : 0
      const target = Math.max(0, Math.min(preferredStartAt, maxStart))
      if (Math.abs(video.currentTime - target) > 0.2) {
        video.currentTime = target
      }
    }

    video.defaultMuted = true
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")
    video.setAttribute("muted", "")

    if (video.readyState >= 1) {
      seekToPreferredStart()
    } else {
      video.addEventListener("loadedmetadata", seekToPreferredStart, { once: true })
    }

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
      seekToPreferredStart()
      tryPlay()
    }

    const handleTimeUpdate = () => {
      if (preferredLoopEndAt === null) return
      if (video.currentTime >= preferredLoopEndAt) {
        video.currentTime = preferredStartAt
        if (video.paused) {
          tryPlay()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("timeupdate", handleTimeUpdate)
    tryPlay()

    return () => {
      cleanupAttemptTimeout()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      window.removeEventListener("touchstart", handleUserResume)
      window.removeEventListener("click", handleUserResume)
    }
  }, [isHeroVideoReady, isMobileLayout])

  const activeHeroCopyOffsets = isMobileLayout ? MOBILE_HERO_COPY_OFFSETS : FINAL_HERO_COPY_OFFSETS
  const activeHeroLayout = isMobileLayout ? MOBILE_HERO_LAYOUT : HARD_CODED_HERO_LAYOUT
  const activeContentLift = isMobileLayout ? MOBILE_CONTENT_LIFT : FINAL_CONTENT_LIFT

  const defaultTickerY = activeHeroCopyOffsets.tickerY
  const composedHeroOffsets: HeroCopyOffsets = {
    ...activeHeroCopyOffsets,
    tickerY: defaultTickerY + heroTickerLiftY,
    titleY: activeHeroCopyOffsets.titleY + heroTitleLiftY,
    ctaY: activeHeroCopyOffsets.ctaY + activeHeroLayout.buttonsY + heroCtaLiftY,
  }
  const activeCopyPresetName = isMobileLayout ? "MOBILE_HERO_COPY_OFFSETS" : "FINAL_HERO_COPY_OFFSETS"
  const activeContinuousLoopBelowYName = isMobileLayout
    ? "MOBILE_CONTINUOUS_LOOP_BELOW_Y"
    : "FINAL_CONTINUOUS_LOOP_BELOW_Y"
  const activeContinuousLoopBelowY = isMobileLayout
    ? MOBILE_CONTINUOUS_LOOP_BELOW_Y
    : FINAL_CONTINUOUS_LOOP_BELOW_Y
  const effectiveContinuousLoopBelowY = activeContinuousLoopBelowY + contentLiftTuner
  const copyValuesSnippet = [
    `const ${activeContinuousLoopBelowYName} = ${effectiveContinuousLoopBelowY}`,
    "",
    `const ${activeCopyPresetName}: HeroCopyOffsets = {`,
    `  tickerX: ${composedHeroOffsets.tickerX},`,
    `  tickerY: ${composedHeroOffsets.tickerY},`,
    `  titleX: ${composedHeroOffsets.titleX},`,
    `  titleY: ${composedHeroOffsets.titleY},`,
    `  ctaX: ${composedHeroOffsets.ctaX},`,
    `  ctaY: ${composedHeroOffsets.ctaY},`,
    "}",
  ].join("\n")

  const baseContentGroupMarginTop =
    activeContentLift > 0 ? -activeContentLift + activeHeroLayout.contentGroupY : activeHeroLayout.contentGroupY
  const contentGroupMarginTop = baseContentGroupMarginTop + effectiveContinuousLoopBelowY
  const heroVideoTransform =
    heroVideoLiftY !== 0 || heroVideoZoom !== 100
      ? {
          transform: `translateY(${heroVideoLiftY}px) scale(${heroVideoZoom / 100})`,
          transformOrigin: "center center",
        }
      : undefined

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <section className="relative w-full min-h-screen overflow-hidden">
          <div className="absolute inset-0 -z-10 pointer-events-none bg-black flex items-start justify-center">
            {isHeroVideoReady ? (
              <video
                id="hero-video"
                ref={heroVideoRef}
                className="h-full w-full object-cover object-center"
                style={heroVideoTransform}
                src="/hero-background.mp4?v=refresh7"
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
            <HeroSection offsets={composedHeroOffsets} bannerTextLiftY={activeHeroLayout.bannerTextY} />
          </div>
        </section>
        <div
          className="relative z-20 w-full bg-background border-t border-border divide-y divide-border"
          style={contentGroupMarginTop !== 0 ? { marginTop: contentGroupMarginTop } : undefined}
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
      {showLayoutTuner ? (
        <div className="fixed bottom-4 right-4 z-50 w-72 rounded-md border border-white/25 bg-black/70 p-3 text-white backdrop-blur-sm">
          <p className="text-xs font-semibold tracking-wide uppercase">Layout Tuner</p>
          <p className="mt-1 text-[11px] text-white/75">
            Use ?layoutTuner=1 (add &amp;restoreTuner=1 to load saved values)
          </p>
          <label className="mt-3 block text-xs">
            Continuous loop + below Y: {contentLiftTuner}px
            <input
              type="range"
              min={-900}
              max={900}
              value={contentLiftTuner}
              onChange={(event) => setContentLiftTuner(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="mt-3 block text-xs">
            Ticker row Y: {heroTickerLiftY}px
            <input
              type="range"
              min={-240}
              max={600}
              value={heroTickerLiftY}
              onChange={(event) => setHeroTickerLiftY(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="mt-3 block text-xs">
            Title row Y: {heroTitleLiftY}px
            <input
              type="range"
              min={-240}
              max={240}
              value={heroTitleLiftY}
              onChange={(event) => setHeroTitleLiftY(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="mt-3 block text-xs">
            Buttons row Y: {heroCtaLiftY}px
            <input
              type="range"
              min={-240}
              max={600}
              value={heroCtaLiftY}
              onChange={(event) => setHeroCtaLiftY(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="mt-3 block text-xs">
            Video Y: {heroVideoLiftY}px
            <input
              type="range"
              min={-320}
              max={320}
              value={heroVideoLiftY}
              onChange={(event) => setHeroVideoLiftY(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="mt-3 block text-xs">
            Video zoom: {heroVideoZoom}%
            <input
              type="range"
              min={50}
              max={200}
              value={heroVideoZoom}
              onChange={(event) => setHeroVideoZoom(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setHeroTickerLiftY(0)
                setHeroTitleLiftY(0)
                setHeroCtaLiftY(0)
              }}
              className="inline-flex h-8 items-center justify-center rounded border border-white/30 px-3 text-xs text-white hover:bg-white/10"
            >
              Reset Rows
            </button>
            <button
              type="button"
              onClick={() => {
                setContentLiftTuner(0)
                setHeroVideoLiftY(0)
                setHeroVideoZoom(100)
              }}
              className="inline-flex h-8 items-center justify-center rounded border border-white/30 px-3 text-xs text-white hover:bg-white/10"
            >
              Reset Layout
            </button>
          </div>
          <div className="mt-3 rounded border border-white/20 bg-black/35 p-2 font-mono text-[11px] leading-5 text-white/90">
            <p>{activeCopyPresetName}</p>
            <p>
              {activeContinuousLoopBelowYName}: {effectiveContinuousLoopBelowY}
            </p>
            <p>tickerX: {composedHeroOffsets.tickerX}</p>
            <p>tickerY: {composedHeroOffsets.tickerY}</p>
            <p>titleX: {composedHeroOffsets.titleX}</p>
            <p>titleY: {composedHeroOffsets.titleY}</p>
            <p>ctaX: {composedHeroOffsets.ctaX}</p>
            <p>ctaY: {composedHeroOffsets.ctaY}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (typeof navigator === "undefined" || !navigator.clipboard) return
              try {
                await navigator.clipboard.writeText(copyValuesSnippet)
                setDidCopyCopyValues(true)
                window.setTimeout(() => setDidCopyCopyValues(false), 1200)
              } catch {
                // Ignore clipboard write failures.
              }
            }}
            className="mt-2 inline-flex h-8 items-center justify-center rounded border border-white/30 px-3 text-xs text-white hover:bg-white/10"
          >
            {didCopyCopyValues ? "Copied Values" : "Copy Values"}
          </button>
        </div>
      ) : null}
    </>
  )
}
