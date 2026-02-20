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

const FINAL_HERO_COPY_OFFSETS: HeroCopyOffsets = {
  tickerX: 0,
  tickerY: 337,
  titleX: 0,
  titleY: 47,
  ctaX: 0,
  ctaY: 253,
}

const FINAL_HERO_VIDEO_LAYOUT: HeroVideoLayout = {
  scale: 100,
  offsetX: 0,
  offsetY: -56,
  bottomCrop: 0,
}

const FINAL_CONTENT_LIFT = 659
const FINAL_HERO_VIDEO_START_AT = 9

const HARD_CODED_HERO_LAYOUT = {
  bannerTextY: -65,
  buttonsY: -64,
  videoY: -84,
  videoBottomCrop: 0,
  contentGroupY: 199,
  videoOffsetX: 0,
  videoOffsetY: 0,
} as const

export default function HomeClient() {
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false)
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
    if (!isHeroVideoReady) return
    const video = heroVideoRef.current
    if (!video) return

    const seekToPreferredStart = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      const maxStart = duration > 0 ? Math.max(0, duration - 0.1) : 0
      const target = Math.max(0, Math.min(FINAL_HERO_VIDEO_START_AT, maxStart))
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

  const composedHeroOffsets: HeroCopyOffsets = {
    ...FINAL_HERO_COPY_OFFSETS,
    ctaY: FINAL_HERO_COPY_OFFSETS.ctaY + HARD_CODED_HERO_LAYOUT.buttonsY,
  }

  const heroVideoOffsetX = FINAL_HERO_VIDEO_LAYOUT.offsetX + HARD_CODED_HERO_LAYOUT.videoOffsetX
  const heroVideoOffsetY =
    FINAL_HERO_VIDEO_LAYOUT.offsetY + HARD_CODED_HERO_LAYOUT.videoOffsetY + HARD_CODED_HERO_LAYOUT.videoY
  const heroVideoBottomCrop = Math.max(0, FINAL_HERO_VIDEO_LAYOUT.bottomCrop + HARD_CODED_HERO_LAYOUT.videoBottomCrop)
  const contentGroupMarginTop =
    FINAL_CONTENT_LIFT > 0 ? -FINAL_CONTENT_LIFT + HARD_CODED_HERO_LAYOUT.contentGroupY : HARD_CODED_HERO_LAYOUT.contentGroupY

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
                  transform: `translate(${heroVideoOffsetX}px, ${heroVideoOffsetY}px) scale(${FINAL_HERO_VIDEO_LAYOUT.scale / 100})`,
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
            <HeroSection offsets={composedHeroOffsets} bannerTextLiftY={HARD_CODED_HERO_LAYOUT.bannerTextY} />
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
