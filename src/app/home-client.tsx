"use client"

import { useEffect, useRef, useState } from "react"
import { siteConfig } from "@/lib/config"
import { CompanyShowcase } from "@/components/sections/company-showcase"
import { FAQSection } from "@/components/sections/faq-section"
// import { FeatureSection } from "@/components/sections/feature-section"
import { FooterSection } from "@/components/sections/footer-section"
import { HeroSection } from "@/components/sections/hero-section"
import { OrbitingLoopSection } from "@/components/sections/orbiting-loop-section"
import { BentoSection } from "@/components/sections/bento-section"
import { PricingSection } from "@/components/sections/pricing-section"
// import { SignupSection } from "@/components/sections/signup-section"
import { TestimonialSection } from "@/components/sections/testimonial-section"
import { MiniPricingBar } from "@/components/mini-pricing-bar"

export default function HomeClient() {
  const [showMiniBar, setShowMiniBar] = useState(false)
  const [activeTier, setActiveTier] = useState(() => siteConfig.pricing.pricingItems[0]?.name ?? "")
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false)
  const pricingRef = useRef<HTMLElement | null>(null)
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
    const hero = document.getElementById("hero")
    const pricing = document.getElementById("get-started")
    if (pricing) {
      pricingRef.current = pricing as HTMLElement
    }

    if (!hero || !pricing) return

    const handleScroll = () => {
      const heroRect = hero.getBoundingClientRect()
      const pricingRect = pricing.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight

      const pastHero = heroRect.bottom <= 0
      const pricingVisible =
        pricingRect.top <= viewportHeight * 0.65 && pricingRect.bottom >= viewportHeight * 0.35

      setShowMiniBar(pastHero && !pricingVisible)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  useEffect(() => {
    setIsHeroVideoReady(true)
  }, [])

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

  const handleMiniTierClick = (tierName: string) => {
    setActiveTier(tierName)
    const pricing = pricingRef.current ?? document.getElementById("get-started")
    if (!pricing) return

    pricing.scrollIntoView({ behavior: "smooth", block: "center" })
    window.setTimeout(() => {
      pricing.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 220)

    if (!("CustomEvent" in window)) return
    const event = new CustomEvent("mini-pricing-select", { detail: { tierName } })
    window.dispatchEvent(event)
  }

  return (
    <>
      <main
        className={`flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full ${
          showMiniBar ? "md:pb-44" : ""
        }`}
      >
        <section className="relative w-full overflow-hidden">
          <div className="absolute inset-0 -z-10 pointer-events-none bg-black flex items-start justify-center">
            {isHeroVideoReady ? (
              <video
                id="hero-video"
                ref={heroVideoRef}
                className="w-full h-auto object-contain object-top lg:h-full lg:min-h-[750px] lg:w-full lg:min-w-full lg:object-cover lg:object-center"
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
            <HeroSection />
            <CompanyShowcase />
          </div>
        </section>
        <OrbitingLoopSection />
        <BentoSection />
        <TestimonialSection />
        {/* <FeatureSection /> */}
        {/* <GrowthSection /> */}
        <PricingSection activeTier={activeTier} onActiveTierChange={setActiveTier} />
        {/* <SignupSection /> */}
        <FAQSection />
        {/* <CTASection /> */}
        <FooterSection />
      </main>
      <MiniPricingBar show={showMiniBar} activeTier={activeTier} onTierClick={handleMiniTierClick} />
    </>
  )
}
