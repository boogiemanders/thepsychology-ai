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
const FINAL_CONTINUOUS_LOOP_BELOW_Y = 658
const MOBILE_CONTINUOUS_LOOP_BELOW_Y = -17
const FINAL_HERO_TITLE_Y = 295
const FINAL_HERO_CTA_Y = 52
const FINAL_HERO_BANNER_Y = 45
const MOBILE_HERO_TITLE_Y = 178
const MOBILE_HERO_CTA_Y = -141
const MOBILE_HERO_BANNER_Y = -104
const HERO_OFFSET_REFERENCE_HEIGHT = 900
const DESKTOP_HERO_OFFSET_MAX_VIEWPORT_HEIGHT = 1231
const DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT = 840
const DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT = 612
const DESKTOP_HERO_OFFSET_FLOOR_VIEWPORT_HEIGHT = 400
const DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT = 912
const DESKTOP_HERO_TITLE_Y_AT_HIGH_HEIGHT_WIDE = 140
const DESKTOP_HERO_TITLE_Y_AT_HIGH_HEIGHT_NARROW = 196
const DESKTOP_HERO_CTA_Y_AT_HIGH_HEIGHT = -102
const DESKTOP_HERO_BANNER_Y_AT_HIGH_HEIGHT = -92
const DESKTOP_HERO_HIGH_WIDTH_THRESHOLD = 1280
const DESKTOP_HERO_TITLE_Y_AT_MID_HEIGHT = 105
const DESKTOP_HERO_CTA_Y_AT_MID_HEIGHT = -126
const DESKTOP_HERO_BANNER_Y_AT_MID_HEIGHT = -113
const DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT = 624
const DESKTOP_HERO_TITLE_Y_AT_LOW_HEIGHT = 45
const DESKTOP_HERO_CTA_Y_AT_LOW_HEIGHT = -99
const DESKTOP_HERO_BANNER_Y_AT_LOW_HEIGHT = -86
const DESKTOP_HERO_TITLE_Y_AT_MIN_HEIGHT = 78
const DESKTOP_HERO_CTA_Y_AT_MIN_HEIGHT = -97
const DESKTOP_HERO_BANNER_Y_AT_MIN_HEIGHT = -84
const DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT = 463
const DESKTOP_HERO_TITLE_Y_AT_SUB_HEIGHT = -17
const DESKTOP_HERO_CTA_Y_AT_SUB_HEIGHT = -2
const DESKTOP_HERO_BANNER_Y_AT_SUB_HEIGHT = -29
const DESKTOP_HERO_TITLE_Y_AT_FLOOR_HEIGHT = 25
const DESKTOP_HERO_CTA_Y_AT_FLOOR_HEIGHT = 7
const DESKTOP_HERO_BANNER_Y_AT_FLOOR_HEIGHT = -6
const CONTENT_LIFT_TUNER_STORAGE_KEY = "home-layout-tuner-content-lift-y"
const HERO_VIDEO_TUNER_STORAGE_KEY = "home-layout-tuner-video-lift-y"
const HERO_VIDEO_ZOOM_TUNER_STORAGE_KEY = "home-layout-tuner-video-zoom"
const HERO_TITLE_Y_STORAGE_KEY = "home-layout-tuner-hero-title-y"
const HERO_CTA_Y_STORAGE_KEY = "home-layout-tuner-hero-cta-y"
const HERO_BANNER_Y_STORAGE_KEY = "home-layout-tuner-hero-banner-y"
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const nearlyEqual = (a: number, b: number) => Math.abs(a - b) < 0.5
const getLayoutScopedStorageKey = (baseKey: string, isMobile: boolean) =>
  `${baseKey}-${isMobile ? "mobile" : "desktop"}`

const FINAL_CONTENT_LIFT = 659
const HERO_VIDEO_START_AT = 9
const HERO_VIDEO_DESKTOP_SRC = "/hero-background.mp4?v=refresh9"
const HERO_VIDEO_MOBILE_SRC = "/hero-backgroundmobile.mp4?v=refresh1"
const MOBILE_CONTENT_LIFT = 0
const DESKTOP_NAVBAR_FALLBACK_HEIGHT = 64
const MOBILE_NAVBAR_FALLBACK_HEIGHT = 60
const DESKTOP_NAVBAR_FALLBACK_VISUAL_OFFSET = 24
const MOBILE_NAVBAR_FALLBACK_VISUAL_OFFSET = 8
const interpolateYOffset = (
  viewportHeightValue: number,
  upperHeight: number,
  upperValue: number,
  lowerHeight: number,
  lowerValue: number,
) => {
  const progress = clamp((upperHeight - viewportHeightValue) / (upperHeight - lowerHeight), 0, 1)
  return Math.round(upperValue + (lowerValue - upperValue) * progress)
}

export default function HomeClient() {
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(false)
  const [showLayoutTuner, setShowLayoutTuner] = useState(false)
  const [isTunerCollapsed, setIsTunerCollapsed] = useState(false)
  const [didCopyCopyValues, setDidCopyCopyValues] = useState(false)
  const [contentLiftTuner, setContentLiftTuner] = useState(0)
  const [heroVideoLiftY, setHeroVideoLiftY] = useState(0)
  const [heroVideoZoom, setHeroVideoZoom] = useState(100)
  const [heroTitleY, setHeroTitleY] = useState(0)
  const [heroCTAY, setHeroCTAY] = useState(0)
  const [heroBannerY, setHeroBannerY] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(HERO_OFFSET_REFERENCE_HEIGHT)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [navbarBottom, setNavbarBottom] = useState(0)
  const [navbarHeight, setNavbarHeight] = useState(0)
  const [hasNavbarMetrics, setHasNavbarMetrics] = useState(false)
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
    if (!showLayoutTuner && isTunerCollapsed) {
      setIsTunerCollapsed(false)
    }
  }, [showLayoutTuner, isTunerCollapsed])

  useEffect(() => {
    if (typeof window === "undefined") return
    const updateSize = () => {
      setViewportHeight(window.innerHeight)
      setViewportWidth(window.innerWidth)
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateNavbarMetrics = () => {
      const navbar = document.querySelector<HTMLElement>('header[data-site-navbar="true"]')
      if (!navbar) return

      const rect = navbar.getBoundingClientRect()
      const nextBottom = Math.max(0, rect.bottom)
      const nextHeight = Math.max(0, rect.height)

      setNavbarBottom((prevBottom) => (nearlyEqual(prevBottom, nextBottom) ? prevBottom : nextBottom))
      setNavbarHeight((prevHeight) => (nearlyEqual(prevHeight, nextHeight) ? prevHeight : nextHeight))
      setHasNavbarMetrics(true)
    }

    updateNavbarMetrics()
    const rafId = window.requestAnimationFrame(updateNavbarMetrics)
    window.addEventListener("resize", updateNavbarMetrics)
    window.addEventListener("scroll", updateNavbarMetrics, { passive: true })

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("resize", updateNavbarMetrics)
      window.removeEventListener("scroll", updateNavbarMetrics)
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
      setHeroVideoLiftY(0)
      setHeroVideoZoom(100)
      setHeroTitleY(0)
      setHeroCTAY(0)
      setHeroBannerY(0)
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
    setHeroVideoLiftY(readStoredValue(HERO_VIDEO_TUNER_STORAGE_KEY, -320, 320))
    setHeroVideoZoom(readStoredValue(HERO_VIDEO_ZOOM_TUNER_STORAGE_KEY, 50, 200) || 100)
    setHeroTitleY(readStoredValue(HERO_TITLE_Y_STORAGE_KEY, -300, 300))
    setHeroCTAY(readStoredValue(HERO_CTA_Y_STORAGE_KEY, -300, 300))
    setHeroBannerY(readStoredValue(HERO_BANNER_Y_STORAGE_KEY, -300, 300))
  }, [isMobileLayout])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!showLayoutTuner) return

    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(CONTENT_LIFT_TUNER_STORAGE_KEY, isMobileLayout),
      String(contentLiftTuner),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_VIDEO_TUNER_STORAGE_KEY, isMobileLayout),
      String(heroVideoLiftY),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_VIDEO_ZOOM_TUNER_STORAGE_KEY, isMobileLayout),
      String(heroVideoZoom),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_TITLE_Y_STORAGE_KEY, isMobileLayout),
      String(heroTitleY),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_CTA_Y_STORAGE_KEY, isMobileLayout),
      String(heroCTAY),
    )
    window.sessionStorage.setItem(
      getLayoutScopedStorageKey(HERO_BANNER_Y_STORAGE_KEY, isMobileLayout),
      String(heroBannerY),
    )
  }, [showLayoutTuner, isMobileLayout, contentLiftTuner, heroVideoLiftY, heroVideoZoom, heroTitleY, heroCTAY, heroBannerY])

  useEffect(() => {
    if (!isHeroVideoReady) return
    const video = heroVideoRef.current
    if (!video) return

    const preferredStartAt = HERO_VIDEO_START_AT
    const preferredLoopEndAt = null

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

  const activeContentLift = isMobileLayout ? MOBILE_CONTENT_LIFT : FINAL_CONTENT_LIFT
  const activeContinuousLoopBelowY = isMobileLayout
    ? MOBILE_CONTINUOUS_LOOP_BELOW_Y
    : FINAL_CONTINUOUS_LOOP_BELOW_Y
  const effectiveContinuousLoopBelowY = activeContinuousLoopBelowY + contentLiftTuner

  const fallbackNavbarHeight = isMobileLayout ? MOBILE_NAVBAR_FALLBACK_HEIGHT : DESKTOP_NAVBAR_FALLBACK_HEIGHT
  const fallbackNavbarVisualOffset = isMobileLayout
    ? MOBILE_NAVBAR_FALLBACK_VISUAL_OFFSET
    : DESKTOP_NAVBAR_FALLBACK_VISUAL_OFFSET
  const effectiveNavbarHeight = hasNavbarMetrics ? navbarHeight : fallbackNavbarHeight
  const effectiveNavbarBottom = hasNavbarMetrics
    ? navbarBottom
    : fallbackNavbarHeight + fallbackNavbarVisualOffset
  const effectiveNavbarVisualOffset = Math.max(
    0,
    hasNavbarMetrics ? effectiveNavbarBottom - effectiveNavbarHeight : fallbackNavbarVisualOffset,
  )
  const heroAvailableHeight = Math.max(0, viewportHeight - effectiveNavbarBottom)
  const heroContentFrameHeight = Math.max(0, Math.min(820, viewportHeight) - effectiveNavbarBottom)
  const heroSectionStyle = {
    height: `${heroAvailableHeight}px`,
    marginTop: `${effectiveNavbarVisualOffset}px`,
  }

  const highTitleY = viewportWidth >= DESKTOP_HERO_HIGH_WIDTH_THRESHOLD
    ? DESKTOP_HERO_TITLE_Y_AT_HIGH_HEIGHT_WIDE
    : DESKTOP_HERO_TITLE_Y_AT_HIGH_HEIGHT_NARROW
  const desktopHeroTitleY = viewportHeight >= DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT
    ? interpolateYOffset(
        viewportHeight,
        DESKTOP_HERO_OFFSET_MAX_VIEWPORT_HEIGHT,
        FINAL_HERO_TITLE_Y,
        DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT,
        highTitleY,
      )
    : viewportHeight >= DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT
      ? interpolateYOffset(
          viewportHeight,
          DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT,
          highTitleY,
          DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT,
          DESKTOP_HERO_TITLE_Y_AT_MID_HEIGHT,
        )
      : viewportHeight >= DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT
        ? interpolateYOffset(
            viewportHeight,
            DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT,
            DESKTOP_HERO_TITLE_Y_AT_MID_HEIGHT,
            DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT,
            DESKTOP_HERO_TITLE_Y_AT_LOW_HEIGHT,
          )
        : viewportHeight >= DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT
          ? interpolateYOffset(
              viewportHeight,
              DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT,
              DESKTOP_HERO_TITLE_Y_AT_LOW_HEIGHT,
              DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT,
              DESKTOP_HERO_TITLE_Y_AT_MIN_HEIGHT,
            )
          : viewportHeight >= DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT
            ? interpolateYOffset(
                viewportHeight,
                DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT,
                DESKTOP_HERO_TITLE_Y_AT_MIN_HEIGHT,
                DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT,
                DESKTOP_HERO_TITLE_Y_AT_SUB_HEIGHT,
              )
            : interpolateYOffset(
                viewportHeight,
                DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT,
                DESKTOP_HERO_TITLE_Y_AT_SUB_HEIGHT,
                DESKTOP_HERO_OFFSET_FLOOR_VIEWPORT_HEIGHT,
                DESKTOP_HERO_TITLE_Y_AT_FLOOR_HEIGHT,
              )
  const desktopHeroCTAY = viewportHeight >= DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT
    ? interpolateYOffset(
        viewportHeight,
        DESKTOP_HERO_OFFSET_MAX_VIEWPORT_HEIGHT,
        FINAL_HERO_CTA_Y,
        DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT,
        DESKTOP_HERO_CTA_Y_AT_HIGH_HEIGHT,
      )
    : viewportHeight >= DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT
      ? interpolateYOffset(
          viewportHeight,
          DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT,
          DESKTOP_HERO_CTA_Y_AT_HIGH_HEIGHT,
          DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT,
          DESKTOP_HERO_CTA_Y_AT_MID_HEIGHT,
        )
      : viewportHeight >= DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT
        ? interpolateYOffset(
            viewportHeight,
            DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT,
            DESKTOP_HERO_CTA_Y_AT_MID_HEIGHT,
            DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT,
            DESKTOP_HERO_CTA_Y_AT_LOW_HEIGHT,
          )
        : viewportHeight >= DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT
          ? interpolateYOffset(
              viewportHeight,
              DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT,
              DESKTOP_HERO_CTA_Y_AT_LOW_HEIGHT,
              DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT,
              DESKTOP_HERO_CTA_Y_AT_MIN_HEIGHT,
            )
          : viewportHeight >= DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT
            ? interpolateYOffset(
                viewportHeight,
                DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT,
                DESKTOP_HERO_CTA_Y_AT_MIN_HEIGHT,
                DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT,
                DESKTOP_HERO_CTA_Y_AT_SUB_HEIGHT,
              )
            : interpolateYOffset(
                viewportHeight,
                DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT,
                DESKTOP_HERO_CTA_Y_AT_SUB_HEIGHT,
                DESKTOP_HERO_OFFSET_FLOOR_VIEWPORT_HEIGHT,
                DESKTOP_HERO_CTA_Y_AT_FLOOR_HEIGHT,
              )
  const desktopHeroBannerY = viewportHeight >= DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT
    ? interpolateYOffset(
        viewportHeight,
        DESKTOP_HERO_OFFSET_MAX_VIEWPORT_HEIGHT,
        FINAL_HERO_BANNER_Y,
        DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT,
        DESKTOP_HERO_BANNER_Y_AT_HIGH_HEIGHT,
      )
    : viewportHeight >= DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT
      ? interpolateYOffset(
          viewportHeight,
          DESKTOP_HERO_OFFSET_HIGH_VIEWPORT_HEIGHT,
          DESKTOP_HERO_BANNER_Y_AT_HIGH_HEIGHT,
          DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT,
          DESKTOP_HERO_BANNER_Y_AT_MID_HEIGHT,
        )
      : viewportHeight >= DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT
        ? interpolateYOffset(
            viewportHeight,
            DESKTOP_HERO_OFFSET_MID_VIEWPORT_HEIGHT,
            DESKTOP_HERO_BANNER_Y_AT_MID_HEIGHT,
            DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT,
            DESKTOP_HERO_BANNER_Y_AT_LOW_HEIGHT,
          )
        : viewportHeight >= DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT
          ? interpolateYOffset(
              viewportHeight,
              DESKTOP_HERO_OFFSET_LOW_VIEWPORT_HEIGHT,
              DESKTOP_HERO_BANNER_Y_AT_LOW_HEIGHT,
              DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT,
              DESKTOP_HERO_BANNER_Y_AT_MIN_HEIGHT,
            )
          : viewportHeight >= DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT
            ? interpolateYOffset(
                viewportHeight,
                DESKTOP_HERO_OFFSET_MIN_VIEWPORT_HEIGHT,
                DESKTOP_HERO_BANNER_Y_AT_MIN_HEIGHT,
                DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT,
                DESKTOP_HERO_BANNER_Y_AT_SUB_HEIGHT,
              )
            : interpolateYOffset(
                viewportHeight,
                DESKTOP_HERO_OFFSET_SUB_VIEWPORT_HEIGHT,
                DESKTOP_HERO_BANNER_Y_AT_SUB_HEIGHT,
                DESKTOP_HERO_OFFSET_FLOOR_VIEWPORT_HEIGHT,
                DESKTOP_HERO_BANNER_Y_AT_FLOOR_HEIGHT,
              )

  const heroOffsetScale = isMobileLayout
    ? Math.min(820, viewportHeight) / HERO_OFFSET_REFERENCE_HEIGHT
    : 1
  const rawTitleY = isMobileLayout ? MOBILE_HERO_TITLE_Y : desktopHeroTitleY
  const rawCTAY = isMobileLayout ? MOBILE_HERO_CTA_Y : desktopHeroCTAY
  const rawBannerY = isMobileLayout ? MOBILE_HERO_BANNER_Y : desktopHeroBannerY
  const activeHeroTitleY = Math.round(rawTitleY * heroOffsetScale)
  const activeHeroCTAY = Math.round(rawCTAY * heroOffsetScale)
  const activeHeroBannerY = Math.round(rawBannerY * heroOffsetScale)
  const effectiveHeroTitleY = activeHeroTitleY + heroTitleY
  const effectiveHeroCTAY = activeHeroCTAY + heroCTAY
  const effectiveHeroBannerY = activeHeroBannerY + heroBannerY

  const baseContentGroupMarginTop = activeContentLift > 0 ? -activeContentLift : 0
  const contentGroupMarginTop = baseContentGroupMarginTop + effectiveContinuousLoopBelowY
  const heroVideoTransform =
    heroVideoLiftY !== 0 || heroVideoZoom !== 100
      ? {
          transform: `translateY(${heroVideoLiftY}px) scale(${heroVideoZoom / 100})`,
          transformOrigin: "center center",
        }
      : undefined
  const heroVideoSrc = isMobileLayout ? HERO_VIDEO_MOBILE_SRC : HERO_VIDEO_DESKTOP_SRC
  const heroVideoClassName = isMobileLayout
    ? "h-full w-full object-cover object-top"
    : "h-full w-full object-cover object-center"

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <section className="relative w-full overflow-hidden" style={heroSectionStyle}>
          <div className="absolute inset-0 -z-10 pointer-events-none bg-black flex items-start justify-center">
            {isHeroVideoReady ? (
              <video
                key={heroVideoSrc}
                id="hero-video"
                ref={heroVideoRef}
                className={heroVideoClassName}
                style={heroVideoTransform}
                src={heroVideoSrc}
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
            <p className="absolute bottom-4 left-0 right-0 z-10 text-center text-xs md:text-sm tracking-wide text-white/50">
              Free during beta &middot; $0 while others charge $849+
            </p>
          </div>
          <div className="relative z-10">
            <HeroSection
              isMobileLayout={isMobileLayout}
              titleYOffset={effectiveHeroTitleY}
              ctaYOffset={effectiveHeroCTAY}
              bannerYOffset={effectiveHeroBannerY}
              contentFrameHeight={heroContentFrameHeight}
            />
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
        isTunerCollapsed ? (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              type="button"
              onClick={() => setIsTunerCollapsed(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/30 bg-black/70 px-3 text-xs text-white backdrop-blur-sm hover:bg-white/10"
            >
              Show Menu
            </button>
          </div>
        ) : (
          <div className="fixed bottom-4 right-4 z-50 w-72 rounded-md border border-white/25 bg-black/70 p-3 text-white backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide uppercase">Layout Tuner</p>
              <button
                type="button"
                onClick={() => setIsTunerCollapsed(true)}
                className="inline-flex h-8 items-center justify-center rounded border border-white/30 px-3 text-xs text-white hover:bg-white/10"
              >
                Hide Menu
              </button>
            </div>
            <p className="mt-1 text-[11px] font-mono text-yellow-300">
              {viewportWidth} × {viewportHeight}px &middot; scale {heroOffsetScale.toFixed(2)}
            </p>
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
            <label className="mt-3 block text-xs">
              Title Y: {heroTitleY}px
              <input
                type="range"
                min={-300}
                max={300}
                value={heroTitleY}
                onChange={(event) => setHeroTitleY(Number(event.target.value))}
                className="mt-1 w-full"
              />
            </label>
            <label className="mt-3 block text-xs">
              Start Free CTA Y: {heroCTAY}px
              <input
                type="range"
                min={-300}
                max={300}
                value={heroCTAY}
                onChange={(event) => setHeroCTAY(Number(event.target.value))}
                className="mt-1 w-full"
              />
            </label>
            <label className="mt-3 block text-xs">
              Banner text Y: {heroBannerY}px
              <input
                type="range"
                min={-300}
                max={300}
                value={heroBannerY}
                onChange={(event) => setHeroBannerY(Number(event.target.value))}
                className="mt-1 w-full"
              />
            </label>
            <div className="mt-3 rounded border border-white/15 bg-white/5 p-2 text-[11px] font-mono leading-relaxed space-y-1">
              <div>
                <span className="text-white/50">{isMobileLayout ? 'MOBILE' : 'FINAL'}_CONTINUOUS_LOOP_BELOW_Y: </span>
                <span className="text-green-400 font-bold">{effectiveContinuousLoopBelowY}px</span>
              </div>
              <div>
                <span className="text-white/50">{isMobileLayout ? 'MOBILE' : 'FINAL'}_HERO_TITLE_Y: </span>
                <span className="text-green-400 font-bold">{effectiveHeroTitleY}px</span>
              </div>
              <div>
                <span className="text-white/50">{isMobileLayout ? 'MOBILE' : 'FINAL'}_HERO_CTA_Y: </span>
                <span className="text-green-400 font-bold">{effectiveHeroCTAY}px</span>
              </div>
              <div>
                <span className="text-white/50">{isMobileLayout ? 'MOBILE' : 'FINAL'}_HERO_BANNER_Y: </span>
                <span className="text-green-400 font-bold">{effectiveHeroBannerY}px</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const prefix = isMobileLayout ? 'MOBILE' : 'FINAL'
                  navigator.clipboard.writeText(
                    [
                      `// ${viewportWidth} × ${viewportHeight}px (${isMobileLayout ? 'mobile' : 'desktop'})`,
                      `const ${prefix}_CONTINUOUS_LOOP_BELOW_Y = ${effectiveContinuousLoopBelowY}`,
                      `const ${prefix}_HERO_TITLE_Y = ${effectiveHeroTitleY}`,
                      `const ${prefix}_HERO_CTA_Y = ${effectiveHeroCTAY}`,
                      `const ${prefix}_HERO_BANNER_Y = ${effectiveHeroBannerY}`,
                    ].join('\n')
                  )
                  setDidCopyCopyValues(true)
                  setTimeout(() => setDidCopyCopyValues(false), 1500)
                }}
                className="inline-flex h-8 items-center justify-center rounded border border-white/30 px-3 text-xs text-white hover:bg-white/10"
              >
                {didCopyCopyValues ? 'Copied!' : 'Copy Values'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setContentLiftTuner(0)
                  setHeroVideoLiftY(0)
                  setHeroVideoZoom(100)
                  setHeroTitleY(0)
                  setHeroCTAY(0)
                  setHeroBannerY(0)
                }}
                className="inline-flex h-8 items-center justify-center rounded border border-white/30 px-3 text-xs text-white hover:bg-white/10"
              >
                Reset All
              </button>
            </div>
          </div>
        )
      ) : null}
    </>
  )
}
