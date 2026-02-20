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

const FINAL_HERO_COPY_OFFSETS: HeroCopyOffsets = {
  tickerX: 0,
  tickerY: 337,
  titleX: 0,
  titleY: 47,
  ctaX: 0,
  ctaY: 253,
}

const MOBILE_HERO_COPY_OFFSETS: HeroCopyOffsets = {
  tickerX: 0,
  tickerY: 150,
  titleX: 0,
  titleY: 0,
  ctaX: 0,
  ctaY: 82,
}

const FINAL_HERO_VIDEO_LAYOUT: HeroVideoLayout = {
  scale: 100,
  offsetX: 0,
  offsetY: -56,
  bottomCrop: 0,
}

const MOBILE_HERO_VIDEO_LAYOUT: HeroVideoLayout = {
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  bottomCrop: 0,
}

const FINAL_CONTENT_LIFT = 659
const FINAL_HERO_VIDEO_START_AT = 9
const MOBILE_HERO_VIDEO_START_AT = 0
const MOBILE_HERO_VIDEO_LOOP_END_AT = 8.8
const MOBILE_CONTENT_LIFT = 0

const HARD_CODED_HERO_LAYOUT = {
  bannerTextY: -65,
  buttonsY: -64,
  videoY: -84,
  videoBottomCrop: 0,
  contentGroupY: 199,
  videoOffsetX: 0,
  videoOffsetY: 0,
} as const

const MOBILE_HERO_LAYOUT = {
  bannerTextY: 0,
  buttonsY: 0,
  videoY: -228,
  videoBottomCrop: 231,
  contentGroupY: -537,
  videoOffsetX: 0,
  videoOffsetY: 0,
} as const

export default function HomeClient() {
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(false)
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
  const activeHeroVideoLayout = isMobileLayout ? MOBILE_HERO_VIDEO_LAYOUT : FINAL_HERO_VIDEO_LAYOUT
  const activeHeroLayout = isMobileLayout ? MOBILE_HERO_LAYOUT : HARD_CODED_HERO_LAYOUT
  const activeContentLift = isMobileLayout ? MOBILE_CONTENT_LIFT : FINAL_CONTENT_LIFT

  const defaultTickerY = activeHeroCopyOffsets.tickerY
  const composedHeroOffsets: HeroCopyOffsets = {
    ...activeHeroCopyOffsets,
    tickerY: defaultTickerY,
    ctaY: activeHeroCopyOffsets.ctaY + activeHeroLayout.buttonsY,
  }

  const heroVideoOffsetX = activeHeroVideoLayout.offsetX + activeHeroLayout.videoOffsetX
  const heroVideoOffsetY =
    activeHeroVideoLayout.offsetY + activeHeroLayout.videoOffsetY + activeHeroLayout.videoY
  const heroVideoScale = activeHeroVideoLayout.scale
  const heroVideoBottomCrop = Math.max(0, activeHeroVideoLayout.bottomCrop + activeHeroLayout.videoBottomCrop)
  const contentGroupMarginTop =
    activeContentLift > 0 ? -activeContentLift + activeHeroLayout.contentGroupY : activeHeroLayout.contentGroupY

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-[100svh] md:min-h-screen w-full">
        <section className="relative w-full min-h-[100svh] md:min-h-screen overflow-hidden">
          <div className="absolute inset-0 -z-10 pointer-events-none bg-black flex items-start justify-center">
            {isHeroVideoReady ? (
              <video
                id="hero-video"
                ref={heroVideoRef}
                className="h-full w-full object-contain object-center md:object-cover lg:min-h-[750px] lg:min-w-full"
                style={{
                  transform: `translate(${heroVideoOffsetX}px, ${heroVideoOffsetY}px) scale(${heroVideoScale / 100})`,
                  transformOrigin: "center center",
                  clipPath: `inset(0 0 ${heroVideoBottomCrop}px 0)`,
                  WebkitClipPath: `inset(0 0 ${heroVideoBottomCrop}px 0)`,
                }}
                src="/hero-background.mp4?v=refresh6"
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
    </>
  )
}
